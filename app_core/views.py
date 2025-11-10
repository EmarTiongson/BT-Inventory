from datetime import datetime

from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import transaction
from django.db.models import Max
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.utils.dateparse import parse_date

from inventory.models import ItemUpdate

from .models import AssetTool, AssetUpdate, Project, UploadedDR

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


def project_summary_view(request):

    projects = Project.objects.all().order_by("project_title")
    selected_project_id = request.GET.get("project_id")
    selected_project = None
    drs = []

    if selected_project_id:
        selected_project = get_object_or_404(Project, id=selected_project_id)
        # Fetch all DRs (ItemUpdates) connected to the project's P.O.
        drs = ItemUpdate.objects.filter(po_client=selected_project.po_no).order_by("-date").distinct("dr_no")  # one entry per DR number

    context = {
        "projects": projects,
        "selected_project": selected_project,
        "drs": drs,
    }
    return render(request, "app_core/project_summary.html", context)


def project_drs_api(request, project_id):
    """API endpoint: returns all DRs belonging to a specific project (by P.O.)"""
    project = get_object_or_404(Project, id=project_id)
    drs = ItemUpdate.objects.filter(po_client=project.po_no).order_by("-date").distinct("dr_no")

    data = [
        {
            "dr_no": dr.dr_no,
            "remarks": dr.remarks,
            "location": dr.location,
            "date": dr.date.strftime("%Y-%m-%d") if dr.date else "",
        }
        for dr in drs
    ]
    return JsonResponse(data, safe=False)


def add_project(request):
    if request.method == "POST":
        data = request.POST
        title = data.get("project_title")
        po = data.get("po_number")
        remarks = data.get("remarks", "")
        location = data.get("location", "")
        date = data.get("date")

        if not title or not po:
            return JsonResponse({"success": False, "error": "Missing required fields."}, status=400)

        project = Project.objects.create(project_title=title, po_no=po, remarks=remarks, location=location, created_date=parse_date(date))

        return JsonResponse({"success": True, "project_name": f"{project.po_no} {project.project_title}"})

    return JsonResponse({"success": False, "error": "Invalid request method."}, status=405)


def get_projects(request):
    projects = Project.objects.all().order_by("project_title")
    data = [{"id": p.id, "display": f"{p.po_no} | {p.project_title}"} for p in projects]
    return JsonResponse({"projects": data})


def get_project_details(request, project_id):
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return JsonResponse({"success": False, "error": "Project not found"}, status=404)

    # ✅ Normalize PO number for comparison
    po_no = project.po_no.strip()

    # Group by DR No. and get the latest date for each
    drs = (
        ItemUpdate.objects.filter(po_client=po_no)
        .exclude(dr_no__isnull=True)
        .exclude(dr_no__exact="")
        .values("dr_no")
        .annotate(date=Max("date"))
        .order_by("-date")
    )

    # ✅ Get all uploaded DR images that match this project's P.O.
    uploaded_drs = UploadedDR.objects.filter(po_number__iexact=po_no)
    dr_image_map = {}

    for dr in uploaded_drs:
        normalized_dr_no = dr.dr_number.strip().lower()
        dr_image_map.setdefault(normalized_dr_no, []).append(dr.image.url)

    # ✅ Build response safely
    dr_list = []
    for dr in drs:
        dr_no = (dr["dr_no"] or "").strip()
        normalized_dr_no = dr_no.lower()

        dr_list.append(
            {
                "dr_no": dr_no,
                "date_created": dr["date"].strftime("%Y-%m-%d") if dr["date"] else "",
                "images": dr_image_map.get(normalized_dr_no, []),
                "po_number": po_no,
            }
        )

    return JsonResponse(
        {
            "success": True,
            "id": project.id,
            "title": project.project_title,
            "po_no": po_no,
            "remarks": project.remarks or "No remarks available.",
            "location": project.location or "N/A",
            "date": project.created_date.strftime("%Y-%m-%d") if project.created_date else "N/A",
            "drs": dr_list,
        }
    )


def get_dr_details(request, dr_no):
    """
    Returns all transactions under a specific DR number,
    including their serial numbers directly from ItemUpdate.
    """
    try:
        po_client = request.GET.get("po_client")

        qs = (
            ItemUpdate.objects.filter(dr_no=dr_no)
            .exclude(transaction_type__in=["ALLOCATED", "UPLOAD"])
            .exclude(undone=True)
            .exclude(item__isnull=True)  # ensure valid item reference
        )
        if po_client:
            qs = qs.filter(po_client=po_client)

        transactions = []
        for tx in qs.order_by("-date"):
            # Parse serial_numbers properly (JSON or comma string)
            serials_raw = tx.serial_numbers
            if isinstance(serials_raw, str):
                try:
                    import json

                    serials = json.loads(serials_raw)
                except json.JSONDecodeError:
                    serials = [s.strip() for s in serials_raw.split(",") if s.strip()]
            elif isinstance(serials_raw, list):
                serials = serials_raw
            else:
                serials = []

            transactions.append(
                {
                    "id": tx.id,
                    "item_id": tx.item_id,
                    "item_name": tx.item.item_name,
                    "item_description": tx.item.description,
                    "date": tx.date.strftime("%Y-%m-%d") if tx.date else "",
                    "transaction_type": tx.transaction_type,
                    "quantity": tx.quantity,
                    "stock_after_transaction": tx.stock_after_transaction,
                    "location": tx.location,
                    "po_supplier": tx.po_supplier,
                    "po_client": tx.po_client,
                    "dr_no": tx.dr_no,
                    "remarks": tx.remarks,
                    "updated_by_user": tx.updated_by_user,
                    "serial_numbers": serials or [],  # ✅ correct serials for this transaction
                }
            )

        return JsonResponse({"transactions": transactions})

    except Exception as e:
        print("❌ Error in get_dr_details:", e)
        return JsonResponse({"error": str(e)}, status=500)


# ===================================
# Serial Numbers View
# ===================================
def get_serials(request, update_id):
    """
    Returns the serial numbers involved in a specific ItemUpdate transaction.
    """
    try:
        update = ItemUpdate.objects.get(id=update_id)
        serials = update.serial_numbers or []  # safely handle None
        return JsonResponse({"serial_numbers": serials})
    except ItemUpdate.DoesNotExist:
        return JsonResponse({"error": "Transaction not found."}, status=404)
    except Exception as e:
        print("❌ Error fetching serials:", e)
        return JsonResponse({"error": str(e)}, status=500)


@login_required
@transaction.atomic
def upload_dr(request):
    """
    Handles DR image uploads without creating ItemUpdate entries.
    """
    try:
        po_number = request.POST.get("po_number", "").strip()
        dr_number = request.POST.get("dr_number", "").strip()
        uploaded_date = request.POST.get("uploaded_date", "").strip()
        images = request.FILES.getlist("images")

        if not po_number or not dr_number or not uploaded_date:
            return JsonResponse({"success": False, "error": "Missing required fields."})

        if not images:
            return JsonResponse({"success": False, "error": "Please upload at least one image."})

        # Convert date string safely
        try:
            uploaded_date = datetime.strptime(uploaded_date, "%Y-%m-%d").date()
        except ValueError:
            return JsonResponse({"success": False, "error": "Invalid date format (expected YYYY-MM-DD)."})

        # ✅ Normalize DR and PO for consistent matching
        normalized_dr = dr_number.strip().lower()
        normalized_po = po_number.strip().lower()

        # ✅ Save each uploaded image in UploadedDR model only
        for img in images:
            UploadedDR.objects.create(
                po_number=normalized_po,
                dr_number=normalized_dr,
                uploaded_date=uploaded_date,
                image=img,
            )

        return JsonResponse({"success": True, "message": "DR and images uploaded successfully!"})

    except Exception as e:
        print("❌ Error in upload_dr:", e)
        return JsonResponse({"success": False, "error": str(e)})
