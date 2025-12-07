/**
 * ===================================
 * NOTIFICATION MODAL HANDLER
 * Xử lý hiển thị chi tiết thông báo trong modal
 * ===================================
 */

class NotificationModal {
    constructor() {
        this.modal = null;
        this.currentNotification = null;
        this.init();
    }

    init() {
        // Create modal HTML structure
        this.createModalHTML();
        this.attachEventListeners();
        console.log('✅ Notification modal initialized');
    }

    createModalHTML() {
        // Remove existing modal if any
        const existingModal = document.getElementById('notificationModalOverlay');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'notification-modal-overlay';
        modalOverlay.id = 'notificationModalOverlay';
        
        modalOverlay.innerHTML = `
            <div class="notification-modal" id="notificationModal">
                <div class="notification-modal-header">
                    <div class="notification-modal-header-content">
                        <div class="notification-modal-icon" id="modalNotificationIcon">
                            📬
                        </div>
                        <div class="notification-modal-title-wrapper">
                            <h2 id="modalNotificationTitle">Chi tiết thông báo</h2>
                            <p class="notification-modal-time" id="modalNotificationTime"></p>
                        </div>
                    </div>
                    <button class="notification-modal-close" id="modalCloseBtn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="notification-modal-body" id="modalNotificationBody">
                    <!-- Content will be dynamically inserted here -->
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);
        this.modal = modalOverlay;
    }

    attachEventListeners() {
        const overlay = document.getElementById('notificationModalOverlay');
        const closeBtn = document.getElementById('modalCloseBtn');
        const modal = document.getElementById('notificationModal');

        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Click outside to close
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }

        // Prevent modal click from closing
        if (modal) {
            modal.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('show')) {
                this.close();
            }
        });
    }

    async show(notificationId) {
        try {
            console.log('📂 Opening notification modal for ID:', notificationId);
            
            // Fetch notification details
            const response = await fetch(`/api/notifications/${notificationId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch notification details');
            }

            const notification = await response.json();
            this.currentNotification = notification;

            // Update modal content
            this.updateModalContent(notification);

            // Show modal with animation
            this.modal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent body scroll

            // Mark as read
            this.markAsRead(notificationId);

        } catch (error) {
            console.error('❌ Error showing notification modal:', error);
            this.showError('Không thể tải chi tiết thông báo');
        }
    }

    updateModalContent(notification) {
        // Update icon
        const iconElement = document.getElementById('modalNotificationIcon');
        if (iconElement) {
            iconElement.textContent = this.getNotificationIcon(notification.type);
        }

        // Update title
        const titleElement = document.getElementById('modalNotificationTitle');
        if (titleElement) {
            titleElement.textContent = notification.title || 'Thông báo';
        }

        // Update time
        const timeElement = document.getElementById('modalNotificationTime');
        if (timeElement) {
            timeElement.textContent = this.formatTime(notification.createdAt);
        }

        // Update body content
        const bodyElement = document.getElementById('modalNotificationBody');
        if (bodyElement) {
            bodyElement.innerHTML = this.generateBodyContent(notification);
        }
    }

    generateBodyContent(notification) {
        let html = '';

        // Type badge
        html += `
            <div class="notification-modal-type ${notification.type}">
                ${this.getNotificationIcon(notification.type)}
                ${this.getTypeLabel(notification.type)}
            </div>
        `;

        // Message
        html += `
            <div class="notification-modal-message">
                ${notification.message || 'Không có nội dung'}
            </div>
        `;

        // Additional details based on type
        if (notification.data) {
            html += this.generateDetailsSection(notification);
        }

        // Trust score if available
        if (notification.trustScore !== undefined) {
            html += this.generateTrustScoreSection(notification.trustScore);
        }

        // Action buttons
        html += this.generateActionButtons(notification);

        return html;
    }

    generateDetailsSection(notification) {
        const data = notification.data;
        let html = '<div class="notification-modal-details">';

        // Property details
        if (data.propertyTitle) {
            html += this.createDetailItem('🏠 Bất động sản', data.propertyTitle);
        }

        if (data.propertyAddress) {
            html += this.createDetailItem('📍 Địa chỉ', data.propertyAddress);
        }

        if (data.price) {
            html += this.createDetailItem('💰 Giá', `${parseInt(data.price).toLocaleString('vi-VN')}đ/tháng`);
        }

        // Booking details
        if (data.bookingId) {
            html += this.createDetailItem('🆔 Mã đặt phòng', data.bookingId);
        }

        if (data.checkInDate) {
            html += this.createDetailItem('📅 Ngày nhận phòng', new Date(data.checkInDate).toLocaleDateString('vi-VN'));
        }

        if (data.checkOutDate) {
            html += this.createDetailItem('📅 Ngày trả phòng', new Date(data.checkOutDate).toLocaleDateString('vi-VN'));
        }

        // Review details
        if (data.rating) {
            html += this.createDetailItem('⭐ Đánh giá', `${data.rating}/5 sao`);
        }

        if (data.reviewerName) {
            html += this.createDetailItem('👤 Người đánh giá', data.reviewerName);
        }

        // Payment details
        if (data.amount) {
            html += this.createDetailItem('💵 Số tiền', `${parseInt(data.amount).toLocaleString('vi-VN')}đ`);
        }

        if (data.paymentMethod) {
            html += this.createDetailItem('💳 Phương thức', data.paymentMethod);
        }

        // Rejection reason
        if (data.rejectionReason) {
            html += this.createDetailItem('❌ Lý do từ chối', data.rejectionReason);
        }

        html += '</div>';
        return html;
    }

    createDetailItem(label, value) {
        return `
            <div class="notification-modal-detail-item">
                <div class="notification-modal-detail-label">${label}</div>
                <div class="notification-modal-detail-value">${value}</div>
            </div>
        `;
    }

    generateTrustScoreSection(score) {
        let level = 'low';
        let label = 'Thấp';
        let warning = '';
        
        if (score >= 70) {
            level = 'high';
            label = 'Cao';
        } else if (score >= 40) {
            level = 'medium';
            label = 'Trung bình';
        } else {
            // Dưới trung bình - hiển thị cảnh báo
            warning = `
                <div class="notification-modal-detail-item" style="background: #fff3e0; padding: 12px; border-radius: 8px; margin-top: 8px;">
                    <div class="notification-modal-detail-value" style="color: #e65100;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Cảnh báo:</strong> Mức độ tin cậy thấp. Bạn nên xem xét lại đánh giá này hoặc liên hệ quản trị viên.
                    </div>
                </div>
            `;
        }

        return `
            <div class="notification-modal-details">
                <div class="notification-modal-detail-item">
                    <div class="notification-modal-detail-label">🛡️ Mức độ tin cậy</div>
                    <div class="notification-modal-detail-value">
                        <span class="notification-modal-trust-score ${level}">
                            ${score}/100 - ${label}
                        </span>
                    </div>
                </div>
                ${warning}
            </div>
        `;
    }

    generateActionButtons(notification) {
        let html = '<div class="notification-modal-actions">';

        const data = notification.data || {};
        const trustScore = notification.trustScore !== undefined ? notification.trustScore : (data.trustScore || 100);

        // Debug logging
        console.log('🔍 Notification for action buttons:', {
            type: notification.type,
            trustScore: trustScore,
            hasReviewId: !!data.reviewId,
            reviewId: data.reviewId,
            propertyId: data.propertyId,
            fullNotification: notification
        });

        // Review re-evaluation button (if trust score < 40 and has reviewId)
        if (trustScore < 40 && notification.type === 'review_received' && data.reviewId) {
            console.log('✅ Showing "Đánh giá lại" button');
            html += `
                <button class="notification-modal-btn notification-modal-btn-primary" 
                        onclick="notificationModal.openReviewForReevaluation('${data.reviewId}', '${data.propertyId || ''}')">
                    <i class="fas fa-edit"></i>
                    Đánh giá lại
                </button>
            `;
        } else {
            console.log('❌ Not showing "Đánh giá lại" button. Conditions:', {
                isTrustScoreLow: trustScore < 40,
                isReviewType: notification.type === 'review_received',
                hasReviewId: !!data.reviewId
            });
        }

        // Property link
        if (data.propertyId) {
            html += `
                <button class="notification-modal-btn notification-modal-btn-primary" 
                        onclick="window.location.href='/properties/${data.propertyId}'">
                    <i class="fas fa-eye"></i>
                    Xem bất động sản
                </button>
            `;
        }

        // Booking link
        if (data.bookingId) {
            html += `
                <button class="notification-modal-btn notification-modal-btn-primary" 
                        onclick="window.location.href='/bookings?id=${data.bookingId}'">
                    <i class="fas fa-calendar-check"></i>
                    Xem đặt phòng
                </button>
            `;
        }

        // Message link
        if (notification.type === 'new_message' && data.chatId) {
            html += `
                <button class="notification-modal-btn notification-modal-btn-primary" 
                        onclick="window.location.href='/chat?id=${data.chatId}'">
                    <i class="fas fa-comments"></i>
                    Xem tin nhắn
                </button>
            `;
        }

        // Delete button (always show)
        html += `
            <button class="notification-modal-btn notification-modal-btn-secondary" 
                    onclick="notificationModal.deleteNotification('${notification._id}')">
                <i class="fas fa-trash"></i>
                Xóa thông báo
            </button>
        `;

        html += '</div>';
        return html;
    }

    getNotificationIcon(type) {
        const icons = {
            'booking_confirmed': '✅',
            'booking_cancelled': '❌',
            'new_message': '💬',
            'review_received': '⭐',
            'property_approved': '🏠',
            'property_rejected': '🚫',
            'payment_success': '💰',
            'payment_failed': '❌',
            'system_alert': '⚠️'
        };
        return icons[type] || '📬';
    }

    getTypeLabel(type) {
        const labels = {
            'booking_confirmed': 'Đặt phòng thành công',
            'booking_cancelled': 'Hủy đặt phòng',
            'new_message': 'Tin nhắn mới',
            'review_received': 'Đánh giá mới',
            'property_approved': 'Bài đăng được duyệt',
            'property_rejected': 'Bài đăng bị từ chối',
            'payment_success': 'Thanh toán thành công',
            'payment_failed': 'Thanh toán thất bại',
            'system_alert': 'Thông báo hệ thống'
        };
        return labels[type] || 'Thông báo';
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async markAsRead(notificationId) {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            
            // Update notification dropdown if exists
            if (window.notificationDropdown) {
                window.notificationDropdown.updateBadge();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async deleteNotification(notificationId) {
        if (!confirm('Bạn có chắc muốn xóa thông báo này?')) {
            return;
        }

        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.close();
                
                // Update notification dropdown if exists
                if (window.notificationDropdown) {
                    window.notificationDropdown.loadNotifications();
                    window.notificationDropdown.updateBadge();
                }
                
                // Show success message
                this.showSuccess('Đã xóa thông báo');
            } else {
                throw new Error('Failed to delete notification');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            this.showError('Không thể xóa thông báo');
        }
    }

    async openReviewForReevaluation(reviewId, propertyId) {
        if (!reviewId) {
            this.showError('Không tìm thấy thông tin đánh giá');
            return;
        }

        // Confirm before proceeding
        const confirmed = confirm(
            'Bạn muốn đánh giá lại? Điều này sẽ cho phép bạn chỉnh sửa hoặc xóa đánh giá có vấn đề về mức độ tin cậy.'
        );

        if (!confirmed) {
            return;
        }

        try {
            // Option 1: Navigate to property detail with review edit mode
            if (propertyId) {
                this.close();
                window.location.href = `/properties/${propertyId}?editReview=${reviewId}`;
            } else {
                // Option 2: Show review edit dialog/modal
                this.showReviewEditDialog(reviewId);
            }
        } catch (error) {
            console.error('Error opening review for reevaluation:', error);
            this.showError('Không thể mở đánh giá');
        }
    }

    async showReviewEditDialog(reviewId) {
        try {
            // Fetch review details
            const response = await fetch(`/api/reviews/${reviewId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch review');
            }

            const review = await response.json();

            // Create edit dialog
            const confirmed = confirm(
                `Đánh giá hiện tại:\n` +
                `⭐ ${review.rating}/5 sao\n` +
                `💬 ${review.comment || 'Không có nhận xét'}\n\n` +
                `Bạn muốn:\n` +
                `- OK: Xóa đánh giá này\n` +
                `- Cancel: Giữ nguyên`
            );

            if (confirmed) {
                // Delete the review
                await this.deleteReview(reviewId);
            }
        } catch (error) {
            console.error('Error showing review edit dialog:', error);
            this.showError('Không thể tải thông tin đánh giá');
        }
    }

    async deleteReview(reviewId) {
        try {
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showSuccess('Đã xóa đánh giá thành công');
                
                // Close modal and refresh
                this.close();
                
                // Reload page or update UI
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error('Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            this.showError('Không thể xóa đánh giá');
        }
    }

    close() {
        console.log('📁 Closing notification modal');
        this.modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore body scroll
        this.currentNotification = null;
    }

    showError(message) {
        // You can integrate with your toast/alert system
        alert(message);
    }

    showSuccess(message) {
        // You can integrate with your toast/alert system
        console.log('✅', message);
    }
}

// Initialize modal when DOM is ready
let notificationModal;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        notificationModal = new NotificationModal();
        window.notificationModal = notificationModal; // Make globally accessible
    });
} else {
    notificationModal = new NotificationModal();
    window.notificationModal = notificationModal;
}
