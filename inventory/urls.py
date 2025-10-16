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




urlpatterns = [
     # Default landing page
    path('', views.inventory_view, name='inventory'),
    # Inventory item management
    path('item/<int:item_id>/', views.item_detail, name='item_detail'),
    path('add/', views.additem_view, name='add_item'),
    path('update/<int:item_id>/', views.updateitem_view, name='update_item'),
    # Include URLs from other apps
    path('accounts/', include('accounts.urls')),   
    path('', include('app_core.urls')),   

     # Django admin
    path('admin/', admin.site.urls),
]
