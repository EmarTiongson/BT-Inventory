"""
URL configuration for inventory project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path

from . import views as inventory_views  # inventory app views

urlpatterns = [
    # Inventory-related
    path("inventory/", inventory_views.inventory_view, name="inventory"),
    path("item/<int:item_id>/history/", inventory_views.item_history, name="item_history"),
    path("add-item/", inventory_views.add_item, name="add_item"),
    path("update/<int:item_id>/", inventory_views.updateitem_view, name="update_item"),
    path("delete-item/<int:item_id>/", inventory_views.delete_item, name="delete_item"),
    path(
        "item/<int:item_id>/transactions/",
        inventory_views.transaction_history_view,
        name="transaction_history",
    ),
    path(
        "transaction/<int:update_id>/undo/",
        inventory_views.undo_transaction,
        name="undo_transaction",
    ),
    path(
        "convert_allocate_to_out/<int:update_id>/",
        inventory_views.convert_allocate_to_out,
        name="convert_allocate_to_out",
    ),
    path("search-by-po/", inventory_views.search_by_po, name="search_by_po"),
    path("ajax/search-po/", inventory_views.ajax_search_po, name="ajax_search_po"),
    # Core app (dashboard, admin page)
    path("", include("app_core.urls")),
    # Accounts app
    path("accounts/", include("accounts.urls")),
    # Django admin
    path("admin/", admin.site.urls),
    # Redirect root to login
    path("", lambda request: redirect("login")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    path("project-summary/", inventory_views.project_summary_view, name="project_summary"),
    path("get_project_details/<str:project_id>/", inventory_views.get_project_details, name="get_project_details"),
    path("api/projects/", inventory_views.api_projects, name="api_projects"),
    path("add_project/", inventory_views.add_project, name="add_project"),
    path("upload_dr/", inventory_views.upload_dr, name="upload_dr"),
    path("get_dr_details/<str:dr_no>/", inventory_views.get_dr_details, name="get_dr_details"),
    path("get_serials/<int:update_id>/", inventory_views.get_serials, name="get_serials"),
