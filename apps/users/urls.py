from django.urls import path
from .api import register, user_login, user_logout, check_auth

urlpatterns = [
    path('/api/auth/register/', register, name='api_register'),
    path('/api/auth/login/', user_login, name='api_login'),
    path('/api/auth/logout/', user_logout, name='api_logout'),
    path('check-auth/', check_auth, name='api_check_auth'),
]