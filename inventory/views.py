import json
import traceback
from datetime import datetime, timedelta

from django.contrib import messages
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import IntegrityError, transaction
from django.db.models import Prefetch, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import render_to_string
from django.utils import timezone

from .models import Item, ItemSerial, ItemUpdate, TransactionHistory


@login_required
def inventory_view(request):
    """
    Display the inventory overview page.

    This view shows all items that are not soft-deleted. It also
    calculates total stock and retrieves the latest update for each item
    to display in the item list.
    """
    latest_updates = Prefetch(
        "updates",
        queryset=ItemUpdate.objects.select_related("user").order_by("-date"),
        to_attr="prefetched_updates",
    )

    items = (
        Item.objects.filter(is_deleted=False)
        .select_related("user")
        .prefetch_related("serial_numbers", latest_updates)
        .order_by("-date_last_modified")  # show most recently changed first
    )

    return render(request, "inventory/inventory.html", {"items": items})


@login_required
def item_history(request, item_id):
    """
    Display the transaction history for a specific item.

    This view lists all ItemUpdate records associated with the
    specified item, ordered by most recent date.
    """

    item = get_object_or_404(Item, id=item_id)
    updates = item.updates.all().order_by("-date")  # newest first

    # Ensure serial_numbers are always a list (safe for template rendering)
    for update in updates:
        if isinstance(update.serial_numbers, str):
            try:
                import json

                update.serial_numbers = json.loads(update.serial_numbers)
            except json.JSONDecodeError:
                update.serial_numbers = [s.strip() for s in update.serial_numbers.split(",") if s.strip()]
        elif update.serial_numbers is None:
            update.serial_numbers = []
        elif not isinstance(update.serial_numbers, list):
            update.serial_numbers = list(update.serial_numbers)

    return render(
        request,
        "inventory/item_history.html",
        {
            "item": item,
            "updates": updates,
        },
    )


@login_required
@transaction.atomic
def add_item(request):
    """
    Add a new inventory item to the system.

    This view handles form submissions for creating new items.
    It also creates associated serial numbers if provided and
    logs the transaction as an 'In' type in ItemUpdate.
    """
    if request.method == "POST":
        try:
            #  Extract form data
            item_name = request.POST.get("item", "").strip()
            description = request.POST.get("description", "").strip()
            total_stock_raw = request.POST.get("total_stock", "").strip()
            total_stock = int(total_stock_raw) if total_stock_raw.isdigit() else 0

            allocated_raw = request.POST.get("allocated_quantity", "").strip()
            allocated_quantity = int(allocated_raw) if allocated_raw.isdigit() else 0

            unit_of_quantity = request.POST.get("unit_of_quantity", "").strip() or "pcs"
            part_no = request.POST.get("part_no", "").strip() or None
            image = request.FILES.get("image")

            # Parse user-supplied date
            date_input = request.POST.get("date_added", "").strip()
            if date_input:
                try:
                    # Parse the date
                    date_part = datetime.strptime(date_input, "%Y-%m-%d").date()
                    # Combine with current local time
                    current_time = timezone.localtime().time()
                    combined_datetime = datetime.combine(date_part, current_time)
                    # Make it timezone-aware
                    date_added = timezone.make_aware(combined_datetime, timezone.get_current_timezone())
                except ValueError:
                    date_added = timezone.now()
            else:
                date_added = timezone.now()

            # Parse serial numbers safely
            serial_numbers_raw = request.POST.get("serial_numbers", "") or ""
            serial_numbers = [s.strip() for s in serial_numbers_raw.split(",") if s.strip()]
            serial_numbers = list(dict.fromkeys(serial_numbers))  # remove duplicates, preserve order

            # Strict 1:1 rule between total_stock and serial numbers
            if serial_numbers:
                if len(serial_numbers) != total_stock:
                    error_message = f" The number of serial numbers ({len(serial_numbers)}) " f"must match the total stock ({total_stock})."
                    # Re-render the same form without clearing user data
                    return render(
                        request,
                        "inventory/add_item.html",
                        {
                            "error_message": error_message,
                            "today": timezone.now(),
                            # Preserve previously entered data
                            "form_data": {
                                "item": item_name,
                                "description": description,
                                "total_stock": total_stock_raw,
                                "allocated_quantity": allocated_raw,
                                "unit_of_quantity": unit_of_quantity,
                                "part_no": part_no,
                                "serial_numbers": ", ".join(serial_numbers),
                            },
                        },
                    )
            else:
                # If serials are not provided but total_stock > 0, allow only if item does not use serial tracking
                # (We assume no serial tracking means okay to skip)
                pass  # no action needed

            # Validation
            if not item_name or not description:
                messages.error(request, " Please fill in all required fields.")
                return redirect("add_item")

            #  Create Item
            item = Item.objects.create(
                item_name=item_name,
                description=description,
                total_stock=0,
                allocated_quantity=allocated_quantity,
                unit_of_quantity=unit_of_quantity,
                part_no=part_no,
                image=image,
                user=request.user,
                date_last_modified=date_added,
            )

            # Create Serial Numbers (if any)
            created_sn = 0
            for sn in serial_numbers:
                try:
                    ItemSerial.objects.create(item=item, serial_no=sn, is_available=True)
                    created_sn += 1
                except IntegrityError:
                    continue  # skip duplicates silently

            # Log in ItemUpdate (Initial Import)
            # When adding new item
            initial_quantity = total_stock  # total stock entered in the form
            ItemUpdate.objects.create(
                item=item,
                transaction_type="IN",
                quantity=initial_quantity,
                serial_numbers=serial_numbers if serial_numbers else None,
                location="Initial Import",
                remarks="Initial item creation",
                user=request.user,
                updated_by_user=request.user.username,
                date=date_added,
            )

            msg = f" Item '{item_name}' added successfully!"
            if created_sn:
                msg += f" ({created_sn} serials added)"
            messages.success(request, msg)
            return redirect("inventory")

        except Exception as e:
            traceback.print_exc()
            messages.error(request, f" Failed to add item: {str(e)}")
            return redirect("add_item")

    return render(request, "inventory/add_item.html", {"today": timezone.now()})


@login_required
@transaction.atomic
def updateitem_view(request, item_id):
    """
    Update an existing inventory item.

    Allows users to perform stock transactions (In, Out, Allocate, or Return),
    update serial numbers, and logs each change as an ItemUpdate record.
    """
    item = get_object_or_404(Item, id=item_id)

    available_serials = (
        list(item.serial_numbers.filter(is_available=True).values_list("serial_no", flat=True)) if hasattr(item, "serial_numbers") else []
    )

    # Helper: recompute running stock
    def recalculate_item_stock(item):
        total = 0
        allocated = 0
        updates = item.updates.filter(undone=False).order_by("date")  # only active transactions
        for update in updates:
            if update.transaction_type == "IN":
                total += update.quantity
            elif update.transaction_type == "OUT":
                total -= update.quantity
            elif update.transaction_type == "ALLOCATED":
                # Only count allocations that have NOT been converted to OUT
                if not getattr(update, "is_converted", False):
                    allocated += update.allocated_quantity

            total = max(total, 0)
            allocated = max(allocated, 0)

            update.stock_after_transaction = total
            update.allocated_after_transaction = allocated
            update.save(update_fields=["stock_after_transaction", "allocated_after_transaction"])

        item.total_stock = total
        item.allocated_quantity = allocated
        item.save(update_fields=["total_stock", "allocated_quantity"])
        return total, allocated

    if request.method == "POST":
        try:
            in_value = int(request.POST.get("in", 0) or 0)
            out_value = int(request.POST.get("out", 0) or 0)
            allocated_value = int(request.POST.get("allocated_quantity", 0) or 0)
            location = request.POST.get("location", "").strip()
            remarks = request.POST.get("remarks", "").strip()
            dr_no = request.POST.get("dr_no", "").strip()
            po_from_supplier = request.POST.get("po_supplier", "").strip()
            po_to_client = request.POST.get("po_client", "").strip()
            serial_numbers_raw = request.POST.get("serial_numbers", "")
            serial_numbers = [s.strip() for s in serial_numbers_raw.split(",") if s.strip()]

            # Enforce strict 1:1 rule between quantity and serial numbers
            if serial_numbers:
                expected_count = allocated_value if allocated_value > 0 else in_value if in_value > 0 else out_value

                if len(serial_numbers) != expected_count:
                    messages.error(
                        request,
                        f" The number of serial numbers ({len(serial_numbers)}) must match the quantity ({expected_count}).",
                    )
                    return redirect("update_item", item_id=item.id)
            else:
                # If item already has serials in DB, disallow missing serials for transactions with quantity > 0
                has_serial_tracking = item.serial_numbers.exists()
                if has_serial_tracking and (in_value > 0 or out_value > 0 or allocated_value > 0):
                    messages.error(
                        request,
                        " This item uses serial numbers — please provide all serial numbers for this transaction.",
                    )
                    return redirect("update_item", item_id=item.id)

            # Parse manual date (no time input)
            manual_date_str = request.POST.get("date_added", "").strip()
            if manual_date_str:
                manual_date = datetime.strptime(manual_date_str, "%Y-%m-%d").date()
                current_time = timezone.localtime().time()
                combined_datetime = timezone.make_aware(
                    datetime.combine(manual_date, current_time),
                    timezone.get_current_timezone(),
                )
            else:
                combined_datetime = timezone.now()

            # Validate mutual exclusivity
            if (allocated_value > 0 and (in_value > 0 or out_value > 0)) or (in_value > 0 and out_value > 0):
                messages.error(
                    request,
                    " You can only enter IN/OUT or Allocated Quantity, not both.",
                )
                return redirect("update_item", item_id=item.id)

            # Limit date range: allow only within 5 days from today
            today = timezone.localdate()
            if combined_datetime.date() < today - timedelta(days=5) or combined_datetime.date() > today:
                messages.error(request, " You can only input transactions within the last 5 days.")
                return redirect("update_item", item_id=item.id)

            # Determine transaction type
            if allocated_value > 0:
                transaction_type = "ALLOCATED"
                quantity = allocated_value
            elif in_value > 0:
                transaction_type = "IN"
                quantity = in_value
            elif out_value > 0:
                transaction_type = "OUT"
                quantity = out_value
                if quantity > item.total_stock:
                    messages.error(request, f" Not enough stock. Available: {item.total_stock}")
                    return redirect("update_item", item_id=item.id)
            else:
                messages.error(
                    request,
                    " Please enter a value in either IN, OUT, or Allocated Quantity.",
                )
                return redirect("update_item", item_id=item.id)

            #  Store old stock before update (for logging)
            old_stock = item.total_stock

            #  SERIAL UPDATES
            if transaction_type == "OUT":
                # Mark used serials as unavailable
                ItemSerial.objects.filter(item=item, serial_no__in=serial_numbers).update(is_available=False)
            elif transaction_type == "ALLOCATED":
                # Mark allocated serials as unavailable (reserved)
                ItemSerial.objects.filter(item=item, serial_no__in=serial_numbers).update(is_available=False)
            elif transaction_type == "IN":
                # If new serials are added, create them as available
                for sn in serial_numbers:
                    ItemSerial.objects.get_or_create(item=item, serial_no=sn, defaults={"is_available": True})

            # Create the update
            ItemUpdate.objects.create(
                item=item,
                transaction_type=transaction_type,
                quantity=quantity if transaction_type in ["IN", "OUT"] else 0,
                allocated_quantity=quantity if transaction_type == "ALLOCATED" else 0,
                date=combined_datetime,
                serial_numbers=serial_numbers if serial_numbers else None,
                location=location or None,
                remarks=remarks or None,
                dr_no=dr_no or None,
                po_supplier=po_from_supplier or None,
                po_client=po_to_client or None,
                user=request.user,
                updated_by_user=request.user.username,
            )

            # Recalculate stock for all transactions (handles backdated correctly)
            new_total, new_allocated = recalculate_item_stock(item)

            # Create transaction log
            TransactionHistory.objects.create(
                item=item,
                user=request.user,
                action_type=transaction_type.lower(),
                quantity=quantity,
                previous_stock=old_stock,
                new_stock=new_total,
                remarks=f"Manual date: {combined_datetime.date()} | {remarks or 'No remarks.'}",
            )

            messages.success(
                request,
                f" Successfully updated '{item.item_name}' ({transaction_type})!",
            )
            return redirect("inventory")

        except Exception as e:
            import traceback

            traceback.print_exc()
            messages.error(request, f" Error: {str(e)}")
            return redirect("update_item", item_id=item.id)

    return render(
        request,
        "inventory/update_item.html",
        {
            "item": item,
            "available_serials": json.dumps(available_serials),
            "today": timezone.localdate(),
        },
    )


@login_required
@user_passes_test(lambda u: u.role == "superadmin")  # Restrict to superadmins
@transaction.atomic
def delete_item(request, item_id):
    """
    Soft-delete an item from the inventory (Superadmin only).

    Marks the item as deleted instead of removing it from the database,
    ensuring data history remains accessible.
    """
    item = get_object_or_404(Item, id=item_id)

    if request.method == "POST":
        password = request.POST.get("password")
        user = authenticate(username=request.user.username, password=password)

        if user is not None:
            item.is_deleted = True
            item.save(update_fields=["is_deleted"])
            messages.success(request, f"'{item.item_name}' was deleted successfully.")
            return redirect("inventory")
        else:
            messages.error(request, " Incorrect password. Deletion cancelled.")
            return redirect("inventory")

    messages.error(request, "Invalid request method.")
    return redirect("inventory")


def parse_serials(serial_data):
    """Ensure serial_numbers from ItemUpdate are returned as a clean Python list."""
    if not serial_data:
        return []

    if isinstance(serial_data, list):
        return serial_data

    if isinstance(serial_data, str):
        try:
            import json

            data = json.loads(serial_data)
            if isinstance(data, list):
                return [s.strip() for s in data if s.strip()]
            else:
                # fallback if comma-separated string
                return [s.strip() for s in serial_data.split(",") if s.strip()]
        except json.JSONDecodeError:
            return [s.strip() for s in serial_data.split(",") if s.strip()]

    return []


@login_required
@transaction.atomic
def undo_transaction(request, update_id):
    """
    Undo a specific item transaction.

    Reverses the stock or allocation change caused by a previous ItemUpdate.
    A new ItemUpdate is logged to record the reversal.
    """
    update = get_object_or_404(ItemUpdate, id=update_id)
    item = update.item

    try:
        #  Revert IN transaction
        if update.transaction_type == "IN":
            item.total_stock = max(item.total_stock - update.quantity, 0)
            item.save(update_fields=["total_stock"])

            # Make serials unavailable again if they were added
            if update.serial_numbers:
                serials = parse_serials(update.serial_numbers)
                ItemSerial.objects.filter(item=item, serial_no__in=serials).delete()

        #  Revert OUT transaction
        elif update.transaction_type == "OUT":
            item.total_stock += update.quantity
            item.save(update_fields=["total_stock"])

            # Make serials available again
            if update.serial_numbers:
                serials = parse_serials(update.serial_numbers)
                ItemSerial.objects.filter(item=item, serial_no__in=serials).update(is_available=True)

            # If this OUT was converted from an ALLOCATE, re-enable that ALLOCATE transaction
            if update.remarks and "Converted from ALLOCATE" in update.remarks:
                import re

                match = re.search(r"ALLOCATE #(\d+)", update.remarks)
                if match:
                    allocate_id = match.group(1)
                    try:
                        allocate_txn = ItemUpdate.objects.get(id=allocate_id, transaction_type="ALLOCATED")
                        allocate_txn.is_converted = False
                        allocate_txn.save(update_fields=["is_converted"])
                    except ItemUpdate.DoesNotExist:
                        pass  # skip silently if it no longer exists

                # Also return allocated quantity to allocated pool
                item.allocated_quantity += update.quantity
                item.save(update_fields=["allocated_quantity"])

        #  Revert ALLOCATED transaction
        elif update.transaction_type == "ALLOCATED":
            item.allocated_quantity = max(item.allocated_quantity - update.allocated_quantity, 0)
            item.save(update_fields=["allocated_quantity"])

            # Make serials available again, unless this OUT came from an ALLOCATE
        if update.serial_numbers:
            serials = parse_serials(update.serial_numbers)
            if update.remarks and "Converted from ALLOCATE" in update.remarks:
                # Revert to reserved state (ALLOCATED again)
                ItemSerial.objects.filter(item=item, serial_no__in=serials).update(is_available=False)
            else:
                # Normal OUT undo — make available
                ItemSerial.objects.filter(item=item, serial_no__in=serials).update(is_available=True)

        # Delete the reverted transaction
        update.undone = True
        update.save(update_fields=["undone"])
        # Log in transaction history
        TransactionHistory.objects.create(
            item=item,
            user=request.user,
            action_type="undo",
            quantity=update.quantity or update.allocated_quantity,
            previous_stock=item.total_stock,
            new_stock=item.total_stock,
            remarks=f"Reverted {update.transaction_type} transaction (ID: {update_id})",
        )

        messages.success(request, f" {update.transaction_type} transaction successfully reverted.")
        return redirect("item_history", item_id=item.id)

    except Exception as e:
        import traceback

        traceback.print_exc()
        messages.error(request, f" Failed to revert: {str(e)}")
        return redirect("item_history", item_id=item.id)


@login_required
def transaction_history_view(request, item_id):
    """
    Show the full transaction history for a given item.

    Displays all ItemUpdate records, including undo or conversion actions,
    for better traceability of item stock changes.
    """

    item = get_object_or_404(Item, id=item_id)
    history = item.transactions.order_by("-timestamp")  # Use your related_name
    return render(
        request,
        "inventory/item_history.html",
        {
            "item": item,
            "history": history,
        },
    )


@login_required
@transaction.atomic
def convert_allocate_to_out(request, update_id):
    """
    Convert an 'Allocate' transaction into an 'Out' transaction.

    This reduces allocated stock and creates a new 'Out' ItemUpdate
    record to reflect the change.
    """
    allocate_update = get_object_or_404(ItemUpdate, id=update_id, transaction_type="ALLOCATED")
    item = allocate_update.item

    # Prevent double conversion
    if allocate_update.is_converted:
        messages.warning(request, " This ALLOCATED transaction has already been converted to OUT.")
        return redirect("item_history", item_id=item.id)

    if request.method != "POST":
        return redirect("item_history", item_id=item.id)

    try:
        # Extract allocation details
        quantity = allocate_update.allocated_quantity or 0
        serials = []
        if allocate_update.serial_numbers:
            if isinstance(allocate_update.serial_numbers, str):
                try:
                    serials = json.loads(allocate_update.serial_numbers)
                except json.JSONDecodeError:
                    serials = [s.strip() for s in allocate_update.serial_numbers.split(",") if s.strip()]
            elif isinstance(allocate_update.serial_numbers, list):
                serials = allocate_update.serial_numbers

        # Create OUT transaction (do NOT manually touch item totals here)
        ItemUpdate.objects.create(
            item=item,
            transaction_type="OUT",
            quantity=quantity,
            allocated_quantity=0,
            serial_numbers=serials or None,
            date=timezone.now(),
            location=allocate_update.location,
            remarks=f"Converted from ALLOCATED #{allocate_update.id}",
            dr_no=allocate_update.dr_no,
            po_supplier=allocate_update.po_supplier,
            po_client=allocate_update.po_client,
            user=request.user,
            updated_by_user=request.user.username,
        )

        # Mark the allocate as converted
        allocate_update.is_converted = True
        allocate_update.save(update_fields=["is_converted"])

        # Mark serials unavailable if any
        if serials:
            ItemSerial.objects.filter(item=item, serial_no__in=serials).update(is_available=False)

        #  Canonical recalculation of item totals
        # Walk all non-undone updates in chronological order and recompute
        total = 0
        allocated = 0
        updates_qs = item.updates.filter(undone=False).order_by("date")

        for u in updates_qs:
            if u.transaction_type == "IN":
                total += u.quantity or 0
            elif u.transaction_type == "OUT":
                total -= u.quantity or 0
            elif u.transaction_type == "ALLOCATED":
                # Only count allocations that are NOT converted to OUT
                if not getattr(u, "is_converted", False):
                    allocated += u.allocated_quantity or 0

            # keep non-negative running totals
            total = max(total, 0)
            allocated = max(allocated, 0)

            # update snapshot fields per-update (helpful for auditing)
            u.stock_after_transaction = total
            u.allocated_after_transaction = allocated
            u.save(update_fields=["stock_after_transaction", "allocated_after_transaction"])

        # Persist canonical totals on Item
        item.total_stock = total
        item.allocated_quantity = allocated
        item.date_last_modified = timezone.now()
        item.save(update_fields=["total_stock", "allocated_quantity", "date_last_modified"])

        # Log conversion in TransactionHistory (previous vs new stock)
        TransactionHistory.objects.create(
            item=item,
            user=request.user,
            action_type="out",
            quantity=quantity,
            previous_stock=total + quantity,  # before deduction (approx)
            new_stock=total,
            remarks=f"Converted from ALLOCATED (ID: {allocate_update.id})",
        )

        messages.success(request, " ALLOCATED transaction converted to OUT successfully!")
        return redirect("item_history", item_id=item.id)

    except Exception as e:
        traceback.print_exc()
        messages.error(request, f" Failed to convert: {str(e)}")
        return redirect("item_history", item_id=item.id)


def search_by_po(request):
    """
    Search inventory transactions by Purchase Order (PO) number.

    This view allows users to filter ItemUpdate records by supplier PO or client PO.
    """
    return render(request, "inventory/search_po.html")


def ajax_search_po(request):
    """
    Handle AJAX requests for searching Purchase Orders.

    Returns a partial HTML snippet (`po_table_rows.html`) containing
    filtered ItemUpdate results for dynamic frontend updates.
    """
    query = request.GET.get("q", "").strip()
    updates = []

    if query:
        updates = (
            ItemUpdate.objects.filter(Q(po_supplier__icontains=query) | Q(po_client__icontains=query) | Q(dr_no__icontains=query))
            .filter(Q(po_supplier__gt="") | Q(po_client__gt=""))
            .select_related("item", "user")
            .order_by("-date")
        )

    html = render_to_string("inventory/po_table_rows.html", {"updates": updates, "query": query})
    return JsonResponse({"html": html})
