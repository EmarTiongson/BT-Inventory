from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.contrib import messages
from django.shortcuts import redirect

User = get_user_model()


@login_required
def dashboard_view(request):
    return render(request, 'app_core/dashboard.html')


@login_required
def admin_view(request):
    user = request.user

    # ✅ Block unauthorized access
    if user.role not in ["admin", "superadmin"]:
        messages.error(request, "You do not have permission to view this page.")
        return redirect("dashboard")

    # ✅ Only visible to admin/superadmin
    users = User.objects.all().order_by("id")
    context = {"users": users}
    return render(request, "app_core/admin.html", context)


@login_required
def inventory_view(request):
    users = []  # Empty for now, will show dummy data from template
    context = {
        'users': users,
    }
    return render(request, 'inventory.html', context)


@login_required
#item_id
def item_detail(request):
    # context = {
    #     'item_id': item_id,
    # }
    return render(request, 'accounts/item.html')

@login_required
#item_id
def additem_view(request):
    # context = {
    #     'item_id': item_id,
    # }
    return render(request, 'accounts/add_item.html')

@login_required
#item_id
def updateitem_view(request):
    # context = {
    #     'item_id': item_id,
    # }
    return render(request, 'accounts/update_item.html')