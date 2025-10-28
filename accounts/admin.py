from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Admin configuration for managing CustomUser instances."""

    # Fields displayed in the user list view
    list_display = (
        "username",
        "get_full_name",  # function
        "email",
        "role",
        "position",
        "contact_no",
        "is_staff",
        "is_active",
    )
    list_filter = ("role", "is_staff", "is_active", "is_superuser")
    search_fields = ("username", "first_name", "last_name", "email", "position", "role")
    ordering = ("username",)

    # Fields shown when viewing/editing a user
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            _("Personal info"),
            {
                "fields": (
                    "first_name",
                    "middle_initial",
                    "last_name",
                    "email",
                    "contact_no",
                    "position",
                    "role",
                    "generated_password",
                )
            },
        ),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
        (_("Other info"), {"fields": ("first_login",)}),
    )

    # Fields shown when adding a new user via the admin
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "password1",
                    "password2",
                    "first_name",
                    "middle_initial",
                    "last_name",
                    "email",
                    "contact_no",
                    "position",
                    "role",
                    "is_active",
                    "is_staff",
                ),
            },
        ),
    )

    def get_full_name(self, obj: CustomUser) -> str:
        """
        Return the user's full name for display in the admin list view.

        Args:
            obj (CustomUser): The user object to retrieve the full name for.

        Returns:
            str: The user's full name.
        """
        return obj.get_full_name()

    get_full_name.short_description = "Full Name"
