/**
 * ===================================
 * ADMIN REVIEWS JS
 * JavaScript cho trang Quản lý Đánh giá với Auto Moderation
 * ===================================
 */

let reviews = [];
let currentPage = 1;
let totalPages = 1;
let filters = {
    status: '',
    search: ''
};

document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    checkAdminAuth();
    loadReviews();
    initFilters();
});

/**
 * Kiểm tra quyền admin
 */
function checkAdminAuth() {
    const userData = localStorage.getItem('userData');
    
    if (!userData) {
        window.location.href = '/auth/login';
        return;
    }

    const user = JSON.parse(userData);
    
    if (user.role !== 'admin') {
        alert('Bạn không có quyền truy cập trang này!');
        window.location.href = '/';
        return;
    }
}

/**
 * Khởi tạo sidebar toggle
 */
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('-left-64');
            sidebar.classList.toggle('left-0');
        });
    }
}

/**
 * Khởi tạo counter animation
 */
function initCounterAnimation() {
    const counters = document.querySelectorAll('[id$="Reviews"]');
    counters.forEach(counter => {
        if (counter.textContent !== '0' && counter.textContent !== '0.0') {
            animateCounter(counter, parseInt(counter.textContent));
        }
    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 20);
}

/**
 * Load reviews data
 */
async function loadReviews() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/admin/reviews');
        // const data = await response.json();
        
        // Mock data for now
        const mockReviews = [
            {
                id: 'RV001',
                userName: 'Nguyễn Văn A',
                userAvatar: 'https://via.placeholder.com/50/3b82f6/ffffff?text=N',
                propertyName: 'Phòng trọ Q.1 - Gần ĐH Khoa học Tự nhiên',
                rating: 5,
                comment: 'Phòng rất đẹp, chủ nhà nhiệt tình. Vị trí thuận tiện gần trường học.',
                createdAt: '2025-10-25',
                status: 'pending'
            },
            {
                id: 'RV002',
                userName: 'Trần Thị B',
                userAvatar: 'https://via.placeholder.com/50/10b981/ffffff?text=T',
                propertyName: 'Căn hộ Tân Bình - Full nội thất',
                rating: 4,
                comment: 'Căn hộ tốt, nội thất đầy đủ. Chỉ có điều hơi ồn vào ban đêm.',
                createdAt: '2025-10-24',
                status: 'approved'
            },
            {
                id: 'RV003',
                userName: 'Lê Văn C',
                userAvatar: 'https://via.placeholder.com/50/f59e0b/ffffff?text=L',
                propertyName: 'Nhà nguyên căn Thủ Đức',
                rating: 2,
                comment: 'Nhà không như mô tả, nhiều tiện ích hư hỏng chưa sửa chữa.',
                createdAt: '2025-10-23',
                status: 'rejected'
            },
            {
                id: 'RV004',
                userName: 'Phạm Thị D',
                userAvatar: 'https://via.placeholder.com/50/ec4899/ffffff?text=P',
                propertyName: 'Phòng Q.3 - Gần chợ Tân Định',
                rating: 5,
                comment: 'Rất hài lòng! Phòng sạch sẽ, tiện nghi đầy đủ, giá cả hợp lý.',
                createdAt: '2025-10-26',
                status: 'pending'
            },
            {
                id: 'RV005',
                userName: 'Hoàng Văn E',
                userAvatar: 'https://via.placeholder.com/50/8b5cf6/ffffff?text=H',
                propertyName: 'Studio Q.7 - View sông',
                rating: 4,
                comment: 'View đẹp, yên tĩnh. Giá hơi cao nhưng xứng đáng.',
                createdAt: '2025-10-25',
                status: 'approved'
            }
        ];

        renderReviews(mockReviews);
        updateStats(mockReviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

/**
 * Render reviews grid
 */
function renderReviews(reviews) {
    const grid = document.getElementById('reviewsGrid');
    
    if (!grid) return;

    grid.innerHTML = reviews.map(review => `
        <div class="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 animate-fadeIn hover:shadow-lg transition-all">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <img src="${review.userAvatar}" alt="${review.userName}" class="w-12 h-12 rounded-full">
                    <div>
                        <h4 class="font-medium text-gray-900">${review.userName}</h4>
                        <p class="text-sm text-gray-500">${formatDate(review.createdAt)}</p>
                    </div>
                </div>
                ${getStatusBadge(review.status)}
            </div>

            <div class="mb-3">
                <div class="flex items-center mb-2">
                    ${getStarRating(review.rating)}
                    <span class="ml-2 text-sm font-medium text-gray-700">${review.rating}.0</span>
                </div>
                <p class="text-sm font-medium text-gray-900 mb-1">${review.propertyName}</p>
            </div>

            <p class="text-gray-700 mb-4">${review.comment}</p>

            <div class="flex items-center space-x-2">
                <button onclick="viewReview('${review.id}')" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    <i class="fas fa-eye mr-1"></i>Xem
                </button>
                ${review.status === 'pending' ? `
                    <button onclick="approveReview('${review.id}')" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                        <i class="fas fa-check mr-1"></i>Duyệt
                    </button>
                    <button onclick="rejectReview('${review.id}')" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">
                        <i class="fas fa-times mr-1"></i>Từ chối
                    </button>
                ` : ''}
                <button onclick="deleteReview('${review.id}')" class="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Update statistics
 */
function updateStats(reviews) {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const rejected = reviews.filter(r => r.status === 'rejected').length;
    const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1);

    document.getElementById('totalReviews').textContent = total;
    document.getElementById('pendingReviews').textContent = pending;
    document.getElementById('approvedReviews').textContent = approved;
    document.getElementById('rejectedReviews').textContent = rejected;
    document.getElementById('averageRating').textContent = avgRating;
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Chờ duyệt</span>',
        'approved': '<span class="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">Đã duyệt</span>',
        'rejected': '<span class="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full">Đã từ chối</span>'
    };
    
    return badges[status] || status;
}

/**
 * Get star rating HTML
 */
function getStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star text-yellow-400"></i>';
        } else {
            stars += '<i class="far fa-star text-gray-300"></i>';
        }
    }
    return stars;
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

/**
 * Initialize filters
 */
function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const ratingFilter = document.getElementById('ratingFilter');

    if (searchInput) {
        searchInput.addEventListener('input', filterReviews);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterReviews);
    }
    
    if (ratingFilter) {
        ratingFilter.addEventListener('change', filterReviews);
    }
}

/**
 * Filter reviews
 */
function filterReviews() {
    // TODO: Implement filtering logic
    console.log('Filtering reviews...');
}

/**
 * View review details
 */
function viewReview(reviewId) {
    // TODO: Show modal with review details
    alert(`Xem chi tiết đánh giá: ${reviewId}`);
}

/**
 * Approve review
 */
function approveReview(reviewId) {
    if (confirm(`Bạn có chắc muốn duyệt đánh giá ${reviewId}?`)) {
        // TODO: Call API to approve review
        alert(`Đã duyệt đánh giá: ${reviewId}`);
        loadReviews();
    }
}

/**
 * Reject review
 */
function rejectReview(reviewId) {
    if (confirm(`Bạn có chắc muốn từ chối đánh giá ${reviewId}?`)) {
        // TODO: Call API to reject review
        alert(`Đã từ chối đánh giá: ${reviewId}`);
        loadReviews();
    }
}

/**
 * Delete review
 */
function deleteReview(reviewId) {
    if (confirm(`Bạn có chắc muốn xóa đánh giá ${reviewId}? Hành động này không thể hoàn tác!`)) {
        // TODO: Call API to delete review
        alert(`Đã xóa đánh giá: ${reviewId}`);
        loadReviews();
    }
}

/**
 * Close review modal
 */
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}
