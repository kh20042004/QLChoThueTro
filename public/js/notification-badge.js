/**
 * ===================================
 * NOTIFICATION BADGE UPDATER
 * Tự động cập nhật số thông báo chưa đọc
 * ===================================
 */

(function() {
    'use strict';

    // Update notification badge
    async function updateNotificationBadge() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/notifications/unread-count', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const count = result.success ? result.data : 0;
                
                // Update badge
                const badge = document.getElementById('notificationBadge');
                if (badge) {
                    if (count > 0) {
                        badge.textContent = count > 99 ? '99+' : count;
                        badge.style.display = 'flex';
                    } else {
                        badge.style.display = 'none';
                    }
                }

                // Update page title if there are unread notifications
                updatePageTitle(count);
            }
        } catch (error) {
            console.error('Error updating notification badge:', error);
        }
    }

    // Update page title with notification count
    function updatePageTitle(count) {
        const currentTitle = document.title;
        
        // Remove existing count from title
        const cleanTitle = currentTitle.replace(/^\(\d+\+?\)\s*/, '');
        
        // Add new count if > 0
        if (count > 0) {
            const displayCount = count > 99 ? '99+' : count;
            document.title = `(${displayCount}) ${cleanTitle}`;
        } else {
            document.title = cleanTitle;
        }
    }

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateNotificationBadge);
    } else {
        updateNotificationBadge();
    }

    // Update every 30 seconds
    setInterval(updateNotificationBadge, 30000);

    // Update when window gains focus
    window.addEventListener('focus', updateNotificationBadge);

    // Export for use in other scripts
    window.updateNotificationBadge = updateNotificationBadge;

    // Listen for Socket.IO notification events
    if (window.socket) {
        window.socket.on('notification:new', function() {
            updateNotificationBadge();
        });

        window.socket.on('notification:read', function() {
            updateNotificationBadge();
        });

        window.socket.on('notification:deleted', function() {
            updateNotificationBadge();
        });
    } else {
        // Wait for socket to be initialized
        let checkSocketInterval = setInterval(() => {
            if (window.socket) {
                clearInterval(checkSocketInterval);
                
                window.socket.on('notification:new', function() {
                    updateNotificationBadge();
                });

                window.socket.on('notification:read', function() {
                    updateNotificationBadge();
                });

                window.socket.on('notification:deleted', function() {
                    updateNotificationBadge();
                });
            }
        }, 1000);

        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkSocketInterval), 10000);
    }
})();
