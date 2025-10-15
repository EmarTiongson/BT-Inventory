from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('admin-page/', views.admin_view, name='admin_page'),
    path('inventory/', views.inventory_view, name='inventory'),
    path('inventory/item/', views.item_detail, name='item_detail'), #<int:item_id>/
    path('add-item/', views.additem_view, name='add_item'),
    path('update-item/', views.updateitem_view, name='update_item'),


]