from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import User, UserProfile
import json

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """Регистрация пользователя"""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        
        if User.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'message': 'Пользователь с таким email уже существует'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Создаем пользователя
        names = full_name.split(' ', 1) if full_name else ['', '']
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=names[0],
            last_name=names[1] if len(names) > 1 else ''
        )
        
        # Создаем профиль
        UserProfile.objects.create(user=user)
        
        # Автоматический вход после регистрации
        login(request, user)
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.get_full_name(),
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Ошибка при регистрации'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def user_login(request):
    """Аутентификация пользователя"""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            return Response({
                'success': True,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'full_name': user.get_full_name(),
                }
            })
        
        return Response({
            'success': False,
            'message': 'Неверные учетные данные'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Ошибка входа'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@login_required
def user_logout(request):
    """Выход пользователя"""
    logout(request)
    return Response({'success': True})

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def check_auth(request):
    """Проверка статуса аутентификации"""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'full_name': request.user.get_full_name(),
            }
        })
    return Response({'authenticated': False})

@api_view(['GET', 'POST'])
@login_required
def profile_api(request):
    """API для работы с профилем"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        return Response({
            'full_name': request.user.get_full_name(),
            'university': profile.university or '',
            'specialty': profile.specialty or '',
            'skills': profile.skills or '',
            'avatar_url': profile.avatar.url if profile.avatar else None,
            'resume_url': profile.resume.url if profile.resume else None,
            'resume_name': profile.resume.name.split('/')[-1] if profile.resume else None,
        })
    
    elif request.method == 'POST':
        # Обновление профиля
        data = request.data
        
        # Обновление имени пользователя
        if 'full_name' in data:
            names = data['full_name'].split(' ', 1)
            request.user.first_name = names[0] if names else ''
            request.user.last_name = names[1] if len(names) > 1 else ''
            request.user.save()
        
        # Обновление профиля
        if 'university' in data:
            profile.university = data['university']
        if 'specialty' in data:
            profile.specialty = data['specialty']
        if 'skills' in data:
            profile.skills = data['skills']
        
        profile.save()
        
        return Response({'success': True})

@api_view(['POST'])
@login_required
def upload_avatar(request):
    """Загрузка аватара"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if 'avatar' not in request.FILES:
        return Response({'error': 'Файл не найден'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Удаляем старый аватар
    if profile.avatar:
        profile.avatar.delete()
    
    # Сохраняем новый
    profile.avatar = request.FILES['avatar']
    profile.save()
    
    return Response({
        'success': True,
        'avatar_url': profile.avatar.url
    })

@api_view(['POST', 'DELETE'])
@login_required
def manage_resume(request):
    """Управление резюме"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        if 'resume' not in request.FILES:
            return Response({'error': 'Файл не найден'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Удаляем старое резюме
        if profile.resume:
            profile.resume.delete()
        
        # Сохраняем новое
        profile.resume = request.FILES['resume']
        profile.save()
        
        return Response({
            'success': True,
            'resume_url': profile.resume.url,
            'resume_name': profile.resume.name.split('/')[-1]
        })
    
    elif request.method == 'DELETE':
        if profile.resume:
            profile.resume.delete()
            profile.save()
        return Response({'success': True})