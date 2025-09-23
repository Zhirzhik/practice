from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class SuccessStory(models.Model):
    CATEGORIES = [
        ('it', 'IT и технологии'),
        ('design', 'Дизайн'),
        ('business', 'Бизнес'),
        ('other', 'Другое'),
    ]
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='success_stories')
    category = models.CharField(max_length=20, choices=CATEGORIES, default='it')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_category_display(self):
        return dict(self.CATEGORIES).get(self.category, self.category)

class StoryLike(models.Model):
    story = models.ForeignKey(SuccessStory, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['story', 'user']
    
    def __str__(self):
        return f"{self.user.email} liked {self.story.title}"

class StoryComment(models.Model):
    story = models.ForeignKey(SuccessStory, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.email} on {self.story.title}"