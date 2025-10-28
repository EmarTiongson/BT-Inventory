from __future__ import annotations

import secrets
import string

from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User


class CustomUserCreationForm(UserCreationForm):
    """
    Custom user creation form that extends Django's built-in UserCreationForm.

    Adds additional fields for middle initial, position, and contact number.
    Automatically generates a random password when a user is created.
    """

    middle_initial = forms.CharField(max_length=1, required=False, label="Middle Initial")
    position = forms.CharField(max_length=100, required=True)
    contact_number = forms.CharField(max_length=15, required=True, label="Contact No.")

    class Meta:
        """
        Metadata for the CustomUserCreationForm.

        Specifies the model to use (User) and the fields that appear in the form.
        """

        model = User
        fields = [
            "first_name",
            "middle_initial",
            "last_name",
            "position",
            "email",
            "username",
            "contact_number",
        ]

    def save(self, commit: bool = True) -> User:
        """
        Save a new user instance with an automatically generated password.

        This method overrides the default save() behavior to assign a random
        password to the new user before saving it to the database.

        Args:
            commit (bool): Whether to save the user instance to the database. Defaults to True.

        Returns:
            User: The newly created user instance, with an additional `generated_password`
            attribute for reference.
        """
        user = super().save(commit=False)

        # Generate random password
        alphabet = string.ascii_letters + string.digits
        random_password = "".join(secrets.choice(alphabet) for i in range(10))

        # Set and save password
        user.set_password(random_password)
        if commit:
            user.save()

        # Attach the generated password for later reference
        user.generated_password = random_password
        return user
