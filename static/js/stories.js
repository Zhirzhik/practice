// stories.js - Функционал для страницы историй
class StoriesManager {
    constructor() {
        this.csrfToken = this.getCSRFToken();
        this.initEventListeners();
        this.initStoryDisplay();
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
        
        // Инициализация лайков
        this.initLikeHandlers();
        
        // Инициализация комментариев
        this.initCommentHandlers();
        
        // Инициализация формы добавления истории
        this.initAddStoryForm();
    }

    initSearch() {
        const searchInput = document.getElementById('storySearch');
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
        const filterSelect = document.getElementById('storyFilter');
        if (!filterSelect) return;

        filterSelect.addEventListener('change', () => {
            this.performFilter(filterSelect.value);
        });
    }

    performSearch(query) {
        const filterValue = document.getElementById('storyFilter').value;
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
        const searchValue = document.getElementById('storySearch').value;
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

    initLikeHandlers() {
        // Заменяем inline onclick на обработчики событий
        document.addEventListener('click', (e) => {
            if (e.target.closest('[onclick*="likeStory"]')) {
                const button = e.target.closest('[onclick*="likeStory"]');
                const storyId = this.parseOnclickArg(button.getAttribute('onclick'));
                e.preventDefault();
                this.likeStory(storyId);
            }
        });
    }

    async likeStory(storyId) {
        if (!window.auth.isAuthenticated()) {
            this.showNotification('Войдите в систему чтобы оценивать истории', 'info');
            return;
        }

        try {
            const response = await fetch(`/api/story/${storyId}/like/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.csrfToken,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Обновляем счетчик лайков
                const likesElement = document.getElementById(`likesCount${storyId}`);
                if (likesElement) {
                    likesElement.textContent = data.likes_count;
                }
                
                // Обновляем кнопку лайка
                const likeButton = document.querySelector(`[onclick*="likeStory(${storyId})"]`);
                if (likeButton) {
                    if (data.liked) {
                        likeButton.innerHTML = '<i class="fas fa-heart"></i> Убрать лайк';
                        likeButton.className = 'btn btn-small btn-danger';
                    } else {
                        likeButton.innerHTML = '<i class="fas fa-heart"></i> Нравится';
                        likeButton.className = 'btn btn-small';
                    }
                }
                
                this.showNotification(data.message, 'success');
            }
        } catch (error) {
            this.showNotification('Ошибка при оценке истории', 'error');
        }
    }

    initCommentHandlers() {
        // Обработка отправки комментариев
        const commentForms = document.querySelectorAll('.add-comment-form');
        commentForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (!window.auth.isAuthenticated()) {
                    this.showNotification('Войдите в систему чтобы комментировать', 'info');
                    return;
                }

                const formData = new FormData(form);
                const storyId = form.action.split('/').filter(part => part).pop();

                try {
                    const response = await fetch(form.action, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': this.csrfToken
                        },
                        body: formData
                    });

                    if (response.ok) {
                        form.reset();
                        this.showNotification('Комментарий добавлен', 'success');
                        
                        // Перезагружаем страницу для обновления комментариев
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        this.showNotification('Ошибка при добавлении комментария', 'error');
                    }
                } catch (error) {
                    this.showNotification('Ошибка сети', 'error');
                }
            });
        });
    }

    initAddStoryForm() {
        const addStoryForm = document.getElementById('addStoryForm');
        if (addStoryForm) {
            addStoryForm.addEventListener('submit', (e) => {
                const title = document.getElementById('storyTitle').value.trim();
                const content = document.getElementById('storyContent').value.trim();
                
                if (title.length < 10) {
                    e.preventDefault();
                    this.showNotification('Заголовок должен содержать минимум 10 символов', 'error');
                    return;
                }
                
                if (content.length < 50) {
                    e.preventDefault();
                    this.showNotification('История должна содержать минимум 50 символов', 'error');
                    return;
                }
            });
        }
    }

    initStoryDisplay() {
        // Заменяем inline onclick на обработчики событий для переключения историй
        document.addEventListener('click', (e) => {
            if (e.target.closest('[onclick*="toggleStory"]')) {
                const button = e.target.closest('[onclick*="toggleStory"]');
                const storyId = this.parseOnclickArg(button.getAttribute('onclick'));
                e.preventDefault();
                this.toggleStory(storyId);
            }
            
            if (e.target.closest('[onclick*="viewAllComments"]')) {
                const button = e.target.closest('[onclick*="viewAllComments"]');
                const storyId = this.parseOnclickArg(button.getAttribute('onclick'));
                e.preventDefault();
                this.viewAllComments(storyId);
            }
        });
    }

    // Извлекает первый аргумент из строки вида: func(arg)
    // Поддерживает числа, строки в одинарных/двойных кавычках
    parseOnclickArg(onclickStr) {
        if (!onclickStr) return '';
        const match = onclickStr.match(/\((.*)\)/);
        if (!match || match.length < 2) return '';
        let arg = match[1].split(',')[0].trim();
        if ((arg.startsWith('\'') && arg.endsWith('\'')) || (arg.startsWith('"') && arg.endsWith('"'))) {
            arg = arg.substring(1, arg.length - 1);
        }
        return arg;
    }

    toggleStory(storyId) {
        const fullStory = document.getElementById(`storyFull${storyId}`);
        const readMoreBtn = document.querySelector(`[onclick*="toggleStory(${storyId})"]`);
        
        if (fullStory && readMoreBtn) {
            if (fullStory.style.display === 'none') {
                fullStory.style.display = 'block';
                readMoreBtn.textContent = 'Свернуть';
            } else {
                fullStory.style.display = 'none';
                readMoreBtn.textContent = 'Читать полностью';
            }
        }
    }

    viewAllComments(storyId) {
        // В будущем можно реализовать загрузку всех комментариев через AJAX
        window.location.href = `/story/${storyId}/`;
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
    window.storiesManager = new StoriesManager();
});

// Глобальные функции для совместимости с inline обработчиками
window.toggleStory = function(storyId) {
    if (window.storiesManager) {
        window.storiesManager.toggleStory(storyId);
    }
};

window.likeStory = function(storyId) {
    if (window.storiesManager) {
        window.storiesManager.likeStory(storyId);
    }
};

window.viewAllComments = function(storyId) {
    if (window.storiesManager) {
        window.storiesManager.viewAllComments(storyId);
    }
};