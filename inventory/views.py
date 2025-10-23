from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import transaction, IntegrityError
from .models import Item, ItemUpdate, ItemSerial, TransactionHistory
from accounts.models import CustomUser 
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json
import traceback
from datetime import datetime, timedelta
from django.db.models import Prefetch
from django.contrib.auth import authenticate

@login_required
def inventory_view(request):
    # Prefetch only the most recent update for each item, plus serial numbers
    latest_updates = Prefetch(
        'updates',
        queryset=ItemUpdate.objects.select_related('user').order_by('-date'),
        to_attr='prefetched_updates'
    )

    items = (
        Item.objects.filter(is_deleted=False)
        .select_related('user')
        .prefetch_related('serial_numbers', latest_updates)
        .order_by('-date_last_modified')  # show most recently changed first
    )

    return render(request, 'inventory/inventory.html', {'items': items})


@login_required
def item_history(request, item_id):
    from django.shortcuts import get_object_or_404

    item = get_object_or_404(Item, id=item_id)
    updates = item.updates.all().order_by('-date')  # newest first

    # ✅ Ensure serial_numbers are always a list (safe for template rendering)
    for update in updates:
        if isinstance(update.serial_numbers, str):
            try:
                import json
                update.serial_numbers = json.loads(update.serial_numbers)
            except json.JSONDecodeError:
                update.serial_numbers = [s.strip() for s in update.serial_numbers.split(',') if s.strip()]
        elif update.serial_numbers is None:
            update.serial_numbers = []
        elif not isinstance(update.serial_numbers, list):
            update.serial_numbers = list(update.serial_numbers)

    return render(request, 'inventory/item_history.html', {
        'item': item,
        'updates': updates,
    })


@login_required
@transaction.atomic
def add_item(request):
    if request.method == 'POST':
        try:
            # === Extract form data ===
            item_name = request.POST.get('item', '').strip()
            description = request.POST.get('description', '').strip()
            total_stock_raw = request.POST.get('total_stock', '').strip()
            total_stock = int(total_stock_raw) if total_stock_raw.isdigit() else 0

            allocated_raw = request.POST.get('allocated_quantity', '').strip()
            allocated_quantity = int(allocated_raw) if allocated_raw.isdigit() else 0

            unit_of_quantity = request.POST.get('unit_of_quantity', '').strip() or 'pcs'
            part_no = request.POST.get('part_no', '').strip() or None
            image = request.FILES.get('image')

             # ✅ Parse user-supplied date
            date_input = request.POST.get('date_added', '').strip()
            if date_input:
                try:
                    # Parse and make timezone-aware
                    date_added = timezone.make_aware(datetime.strptime(date_input, "%Y-%m-%d"))
                except ValueError:
                    date_added = timezone.now()
            else:
                date_added = timezone.now()

            # === Parse serial numbers safely ===
            serial_numbers_raw = request.POST.get('serial_numbers', '') or ''
            serial_numbers = [s.strip() for s in serial_numbers_raw.split(',') if s.strip()]
            serial_numbers = list(dict.fromkeys(serial_numbers))  # ✅ remove duplicates, preserve order

            # === Validation ===
            if not item_name or not description:
                messages.error(request, "⚠️ Please fill in all required fields.")
                return redirect('add_item')

            # === Create Item ===
            item = Item.objects.create(
                item_name=item_name,
                description=description,
                total_stock=0,
                allocated_quantity=allocated_quantity,
                unit_of_quantity=unit_of_quantity,
                part_no=part_no,
                image=image,
                user=request.user,
                date_last_modified=date_added,
            )

            # === Create Serial Numbers (if any) ===
            created_sn = 0
            for sn in serial_numbers:
                try:
                    ItemSerial.objects.create(item=item, serial_no=sn, is_available=True)
                    created_sn += 1
                except IntegrityError:
                    continue  # skip duplicates silently

            # === Log in ItemUpdate (Initial Import) ===
         # When adding new item
            initial_quantity = total_stock  # total stock entered in the form
            ItemUpdate.objects.create(
                item=item,
                transaction_type='IN',
                quantity=initial_quantity,
                serial_numbers=serial_numbers if serial_numbers else None,
                location='Initial Import',
                remarks='Initial item creation',
                user=request.user,
                updated_by_user=request.user.username,
                date=date_added 
            )

            msg = f"✅ Item '{item_name}' added successfully!"
            if created_sn:
                msg += f" ({created_sn} serials added)"
            messages.success(request, msg)
            return redirect('inventory')

        except Exception as e:
            traceback.print_exc()
            messages.error(request, f"❌ Failed to add item: {str(e)}")
            return redirect('add_item')

    return render(request, 'inventory/add_item.html', {'today': timezone.now()})


@login_required
@transaction.atomic
def updateitem_view(request, item_id):
    item = get_object_or_404(Item, id=item_id)

    available_serials = list(
        item.serial_numbers.filter(is_available=True).values_list('serial_no', flat=True)
    ) if hasattr(item, 'serial_numbers') else []

    # Helper: recompute running stock
    def recalculate_item_stock(item):
        total = 0
        updates = item.updates.order_by('date')  # chronological order
        for update in updates:
            if update.transaction_type == 'IN':
                total += update.quantity
            elif update.transaction_type == 'OUT':
                total -= update.quantity
            total = max(total, 0)
            update.stock_after_transaction = total
            update.save(update_fields=['stock_after_transaction'])
        item.total_stock = total
        item.save(update_fields=['total_stock'])
        return total

    if request.method == 'POST':
        try:
            in_value = int(request.POST.get('in', 0) or 0)
            out_value = int(request.POST.get('out', 0) or 0)
            location = request.POST.get('location', '').strip()
            remarks = request.POST.get('remarks', '').strip()
            dr_no = request.POST.get('dr_no', '').strip()
            po_from_supplier = request.POST.get('po_supplier', '').strip()
            po_to_client = request.POST.get('po_client', '').strip()
            serial_numbers_raw = request.POST.get('serial_numbers', '')
            serial_numbers = [s.strip() for s in serial_numbers_raw.split(',') if s.strip()]

            # Parse manual date (no time input)
            manual_date_str = request.POST.get('date_added', '').strip()
            if manual_date_str:
                manual_date = datetime.strptime(manual_date_str, "%Y-%m-%d").date()
                current_time = timezone.localtime().time()
                combined_datetime = timezone.make_aware(
                    datetime.combine(manual_date, current_time),
                    timezone.get_current_timezone()
                )
            else:
                combined_datetime = timezone.now()

            # ---- Validation ----
            if in_value > 0 and out_value > 0:
                messages.error(request, "❌ You can only enter IN or OUT, not both.")
                return redirect('update_item', item_id=item.id)

            if in_value == 0 and out_value == 0:
                messages.error(request, "❌ Please enter a value in either IN or OUT.")
                return redirect('update_item', item_id=item.id)

            # Limit date range: allow only within 5 days from today
            today = timezone.localdate()
            if combined_datetime.date() < today - timedelta(days=5) or combined_datetime.date() > today:
                messages.error(request, "⚠️ You can only input transactions within the last 5 days.")
                return redirect('update_item', item_id=item.id)


             # Determine transaction type and quantity
            if in_value > 0:
                transaction_type = 'IN'
                quantity = in_value
            else:
                transaction_type = 'OUT'
                quantity = out_value
                if quantity > item.total_stock:
                    messages.error(request, f"❌ Not enough stock. Available: {item.total_stock}")
                    return redirect('update_item', item_id=item.id)

             # ✅ Store old stock before update (for logging)
            old_stock = item.total_stock

             # Create the update
            new_update = ItemUpdate.objects.create(
                item=item,
                transaction_type=transaction_type,
                quantity=quantity,
                date=combined_datetime,
                serial_numbers=serial_numbers if serial_numbers else None,
                location=location or None,
                remarks=remarks or None,
                dr_no=dr_no or None,
                po_supplier=po_from_supplier or None,
                po_client=po_to_client or None,
                user=request.user,
                updated_by_user=request.user.username,
            )

            
            # Recalculate stock for all transactions (handles backdated correctly)
            new_total = recalculate_item_stock(item)


               # ✅ Create transaction log
            TransactionHistory.objects.create(
                item=item,
                user=request.user,
                action_type=transaction_type.lower(),
                quantity=quantity,
                previous_stock=old_stock,
                new_stock=new_total,
                remarks=f"Manual date: {combined_datetime.date()} | {remarks or 'No remarks.'}",
            )

            messages.success(request, f"✅ Successfully updated '{item.item_name}' ({transaction_type})!")
            return redirect('inventory')

        except Exception as e:
            import traceback
            traceback.print_exc()
            messages.error(request, f"❌ Error: {str(e)}")
            return redirect('update_item', item_id=item.id)

    return render(request, 'inventory/update_item.html', {
        'item': item,
        'available_serials': json.dumps(available_serials),
        'today': timezone.localdate(),
    })



@login_required
@user_passes_test(lambda u: u.role == 'superadmin')  # Restrict to superadmins
def delete_item(request, item_id):
    item = get_object_or_404(Item, id=item_id)

    if request.method == "POST":
        password = request.POST.get("password")
        user = authenticate(username=request.user.username, password=password)

        if user is not None:
            item.is_deleted = True
            item.save(update_fields=['is_deleted'])
            messages.success(request, f"✅ '{item.item_name}' was deleted successfully.")
            return redirect('inventory')
        else:
            messages.error(request, "❌ Incorrect password. Deletion cancelled.")
            return redirect('inventory')

    messages.error(request, "Invalid request method.")
    return redirect('inventory')



@login_required
@transaction.atomic
def undo_transaction(request, update_id):
    item_update = get_object_or_404(ItemUpdate, id=update_id)
    item = item_update.item

    if request.method == "POST":
        try:
            old_stock = item.total_stock

            # Mark transaction as undone
            item_update.undone = True
            item_update.save(update_fields=['undone'])

            # Recalculate stock ignoring undone updates
            total_stock = 0
            updates = item.updates.filter(undone=False).order_by('date')
            for update in updates:
                if update.transaction_type == 'IN':
                    total_stock += update.quantity
                elif update.transaction_type == 'OUT':
                    total_stock -= update.quantity
                total_stock = max(total_stock, 0)
                update.stock_after_transaction = total_stock
                update.save(update_fields=['stock_after_transaction'])

            item.total_stock = total_stock
            item.save(update_fields=['total_stock'])

            # Log undo
            TransactionHistory.objects.create(
                item=item,
                user=request.user,
                action_type='undo',
                quantity=item_update.quantity,
                previous_stock=old_stock,
                new_stock=total_stock,
                remarks=f"Undo of {item_update.transaction_type} from {item_update.date.date()}"
            )

            messages.success(request, f"✅ Transaction undone for '{item.item_name}'!")
            return redirect('item_history', item_id=item.id)

        except Exception as e:
            traceback.print_exc()
            messages.error(request, f"❌ Error undoing transaction: {str(e)}")
            return redirect('item_history', item_id=item.id)

    return redirect('item_history', item_id=item.id)




@login_required
def transaction_history_view(request, item_id):
    item = get_object_or_404(Item, id=item_id)
    history = item.transactions.order_by('-timestamp')  # Use your related_name
    return render(request, 'inventory/item_history.html', {
        'item': item,
        'history': history,
    })