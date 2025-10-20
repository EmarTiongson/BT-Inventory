from django.contrib import admin
from .models import Item, ItemSerial, ItemUpdate


# Inline display of serials inside an Item
class ItemSerialInline(admin.TabularInline):
    model = ItemSerial
    extra = 0  # no blank rows by default
    fields = ('serial_no', 'is_available')
    readonly_fields = ('is_available',)
    can_delete = False


# Item admin view
@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = (
        'item_name',
        'total_stock',
        'allocated_quantity',
        'unit_of_quantity',
        'part_no',
        'date_last_modified',
    )
    search_fields = ('item_name', 'part_no', 'id')
    list_filter = ('unit_of_quantity',)
    inlines = [ItemSerialInline]
    readonly_fields = ('date_last_modified',)
    ordering = ('item_name',)


# ItemUpdate admin view (transactions)
@admin.register(ItemUpdate)
class ItemUpdateAdmin(admin.ModelAdmin):
    list_display = ('item', 'transaction_type', 'quantity', 'date', 'user')
    list_filter = ('transaction_type', 'date')
    search_fields = ('item__item_name', 'location', 'remarks', 'po_supplier', 'po_client', 'dr_no')
    readonly_fields = ('date',)
    ordering = ('-date',)
