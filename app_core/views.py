from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

User = get_user_model()


@login_required
def dashboard_view(request):
    """
    Display the main dashboard for logged-in users.

    Args:
        request (HttpRequest): The incoming HTTP request from the user.

    Returns:
        HttpResponse: Renders the 'dashboard.html' template.
    """
    return render(request, "app_core/dashboard.html")


@login_required
def admin_view(request):
    """
    Display the admin management page.

    Only users with the 'admin' or 'superadmin' role can access this view.
    If an unauthorized user attempts access, they are redirected to the dashboard.

    Args:
        request (HttpRequest): The incoming HTTP request from the user.

    Returns:
        HttpResponse:
            - Renders the 'admin.html' template for authorized users.
            - Redirects to the dashboard with an error message if unauthorized.
    """
    user = request.user

    # Block unauthorized access
    if user.role not in ["admin", "superadmin"]:
        messages.error(request, "You do not have permission to view this page.")
        return redirect("dashboard")

    # Only visible to admin/superadmin
    users = User.objects.all().order_by("id")
    context = {"users": users}
    return render(request, "app_core/admin.html", context)


@login_required
def assets_tools_view(request):
    # Example: you can pass assets/tools data later
    context = {"page_title": "Assets & Tools"}
    return render(request, "app_core/assets_tools.html", context)


@login_required
def project_summary_view(request):
    return render(request, "app_core/project_summary.html")
