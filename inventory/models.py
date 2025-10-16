from django.db import models
from django.utils import timezone
from accounts.models import CustomUser  # Import your user model



class Item(models.Model):
    UNIT_CHOICES = [
        ('pcs', 'Pieces'),
        ('rolls', 'Rolls'),
        ('meters', 'Meters'),
    ]

    item_id = models.CharField(max_length=50, unique=True)
    item_name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='item_images/', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    total_stock = models.IntegerField(default=0)
    quantity = models.IntegerField(default=0)
    allocated_quantity = models.IntegerField(default=0)
    unit_of_quantity = models.CharField(max_length=20, choices=UNIT_CHOICES, default='pcs')
    date_last_modified = models.DateTimeField(auto_now=True)

    # Instead of storing serials in a text field, we relate them to a separate model
    def __str__(self):
        return f"{self.item_name} ({self.item_id})"

    @property
    def available_serials(self):
        """Return all serial numbers currently linked to this item."""
        return self.serial_numbers.filter(is_available=True).values_list('serial_no', flat=True)


class ItemSerial(models.Model):
    """Represents each individual serial number tied to an item."""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='serial_numbers')
    serial_no = models.CharField(max_length=100)
    is_available = models.BooleanField(default=True)
    date_added = models.DateTimeField(default=timezone.now)

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
    part_no = models.CharField(max_length=100, blank=True, null=True)
    transaction_type = models.CharField(max_length=3, choices=TRANSACTION_TYPE)
    quantity = models.PositiveIntegerField(default=0)

    # NEW: Multiple serials per update
    serial_numbers = models.JSONField(blank=True, null=True, help_text="List of serial numbers affected")

    location = models.CharField(max_length=200, blank=True, null=True)
    po_from_supplier = models.CharField("P.O From Supplier", max_length=100, blank=True, null=True)
    po_to_client = models.CharField("P.O To Client", max_length=100, blank=True, null=True)
    dr_no = models.CharField("DR No.", max_length=100, blank=True, null=True)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.item.item_name} ({self.quantity})"

    class Meta:
        ordering = ['-date']

    def save(self, *args, **kwargs):
        """Auto-update Item quantity and manage serial list."""
        is_new = self._state.adding  # Check if creating or updating
        super().save(*args, **kwargs)

        if is_new and self.serial_numbers:
            # If stock IN → Add new serials
            if self.transaction_type == 'IN':
                for sn in self.serial_numbers:
                    ItemSerial.objects.create(item=self.item, serial_no=sn, is_available=True)
                self.item.quantity += self.quantity
                self.item.total_stock = self.item.quantity

            # If stock OUT → Mark serials as unavailable
            elif self.transaction_type == 'OUT':
                for sn in self.serial_numbers:
                    try:
                        serial = ItemSerial.objects.get(item=self.item, serial_no=sn, is_available=True)
                        serial.is_available = False
                        serial.save()
                    except ItemSerial.DoesNotExist:
                        pass  # Ignore invalid serials
                self.item.quantity -= self.quantity
                self.item.total_stock = self.item.quantity

            self.item.save()
