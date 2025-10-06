from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages

@login_required
def add_employee(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            return render(request, 'accounts/user_created.html', {
                'username': user.username,
                'password': user.generated_password
            })
    else:
        form = CustomUserCreationForm()

    return render(request, 'accounts/add_employee.html', {'form': form})
