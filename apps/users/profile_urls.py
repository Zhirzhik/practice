from django.urls import path
from .api import profile_api, upload_avatar, manage_resume

urlpatterns = [
    path('', profile_api, name='api_profile'),
    path('avatar/', upload_avatar, name='api_upload_avatar'),
    path('resume/', manage_resume, name='api_manage_resume'),
]