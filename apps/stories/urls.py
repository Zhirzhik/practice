from django.urls import path
from .api import story_list, add_story, like_story, add_comment, story_detail

urlpatterns = [
    path('', story_list, name='api_story_list'),
    path('add/', add_story, name='api_add_story'),
    path('<int:story_id>/', story_detail, name='api_story_detail'),
    path('<int:story_id>/like/', like_story, name='api_like_story'),
    path('<int:story_id>/comment/', add_comment, name='api_add_comment'),
]