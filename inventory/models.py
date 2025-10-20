from django.db import models
from django.utils import timezone
from accounts.models import CustomUser


class Item(models.Model):
    UNIT_CHOICES = [
        ('pcs', 'Pieces'),
        ('rolls', 'Rolls'),
        ('meters', 'Meters'),
    ]

    item_name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='item_images/', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    total_stock = models.IntegerField(default=0)
    allocated_quantity = models.IntegerField(default=0, blank=True, null=True)
    unit_of_quantity = models.CharField(max_length=20, choices=UNIT_CHOICES, default='pcs')
    part_no = models.CharField(max_length=100, blank=True, null=True)
    date_last_modified = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.item_name} ({self.id})"

    @property
    def available_serials(self):
        """Return all serial numbers currently available for this item."""
        return self.serial_numbers.filter(is_available=True).values_list('serial_no', flat=True)


class ItemSerial(models.Model):
    """Represents each individual serial number tied to an item."""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='serial_numbers')
    serial_no = models.CharField(max_length=100)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        status = "Available" if self.is_available else "Out"
        return f"{self.serial_no} ({status})"

    class Meta:
        unique_together = ('item', 'serial_no')


class ItemUpdate(models.Model):
    TRANSACTION_TYPE = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
    ]

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='updates')
    date = models.DateTimeField(auto_now_add=True)
    transaction_type = models.CharField(max_length=3, choices=TRANSACTION_TYPE)
    quantity = models.PositiveIntegerField(default=0)  # amount of items in/out

    serial_numbers = models.JSONField(blank=True, null=True, help_text="List of serial numbers affected")

    location = models.CharField(max_length=200, blank=True, null=True)
    po_supplier = models.CharField("P.O From Supplier", max_length=100, blank=True, null=True)
    po_client = models.CharField("P.O To Client", max_length=100, blank=True, null=True)
    dr_no = models.CharField("DR No.", max_length=100, blank=True, null=True)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='item_updates')
    updated_by_user = models.CharField(max_length=150, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

    stock_after_transaction = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        direction = "➕" if self.transaction_type == "IN" else "➖"
        return f"{direction} {self.item.item_name} ({self.quantity})"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)

        if not is_new:
            return

        if self.transaction_type == 'IN':
            for sn in (self.serial_numbers or []):
                if not sn:
                    continue
                ItemSerial.objects.get_or_create(
                    item=self.item,
                    serial_no=sn,
                    defaults={'is_available': True}
                )
            # ✅ Update total stock
            self.item.total_stock += self.quantity

        elif self.transaction_type == 'OUT':
            for sn in (self.serial_numbers or []):
                try:
                    serial = ItemSerial.objects.get(item=self.item, serial_no=sn, is_available=True)
                    serial.is_available = False
                    serial.save()
                except ItemSerial.DoesNotExist:
                    pass
            self.item.allocated_quantity += self.quantity
            self.item.total_stock = max(self.item.total_stock - self.quantity, 0)

        # ✅ Save snapshot AFTER updating totals
        self.item.date_last_modified = timezone.now()
        self.item.save()
        self.stock_after_transaction = self.item.total_stock
        super().save(update_fields=['stock_after_transaction'])
