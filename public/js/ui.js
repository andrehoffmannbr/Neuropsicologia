// UI management module
import { getCurrentUser } from './auth.js';

export function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
}

export function showMainApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    
    // Update user info
    const currentUser = getCurrentUser();
    document.getElementById('current-user-name').textContent = currentUser.name;
    const roleText = currentUser.role === 'coordinator' ? 'Coordenador' : 
                    currentUser.role === 'staff' ? 'Funcionário' : 'Estagiário';
    document.getElementById('current-user-role').textContent = `(${roleText})`;
    
    // Show/hide role-specific features
    const coordinatorElements = document.querySelectorAll('.coordinator-only');
    coordinatorElements.forEach(el => {
        const displayValue = el.classList.contains('tab-button') ? 'flex' : 'block';
        el.style.display = currentUser.role === 'coordinator' ? displayValue : 'none';
    });
    
    const internElements = document.querySelectorAll('.intern-only');
    internElements.forEach(el => {
        const displayValue = el.classList.contains('tab-button') ? 'flex' : 'block';
        el.style.display = currentUser.role === 'intern' ? displayValue : 'none';
    });

    // New: Show/hide elements for Coordinator or Staff (e.g., Client History)
    const coordinatorOrStaffElements = document.querySelectorAll('.coordinator-or-staff-only');
    coordinatorOrStaffElements.forEach(el => {
        const displayValue = el.classList.contains('tab-button') ? 'flex' : 'block';
        el.style.display = (currentUser.role === 'coordinator' || currentUser.role === 'staff') ? displayValue : 'none';
    });
}

export function switchTab(tabId) {
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabContents.forEach(content => content.classList.remove('active'));
    tabButtons.forEach(button => button.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

export function closeModal(modal) {
    modal.style.display = 'none';
}

export function updateCurrentDate() {
    const today = new Date();
    document.getElementById('current-date').textContent = today.toLocaleDateString('pt-BR');
    document.getElementById('date-selector').valueAsDate = today;
}

export function showNotification(message, type = 'info', title = null, duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const titles = {
        success: 'Sucesso',
        error: 'Erro',
        warning: 'Atenção',
        info: 'Informação'
    };

    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fa-solid ${icons[type]}"></i>
        </div>
        <div class="notification-content">
            ${title || titles[type] ? `<div class="notification-title">${title || titles[type]}</div>` : ''}
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fa-solid fa-times"></i>
        </button>
    `;

    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        closeNotification(notification);
    });

    container.appendChild(notification);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                closeNotification(notification);
            }
        }, duration);
    }
}

function closeNotification(notification) {
    notification.classList.add('removing');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}