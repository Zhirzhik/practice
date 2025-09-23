from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Count
from django.core.paginator import Paginator
from .models import ForumTopic, TopicReply
import json

@api_view(['GET'])
@permission_classes([])
def topic_list(request):
    """Список тем форума с пагинацией"""
    search_query = request.GET.get('search', '')
    category = request.GET.get('category', 'all')
    page_number = request.GET.get('page', 1)
    
    topics = ForumTopic.objects.annotate(
        replies_count=Count('replies')
    ).select_related('author', 'author__profile')
    
    # Поиск
    if search_query:
        topics = topics.filter(
            Q(title__icontains=search_query) |
            Q(content__icontains=search_query)
        )
    
    # Фильтрация по категории
    if category != 'all':
        if category == 'recent':
            topics = topics.order_by('-created_at')
        elif category == 'popular':
            topics = topics.order_by('-views')
        else:
            topics = topics.filter(category=category)
    
    # Пагинация
    paginator = Paginator(topics, 10)  # 10 тем на страницу
    page_obj = paginator.get_page(page_number)
    
    topics_data = []
    for topic in page_obj:
        last_reply = topic.replies.order_by('-created_at').first()
        
        topics_data.append({
            'id': topic.id,
            'title': topic.title,
            'content': topic.content,
            'author': {
                'id': topic.author.id,
                'full_name': topic.author.get_full_name(),
                'avatar_url': topic.author.profile.avatar.url if topic.author.profile.avatar else None,
            },
            'category': topic.get_category_display(),
            'created_at': topic.created_at.strftime('%d.%m.%Y %H:%M'),
            'views': topic.views,
            'replies_count': topic.replies_count,
            'last_reply': {
                'created_at': last_reply.created_at.strftime('%d.%m.%Y %H:%M') if last_reply else None,
                'author_name': last_reply.author.get_full_name() if last_reply else None,
            } if last_reply else None
        })
    
    # Статистика форума
    stats = {
        'total_topics': ForumTopic.objects.count(),
        'total_posts': ForumTopic.objects.count() + TopicReply.objects.count(),
        'total_users': ForumTopic.objects.values('author').distinct().count(),
    }
    
    return Response({
        'topics': topics_data,
        'stats': stats,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
        'page_number': page_obj.number,
        'total_pages': paginator.num_pages,
    })

@api_view(['POST'])
@login_required
def create_topic(request):
    """Создание новой темы"""
    try:
        data = json.loads(request.body)
        
        topic = ForumTopic.objects.create(
            title=data['title'],
            content=data['content'],
            author=request.user,
            category=data.get('category', 'career')
        )
        
        return Response({
            'success': True,
            'topic_id': topic.id,
            'message': 'Тема успешно создана'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Ошибка при создании темы'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@login_required
def delete_topic(request, topic_id):
    """Удаление темы"""
    try:
        topic = ForumTopic.objects.get(id=topic_id)
        
        # Проверяем права доступа
        if topic.author != request.user and not request.user.is_staff:
            return Response({
                'success': False,
                'message': 'Недостаточно прав для удаления'
            }, status=status.HTTP_403_FORBIDDEN)
        
        topic.delete()
        
        return Response({'success': True})
        
    except ForumTopic.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Тема не найдена'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([])
def topic_detail(request, topic_id):
    """Детальная страница темы"""
    try:
        topic = ForumTopic.objects.get(id=topic_id)
        
        # Увеличиваем счетчик просмотров
        topic.views += 1
        topic.save()
        
        # Получаем ответы
        replies = topic.replies.select_related('author', 'author__profile')
        replies_data = []
        for reply in replies:
            replies_data.append({
                'id': reply.id,
                'text': reply.text,
                'author': {
                    'id': reply.author.id,
                    'full_name': reply.author.get_full_name(),
                    'avatar_url': reply.author.profile.avatar.url if reply.author.profile.avatar else None,
                },
                'created_at': reply.created_at.strftime('%d.%m.%Y %H:%M'),
            })
        
        topic_data = {
            'id': topic.id,
            'title': topic.title,
            'content': topic.content,
            'author': {
                'id': topic.author.id,
                'full_name': topic.author.get_full_name(),
                'avatar_url': topic.author.profile.avatar.url if topic.author.profile.avatar else None,
            },
            'category': topic.get_category_display(),
            'created_at': topic.created_at.strftime('%d.%m.%Y %H:%M'),
            'views': topic.views,
            'replies': replies_data,
        }
        
        return Response(topic_data)
        
    except ForumTopic.DoesNotExist:
        return Response({
            'error': 'Тема не найдена'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@login_required
def add_reply(request, topic_id):
    """Добавление ответа к теме"""
    try:
        data = json.loads(request.body)
        topic = ForumTopic.objects.get(id=topic_id)
        
        reply = TopicReply.objects.create(
            topic=topic,
            author=request.user,
            text=data['text']
        )
        
        return Response({
            'success': True,
            'reply_id': reply.id,
            'message': 'Ответ добавлен'
        })
        
    except ForumTopic.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Тема не найдена'
        }, status=status.HTTP_404_NOT_FOUND)