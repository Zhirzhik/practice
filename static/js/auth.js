class Auth {
    constructor() {
        this.csrfToken = this.getCSRFToken();
    }

    getCSRFToken() {
        const tokenInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return tokenInput ? tokenInput.value : '';
    }

    async register(email, password, full_name) {
        try {
            const response = await fetch('/api/auth/register/', {  // ВОЗВРАЩАЕМ /api/auth/
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
                return this.login(email, password);
            } else {
                return { 
                    success: false, 
                    message: data.message || 'Ошибка регистрации' 
                };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Ошибка сети' };
        }
    }

    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login/', {  // ВОЗВРАЩАЕМ /api/auth/
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

            if (response.ok && data.success) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                
                const returnUrl = localStorage.getItem('returnUrl');
                if (returnUrl) {
                    localStorage.removeItem('returnUrl');
                    window.location.href = returnUrl;
                } else {
                    window.location.href = '/profile/';
                }

                return { success: true, user: data.user };
            } else {
                return { 
                    success: false, 
                    message: data.message || 'Неверные данные' 
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Ошибка сети' };
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout/', {  // ВОЗВРАЩАЕМ /api/auth/
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

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/check-auth/');  // ВОЗВРАЩАЕМ /api/auth/
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