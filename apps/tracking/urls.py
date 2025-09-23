from django.urls import path
from .api import (experience_list, add_experience, delete_experience,
                 goal_list, add_goal, toggle_goal, delete_goal, tracking_stats)

urlpatterns = [
    path('experiences/', experience_list, name='api_experience_list'),
    path('experiences/add/', add_experience, name='api_add_experience'),
    path('experiences/<int:experience_id>/delete/', delete_experience, name='api_delete_experience'),
    
    path('goals/', goal_list, name='api_goal_list'),
    path('goals/add/', add_goal, name='api_add_goal'),
    path('goals/<int:goal_id>/toggle/', toggle_goal, name='api_toggle_goal'),
    path('goals/<int:goal_id>/delete/', delete_goal, name='api_delete_goal'),
    
    path('stats/', tracking_stats, name='api_tracking_stats'),
]