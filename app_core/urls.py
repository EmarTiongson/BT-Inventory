from django.urls import path

from . import views

urlpatterns = [
    # Dashboard route
    path("dashboard/", views.dashboard_view, name="dashboard"),
    # Admin page route
    path("admin-page/", views.admin_view, name="admin_page"),
    # Assets page
    path("assets-tools/", views.assets_tools_view, name="assets_tools"),
    # Project Summary
    path("project-summary/", views.project_summary_view, name="project_summary"),
]
