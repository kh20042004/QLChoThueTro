/**
 * ===================================
 * PROFILE.JS - Xử lý trang hồ sơ cá nhân
 * Hệ thống cho thuê nhà/phòng trọ
 * ===================================
 */

// Choices.js instances
let provinceChoice = null;
let districtChoice = null;
let wardChoice = null;

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
    
    // Khởi tạo searchable selects sau khi DOM sẵn sàng
    setTimeout(() => {
        initSearchableLocationSelects();
    }, 500);
});

/**
 * Khởi tạo trang hồ sơ
 */
async function initProfilePage() {
    // Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        window.location.href = '/auth/login';
        return;
    }

    try {
        // Load dữ liệu từ localStorage trước (để hiển thị nhanh)
        const localUser = JSON.parse(userData);
        loadUserData(localUser);
        
        // Sau đó fetch dữ liệu mới nhất từ server
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            const serverUser = result.data;
            
            // Cập nhật localStorage với dữ liệu mới từ server
            const updatedUserData = {
                ...localUser,
                ...serverUser,
                id: serverUser._id || localUser.id
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            
            // Load lại dữ liệu mới
            loadUserData(updatedUserData);
        }
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
        document.getElementById('avatarPreview').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff`;
    }

    // Điền vào form thông tin cơ bản
    if (document.getElementById('fullName')) {
        document.getElementById('fullName').value = user.name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        
        // Thêm các trường khác nếu có
        if (document.getElementById('dob') && user.dob) {
            // Chuyển đổi ISO date sang YYYY-MM-DD format cho input[type="date"]
            const date = new Date(user.dob);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('dob').value = formattedDate;
        }
        if (document.getElementById('bio') && user.bio) {
            document.getElementById('bio').value = user.bio;
        }
        if (document.getElementById('gender') && user.gender) {
            document.getElementById('gender').value = user.gender;
        }
    }
    
    // Cập nhật trạng thái xác thực điện thoại
    if (typeof updatePhoneVerificationStatus === 'function') {
        updatePhoneVerificationStatus(user.phoneVerified || false);
    }
    
    // Điền vào form địa chỉ nếu có
    if (user.address) {
        if (document.getElementById('street') && user.address.street) {
            document.getElementById('street').value = user.address.street;
        }
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
    console.log('🔄 Switching to tab:', tabName);
    
    // Ẩn tất cả tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden');
    });

    // Hiển thị tab được chọn
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.classList.remove('hidden');
        console.log('✅ Tab displayed:', tabName);
    } else {
        console.error('❌ Tab not found:', tabName + 'Tab');
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
        console.log('✅ Info form listener attached');
    }

    // Form đổi mật khẩu
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordFormSubmit);
        console.log('✅ Password form listener attached');
        
        // Debug: thêm click listener cho button
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', function(e) {
                console.log('🔘 Change password button clicked!');
                console.log('Button type:', e.target.type);
                console.log('Form:', passwordForm);
            });
        }
    } else {
        console.warn('⚠️ Password form not found!');
    }

    // Form địa chỉ
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
        addressForm.addEventListener('submit', handleAddressFormSubmit);
        console.log('✅ Address form listener attached');
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
 * Khởi tạo Searchable Select với Choices.js
 */
function initSearchableLocationSelects() {
    console.log('🔍 Initializing searchable select boxes for profile...');
    
    // Đợi một chút để đảm bảo DOM đã sẵn sàng
    setTimeout(() => {
        const provinceSelect = document.getElementById('province');
        const districtSelect = document.getElementById('district');
        const wardSelect = document.getElementById('ward');
        
        if (provinceSelect && typeof Choices !== 'undefined') {
            provinceChoice = new Choices(provinceSelect, {
                searchEnabled: true,
                searchPlaceholderValue: 'Tìm kiếm tỉnh/thành phố...',
                noResultsText: 'Không tìm thấy kết quả',
                itemSelectText: 'Nhấn để chọn',
                shouldSort: false,
                placeholder: true,
                placeholderValue: '-- Chọn tỉnh/thành phố --',
                searchResultLimit: 100,
                removeItemButton: false
            });
            console.log('✅ Province searchable select initialized');
        }
        
        if (districtSelect && typeof Choices !== 'undefined') {
            districtChoice = new Choices(districtSelect, {
                searchEnabled: true,
                searchPlaceholderValue: 'Tìm kiếm quận/huyện...',
                noResultsText: 'Không tìm thấy kết quả',
                itemSelectText: 'Nhấn để chọn',
                shouldSort: false,
                placeholder: true,
                placeholderValue: '-- Chọn quận/huyện --',
                searchResultLimit: 100,
                removeItemButton: false
            });
            console.log('✅ District searchable select initialized');
        }
        
        if (wardSelect && typeof Choices !== 'undefined') {
            wardChoice = new Choices(wardSelect, {
                searchEnabled: true,
                searchPlaceholderValue: 'Tìm kiếm phường/xã...',
                noResultsText: 'Không tìm thấy kết quả',
                itemSelectText: 'Nhấn để chọn',
                shouldSort: false,
                placeholder: true,
                placeholderValue: '-- Chọn phường/xã --',
                searchResultLimit: 100,
                removeItemButton: false
            });
            console.log('✅ Ward searchable select initialized');
        }
    }, 500); // Đợi 500ms để Choices.js load xong
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
            // Nếu dùng Choices.js
            if (provinceChoice) {
                const choices = result.data.map(province => ({
                    value: province.code,
                    label: province.name,
                    customProperties: { name: province.name }
                }));
                provinceChoice.clearStore();
                provinceChoice.setChoices(choices, 'value', 'label', true);
            } else {
                // Fallback nếu không có Choices.js
                provinceSelect.innerHTML = '<option value="">-- Chọn tỉnh/thành phố --</option>';
                
                result.data.forEach(province => {
                    const option = document.createElement('option');
                    option.value = province.code;
                    option.textContent = province.name;
                    option.dataset.name = province.name;
                    provinceSelect.appendChild(option);
                });
            }
            
            console.log(`✅ Loaded ${result.data.length} provinces`);
        }
    } catch (error) {
        console.error('❌ Error loading provinces:', error);
        if (provinceChoice) {
            provinceChoice.clearStore();
            provinceChoice.setChoices([{ value: '', label: 'Lỗi tải dữ liệu' }], 'value', 'label', true);
        } else {
            provinceSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        }
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
        
        // Reset ward select
        if (wardChoice) {
            wardChoice.clearStore();
            wardChoice.setChoices([{ value: '', label: '-- Chọn phường/xã --' }], 'value', 'label', true);
        } else {
            resetSelect(wardSelect, '-- Chọn phường/xã --');
        }
        
        const response = await fetch(`/api/locations/provinces/${provinceCode}/districts`);
        const result = await response.json();
        
        if (result.success && result.data) {
            // Nếu dùng Choices.js
            if (districtChoice) {
                const choices = result.data.map(district => ({
                    value: district.code,
                    label: district.name,
                    customProperties: { name: district.name }
                }));
                districtChoice.clearStore();
                districtChoice.setChoices(choices, 'value', 'label', true);
            } else {
                // Fallback
                districtSelect.innerHTML = '<option value="">-- Chọn quận/huyện --</option>';
                
                result.data.forEach(district => {
                    const option = document.createElement('option');
                    option.value = district.code;
                    option.textContent = district.name;
                    option.dataset.name = district.name;
                    districtSelect.appendChild(option);
                });
            }
            
            console.log(`✅ Loaded ${result.data.length} districts for province ${provinceCode}`);
        }
    } catch (error) {
        console.error('❌ Error loading districts:', error);
        if (districtChoice) {
            districtChoice.clearStore();
            districtChoice.setChoices([{ value: '', label: 'Lỗi tải dữ liệu' }], 'value', 'label', true);
        } else {
            districtSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        }
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
            // Nếu dùng Choices.js
            if (wardChoice) {
                const choices = result.data.map(ward => ({
                    value: ward.code,
                    label: ward.name,
                    customProperties: { name: ward.name }
                }));
                wardChoice.clearStore();
                wardChoice.setChoices(choices, 'value', 'label', true);
            } else {
                // Fallback
                wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
                
                result.data.forEach(ward => {
                    const option = document.createElement('option');
                    option.value = ward.code;
                    option.textContent = ward.name;
                    option.dataset.name = ward.name;
                    wardSelect.appendChild(option);
                });
            }
            
            console.log(`✅ Loaded ${result.data.length} wards for district ${districtCode}`);
        }
    } catch (error) {
        console.error('❌ Error loading wards:', error);
        if (wardChoice) {
            wardChoice.clearStore();
            wardChoice.setChoices([{ value: '', label: 'Lỗi tải dữ liệu' }], 'value', 'label', true);
        } else {
            wardSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        }
    } finally {
        hideLoading(wardSelect);
    }
}

/**
 * Reset select box
 */
function resetSelect(selectElement, defaultText) {
    const selectId = selectElement.id;
    let choiceInstance = null;
    
    // Xác định Choices instance tương ứng
    if (selectId === 'province') choiceInstance = provinceChoice;
    else if (selectId === 'district') choiceInstance = districtChoice;
    else if (selectId === 'ward') choiceInstance = wardChoice;
    
    if (choiceInstance) {
        choiceInstance.clearStore();
        choiceInstance.setChoices([{ value: '', label: defaultText }], 'value', 'label', true);
    } else {
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    }
    selectElement.disabled = false;
}

/**
 * Hiển thị trạng thái loading cho select
 */
function showLoading(selectElement) {
    const selectId = selectElement.id;
    let choiceInstance = null;
    
    if (selectId === 'province') choiceInstance = provinceChoice;
    else if (selectId === 'district') choiceInstance = districtChoice;
    else if (selectId === 'ward') choiceInstance = wardChoice;
    
    if (choiceInstance) {
        choiceInstance.clearStore();
        choiceInstance.setChoices([{ value: '', label: 'Đang tải...', disabled: true }], 'value', 'label', true);
    } else {
        selectElement.disabled = true;
        selectElement.innerHTML = '<option value="">Đang tải...</option>';
    }
}

/**
 * Ẩn trạng thái loading cho select
 */
function hideLoading(selectElement) {
    selectElement.disabled = false;
    // Choices.js sẽ tự động enable lại khi setChoices
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
        bio: formData.get('bio')
    };
    
    // Chỉ thêm gender nếu có giá trị hợp lệ
    const gender = formData.get('gender');
    if (gender && gender !== '') {
        data.gender = gender;
    }

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
            
            // Cập nhật localStorage với dữ liệu mới
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            userData.name = data.name;
            userData.phone = data.phone;
            userData.dob = data.dob;
            userData.bio = data.bio;
            userData.gender = data.gender;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Cập nhật hiển thị trên trang
            document.getElementById('profileName').textContent = data.name || 'Người dùng';
            
            // Cập nhật navbar nếu có
            const navUserName = document.getElementById('userName');
            if (navUserName) {
                navUserName.textContent = data.name || 'Người dùng';
            }

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
    console.log('🔐 Password form submitted');

    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    // Reset validation states
    document.getElementById('currentPassword').classList.remove('is-invalid');
    document.getElementById('newPassword').classList.remove('is-invalid');
    document.getElementById('confirmPassword').classList.remove('is-invalid');

    // Validation
    if (!currentPassword) {
        showErrorAlert('Vui lòng nhập mật khẩu hiện tại', e.target);
        document.getElementById('currentPassword').classList.add('is-invalid');
        document.getElementById('currentPassword').focus();
        return;
    }

    if (!newPassword) {
        showErrorAlert('Vui lòng nhập mật khẩu mới', e.target);
        document.getElementById('newPassword').classList.add('is-invalid');
        document.getElementById('newPassword').focus();
        return;
    }

    if (newPassword.length < 8) {
        showErrorAlert('Mật khẩu mới phải có ít nhất 8 ký tự', e.target);
        document.getElementById('newPassword').classList.add('is-invalid');
        document.getElementById('newPassword').focus();
        return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        showErrorAlert('Mật khẩu mới phải có chữ hoa, chữ thường và số', e.target);
        document.getElementById('newPassword').classList.add('is-invalid');
        document.getElementById('newPassword').focus();
        return;
    }

    if (newPassword !== confirmPassword) {
        showErrorAlert('Mật khẩu xác nhận không khớp', e.target);
        document.getElementById('confirmPassword').classList.add('is-invalid');
        document.getElementById('confirmPassword').focus();
        return;
    }

    if (currentPassword === newPassword) {
        showErrorAlert('Mật khẩu mới phải khác mật khẩu hiện tại', e.target);
        document.getElementById('newPassword').classList.add('is-invalid');
        document.getElementById('newPassword').focus();
        return;
    }

    const data = {
        currentPassword,
        newPassword
    };

    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        showLoadingButton(submitBtn);

        console.log('🚀 Sending password change request...');
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        hideLoadingButton(submitBtn);

        const result = await response.json();
        console.log('📥 Response:', result);

        if (response.ok) {
            showSuccessAlert('✅ Mật khẩu đã được thay đổi thành công!', e.target);
            e.target.reset();
            
            // Sau 2 giây, đăng xuất và yêu cầu đăng nhập lại
            setTimeout(() => {
                alert('Vui lòng đăng nhập lại với mật khẩu mới');
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                window.location.href = '/auth/login';
            }, 2000);
        } else {
            showErrorAlert(result.error || 'Thay đổi mật khẩu thất bại', e.target);
            if (result.error && result.error.includes('không đúng')) {
                document.getElementById('currentPassword').classList.add('is-invalid');
                document.getElementById('currentPassword').focus();
            }
        }
    } catch (error) {
        hideLoadingButton(e.target.querySelector('button[type="submit"]'));
        console.error('❌ Error:', error);
        showErrorAlert('Có lỗi xảy ra. Vui lòng thử lại sau.', e.target);
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
    
    // Lấy text name từ Choices.js instances hoặc từ selected option
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');
    
    let provinceName = '';
    let districtName = '';
    let wardName = '';
    
    // Nếu dùng Choices.js, lấy từ instance
    if (provinceChoice) {
        const selected = provinceChoice.getValue();
        provinceSelect.querySelectorAll('option').forEach(opt => {
            if (opt.value === selected.value) {
                provinceName = opt.text;
            }
        });
    } else {
        provinceName = provinceSelect.options[provinceSelect.selectedIndex]?.text || '';
    }
    
    if (districtChoice) {
        const selected = districtChoice.getValue();
        districtSelect.querySelectorAll('option').forEach(opt => {
            if (opt.value === selected.value) {
                districtName = opt.text;
            }
        });
    } else {
        districtName = districtSelect.options[districtSelect.selectedIndex]?.text || '';
    }
    
    if (wardChoice) {
        const selected = wardChoice.getValue();
        wardSelect.querySelectorAll('option').forEach(opt => {
            if (opt.value === selected.value) {
                wardName = opt.text;
            }
        });
    } else {
        wardName = wardSelect.options[wardSelect.selectedIndex]?.text || '';
    }
    
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
            showErrorAlert('Vui lòng chọn một file hình ảnh!', document.querySelector('.max-w-2xl'));
            return;
        }

        // Kiểm tra kích thước (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showErrorAlert('Kích thước file không được vượt quá 5MB!', document.querySelector('.max-w-2xl'));
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

            showSuccessAlert('Tài khoản của bạn đã được xóa vĩnh viễn.', document.body);
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            const error = await response.json();
            showErrorAlert(error.error || 'Xóa tài khoản thất bại', document.body);
        }
    } catch (error) {
        hideLoadingButton(confirmDeleteBtn);
        console.error('Error:', error);
        showErrorAlert('Có lỗi xảy ra. Vui lòng thử lại.', document.body);
    }
}

/**
 * Hiển thị alert thành công
 */
function showSuccessAlert(message, form) {
    removeExistingAlert(form);
    
    const alert = document.createElement('div');
    alert.className = 'bg-green-50 border-l-4 border-green-500 text-green-900 p-4 rounded-lg mb-4 flex items-start animate-slideDown';
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        <i class="fas fa-check-circle text-green-500 text-xl mr-3 mt-0.5"></i>
        <div class="flex-1">
            <p class="font-medium">${message}</p>
        </div>
        <button type="button" class="text-green-700 hover:text-green-900 ml-3" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    form.insertBefore(alert, form.firstChild);
    
    // Scroll to alert
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
        alert.style.transition = 'opacity 0.5s ease-out';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
    }, 5000);
}

/**
 * Hiển thị alert lỗi
 */
function showErrorAlert(message, form) {
    removeExistingAlert(form);
    
    const alert = document.createElement('div');
    alert.className = 'bg-red-50 border-l-4 border-red-500 text-red-900 p-4 rounded-lg mb-4 flex items-start animate-slideDown';
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        <i class="fas fa-exclamation-circle text-red-500 text-xl mr-3 mt-0.5"></i>
        <div class="flex-1">
            <p class="font-medium">${message}</p>
        </div>
        <button type="button" class="text-red-700 hover:text-red-900 ml-3" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    form.insertBefore(alert, form.firstChild);
    
    // Scroll to alert
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
        alert.style.transition = 'opacity 0.5s ease-out';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
    }, 5000);
}

/**
 * Xóa alert hiện tại
 */
function removeExistingAlert(form) {
    // Tìm alert hiện tại (cả Bootstrap và Tailwind)
    const existingAlerts = form.querySelectorAll('.alert, [role="alert"]');
    existingAlerts.forEach(alert => alert.remove());
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

// ===================================
// PHONE VERIFICATION STATUS UI
// ===================================

/**
 * Cập nhật trạng thái hiển thị xác thực điện thoại
 */
function updatePhoneVerificationStatus(isVerified) {
    const statusElement = document.getElementById('phoneVerificationStatus');
    const verifyBtn = document.getElementById('verifyPhoneBtn');
    
    if (!statusElement || !verifyBtn) return;
    
    if (isVerified) {
        // Đã xác thực - Hiển thị badge xanh
        statusElement.innerHTML = `
            <span class="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <i class="fas fa-check-circle mr-1"></i>Đã xác thực
            </span>
        `;
        
        // Disable nút xác thực
        verifyBtn.disabled = true;
        verifyBtn.classList.remove('border-blue-600', 'text-blue-600', 'hover:bg-blue-50');
        verifyBtn.classList.add('border-gray-300', 'text-gray-400', 'cursor-not-allowed');
        verifyBtn.innerHTML = '<i class="fas fa-check-circle mr-1"></i>Đã xác thực';
    } else {
        // Chưa xác thực - Hiển thị badge xám
        statusElement.innerHTML = `
            <span class="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                <i class="fas fa-times-circle mr-1"></i>Chưa xác thực
            </span>
        `;
        
        // Enable nút xác thực
        verifyBtn.disabled = false;
        verifyBtn.classList.remove('border-gray-300', 'text-gray-400', 'cursor-not-allowed');
        verifyBtn.classList.add('border-blue-600', 'text-blue-600', 'hover:bg-blue-50');
        verifyBtn.innerHTML = '<i class="fas fa-shield-alt mr-1"></i>Xác thực ngay';
    }
}

// ===================================
// PHONE VERIFICATION - OTP
// ===================================

let otpTimerInterval = null;
let resendTimerInterval = null;

// Hiển thị OTP modal
function showOTPModal(phone) {
    const modal = document.getElementById('otpModal');
    const phoneDisplay = document.getElementById('otpPhoneDisplay');
    
    if (!modal || !phoneDisplay) return;
    
    // Hiển thị số điện thoại
    phoneDisplay.textContent = phone;
    
    // Reset OTP inputs
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach(input => {
        input.value = '';
        input.classList.remove('border-red-500');
    });
    
    // Focus vào input đầu tiên
    if (otpInputs[0]) {
        setTimeout(() => otpInputs[0].focus(), 100);
    }
    
    // Ẩn error
    hideOTPError();
    
    // Reset và start timers
    startOTPTimer();
    startResendTimer();
    
    // Hiển thị modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Ẩn OTP modal
function hideOTPModal() {
    const modal = document.getElementById('otpModal');
    if (!modal) return;
    
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    
    // Clear timers
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    if (resendTimerInterval) clearInterval(resendTimerInterval);
}

// Hiển thị lỗi OTP
function showOTPError(message) {
    const errorDiv = document.getElementById('otpError');
    const errorMessage = document.getElementById('otpErrorMessage');
    
    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Highlight các input
        document.querySelectorAll('.otp-input').forEach(input => {
            input.classList.add('border-red-500');
        });
    }
}

// Ẩn lỗi OTP
function hideOTPError() {
    const errorDiv = document.getElementById('otpError');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
    
    // Remove highlight
    document.querySelectorAll('.otp-input').forEach(input => {
        input.classList.remove('border-red-500');
    });
}

// Timer cho OTP (10 phút)
function startOTPTimer() {
    let timeLeft = 600; // 10 phút = 600 giây
    const timerElement = document.getElementById('otpTimer');
    
    if (!timerElement) return;
    
    // Clear timer cũ nếu có
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    
    otpTimerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(otpTimerInterval);
            timerElement.textContent = 'Hết hạn';
            timerElement.classList.add('text-red-600');
            showOTPError('Mã OTP đã hết hạn. Vui lòng gửi lại OTP');
        } else if (timeLeft <= 60) {
            timerElement.classList.add('text-red-600');
        }
        
        timeLeft--;
    }, 1000);
}

// Timer cho nút gửi lại OTP (60 giây)
function startResendTimer() {
    let timeLeft = 60;
    const resendBtn = document.getElementById('resendOtpBtn');
    const countdownSpan = document.getElementById('resendCountdown');
    
    if (!resendBtn || !countdownSpan) return;
    
    resendBtn.disabled = true;
    
    // Clear timer cũ nếu có
    if (resendTimerInterval) clearInterval(resendTimerInterval);
    
    resendTimerInterval = setInterval(() => {
        countdownSpan.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(resendTimerInterval);
            resendBtn.disabled = false;
            resendBtn.innerHTML = 'Gửi lại OTP';
        }
        
        timeLeft--;
    }, 1000);
}

// Xử lý input OTP tự động chuyển ô
document.addEventListener('DOMContentLoaded', function() {
    const otpInputs = document.querySelectorAll('.otp-input');
    const verifyBtn = document.getElementById('verifyOtpBtn');
    
    otpInputs.forEach((input, index) => {
        // Chỉ cho nhập số
        input.addEventListener('input', function(e) {
            const value = e.target.value;
            
            // Chỉ giữ lại số
            e.target.value = value.replace(/[^0-9]/g, '');
            
            // Xóa error khi user bắt đầu nhập
            hideOTPError();
            
            // Tự động chuyển sang ô tiếp theo
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            
            // Enable/disable nút verify
            checkOTPComplete();
        });
        
        // Xử lý phím Backspace
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
        
        // Xử lý paste
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
            
            // Điền vào các ô
            for (let i = 0; i < pastedData.length && index + i < otpInputs.length; i++) {
                otpInputs[index + i].value = pastedData[i];
            }
            
            // Focus vào ô cuối cùng được điền
            const lastFilledIndex = Math.min(index + pastedData.length - 1, otpInputs.length - 1);
            otpInputs[lastFilledIndex].focus();
            
            checkOTPComplete();
        });
    });
    
    // Kiểm tra OTP đã nhập đủ chưa
    function checkOTPComplete() {
        const allFilled = Array.from(otpInputs).every(input => input.value.length === 1);
        if (verifyBtn) {
            verifyBtn.disabled = !allFilled;
        }
    }
});

// Xử lý click nút "Xác thực" trên profile
document.addEventListener('DOMContentLoaded', function() {
    const verifyPhoneBtn = document.getElementById('verifyPhoneBtn');
    
    if (verifyPhoneBtn) {
        verifyPhoneBtn.addEventListener('click', async function() {
            const phoneInput = document.getElementById('phone');
            
            if (!phoneInput || !phoneInput.value) {
                showErrorAlert('Vui lòng nhập số điện thoại!', document.querySelector('.max-w-2xl'));
                return;
            }
            
            const phone = phoneInput.value.trim();
            
            // Validate phone
            if (!/^[0-9]{10,11}$/.test(phone)) {
                showErrorAlert('Số điện thoại không hợp lệ! Vui lòng nhập 10-11 chữ số.', document.querySelector('.max-w-2xl'));
                return;
            }
            
            try {
                // Disable button
                verifyPhoneBtn.disabled = true;
                verifyPhoneBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang gửi...';
                
                // Gọi API gửi OTP
                const response = await fetch('/api/auth/phone/send-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ phone })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Hiển thị modal OTP
                    showOTPModal(phone);
                    
                    // Nếu là development mode, log OTP
                    if (result.otp) {
                        console.log('%c🔐 MÃ OTP: ' + result.otp, 'background: #4CAF50; color: white; font-size: 20px; padding: 10px; border-radius: 5px;');
                    }
                } else {
                    showErrorAlert(result.error || 'Không thể gửi OTP. Vui lòng thử lại!', document.querySelector('.max-w-2xl'));
                }
            } catch (error) {
                console.error('Send OTP error:', error);
                showErrorAlert('Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại!', document.querySelector('.max-w-2xl'));
            } finally {
                // Enable button
                verifyPhoneBtn.disabled = false;
                verifyPhoneBtn.innerHTML = '<i class="fas fa-check mr-1"></i>Xác thực';
            }
        });
    }
});

// Xử lý nút "Hủy" trong modal
document.addEventListener('DOMContentLoaded', function() {
    const cancelBtn = document.getElementById('cancelOtpBtn');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            hideOTPModal();
        });
    }
});

// Xử lý nút "Xác thực OTP"
document.addEventListener('DOMContentLoaded', function() {
    const verifyBtn = document.getElementById('verifyOtpBtn');
    
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async function() {
            const otpInputs = document.querySelectorAll('.otp-input');
            const otp = Array.from(otpInputs).map(input => input.value).join('');
            
            if (otp.length !== 6) {
                showOTPError('Vui lòng nhập đủ 6 chữ số');
                return;
            }
            
            try {
                // Show loading
                verifyBtn.disabled = true;
                verifyBtn.querySelector('.verify-btn-text').classList.add('hidden');
                verifyBtn.querySelector('.verify-btn-loading').classList.remove('hidden');
                
                // Gọi API verify OTP
                const response = await fetch('/api/auth/phone/verify-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ otp })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Thành công!
                    hideOTPModal();
                    
                    // Cập nhật trạng thái hiển thị
                    updatePhoneVerificationStatus(true);
                    
                    // Cập nhật localStorage
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    userData.phoneVerified = true;
                    localStorage.setItem('userData', JSON.stringify(userData));
                    
                    // Hiển thị thông báo thành công
                    const formContainer = document.querySelector('.max-w-2xl');
                    showSuccessAlert('🎉 Xác thực số điện thoại thành công!', formContainer);
                } else {
                    // Hiển thị lỗi
                    showOTPError(result.error || 'Mã OTP không đúng');
                }
            } catch (error) {
                console.error('Verify OTP error:', error);
                showOTPError('Có lỗi xảy ra. Vui lòng thử lại.');
            } finally {
                // Hide loading
                verifyBtn.disabled = false;
                verifyBtn.querySelector('.verify-btn-text').classList.remove('hidden');
                verifyBtn.querySelector('.verify-btn-loading').classList.add('hidden');
            }
        });
    }
});

// Xử lý nút "Gửi lại OTP"
document.addEventListener('DOMContentLoaded', function() {
    const resendBtn = document.getElementById('resendOtpBtn');
    
    if (resendBtn) {
        resendBtn.addEventListener('click', async function() {
            const phoneDisplay = document.getElementById('otpPhoneDisplay');
            
            if (!phoneDisplay) return;
            
            const phone = phoneDisplay.textContent;
            
            try {
                resendBtn.disabled = true;
                resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
                
                // Gọi API gửi OTP
                const response = await fetch('/api/auth/phone/send-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ phone })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Reset inputs
                    document.querySelectorAll('.otp-input').forEach(input => {
                        input.value = '';
                    });
                    document.querySelector('.otp-input').focus();
                    
                    // Reset timers
                    startOTPTimer();
                    startResendTimer();
                    
                    hideOTPError();
                    
                    // Log OTP trong development
                    if (result.otp) {
                        console.log('%c🔐 MÃ OTP MỚI: ' + result.otp, 'background: #4CAF50; color: white; font-size: 20px; padding: 10px; border-radius: 5px;');
                    }
                } else {
                    showOTPError(result.error || 'Không thể gửi OTP. Vui lòng thử lại!');
                    resendBtn.disabled = false;
                    resendBtn.innerHTML = 'Gửi lại OTP';
                }
            } catch (error) {
                console.error('Resend OTP error:', error);
                showOTPError('Có lỗi xảy ra khi gửi lại OTP. Vui lòng thử lại!');
                resendBtn.disabled = false;
                resendBtn.innerHTML = 'Gửi lại OTP';
            }
        });
    }
});
