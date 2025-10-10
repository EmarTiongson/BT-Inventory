from django.http import JsonResponse, HttpResponseNotAllowed
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User
from django.contrib import messages
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
import re

User = get_user_model()

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
        role = request.POST.get('role')


        if not re.fullmatch(r'^\d{11}$', contact_no or ''):
            messages.error(request, "Contact number must be exactly 11 digits.")
            return redirect('signup')

        if not all([first_name, last_name, username, email, generated_password, role]):
            messages.error(request, "Please fill out all required fields.")
            return redirect('sginup')

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=generated_password,
                first_name=first_name,
                last_name=last_name,
                middle_initial=middle_initial,
                position=position,
                contact_no=contact_no,
                generated_password=generated_password,
                role=role
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


def update_user_view(request, user_id):
    user = get_object_or_404(User, id=user_id)

    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        middle_initial = request.POST.get('middle_initial')
        last_name = request.POST.get('last_name')
        position = request.POST.get('position')
        email = request.POST.get('email')
        username = request.POST.get('username')
        contact_no = request.POST.get('contact_no')
        role = request.POST.get('role')

        # Clean and validate contact number
        if contact_no:
            contact_no = re.sub(r'\D', '', contact_no)
            if not re.match(r'^\d{11}$', contact_no):
                messages.error(request, "Contact number must be exactly 11 digits.")
                return redirect('update_user', user_id=user.id)

        # Check if username already exists (for other users)
        if User.objects.exclude(id=user.id).filter(username=username).exists():
            messages.error(request, "Username already exists. Please choose another.")
            return redirect('update_user', user_id=user.id)

        try:
            user.first_name = first_name
            user.middle_initial = middle_initial
            user.last_name = last_name
            user.position = position
            user.email = email
            user.username = username
            user.contact_no = contact_no
            user.role = role
            user.save()

            messages.success(request, f"User {username} updated successfully.")
            return redirect('admin_page')

        except IntegrityError:
            messages.error(request, "Error updating user.")
            return redirect('update_user', user_id=user.id)

    context = {'user': user}
    return render(request, 'accounts/update_user.html', context)



def delete_user(request, user_id):
    if request.method == 'DELETE':
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return JsonResponse({'success': True})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
    return HttpResponseNotAllowed(['DELETE'])