from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from .models import AssetTool, AssetUpdate

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
def project_summary_view(request):
    return render(request, "app_core/project_summary.html")


@login_required
def assets_tools(request):
    """
    View to display all active (non-deleted) assets and tools
    """

    # Get all non-deleted assets/tools ordered by date added (newest first)
    assets_tools = AssetTool.objects.filter(is_deleted=False).order_by("-date_added")

    context = {"assets_tools": assets_tools}

    return render(request, "app_core/assets_tools.html", context)


@login_required
def add_asset_tool(request):
    """
    View to handle adding new assets and tools
    """
    if request.method == "POST":
        try:
            # Get form data
            date_added = request.POST.get("date_added")
            tool_name = request.POST.get("tool_name")
            description = request.POST.get("description")
            warranty_date = request.POST.get("warranty_date")
            image = request.FILES.get("image")

            # Get current user as assigned_by
            assigned_by = request.user.username

            # Validate required fields
            if not all([date_added, tool_name, description, image]):
                return render(
                    request,
                    "app_core/add_asset_tool.html",
                    {
                        "error_message": "Please fill in all required fields (Date, Name, Description, and Image).",
                        "form_data": request.POST,
                        "today": timezone.now().date(),
                    },
                )

            # Create new asset/tool entry
            AssetTool.objects.create(
                date_added=date_added,
                tool_name=tool_name,
                description=description,
                warranty_date=warranty_date if warranty_date else None,
                assigned_user=None,  # Initially unassigned
                assigned_by=assigned_by,  # Current logged-in user
                image=image,
            )

            # Success message
            messages.success(request, f"{tool_name} has been added successfully!")
            return redirect("assets_tools")

        except Exception as e:
            # More detailed error message
            print(f"Error in add_asset_tool: {str(e)}")  # For debugging in console
            return render(
                request,
                "app_core/add_asset_tool.html",
                {"error_message": f"An error occurred while saving: {str(e)}", "form_data": request.POST, "today": timezone.now().date()},
            )

    # GET request - display the form
    return render(request, "app_core/add_asset_tool.html", {"today": timezone.now().date()})


@login_required
def update_asset(request, asset_id):
    # Fetch asset instance safely
    asset = get_object_or_404(AssetTool, id=asset_id)

    if request.method == "POST":
        new_assigned_to = request.POST.get("assigned_user")
        remarks = request.POST.get("remarks")
        transaction_date_str = request.POST.get("transaction_date")

        # Convert manually inputted date/time
        if transaction_date_str:
            try:
                transaction_date = timezone.datetime.fromisoformat(transaction_date_str)
                # Ensure timezone aware
                if timezone.is_naive(transaction_date):
                    transaction_date = timezone.make_aware(transaction_date)
            except ValueError:
                transaction_date = timezone.now()
        else:
            transaction_date = timezone.now()

        # ✅ Only create a history record if assigned user actually changes
        if new_assigned_to and new_assigned_to != asset.assigned_user:
            previous_user = asset.assigned_user

            # ✅ Log update in AssetUpdate
            AssetUpdate.objects.create(
                asset=asset,
                previous_user=previous_user,
                assigned_to=new_assigned_to,
                remarks=remarks,
                updated_by=request.user,  # ✅ Correct: pass user object
                transaction_date=transaction_date,
            )

            # ✅ Update the asset record itself
            asset.assigned_user = new_assigned_to
            asset.assigned_by = request.user.username
            asset.remarks = remarks
            asset.save()

            messages.success(
                request,
                f"Asset reassigned from {previous_user or 'Unassigned'} to {new_assigned_to}.",
            )
        else:
            messages.info(request, "No changes in assignment were made.")

        return redirect("asset_history", asset_id=asset.id)

    # ✅ Pass correct context variable name and pre-fill datetime
    current_datetime = timezone.now().strftime("%Y-%m-%dT%H:%M")
    context = {
        "asset_tool": asset,
        "current_datetime": current_datetime,
    }

    return render(request, "app_core/update_asset_tool.html", context)


@login_required
@user_passes_test(lambda u: u.role == "superadmin")  # Restrict to superadmins
@transaction.atomic
def delete_asset_tool(request, asset_id):
    """
    Soft-delete an Asset/Tool (Superadmin only).

    Marks the asset as deleted instead of permanently removing it,
    ensuring historical records remain accessible.
    """
    asset = get_object_or_404(AssetTool, id=asset_id)

    if request.method == "POST":
        password = request.POST.get("password")
        user = authenticate(username=request.user.username, password=password)

        if user is not None:
            asset.is_deleted = True
            asset.save(update_fields=["is_deleted"])
            messages.success(request, f"'{asset.tool_name}' was deleted successfully.")
            return redirect("assets_tools")
        else:
            messages.error(request, "Incorrect password. Deletion cancelled.")
            return redirect("assets_tools")

    messages.error(request, "Invalid request method.")
    return redirect("assets_tools")


@login_required
def asset_history(request, asset_id):
    asset = get_object_or_404(AssetTool, id=asset_id)

    # ✅ Fetch related updates from AssetUpdate, most recent first
    updates = asset.updates.all().order_by("-transaction_date")

    context = {
        "asset": asset,
        "updates": updates,
    }

    return render(request, "app_core/asset_history.html", context)
