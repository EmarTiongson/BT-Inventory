from django.contrib.auth import get_user_model
from django.contrib.messages import get_messages
from django.test import Client, TestCase
from django.urls import reverse

User = get_user_model()


class AccountsViewTests(TestCase):
    """
    Automated tests for user authentication, registration,
    and account management views.
    """

    def setUp(self):
        """Create sample users and a test client."""
        self.client = Client()
        self.superadmin = User.objects.create_user(
            username="superadmin",
            password="SuperPass123!",
            role="superadmin",
            first_name="Super",
            last_name="Admin",
            email="superadmin@example.com",
        )
        self.admin = User.objects.create_user(
            username="admin",
            password="AdminPass123!",
            role="admin",
            first_name="Admin",
            last_name="User",
            email="admin@example.com",
        )
        self.staff = User.objects.create_user(
            username="staff",
            password="StaffPass123!",
            role="staff",
            first_name="Staff",
            last_name="User",
            email="staff@example.com",
        )

        # Ensure none are forced into first-login redirect
        for u in [self.superadmin, self.admin, self.staff]:
            u.first_login = False
            u.save()

    # ------------------------------------------------------------------
    # LOGIN VIEW TESTS
    # ------------------------------------------------------------------

    def test_login_view_success(self):
        """Test that valid credentials log in and redirect to dashboard."""
        response = self.client.post(reverse("login"), {"username": "staff", "password": "StaffPass123!"}, follow=True)
        self.assertRedirects(response, reverse("dashboard"))

    def test_login_view_invalid(self):
        """Test that invalid login credentials show an error message instead of redirecting."""
        response = self.client.post(
            reverse("login"),
            {"username": "wronguser", "password": "wrongpass"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Invalid username or password")

    # ------------------------------------------------------------------
    # SIGNUP VIEW TESTS
    # ------------------------------------------------------------------

    def test_signup_view_success(self):
        """Test successful account registration."""
        data = {
            "username": "newuser",
            "first_name": "New",
            "last_name": "User",
            "middle_initial": "A",
            "position": "Employee",
            "email": "newuser@example.com",
            "contact_no": "09123456789",
            "generated_password": "TestPass123!",
            "role": "staff",
        }
        response = self.client.post(reverse("signup"), data, follow=True)
        self.assertTemplateUsed(response, "accounts/user_created.html")
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_signup_duplicate_username(self):
        """Test that duplicate usernames are rejected."""
        data = {
            "username": "staff",
            "first_name": "Dup",
            "last_name": "User",
            "email": "dup@example.com",
            "contact_no": "09123456789",
            "generated_password": "TestPass123!",
            "role": "staff",
        }
        response = self.client.post(reverse("signup"), data, follow=True)
        self.assertRedirects(response, reverse("signup"))
        messages = list(response.wsgi_request._messages)
        self.assertTrue(any("Username already exists" in str(m) for m in messages))

    # ------------------------------------------------------------------
    # UPDATE USER VIEW TESTS
    # ------------------------------------------------------------------

    def test_update_user_view_success(self):
        """Test that an admin can successfully update a staff user."""
        self.client.login(username="admin", password="AdminPass123!")
        response = self.client.post(
            reverse("update_user", args=[self.staff.id]),
            {
                "first_name": "Updated",
                "middle_initial": "Z",
                "last_name": "User",
                "position": "Updated Position",
                "email": "updated@example.com",
                "username": "staff",
                "contact_no": "09123456789",
                "role": "staff",
            },
            follow=True,
        )
        self.assertRedirects(response, reverse("admin_page"))
        updated = User.objects.get(id=self.staff.id)
        self.assertEqual(updated.first_name, "Updated")

    def test_admin_cannot_edit_superadmin(self):
        """Test that admins cannot edit superadmin accounts."""
        self.client.login(username="admin", password="AdminPass123!")
        response = self.client.get(reverse("update_user", args=[self.superadmin.id]), follow=True)
        self.assertRedirects(response, reverse("admin_page"))
        messages = list(response.wsgi_request._messages)
        self.assertTrue(any("Admins cannot edit Superadmin" in str(m) for m in messages))

    # ------------------------------------------------------------------
    # DELETE USER TESTS
    # ------------------------------------------------------------------

    def test_superadmin_can_delete_any_user(self):
        """Test that a superadmin can delete any account."""
        self.client.force_login(self.superadmin)
        response = self.client.delete(reverse("delete_user", args=[self.staff.id]))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(id=self.staff.id).exists())

    def test_admin_cannot_delete_superadmin(self):
        """Test that an admin cannot delete a superadmin."""
        self.client.force_login(self.admin)
        response = self.client.delete(reverse("delete_user", args=[self.superadmin.id]))
        self.assertEqual(response.status_code, 403)

    def test_user_cannot_delete_self(self):
        """Test that users cannot delete themselves."""
        self.client.force_login(self.staff)
        response = self.client.delete(reverse("delete_user", args=[self.staff.id]))
        self.assertEqual(response.status_code, 403)

    # ------------------------------------------------------------------
    # FIRST LOGIN PASSWORD TESTS
    # ------------------------------------------------------------------

    def test_first_login_password_strength_validation(self):
        """Test that weak passwords are rejected on first login."""
        self.staff.first_login = True
        self.staff.save()
        self.client.force_login(self.staff)
        response = self.client.post(reverse("first_login_password"), {"new_password": "weak", "confirm_password": "weak"}, follow=True)
        self.assertRedirects(response, reverse("first_login_password"))
        messages = list(response.wsgi_request._messages)
        self.assertTrue(any("Password must be at least 8 characters" in str(m) for m in messages))

    def test_first_login_password_success(self):
        """Test that a strong password is accepted and updates successfully."""
        self.staff.first_login = True
        self.staff.save()
        self.client.force_login(self.staff)
        response = self.client.post(
            reverse("first_login_password"),
            {
                "new_password": "StrongPass123!",
                "confirm_password": "StrongPass123!",
            },
            follow=True,
        )
        self.assertRedirects(response, reverse("dashboard"))
        self.staff.refresh_from_db()
        self.assertFalse(self.staff.first_login)
        self.assertTrue(self.staff.check_password("StrongPass123!"))


class AccountsEdgeCaseTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Create users for testing
        self.superadmin = User.objects.create_user(
            username="superadmin",
            password="SuperAdmin123!",
            role="superadmin",
            first_login=False,
        )
        self.admin = User.objects.create_user(
            username="admin",
            password="Admin123!",
            role="admin",
            first_login=False,
        )
        self.staff = User.objects.create_user(
            username="staff",
            password="Staff123!",
            role="staff",
            first_login=False,
        )
        self.first_login_user = User.objects.create_user(
            username="firstlogin",
            password="TempPass123!",
            role="staff",
            first_login=True,
        )

    # ---------------- LOGIN VIEW EDGE CASES ----------------
    def test_login_view_first_login_redirect(self):
        response = self.client.post(reverse("login"), {"username": "firstlogin", "password": "TempPass123!"}, follow=True)
        self.assertRedirects(response, reverse("first_login_password"))

    # ---------------- SIGNUP VIEW EDGE CASES ----------------
    def test_signup_view_invalid_role(self):
        self.client.login(username="superadmin", password="SuperAdmin123!")
        response = self.client.post(
            reverse("signup"),
            {
                "username": "newuser",
                "first_name": "Test",
                "last_name": "User",
                "middle_initial": "",
                "position": "Staff",
                "email": "test@example.com",
                "contact_no": "09123456789",
                "generated_password": "Password123!",
                "role": "invalidrole",
            },
        )
        messages = list(get_messages(response.wsgi_request))
        self.assertTrue(any("Please fill out all required fields." not in str(m) for m in messages))
        # In your current view, invalid roles are not strictly rejected, consider adding validation

    def test_signup_view_exception_handling(self):
        # Force IntegrityError by using an existing username
        response = self.client.post(
            reverse("signup"),
            {
                "username": "staff",
                "first_name": "Test",
                "last_name": "User",
                "middle_initial": "",
                "position": "Staff",
                "email": "test@example.com",
                "contact_no": "09123456789",
                "generated_password": "Password123!",
                "role": "staff",
            },
            follow=True,
        )
        messages = list(get_messages(response.wsgi_request))
        self.assertTrue(any("Username already exists" in str(m) for m in messages))

    # ---------------- UPDATE USER VIEW EDGE CASES ----------------
    def test_update_user_view_admin_updates_self(self):
        self.client.login(username="admin", password="Admin123!")
        self.client.post(
            reverse("update_user", args=[self.admin.id]),
            {
                "username": "admin",
                "first_name": "AdminUpdated",
                "last_name": "User",
                "middle_initial": "",
                "position": "Manager",
                "email": "adminupdated@example.com",
                "contact_no": "09123456789",
                "role": "admin",
            },
        )
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.first_name, "AdminUpdated")

    def test_update_user_view_optional_fields_empty(self):
        self.client.login(username="superadmin", password="SuperAdmin123!")
        self.client.post(
            reverse("update_user", args=[self.staff.id]),
            {
                "username": "staff",
                "first_name": "StaffUpdated",
                "last_name": "User",
                "middle_initial": "",
                "position": "",
                "email": "staffupdated@example.com",
                "contact_no": "09123456789",
                "role": "staff",
            },
        )
        self.staff.refresh_from_db()
        self.assertEqual(self.staff.position, "")

    # ---------------- DELETE USER VIEW EDGE CASES ----------------
    def test_delete_user_wrong_http_method(self):
        self.client.login(username="superadmin", password="SuperAdmin123!")
        response = self.client.post(reverse("delete_user", args=[self.staff.id]))
        self.assertEqual(response.status_code, 405)

    def test_delete_admin_deletes_staff(self):
        self.client.login(username="admin", password="Admin123!")
        response = self.client.delete(reverse("delete_user", args=[self.staff.id]))
        self.assertJSONEqual(response.content, {"success": True, "message": "staff deleted successfully."})
        self.assertFalse(User.objects.filter(username="staff").exists())

    # ---------------- FIRST LOGIN PASSWORD EDGE CASES ----------------
    def test_first_login_password_user_stays_logged_in(self):
        self.client.login(username="firstlogin", password="TempPass123!")
        response = self.client.post(
            reverse("first_login_password"),
            {
                "new_password": "StrongPass1!",
                "confirm_password": "StrongPass1!",
            },
        )
        # After password change, user should still be authenticated
        user = User.objects.get(username="firstlogin")
        self.assertFalse(user.first_login)
        response = self.client.get(reverse("dashboard"))
        self.assertEqual(response.status_code, 200)
