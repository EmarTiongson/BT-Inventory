from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.db import IntegrityError


def signup_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists. Please choose another.")
            return redirect('signup')

        first_name = request.POST.get('first_name')
        middle_initial = request.POST.get('middle_initial')
        last_name = request.POST.get('last_name')
        position = request.POST.get('position')
        email = request.POST.get('email')
        contact_no = request.POST.get('contact_no')
        generated_password = request.POST.get('generated_password')

        if not all([first_name, last_name, username, email, generated_password]):
            messages.error(request, "Please fill out all required fields.")
            return redirect('sginup')

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=generated_password,
                first_name=first_name,
                last_name=last_name,
            )
            messages.success(request, f"Account for {username} created successfully.")
            return render(request, 'accounts/user_created.html', {
                'username': username,
                'password': generated_password
            })

        except IntegrityError:
            messages.error(request, f"Username '{username}' already exists.")
            return redirect('signup')

        except Exception as e:
            messages.error(request, f"An unexpected error occurred: {str(e)}")
            return redirect('signup')

    return render(request, 'accounts/add_employee.html')
