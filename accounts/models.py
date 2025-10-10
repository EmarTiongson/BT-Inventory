from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    middle_initial = models.CharField(max_length=1, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    contact_no = models.CharField(
        max_length=11,
        validators=[
            RegexValidator(
                regex=r'^\d{11}$',
                message="Contact number must be exactly 11 digits."
            )
        ],
         blank=True,
         null=True)
    generated_password = models.CharField(max_length=50, blank=True, null=True)

    ROLE_CHOICES = [
        ('superadmin', 'Superadmin'),
        ('admin', 'Admin'),
        ('procurement', 'Procurement'),
        ('inventory', 'Inventory'),
        ('accounting', 'Accounting'),
        ('viewer', 'Viewer')
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)


    def get_full_name(self):
        parts = [self.first_name]
        if self.middle_initial:
            parts.append(f"{self.middle_initial}.")
        parts.append(self.last_name)
        return " ".join(part for part in parts if part)

    def __str__(self):
        return self.username