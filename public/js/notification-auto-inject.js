/**
 * ===================================
 * NOTIFICATION AUTO INJECT
 * Tự động chuyển notification icon thành dropdown cho tất cả trang
 * ===================================
 */

(function() {
    'use strict';
    
    console.log('🔄 Auto-injecting notification dropdown...');
    
    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotificationDropdown);
    } else {
        initNotificationDropdown();
    }
    
    function initNotificationDropdown() {
        // Find all notification links/buttons
        const notificationLinks = document.querySelectorAll('a[href="/notifications"]');
        
        if (notificationLinks.length === 0) {
            console.log('ℹ️ No notification links found on this page');
            return;
        }
        
        console.log(`🔍 Found ${notificationLinks.length} notification link(s)`);
        
        notificationLinks.forEach((link, index) => {
            // Skip if already converted
            if (link.closest('.notification-bell-container')) {
                console.log(`⏭️ Link ${index + 1} already converted`);
                return;
            }
            
            console.log(`🔨 Converting notification link ${index + 1}`);
            
            // Get the badge element
            const badge = link.querySelector('#notificationBadge, .notification-badge, [id*="notification"][id*="badge" i]');
            
            // Create new container
            const container = document.createElement('div');
            container.className = 'notification-bell-container relative';
            
            // Create new button
            const button = document.createElement('button');
            button.className = 'notification-bell-icon';
            button.type = 'button';
            
            // Copy icon
            const icon = link.querySelector('i.fa-bell') || link.querySelector('i[class*="bell"]');
            if (icon) {
                button.innerHTML = icon.outerHTML;
            } else {
                button.innerHTML = '<i class="fas fa-bell text-xl"></i>';
            }
            
            // Add badge
            if (badge) {
                const newBadge = badge.cloneNode(true);
                newBadge.className = 'notification-badge';
                button.appendChild(newBadge);
            } else {
                // Create new badge
                const newBadge = document.createElement('span');
                newBadge.id = 'notificationBadge';
                newBadge.className = 'notification-badge';
                newBadge.style.display = 'none';
                newBadge.textContent = '0';
                button.appendChild(newBadge);
            }
            
            // Add container
            container.appendChild(button);
            
            // Replace link with container
            link.parentNode.replaceChild(container, link);
            
            console.log(`✅ Successfully converted notification link ${index + 1}`);
        });
        
        // Initialize notification dropdown if not already initialized
        setTimeout(() => {
            if (window.NotificationDropdown && !window.notificationDropdown) {
                console.log('🚀 Initializing NotificationDropdown...');
                window.notificationDropdown = new NotificationDropdown();
            } else if (window.notificationDropdown) {
                console.log('✅ NotificationDropdown already initialized');
            } else {
                console.warn('⚠️ NotificationDropdown class not found');
            }
        }, 100);
    }
})();
