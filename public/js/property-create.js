/* ===================================
   PROPERTY-CREATE.JS - Xử lý trang đăng tin
   Hệ thống cho thuê nhà/phòng trọ
   =================================== */

// Biến toàn cục
let currentStep = 1;
const totalSteps = 5;
const uploadedImages = [];
const maxImages = 10;
const maxFileSize = 5 * 1024 * 1024; // 5MB

// Choices.js instances
let provinceChoice = null;
let districtChoice = null;
let wardChoice = null;

// ===================================
// 1. KHỞI TẠO TRANG
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
        // Người dùng chưa đăng nhập
        showAlert('Vui lòng đăng nhập để đăng tin', 'danger');
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 2000);
        return;
    }

    // Khởi tạo sự kiện
    initEventListeners();
    initImageUpload();
    updateProgressBar();
    
    // Khởi tạo dropdown vị trí (nếu có dữ liệu từ backend)
    loadLocationData();
    
    // Khởi tạo searchable select boxes
    initSearchableSelects();
    
    console.log('Trang đăng tin đã khởi tạo thành công');
});

// ===================================
// 2. QUẢN LÝ CÁC BƯỚC
// ===================================
function changeStep(step) {
    console.log('changeStep called with step:', step, 'currentStep:', currentStep, 'totalSteps:', totalSteps);
    
    // Kiểm tra bước hợp lệ
    if (step < 1 || step > totalSteps) {
        console.log('Invalid step');
        return;
    }

    // Ẩn tất cả các bước (sử dụng Tailwind CSS class 'hidden')
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('d-none'); // Remove Bootstrap class nếu có
    });

    // Hiển thị bước mới
    const nextStepElement = document.getElementById(`step${step}`);
    console.log(`Looking for element with ID: step${step}`, nextStepElement);
    
    if (nextStepElement) {
        nextStepElement.classList.remove('hidden');
        nextStepElement.classList.remove('d-none'); // Remove Bootstrap class nếu có
        console.log('Step shown successfully');
    } else {
        console.log('Step element not found!');
    }

    // Cập nhật bước hiện tại
    currentStep = step;

    // Cập nhật thanh tiến độ
    updateProgressBar();

    // Cập nhật trạng thái nút
    updateButtonState();

    // Cuộn lên đầu form
    const formElement = document.getElementById('propertyForm');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function nextStep() {
    console.log('nextStep called, current step:', currentStep);
    console.log('Validating current step...');
    
    if (!validateCurrentStep()) {
        console.log('Validation failed');
        return;
    }
    
    console.log('Validation passed, changing step');
    changeStep(currentStep + 1);
}

function previousStep() {
    changeStep(currentStep - 1);
}

// ===================================
// 3. VALIDATION - KIỂM TRA DỮ LIỆU
// ===================================
function validateCurrentStep() {
    let isValid = true;

    if (currentStep === 1) {
        // Kiểm tra Step 1: Thông tin cơ bản
        const type = document.getElementById('propertyType').value;
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const price = document.getElementById('price').value;
        const area = document.getElementById('area').value;
        const bedrooms = document.getElementById('bedrooms').value;
        const bathrooms = document.getElementById('bathrooms').value;

        if (!type || type === '') {
            showFieldError('propertyType', 'Vui lòng chọn loại bất động sản');
            isValid = false;
        }

        if (!title) {
            showFieldError('title', 'Vui lòng nhập tiêu đề');
            isValid = false;
        }

        if (!description) {
            showFieldError('description', 'Vui lòng nhập mô tả');
            isValid = false;
        }

        // Kiểm tra giá - nếu chọn "Thỏa thuận" thì không bắt buộc
        const priceUnit = document.getElementById('priceUnit').value;
        if (priceUnit !== 'thoa-thuan') {
            if (!price || price <= 0) {
                showFieldError('price', 'Vui lòng nhập giá hợp lệ');
                isValid = false;
            }
        }

        if (!area || area <= 0) {
            showFieldError('area', 'Vui lòng nhập diện tích hợp lệ');
            isValid = false;
        }

        if (bedrooms && bedrooms < 0) {
            showFieldError('bedrooms', 'Vui lòng nhập số phòng ngủ hợp lệ');
            isValid = false;
        }

        if (bathrooms && bathrooms < 0) {
            showFieldError('bathrooms', 'Vui lòng nhập số phòng tắm hợp lệ');
            isValid = false;
        }
    } 
    else if (currentStep === 2) {
        // Kiểm tra Step 2: Địa chỉ
        const street = document.getElementById('street').value.trim();
        
        // Lấy giá trị từ Choices.js instances
        let province = '';
        let district = '';
        let ward = '';
        
        if (provinceChoice) {
            const provinceSelected = provinceChoice.getValue();
            province = provinceSelected.value || '';
        } else {
            province = document.getElementById('province').value;
        }
        
        if (districtChoice) {
            const districtSelected = districtChoice.getValue();
            district = districtSelected.value || '';
        } else {
            district = document.getElementById('district').value;
        }
        
        if (wardChoice) {
            const wardSelected = wardChoice.getValue();
            ward = wardSelected.value || '';
        } else {
            ward = document.getElementById('ward').value;
        }

        if (!street) {
            showFieldError('street', 'Vui lòng nhập đường/phố');
            isValid = false;
        }

        if (!province || province === '') {
            showFieldError('province', 'Vui lòng chọn tỉnh/thành phố');
            isValid = false;
        }

        if (!district || district === '') {
            showFieldError('district', 'Vui lòng chọn quận/huyện');
            isValid = false;
        }

        if (!ward || ward === '') {
            showFieldError('ward', 'Vui lòng chọn phường/xã');
            isValid = false;
        }
    } 
    else if (currentStep === 3) {
        // Step 3: Tiện nghi - không bắt buộc
        isValid = true;
    } 
    else if (currentStep === 4) {
        // Kiểm tra Step 4: Ảnh
        if (uploadedImages.length === 0) {
            showAlert('Vui lòng tải lên ít nhất 1 ảnh', 'danger');
            isValid = false;
        }
    } 
    else if (currentStep === 5) {
        // Kiểm tra Step 5: Thông tin liên hệ
        const contactName = document.getElementById('contactName').value.trim();
        const contactPhone = document.getElementById('contactPhone').value.trim();

        if (!contactName) {
            showFieldError('contactName', 'Vui lòng nhập tên');
            isValid = false;
        }

        if (!contactPhone) {
            showFieldError('contactPhone', 'Vui lòng nhập số điện thoại');
            isValid = false;
        } else if (!isValidPhone(contactPhone)) {
            showFieldError('contactPhone', 'Số điện thoại không hợp lệ');
            isValid = false;
        }
    }

    return isValid;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        // Thêm border đỏ cho Tailwind CSS
        field.classList.add('border-red-500', 'border-2');
        field.classList.remove('border-gray-300');
        
        // Xóa thông báo lỗi cũ
        const oldError = field.parentElement.querySelector('.text-red-500.text-sm');
        if (oldError) {
            oldError.remove();
        }
        
        // Thêm thông báo lỗi mới (Tailwind style)
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
    }
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        // Xóa border đỏ
        field.classList.remove('border-red-500', 'border-2');
        field.classList.add('border-gray-300');
        
        // Xóa thông báo lỗi
        const errorDiv = field.parentElement.querySelector('.text-red-500.text-sm');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}

function isValidPhone(phone) {
    // Kiểm tra số điện thoại Việt Nam (10-11 chữ số)
    const phoneRegex = /^(0|\+84)(\d{9,10})$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// ===================================
// 4. CẬP NHẬT THANH TIẾN ĐỘ
// ===================================
function updateProgressBar() {
    const percentage = (currentStep / totalSteps) * 100;
    const progressBar = document.getElementById('progressBar'); // Sửa từ querySelector thành getElementById
    if (progressBar) {
        progressBar.style.width = percentage + '%';
        progressBar.setAttribute('aria-valuenow', percentage);
    }

    // Cập nhật văn bản tiến độ
    const currentStepText = document.getElementById('currentStep'); // Sửa từ querySelector thành getElementById
    if (currentStepText) {
        currentStepText.textContent = currentStep;
    }
}

// ===================================
// 5. CẬP NHẬT TRẠNG THÁI NÚT
// ===================================
function updateButtonState() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Ẩn/hiện nút Previous
    if (prevBtn) {
        prevBtn.style.display = currentStep === 1 ? 'none' : 'block';
    }

    // Ẩn/hiện nút Next và Submit
    if (nextBtn) {
        nextBtn.style.display = currentStep === totalSteps ? 'none' : 'block';
    }

    if (submitBtn) {
        submitBtn.style.display = currentStep === totalSteps ? 'block' : 'none';
    }
}

// ===================================
// 6. XỬ LÝ UPLOAD ẢNH
// ===================================
let imageUploadInitialized = false; // Flag để tránh init nhiều lần

function initImageUpload() {
    if (imageUploadInitialized) {
        console.log('⚠️ Image upload đã được init, bỏ qua');
        return;
    }
    
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('propertyImages');

    if (!uploadArea || !fileInput) {
        console.error('❌ Không tìm thấy uploadArea hoặc fileInput');
        return;
    }

    console.log('🖼️ Khởi tạo image upload...');

    // Click để chọn ảnh - đơn giản, không preventDefault
    uploadArea.addEventListener('click', (e) => {
        // Chỉ trigger nếu không click trực tiếp vào input
        if (e.target !== fileInput) {
            console.log('🖱️ Click vào upload area');
            fileInput.value = ''; // Reset để có thể chọn lại cùng file
            fileInput.click();
        }
    });

    // Chọn ảnh
    fileInput.addEventListener('change', (e) => {
        console.log('📁 File input changed');
        handleImageSelection(e.target.files);
    });

    // Kéo thả
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleImageSelection(e.dataTransfer.files);
    });
    
    imageUploadInitialized = true;
    console.log('✅ Image upload đã được khởi tạo');
}

function handleImageSelection(files) {
    console.log('📸 Số file được chọn:', files.length);
    
    Array.from(files).forEach(file => {
        console.log('  - File:', file.name, 'Size:', (file.size / 1024).toFixed(2) + 'KB');
        
        // Kiểm tra loại file
        if (!file.type.startsWith('image/')) {
            showAlert(`${file.name} không phải là ảnh`, 'danger');
            console.warn('  ❌ Không phải file ảnh');
            return;
        }

        // Kiểm tra kích thước file
        if (file.size > maxFileSize) {
            showAlert(`${file.name} vượt quá 5MB`, 'danger');
            console.warn('  ❌ File quá lớn:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
            return;
        }

        // Kiểm tra số lượng ảnh
        if (uploadedImages.length >= maxImages) {
            showAlert(`Tối đa ${maxImages} ảnh`, 'danger');
            console.warn('  ❌ Đã đạt giới hạn ảnh');
            return;
        }

        // Đọc ảnh
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImages.push({
                file: file,
                preview: e.target.result,
                name: file.name
            });
            console.log('  ✅ Đã thêm ảnh:', file.name);
            updateImageGallery();
        };
        reader.onerror = (error) => {
            console.error('  ❌ Lỗi đọc file:', error);
            showAlert(`Lỗi đọc file ${file.name}`, 'danger');
        };
        reader.readAsDataURL(file);
    });
}

function updateImageGallery() {
    const gallery = document.getElementById('imageGallery'); // Sửa từ querySelector thành getElementById
    const uploadArea = document.getElementById('imageUploadArea');
    
    if (!gallery) {
        console.error('❌ Không tìm thấy imageGallery element');
        return;
    }

    gallery.innerHTML = '';

    uploadedImages.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'relative group overflow-hidden rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-all';
        imageItem.innerHTML = `
            <img src="${image.preview}" alt="Preview ${index + 1}" class="w-full h-32 object-cover">
            <button type="button" 
                    class="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center" 
                    onclick="removeImage(${index})" 
                    title="Xóa ảnh">
                <i class="fas fa-times"></i>
            </button>
            <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 text-center">
                Ảnh ${index + 1}/${uploadedImages.length}
            </div>
        `;
        gallery.appendChild(imageItem);
    });
    
    console.log(`✅ Đã cập nhật gallery với ${uploadedImages.length} ảnh`);
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    updateImageGallery();
    console.log(`🗑️ Đã xóa ảnh ${index + 1}`);
}

// ===================================
// 7. XỬ LÝ DỮ LIỆU ĐỊA ĐIỂM
// ===================================

/**
 * Khởi tạo Searchable Select với Choices.js
 */
function initSearchableSelects() {
    console.log('🔍 Initializing searchable select boxes...');
    
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
            console.log('✅ Province select initialized');
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
            console.log('✅ District select initialized');
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
            console.log('✅ Ward select initialized');
        }
    }, 500); // Đợi 500ms để Choices.js load xong
}

async function loadLocationData() {
    console.log('🌍 Loading location data from API...');
    
    const provinceSelect = document.getElementById('province');
    if (!provinceSelect) {
        console.warn('Province select not found');
        return;
    }

    try {
        // Gọi API lấy danh sách tỉnh/thành phố
        const response = await fetch('/api/locations/provinces');
        const result = await response.json();

        if (result.success && result.data) {
            // Clear existing options
            provinceSelect.innerHTML = '<option value="">-- Chọn tỉnh/thành phố --</option>';
            
            // Thêm các tỉnh/thành phố từ API
            result.data.forEach(province => {
                const option = document.createElement('option');
                option.value = province.code;
                option.textContent = province.name;
                option.dataset.name = province.name; // Lưu tên để dùng sau
                provinceSelect.appendChild(option);
            });
            
            console.log(`✅ Loaded ${result.data.length} provinces`);
        }

        // Sự kiện thay đổi tỉnh
        provinceSelect.addEventListener('change', function() {
            clearFieldError('province');
            const provinceCode = this.value;
            if (provinceCode) {
                loadDistricts(provinceCode);
            } else {
                // Reset district và ward
                const districtSelect = document.getElementById('district');
                const wardSelect = document.getElementById('ward');
                if (districtSelect) districtSelect.innerHTML = '<option value="">-- Chọn quận/huyện --</option>';
                if (wardSelect) wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
            }
        });

    } catch (error) {
        console.error('❌ Error loading provinces:', error);
        showAlert('Không thể tải dữ liệu tỉnh/thành phố', 'danger');
    }
}

async function loadDistricts(provinceCode) {
    console.log('🏘️ Loading districts for province:', provinceCode);
    
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');

    if (!districtSelect) return;

    try {
        // Reset ward select
        if (wardChoice) {
            wardChoice.clearStore();
            wardChoice.setChoices([{ value: '', label: '-- Chọn phường/xã --' }], 'value', 'label', true);
        } else {
            wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
        }

        // Show loading for district
        if (districtChoice) {
            districtChoice.clearStore();
            districtChoice.setChoices([{ value: '', label: 'Đang tải...', disabled: true }], 'value', 'label', true);
        } else {
            districtSelect.innerHTML = '<option value="">Đang tải...</option>';
        }

        // Gọi API lấy danh sách quận/huyện
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
            
            console.log(`✅ Loaded ${result.data.length} districts`);
        } else {
            if (districtChoice) {
                districtChoice.clearStore();
                districtChoice.setChoices([{ value: '', label: 'Không có dữ liệu' }], 'value', 'label', true);
            } else {
                districtSelect.innerHTML = '<option value="">Không có dữ liệu</option>';
            }
        }

        // Event listener cho district (chỉ add một lần)
        districtSelect.removeEventListener('change', handleDistrictChange);
        districtSelect.addEventListener('change', handleDistrictChange);

    } catch (error) {
        console.error('❌ Error loading districts:', error);
        if (districtChoice) {
            districtChoice.clearStore();
            districtChoice.setChoices([{ value: '', label: 'Lỗi tải dữ liệu' }], 'value', 'label', true);
        } else {
            districtSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        }
    }
}

// Helper function cho district change event
function handleDistrictChange() {
    clearFieldError('district');
    const districtCode = this.value;
    if (districtCode) {
        loadWards(districtCode);
    } else {
        const wardSelect = document.getElementById('ward');
        if (wardChoice) {
            wardChoice.clearStore();
            wardChoice.setChoices([{ value: '', label: '-- Chọn phường/xã --' }], 'value', 'label', true);
        } else {
            wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
        }
    }
}

async function loadWards(districtCode) {
    console.log('🏘️ Loading wards for district:', districtCode);
    
    const wardSelect = document.getElementById('ward');
    if (!wardSelect) return;

    try {
        // Show loading
        if (wardChoice) {
            wardChoice.clearStore();
            wardChoice.setChoices([{ value: '', label: 'Đang tải...', disabled: true }], 'value', 'label', true);
        } else {
            wardSelect.innerHTML = '<option value="">Đang tải...</option>';
        }

        // Gọi API lấy danh sách phường/xã
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
            
            console.log(`✅ Loaded ${result.data.length} wards`);
        } else {
            if (wardChoice) {
                wardChoice.clearStore();
                wardChoice.setChoices([{ value: '', label: 'Không có dữ liệu' }], 'value', 'label', true);
            } else {
                wardSelect.innerHTML = '<option value="">Không có dữ liệu</option>';
            }
        }

        // Event listener cho ward (chỉ add một lần)
        wardSelect.removeEventListener('change', handleWardChange);
        wardSelect.addEventListener('change', handleWardChange);

    } catch (error) {
        console.error('❌ Error loading wards:', error);
        if (wardChoice) {
            wardChoice.clearStore();
            wardChoice.setChoices([{ value: '', label: 'Lỗi tải dữ liệu' }], 'value', 'label', true);
        } else {
            wardSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        }
    }
}

// Helper function cho ward change event
function handleWardChange() {
    clearFieldError('ward');
}

// ===================================
// 8. XỬ LÝ GỬI BIỂU MẪU
// ===================================
// ===================================
function submitPropertyForm() {
    if (!validateCurrentStep()) {
        return;
    }

    // Thu thập dữ liệu từ biểu mẫu
    const formData = new FormData();

    // Step 1: Thông tin cơ bản
    formData.append('type', document.getElementById('propertyType').value);
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('area', document.getElementById('area').value);
    formData.append('bedrooms', document.getElementById('bedrooms').value);
    formData.append('bathrooms', document.getElementById('bathrooms').value);

    // Step 2: Địa chỉ
    formData.append('street', document.getElementById('street').value);
    
    // Lấy TÊN (label) từ Choices.js instances, không phải code
    let provinceValue = '';
    let districtValue = '';
    let wardValue = '';
    
    if (provinceChoice) {
        const provinceSelected = provinceChoice.getValue();
        // Lấy label thay vì value (code)
        const provinceElement = document.querySelector(`#province option[value="${provinceSelected.value}"]`);
        provinceValue = provinceElement ? provinceElement.textContent : '';
    } else {
        const provinceElement = document.getElementById('province');
        provinceValue = provinceElement.options[provinceElement.selectedIndex]?.text || '';
    }
    
    if (districtChoice) {
        const districtSelected = districtChoice.getValue();
        const districtElement = document.querySelector(`#district option[value="${districtSelected.value}"]`);
        districtValue = districtElement ? districtElement.textContent : '';
    } else {
        const districtElement = document.getElementById('district');
        districtValue = districtElement.options[districtElement.selectedIndex]?.text || '';
    }
    
    if (wardChoice) {
        const wardSelected = wardChoice.getValue();
        const wardElement = document.querySelector(`#ward option[value="${wardSelected.value}"]`);
        wardValue = wardElement ? wardElement.textContent : '';
    } else {
        const wardElement = document.getElementById('ward');
        wardValue = wardElement.options[wardElement.selectedIndex]?.text || '';
    }
    
    formData.append('province', provinceValue);
    formData.append('district', districtValue);
    formData.append('ward', wardValue);

    // Step 3: Tiện nghi
    const amenities = {
        wifi: document.getElementById('wifi')?.checked || false,
        ac: document.getElementById('ac')?.checked || false,
        parking: document.getElementById('parking')?.checked || false,
        kitchen: document.getElementById('kitchen')?.checked || false,
        water: document.getElementById('water')?.checked || false,
        laundry: document.getElementById('laundry')?.checked || false,
        balcony: document.getElementById('balcony')?.checked || false,
        security: document.getElementById('security')?.checked || false
    };
    formData.append('amenities', JSON.stringify(amenities));

    // Step 4: Ảnh
    uploadedImages.forEach((image, index) => {
        formData.append(`images`, image.file);
    });

    // Step 5: Thông tin liên hệ
    formData.append('contactName', document.getElementById('contactName').value);
    formData.append('contactPhone', document.getElementById('contactPhone').value);
    formData.append('allowCalls', document.getElementById('allowCall')?.checked || false);
    formData.append('allowSMS', document.getElementById('allowSms')?.checked || false);

    // Gửi yêu cầu
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    fetch('/api/properties', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            // Lấy thông báo lỗi từ server
            throw new Error(data.error || data.message || 'Có lỗi xảy ra khi đăng tin');
        }
        return data;
    })
    .then(data => {
        showAlert('Đăng tin thành công!', 'success');
        
        // Lưu thông tin đăng tin vào localStorage
        if (data.data) {
            // Lấy danh sách đăng tin từ localStorage
            let myProperties = JSON.parse(localStorage.getItem('myProperties')) || [];
            
            // Tạo object property với thông tin cơ bản
            const newProperty = {
                _id: data.data._id,
                title: data.data.title,
                description: data.data.description,
                propertyType: data.data.propertyType,
                price: data.data.price,
                area: data.data.area,
                address: data.data.address,
                images: data.data.images,
                bedrooms: data.data.bedrooms,
                bathrooms: data.data.bathrooms,
                amenities: data.data.amenities,
                status: data.data.status,
                createdAt: data.data.createdAt,
                views: data.data.views || 0
            };
            
            // Thêm property mới vào đầu danh sách
            myProperties.unshift(newProperty);
            
            // Lưu lại vào localStorage (giới hạn tối đa 50 items để không quá lớn)
            if (myProperties.length > 50) {
                myProperties = myProperties.slice(0, 50);
            }
            localStorage.setItem('myProperties', JSON.stringify(myProperties));
            
            console.log('✅ Đã lưu thông tin đăng tin vào localStorage');
        }
        
        setTimeout(() => {
            window.location.href = '/properties';
        }, 2000);
    })
    .catch(error => {
        console.error('Lỗi:', error);
        showAlert('Lỗi: ' + error.message, 'danger');
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
    });
}

// ===================================
// 9. SỰ KIỆN CHUNG
// ===================================
function initEventListeners() {
    // Nút điều hướng
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', previousStep);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextStep);
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', submitPropertyForm);
    }

    // Xóa thông báo lỗi khi người dùng nhập dữ liệu
    document.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('input', function() {
            if (this.id) {
                clearFieldError(this.id);
            }
        });

        field.addEventListener('change', function() {
            if (this.id) {
                clearFieldError(this.id);
            }
        });
    });

    // Xử lý thay đổi đơn vị giá
    const priceUnit = document.getElementById('priceUnit');
    const priceInput = document.getElementById('price');
    
    if (priceUnit) {
        priceUnit.addEventListener('change', function() {
            if (this.value === 'thoa-thuan') {
                // Thỏa thuận - lock input giá
                priceInput.disabled = true;
                priceInput.value = '';
                priceInput.placeholder = 'Không cần nhập (Thỏa thuận)';
                priceInput.style.backgroundColor = '#e9ecef';
                priceInput.style.color = '#999';
                priceInput.removeAttribute('required');
            } else {
                // Các option khác - unlock input giá
                priceInput.disabled = false;
                priceInput.placeholder = '0';
                priceInput.style.backgroundColor = 'white';
                priceInput.style.color = 'inherit';
                priceInput.setAttribute('required', 'required');
            }
            clearFieldError('price');
        });
    }

    // Cập nhật trạng thái nút
    updateButtonState();
}

// ===================================
// 10. THÔNG BÁO - Sử dụng showAlert từ auth.js
// ===================================
// showAlert function được định nghĩa trong auth.js và đã được load trước
