from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('signup/', views.signup_view, name='signup'), 
    path('login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    path('update-user/<int:user_id>/', views.update_user_view, name='update_user'),
    path('delete-user/<int:user_id>/', views.delete_user, name='delete_user'),
    path('first-login-password/', views.first_login_password, name='first_login_password'),
    path('inventory/', views.inventory_view, name='inventory'),

]
