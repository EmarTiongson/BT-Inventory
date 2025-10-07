from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def dashboard_view(request):
    return render(request, 'app_core/dashboard.html')


@login_required
def admin_view(request):
    return render(request, 'app_core/admin.html')