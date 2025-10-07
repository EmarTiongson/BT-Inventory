from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.db import IntegrityError

def signup_view(request):
    print("➡️ signup_view triggered:", request.method)  # Debug log

    if request.method == 'POST':
        print("📦 Form data received:", request.POST)  # Debug log

        first_name = request.POST.get('first_name')
        middle_initial = request.POST.get('middle_initial')
        last_name = request.POST.get('last_name')
        position = request.POST.get('position')
        email = request.POST.get('email')
        username = request.POST.get('username')
        contact_no = request.POST.get('contact_no')
        generated_password = request.POST.get('generated_password')

        # Simple validation
        if not all([first_name, last_name, username, email, generated_password]):
            messages.error(request, "Please fill out all required fields.")
            print("⚠️ Missing required fields")
            return render(request, 'accounts/add_employee.html')

        try:
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=generated_password,
                first_name=first_name,
                last_name=last_name,
            )

            print("✅ User created successfully:", username)

            # For future expansion — you can later create a Profile model to store these:
            # middle_initial, position, contact_no

            messages.success(request, f"Account for {username} created successfully.")
            return render(
                request,
                'accounts/user_created.html',
                {'username': username, 'password': generated_password}
            )

        except IntegrityError:
            messages.error(request, f"Username '{username}' already exists.")
            print("🚫 IntegrityError: Username already exists")
            return render(request, 'accounts/add_employee.html')

        except Exception as e:
            messages.error(request, f"An error occurred: {str(e)}")
            print("❌ Unexpected error:", e)
            return render(request, 'accounts/add_employee.html')

    # If GET request — just show the form
    print("ℹ️ Rendering empty add_employee.html form")
    return render(request, 'accounts/add_employee.html')
