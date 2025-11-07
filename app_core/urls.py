from django.urls import path

from . import views

urlpatterns = [
    # Dashboard route
    path("dashboard/", views.dashboard_view, name="dashboard"),
    # Admin page route
    path("admin-page/", views.admin_view, name="admin_page"),
    # Project Summary
    path("project-summary/", views.project_summary_view, name="project_summary"),
    path("api/projects/<int:project_id>/drs/", views.project_drs_api, name="project_drs_api"),
    path("get_dr_details/<str:dr_no>/", views.get_dr_details, name="get_dr_details"),
    path("get_serials/<int:update_id>/", views.get_serials, name="get_serials"),
    path("add_project/", views.add_project, name="add_project"),
    path("api/projects/", views.get_projects, name="get_projects"),
    path("get_project_details/<int:project_id>/", views.get_project_details, name="get_project_details"),
    path("upload_dr/", views.upload_dr, name="upload_dr"),
    # Add Assets/Tools
    path("assets-tools/", views.assets_tools, name="assets_tools"),
    path("add-asset-tool/", views.add_asset_tool, name="add_asset_tool"),
    path("update-asset-tool/<int:asset_id>/", views.update_asset, name="update_asset_tool"),
    path("delete-asset-tool/<int:asset_id>/", views.delete_asset_tool, name="delete_asset_tool"),
    path("asset/<int:asset_id>/history/", views.asset_history, name="asset_history"),
]
