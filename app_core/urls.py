from django.urls import path

from . import views

urlpatterns = [
    # Dashboard route
    path("dashboard/", views.dashboard_view, name="dashboard"),
    # Admin page route
    path("admin-page/", views.admin_view, name="admin_page"),
]
