// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
  // Проверка авторизации
  await checkAuth();

  // Инициализация компонентов
  initComponents();

  // Инициализация кнопки входа
  initAuthButton();
});

async function checkAuth() {
  const user = await window.auth.checkAuth();
  updateUIForAuthState(!!user);

  // Для всех страниц ограничиваем функционал если не авторизован
  if (!user) {
      limitFunctionality();
  }
}

function updateUIForAuthState(isAuthenticated) {
  // Обновление кнопки входа/выхода
  const authBtn = document.getElementById('authBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (authBtn) {
      if (isAuthenticated) {
          authBtn.style.display = 'none';
      } else {
          authBtn.style.display = 'flex';
          authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Войти';
          authBtn.href = '/login/';
          authBtn.className = 'auth-btn';
      }
  }

  if (logoutBtn) {
      if (isAuthenticated) {
          logoutBtn.style.display = 'flex';
          logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выйти';
          logoutBtn.className = 'auth-btn auth-btn-primary';
          // Убираем старые обработчики и добавляем новый
          logoutBtn.replaceWith(logoutBtn.cloneNode(true));
          document.getElementById('logoutBtn').addEventListener('click', function(e) {
              e.preventDefault();
              window.auth.logout();
          });
      } else {
          logoutBtn.style.display = 'none';
      }
  }
}

function limitFunctionality() {
  // Общие ограничения для всех страниц
  disableProtectedForms();
  showGuestMessages();
  setupAuthPrompts();
}

function disableProtectedForms() {
  // Отключаем формы сохранения данных
  const protectedForms = document.querySelectorAll('form:not(.search-form):not(.filter-form)');
  protectedForms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, button, select');
      inputs.forEach(input => {
          if (!input.id.includes('Search') && !input.id.includes('Filter')) {
              input.disabled = true;
              if (input.placeholder) {
                  input.placeholder = input.placeholder + ' (требуется вход)';
              }
          }
      });
  });

  // Отключаем кнопки загрузки файлов
  const fileButtons = document.querySelectorAll('#changeAvatarBtn, #uploadResumeBtn');
  fileButtons.forEach(btn => {
      btn.disabled = true;
  });
}

function showGuestMessages() {
  // Добавляем сообщения для гостей
  const guestElements = document.querySelectorAll('.guest-message');
  guestElements.forEach(el => {
      el.style.display = 'block';
  });
}

function setupAuthPrompts() {
  // Добавляем промпты для входа на кнопки действий
  const actionButtons = document.querySelectorAll('.btn-primary:not([href]), .action-btn, #changeAvatarBtn, #uploadResumeBtn');
  actionButtons.forEach(btn => {
      if (!btn.href) {
          btn.addEventListener('click', function(e) {
              if (!window.auth.isAuthenticated()) {
                  e.preventDefault();
                  e.stopPropagation();
                  showNotification('Войдите в систему чтобы выполнить это действие', 'info');

                  // Плавная прокрутка к форме входа если она есть на странице
                  const authSection = document.querySelector('.auth-prompt');
                  if (authSection) {
                      authSection.scrollIntoView({ behavior: 'smooth' });
                  }
              }
          });
      }
  });
}

function initAuthButton() {
  const authBtn = document.getElementById('authBtn');
  if (authBtn) {
      authBtn.addEventListener('click', function(e) {
          if (!window.auth.isAuthenticated()) {
              // Сохраняем текущую страницу для возврата после входа
              localStorage.setItem('returnUrl', window.location.href);
          }
      });
  }
}

function initComponents() {
  // Инициализация уведомлений
  initNotifications();

  // Анимация карточек
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
      card.classList.add('fade-in');
  });

  // Обработка сообщений Django
  initDjangoMessages();
}

function initNotifications() {
  window.showNotification = function(message, type = 'info') {
      // Создаем уведомление если его нет
      let notification = document.getElementById('notification');
      if (!notification) {
          notification = document.createElement('div');
          notification.id = 'notification';
          notification.className = 'notification';
          document.body.appendChild(notification);
      }

      notification.textContent = message;
      notification.className = 'notification ' + type;
      notification.style.display = 'block';

      setTimeout(() => {
          notification.style.display = 'none';
      }, 3000);
  };
}

function initDjangoMessages() {
  // Автоматическое скрытие сообщений Django через 5 секунд
  const messages = document.querySelectorAll('.alert, .notification');
  messages.forEach(message => {
      setTimeout(() => {
          message.style.display = 'none';
      }, 5000);
  });
}

// Глобальные функции для использования в других скриптах
window.isAuthenticated = function() {
  return window.auth.isAuthenticated();
};

window.getCurrentUser = function() {
  return window.auth.getCurrentUser();
};

window.enableProtectedFeatures = function() {
  // Включаем защищенные функции после входа
  const protectedElements = document.querySelectorAll('input, textarea, button, select');
  protectedElements.forEach(el => {
      el.disabled = false;
  });

  // Убираем сообщения для гостей
  const guestElements = document.querySelectorAll('.guest-message');
  guestElements.forEach(el => {
      el.style.display = 'none';
  });

  // Убираем режим просмотра
  const viewOnlyElements = document.querySelectorAll('.view-only');
  viewOnlyElements.forEach(el => {
      el.style.display = 'none';
  });

  // Загружаем профиль пользователя
  if (typeof window.profileManager !== 'undefined') {
      window.profileManager.loadProfile();
  }

  // Обновляем UI
  updateUIForAuthState(true);
};