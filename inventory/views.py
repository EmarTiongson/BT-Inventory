from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.db import transaction
from .models import Item, ItemUpdate, ItemSerial
from accounts.models import CustomUser 
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json
import traceback

@login_required
def inventory_view(request):
    items = (
        Item.objects.all()
        .prefetch_related('serial_numbers')
        .order_by('-date_last_modified')  # 🔥 Sort by latest modified first
    )
    return render(request, 'inventory/inventory.html', {'items': items})


@login_required
def item_history(request, item_id):
    from django.shortcuts import get_object_or_404

    item = get_object_or_404(Item, id=item_id)
    updates = item.updates.all().order_by('-date')  # newest first

    return render(request, 'inventory/item_history.html', {
        'item': item,
        'updates': updates,
    })


from django.db import transaction, IntegrityError
from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .models import Item, ItemSerial, ItemUpdate
import traceback


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
                user=request.user
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
                updated_by_user=request.user.username
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

    return render(request, 'inventory/add_item.html')






@login_required
@transaction.atomic
def updateitem_view(request, item_id):
    item = get_object_or_404(Item, id=item_id)

    available_serials = list(
        item.serial_numbers.filter(is_available=True).values_list('serial_no', flat=True)
    ) if hasattr(item, 'serial_numbers') else []

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

            # Validation
            if in_value > 0 and out_value > 0:
                messages.error(request, "❌ You can only enter IN or OUT, not both.")
                return redirect('update_item', item_id=item.id)

            if in_value == 0 and out_value == 0:
                messages.error(request, "❌ Please enter a value in either IN or OUT.")
                return redirect('update_item', item_id=item.id)

            # Determine transaction type and quantity
            if in_value > 0:
                transaction_type = 'IN'
                quantity = in_value
            else:  # out_value > 0
                transaction_type = 'OUT'
                quantity = out_value
                
                # Validation for OUT transactions
                if out_value > item.total_stock:
                    messages.error(request, f"❌ Not enough stock. Available: {item.total_stock}")
                    return redirect('update_item', item_id=item.id)

            # ✅ Create the ItemUpdate - let the model's save() method handle all stock calculations
            ItemUpdate.objects.create(
                item=item,
                transaction_type=transaction_type,
                quantity=quantity,
                serial_numbers=serial_numbers if serial_numbers else None,
                location=location if location else None,
                remarks=remarks if remarks else None,
                dr_no=dr_no if dr_no else None,
                po_supplier=po_from_supplier if po_from_supplier else None,
                po_client=po_to_client if po_to_client else None,
                user=request.user,
                updated_by_user=request.user.username,
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
    })


@login_required
@require_POST
def delete_item(request, item_id):
    try:
        item = get_object_or_404(Item, id=item_id)
        item.delete()
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})