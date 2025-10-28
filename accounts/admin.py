from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import CustomUser


#inherit UserAdmin to get all the default user management features
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    # Fields displayed in the user list view
    list_display = (
        'username',
        'get_full_name', #function
        'email',
        'role',
        'position',
        'contact_no',
        'is_staff',
        'is_active',
    )
    list_filter = ('role', 'is_staff', 'is_active', 'is_superuser')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'position', 'role')
    ordering = ('username',)

    # Fields shown when viewing/editing a user
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {
            'fields': (
                'first_name',
                'middle_initial',
                'last_name',
                'email',
                'contact_no',
                'position',
                'role',
                'generated_password',
            )
        }),
        (_('Permissions'), {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions',
            )
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        (_('Other info'), {'fields': ('first_login',)}),
    )

    # Fields shown when adding a new user via the admin
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username',
                'password1',
                'password2',
                'first_name',
                'middle_initial',
                'last_name',
                'email',
                'contact_no',
                'position',
                'role',
                'is_active',
                'is_staff',
            ),
        }),
    )

    # Optional: makes full name searchable and sortable
    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Full Name'
