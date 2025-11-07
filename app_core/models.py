from django.conf import settings
from django.db import models
from django.utils import timezone


# Create your models here.
class AssetTool(models.Model):
    """
    Model for storing Assets and Tools information
    """

    date_added = models.DateTimeField(default=timezone.now)
    tool_name = models.CharField(max_length=255)
    description = models.TextField()
    warranty_date = models.DateField(null=True, blank=True)
    assigned_user = models.CharField(max_length=255, null=True, blank=True)
    assigned_by = models.CharField(max_length=255)
    image = models.ImageField(upload_to="assets_tools/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ["-date_added"]
        verbose_name = "Asset/Tool"
        verbose_name_plural = "Assets/Tools"

    def __str__(self):
        return f"{self.tool_name} - {self.date_added}"

    def is_warranty_active(self):
        """Check if warranty is still active"""
        if self.warranty_date:
            return self.warranty_date >= timezone.now().date()
        return False


class AssetHistory(models.Model):
    asset = models.ForeignKey("AssetTool", on_delete=models.CASCADE, related_name="history")
    change_type = models.CharField(
        max_length=20,
        choices=[
            ("ASSIGNED", "Assigned"),
            ("RETURNED", "Returned"),
        ],
    )
    assigned_to = models.CharField(max_length=255, blank=True, null=True)
    previous_user = models.CharField(max_length=255, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    date = models.DateTimeField(auto_now_add=True)
    undone = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.asset.asset_name} reassigned to {self.assigned_to or 'N/A'} on {self.date:%Y-%m-%d}"


class AssetUpdate(models.Model):
    """
    Logs updates or reassignments of assets/tools.
    Tracks previous and new assigned users, remarks, and timestamp.
    """

    asset = models.ForeignKey(AssetTool, on_delete=models.CASCADE, related_name="updates")
    previous_user = models.CharField(max_length=255, blank=True, null=True, help_text="The user previously assigned to this asset.")
    assigned_to = models.CharField(max_length=255, blank=True, null=True, help_text="The new user assigned to this asset.")
    remarks = models.TextField(blank=True, null=True, help_text="Any notes about the change.")
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, help_text="The system user who performed the update."
    )
    transaction_date = models.DateTimeField(auto_now_add=True, help_text="The date and time this update was recorded.")

    def __str__(self):
        return f"Update for {self.asset.tool_name} on {self.transaction_date.strftime('%Y-%m-%d %H:%M:%S')}"


class Project(models.Model):
    project_title = models.CharField(max_length=255)
    po_no = models.CharField(max_length=50, verbose_name="P.O. No.")
    remarks = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    created_date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.po_no} - {self.project_title}"

    class Meta:
        unique_together = ("project_title", "po_no")


class UploadedDR(models.Model):
    dr_number = models.CharField(max_length=100)  # required
    po_number = models.CharField(max_length=100)  # required
    image = models.ImageField(upload_to="uploaded_drs/")  # at least one image required
    uploaded_date = models.DateField()  # manually entered date

    def __str__(self):
        return f"DR: {self.dr_number} | PO: {self.po_number} | {self.image.name}"
