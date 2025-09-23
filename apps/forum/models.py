from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ForumTopic(models.Model):
    CATEGORIES = [
        ('career', 'Карьера'),
        ('study', 'Учеба'),
        ('interview', 'Собеседования'),
        ('other', 'Другое'),
    ]
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_topics')
    category = models.CharField(max_length=20, choices=CATEGORIES, default='career')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    views = models.PositiveIntegerField(default=0)
    is_pinned = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_category_display(self):
        return dict(self.CATEGORIES).get(self.category, self.category)

class TopicReply(models.Model):
    topic = models.ForeignKey(ForumTopic, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_replies')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Reply by {self.author.email} on {self.topic.title}"