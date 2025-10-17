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
@login_required

def inventory_view(request):
    items = Item.objects.all().prefetch_related('serial_numbers')
    return render(request, 'inventory/inventory.html', {'items': items})


@login_required
def item_detail(request, item_id):
    item = get_object_or_404(Item, id=item_id)
    return render(request, 'inventory/item.html', {'item': item})



@login_required
@transaction.atomic
def add_item(request):
    if request.method == 'POST':
        try:
            # === Get form data ===
            item_name = request.POST.get('item')
            description = request.POST.get('description')
            total_stock = int(request.POST.get('total_stock', 0))
            quantity = int(request.POST.get('quantity', 0))
            allocated_quantity = int(request.POST.get('allocated_quantity', 0))
            unit_of_quantity = request.POST.get('unit_of_quantity')
            part_no = request.POST.get('part_no', '').strip()
            serial_numbers_raw = request.POST.get('serial_numbers', '')
            image = request.FILES.get('image')
            # Parse serial numbers (may be empty)
            serial_numbers = [s.strip() for s in serial_numbers_raw.split(',') if s.strip()]

            # === Create Item ===
            item = Item.objects.create(
                item_name=item_name,
                description=description,
                total_stock=total_stock,
                quantity=quantity,
                allocated_quantity=allocated_quantity,
                unit_of_quantity=unit_of_quantity,
                part_no=part_no if part_no else None,
                image=image,
                user=request.user   
            )

            # === Create ItemUpdate (initial IN transaction) ===
            ItemUpdate.objects.create(
                item=item,
                transaction_type='IN',
                quantity=quantity,
                serial_numbers=serial_numbers if serial_numbers else None,
                location='Initial Import',
                remarks='Initial stock added via Add Item form',
                user=request.user
            )

            messages.success(request, f"✅ Item '{item_name}' added successfully!")
            return redirect('inventory')

        except Exception as e:
            messages.error(request, f"❌ Failed to add item: {str(e)}")
            return redirect('add_item')

    return render(request, 'inventory/add_item.html')







@login_required
def updateitem_view(request, item_id):
    item = get_object_or_404(Item, pk=item_id)

    if request.method == 'POST':
        location = request.POST.get('location', '').strip()
        part_no = request.POST.get('part_no', '').strip()
        remarks = request.POST.get('remarks', '').strip()
        in_count = request.POST.get('in', '').strip()
        out_count = request.POST.get('out', '').strip()
        po_supplier = request.POST.get('po_supplier', '').strip()
        po_client = request.POST.get('po_client', '').strip()
        dr_no = request.POST.get('dr_no', '').strip()
        serial_numbers_raw = request.POST.get('serial_numbers', '')
        serial_numbers = [s.strip() for s in serial_numbers_raw.split(',') if s.strip()]

        in_count = int(in_count) if in_count.isdigit() else 0
        out_count = int(out_count) if out_count.isdigit() else 0

        # Create a new ItemUpdate record (transaction)
        transaction_type = 'IN' if in_count > 0 else 'OUT' if out_count > 0 else None
        quantity = in_count if in_count > 0 else out_count

        if transaction_type:
            ItemUpdate.objects.create(
                item=item,
                transaction_type=transaction_type,
                quantity=quantity,
                serial_numbers=serial_numbers if serial_numbers else None,
                location=location,
                po_from_supplier=po_supplier if transaction_type == 'IN' else '',
                po_to_client=po_client if transaction_type == 'OUT' else '',
                dr_no=dr_no if transaction_type == 'OUT' else '',
                remarks=remarks,
                user=request.user,
            )

        # Update main item info (if any metadata changed)
        item.part_no = part_no
        item.date_last_modified = timezone.now()
        item.user = request.user
        item.save()

        return redirect('inventory')

    # Prefill serial numbers as a comma-separated list
    existing_serials = ItemSerial.objects.filter(item=item).values_list('serial_no', flat=True)
    item.serial_no = ', '.join(existing_serials)

    # Create temporary properties for template display
    item.image_url = item.image.url if item.image else ''
    item.updated_by_user = item.user.username if item.user else request.user.username
    item.name = item.item_name
    item.date = timezone.now().date()  # Today's date

    existing_serials = ItemSerial.objects.filter(item=item).values_list('serial_no', flat=True)
    available_serials = list(ItemSerial.objects.filter(item=item, is_available=True).values_list('serial_no', flat=True))

    context = {
        'item': item,
        'available_serials': json.dumps(available_serials),  # for OUT mode
    }
    return render(request, 'inventory/update_item.html', context)




@login_required
@require_POST
def delete_item(request, item_id):
    try:
        item = get_object_or_404(Item, id=item_id)
        item.delete()
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})