// forum.js - Функционал для страницы форума
class ForumManager {
    constructor() {
        this.csrfToken = this.getCSRFToken();
        this.initEventListeners();
    }

    getCSRFToken() {
        const tokenInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return (tokenInput && tokenInput.value) ? tokenInput.value : '';
    }

    initEventListeners() {
        // Инициализация поиска
        this.initSearch();
        
        // Инициализация фильтрации
        this.initFilter();
        
        // Инициализация формы создания темы
        this.initTopicForm();
        
        // Инициализация обработчиков удаления
        this.initDeleteHandlers();
        
        // Инициализация пагинации
        this.initPagination();
    }

    initSearch() {
        const searchInput = document.getElementById('forumSearch');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 500);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(e.target.value);
            }
        });
    }

    initFilter() {
        const filterSelect = document.getElementById('forumFilter');
        if (!filterSelect) return;

        filterSelect.addEventListener('change', () => {
            this.performFilter(filterSelect.value);
        });
    }

    performSearch(query) {
        const filterValue = document.getElementById('forumFilter').value;
        const url = new URL(window.location);
        
        if (query.trim()) {
            url.searchParams.set('search', query);
        } else {
            url.searchParams.delete('search');
        }
        
        if (filterValue && filterValue !== 'all') {
            url.searchParams.set('category', filterValue);
        }
        
        window.location.href = url.toString();
    }

    performFilter(category) {
        const searchValue = document.getElementById('forumSearch').value;
        const url = new URL(window.location);
        
        if (category !== 'all') {
            url.searchParams.set('category', category);
        } else {
            url.searchParams.delete('category');
        }
        
        if (searchValue) {
            url.searchParams.set('search', searchValue);
        }
        
        window.location.href = url.toString();
    }

    initTopicForm() {
        // Заменяем inline onclick на обработчики событий
        document.addEventListener('click', (e) => {
            if (e.target.closest('[onclick*="toggleTopicForm"]')) {
                e.preventDefault();
                this.toggleTopicForm();
            }
        });

        // Валидация формы создания темы
        const topicForm = document.getElementById('topicForm');
        if (topicForm) {
            topicForm.addEventListener('submit', (e) => {
                const title = document.getElementById('topicTitle').value.trim();
                const content = document.getElementById('topicContent').value.trim();
                
                if (title.length < 5) {
                    e.preventDefault();
                    this.showNotification('Заголовок должен содержать минимум 5 символов', 'error');
                    return;
                }
                
                if (content.length < 10) {
                    e.preventDefault();
                    this.showNotification('Содержание должно содержать минимум 10 символов', 'error');
                    return;
                }
            });
        }
    }

    initDeleteHandlers() {
        // Обработка удаления тем
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-danger') && e.target.closest('form')) {
                const form = e.target.closest('form');
                if (form.action.includes('delete_topic')) {
                    e.preventDefault();
                    this.confirmDelete(form, 'Удалить тему? Это действие нельзя отменить.');
                }
            }
        });
    }

    confirmDelete(form, message) {
        if (confirm(message)) {
            form.submit();
        }
    }

    initPagination() {
        // Добавляем обработчики для пагинации
        const paginationLinks = document.querySelectorAll('.pagination a');
        paginationLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = link.href;
            });
        });
    }

    toggleTopicForm() {
        const topicForm = document.getElementById('topicForm');
        if (!topicForm) return;

        if (topicForm.style.display === 'none') {
            topicForm.style.display = 'block';
            // Прокрутка к форме
            topicForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            topicForm.style.display = 'none';
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
    window.forumManager = new ForumManager();
});

// Глобальные функции для совместимости с inline обработчиками
window.toggleTopicForm = function() {
    if (window.forumManager) {
        window.forumManager.toggleTopicForm();
    }
};

// AJAX функции для будущего расширения
window.likeTopic = async function(topicId) {
    if (!window.isAuthenticated()) {
        showNotification('Войдите в систему чтобы оценивать темы', 'info');
        return;
    }

    try {
        const response = await fetch(`/api/topic/${topicId}/like/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': window.auth.csrfToken,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Обновляем счетчик лайков
            const likesElement = document.getElementById(`topicLikes${topicId}`);
            if (likesElement) {
                likesElement.textContent = data.likes_count;
            }
            showNotification(data.message, 'success');
        }
    } catch (error) {
        showNotification('Ошибка при оценке темы', 'error');
    }
};

window.subscribeToTopic = async function(topicId) {
    if (!window.isAuthenticated()) {
        showNotification('Войдите в систему чтобы подписываться на темы', 'info');
        return;
    }

    try {
        const response = await fetch(`/api/topic/${topicId}/subscribe/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': window.auth.csrfToken,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            showNotification(data.message, 'success');
        }
    } catch (error) {
        showNotification('Ошибка при подписке на тему', 'error');
    }
};