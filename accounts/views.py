import re

from django.contrib import messages
from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    update_session_auth_hash,
)
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.http import HttpResponseNotAllowed, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

User = get_user_model()


def login_view(request):
    """
    Handle user login authentication.

    Authenticates a user based on username and password, redirects to the dashboard
    upon success, or back to the login page with an error message if authentication fails.
    If the user logs in for the first time, they are redirected to set a new password.

    Args:
        request (HttpRequest): The HTTP request object.

    Returns:
        HttpResponse: Redirects to dashboard, first login page, or re-renders the login template.
    """
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)

            if getattr(user, "first_login", False):
                return redirect("first_login_password")

            return redirect("dashboard")
        else:
            messages.error(request, "Invalid username or password.")
            return render(request, "registration/login.html")

    return render(request, "registration/login.html")


def signup_view(request):
    """
    Handle user registration for new accounts.

    Validates form data, checks for duplicate usernames, and creates a new user.
    Displays appropriate success or error messages depending on the outcome.

    Args:
        request (HttpRequest): The HTTP request object.

    Returns:
        HttpResponse: Renders signup page, confirmation page, or redirects with a message.
    """
    if request.method == "POST":
        username = request.POST.get("username")
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists. Please choose another.")
            return redirect("signup")

        first_name = request.POST.get("first_name")
        middle_initial = request.POST.get("middle_initial")
        last_name = request.POST.get("last_name")
        position = request.POST.get("position")
        email = request.POST.get("email")
        contact_no = request.POST.get("contact_no")
        generated_password = request.POST.get("generated_password")
        role = request.POST.get("role")

        if not re.fullmatch(r"^\d{11}$", contact_no or ""):
            messages.error(request, "Contact number must be exactly 11 digits.")
            return redirect("signup")

        if not all([first_name, last_name, username, email, generated_password, role]):
            messages.error(request, "Please fill out all required fields.")
            return redirect("signup")

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
                role=role,
            )

            user.first_login = True
            user.save()
            messages.success(request, f"Account for {username} created successfully.")
            return render(
                request,
                "accounts/user_created.html",
                {"username": username, "password": generated_password},
            )

        except IntegrityError:
            messages.error(request, f"Username '{username}' already exists.")
            return redirect("signup")

        except Exception as e:
            messages.error(request, f"An unexpected error occurred: {str(e)}")
            return redirect("signup")

    return render(request, "accounts/add_employee.html")


def update_user_view(request, user_id):
    """
    Handle updating user account information.

    Allows modification of user details such as name, contact number, position, and role.
    Enforces role-based restrictions to prevent admins from modifying superadmin accounts.

    Args:
        request (HttpRequest): The HTTP request object.
        user_id (int): The ID of the user to update.

    Returns:
        HttpResponse: Redirects or renders the update form depending on request method.
    """
    user = get_object_or_404(User, id=user_id)
    current_user = request.user

    if current_user.role == "admin" and user.role == "superadmin":
        messages.error(request, "Admins cannot edit Superadmin accounts.")
        return redirect("admin_page")

    if request.method == "POST":
        first_name = request.POST.get("first_name")
        middle_initial = request.POST.get("middle_initial")
        last_name = request.POST.get("last_name")
        position = request.POST.get("position")
        email = request.POST.get("email")
        username = request.POST.get("username")
        contact_no = request.POST.get("contact_no")
        role = request.POST.get("role")

        if current_user.role == "admin" and role == "superadmin":
            messages.error(request, "Admins cannot assign the Superadmin role.")
            return redirect("update_user", user_id=user.id)

        if contact_no:
            contact_no = re.sub(r"\D", "", contact_no)
            if not re.match(r"^\d{11}$", contact_no):
                messages.error(request, "Contact number must be exactly 11 digits.")
                return redirect("update_user", user_id=user.id)

        if User.objects.exclude(id=user.id).filter(username=username).exists():
            messages.error(request, "Username already exists. Please choose another.")
            return redirect("update_user", user_id=user.id)

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
            return redirect("admin_page")

        except IntegrityError:
            messages.error(request, "Error updating user.")
            return redirect("update_user", user_id=user.id)

    context = {"user": user}
    return render(request, "accounts/update_user.html", context)


def delete_user(request, user_id):
    """
    Handle user deletion requests.

    Supports only DELETE HTTP requests. Enforces role-based permissions:
    - Superadmins can delete anyone.
    - Admins cannot delete Superadmins.
    - Users cannot delete themselves.

    Args:
        request (HttpRequest): The HTTP request object.
        user_id (int): The ID of the user to delete.

    Returns:
        JsonResponse: JSON response indicating success or failure.
    """
    if request.method != "DELETE":
        return HttpResponseNotAllowed(["DELETE"])

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found"}, status=404)

    current_user = request.user

    if current_user.id == target_user.id:
        return JsonResponse(
            {"success": False, "error": "You cannot delete your own account."},
            status=403,
        )

    if current_user.role == "superadmin":
        target_user.delete()
        return JsonResponse(
            {
                "success": True,
                "message": f"{target_user.username} deleted successfully.",
            }
        )

    elif current_user.role == "admin":
        if target_user.role == "superadmin":
            return JsonResponse(
                {
                    "success": False,
                    "error": "Admins cannot delete Superadmin accounts.",
                },
                status=403,
            )
        else:
            target_user.delete()
            return JsonResponse(
                {
                    "success": True,
                    "message": f"{target_user.username} deleted successfully.",
                }
            )


@login_required
def first_login_password(request):
    """
    Handle password setup for first-time logins.

    Forces users logging in for the first time to set a new password.
    Validates the password for strength (length, uppercase, lowercase,
    digit, and special character), and ensures both password fields match.

    Args:
        request (HttpRequest): The HTTP request object.

    Returns:
        HttpResponse: Redirects to dashboard upon success or re-renders the form with errors.
    """
    if request.method == "POST":
        new_password = request.POST.get("new_password")
        confirm_password = request.POST.get("confirm_password")

        # Check if fields are filled
        if not new_password or not confirm_password:
            messages.error(request, "Please fill in both password fields.")
            return redirect("first_login_password")

        # Check if passwords match
        if new_password != confirm_password:
            messages.error(request, "Passwords do not match.")
            return redirect("first_login_password")

        try:
            # Use Django’s built-in validators
            validate_password(new_password, request.user)

        except ValidationError as e:
            # Convert list of errors into a readable string
            messages.error(request, " ".join(e.messages))
            return redirect("first_login_password")

        user = request.user
        user.set_password(new_password)
        user.first_login = False
        user.save()

        update_session_auth_hash(request, user)
        messages.success(request, "Password successfully updated.")
        return redirect("dashboard")

    return render(request, "accounts/confirm_pass.html")
