/**
 * ===================================
 * ADMIN DASHBOARD JS
 * JavaScript cho trang Admin Dashboard
 * ===================================
 */

document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    initCounterAnimation();
    checkAdminAuth();
    loadDashboardData();
});

/**
 * Load tất cả dữ liệu dashboard
 */
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadRecentProperties(),
        loadRecentUsers(),
        loadActivities()
    ]);
}

/**
 * Load thống kê tổng quan
 */
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load stats');
        }

        const result = await response.json();
        const data = result.data;

        // Cập nhật số liệu
        animateCounter(document.querySelector('[data-count="1234"]'), data.users.total, 1234);
        animateCounter(document.querySelector('[data-count="567"]'), data.properties.total, 567);
        animateCounter(document.querySelector('[data-count="89"]'), data.bookings.total, 89);

        // Cập nhật doanh thu
        const revenueElement = document.querySelector('.text-3xl.font-bold.text-gray-900:not([data-count])');
        if (revenueElement && revenueElement.textContent === '450M') {
            revenueElement.textContent = formatRevenue(data.revenue.total);
        }

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load properties mới nhất
 */
async function loadRecentProperties() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/dashboard/recent-properties', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load recent properties');
        }

        const result = await response.json();
        const properties = result.data;

        const container = document.querySelector('.space-y-3');
        if (!container || properties.length === 0) return;

        // Tìm container chứa properties (container đầu tiên)
        const propertiesContainer = container.parentElement.querySelector('.space-y-3');
        
        propertiesContainer.innerHTML = properties.map(property => `
            <div class="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                <img src="${property.images && property.images.length > 0 ? property.images[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=100'}" 
                     alt="${property.title}" 
                     class="w-16 h-16 rounded-lg object-cover">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900">${property.title}</h4>
                    <p class="text-sm text-gray-600">${formatPrice(property.price)}/tháng</p>
                </div>
                <span class="px-3 py-1 ${getStatusClass(property.status)} text-xs rounded-full">${getStatusText(property.status)}</span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading recent properties:', error);
    }
}

/**
 * Load users mới nhất
 */
async function loadRecentUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/dashboard/recent-users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load recent users');
        }

        const result = await response.json();
        const users = result.data;

        if (users.length === 0) return;

        // Tìm container của recent users (container thứ 2)
        const containers = document.querySelectorAll('.space-y-3');
        if (containers.length < 2) return;
        
        const usersContainer = containers[1];
        
        usersContainer.innerHTML = users.map(user => `
            <div class="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                <img src="${user.avatar || getAvatarPlaceholder(user.name)}" 
                     alt="${user.name}" 
                     class="w-10 h-10 rounded-full">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900">${user.name}</h4>
                    <p class="text-sm text-gray-600">${user.email}</p>
                </div>
                <span class="px-3 py-1 ${getRoleBadgeClass(user.role)} text-xs rounded-full">${getRoleText(user.role)}</span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading recent users:', error);
    }
}

/**
 * Load activity log
 */
async function loadActivities() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/dashboard/activities', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load activities');
        }

        const result = await response.json();
        const activities = result.data;

        if (activities.length === 0) return;

        const activityContainer = document.querySelector('.space-y-4');
        if (!activityContainer) return;

        activityContainer.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="flex items-start space-x-3 pb-4 border-b border-gray-100">
                <div class="w-8 h-8 bg-${activity.color}-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-${activity.icon} text-${activity.color}-600 text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-gray-900"><span class="font-medium">${activity.user}</span> ${activity.message}</p>
                    <p class="text-sm text-gray-500">${getTimeAgo(activity.time)}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

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

    console.log('Admin authenticated:', user.name);
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

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth < 1024) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.add('-left-64');
                    sidebar.classList.remove('left-0');
                }
            }
        });
    }
}

/**
 * Animation đếm số thống kê
 */
function initCounterAnimation() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                counter.textContent = formatNumber(target);
                clearInterval(timer);
            } else {
                counter.textContent = formatNumber(Math.floor(current));
            }
        }, 16);
    });
}

/**
 * Format số với dấu phẩy
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
