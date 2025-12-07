/**
 * ===================================
 * NOTIFICATION DROPDOWN JAVASCRIPT
 * Quản lý dropdown thông báo khi hover/click vào icon
 * ===================================
 */

class NotificationDropdown {
    constructor() {
        this.isOpen = false;
        this.notifications = [];
        this.currentFilter = 'all'; // all, unread, read
        this.unreadCount = 0;
        this.page = 1;
        this.hasMore = true;
        
        this.init();
    }

    init() {
        this.createDropdownHTML();
        this.attachEventListeners();
        this.loadNotifications();
        this.setupSocketListener();
        this.startAutoRefresh();
    }

    createDropdownHTML() {
        const bellContainer = document.querySelector('.notification-bell-container');
        if (!bellContainer) {
            console.warn('Notification bell container not found');
            return;
        }

        const dropdown = document.createElement('div');
        dropdown.className = 'notification-dropdown';
        dropdown.id = 'notificationDropdown';
        dropdown.innerHTML = `
            <div class="notification-dropdown-header">
                <div class="notification-dropdown-title">
                    <h3>Thông báo</h3>
                    <button class="notification-mark-all-read" id="markAllReadDropdown">
                        Đọc tất cả
                    </button>
                </div>
                <div class="notification-dropdown-tabs">
                    <button class="notification-tab active" data-filter="all">
                        Tất cả
                    </button>
                    <button class="notification-tab" data-filter="unread">
                        Chưa đọc
                    </button>
                </div>
            </div>
            <div class="notification-dropdown-list" id="notificationDropdownList">
                <div class="notification-dropdown-loading">
                    <div class="notification-spinner"></div>
                    <p>Đang tải...</p>
                </div>
            </div>
            <div class="notification-dropdown-footer">
                <a href="/notifications">Xem tất cả thông báo</a>
            </div>
        `;

        bellContainer.appendChild(dropdown);
        console.log('✅ Notification dropdown HTML created');

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'notification-dropdown-overlay';
        overlay.id = 'notificationDropdownOverlay';
        document.body.appendChild(overlay);
    }

    attachEventListeners() {
        const bellContainer = document.querySelector('.notification-bell-container');
        const bellIcon = document.querySelector('.notification-bell-icon');
        const dropdown = document.getElementById('notificationDropdown');
        
        if (!bellIcon || !bellContainer || !dropdown) {
            console.warn('Notification elements not found:', { bellIcon, bellContainer, dropdown });
            return;
        }

        console.log('✅ Attaching notification hover/click events');
        
        let hoverTimeout;
        let closeTimeout;
        let isMouseInside = false;

        // Hover to open - on container
        bellContainer.addEventListener('mouseenter', () => {
            console.log('🖱️ Mouse entered bell container');
            isMouseInside = true;
            clearTimeout(closeTimeout);
            
            if (!this.isOpen) {
                clearTimeout(hoverTimeout);
                hoverTimeout = setTimeout(() => {
                    if (isMouseInside && !this.isOpen) {
                        console.log('📂 Opening dropdown via hover');
                        this.open(false); // false = via hover, no overlay
                    }
                }, 300); // Delay to prevent accidental opens
            }
        });

        // Keep open when hovering dropdown
        dropdown.addEventListener('mouseenter', () => {
            console.log('🖱️ Mouse entered dropdown');
            isMouseInside = true;
            clearTimeout(closeTimeout);
            clearTimeout(hoverTimeout);
        });

        // Mark as outside when leaving container
        bellContainer.addEventListener('mouseleave', (e) => {
            console.log('🖱️ Mouse left bell container', { clientY: e.clientY, containerBottom: bellContainer.getBoundingClientRect().bottom });
            
            // Check if mouse is moving downward (toward dropdown)
            const containerRect = bellContainer.getBoundingClientRect();
            const dropdownRect = dropdown.getBoundingClientRect();
            const isMovingDown = e.clientY > containerRect.bottom && e.clientY < dropdownRect.bottom + 50;
            
            if (isMovingDown) {
                console.log('🔽 Mouse moving toward dropdown - keeping open');
                // Don't set isMouseInside to false yet, give time to reach dropdown
                clearTimeout(hoverTimeout);
                return;
            }
            
            isMouseInside = false;
            clearTimeout(hoverTimeout);
            
            if (this.isOpen) {
                closeTimeout = setTimeout(() => {
                    if (!isMouseInside && this.isOpen) {
                        console.log('📁 Closing dropdown - left container');
                        this.close();
                    }
                }, 500);
            }
        });

        // Close when leaving dropdown
        dropdown.addEventListener('mouseleave', (e) => {
            console.log('🖱️ Mouse left dropdown');
            isMouseInside = false;
            
            closeTimeout = setTimeout(() => {
                if (!isMouseInside && this.isOpen) {
                    console.log('📁 Closing dropdown - left dropdown');
                    this.close();
                }
            }, 800); // Longer delay when leaving dropdown to allow reading
        });

        // Click toggle (for mobile/touch devices)
        bellIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🖱️ Bell icon clicked');
            this.toggle();
        });

        // Overlay click to close
        const overlay = document.getElementById('notificationDropdownOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }

        // Mark all as read
        const markAllBtn = document.getElementById('markAllReadDropdown');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => this.markAllAsRead());
        }

        // Tab filters
        const tabs = document.querySelectorAll('.notification-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.dataset.filter;
                this.page = 1;
                this.loadNotifications();
            });
        });

        // Infinite scroll
        const list = document.getElementById('notificationDropdownList');
        if (list) {
            list.addEventListener('scroll', () => {
                if (list.scrollTop + list.clientHeight >= list.scrollHeight - 50) {
                    if (this.hasMore && !this.isLoading) {
                        this.page++;
                        this.loadNotifications(true);
                    }
                }
            });
        }
    }

    setupSocketListener() {
        if (typeof io === 'undefined') return;

        const socket = io();
        socket.on('notification', (data) => {
            this.addNewNotification(data);
            this.updateBadge();
            this.showToastNotification(data);
        });
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        setInterval(() => {
            if (!this.isOpen) {
                this.updateBadge();
            }
        }, 30000);
    }

    async toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open(true); // true = via click, show overlay
        }
    }

    open(viaClick = false) {
        const dropdown = document.getElementById('notificationDropdown');
        const overlay = document.getElementById('notificationDropdownOverlay');
        
        if (dropdown) {
            console.log('📂 Opening notification dropdown', viaClick ? '(via click)' : '(via hover)');
            dropdown.classList.add('show');
            
            // Only show overlay if opened via click (not hover)
            if (overlay && viaClick) {
                overlay.classList.add('show');
            }
            
            this.isOpen = true;
            
            // Reload notifications
            this.page = 1;
            this.loadNotifications();
        }
    }

    close() {
        const dropdown = document.getElementById('notificationDropdown');
        const overlay = document.getElementById('notificationDropdownOverlay');
        
        if (dropdown && overlay) {
            console.log('📁 Closing notification dropdown');
            dropdown.classList.remove('show');
            overlay.classList.remove('show');
            this.isOpen = false;
        }
    }

    async loadNotifications(append = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const list = document.getElementById('notificationDropdownList');

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const params = new URLSearchParams({
                page: this.page,
                limit: 10,
                filter: this.currentFilter
            });

            const response = await fetch(`/api/notifications?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load notifications');

            const result = await response.json();
            
            if (result.success) {
                this.notifications = append ? 
                    [...this.notifications, ...result.data] : 
                    result.data;
                this.hasMore = result.pagination.page < result.pagination.pages;
                
                this.renderNotifications(append);
                this.updateBadge();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.renderError();
        } finally {
            this.isLoading = false;
        }
    }

    renderNotifications(append = false) {
        const list = document.getElementById('notificationDropdownList');
        if (!list) return;

        if (!append) {
            list.innerHTML = '';
        }

        if (this.notifications.length === 0) {
            this.renderEmpty();
            return;
        }

        this.notifications.forEach(notification => {
            const item = this.createNotificationItem(notification);
            list.appendChild(item);
        });
    }

    createNotificationItem(notification) {
        const div = document.createElement('div');
        div.className = `notification-dropdown-item ${notification.isRead ? 'read' : 'unread'}`;
        div.dataset.notificationId = notification._id;

        const icon = this.getTypeIcon(notification.type);
        const timeAgo = notification.timeAgo || this.formatTimeAgo(notification.createdAt);

        // Trust score badge for review notifications
        let trustScoreBadge = '';
        if (notification.data && notification.data.trustScore !== undefined) {
            const score = notification.data.trustScore;
            let scoreClass = 'low';
            if (score >= 70) scoreClass = 'high';
            else if (score >= 40) scoreClass = 'medium';
            
            trustScoreBadge = `<span class="notification-trust-score ${scoreClass}">
                <i class="fas fa-star"></i> ${score}/100
            </span>`;
        }

        div.innerHTML = `
            <div class="notification-dropdown-item-content">
                <div class="notification-dropdown-icon ${notification.type}">
                    <i class="${icon}"></i>
                </div>
                <div class="notification-dropdown-text">
                    <h4>
                        ${notification.title}
                        ${!notification.isRead ? '<span class="notification-dropdown-unread-dot"></span>' : ''}
                    </h4>
                    <p>${notification.message}</p>
                    <div class="notification-dropdown-time">
                        <i class="far fa-clock"></i>
                        ${timeAgo}
                    </div>
                    ${trustScoreBadge}
                </div>
            </div>
        `;

        // Click to view detail in modal
        div.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            // Mark as read if unread
            if (!notification.isRead) {
                await this.markAsRead(notification._id);
            }
            
            // Close dropdown
            this.close();
            
            // Open modal with notification details
            if (window.notificationModal) {
                window.notificationModal.show(notification._id);
            } else {
                console.warn('Notification modal not found');
                // Fallback to link navigation
                if (notification.link) {
                    window.location.href = notification.link;
                }
            }
        });

        return div;
    }

    renderEmpty() {
        const list = document.getElementById('notificationDropdownList');
        if (!list) return;

        list.innerHTML = `
            <div class="notification-dropdown-empty">
                <i class="far fa-bell-slash"></i>
                <h4>Không có thông báo</h4>
                <p>${this.currentFilter === 'unread' ? 'Bạn đã đọc hết' : 'Chưa có thông báo mới'}</p>
            </div>
        `;
    }

    renderError() {
        const list = document.getElementById('notificationDropdownList');
        if (!list) return;

        list.innerHTML = `
            <div class="notification-dropdown-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Có lỗi xảy ra</h4>
                <p>Không thể tải thông báo</p>
            </div>
        `;
    }

    async updateBadge() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/notifications/unread-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                this.unreadCount = result.data;
                
                const badge = document.getElementById('notificationBadge');
                if (badge) {
                    if (this.unreadCount > 0) {
                        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                        badge.style.display = 'flex';
                        badge.classList.add('pulse');
                    } else {
                        badge.style.display = 'none';
                    }
                }

                const bellIcon = document.querySelector('.notification-bell-icon');
                if (bellIcon && this.unreadCount > 0) {
                    bellIcon.classList.add('has-unread');
                }
            }
        } catch (error) {
            console.error('Error updating badge:', error);
        }
    }

    async markAsRead(notificationId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                // Update UI
                const item = document.querySelector(`[data-notification-id="${notificationId}"]`);
                if (item) {
                    item.classList.remove('unread');
                    item.classList.add('read');
                    const dot = item.querySelector('.notification-dropdown-unread-dot');
                    if (dot) dot.remove();
                }
                
                this.updateBadge();
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/notifications/read-all', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                // Reload notifications
                this.page = 1;
                this.loadNotifications();
                this.updateBadge();
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    addNewNotification(notification) {
        this.notifications.unshift(notification);
        
        if (this.isOpen) {
            const list = document.getElementById('notificationDropdownList');
            if (list && list.children.length > 0) {
                const firstChild = list.firstChild;
                const newItem = this.createNotificationItem(notification);
                list.insertBefore(newItem, firstChild);
            } else {
                this.renderNotifications();
            }
        }
    }

    showToastNotification(notification) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            max-width: 350px;
            background: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        const icon = this.getTypeIcon(notification.type);
        toast.innerHTML = `
            <div style="display: flex; gap: 12px; align-items: start;">
                <div class="notification-dropdown-icon ${notification.type}">
                    <i class="${icon}"></i>
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${notification.title}</h4>
                    <p style="margin: 0; font-size: 13px; color: #6B7280;">${notification.message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    getTypeIcon(type) {
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

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Vừa xong';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
        
        return date.toLocaleDateString('vi-VN');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Notification Dropdown: DOM Ready');
    const token = localStorage.getItem('token');
    if (token) {
        console.log('✅ User logged in, initializing notification dropdown');
        window.notificationDropdown = new NotificationDropdown();
    } else {
        console.log('❌ User not logged in, skipping notification dropdown');
    }
});

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
