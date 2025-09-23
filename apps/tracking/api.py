from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .models import CareerExperience, CareerGoal
import json
from datetime import datetime

@api_view(['GET'])
@login_required
def experience_list(request):
    """Список опыта работы пользователя"""
    experiences = CareerExperience.objects.filter(user=request.user).order_by('-start_date')
    
    experiences_data = []
    for exp in experiences:
        experiences_data.append({
            'id': exp.id,
            'position': exp.position,
            'company': exp.company,
            'start_date': exp.start_date.strftime('%Y-%m'),
            'end_date': exp.end_date.strftime('%Y-%m') if exp.end_date else None,
            'period': f"{exp.start_date.strftime('%Y')}-{exp.end_date.strftime('%Y') if exp.end_date else 'н.в.'}",
            'description': exp.description,
        })
    
    return Response({'experiences': experiences_data})

@api_view(['POST'])
@login_required
def add_experience(request):
    """Добавление опыта работы"""
    try:
        data = json.loads(request.body)
        
        # Парсим даты
        start_date = datetime.strptime(data['start_date'], '%Y-%m').date()
        end_date = datetime.strptime(data['end_date'], '%Y-%m').date() if data.get('end_date') else None
        
        experience = CareerExperience.objects.create(
            user=request.user,
            position=data['position'],
            company=data['company'],
            start_date=start_date,
            end_date=end_date,
            description=data.get('description', '')
        )
        
        return Response({
            'success': True,
            'experience_id': experience.id,
            'message': 'Опыт работы добавлен'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Ошибка при добавлении опыта работы'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@login_required
def delete_experience(request, experience_id):
    """Удаление опыта работы"""
    try:
        experience = CareerExperience.objects.get(id=experience_id, user=request.user)
        experience.delete()
        
        return Response({'success': True})
        
    except CareerExperience.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Опыт работы не найден'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@login_required
def goal_list(request):
    """Список целей пользователя"""
    goals = CareerGoal.objects.filter(user=request.user).order_by('-created_at')
    
    goals_data = []
    for goal in goals:
        goals_data.append({
            'id': goal.id,
            'text': goal.text,
            'deadline': goal.deadline.strftime('%Y-%m-%d') if goal.deadline else None,
            'completed': goal.completed,
            'created_at': goal.created_at.strftime('%d.%m.%Y'),
        })
    
    return Response({'goals': goals_data})

@api_view(['POST'])
@login_required
def add_goal(request):
    """Добавление новой цели"""
    try:
        data = json.loads(request.body)
        
        deadline = datetime.strptime(data['deadline'], '%Y-%m-%d').date() if data.get('deadline') else None
        
        goal = CareerGoal.objects.create(
            user=request.user,
            text=data['text'],
            deadline=deadline,
            completed=False
        )
        
        return Response({
            'success': True,
            'goal_id': goal.id,
            'message': 'Цель добавлена'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Ошибка при добавлении цели'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@login_required
def toggle_goal(request, goal_id):
    """Переключение статуса цели (выполнено/не выполнено)"""
    try:
        goal = CareerGoal.objects.get(id=goal_id, user=request.user)
        goal.completed = not goal.completed
        goal.save()
        
        return Response({
            'success': True,
            'completed': goal.completed,
            'message': 'Статус цели обновлен'
        })
        
    except CareerGoal.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Цель не найдена'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@login_required
def delete_goal(request, goal_id):
    """Удаление цели"""
    try:
        goal = CareerGoal.objects.get(id=goal_id, user=request.user)
        goal.delete()
        
        return Response({'success': True})
        
    except CareerGoal.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Цель не найдена'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@login_required
def tracking_stats(request):
    """Статистика по трекингу карьеры"""
    total_experiences = CareerExperience.objects.filter(user=request.user).count()
    total_goals = CareerGoal.objects.filter(user=request.user).count()
    completed_goals = CareerGoal.objects.filter(user=request.user, completed=True).count()
    
    # Рассчитываем прогресс
    progress_percentage = 0
    if total_goals > 0:
        progress_percentage = int((completed_goals / total_goals) * 100)
    
    return Response({
        'total_experiences': total_experiences,
        'total_goals': total_goals,
        'completed_goals': completed_goals,
        'progress_percentage': progress_percentage,
    })