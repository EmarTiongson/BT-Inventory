from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """allows user management to be viewewed and updated in django admin"""

    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"
    verbose_name = "User Management"
