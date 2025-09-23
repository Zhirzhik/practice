from django.contrib.auth.models import AbstractUser
from django.db import models
import os

def avatar_upload_path(instance, filename):
    return f'avatars/user_{instance.user.id}/{filename}'

def resume_upload_path(instance, filename):
    return f'resume/user_{instance.user.id}/{filename}'

class User(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to=avatar_upload_path, null=True, blank=True)
    title = models.CharField(max_length=200, blank=True)
    university = models.CharField(max_length=200, blank=True)
    skills = models.TextField(blank=True)
    resume = models.FileField(upload_to=resume_upload_path, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} Profile"

    def get_skills_list(self):
        if self.skills:
            return [skill.strip() for skill in self.skills.split(',')]
        return []