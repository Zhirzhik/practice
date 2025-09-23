class Profile {
    constructor() {
        this.csrfToken = this.getCSRFToken();
        this.initEventListeners();
    }

    getCSRFToken() {
        const tokenInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return (tokenInput && tokenInput.value) ? tokenInput.value : '';
    }

    initEventListeners() {
        // Смена аватара
        document.getElementById('changeAvatarBtn')?.addEventListener('click', () => {
            document.getElementById('avatarInput').click();
        });

        document.getElementById('avatarInput')?.addEventListener('change', (e) => {
            this.handleAvatarUpload(e.target.files[0]);
        });

        // Загрузка резюме
        document.getElementById('uploadResumeBtn')?.addEventListener('click', () => {
            document.getElementById('resumeInput').click();
        });

        document.getElementById('resumeInput')?.addEventListener('change', (e) => {
            this.handleResumeUpload(e.target.files[0]);
        });

        // Скачивание резюме
        document.getElementById('downloadResumeBtn')?.addEventListener('click', () => {
            this.downloadResume();
        });

        // Удаление резюме
        document.getElementById('deleteResumeBtn')?.addEventListener('click', () => {
            this.deleteResume();
        });

        // Сохранение формы
        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileFromForm();
        });
    }

    async handleAvatarUpload(file) {
        if (!file || !window.auth.isAuthenticated()) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Пожалуйста, выберите изображение', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Размер файла не должен превышать 5MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('/api/profile/avatar/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.csrfToken
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                this.updateAvatarDisplay(data.avatar_url);
                this.showNotification('Аватар успешно обновлен', 'success');
            } else {
                this.showNotification('Ошибка загрузки аватара', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сети', 'error');
        }
    }

    async handleResumeUpload(file) {
        if (!file || !window.auth.isAuthenticated()) return;

        const allowedTypes = ['application/pdf', 'application/msword',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (!allowedTypes.includes(file.type)) {
            this.showNotification('Пожалуйста, выберите файл PDF или Word', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('Размер файла не должен превышать 10MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await fetch('/api/profile/resume/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.csrfToken
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                this.updateResumeDisplay(data.resume_name, data.resume_url);
                this.showNotification('Резюме успешно загружено', 'success');
            } else {
                this.showNotification('Ошибка загрузки резюме', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сети', 'error');
        }
    }

    downloadResume() {
        const resumeUrl = document.getElementById('downloadResumeBtn')?.dataset.url;
        if (resumeUrl) {
            window.open(resumeUrl, '_blank');
        }
    }

    async deleteResume() {
        if (!confirm('Удалить резюме?')) return;

        try {
            const response = await fetch('/api/profile/resume/', {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.csrfToken
                }
            });

            if (response.ok) {
                this.updateResumeDisplay(null, null);
                this.showNotification('Резюме удалено', 'success');
            } else {
                this.showNotification('Ошибка удаления резюме', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сети', 'error');
        }
    }

    async saveProfileFromForm() {
        if (!window.auth.isAuthenticated()) return;

        const profileData = {
            full_name: document.getElementById('name').value,
            university: document.getElementById('university').value,
            specialty: document.getElementById('specialty').value,
            skills: document.getElementById('skills').value.split(',').map(s => s.trim()).filter(s => s)
        };

        try {
            const response = await fetch('/api/profile/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify(profileData)
            });

            if (response.ok) {
                this.showNotification('Профиль успешно сохранен', 'success');
                this.loadProfile(); // Перезагружаем данные
            } else {
                const data = await response.json();
                this.showNotification(data.error || 'Ошибка сохранения профиля', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сети', 'error');
        }
    }

    async loadProfile() {
        if (!window.auth.isAuthenticated()) return;

        try {
            const response = await fetch('/api/profile/');
            if (response.ok) {
                const profile = await response.json();
                this.updateProfileDisplay(profile);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    updateProfileDisplay(profile) {
        if (!profile) return;

        // Обновляем поля формы
        document.getElementById('name').value = profile.full_name || '';
        document.getElementById('university').value = profile.university || '';
        document.getElementById('specialty').value = profile.specialty || '';
        document.getElementById('skills').value = profile.skills?.join(', ') || '';

        // Обновляем аватар
        if (profile.avatar_url) {
            this.updateAvatarDisplay(profile.avatar_url);
        }

        // Обновляем резюме
        this.updateResumeDisplay(profile.resume_name, profile.resume_url);

        // Обновляем заголовок
        document.getElementById('userName').textContent = profile.full_name || '';
        document.getElementById('userTitle').textContent = profile.specialty ?
            `${profile.specialty} | ${profile.university || ''}` : 'Добро пожаловать в CareerTrack!';
    }

    updateAvatarDisplay(avatarUrl) {
        const avatarImage = document.getElementById('avatarImage');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');

        if (avatarUrl) {
            avatarImage.src = avatarUrl;
            avatarImage.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
        } else {
            avatarImage.style.display = 'none';
            avatarPlaceholder.style.display = 'block';
        }
    }

    updateResumeDisplay(resumeName, resumeUrl) {
        const resumeInfo = document.getElementById('resumeInfo');
        const resumeNameSpan = document.getElementById('resumeName');
        const downloadBtn = document.getElementById('downloadResumeBtn');
        const uploadBtn = document.getElementById('uploadResumeBtn');

        if (resumeName && resumeUrl) {
            resumeNameSpan.textContent = resumeName;
            downloadBtn.dataset.url = resumeUrl;
            resumeInfo.style.display = 'flex';
            uploadBtn.textContent = 'Заменить резюме';
        } else {
            resumeInfo.style.display = 'none';
            uploadBtn.textContent = 'Загрузить резюме';
        }
    }

    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    window.profileManager = new Profile();
    
    // Загружаем профиль только если пользователь авторизован
    if (window.auth.isAuthenticated()) {
        window.profileManager.loadProfile();
    }

    // Проставляем ширину прогресс-баров из data-width
    document.querySelectorAll('.progress-fill').forEach(function(el) {
        var width = el.getAttribute('data-width');
        var numeric = parseFloat(width);
        if (isNaN(numeric) || numeric < 0) numeric = 0;
        if (numeric > 100) numeric = 100;
        el.style.width = numeric + '%';
    });
});