/**
 * ===================================
 * PROFILE.JS - Xử lý trang hồ sơ cá nhân
 * Hệ thống cho thuê nhà/phòng trọ
 * ===================================
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Profile Page Loaded');
    
    // Khởi tạo các hàm
    initProfilePage();
    initTabSwitching();
    initFormHandlers();
    initAvatarUpload();
    initPasswordToggle();
    initDeleteAccountModal();
    initLocationSelects(); // Thêm khởi tạo location
});

/**
 * Khởi tạo trang hồ sơ
 */
function initProfilePage() {
    // Kiểm tra đăng nhập
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = '/auth/login';
        return;
    }

    try {
        const user = JSON.parse(userData);
        loadUserData(user);
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/**
 * Tải dữ liệu người dùng
 */
function loadUserData(user) {
    // Cập nhật sidebar
    document.getElementById('profileName').textContent = user.name || 'Người dùng';
    document.getElementById('profileEmail').textContent = user.email || 'user@example.com';

    // Tạo avatar
    if (user.avatar) {
        document.getElementById('avatarPreview').src = user.avatar;
    } else {
        const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
        const colors = ['0d6efd', '6f42c1', 'dc3545', 'fd7e14', '198754'];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];
        document.getElementById('avatarPreview').src = `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff`;
    }

    // Điền vào form thông tin cơ bản
    if (document.getElementById('fullName')) {
        document.getElementById('fullName').value = user.name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
    }

    // Cập nhật navbar
    if (window.HomeRent && window.HomeRent.updateNavbarAfterLogin) {
        window.HomeRent.updateNavbarAfterLogin(user);
    }
}

/**
 * Chuyển đổi tab
 */
function initTabSwitching() {
    const tabButtons = document.querySelectorAll('[data-tab]');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
            
            // Load location data khi vào tab address
            if (tabName === 'address') {
                // Chỉ load nếu chưa có data
                const provinceSelect = document.getElementById('province');
                if (provinceSelect && provinceSelect.options.length <= 1) {
                    console.log('🌍 Loading location data for address tab...');
                    loadProvinces();
                }
            }
            
            // Cập nhật active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

/**
 * Chuyển đổi nội dung tab
 */
function switchTab(tabName) {
    // Ẩn tất cả tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('d-none');
    });

    // Hiển thị tab được chọn
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.remove('d-none');
    }
}

/**
 * Khởi tạo xử lý form
 */
function initFormHandlers() {
    // Form thông tin cơ bản
    const infoForm = document.getElementById('infoForm');
    if (infoForm) {
        infoForm.addEventListener('submit', handleInfoFormSubmit);
    }

    // Form đổi mật khẩu
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordFormSubmit);
    }

    // Form địa chỉ
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
        addressForm.addEventListener('submit', handleAddressFormSubmit);
    }

    // Form tùy chọn
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', handlePreferencesFormSubmit);
    }
}

/**
 * ===================================
 * LOCATION API INTEGRATION
 * Tích hợp API Tỉnh/Thành phố - Quận/Huyện - Phường/Xã
 * ===================================
 */

/**
 * Khởi tạo các select box location
 */
function initLocationSelects() {
    console.log('🌍 Initializing Location Selects...');
    
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');

    if (!provinceSelect) {
        console.warn('⚠️ Province select not found - skipping location initialization');
        return;
    }

    if (!districtSelect) {
        console.warn('⚠️ District select not found - skipping location initialization');
        return;
    }

    if (!wardSelect) {
        console.warn('⚠️ Ward select not found - skipping location initialization');
        return;
    }

    // Event listener cho province
    provinceSelect.addEventListener('change', function() {
        const provinceCode = this.value;
        if (provinceCode) {
            loadDistricts(provinceCode);
        } else {
            resetSelect(districtSelect, '-- Chọn quận/huyện --');
            resetSelect(wardSelect, '-- Chọn phường/xã --');
        }
    });

    // Event listener cho district
    districtSelect.addEventListener('change', function() {
        const districtCode = this.value;
        if (districtCode) {
            loadWards(districtCode);
        } else {
            resetSelect(wardSelect, '-- Chọn phường/xã --');
        }
    });
    
    console.log('✅ Location event listeners registered');
}

/**
 * Load danh sách tỉnh/thành phố
 */
async function loadProvinces() {
    const provinceSelect = document.getElementById('province');
    
    try {
        showLoading(provinceSelect);
        
        const response = await fetch('/api/locations/provinces');
        const result = await response.json();
        
        if (result.success && result.data) {
            provinceSelect.innerHTML = '<option value="">-- Chọn tỉnh/thành phố --</option>';
            
            result.data.forEach(province => {
                const option = document.createElement('option');
                option.value = province.code;
                option.textContent = province.name;
                option.dataset.name = province.name; // Lưu tên để dùng sau
                provinceSelect.appendChild(option);
            });
            
            console.log(`✅ Loaded ${result.data.length} provinces`);
        }
    } catch (error) {
        console.error('❌ Error loading provinces:', error);
        provinceSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
    } finally {
        hideLoading(provinceSelect);
    }
}

/**
 * Load danh sách quận/huyện theo tỉnh
 */
async function loadDistricts(provinceCode) {
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');
    
    try {
        showLoading(districtSelect);
        resetSelect(wardSelect, '-- Chọn phường/xã --');
        
        const response = await fetch(`/api/locations/provinces/${provinceCode}/districts`);
        const result = await response.json();
        
        if (result.success && result.data) {
            districtSelect.innerHTML = '<option value="">-- Chọn quận/huyện --</option>';
            
            result.data.forEach(district => {
                const option = document.createElement('option');
                option.value = district.code;
                option.textContent = district.name;
                option.dataset.name = district.name; // Lưu tên để dùng sau
                districtSelect.appendChild(option);
            });
            
            console.log(`✅ Loaded ${result.data.length} districts for province ${provinceCode}`);
        }
    } catch (error) {
        console.error('❌ Error loading districts:', error);
        districtSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
    } finally {
        hideLoading(districtSelect);
    }
}

/**
 * Load danh sách phường/xã theo quận/huyện
 */
async function loadWards(districtCode) {
    const wardSelect = document.getElementById('ward');
    
    try {
        showLoading(wardSelect);
        
        const response = await fetch(`/api/locations/districts/${districtCode}/wards`);
        const result = await response.json();
        
        if (result.success && result.data) {
            wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
            
            result.data.forEach(ward => {
                const option = document.createElement('option');
                option.value = ward.code;
                option.textContent = ward.name;
                option.dataset.name = ward.name; // Lưu tên để dùng sau
                wardSelect.appendChild(option);
            });
            
            console.log(`✅ Loaded ${result.data.length} wards for district ${districtCode}`);
        }
    } catch (error) {
        console.error('❌ Error loading wards:', error);
        wardSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
    } finally {
        hideLoading(wardSelect);
    }
}

/**
 * Reset select box
 */
function resetSelect(selectElement, defaultText) {
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    selectElement.disabled = false;
}

/**
 * Hiển thị trạng thái loading cho select
 */
function showLoading(selectElement) {
    selectElement.disabled = true;
    selectElement.innerHTML = '<option value="">Đang tải...</option>';
}

/**
 * Ẩn trạng thái loading cho select
 */
function hideLoading(selectElement) {
    selectElement.disabled = false;
}

/**
 * ===================================
 * END LOCATION API INTEGRATION
 * ===================================
 */

/**
 * Xử lý submit form thông tin cơ bản
 */
async function handleInfoFormSubmit(e) {
    e.preventDefault();

    if (!e.target.checkValidity()) {
        e.target.classList.add('was-validated');
        return;
    }

    const formData = new FormData(e.target);
    const data = {
        name: formData.get('fullName'),
        phone: formData.get('phone'),
        dob: formData.get('dob'),
        bio: formData.get('bio'),
        gender: formData.get('gender')
    };

    try {
        showLoadingButton(e.target.querySelector('button[type="submit"]'));

        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        hideLoadingButton(e.target.querySelector('button[type="submit"]'));

        if (response.ok) {
            const result = await response.json();
            
            // Cập nhật localStorage
            const userData = JSON.parse(localStorage.getItem('userData'));
            Object.assign(userData, data);
            localStorage.setItem('userData', JSON.stringify(userData));

            showSuccessAlert('Thông tin cá nhân đã được cập nhật!', e.target);
        } else {
            const error = await response.json();
            showErrorAlert(error.error || 'Cập nhật thất bại', e.target);
        }
    } catch (error) {
        hideLoadingButton(e.target.querySelector('button[type="submit"]'));
        console.error('Error:', error);
        showErrorAlert('Có lỗi xảy ra. Vui lòng thử lại.', e.target);
    }
}

/**
 * Xử lý submit form đổi mật khẩu
 */
async function handlePasswordFormSubmit(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Kiểm tra mật khẩu xác nhận
    if (newPassword !== confirmPassword) {
        document.getElementById('confirmPassword').classList.add('is-invalid');
        return;
    }

    if (!e.target.checkValidity()) {
        e.target.classList.add('was-validated');
        return;
    }

    const data = {
        currentPassword,
        newPassword
    };

    try {
        showLoadingButton(e.target.querySelector('button[type="submit"]'));

        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        hideLoadingButton(e.target.querySelector('button[type="submit"]'));

        if (response.ok) {
            showSuccessAlert('Mật khẩu đã được thay đổi thành công!', e.target);
            e.target.reset();
        } else {
            const error = await response.json();
            showErrorAlert(error.error || 'Thay đổi mật khẩu thất bại', e.target);
        }
    } catch (error) {
        hideLoadingButton(e.target.querySelector('button[type="submit"]'));
        console.error('Error:', error);
        showErrorAlert('Có lỗi xảy ra. Vui lòng thử lại.', e.target);
    }
}

/**
 * Xử lý submit form địa chỉ
 */
async function handleAddressFormSubmit(e) {
    e.preventDefault();

    if (!e.target.checkValidity()) {
        e.target.classList.add('was-validated');
        return;
    }

    const formData = new FormData(e.target);
    
    // Lấy text name từ selected option
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');
    
    const provinceName = provinceSelect.options[provinceSelect.selectedIndex]?.text || '';
    const districtName = districtSelect.options[districtSelect.selectedIndex]?.text || '';
    const wardName = wardSelect.options[wardSelect.selectedIndex]?.text || '';
    
    const data = {
        address: {
            street: formData.get('street'),
            ward: wardName,
            district: districtName,
            city: provinceName
        }
    };

    try {
        showLoadingButton(e.target.querySelector('button[type="submit"]'));

        const response = await fetch('/api/auth/address', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        hideLoadingButton(e.target.querySelector('button[type="submit"]'));

        if (response.ok) {
            showSuccessAlert('Địa chỉ đã được cập nhật!', e.target);
            
            // Cập nhật localStorage
            const userData = JSON.parse(localStorage.getItem('userData'));
            userData.address = data.address;
            localStorage.setItem('userData', JSON.stringify(userData));
        } else {
            const error = await response.json();
            showErrorAlert(error.error || 'Cập nhật địa chỉ thất bại', e.target);
        }
    } catch (error) {
        hideLoadingButton(e.target.querySelector('button[type="submit"]'));
        console.error('Error:', error);
        showErrorAlert('Có lỗi xảy ra. Vui lòng thử lại.', e.target);
    }
}

/**
 * Xử lý submit form tùy chọn
 */
async function handlePreferencesFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        notifications: {
            email: formData.get('notifyEmail') === 'on',
            sms: formData.get('notifySMS') === 'on',
            push: formData.get('notifyPush') === 'on'
        },
        privacy: formData.get('privacy'),
        security: {
            twoFactor: formData.get('twoFactor') === 'on'
        },
        newsletter: formData.get('newsletter') === 'on'
    };

    try {
        showLoadingButton(e.target.querySelector('button[type="submit"]'));

        const response = await fetch('/api/auth/preferences', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        hideLoadingButton(e.target.querySelector('button[type="submit"]'));

        if (response.ok) {
            showSuccessAlert('Tùy chọn đã được lưu!', e.target);
        } else {
            const error = await response.json();
            showErrorAlert(error.error || 'Lưu tùy chọn thất bại', e.target);
        }
    } catch (error) {
        hideLoadingButton(e.target.querySelector('button[type="submit"]'));
        console.error('Error:', error);
        showErrorAlert('Có lỗi xảy ra. Vui lòng thử lại.', e.target);
    }
}

/**
 * Khởi tạo tải lên ảnh đại diện
 */
function initAvatarUpload() {
    const avatarInput = document.getElementById('avatarInput');
    if (!avatarInput) return;

    avatarInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Kiểm tra loại file
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn một file hình ảnh');
            return;
        }

        // Kiểm tra kích thước (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Kích thước file không được vượt quá 5MB');
            return;
        }

        // Hiển thị preview
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('avatarPreview').src = event.target.result;
        };
        reader.readAsDataURL(file);

        // Tải lên server
        await uploadAvatar(file);
    });

    // Click vào avatar để chọn ảnh (nếu có)
    const avatarLabel = document.querySelector('.avatar-upload-label');
    if (avatarLabel) {
        avatarLabel.addEventListener('click', function() {
            avatarInput.click();
        });
    }
}

/**
 * Tải lên ảnh đại diện
 */
async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await fetch('/api/auth/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            
            // Cập nhật localStorage
            const userData = JSON.parse(localStorage.getItem('userData'));
            userData.avatar = result.avatar;
            localStorage.setItem('userData', JSON.stringify(userData));

            console.log('✅ Avatar uploaded successfully');
        } else {
            console.error('Failed to upload avatar');
        }
    } catch (error) {
        console.error('Error uploading avatar:', error);
    }
}

/**
 * Khởi tạo toggle password
 */
function initPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

/**
 * Khởi tạo modal xóa tài khoản
 */
function initDeleteAccountModal() {
    const confirmDeleteText = document.getElementById('confirmDeleteText');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (!confirmDeleteText || !confirmDeleteBtn) return;

    confirmDeleteText.addEventListener('input', function() {
        confirmDeleteBtn.disabled = this.value !== 'XÓA TÀI KHOẢN';
    });

    confirmDeleteBtn.addEventListener('click', handleDeleteAccount);
}

/**
 * Xử lý xóa tài khoản
 */
async function handleDeleteAccount() {
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    try {
        showLoadingButton(confirmDeleteBtn);

        const response = await fetch('/api/auth/delete-account', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        hideLoadingButton(confirmDeleteBtn);

        if (response.ok) {
            // Xóa dữ liệu
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

            alert('Tài khoản của bạn đã được xóa vĩnh viễn.');
            window.location.href = '/';
        } else {
            const error = await response.json();
            alert(error.error || 'Xóa tài khoản thất bại');
        }
    } catch (error) {
        hideLoadingButton(confirmDeleteBtn);
        console.error('Error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại.');
    }
}

/**
 * Hiển thị alert thành công
 */
function showSuccessAlert(message, form) {
    removeExistingAlert(form);
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show';
    alert.role = 'alert';
    alert.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    form.insertBefore(alert, form.firstChild);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

/**
 * Hiển thị alert lỗi
 */
function showErrorAlert(message, form) {
    removeExistingAlert(form);
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.role = 'alert';
    alert.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    form.insertBefore(alert, form.firstChild);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

/**
 * Xóa alert hiện tại
 */
function removeExistingAlert(form) {
    const existingAlert = form.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
}

/**
 * Hiển thị button loading
 */
function showLoadingButton(button) {
    button.disabled = true;
    button.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Đang xử lý...
    `;
}

/**
 * Ẩn button loading
 */
function hideLoadingButton(button) {
    button.disabled = false;
    const originalText = button.getAttribute('data-original-text') || 'Lưu thay đổi';
    button.innerHTML = originalText;
}

// Lưu text gốc của button khi load
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('button[type="submit"]').forEach(btn => {
        btn.setAttribute('data-original-text', btn.innerHTML);
    });
});
