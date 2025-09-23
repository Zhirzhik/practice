"""
URL configuration for careertrack project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints
    # path('api/auth/', include('apps.users.urls')),
    # path('api/profile/', include('apps.users.profile_urls')),
    # path('api/jobs/', include('apps.jobs.urls')),
    # path('api/forum/', include('apps.forum.urls')),
    # path('api/stories/', include('apps.stories.urls')),
    # path('api/tracking/', include('apps.tracking.urls')),

    # Main pages
    path('', TemplateView.as_view(template_name='index.html'), name='index'),
    path('profile/', TemplateView.as_view(template_name='profile.html'), name='profile'),
    path('jobs/', TemplateView.as_view(template_name='jobs.html'), name='jobs'),
    path('forum/', TemplateView.as_view(template_name='forum.html'), name='forum'),
    path('stories/', TemplateView.as_view(template_name='stories.html'), name='stories'),
    path('tracking/', TemplateView.as_view(template_name='tracking.html'), name='tracking'),
    path('login/', TemplateView.as_view(template_name='login.html'), name='login'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)