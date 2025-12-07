/**
 * Admin Reviews Management với Auto Moderation
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

function checkAdminAuth() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = '/auth/login';
        return;
    }
    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
        alert('Bạn không có quyền truy cập!');
        window.location.href = '/';
    }
}

function initSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('-left-64');
            sidebar.classList.toggle('left-0');
        });
    }
}

function initFilters() {
    document.getElementById('searchInput')?.addEventListener('input', debounce(e => {
        filters.search = e.target.value;
        currentPage = 1;
        loadReviews();
    }, 500));

    document.getElementById('statusFilter')?.addEventListener('change', e => {
        filters.status = e.target.value;
        currentPage = 1;
        loadReviews();
    });
}

async function loadReviews() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return window.location.href = '/auth/login';

        const params = new URLSearchParams({ page: currentPage, limit: 20 });
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);

        const response = await fetch(`/api/reviews/admin/all?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            reviews = result.data;
            totalPages = result.pagination.pages;
            updateStats(result.stats);
            renderReviews(reviews);
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Lỗi khi tải dữ liệu', 'error');
    }
}

function updateStats(stats) {
    document.getElementById('totalReviews').textContent = stats.total || 0;
    document.getElementById('pendingReviews').textContent = stats.pending || 0;
    document.getElementById('approvedReviews').textContent = stats.approved || 0;
    document.getElementById('rejectedReviews').textContent = stats.rejected || 0;
    const avgElem = document.getElementById('averageRating');
    if (avgElem && stats.total > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        avgElem.textContent = avg.toFixed(1);
    }
}

function renderReviews(reviews) {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;

    if (reviews.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-star text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Không có đánh giá nào</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = reviews.map(review => {
        const statusBadge = getStatusBadge(review.moderationStatus);
        const userName = review.user?.name || 'N/A';
        const propertyTitle = review.property?.title || 'Đã xóa';
        const trustScore = review.trustScore || 0;
        const trustColor = getTrustColor(trustScore);

        return `
            <div class="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-all">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <img src="${review.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`}" 
                             alt="${userName}" class="w-12 h-12 rounded-full">
                        <div>
                            <h4 class="font-semibold text-gray-900">${userName}</h4>
                            <p class="text-xs text-gray-500">${new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>
                    ${statusBadge}
                </div>

                <div class="mb-3">
                    <div class="flex items-center mb-2">
                        ${renderStars(review.rating)}
                        <span class="ml-2 text-sm font-medium">${review.rating}/5</span>
                    </div>
                    <p class="text-sm font-medium text-gray-900 mb-1">${propertyTitle}</p>
                    <div class="flex items-center text-xs text-gray-500">
                        <span class="mr-2">Trust: ${trustScore}</span>
                        <div class="w-16 h-1.5 bg-gray-200 rounded-full">
                            <div class="h-1.5 ${trustColor} rounded-full" style="width:${trustScore}%"></div>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <p class="font-medium text-sm text-gray-900 mb-1">${review.title}</p>
                    <p class="text-sm text-gray-700 line-clamp-2">${review.comment}</p>
                </div>

                ${review.autoApproved ? '<p class="text-xs text-green-600 mb-2"><i class="fas fa-robot mr-1"></i>Auto approved</p>' : ''}
                ${review.autoRejected ? '<p class="text-xs text-red-600 mb-2"><i class="fas fa-robot mr-1"></i>Auto rejected</p>' : ''}

                <div class="flex items-center space-x-2">
                    <button onclick="viewReview('${review._id}')" 
                            class="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">
                        <i class="fas fa-eye mr-1"></i>Xem
                    </button>
                    ${review.moderationStatus === 'pending' ? `
                        <button onclick="moderateReview('${review._id}', 'approved')" 
                                class="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="moderateReview('${review._id}', 'rejected')" 
                                class="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : `
                        <button onclick="moderateReview('${review._id}', 'pending')" 
                                class="px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600">
                            <i class="fas fa-undo"></i>
                        </button>
                    `}
                    <button onclick="deleteReview('${review._id}')" 
                            class="px-3 py-2 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Chờ duyệt</span>',
        'approved': '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Đã duyệt</span>',
        'rejected': '<span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Từ chối</span>'
    };
    return badges[status] || status;
}

function getTrustColor(score) {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
}

function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= rating 
            ? '<i class="fas fa-star text-yellow-400 text-sm"></i>'
            : '<i class="far fa-star text-gray-300 text-sm"></i>';
    }
    return html;
}

async function moderateReview(id, status) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/reviews/${id}/moderate`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Cập nhật thành công', 'success');
            loadReviews();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Lỗi khi cập nhật', 'error');
    }
}

async function deleteReview(id) {
    if (!confirm('Xóa đánh giá này?')) return;

    try {
        const token = localStorage.getItem('token');
        
        // Get review details first to check trust score
        const review = reviews.find(r => r._id === id);
        console.log('🔍 Review to delete:', review);
        console.log('🔍 Trust score:', review?.trustScore);
        
        const response = await fetch(`/api/reviews/${id}/admin-delete`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            console.log('✅ Review deleted successfully');
            
            // If trust score < 40, also delete related notification
            if (review && review.trustScore < 40) {
                console.log('🗑️ Trust score < 40, deleting related notification...');
                await deleteRelatedNotification(id, token);
            } else {
                console.log('⏭️ Trust score >= 40, skipping notification deletion');
            }
            
            showNotification('Đã xóa', 'success');
            loadReviews();
        }
    } catch (error) {
        console.error('❌ Error deleting review:', error);
        showNotification('Lỗi khi xóa', 'error');
    }
}

async function deleteRelatedNotification(reviewId, token) {
    try {
        console.log('🔍 Calling DELETE /api/notifications/by-review/' + reviewId);
        
        // Find and delete notification related to this review
        const response = await fetch(`/api/notifications/by-review/${reviewId}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Deleted notification result:', result);
            console.log(`✅ Deleted ${result.deletedCount} notification(s) for review ${reviewId}`);
        } else {
            const error = await response.text();
            console.error('❌ Failed to delete notification:', error);
        }
    } catch (error) {
        console.error('❌ Error deleting related notification:', error);
        // Don't show error to user, this is a background cleanup
    }
}

function viewReview(id) {
    const review = reviews.find(r => r._id === id);
    if (!review) return;

    const statusBadge = getStatusBadge(review.moderationStatus);
    const trustColor = getTrustColor(review.trustScore);

    const modalHTML = `
        <div id="reviewModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h3 class="text-xl font-bold">Chi tiết đánh giá</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-semibold mb-2">Người dùng</h4>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <p><strong>Tên:</strong> ${review.user?.name || 'N/A'}</p>
                                <p><strong>Email:</strong> ${review.user?.email || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <h4 class="font-semibold mb-2">Phòng</h4>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <p><strong>Tên:</strong> ${review.property?.title || 'N/A'}</p>
                                <p><strong>Loại:</strong> ${review.reviewType === 'rented' ? 'Đã thuê' : 'Đã xem'}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 class="font-semibold mb-2">Nội dung</h4>
                        <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div class="flex items-center">
                                ${renderStars(review.rating)}
                                <span class="ml-2 font-semibold">${review.rating}/5</span>
                            </div>
                            <p class="font-medium">${review.title}</p>
                            <p class="text-gray-700">${review.comment}</p>
                        </div>
                    </div>

                    <div>
                        <h4 class="font-semibold mb-2">Kiểm duyệt</h4>
                        <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div class="flex justify-between">
                                <span>Trạng thái:</span> ${statusBadge}
                            </div>
                            <div class="flex justify-between items-center">
                                <span>Trust Score:</span>
                                <div class="flex items-center">
                                    <div class="w-32 h-2 bg-gray-200 rounded-full mr-2">
                                        <div class="h-2 ${trustColor} rounded-full" style="width:${review.trustScore}%"></div>
                                    </div>
                                    <span class="font-semibold">${review.trustScore}/100</span>
                                </div>
                            </div>
                            ${review.moderationReason ? `<p class="text-sm text-gray-600"><strong>Lý do:</strong> ${review.moderationReason}</p>` : ''}
                            ${review.autoApproved ? '<p class="text-sm text-green-600"><i class="fas fa-robot mr-1"></i>Tự động phê duyệt</p>' : ''}
                            ${review.autoRejected ? '<p class="text-sm text-red-600"><i class="fas fa-robot mr-1"></i>Tự động từ chối</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeModal() {
    document.getElementById('reviewModal')?.remove();
}

function showNotification(message, type = 'success') {
    const bg = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const div = document.createElement('div');
    div.className = `fixed top-4 right-4 ${bg} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
