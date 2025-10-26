/**
 * ===================================
 * ADMIN USERS JS
 * Quản lý người dùng
 * ===================================
 */

document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    loadUsers();
    checkAdminAuth();
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
 * Load danh sách users từ API
 */
async function loadUsers() {
    const token = localStorage.getItem('token');
    const tableBody = document.getElementById('usersTableBody');

    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    try {
        // Giả lập dữ liệu (sau này sẽ gọi API thật)
        setTimeout(() => {
            const sampleUsers = [
                {
                    _id: '1',
                    name: 'Nguyễn Văn A',
                    email: 'nguyenvana@gmail.com',
                    phone: '0901234567',
                    role: 'user',
                    status: 'active',
                    createdAt: '2024-01-15'
                },
                {
                    _id: '2',
                    name: 'Trần Thị B',
                    email: 'tranthib@gmail.com',
                    phone: '0907654321',
                    role: 'landlord',
                    status: 'active',
                    createdAt: '2024-02-20'
                },
                {
                    _id: '3',
                    name: 'Lê Văn C',
                    email: 'levanc@gmail.com',
                    phone: '0912345678',
                    role: 'user',
                    status: 'inactive',
                    createdAt: '2024-03-10'
                }
            ];

            renderUsersTable(sampleUsers);
        }, 1000);

    } catch (error) {
        console.error('Error loading users:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-red-500">
                    Lỗi tải dữ liệu. Vui lòng thử lại!
                </td>
            </tr>
        `;
    }
}

/**
 * Render bảng users
 */
function renderUsersTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    Không có người dùng nào
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = users.map(user => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <div class="flex items-center space-x-3">
                    <img src="https://via.placeholder.com/40/${getColorByRole(user.role)}/ffffff?text=${user.name.charAt(0)}" 
                         alt="${user.name}" 
                         class="w-10 h-10 rounded-full">
                    <span class="font-medium text-gray-900">${user.name}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-600">${user.email}</td>
            <td class="px-6 py-4 text-gray-600">${user.phone || 'N/A'}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 ${getRoleBadgeClass(user.role)} text-xs rounded-full font-medium">
                    ${getRoleLabel(user.role)}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 ${getStatusBadgeClass(user.status)} text-xs rounded-full font-medium">
                    ${getStatusLabel(user.status)}
                </span>
            </td>
            <td class="px-6 py-4 text-gray-600">${formatDate(user.createdAt)}</td>
            <td class="px-6 py-4">
                <div class="flex items-center justify-center space-x-2">
                    <button onclick="viewUser('${user._id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editUser('${user._id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteUser('${user._id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Helper functions
 */
function getRoleLabel(role) {
    const labels = {
        'user': 'User',
        'landlord': 'Landlord',
        'admin': 'Admin'
    };
    return labels[role] || role;
}

function getRoleBadgeClass(role) {
    const classes = {
        'user': 'bg-blue-100 text-blue-700',
        'landlord': 'bg-purple-100 text-purple-700',
        'admin': 'bg-red-100 text-red-700'
    };
    return classes[role] || 'bg-gray-100 text-gray-700';
}

function getStatusLabel(status) {
    const labels = {
        'active': 'Hoạt động',
        'inactive': 'Không hoạt động',
        'blocked': 'Đã khóa'
    };
    return labels[status] || status;
}

function getStatusBadgeClass(status) {
    const classes = {
        'active': 'bg-green-100 text-green-700',
        'inactive': 'bg-gray-100 text-gray-700',
        'blocked': 'bg-red-100 text-red-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
}

function getColorByRole(role) {
    const colors = {
        'user': '3b82f6',
        'landlord': 'a855f7',
        'admin': 'ef4444'
    };
    return colors[role] || '6b7280';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

/**
 * User actions
 */
function viewUser(userId) {
    console.log('View user:', userId);
    // TODO: Show user detail modal
    alert('Xem chi tiết user: ' + userId);
}

function editUser(userId) {
    console.log('Edit user:', userId);
    // TODO: Show edit modal
    alert('Chỉnh sửa user: ' + userId);
}

function deleteUser(userId) {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
        console.log('Delete user:', userId);
        // TODO: Call API to delete
        alert('Đã xóa user: ' + userId);
    }
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    modal.classList.add('hidden');
}

/**
 * Sidebar toggle
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
