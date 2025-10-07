from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('admin-page/', views.admin_view, name='admin_page'),
]
