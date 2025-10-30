from django.urls import path

from . import views

urlpatterns = [
    # Dashboard route
    path("dashboard/", views.dashboard_view, name="dashboard"),
    # Admin page route
    path("admin-page/", views.admin_view, name="admin_page"),
    # Project Summary
    path("project-summary/", views.project_summary_view, name="project_summary"),
    # Add Assets/Tools
    path("assets-tools/", views.assets_tools, name="assets_tools"),
    path("add-asset-tool/", views.add_asset_tool, name="add_asset_tool"),
    path("update-asset-tool/<int:asset_id>/", views.update_asset, name="update_asset_tool"),
    path("delete-asset-tool/<int:asset_id>/", views.delete_asset_tool, name="delete_asset_tool"),
    path("asset/<int:asset_id>/history/", views.asset_history, name="asset_history"),
]
