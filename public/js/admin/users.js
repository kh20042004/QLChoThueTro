/**
 * ===================================
 * ADMIN USERS JS
 * Quản lý người dùng
 * ===================================
 */

// Biến lưu trữ dữ liệu
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    loadUsers();
    checkAdminAuth();
    initFilters();
});

/**
 * Khởi tạo filters
 */
function initFilters() {
    const searchInput = document.querySelector('input[type="text"][placeholder*="Tìm kiếm"]');
    const roleFilter = document.querySelectorAll('select')[0];
    const statusFilter = document.querySelectorAll('select')[1];

    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }

    if (roleFilter) {
        roleFilter.addEventListener('change', filterUsers);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterUsers);
    }
}

/**
 * Lọc users
 */
function filterUsers() {
    const searchInput = document.querySelector('input[type="text"][placeholder*="Tìm kiếm"]');
    const roleFilter = document.querySelectorAll('select')[0];
    const statusFilter = document.querySelectorAll('select')[1];

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const roleValue = roleFilter ? roleFilter.value : '';
    const statusValue = statusFilter ? statusFilter.value : '';

    filteredUsers = allUsers.filter(user => {
        const matchSearch = !searchTerm || 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.phone && user.phone.includes(searchTerm));

        const matchRole = !roleValue || user.role === roleValue;
        
        // Nếu user không có trường status, mặc định là 'active'
        const userStatus = user.status || 'active';
        const matchStatus = !statusValue || userStatus === statusValue;

        return matchSearch && matchRole && matchStatus;
    });

    currentPage = 1; // Reset về trang 1 khi filter
    renderUsersTable();
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

    // Hiển thị loading
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="px-6 py-8 text-center">
                <div class="flex justify-center items-center space-x-2">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    <span class="text-gray-600">Đang tải dữ liệu...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const response = await fetch('/api/admin/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                window.location.href = '/auth/login';
                return;
            }
            throw new Error('Failed to load users');
        }

        const result = await response.json();
        
        if (result.success) {
            allUsers = result.data; // Lưu vào biến global
            filteredUsers = result.data; // Khởi tạo filteredUsers
            renderUsersTable();
            
            // Cập nhật số lượng users
            const totalUsersElement = document.querySelector('.text-2xl.font-bold');
            if (totalUsersElement) {
                totalUsersElement.textContent = result.count || result.data.length;
            }
        } else {
            throw new Error(result.error || 'Failed to load users');
        }

    } catch (error) {
        console.error('Error loading users:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-red-500">
                    <i class="fas fa-exclamation-circle text-3xl mb-2"></i>
                    <p>Lỗi tải dữ liệu. Vui lòng thử lại!</p>
                </td>
            </tr>
        `;
    }
}

/**
 * Render bảng users
 */
function renderUsersTable() {
    const tableBody = document.getElementById('usersTableBody');
    
    // Tính toán phân trang
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);
    
    if (currentUsers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    Không có người dùng nào
                </td>
            </tr>
        `;
        renderPagination(0, 0, 0);
        return;
    }

    tableBody.innerHTML = currentUsers.map(user => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <div class="flex items-center space-x-3">
                    <img src="${user.avatar || getAvatarPlaceholder(user.name)}" 
                         alt="${user.name}" 
                         class="w-10 h-10 rounded-full object-cover"
                         onerror="this.src='${getAvatarPlaceholder(user.name)}'">
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
                <span class="px-3 py-1 ${getStatusBadgeClass(user.status || 'active')} text-xs rounded-full font-medium">
                    ${getStatusLabel(user.status || 'active')}
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
                    ${(user.status || 'active') !== 'blocked' ? `
                    <button onclick="banUser('${user._id}')" class="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Khóa tài khoản">
                        <i class="fas fa-ban"></i>
                    </button>
                    ` : `
                    <button onclick="unbanUser('${user._id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Mở khóa tài khoản">
                        <i class="fas fa-unlock"></i>
                    </button>
                    `}
                    <button onclick="deleteUser('${user._id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Render pagination
    renderPagination(totalItems, totalPages, startIndex);
}

/**
 * Render pagination
 */
function renderPagination(totalItems, totalPages, startIndex) {
    const paginationContainer = document.querySelector('.px-6.py-4.border-t.border-gray-200');
    
    if (!paginationContainer) return;
    
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    paginationContainer.innerHTML = `
        <div class="text-sm text-gray-600">
            Hiển thị <span class="font-medium">${totalItems > 0 ? startIndex + 1 : 0}-${endIndex}</span> trong tổng số <span class="font-medium">${totalItems}</span> người dùng
        </div>
        <div class="flex space-x-2">
            <button onclick="goToPage(${currentPage - 1})" 
                    class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                    ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
            ${generatePageButtons(totalPages)}
            <button onclick="goToPage(${currentPage + 1})" 
                    class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                    ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

/**
 * Generate page buttons
 */
function generatePageButtons(totalPages) {
    if (totalPages === 0) return '';
    
    let buttons = '';
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        buttons += `
            <button onclick="goToPage(${i})" 
                    class="px-3 py-2 ${i === currentPage ? 'bg-pink-500 text-white' : 'border border-gray-300 hover:bg-gray-50'} rounded-lg transition-colors">
                ${i}
            </button>
        `;
    }
    
    return buttons;
}

/**
 * Go to specific page
 */
function goToPage(page) {
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderUsersTable();
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

function getAvatarPlaceholder(name) {
    // Sử dụng avatar mặc định từ aic.com.vn
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmAqt8XfW8TPYtvewGnP8EdNCHfzu5iHvcVA&s';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

/**
 * User actions
 */
async function viewUser(userId) {
    const user = allUsers.find(u => u._id === userId);
    if (!user) {
        alert('Không tìm thấy người dùng!');
        return;
    }

    // Lấy số lượng properties của user nếu là landlord
    let propertiesCount = 0;
    if (user.role === 'landlord') {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/properties?landlord=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const result = await response.json();
                propertiesCount = result.data?.length || 0;
            }
        } catch (error) {
            console.error('Error fetching user properties:', error);
        }
    }

    // Hiển thị modal
    const modal = document.getElementById('userModal');
    const modalContent = document.getElementById('userModalContent');
    
    modalContent.innerHTML = `
        <div class="p-6">
            <!-- Header -->
            <div class="flex items-start justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <img src="${user.avatar || getAvatarPlaceholder(user.name)}" 
                         alt="${user.name}" 
                         class="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                         onerror="this.src='${getAvatarPlaceholder(user.name)}'">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900">${user.name}</h3>
                        <div class="flex items-center space-x-2 mt-2">
                            <span class="px-3 py-1 ${getRoleBadgeClass(user.role)} text-xs rounded-full font-medium">
                                ${getRoleLabel(user.role)}
                            </span>
                            <span class="px-3 py-1 ${getStatusBadgeClass(user.status || 'active')} text-xs rounded-full font-medium">
                                ${getStatusLabel(user.status || 'active')}
                            </span>
                        </div>
                    </div>
                </div>
                <button onclick="closeUserModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>

            <!-- Thông tin chi tiết -->
            <div class="grid grid-cols-2 gap-6 mb-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-500 mb-1">Email</div>
                    <div class="font-medium text-gray-900">${user.email}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-500 mb-1">Số điện thoại</div>
                    <div class="font-medium text-gray-900">${user.phone || 'N/A'}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-500 mb-1">Ngày tham gia</div>
                    <div class="font-medium text-gray-900">${formatDate(user.createdAt)}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-500 mb-1">Số dư</div>
                    <div class="font-medium text-gray-900">${(user.balance || 0).toLocaleString('vi-VN')} VNĐ</div>
                </div>
                ${user.role === 'landlord' ? `
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-500 mb-1">Số tin đăng</div>
                    <div class="font-medium text-gray-900">${propertiesCount}</div>
                </div>
                ` : ''}
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 border-t pt-4">
                <button onclick="closeUserModal()" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    Đóng
                </button>
                <button onclick="editUser('${user._id}')" class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    <i class="fas fa-edit mr-2"></i>Chỉnh sửa
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

async function editUser(userId) {
    const user = allUsers.find(u => u._id === userId);
    if (!user) {
        alert('Không tìm thấy người dùng!');
        return;
    }

    const modal = document.getElementById('userModal');
    const modalContent = document.getElementById('userModalContent');
    
    modalContent.innerHTML = `
        <div class="p-6">
            <!-- Header -->
            <div class="flex items-start justify-between mb-6">
                <h3 class="text-2xl font-bold text-gray-900">Chỉnh sửa người dùng</h3>
                <button onclick="closeUserModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>

            <!-- Form -->
            <form id="editUserForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tên người dùng</label>
                    <input type="text" value="${user.name}" disabled class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" value="${user.email}" disabled class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
                    <select id="userRole" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="landlord" ${user.role === 'landlord' ? 'selected' : ''}>Landlord</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                    <select id="userStatus" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                        <option value="active" ${(user.status || 'active') === 'active' ? 'selected' : ''}>Hoạt động</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Không hoạt động</option>
                        <option value="blocked" ${user.status === 'blocked' ? 'selected' : ''}>Đã khóa</option>
                    </select>
                </div>

                <!-- Actions -->
                <div class="flex justify-end space-x-3 border-t pt-4 mt-6">
                    <button type="button" onclick="closeUserModal()" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        Hủy
                    </button>
                    <button type="submit" class="px-4 py-2 text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors">
                        <i class="fas fa-save mr-2"></i>Lưu thay đổi
                    </button>
                </div>
            </form>
        </div>
    `;
    
    modal.classList.remove('hidden');

    // Xử lý submit form
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateUserData(userId);
    });
}

async function updateUserData(userId) {
    const role = document.getElementById('userRole').value;
    const status = document.getElementById('userStatus').value;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role, status })
        });

        if (!response.ok) {
            throw new Error('Failed to update user');
        }

        const result = await response.json();
        
        if (result.success) {
            alert('Đã cập nhật thông tin người dùng thành công!');
            closeUserModal();
            loadUsers(); // Reload danh sách
        } else {
            throw new Error(result.error || 'Failed to update user');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Lỗi khi cập nhật thông tin người dùng. Vui lòng thử lại!');
    }
}

async function deleteUser(userId) {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác!')) {
        return;
    }

    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }

        const result = await response.json();
        
        if (result.success) {
            alert('Đã xóa người dùng thành công!');
            loadUsers(); // Reload danh sách
        } else {
            throw new Error(result.error || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Lỗi khi xóa người dùng. Vui lòng thử lại!');
    }
}

async function banUser(userId) {
    if (!confirm('Bạn có chắc chắn muốn khóa tài khoản người dùng này?')) {
        return;
    }

    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'blocked' })
        });

        if (!response.ok) {
            throw new Error('Failed to ban user');
        }

        const result = await response.json();
        
        if (result.success) {
            alert('Đã khóa tài khoản người dùng thành công!');
            loadUsers(); // Reload danh sách
        } else {
            throw new Error(result.error || 'Failed to ban user');
        }
    } catch (error) {
        console.error('Error banning user:', error);
        alert('Lỗi khi khóa tài khoản người dùng. Vui lòng thử lại!');
    }
}

async function unbanUser(userId) {
    if (!confirm('Bạn có chắc chắn muốn mở khóa tài khoản người dùng này?')) {
        return;
    }

    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'active' })
        });

        if (!response.ok) {
            throw new Error('Failed to unban user');
        }

        const result = await response.json();
        
        if (result.success) {
            alert('Đã mở khóa tài khoản người dùng thành công!');
            loadUsers(); // Reload danh sách
        } else {
            throw new Error(result.error || 'Failed to unban user');
        }
    } catch (error) {
        console.error('Error unbanning user:', error);
        alert('Lỗi khi mở khóa tài khoản người dùng. Vui lòng thử lại!');
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
