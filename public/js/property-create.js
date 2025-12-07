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
// HELPER FUNCTIONS - Format Price
// ===================================

/**
 * Format số thành chuỗi có dấu chấm ngăn cách hàng nghìn
 * VD: 5000000 -> "5.000.000"
 */
function formatNumber(num) {
    if (!num) return '';
    // Loại bỏ tất cả ký tự không phải số
    const numStr = num.toString().replace(/\D/g, '');
    // Thêm dấu chấm ngăn cách
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Loại bỏ format và trả về số thuần
 * VD: "5.000.000" -> 5000000
 */
function parseFormattedNumber(str) {
    if (!str) return 0;
    return parseInt(str.toString().replace(/\./g, ''), 10) || 0;
}

/**
 * Chuyển đổi số thành chữ (đọc số tiền)
 * VD: 5000000 -> "Năm triệu"
 */
function numberToWords(num) {
    if (!num || num === 0) return '';
    
    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];
    
    if (num >= 1000000000) {
        const ty = Math.floor(num / 1000000000);
        const trieu = Math.floor((num % 1000000000) / 1000000);
        const ngan = Math.floor((num % 1000000) / 1000);
        
        let result = ty + ' tỷ';
        if (trieu > 0) result += ' ' + trieu + ' triệu';
        if (ngan > 0) result += ' ' + ngan + ' nghìn';
        return result;
    } else if (num >= 1000000) {
        const trieu = Math.floor(num / 1000000);
        const ngan = Math.floor((num % 1000000) / 1000);
        
        let result = trieu + ' triệu';
        if (ngan > 0) result += ' ' + ngan + ' nghìn';
        return result;
    } else if (num >= 1000) {
        const ngan = Math.floor(num / 1000);
        const tram = num % 1000;
        
        let result = ngan + ' nghìn';
        if (tram > 0) result += ' ' + tram;
        return result;
    }
    
    return num.toString();
}

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
    
    // 🆕 Khởi tạo Goong Address Autocomplete
    if (typeof initGoongAutocomplete === 'function') {
        initGoongAutocomplete();
    }
    
    // Khởi tạo dropdown vị trí (nếu có dữ liệu từ backend) - CÓ THỂ XÓA SAU
    // loadLocationData();
    
    // Khởi tạo searchable select boxes - CÓ THỂ XÓA SAU
    // initSearchableSelects();
    
    // 🆕 Khởi tạo Nearby POI listeners
    setupNearbyPoiListeners();
    
    // Expose hàm collect data ra window để price-prediction.js có thể dùng
    window.collectPropertyFormData = collectPropertyFormData;
    window.changeStep = changeStep; // Expose luôn changeStep để price-prediction dùng
    
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

/**
 * HÀM CHUNG: Thu thập dữ liệu form cho cả AI prediction và submission
 * Trả về plain JS object với đầy đủ thông tin theo cấu trúc chuẩn
 * @returns {Object} Dữ liệu form đã chuẩn hóa
 */
function collectPropertyFormData() {
    console.log('📊 Thu thập dữ liệu form...');
    
    // ĐỌC TỪ HIDDEN FIELDS (Goong Autocomplete)
    const street = document.getElementById('street')?.value || '';
    const ward = document.getElementById('ward')?.value || '';
    const district = document.getElementById('district')?.value || '';
    const province = document.getElementById('province')?.value || '';
    const fullAddress = document.getElementById('address')?.value || '';
    const latitude = parseFloat(document.getElementById('latitude')?.value) || 0;
    const longitude = parseFloat(document.getElementById('longitude')?.value) || 0;
    
    // Map province -> city cho AI (chỉ hỗ trợ 3 thành phố chính)
    let cityForAI = '';
    const provinceLower = province.toLowerCase();
    if (provinceLower.includes('hồ chí minh') || provinceLower.includes('hcm') || provinceLower.includes('tp.hcm')) {
        cityForAI = 'HCM';
    } else if (provinceLower.includes('hà nội') || provinceLower.includes('hanoi')) {
        cityForAI = 'HaNoi';
    } else if (provinceLower.includes('đà nẵng') || provinceLower.includes('da nang')) {
        cityForAI = 'DaNang';
    }
    
    // Map room_type cho AI dựa vào propertyType + is_studio
    const propertyType = document.getElementById('propertyType').value;
    const isStudio = document.getElementById('is_studio')?.checked || false;
    let roomTypeForAI = '';
    
    if (isStudio) {
        roomTypeForAI = 'Studio';
    } else {
        // Map theo propertyType
        if (propertyType === 'phong-tro' || propertyType === 'homestay') {
            roomTypeForAI = 'Phòng trọ';
        } else if (propertyType === 'can-ho' || propertyType === 'chung-cu-mini' || propertyType === 'nha-nguyen-can') {
            roomTypeForAI = 'Căn hộ dịch vụ';
        } else {
            roomTypeForAI = 'Phòng trọ'; // Default
        }
    }
    
    // Lấy giá và parse đúng format
    const priceInput = document.getElementById('price');
    const priceUnit = document.getElementById('priceUnit').value;
    let priceValue = 0;
    
    if (priceUnit === 'trieu-thang' || priceUnit === 'trieu-nam' || priceUnit === 'usd-thang') {
        // Đơn vị triệu/USD - có thể có số thập phân
        priceValue = parseFloat(priceInput.value) || 0;
    } else {
        // Đơn vị VNĐ - parse số đã format
        priceValue = parseFormattedNumber(priceInput.value);
    }
    
    // Thu thập amenities
    const amenities = {
        // Tiện nghi quan trọng cho AI (sử dụng ID mới has_*)
        has_mezzanine: document.getElementById('has_mezzanine')?.checked || false,
        has_wc: document.getElementById('has_wc')?.checked || false,
        has_ac: document.getElementById('has_ac')?.checked || false,
        has_furniture: document.getElementById('has_furniture')?.checked || false,
        has_balcony: document.getElementById('has_balcony')?.checked || false,
        has_kitchen: document.getElementById('has_kitchen')?.checked || false,
        has_parking: document.getElementById('has_parking')?.checked || false,
        has_window: document.getElementById('has_window')?.checked || false,
        
        // Các tiện nghi bổ sung (chỉ để hiển thị, không gửi cho AI)
        wifi: document.getElementById('wifi')?.checked || false,
        water: document.getElementById('water')?.checked || false,
        laundry: document.getElementById('laundry')?.checked || false,
        security: document.getElementById('security')?.checked || false,
        tv: document.getElementById('tv')?.checked || false,
        refrigerator: document.getElementById('refrigerator')?.checked || false,
        bed: document.getElementById('bed')?.checked || false,
        sofa: document.getElementById('sofa')?.checked || false,
        desk: document.getElementById('desk')?.checked || false,
        microwave: document.getElementById('microwave')?.checked || false,
        elevator: document.getElementById('elevator')?.checked || false,
        gym: document.getElementById('gym')?.checked || false,
        pool: document.getElementById('pool')?.checked || false,
        garden: document.getElementById('garden')?.checked || false,
        bbq: document.getElementById('bbq')?.checked || false,
        lounge: document.getElementById('lounge')?.checked || false,
        cctv: document.getElementById('cctv')?.checked || false,
        alarm: document.getElementById('alarm')?.checked || false,
        petFriendly: document.getElementById('petFriendly')?.checked || false,
        soundproof: document.getElementById('soundproof')?.checked || false,
        heating: document.getElementById('heating')?.checked || false,
        storage: document.getElementById('storage')?.checked || false
    };
    
    // Cấu trúc dữ liệu chuẩn
    const formData = {
        // Thông tin cơ bản
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        room_type: roomTypeForAI, // 'Studio', 'Phòng trọ', 'Căn hộ dịch vụ' cho AI
        propertyType: document.getElementById('propertyType').value, // phong-tro, nha-nguyen-can cho backend
        acreage: parseFloat(document.getElementById('area').value) || 0,
        is_studio: isStudio,
        
        // Vị trí (từ Goong Autocomplete)
        location: {
            city: cityForAI, // 'HCM', 'HaNoi', 'DaNang' hoặc rỗng
            cityText: province, // Tên đầy đủ tỉnh/thành phố
            district: district, // "Quận 1", "Quận Hoàn Kiếm"
            ward: ward, // "Phường Phạm Ngũ Lão"
            address: fullAddress, // Địa chỉ đầy đủ từ Goong
            street: street,
            latitude: latitude,
            longitude: longitude
        },
        
        // Giá
        price: {
            value: priceValue,
            unit: priceUnit,
            // Chuyển sang VNĐ cho AI nếu cần
            valueInVND: priceUnit === 'trieu-thang' ? priceValue * 1000000 : 
                        priceUnit === 'vnd-thang' ? priceValue : 
                        priceUnit === 'trieu-nam' ? (priceValue * 1000000) / 12 :
                        0
        },
        
        // Tiện nghi
        amenities: amenities,
        
        // Thông tin phòng
        bedrooms: parseInt(document.getElementById('bedrooms').value) || 0,
        bathrooms: parseInt(document.getElementById('bathrooms').value) || 0,
        
        // Thông tin liên hệ (nếu đã điền)
        contact: {
            name: document.getElementById('contactName')?.value.trim() || '',
            phone: document.getElementById('contactPhone')?.value.trim() || '',
            allowCall: document.getElementById('allowCall')?.checked || false,
            allowSms: document.getElementById('allowSms')?.checked || false
        }
    };
    
    console.log('✅ Dữ liệu form đã thu thập:', formData);
    return formData;
}

// ===================================
function submitPropertyForm() {
    if (!validateCurrentStep()) {
        return;
    }

    // Thu thập dữ liệu từ hàm chung
    const propertyData = collectPropertyFormData();
    
    // Chuyển sang FormData để submit
    const formData = new FormData();

    // Step 1: Thông tin cơ bản
    formData.append('type', propertyData.propertyType); // ✅ Gửi propertyType (slug) cho backend, không phải room_type (text AI)
    formData.append('title', propertyData.title);
    formData.append('description', propertyData.description);
    formData.append('price', propertyData.price.value);
    formData.append('priceUnit', propertyData.price.unit);
    formData.append('area', propertyData.acreage);
    formData.append('bedrooms', propertyData.bedrooms);
    formData.append('bathrooms', propertyData.bathrooms);
    formData.append('isStudio', propertyData.is_studio);

    // Step 2: Địa chỉ - gửi text và coordinates từ Goong
    formData.append('street', propertyData.location.street);
    formData.append('province', propertyData.location.cityText);
    formData.append('district', propertyData.location.district);
    formData.append('ward', propertyData.location.ward);
    formData.append('address', propertyData.location.address); // Địa chỉ đầy đủ
    formData.append('latitude', propertyData.location.latitude);
    formData.append('longitude', propertyData.location.longitude);

    // Step 3: Tiện nghi
    formData.append('amenities', JSON.stringify(propertyData.amenities));

    // Step 4: Ảnh
    uploadedImages.forEach((image, index) => {
        formData.append(`images`, image.file);
    });

    // Step 5: Thông tin liên hệ
    formData.append('contactName', propertyData.contact.name);
    formData.append('contactPhone', propertyData.contact.phone);
    formData.append('allowCalls', propertyData.contact.allowCall);
    formData.append('allowSMS', propertyData.contact.allowSms);
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

    // Xử lý format giá tiền
    const priceInput = document.getElementById('price');
    const priceUnit = document.getElementById('priceUnit');
    
    if (priceInput) {
        priceInput.addEventListener('input', function(e) {
            const unit = priceUnit ? priceUnit.value : 'trieu-thang';
            
            // Kiểm tra xem có phải đơn vị triệu hoặc USD (cho phép số thập phân)
            const allowDecimal = unit === 'trieu-thang' || unit === 'trieu-nam' || unit === 'usd-thang';
            
            if (allowDecimal) {
                // Cho phép số và dấu chấm thập phân (chỉ 1 dấu chấm, tối đa 2 chữ số sau chấm)
                let value = e.target.value;
                
                // Loại bỏ ký tự không hợp lệ (giữ lại số và dấu chấm)
                value = value.replace(/[^\d.]/g, '');
                
                // Chỉ cho phép 1 dấu chấm
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                
                // Giới hạn 2 chữ số sau dấu chấm
                if (parts.length === 2 && parts[1].length > 2) {
                    value = parts[0] + '.' + parts[1].substring(0, 2);
                }
                
                e.target.value = value;
            } else {
                // Đơn vị VNĐ - format với dấu chấm ngăn cách hàng nghìn
                // Lấy giá trị và loại bỏ tất cả dấu chấm
                const value = e.target.value.replace(/\./g, '');
                
                // Chỉ cho phép số
                if (value && !/^\d+$/.test(value)) {
                    e.target.value = e.target.value.slice(0, -1);
                    return;
                }
                
                // Format lại với dấu chấm ngăn cách
                if (value) {
                    e.target.value = formatNumber(value);
                }
            }
        });
        
        priceInput.addEventListener('blur', function(e) {
            const unit = priceUnit ? priceUnit.value : 'trieu-thang';
            const allowDecimal = unit === 'trieu-thang' || unit === 'trieu-nam' || unit === 'usd-thang';
            
            let value;
            if (allowDecimal) {
                // Với đơn vị triệu/USD, giữ nguyên số thập phân
                value = parseFloat(e.target.value) || 0;
            } else {
                // Với đơn vị VNĐ, parse số đã format
                value = parseFormattedNumber(e.target.value);
            }
            
            if (value > 0 && priceUnit) {
                // Hiển thị text đọc số tiền
                let priceText = '';
                
                if (unit === 'trieu-thang') {
                    // Giá tính theo triệu/tháng - hiển thị với số thập phân nếu có
                    if (value % 1 === 0) {
                        priceText = `(${numberToWords(value)} triệu đồng/tháng)`;
                    } else {
                        priceText = `(${value} triệu đồng/tháng)`;
                    }
                } else if (unit === 'vnd-thang') {
                    // Giá tính theo VNĐ/tháng
                    priceText = `(${numberToWords(value)} đồng/tháng)`;
                } else if (unit === 'vnd-ngay') {
                    // Giá tính theo VNĐ/ngày
                    priceText = `(${numberToWords(value)} đồng/ngày)`;
                } else if (unit === 'trieu-nam') {
                    // Giá tính theo triệu/năm - hiển thị với số thập phân nếu có
                    if (value % 1 === 0) {
                        priceText = `(${numberToWords(value)} triệu đồng/năm)`;
                    } else {
                        priceText = `(${value} triệu đồng/năm)`;
                    }
                } else if (unit === 'usd-thang') {
                    // Giá tính theo USD/tháng - hiển thị với số thập phân
                    priceText = `($${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USD/tháng)`;
                }
                
                // Hiển thị text nếu có element
                const priceTextEl = document.getElementById('priceText');
                if (priceTextEl) {
                    priceTextEl.textContent = priceText;
                }
            }
        });
    }
    
    // Xử lý thay đổi đơn vị giá
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
                
                // Xóa text hiển thị
                const priceTextEl = document.getElementById('priceText');
                if (priceTextEl) {
                    priceTextEl.textContent = '';
                }
            } else {
                // Các option khác - unlock input giá
                priceInput.disabled = false;
                priceInput.style.backgroundColor = 'white';
                priceInput.style.color = 'inherit';
                priceInput.setAttribute('required', 'required');
                
                // Cập nhật placeholder theo đơn vị
                const placeholders = {
                    'trieu-thang': 'VD: 2.5 hoặc 5 (triệu/tháng)',
                    'vnd-thang': 'VD: 5.000.000',
                    'vnd-ngay': 'VD: 200.000',
                    'trieu-nam': 'VD: 60 hoặc 30.5 (triệu/năm)',
                    'usd-thang': 'VD: 500 hoặc 500.50'
                };
                priceInput.placeholder = placeholders[this.value] || '0';
                
                // Chuyển đổi format khi đổi đơn vị
                const currentValue = priceInput.value;
                if (currentValue) {
                    const allowDecimal = this.value === 'trieu-thang' || this.value === 'trieu-nam' || this.value === 'usd-thang';
                    const previousAllowDecimal = priceInput.dataset.allowDecimal === 'true';
                    
                    if (allowDecimal && !previousAllowDecimal) {
                        // Chuyển từ format VNĐ (có dấu chấm ngăn cách) sang format thập phân
                        const numValue = parseFormattedNumber(currentValue);
                        priceInput.value = numValue.toString();
                    } else if (!allowDecimal && previousAllowDecimal) {
                        // Chuyển từ format thập phân sang format VNĐ (có dấu chấm ngăn cách)
                        const numValue = parseFloat(currentValue) || 0;
                        priceInput.value = formatNumber(Math.round(numValue));
                    }
                    
                    // Lưu trạng thái hiện tại
                    priceInput.dataset.allowDecimal = allowDecimal.toString();
                    
                    // Cập nhật text hiển thị
                    priceInput.dispatchEvent(new Event('blur'));
                }
            }
            clearFieldError('price');
        });
        
        // Khởi tạo trạng thái ban đầu
        const initialAllowDecimal = priceUnit.value === 'trieu-thang' || priceUnit.value === 'trieu-nam' || priceUnit.value === 'usd-thang';
        priceInput.dataset.allowDecimal = initialAllowDecimal.toString();
    }

    // Cập nhật trạng thái nút
    updateButtonState();
}

// ===================================
// 10. THÔNG BÁO - Sử dụng showAlert từ auth.js
// ===================================
// showAlert function được định nghĩa trong auth.js và đã được load trước

// ===================================
// 11. NEARBY POI - GỢI Ý XUNG QUANH
// ===================================

// Config API ngrok cho POI
const NGROK_BASE_URL = "https://mattie-nonencyclopaedic-qualifiedly.ngrok-free.dev"; // ⚠️ THAY BẰNG NGROK URL THẬT
const NEARBY_POI_API_URL = `${NGROK_BASE_URL}/nearby-poi`;

// Biến lưu POI data
let currentPoiData = null;

/**
 * Map province text → city code cho API
 * Dùng provinceText (tên tỉnh) thay vì provinceValue (ID số)
 */
function getPoiCityCode(provinceText) {
    const provinceTextLower = (provinceText || '').toLowerCase();
    if (provinceTextLower.includes('hồ chí minh') || provinceTextLower.includes('hcm') || provinceTextLower.includes('tp.hcm')) {
        return 'HCM';
    } else if (provinceTextLower.includes('hà nội') || provinceTextLower.includes('hanoi')) {
        return 'HaNoi';
    } else if (provinceTextLower.includes('đà nẵng') || provinceTextLower.includes('da nang')) {
        return 'DaNang';
    }
    return null; // Không hỗ trợ
}

/**
 * Format khoảng cách từ mét sang text đẹp
 */
function formatDistance(distanceM) {
    if (distanceM < 1000) {
        return `${Math.round(distanceM)}m`;
    } else {
        return `${(distanceM / 1000).toFixed(1)}km`;
    }
}

/**
 * Tạo POI chip/pill HTML
 */
function createPoiChip(poi, iconClass, colorClass) {
    return `
        <div class="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 ${colorClass} rounded-lg text-sm shadow-sm">
            <i class="${iconClass}"></i>
            <div>
                <div class="font-semibold text-gray-800">${poi.name}</div>
                <div class="text-xs text-gray-600">Cách ~${formatDistance(poi.distance_m)}</div>
            </div>
        </div>
    `;
}

/**
 * Gọi API lấy POI xung quanh địa chỉ
 */
async function fetchNearbyPOI() {
    console.log('📍 Fetching nearby POI...');
    
    // Lấy thông tin địa chỉ từ hidden fields (Goong Autocomplete)
    const fullAddress = document.getElementById('address')?.value || '';
    const province = document.getElementById('province')?.value || '';
    
    // Validate input
    if (!fullAddress || !province) {
        console.warn('⚠️ Chưa đủ thông tin địa chỉ để tìm POI');
        hideNearbyPoiContainer();
        return;
    }
    
    // Get city code từ province text
    const cityCode = getPoiCityCode(province);
    
    console.log('🔎 Full address:', fullAddress);
    console.log('🔎 Province:', province);
    console.log('🔎 City code:', cityCode);
    
    if (!cityCode) {
        console.warn('⚠️ Province không thuộc HCM/Hà Nội/Đà Nẵng, không tìm POI');
        hideNearbyPoiContainer();
        return;
    }
    
    // Show container + loading
    showNearbyPoiLoading();
    
    try {
        const payload = {
            city: cityCode,
            address: fullAddress
        };
        
        console.log('📤 POI API payload:', payload);
        
        const response = await fetch(NEARBY_POI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('📥 POI API response:', data);
        
        if (!response.ok || data.error) {
            console.error('❌ POI API error:', data.error || data.message);
            showNearbyPoiError();
            return;
        }
        
        // Lưu data và hiển thị
        currentPoiData = data;
        displayNearbyPoi(data);
        
    } catch (error) {
        console.error('❌ Error fetching POI:', error);
        showNearbyPoiError();
    }
}

/**
 * Hiển thị POI results
 */
function displayNearbyPoi(data) {
    const container = document.getElementById('nearbyPoiContainer');
    const loadingEl = document.getElementById('poiLoading');
    const errorEl = document.getElementById('poiError');
    const resultsEl = document.getElementById('poiResults');
    
    // Hide loading, show results
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    
    // Check if có POI nào không
    const totalPois = (data.universities?.length || 0) + 
                      (data.hospitals?.length || 0) + 
                      (data.malls?.length || 0) + 
                      (data.metros?.length || 0) + 
                      (data.bus_stations?.length || 0);
    
    if (totalPois === 0) {
        errorEl.classList.remove('hidden');
        resultsEl.classList.add('hidden');
        return;
    }
    
    resultsEl.classList.remove('hidden');
    
    // Render Universities
    if (data.universities && data.universities.length > 0) {
        const uniDiv = document.getElementById('poiUniversities');
        const uniList = document.getElementById('universitiesList');
        uniDiv.classList.remove('hidden');
        uniList.innerHTML = data.universities.map(poi => 
            createPoiChip(poi, 'fas fa-university', 'border-blue-400')
        ).join('');
    } else {
        document.getElementById('poiUniversities').classList.add('hidden');
    }
    
    // Render Hospitals
    if (data.hospitals && data.hospitals.length > 0) {
        const hospDiv = document.getElementById('poiHospitals');
        const hospList = document.getElementById('hospitalsList');
        hospDiv.classList.remove('hidden');
        hospList.innerHTML = data.hospitals.map(poi => 
            createPoiChip(poi, 'fas fa-hospital', 'border-red-400')
        ).join('');
    } else {
        document.getElementById('poiHospitals').classList.add('hidden');
    }
    
    // Render Malls
    if (data.malls && data.malls.length > 0) {
        const mallDiv = document.getElementById('poiMalls');
        const mallList = document.getElementById('mallsList');
        mallDiv.classList.remove('hidden');
        mallList.innerHTML = data.malls.map(poi => 
            createPoiChip(poi, 'fas fa-shopping-cart', 'border-purple-400')
        ).join('');
    } else {
        document.getElementById('poiMalls').classList.add('hidden');
    }
    
    // Render Transport (Metro + Bus)
    const transports = [...(data.metros || []), ...(data.bus_stations || [])];
    if (transports.length > 0) {
        const transDiv = document.getElementById('poiTransport');
        const transList = document.getElementById('transportList');
        transDiv.classList.remove('hidden');
        transList.innerHTML = transports.map(poi => 
            createPoiChip(poi, 'fas fa-subway', 'border-orange-400')
        ).join('');
    } else {
        document.getElementById('poiTransport').classList.add('hidden');
    }
    
    console.log(`✅ Displayed ${totalPois} POIs`);
}

/**
 * Show/Hide helper functions
 */
function showNearbyPoiLoading() {
    const container = document.getElementById('nearbyPoiContainer');
    const loadingEl = document.getElementById('poiLoading');
    const errorEl = document.getElementById('poiError');
    const resultsEl = document.getElementById('poiResults');
    
    container.classList.remove('hidden');
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    resultsEl.classList.add('hidden');
}

function showNearbyPoiError() {
    const loadingEl = document.getElementById('poiLoading');
    const errorEl = document.getElementById('poiError');
    const resultsEl = document.getElementById('poiResults');
    
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    resultsEl.classList.add('hidden');
}

function hideNearbyPoiContainer() {
    const container = document.getElementById('nearbyPoiContainer');
    container.classList.add('hidden');
    currentPoiData = null;
}

/**
 * Áp dụng POI vào mô tả (Step 1)
 */
function applyPoiToDescription() {
    if (!currentPoiData) {
        console.warn('⚠️ Không có POI data để apply');
        return;
    }
    
    // Lấy textarea mô tả
    const descriptionEl = document.getElementById('description');
    if (!descriptionEl) {
        console.error('❌ Không tìm thấy textarea #description');
        return;
    }
    
    // Build câu mô tả
    const parts = [];
    
    // Lấy 1-2 POI tiêu biểu mỗi loại
    const topUniversity = currentPoiData.universities?.[0];
    const topHospital = currentPoiData.hospitals?.[0];
    const topMall = currentPoiData.malls?.[0];
    
    if (topUniversity) {
        parts.push(`${topUniversity.name} (khoảng ${formatDistance(topUniversity.distance_m)})`);
    }
    
    if (topHospital) {
        parts.push(`${topHospital.name} (khoảng ${formatDistance(topHospital.distance_m)})`);
    }
    
    if (topMall) {
        parts.push(`${topMall.name} (khoảng ${formatDistance(topMall.distance_m)})`);
    }
    
    if (parts.length === 0) {
        console.warn('⚠️ Không có POI nào để tạo mô tả');
        return;
    }
    
    // Tạo câu hoàn chỉnh
    let suggestionText = '';
    
    if (topUniversity && topHospital) {
        suggestionText = `Phòng nằm gần ${parts.slice(0, 2).join(' và ')}, rất thuận tiện cho sinh viên và người đi làm.`;
    } else if (topUniversity) {
        suggestionText = `Phòng nằm gần ${parts[0]}, phù hợp cho sinh viên.`;
    } else if (topMall) {
        suggestionText = `Gần ${parts[0]}, tiện lợi cho mua sắm và giải trí.`;
    } else {
        suggestionText = `Phòng nằm gần ${parts[0]}.`;
    }
    
    // Thêm thông tin khác nếu có
    if (parts.length > 2) {
        suggestionText += ` Khu vực cũng gần ${parts.slice(2).join(', ')}.`;
    }
    
    // Append vào description
    const currentDesc = descriptionEl.value.trim();
    if (currentDesc) {
        descriptionEl.value = currentDesc + '\n\n' + suggestionText;
    } else {
        descriptionEl.value = suggestionText;
    }
    
    console.log('✅ Applied POI to description:', suggestionText);
    
    // Show notification
    if (typeof showAlert === 'function') {
        showAlert('✅ Đã thêm gợi ý vào mô tả!', 'success');
    }
    
    // Scroll to description field nếu không ở Step 1
    if (currentStep !== 1) {
        changeStep(1);
        setTimeout(() => {
            descriptionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            descriptionEl.focus();
        }, 500);
    }
}

/**
 * Setup event listeners cho POI
 */
function setupNearbyPoiListeners() {
    // Lắng nghe khi blur ô street
    const streetEl = document.getElementById('street');
    if (streetEl) {
        streetEl.addEventListener('blur', () => {
            // Delay 500ms để đảm bảo user đã chọn ward/district
            setTimeout(() => {
                fetchNearbyPOI();
            }, 500);
        });
    }
    
    // Lắng nghe khi change ward (sau khi chọn xong address đầy đủ)
    const wardEl = document.getElementById('ward');
    if (wardEl) {
        wardEl.addEventListener('change', () => {
            if (streetEl && streetEl.value.trim()) {
                fetchNearbyPOI();
            }
        });
    }
    
    // Nút "Áp dụng vào mô tả"
    const applyBtn = document.getElementById('applyPoiToDescription');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyPoiToDescription);
    }
    
    console.log('✅ Nearby POI listeners đã được setup');
}

// Gọi setup khi DOM ready (thêm vào cuối file)
