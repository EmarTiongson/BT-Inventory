from django.contrib.auth import views as auth_views
from django.urls import path

from . import views

#: URL patterns for the accounts app.
#: Handles authentication, user management, and password setup for first-time logins.
urlpatterns = [
    # User registration route
    path("signup/", views.signup_view, name="signup"),
    # Login route
    path("login/", views.login_view, name="login"),
    # Logout route, redirects to login after logging out
    path("logout/", auth_views.LogoutView.as_view(next_page="login"), name="logout"),
    # Update an existing user’s details by ID
    path("update-user/<int:user_id>/", views.update_user_view, name="update_user"),
    # Soft delete or remove a user by ID
    path("delete-user/<int:user_id>/", views.delete_user, name="delete_user"),
    # Enforce password change for users logging in for the first time
    path("first-login-password/", views.first_login_password, name="first_login_password"),
]
