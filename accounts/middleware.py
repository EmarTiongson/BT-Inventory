from django.shortcuts import redirect
from django.urls import reverse


class ForcePasswordChangeMiddleware:
    """
    Middleware that enforces password changes for first-time logins.

    This middleware checks whether an authenticated user is logging in
    for the first time (based on a `first_login` attribute). If so, it
    redirects them to a password-change page before allowing access to
    the rest of the site.

    It is executed before and after every request.
    """

    def __init__(self, get_response):
        """
        Initialize the ForcePasswordChangeMiddleware.

        Args:
            get_response (callable): The next middleware or view in the request chain.
        """
        self.get_response = get_response

    def __call__(self, request):
        """
        Process the incoming request and enforce password change for first-time users.

        - Allows unauthenticated users to access login and signup pages.
        - Skips redirect for safe paths (login, logout, first login, static, and media).
        - Redirects users with `first_login=True` to the password change page.
        - Otherwise, lets the request continue normally.

        Args:
            request (HttpRequest): The incoming HTTP request object.

        Returns:
            HttpResponse: The response returned by the next middleware or view,
            or a redirect response if a password change is required.
        """
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            return self.get_response(request)

        first_login_url = reverse("first_login_password")
        login_url = reverse("login")
        logout_url = reverse("logout")
        safe_exact = {first_login_url, login_url, logout_url}
        safe_prefixes = (
            "/static/",
            "/media/",
        )

        # Avoid redirect loop & allow static/media
        if request.path in safe_exact or any(request.path.startswith(p) for p in safe_prefixes):
            return self.get_response(request)

        # Force first-time password update
        if getattr(user, "first_login", False):
            return redirect("first_login_password")

        return self.get_response(request)
