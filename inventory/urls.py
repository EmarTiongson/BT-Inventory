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
from django.contrib import admin
from django.urls import path, include
from app_core import views as core_views
from django.views.generic import RedirectView
from . import views
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
     # Default landing page
    path('inventory/', views.inventory_view, name='inventory'),
    # Inventory item management
    path('item/<int:item_id>/history/', views.item_history, name='item_history'),
    path('add-item/', views.add_item, name='add_item'),
    path('update/<int:item_id>/', views.updateitem_view, name='update_item'),
    path('delete-item/<int:item_id>/', views.delete_item, name='delete_item'),
    # Include URLs from other apps
    path('accounts/', include('accounts.urls')),   
    path('', include('app_core.urls')),   
    path('item/<int:item_id>/transactions/', views.transaction_history_view, name='transaction_history'),
    path('transaction/<int:update_id>/undo/', views.undo_transaction, name='undo_transaction'),
    path('convert_allocate_to_out/<int:update_id>/', views.convert_allocate_to_out, name='convert_allocate_to_out'),
     # Django admin
    path('admin/', admin.site.urls),
    path('', lambda request: redirect('login')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)