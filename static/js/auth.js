class Auth {
    constructor() {
        this.csrfToken = this.getCSRFToken();
    }

    getCSRFToken() {
        const tokenInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return (tokenInput && tokenInput.value) ? tokenInput.value : '';
    }

    async register(email, password, full_name) {
        try {
            const response = await fetch('/api/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify({
                    email,
                    password,
                    full_name
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Автоматический вход после регистрации
                return this.login(email, password);
            } else {
                return { success: false, message: data.error || 'Ошибка регистрации' };
            }
        } catch (error) {
            return { success: false, message: 'Ошибка сети' };
        }
    }

    async login(email, password) {
        try {
            const response = await fetch('/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Сохраняем информацию о пользователе
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                
                // Возврат на предыдущую страницу если есть
                const returnUrl = localStorage.getItem('returnUrl');
                if (returnUrl) {
                    localStorage.removeItem('returnUrl');
                    window.location.href = returnUrl;
                } else {
                    window.location.href = '/profile/';
                }

                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.error || 'Неверные данные' };
            }
        } catch (error) {
            return { success: false, message: 'Ошибка сети' };
        }
    }

    async logout() {
        try {
            await fetch('/api/logout/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.csrfToken
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('currentUser');
            window.location.href = '/';
        }
    }

    getCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    isAuthenticated() {
        return !!this.getCurrentUser();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/check-auth/');
            const data = await response.json();
            
            if (data.authenticated && data.user) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                return data.user;
            } else {
                localStorage.removeItem('currentUser');
                return null;
            }
        } catch (error) {
            console.error('Auth check error:', error);
            return null;
        }
    }
}

// Глобальный экземпляр
window.auth = new Auth();