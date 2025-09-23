class CareerTracker {
    constructor() {
        this.csrfToken = this.getCSRFToken();
        this.initEventListeners();
    }

    getCSRFToken() {
        const tokenInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return (tokenInput && tokenInput.value) ? tokenInput.value : '';
    }

    initEventListeners() {
        // Добавление опыта работы
        var addExpForm = document.getElementById('addExperienceForm');
        if (addExpForm) addExpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExperience();
        });

        // Добавление цели
        var addGoalForm = document.getElementById('addGoalForm');
        if (addGoalForm) addGoalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal();
        });
    }

    async addExperience() {
        if (!window.auth.isAuthenticated()) return;

        const experienceData = {
            position: document.getElementById('expTitle').value,
            company: document.getElementById('expCompany').value,
            period: document.getElementById('expPeriod').value,
            description: document.getElementById('expDescription').value
        };

        try {
            const response = await fetch('/api/experiences/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify(experienceData)
            });

            if (response.ok) {
                this.showNotification('Опыт работы добавлен', 'success');
                document.getElementById('addExperienceForm').reset();
                this.loadExperiences(); // Перезагружаем список
            } else {
                const data = await response.json();
                this.showNotification(data.error || 'Ошибка добавления опыта', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сети', 'error');
        }
    }

    async addGoal() {
        if (!window.auth.isAuthenticated()) return;

        const goalData = {
            text: document.getElementById('goalText').value,
            deadline: document.getElementById('goalDeadline').value
        };

        try {
            const response = await fetch('/api/goals/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify(goalData)
            });

            if (response.ok) {
                this.showNotification('Цель добавлена', 'success');
                document.getElementById('addGoalForm').reset();
                this.loadGoals(); // Перезагружаем список
            } else {
                const data = await response.json();
                this.showNotification(data.error || 'Ошибка добавления цели', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сети', 'error');
        }
    }

    async loadExperiences() {
        if (!window.auth.isAuthenticated()) return;

        try {
            const response = await fetch('/api/experiences/');
            if (response.ok) {
                const experiences = await response.json();
                this.displayExperiences(experiences);
            }
        } catch (error) {
            console.error('Error loading experiences:', error);
        }
    }

    async loadGoals() {
        if (!window.auth.isAuthenticated()) return;

        try {
            const response = await fetch('/api/goals/');
            if (response.ok) {
                const goals = await response.json();
                this.displayGoals(goals);
            }
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    }

    displayExperiences(experiences) {
        const timeline = document.querySelector('.timeline');
        if (!timeline) return;

        timeline.innerHTML = '';

        experiences.forEach(exp => {
            const experienceElement = `
                <div class="timeline-item">
                    <div class="timeline-date">${exp.period}</div>
                    <div class="demo-content">
                        <h3>${exp.position}</h3>
                        <p><strong>Компания:</strong> ${exp.company}</p>
                        <p><strong>Обязанности:</strong> ${exp.description}</p>
                        <button class="btn btn-small btn-danger" onclick="trackingManager.deleteExperience('${exp.id}')">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            `;
            timeline.innerHTML += experienceElement;
        });
    }

    displayGoals(goals) {
        const goalsContainer = document.querySelector('.demo-content');
        if (!goalsContainer) return;

        goalsContainer.innerHTML = '';

        goals.forEach(goal => {
            const goalElement = `
                <div class="goal-item">
                    <input type="checkbox" class="goal-checkbox" ${goal.completed ? 'checked' : ''}
                           onchange="trackingManager.toggleGoal('${goal.id}')">
                    <div class="goal-text ${goal.completed ? 'goal-completed' : ''}">
                        ${goal.text}
                        ${goal.deadline ? `<br><small>До: ${goal.deadline}</small>` : ''}
                    </div>
                    <button class="btn btn-small btn-danger" onclick="trackingManager.deleteGoal('${goal.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            goalsContainer.innerHTML += goalElement;
        });
    }

    async deleteExperience(experienceId) {
        if (!confirm('Удалить опыт работы?')) return;

        try {
            const response = await fetch(`/api/experiences/${experienceId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.csrfToken
                }
            });

            if (response.ok) {
                this.showNotification('Опыт работы удален', 'success');
                this.loadExperiences();
            } else {
                this.showNotification('Ошибка удаления опыта', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сети', 'error');
        }
    }

    async deleteGoal(goalId) {
        if (!confirm('Удалить цель?')) return;

        try {
            const response = await fetch(`/api/goals/${goalId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.csrfToken
                }
            });

            if (response.ok) {
                this.showNotification('Цель удалена', 'success');
                this.loadGoals();
            } else {
                this.showNotification('Ошибка удаления цели', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сети', 'error');
        }
    }

    async toggleGoal(goalId) {
        try {
            const response = await fetch(`/api/goals/${goalId}/toggle/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.csrfToken
                }
            });

            if (!response.ok) {
                this.showNotification('Ошибка обновления цели', 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка сети', 'error');
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
    window.trackingManager = new CareerTracker();
    
    // Загружаем данные только если пользователь авторизован
    if (window.auth.isAuthenticated()) {
        window.trackingManager.loadExperiences();
        window.trackingManager.loadGoals();
    }
});