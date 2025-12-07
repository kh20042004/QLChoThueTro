// Notification Page JavaScript
let currentPage = 1;
let currentFilter = 'all'; // all, unread, read
let isLoading = false;
let hasMorePages = true;
let currentNotificationData = null; // For modal details

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login.html';
        return;
    }

    // Initialize
    initializeNotifications();
    setupEventListeners();
    setupSocketListeners();
});

function initializeNotifications() {
    loadNotifications();
    updateUnreadCount();
}

function setupEventListeners() {
    // Filter tabs
    const filterButtons = document.querySelectorAll('.filter-tab');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Change filter and reload
            currentFilter = this.dataset.filter;
            currentPage = 1;
            hasMorePages = true;
            document.getElementById('notifications-list').innerHTML = '';
            loadNotifications();
        });
    });

    // Mark all as read button
    const markAllReadBtn = document.getElementById('mark-all-read-btn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllAsRead);
    }

    // Infinite scroll
    window.addEventListener('scroll', function() {
        if (isLoading || !hasMorePages) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.documentElement.scrollHeight;
        
        if (scrollPosition >= pageHeight - 500) {
            currentPage++;
            loadNotifications(true);
        }
    });

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            currentPage = 1;
            hasMorePages = true;
            document.getElementById('notifications-list').innerHTML = '';
            loadNotifications();
        });
    }
}

function setupSocketListeners() {
    // Listen for new notifications via Socket.IO
    if (window.socket) {
        window.socket.on('notification:new', function(notification) {
            // Add to top of list if current filter allows it
            if (currentFilter === 'all' || (currentFilter === 'unread' && !notification.isRead)) {
                prependNotification(notification);
            }
            
            // Update unread count
            updateUnreadCount();
            
            // Show toast notification
            showToast(notification.title, notification.message);
            
            // Update page title
            updatePageTitle();
        });

        window.socket.on('notification:read', function(data) {
            // Update notification UI
            const notificationElement = document.querySelector(`[data-notification-id="${data.notificationId}"]`);
            if (notificationElement) {
                notificationElement.classList.remove('unread');
                const unreadBadge = notificationElement.querySelector('.unread-badge');
                if (unreadBadge) {
                    unreadBadge.remove();
                }
            }
            
            // Update unread count
            updateUnreadCount();
            updatePageTitle();
        });

        window.socket.on('notification:deleted', function(data) {
            // Remove from UI
            const notificationElement = document.querySelector(`[data-notification-id="${data.notificationId}"]`);
            if (notificationElement) {
                notificationElement.remove();
                checkEmptyState();
            }
        });
    }
}

async function loadNotifications(append = false) {
    if (isLoading) return;
    
    isLoading = true;
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) loadingEl.style.display = 'block';

    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20,
            filter: currentFilter
        });

        const response = await fetch(`/api/notifications?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/auth/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to load notifications');
        }

        const result = await response.json();
        
        // Check response format
        if (!result.success || !result.data) {
            throw new Error('Invalid response format');
        }

        const notifications = result.data;
        const pagination = result.pagination;
        
        // Check if there are more pages
        hasMorePages = pagination.page < pagination.pages;
        
        // Render notifications
        const container = document.getElementById('notifications-list');
        if (!append) {
            container.innerHTML = '';
        }
        
        if (notifications.length === 0 && currentPage === 1) {
            showEmptyState();
        } else {
            notifications.forEach(notification => {
                container.appendChild(createNotificationElement(notification));
            });
        }

        // Update stats
        const unreadCount = await getUnreadCountFromAPI();
        updateStats(pagination.total, unreadCount);

    } catch (error) {
        console.error('Error loading notifications:', error);
        showError('Không thể tải thông báo. Vui lòng thử lại.');
    } finally {
        isLoading = false;
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

function createNotificationElement(notification) {
    const div = document.createElement('div');
    div.className = `notification-item ${notification.isRead ? 'read' : 'unread'}`;
    div.dataset.notificationId = notification._id;
    
    // Store full notification data
    div.dataset.notificationData = JSON.stringify(notification);
    
    const typeIcon = getTypeIcon(notification.type);
    // Use timeAgo from server if available, otherwise calculate it
    const timeAgo = notification.timeAgo || formatTimeAgo(notification.createdAt);
    
    div.innerHTML = `
        <div class="flex items-start gap-4">
            <div class="notification-icon ${notification.type}">
                <i class="${typeIcon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-header">
                    <h4 class="notification-title">
                        ${notification.title}
                        ${!notification.isRead ? '<span class="unread-badge"></span>' : ''}
                    </h4>
                    <span class="notification-time">${timeAgo}</span>
                </div>
                <p class="notification-message">${notification.message}</p>
                ${notification.link ? `<a href="${notification.link}" class="notification-link" onclick="event.stopPropagation()">Xem chi tiết <i class="fas fa-arrow-right"></i></a>` : ''}
            </div>
            <div class="notification-actions">
                ${!notification.isRead ? `<button class="btn-icon" onclick="event.stopPropagation(); markNotificationAsRead('${notification._id}')" title="Đánh dấu đã đọc">
                    <i class="fas fa-check"></i>
                </button>` : ''}
                <button class="btn-icon" onclick="event.stopPropagation(); deleteNotification('${notification._id}')" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    // Click to show detail modal
    div.addEventListener('click', function(e) {
        // Don't trigger if clicking action buttons or links
        if (e.target.closest('.notification-actions') || e.target.closest('.notification-link')) return;
        
        showNotificationDetail(notification);
    });

    return div;
}

function prependNotification(notification) {
    const container = document.getElementById('notifications-list');
    const emptyState = container.querySelector('.empty-state');
    
    if (emptyState) {
        emptyState.remove();
    }
    
    const element = createNotificationElement(notification);
    container.insertBefore(element, container.firstChild);
    
    // Add animation
    element.style.animation = 'slideInDown 0.5s ease-out';
}

function getTypeIcon(type) {
    const icons = {
        'booking_confirmed': 'fas fa-check-circle',
        'booking_cancelled': 'fas fa-times-circle',
        'message_received': 'fas fa-envelope',
        'property_expired': 'fas fa-clock',
        'property_approved': 'fas fa-thumbs-up',
        'review_approved': 'fas fa-star',
        'review_rejected': 'fas fa-ban',
        'review_pending': 'fas fa-hourglass-half',
        'system': 'fas fa-bell'
    };
    return icons[type] || 'fas fa-bell';
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
}

async function markNotificationAsRead(notificationId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to mark as read');
        }

        // Update UI
        const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (notificationElement) {
            notificationElement.classList.remove('unread');
            notificationElement.classList.add('read');
            const unreadBadge = notificationElement.querySelector('.unread-badge');
            if (unreadBadge) {
                unreadBadge.remove();
            }
        }

        // Update counts
        updateUnreadCount();
        updatePageTitle();

    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllAsRead() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/notifications/read-all', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to mark all as read');
        }

        // Update all UI elements
        const unreadNotifications = document.querySelectorAll('.notification-item.unread');
        unreadNotifications.forEach(notification => {
            notification.classList.remove('unread');
            notification.classList.add('read');
            const unreadBadge = notification.querySelector('.unread-badge');
            if (unreadBadge) {
                unreadBadge.remove();
            }
        });

        // Update counts
        updateUnreadCount();
        updatePageTitle();
        
        showSuccess('Đã đánh dấu tất cả là đã đọc');

    } catch (error) {
        console.error('Error marking all as read:', error);
        showError('Không thể đánh dấu tất cả là đã đọc');
    }
}

async function deleteNotification(notificationId) {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete notification');
        }

        // Remove from UI
        const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (notificationElement) {
            notificationElement.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                notificationElement.remove();
                checkEmptyState();
            }, 300);
        }

        showSuccess('Đã xóa thông báo');

    } catch (error) {
        console.error('Error deleting notification:', error);
        showError('Không thể xóa thông báo');
    }
}

async function updateUnreadCount() {
    try {
        const count = await getUnreadCountFromAPI();
        
        // Update notification badge in header
        const notificationBadge = document.getElementById('notificationBadge');
        if (notificationBadge) {
            if (count > 0) {
                notificationBadge.textContent = count > 99 ? '99+' : count;
                notificationBadge.style.display = 'flex';
            } else {
                notificationBadge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error updating unread count:', error);
    }
}

async function getUnreadCountFromAPI() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/notifications/unread-count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            return result.success ? result.data : 0;
        }
        return 0;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
}

function updateStats(total, unread) {
    const totalEl = document.getElementById('total-notifications');
    const unreadEl = document.getElementById('unread-notifications');
    
    if (totalEl) totalEl.textContent = total;
    if (unreadEl) unreadEl.textContent = unread;
}

function updatePageTitle() {
    updateUnreadCount().then(() => {
        const badge = document.querySelector('.notification-badge');
        if (badge && badge.style.display !== 'none') {
            const count = badge.textContent;
            document.title = `(${count}) Thông báo - HomeRent`;
        } else {
            document.title = 'Thông báo - HomeRent';
        }
    });
}

function checkEmptyState() {
    const container = document.getElementById('notifications-list');
    if (container.children.length === 0) {
        showEmptyState();
    }
}

function showEmptyState() {
    const container = document.getElementById('notifications-list');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-bell-slash"></i>
            <h3>Không có thông báo</h3>
            <p>${currentFilter === 'unread' ? 'Bạn đã đọc hết tất cả thông báo' : 'Chưa có thông báo nào'}</p>
        </div>
    `;
}

function showToast(title, message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-bell"></i>
        </div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(toast);

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    });

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function showSuccess(message) {
    showToast('Thành công', message);
}

function showError(message) {
    showToast('Lỗi', message);
}

// Export functions for global use
window.markNotificationAsRead = markNotificationAsRead;
window.deleteNotification = deleteNotification;

// ===================================
// NOTIFICATION DETAIL MODAL FUNCTIONS
// ===================================

function showNotificationDetail(notification) {
    currentNotificationData = notification;
    const modal = document.getElementById('notificationDetailModal');
    
    // Set icon
    const iconEl = document.getElementById('modalNotificationIcon');
    iconEl.className = `notification-icon ${notification.type} w-16 h-16 text-2xl`;
    iconEl.innerHTML = `<i class="${getTypeIcon(notification.type)}"></i>`;
    
    // Set title and time
    document.getElementById('modalNotificationTitle').textContent = notification.title;
    const timeAgo = notification.timeAgo || formatTimeAgo(notification.createdAt);
    document.getElementById('modalNotificationTime').textContent = timeAgo;
    
    // Set badge
    const badgeEl = document.getElementById('modalNotificationBadge');
    if (notification.isRead) {
        badgeEl.textContent = 'Đã đọc';
        badgeEl.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-700';
    } else {
        badgeEl.textContent = 'Chưa đọc';
        badgeEl.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700';
    }
    
    // Set message
    document.getElementById('modalNotificationMessage').textContent = notification.message;
    
    // Handle notification data
    const dataContainer = document.getElementById('modalNotificationData');
    const dataContent = document.getElementById('modalNotificationDataContent');
    if (notification.data && Object.keys(notification.data).length > 0) {
        dataContainer.classList.remove('hidden');
        let dataHTML = '';
        
        // Display relevant data fields
        for (const [key, value] of Object.entries(notification.data)) {
            if (key === 'trustScore' || key === 'rejectionReason' || key === 'color') continue; // Skip these, handled separately
            
            const label = formatDataLabel(key);
            const displayValue = formatDataValue(key, value);
            dataHTML += `
                <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-600">${label}:</span>
                    <span class="text-sm text-gray-800">${displayValue}</span>
                </div>
            `;
        }
        dataContent.innerHTML = dataHTML;
    } else {
        dataContainer.classList.add('hidden');
    }
    
    // Handle trust score (for review notifications)
    const trustScoreContainer = document.getElementById('modalTrustScore');
    if (notification.data && notification.data.trustScore !== undefined) {
        trustScoreContainer.classList.remove('hidden');
        const score = notification.data.trustScore;
        const scoreBar = document.getElementById('modalTrustScoreBar');
        const scoreText = document.getElementById('modalTrustScoreText');
        
        scoreText.textContent = `${score}/100`;
        scoreBar.style.width = `${score}%`;
        
        // Color based on score
        if (score < 40) {
            scoreBar.className = 'h-full transition-all duration-500 bg-red-500';
            scoreText.className = 'text-lg font-bold text-red-600';
        } else if (score < 70) {
            scoreBar.className = 'h-full transition-all duration-500 bg-yellow-500';
            scoreText.className = 'text-lg font-bold text-yellow-600';
        } else {
            scoreBar.className = 'h-full transition-all duration-500 bg-green-500';
            scoreText.className = 'text-lg font-bold text-green-600';
        }
    } else {
        trustScoreContainer.classList.add('hidden');
    }
    
    // Handle rejection reason
    const rejectionContainer = document.getElementById('modalRejectionReason');
    if (notification.data && notification.data.rejectionReason) {
        rejectionContainer.classList.remove('hidden');
        document.getElementById('modalRejectionReasonText').textContent = notification.data.rejectionReason;
    } else {
        rejectionContainer.classList.add('hidden');
    }
    
    // Handle action buttons
    const markReadBtn = document.getElementById('modalMarkReadBtn');
    if (notification.isRead) {
        markReadBtn.classList.add('hidden');
    } else {
        markReadBtn.classList.remove('hidden');
    }
    
    const goToLinkBtn = document.getElementById('modalGoToLinkBtn');
    if (notification.link) {
        goToLinkBtn.classList.remove('hidden');
    } else {
        goToLinkBtn.classList.add('hidden');
    }
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeNotificationDetail() {
    const modal = document.getElementById('notificationDetailModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    currentNotificationData = null;
}

async function markNotificationAsReadFromModal() {
    if (!currentNotificationData) return;
    
    await markNotificationAsRead(currentNotificationData._id);
    closeNotificationDetail();
}

async function deleteNotificationFromModal() {
    if (!currentNotificationData) return;
    
    if (confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
        await deleteNotification(currentNotificationData._id);
        closeNotificationDetail();
    }
}

function goToNotificationLink() {
    if (currentNotificationData && currentNotificationData.link) {
        window.location.href = currentNotificationData.link;
    }
}

function formatDataLabel(key) {
    const labels = {
        reviewId: 'Mã đánh giá',
        propertyId: 'Mã bất động sản',
        bookingId: 'Mã đặt phòng',
        messageId: 'Mã tin nhắn',
        amount: 'Số tiền',
        propertyTitle: 'Tiêu đề',
        userName: 'Người dùng',
        reason: 'Lý do'
    };
    return labels[key] || key;
}

function formatDataValue(key, value) {
    if (key === 'amount' && typeof value === 'number') {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return value;
}

// Export modal functions
window.closeNotificationDetail = closeNotificationDetail;
window.markNotificationAsReadFromModal = markNotificationAsReadFromModal;
window.deleteNotificationFromModal = deleteNotificationFromModal;
window.goToNotificationLink = goToNotificationLink;
