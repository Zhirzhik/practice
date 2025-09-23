from django.urls import path
from .api import register, user_login, user_logout, check_auth

urlpatterns = [
    path('register/', register, name='api_register'),
    path('login/', user_login, name='api_login'),
    path('logout/', user_logout, name='api_logout'),
    path('check-auth/', check_auth, name='api_check_auth'),
]