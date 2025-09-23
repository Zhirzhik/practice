from django.urls import path
from .api import topic_list, create_topic, delete_topic, topic_detail, add_reply

urlpatterns = [
    path('topics/', topic_list, name='api_topic_list'),
    path('topics/create/', create_topic, name='api_create_topic'),
    path('topics/<int:topic_id>/', topic_detail, name='api_topic_detail'),
    path('topics/<int:topic_id>/delete/', delete_topic, name='api_delete_topic'),
    path('topics/<int:topic_id>/reply/', add_reply, name='api_add_reply'),
]