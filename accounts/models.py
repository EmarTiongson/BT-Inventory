from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    middle_initial = models.CharField(max_length=1, blank=True, null=True)
    position = models.CharField(max_length=100)
    contact_no = models.CharField(max_length=20)
    generated_password = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.user.username} Profile"
