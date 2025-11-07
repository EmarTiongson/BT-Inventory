# Register your models here.
from django.contrib import admin

from .models import Project, UploadedDR


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "po_no",
        "project_title",
        "location",
        "remarks",
        "created_date",
    )
    search_fields = ("po_no", "project_title", "location")
    list_filter = ("created_date",)
    ordering = ("-created_date",)


@admin.register(UploadedDR)
class UploadedDRAdmin(admin.ModelAdmin):
    list_display = ("dr_number", "po_number", "uploaded_date", "image_preview")
    search_fields = ("dr_number", "po_number")
    list_filter = ("uploaded_date",)
    readonly_fields = ("image_preview",)

    # ✅ Custom thumbnail preview for images
    def image_preview(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" style="max-height: 80px; border-radius: 6px;" />'
        return "(No Image)"

    image_preview.allow_tags = True
    image_preview.short_description = "Preview"
