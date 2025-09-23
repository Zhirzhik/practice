from django.urls import path
from .api import job_list, apply_job, applied_jobs, job_stats

urlpatterns = [
    path('', job_list, name='api_job_list'),
    path('applied/', applied_jobs, name='api_applied_jobs'),
    path('stats/', job_stats, name='api_job_stats'),
    path('<int:job_id>/apply/', apply_job, name='api_apply_job'),
]