from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models


class CustomUser(AbstractUser):
    """
    Custom user model extending Django's built-in AbstractUser.

    Adds additional fields such as `middle_initial`, `position`,
    `contact_no`, `generated_password`, and `role` to better suit
    organizational needs. Also includes a `first_login` flag to
    enforce password changes on initial login.
    """

    middle_initial = models.CharField(max_length=1, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    contact_no = models.CharField(
        max_length=11,
        validators=[RegexValidator(regex=r"^\d{11}$", message="Contact number must be exactly 11 digits.")],
        blank=True,
        null=True,
    )

    ROLE_CHOICES = [
        ("superadmin", "Superadmin"),
        ("admin", "Admin"),
        ("procurement", "Procurement"),
        ("inventory", "Inventory"),
        ("accounting", "Accounting"),
        ("viewer", "Viewer"),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    first_login = models.BooleanField(default=True)

    def get_full_name(self):
        """
        Return the user's full name, including middle initial if available.

        Combines `first_name`, optional `middle_initial`, and `last_name`
        into a properly formatted string.

        Returns:
            str: The user's full name (e.g., "John D. Doe").
        """
        parts = [self.first_name]
        if self.middle_initial:
            parts.append(f"{self.middle_initial}.")
        parts.append(self.last_name)
        return " ".join(part for part in parts if part)

    def __str__(self):
        """
        Return a string representation of the user.

        Returns:
            str: The username of the user.
        """
        return self.username
