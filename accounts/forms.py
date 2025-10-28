from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

#inherits from django built in registration
class CustomUserCreationForm(UserCreationForm):
    middle_initial = forms.CharField(max_length=1, required=False, label="Middle Initial")
    position = forms.CharField(max_length=100, required=True)
    contact_number = forms.CharField(max_length=15, required=True, label="Contact No.")

    class Meta:
        model = User
        fields = [
            "first_name",
            "middle_initial",
            "last_name",
            "position",
            "email",
            "username",
            "contact_number"
        ]

    def save(self, commit=True):
        user = super().save(commit=False)
        
        # Generate random password
        alphabet = string.ascii_letters + string.digits
        random_password = ''.join(secrets.choice(alphabet) for i in range(10))
        
        # Set password
        user.set_password(random_password)

        if commit:
            user.save()

        # ✅ Return both user and generated password 
        user.generated_password = random_password
        return user