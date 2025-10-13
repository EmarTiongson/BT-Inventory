from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model

User = get_user_model()


@login_required
def dashboard_view(request):
    return render(request, 'app_core/dashboard.html')


@login_required
def admin_view(request):
        # Get all user accounts
    users = User.objects.all().order_by('id')  # sorted by ID

    context = {
        'users': users
    }
    return render(request, 'app_core/admin.html', context)


