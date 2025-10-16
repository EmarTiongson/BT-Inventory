from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import Item

@login_required

def inventory_view(request):
    items = Item.objects.all().prefetch_related('serial_numbers')
    return render(request, 'inventory/inventory.html', {'items': items})


@login_required
def item_detail(request, item_id):
    item = get_object_or_404(Item, id=item_id)
    return render(request, 'inventory/item.html', {'item': item})



@login_required
def additem_view(request):
    return render(request, 'inventory/add_item.html')

@login_required
def updateitem_view(request, item_id):
    item = get_object_or_404(Item, id=item_id)
    return render(request, 'inventory/update_item.html', {'item': item})