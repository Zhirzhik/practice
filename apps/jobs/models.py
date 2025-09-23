from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Job(models.Model):
    JOB_TYPES = [
        ('full_time', 'Полная занятость'),
        ('part_time', 'Частичная занятость'),
        ('remote', 'Удаленная работа'),
        ('internship', 'Стажировка'),
    ]
    
    CATEGORIES = [
        ('it', 'IT и разработка'),
        ('design', 'Дизайн'),
        ('marketing', 'Маркетинг'),
        ('business', 'Бизнес'),
    ]
    
    title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    description = models.TextField()
    salary = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    experience = models.CharField(max_length=100)
    job_type = models.CharField(max_length=20, choices=JOB_TYPES, default='full_time')
    category = models.CharField(max_length=20, choices=CATEGORIES, default='it')
    skills = models.ManyToManyField(Skill)
    posted_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.title} at {self.company}"

class JobApplication(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_applications')
    applied_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'На рассмотрении'),
        ('accepted', 'Принято'),
        ('rejected', 'Отклонено'),
    ], default='pending')
    
    class Meta:
        unique_together = ['job', 'user']
    
    def __str__(self):
        return f"{self.user.email} applied for {self.job.title}"