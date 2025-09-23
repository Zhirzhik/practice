from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class CareerExperience(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='career_experiences')
    position = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.position} at {self.company}"

class CareerGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='career_goals')
    text = models.TextField()
    deadline = models.DateField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.text