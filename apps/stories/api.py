from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Count
from django.core.paginator import Paginator
from .models import SuccessStory, StoryLike, StoryComment
import json

@api_view(['GET'])
@permission_classes([])
def story_list(request):
    """Список историй успеха с пагинацией"""
    search_query = request.GET.get('search', '')
    category = request.GET.get('category', 'all')
    page_number = request.GET.get('page', 1)
    
    stories = SuccessStory.objects.annotate(
        likes_count=Count('likes'),
        comments_count=Count('comments')
    ).select_related('author', 'author__profile')
    
    # Поиск
    if search_query:
        stories = stories.filter(
            Q(title__icontains=search_query) |
            Q(content__icontains=search_query)
        )
    
    # Фильтрация по категории
    if category != 'all':
        if category == 'recent':
            stories = stories.order_by('-created_at')
        elif category == 'popular':
            stories = stories.order_by('-likes_count')
        else:
            stories = stories.filter(category=category)
    
    # Пагинация
    paginator = Paginator(stories, 8)  # 8 историй на страницу
    page_obj = paginator.get_page(page_number)
    
    stories_data = []
    for story in page_obj:
        # Проверяем, лайкнул ли текущий пользователь историю
        user_liked = False
        if request.user.is_authenticated:
            user_liked = StoryLike.objects.filter(story=story, user=request.user).exists()
        
        # Получаем последние комментарии
        recent_comments = story.comments.select_related('author', 'author__profile')[:3]
        comments_data = []
        for comment in recent_comments:
            comments_data.append({
                'id': comment.id,
                'text': comment.text,
                'author': {
                    'id': comment.author.id,
                    'full_name': comment.author.get_full_name(),
                    'avatar_url': comment.author.profile.avatar.url if comment.author.profile.avatar else None,
                },
                'created_at': comment.created_at.strftime('%d.%m.%Y %H:%M'),
            })
        
        stories_data.append({
            'id': story.id,
            'title': story.title,
            'content': story.content,
            'excerpt': story.content[:200] + '...' if len(story.content) > 200 else story.content,
            'author': {
                'id': story.author.id,
                'full_name': story.author.get_full_name(),
                'avatar_url': story.author.profile.avatar.url if story.author.profile.avatar else None,
            },
            'category': story.get_category_display(),
            'created_at': story.created_at.strftime('%d.%m.%Y'),
            'likes_count': story.likes_count,
            'comments_count': story.comments_count,
            'user_liked': user_liked,
            'recent_comments': comments_data,
        })
    
    return Response({
        'stories': stories_data,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
        'page_number': page_obj.number,
        'total_pages': paginator.num_pages,
    })

@api_view(['POST'])
@login_required
def add_story(request):
    """Добавление новой истории успеха"""
    try:
        data = json.loads(request.body)
        
        story = SuccessStory.objects.create(
            title=data['title'],
            content=data['content'],
            author=request.user,
            category=data.get('category', 'it')
        )
        
        return Response({
            'success': True,
            'story_id': story.id,
            'message': 'История успешно опубликована'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Ошибка при публикации истории'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@login_required
def like_story(request, story_id):
    """Лайк/анлайк истории"""
    try:
        story = SuccessStory.objects.get(id=story_id)
        
        # Проверяем, есть ли уже лайк
        like, created = StoryLike.objects.get_or_create(
            story=story,
            user=request.user
        )
        
        if not created:
            # Если лайк уже был - удаляем его (анлайк)
            like.delete()
            liked = False
            message = 'Лайк удален'
        else:
            liked = True
            message = 'История понравилась'
        
        # Обновляем счетчик лайков
        likes_count = StoryLike.objects.filter(story=story).count()
        
        return Response({
            'success': True,
            'liked': liked,
            'likes_count': likes_count,
            'message': message
        })
        
    except SuccessStory.DoesNotExist:
        return Response({
            'success': False,
            'message': 'История не найдена'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@login_required
def add_comment(request, story_id):
    """Добавление комментария к истории"""
    try:
        data = json.loads(request.body)
        story = SuccessStory.objects.get(id=story_id)
        
        comment = StoryComment.objects.create(
            story=story,
            author=request.user,
            text=data['text']
        )
        
        return Response({
            'success': True,
            'comment_id': comment.id,
            'message': 'Комментарий добавлен'
        })
        
    except SuccessStory.DoesNotExist:
        return Response({
            'success': False,
            'message': 'История не найдена'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([])
def story_detail(request, story_id):
    """Детальная страница истории"""
    try:
        story = SuccessStory.objects.get(id=story_id)
        
        # Проверяем, лайкнул ли текущий пользователь историю
        user_liked = False
        if request.user.is_authenticated:
            user_liked = StoryLike.objects.filter(story=story, user=request.user).exists()
        
        # Получаем все комментарии
        comments = story.comments.select_related('author', 'author__profile')
        comments_data = []
        for comment in comments:
            comments_data.append({
                'id': comment.id,
                'text': comment.text,
                'author': {
                    'id': comment.author.id,
                    'full_name': comment.author.get_full_name(),
                    'avatar_url': comment.author.profile.avatar.url if comment.author.profile.avatar else None,
                },
                'created_at': comment.created_at.strftime('%d.%m.%Y %H:%M'),
            })
        
        story_data = {
            'id': story.id,
            'title': story.title,
            'content': story.content,
            'author': {
                'id': story.author.id,
                'full_name': story.author.get_full_name(),
                'avatar_url': story.author.profile.avatar.url if story.author.profile.avatar else None,
            },
            'category': story.get_category_display(),
            'created_at': story.created_at.strftime('%d.%m.%Y'),
            'likes_count': story.likes.count(),
            'comments_count': story.comments.count(),
            'user_liked': user_liked,
            'comments': comments_data,
        }
        
        return Response(story_data)
        
    except SuccessStory.DoesNotExist:
        return Response({
            'error': 'История не найдена'
        }, status=status.HTTP_404_NOT_FOUND)