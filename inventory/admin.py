from django.contrib import admin

from .models import Item, ItemSerial, ItemUpdate


class ItemSerialInline(admin.TabularInline):
    """
    Inline admin configuration for ItemSerial.

    Displays serial numbers associated with an Item in tabular format
    within the Item admin detail view.

    Attributes:
        model (Model): The model being displayed inline.
        extra (int): Number of empty forms to display by default.
        fields (tuple): Fields displayed in the inline table.
        readonly_fields (tuple): Fields that cannot be edited.
        can_delete (bool): Whether serials can be deleted from the inline.
    """

    model = ItemSerial
    extra = 0
    fields = ("serial_no", "is_available")
    readonly_fields = ("is_available",)
    can_delete = False


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    """
    Admin configuration for the Item model.

    Provides inline access to related serial numbers,
    and displays key fields in the list view for easier inventory management.

    Attributes:
        list_display (tuple): Columns shown in the list view.
        search_fields (tuple): Fields searchable in the admin.
        list_filter (tuple): Sidebar filters available in the list view.
        inlines (list): Inline models related to Item.
        readonly_fields (tuple): Fields that cannot be modified.
        ordering (tuple): Default ordering of items in the admin.
    """

    list_display = (
        "item_name",
        "total_stock",
        "allocated_quantity",
        "unit_of_quantity",
        "part_no",
        "date_last_modified",
    )
    search_fields = ("item_name", "part_no", "id")
    list_filter = ("unit_of_quantity",)
    inlines = [ItemSerialInline]
    readonly_fields = ("date_last_modified",)
    ordering = ("item_name",)


# ItemUpdate admin view (transactions)
@admin.register(ItemUpdate)
class ItemUpdateAdmin(admin.ModelAdmin):
    """
    Admin configuration for the ItemUpdate model.

    Displays transaction history such as stock-ins, stock-outs,
    and allocations, with filtering and search options for ease of tracking.

    Attributes:
        list_display (tuple): Columns shown in the list view.
        list_filter (tuple): Sidebar filters for transaction type and date.
        search_fields (tuple): Fields searchable in the admin.
        readonly_fields (tuple): Fields that cannot be modified.
        ordering (tuple): Default sorting order for entries.
    """

    list_display = ("item", "transaction_type", "quantity", "date", "user")
    list_filter = ("transaction_type", "date")
    search_fields = (
        "item__item_name",
        "location",
        "remarks",
        "po_supplier",
        "po_client",
        "dr_no",
    )
    readonly_fields = ("date",)
    ordering = ("-date",)
