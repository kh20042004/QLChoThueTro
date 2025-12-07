/**
 * ===================================
 * ADMIN NOTIFICATIONS JS
 * Quản lý thông báo cho admin
 * ===================================
 */

let notificationsData = [];
let unreadCount = 0;

/**
 * Load notifications from API
 */
async function loadNotifications() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return;
    }

    try {
        const response = await fetch('/api/admin/notifications', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load notifications');
        }

        const result = await response.json();
        
        if (result.success) {
            notificationsData = result.data;
            unreadCount = result.unreadCount;
            updateNotificationBadge();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

/**
 * Update notification badge
 */
function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Toggle notification dropdown
 */
function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    
    if (!dropdown) return;
    
    const isHidden = dropdown.classList.contains('hidden');
    
    if (isHidden) {
        renderNotifications();
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
}

/**
 * Render notifications in dropdown
 */
function renderNotifications() {
    const container = document.getElementById('notificationList');
    
    if (!container) return;
    
    if (notificationsData.length === 0) {
        container.innerHTML = `
            <div class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-bell-slash text-3xl mb-2"></i>
                <p>Không có thông báo mới</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notificationsData.map(notification => `
        <a href="${notification.link}" 
           class="block px-4 py-3 hover:bg-gray-50 transition-colors ${notification.isRead ? 'opacity-75' : 'bg-pink-50'}"
           onclick="markAsRead('${notification.id}')">
            <div class="flex items-start space-x-3">
                <!-- Avatar -->
                <img src="${notification.avatar}" 
                     alt="Avatar" 
                     class="w-10 h-10 rounded-full object-cover flex-shrink-0"
                     onerror="this.src='https://aic.com.vn/avatar-fb-mac-dinh/'">
                
                <!-- Content -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <p class="text-sm font-semibold text-gray-900">${notification.title}</p>
                        ${!notification.isRead ? '<span class="w-2 h-2 bg-pink-500 rounded-full"></span>' : ''}
                    </div>
                    <p class="text-sm text-gray-600 line-clamp-2">${notification.message}</p>
                    <p class="text-xs text-gray-400 mt-1">${formatTimeAgo(notification.time)}</p>
                </div>
            </div>
        </a>
    `).join('');
}

/**
 * Mark notification as read
 */
function markAsRead(notificationId) {
    const notification = notificationsData.find(n => n.id === notificationId);
    
    if (notification && !notification.isRead) {
        notification.isRead = true;
        unreadCount = Math.max(0, unreadCount - 1);
        updateNotificationBadge();
    }
}

/**
 * Get notification icon
 */
function getNotificationIcon(type) {
    const icons = {
        'pending_property': 'fa-home',
        'new_booking': 'fa-calendar-check',
        'new_review': 'fa-star',
        'report': 'fa-flag'
    };
    return icons[type] || 'fa-bell';
}

/**
 * Format time ago
 */
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} giờ trước`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ngày trước`;
    } else {
        return date.toLocaleDateString('vi-VN');
    }
}

/**
 * Close dropdown when clicking outside
 */
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('notificationDropdown');
    const button = document.getElementById('notificationButton');
    
    if (dropdown && button && !dropdown.contains(event.target) && !button.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

/**
 * Initialize notifications
 */
document.addEventListener('DOMContentLoaded', function() {
    loadNotifications();
    
    // Refresh notifications every 30 seconds
    setInterval(loadNotifications, 30000);
});
