from django.shortcuts import redirect
from django.urls import reverse

class ForcePasswordChangeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        user = getattr(request, "user", None)

        # ✅ Let unauthenticated users pass (so login/signup still show)
        if not user or not user.is_authenticated:
            return self.get_response(request)

        # ✅ Paths that should never trigger redirect
        first_login_url = reverse("first_login_password")
        login_url = reverse("login")
        logout_url = reverse("logout")

        safe_paths = (
            first_login_url,
            login_url,
            logout_url,
            "/static/",
            "/media/",
        )

        # ✅ Skip redirect for safe paths
        if any(request.path.startswith(path) for path in safe_paths):
            return self.get_response(request)

        # ✅ Redirect first-time users to change password
        if getattr(user, "first_login", False):
            return redirect("first_login_password")

        # ✅ Otherwise, continue as normal
        return self.get_response(request)
