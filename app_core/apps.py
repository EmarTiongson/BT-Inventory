from django.apps import AppConfig


class AppCoreConfig(AppConfig):
    """ "allows app core to be viewed in django admin"""

    default_auto_field = "django.db.models.BigAutoField"
    name = "app_core"
