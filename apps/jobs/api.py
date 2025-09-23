from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from .models import Job, JobApplication, Skill
import json

@api_view(['GET'])
@permission_classes([])
def job_list(request):
    """Список вакансий с фильтрацией и поиском"""
    search_query = request.GET.get('search', '')
    category = request.GET.get('category', 'all')
    
    jobs = Job.objects.filter(is_active=True)
    
    # Поиск
    if search_query:
        jobs = jobs.filter(
            Q(title__icontains=search_query) |
            Q(company__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(skills__name__icontains=search_query)
        ).distinct()
    
    # Фильтрация по категории
    if category != 'all':
        jobs = jobs.filter(category=category)
    
    # Получаем ID вакансий, на которые пользователь уже откликнулся
    applied_job_ids = []
    if request.user.is_authenticated:
        applied_job_ids = JobApplication.objects.filter(
            user=request.user
        ).values_list('job_id', flat=True)
    
    jobs_data = []
    for job in jobs:
        jobs_data.append({
            'id': job.id,
            'title': job.title,
            'company': job.company,
            'description': job.description,
            'salary': job.salary,
            'location': job.location,
            'experience': job.experience,
            'category': job.get_category_display(),
            'skills': [skill.name for skill in job.skills.all()],
            'posted_at': job.posted_at.strftime('%d.%m.%Y'),
            'is_applied': job.id in applied_job_ids,
        })
    
    # Статистика для главной страницы
    stats = {
        'active_jobs': Job.objects.filter(is_active=True).count(),
        'partner_companies': Job.objects.values('company').distinct().count(),
    }
    
    return Response({
        'jobs': jobs_data,
        'stats': stats
    })

@api_view(['POST'])
@login_required
def apply_job(request, job_id):
    """Отклик на вакансию"""
    try:
        job = Job.objects.get(id=job_id, is_active=True)
        
        # Проверяем, не откликался ли уже пользователь
        if JobApplication.objects.filter(job=job, user=request.user).exists():
            return Response({
                'success': False,
                'message': 'Вы уже откликнулись на эту вакансию'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Создаем отклик
        JobApplication.objects.create(job=job, user=request.user)
        
        return Response({
            'success': True,
            'message': 'Отклик успешно отправлен!'
        })
        
    except Job.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Вакансия не найдена'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@login_required
def applied_jobs(request):
    """Список вакансий, на которые пользователь откликнулся"""
    applications = JobApplication.objects.filter(user=request.user)
    applied_job_ids = [app.job_id for app in applications]
    
    return Response(applied_job_ids)

@api_view(['GET'])
def job_stats(request):
    """Статистика по вакансиям"""
    return Response({
        'active_jobs': Job.objects.filter(is_active=True).count(),
        'partner_companies': Job.objects.values('company').distinct().count(),
    })