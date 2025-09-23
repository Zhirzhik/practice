class JobManager {
    constructor() {
        this.csrfToken = this.getCSRFToken();
        this.appliedJobs = new Set();
        this.initEventListeners();
        this.loadAppliedJobs();
    }

    getCSRFToken() {
        const tokenInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return (tokenInput && tokenInput.value) ? tokenInput.value : '';
    }

    initEventListeners() {
        // Поиск и фильтрация
        const jobSearch = document.getElementById('jobSearch');
        const jobFilter = document.getElementById('jobFilter');

        if (jobSearch && jobFilter) {
            jobSearch.addEventListener('input', this.filterJobs.bind(this));
            jobFilter.addEventListener('change', this.filterJobs.bind(this));
        }

        // Обработка откликов
        document.addEventListener('click', this.handleApplyClick.bind(this));
    }

    async loadAppliedJobs() {
        if (!window.auth.isAuthenticated()) return;

        try {
            const response = await fetch('/api/jobs/applied/');
            if (response.ok) {
                const appliedJobs = await response.json();
                this.appliedJobs = new Set(appliedJobs);
                this.updateApplyButtons();
            }
        } catch (error) {
            console.error('Error loading applied jobs:', error);
        }
    }

    async applyForJob(jobId) {
        if (!window.auth.isAuthenticated()) return false;

        try {
            const response = await fetch(`/api/jobs/${jobId}/apply/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.csrfToken
                }
            });

            if (response.ok) {
                this.appliedJobs.add(jobId);
                this.updateApplyButtons();
                this.showNotification('Отклик успешно отправлен!', 'success');
                return true;
            } else {
                const data = await response.json();
                this.showNotification(data.error || 'Ошибка отправки отклика', 'error');
                return false;
            }
        } catch (error) {
            this.showNotification('Ошибка сети', 'error');
            return false;
        }
    }

    handleApplyClick(e) {
        if (e.target.classList.contains('apply-btn-guest')) {
            e.preventDefault();
            this.showGuestPrompt();
            return;
        }

        if (e.target.classList.contains('btn-primary') && e.target.closest('.job-card')) {
            const jobId = parseInt(e.target.dataset.jobId);
            if (jobId) {
                this.applyForJob(jobId);
            }
        }
    }

    showGuestPrompt() {
        this.showNotification('Войдите в систему чтобы откликнуться на вакансию', 'info');

        // Показываем сообщение на карточке
        const card = event.target.closest('.job-card-guest');
        if (card) {
            card.style.zIndex = '10';
            card.style.boxShadow = '0 0 0 2px var(--primary)';
            setTimeout(() => {
                card.style.boxShadow = '';
            }, 1000);
        }
    }

    updateApplyButtons() {
        const applyButtons = document.querySelectorAll('[data-job-id]');
        applyButtons.forEach(btn => {
            const jobId = parseInt(btn.dataset.jobId);
            if (this.appliedJobs.has(jobId)) {
                btn.textContent = 'Отправлено';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-disabled');
                btn.disabled = true;
            }
        });
    }

    filterJobs() {
        const searchTerm = document.getElementById('jobSearch').value.toLowerCase();
        const filterValue = document.getElementById('jobFilter').value;

        const jobCards = document.querySelectorAll('.job-card');

        jobCards.forEach(card => {
            const title = card.querySelector('.job-card-title').textContent.toLowerCase();
            const company = card.querySelector('.job-card-company').textContent.toLowerCase();
            const description = card.querySelector('.job-card-description').textContent.toLowerCase();
            const skills = card.querySelector('.job-card-skills').textContent.toLowerCase();

            // Фильтрация по поисковому запросу
            const matchesSearch = title.includes(searchTerm) ||
                                company.includes(searchTerm) ||
                                description.includes(searchTerm) ||
                                skills.includes(searchTerm);

            // Фильтрация по выбранному фильтру
            let matchesFilter = true;
            if (filterValue === 'it') {
                matchesFilter = title.includes('разработчик') ||
                              title.includes('developer') ||
                              skills.includes('javascript') ||
                              skills.includes('python') ||
                              skills.includes('java');
            } else if (filterValue === 'design') {
                matchesFilter = title.includes('design') ||
                              title.includes('дизайн') ||
                              skills.includes('figma') ||
                              skills.includes('ui') ||
                              skills.includes('ux');
            } else if (filterValue === 'marketing') {
                matchesFilter = title.includes('маркетинг') ||
                              title.includes('marketing') ||
                              title.includes('аналитик');
            } else if (filterValue === 'remote') {
                const location = card.querySelector('.job-card-meta-item:nth-child(2) span').textContent.toLowerCase();
                matchesFilter = location.includes('удаленно') ||
                              location.includes('remote');
            }

            if (matchesSearch && matchesFilter) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
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
    window.jobManager = new JobManager();
});