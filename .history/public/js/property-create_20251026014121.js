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
        const province = document.getElementById('province').value;
        const district = document.getElementById('district').value;
        const ward = document.getElementById('ward').value;

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
function initImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('propertyImages');

    if (!uploadArea || !fileInput) return;

    // Click để chọn ảnh - reset value trước để có thể chọn cùng file lần nữa
    uploadArea.addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
    });

    // Chọn ảnh
    fileInput.addEventListener('change', (e) => handleImageSelection(e.target.files));

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
}

function handleImageSelection(files) {
    Array.from(files).forEach(file => {
        // Kiểm tra loại file
        if (!file.type.startsWith('image/')) {
            showAlert(`${file.name} không phải là ảnh`, 'danger');
            return;
        }

        // Kiểm tra kích thước file
        if (file.size > maxFileSize) {
            showAlert(`${file.name} vượt quá 5MB`, 'danger');
            return;
        }

        // Kiểm tra số lượng ảnh
        if (uploadedImages.length >= maxImages) {
            showAlert(`Tối đa ${maxImages} ảnh`, 'danger');
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
            updateImageGallery();
        };
        reader.readAsDataURL(file);
    });
}

function updateImageGallery() {
    const gallery = document.querySelector('.image-gallery');
    const uploadArea = document.getElementById('imageUploadArea');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    
    if (!gallery) return;

    gallery.innerHTML = '';

    uploadedImages.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = `
            <img src="${image.preview}" alt="Preview ${index + 1}">
            <button type="button" class="image-remove-btn" onclick="removeImage(${index})" title="Xóa ảnh">
                <i class="fas fa-trash"></i>
            </button>
            <div class="image-index">${index + 1}/${uploadedImages.length}</div>
        `;
        gallery.appendChild(imageItem);
    });

    // Ẩn upload placeholder khi đã có ảnh
    if (uploadPlaceholder) {
        uploadPlaceholder.style.display = uploadedImages.length > 0 ? 'none' : 'block';
    }
    
    // Nếu có ảnh, vẫn cho phép kéo thả thêm ảnh
    if (uploadArea && uploadedImages.length > 0) {
        uploadArea.style.minHeight = 'auto';
        uploadArea.style.border = '1px dashed #dee2e6';
    }

    // Hiển thị số lượng ảnh
    const imageCount = document.querySelector('.image-count');
    if (imageCount) {
        imageCount.textContent = `${uploadedImages.length}/${maxImages} ảnh`;
    }
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    updateImageGallery();
}

// ===================================
// 7. XỬ LÝ DỮ LIỆU ĐỊA ĐIỂM
// ===================================
function loadLocationData() {
    // Giải pháp tạm thời: load dữ liệu tỉnh/thành phố từ API hoặc hardcode
    // Có thể mở rộng thành API call nếu cần
    
    const provinceSelect = document.getElementById('province');
    if (provinceSelect) {
        // Dữ liệu các tỉnh/thành phố (tạm thời)
        const provinces = [
            'Hà Nội',
            'TP. Hồ Chí Minh',
            'Đà Nẵng',
            'Hải Phòng',
            'Cần Thơ',
            'An Giang',
            'Bạc Liêu',
            'Bà Rịa - Vũng Tàu',
            'Bắc Giang',
            'Bắc Kạn',
            'Bắc Ninh',
            'Bến Tre',
            'Bình Dương',
            'Bình Phước',
            'Bình Thuận'
        ];

        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            option.textContent = province;
            provinceSelect.appendChild(option);
        });

        // Sự kiện thay đổi tỉnh
        provinceSelect.addEventListener('change', function() {
            clearFieldError('province');
            loadDistricts(this.value);
        });
    }
}

function loadDistricts(province) {
    // Dữ liệu quận/huyện theo tỉnh/thành phố
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');

    if (!districtSelect) return;

    districtSelect.innerHTML = '<option value="">-- Chọn quận/huyện --</option>';
    wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';

    // Dữ liệu đầy đủ các tỉnh/thành phố lớn
    const districtsByProvince = {
        'ho-chi-minh': [
            'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 
            'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Quận Bình Tân', 'Quận Bình Thạnh',
            'Quận Gò Vấp', 'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú', 'Quận Thủ Đức',
            'Huyện Bình Chánh', 'Huyện Cần Giờ', 'Huyện Củ Chi', 'Huyện Hóc Môn', 'Huyện Nhà Bè'
        ],
        'hanoi': [
            'Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Tây Hồ', 'Quận Long Biên', 'Quận Cầu Giấy',
            'Quận Đống Đa', 'Quận Hai Bà Trưng', 'Quận Hoàng Mai', 'Quận Thanh Xuân', 'Quận Bắc Từ Liêm',
            'Quận Nam Từ Liêm', 'Quận Hà Đông', 'Huyện Ba Vì', 'Huyện Chương Mỹ', 'Huyện Đan Phượng',
            'Huyện Đông Anh', 'Huyện Gia Lâm', 'Huyện Hoài Đức', 'Huyện Mê Linh', 'Huyện Mỹ Đức',
            'Huyện Phú Xuyên', 'Huyện Phúc Thọ', 'Huyện Quốc Oai', 'Huyện Sóc Sơn', 'Huyện Thạch Thất',
            'Huyện Thanh Oai', 'Huyện Thanh Trì', 'Huyện Thường Tín', 'Huyện Ứng Hòa', 'Thị xã Sơn Tây'
        ],
        'da-nang': [
            'Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn', 
            'Quận Liên Chiểu', 'Quận Cẩm Lệ', 'Huyện Hòa Vang', 'Huyện Hoàng Sa'
        ],
        'can-tho': [
            'Quận Ninh Kiều', 'Quận Bình Thủy', 'Quận Cái Răng', 'Quận Ô Môn', 'Quận Thốt Nốt',
            'Huyện Phong Điền', 'Huyện Cờ Đỏ', 'Huyện Vĩnh Thạnh', 'Huyện Thới Lai'
        ],
        'hai-phong': [
            'Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân', 'Quận Hải An', 'Quận Kiến An',
            'Quận Đồ Sơn', 'Quận Dương Kinh', 'Huyện Thuỷ Nguyên', 'Huyện An Dương', 'Huyện An Lão',
            'Huyện Kiến Thuỵ', 'Huyện Tiên Lãng', 'Huyện Vĩnh Bảo', 'Huyện Cát Hải', 'Huyện Bạch Long Vĩ'
        ],
        'bien-hoa': [
            'Quận Long Biên', 'Quận Biên Hòa', 'Quận Tân Phú', 'Quận Thống Nhất',
            'Huyện Trảng Bom', 'Huyện Thống Nhất', 'Huyện Cẩm Mỹ', 'Huyện Long Thành',
            'Huyện Xuân Lộc', 'Huyện Nhơn Trạch', 'Huyện Định Quán', 'Huyện Vĩnh Cửu'
        ],
        'vung-tau': [
            'Thành phố Vũng Tàu', 'Thành phố Bà Rịa', 'Huyện Châu Đức', 'Huyện Xuyên Mộc',
            'Huyện Long Điền', 'Huyện Đất Đỏ', 'Huyện Tân Thành', 'Huyện Côn Đảo'
        ],
        'nha-trang': [
            'Thành phố Nha Trang', 'Thành phố Cam Ranh', 'Thị xã Ninh Hòa', 'Huyện Khánh Vĩnh',
            'Huyện Diên Khánh', 'Huyện Khánh Sơn', 'Huyện Trường Sa', 'Huyện Cam Lâm', 'Huyện Vạn Ninh'
        ],
        'da-lat': [
            'Thành phố Đà Lạt', 'Thành phố Bảo Lộc', 'Huyện Đam Rông', 'Huyện Lạc Dương',
            'Huyện Lâm Hà', 'Huyện Đơn Dương', 'Huyện Đức Trọng', 'Huyện Di Linh',
            'Huyện Bảo Lâm', 'Huyện Đạ Huoai', 'Huyện Đạ Tẻh', 'Huyện Cát Tiên'
        ],
        'hue': [
            'Thành phố Huế', 'Thị xã Hương Thủy', 'Thị xã Hương Trà', 'Huyện Phong Điền',
            'Huyện Quảng Điền', 'Huyện Phú Vang', 'Huyện Phú Lộc', 'Huyện A Lưới', 'Huyện Nam Đông'
        ],
        'quy-nhon': [
            'Thành phố Quy Nhơn', 'Thị xã An Nhơn', 'Thị xã Hoài Nhơn', 'Huyện Hoài Ân',
            'Huyện Phù Mỹ', 'Huyện Vĩnh Thạnh', 'Huyện Tây Sơn', 'Huyện Phù Cát',
            'Huyện An Lão', 'Huyện Tuy Phước', 'Huyện Vân Canh'
        ]
    };

    const districts = districtsByProvince[province] || [];
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
    });

    districtSelect.addEventListener('change', function() {
        clearFieldError('district');
        loadWards(this.value);
    });
}

function loadWards(district) {
    const wardSelect = document.getElementById('ward');
    if (!wardSelect) return;

    wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';

    // Dữ liệu phường/xã theo quận/huyện (các quận/huyện phổ biến)
    const wardsByDistrict = {
        // TP. Hồ Chí Minh
        'Quận 1': [
            'Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cầu Kho', 'Phường Cầu Ông Lãnh',
            'Phường Cô Giang', 'Phường Đa Kao', 'Phường Nguyễn Cư Trinh', 'Phường Nguyễn Thái Bình',
            'Phường Phạm Ngũ Lão', 'Phường Tân Định'
        ],
        'Quận 2': [
            'Phường An Khánh', 'Phường An Lợi Đông', 'Phường An Phú', 'Phường Bình An',
            'Phường Bình Khanh', 'Phường Bình Trưng Đông', 'Phường Bình Trưng Tây', 'Phường Cát Lái',
            'Phường Thạnh Mỹ Lợi', 'Phường Thảo Điền', 'Phường Thủ Thiêm'
        ],
        'Quận 3': [
            'Phường 01', 'Phường 02', 'Phường 03', 'Phường 04', 'Phường 05', 'Phường 06',
            'Phường 07', 'Phường 08', 'Phường 09', 'Phường 10', 'Phường 11', 'Phường 12',
            'Phường 13', 'Phường 14'
        ],
        'Quận 4': [
            'Phường 01', 'Phường 02', 'Phường 03', 'Phường 04', 'Phường 05', 'Phường 06',
            'Phường 08', 'Phường 09', 'Phường 10', 'Phường 13', 'Phường 14', 'Phường 15',
            'Phường 16', 'Phường 18'
        ],
        'Quận 5': [
            'Phường 01', 'Phường 02', 'Phường 03', 'Phường 04', 'Phường 05', 'Phường 06',
            'Phường 07', 'Phường 08', 'Phường 09', 'Phường 10', 'Phường 11', 'Phường 12',
            'Phường 13', 'Phường 14', 'Phường 15'
        ],
        'Quận 6': [
            'Phường 01', 'Phường 02', 'Phường 03', 'Phường 04', 'Phường 05', 'Phường 06',
            'Phường 07', 'Phường 08', 'Phường 09', 'Phường 10', 'Phường 11', 'Phường 12',
            'Phường 13', 'Phường 14'
        ],
        'Quận 7': [
            'Phường Bình Thuận', 'Phường Phú Mỹ', 'Phường Phú Thuận', 'Phường Tân Hưng',
            'Phường Tân Kiểng', 'Phường Tân Phong', 'Phường Tân Phú', 'Phường Tân Quy',
            'Phường Tân Thuận Đông', 'Phường Tân Thuận Tây'
        ],
        'Quận 8': [
            'Phường 01', 'Phường 02', 'Phường 03', 'Phường 04', 'Phường 05', 'Phường 06',
            'Phường 07', 'Phường 08', 'Phường 09', 'Phường 10', 'Phường 11', 'Phường 12',
            'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'
        ],
        'Quận 10': [
            'Phường 01', 'Phường 02', 'Phường 03', 'Phường 04', 'Phường 05', 'Phường 06',
            'Phường 07', 'Phường 08', 'Phường 09', 'Phường 10', 'Phường 11', 'Phường 12',
            'Phường 13', 'Phường 14', 'Phường 15'
        ],
        'Quận Bình Thạnh': [
            'Phường 01', 'Phường 02', 'Phường 03', 'Phường 05', 'Phường 06', 'Phường 07',
            'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 17',
            'Phường 19', 'Phường 21', 'Phường 22', 'Phường 24', 'Phường 25', 'Phường 26',
            'Phường 27', 'Phường 28'
        ],
        'Quận Tân Bình': [
            'Phường 01', 'Phường 02', 'Phường 03', 'Phường 04', 'Phường 05', 'Phường 06',
            'Phường 07', 'Phường 08', 'Phường 09', 'Phường 10', 'Phường 11', 'Phường 12',
            'Phường 13', 'Phường 14', 'Phường 15'
        ],
        'Quận Phú Nhuận': [
            'Phường 01', 'Phường 02', 'Phường 03', 'Phường 04', 'Phường 05', 'Phường 07',
            'Phường 08', 'Phường 09', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13',
            'Phường 15', 'Phường 17'
        ],
        'Quận Gò Vấp': [
            'Phường 01', 'Phường 03', 'Phường 04', 'Phường 05', 'Phường 06', 'Phường 07',
            'Phường 08', 'Phường 09', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13',
            'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17'
        ],

        // Hà Nội
        'Quận Ba Đình': [
            'Phường Phúc Xá', 'Phường Trúc Bạch', 'Phường Vĩnh Phúc', 'Phường Cống Vị',
            'Phường Liễu Giai', 'Phường Nguyễn Trung Trực', 'Phường Quán Thánh', 'Phường Ngọc Hà',
            'Phường Điện Biên', 'Phường Đội Cấn', 'Phường Ngọc Khánh', 'Phường Kim Mã',
            'Phường Giảng Võ', 'Phường Thành Công'
        ],
        'Quận Hoàn Kiếm': [
            'Phường Phúc Tân', 'Phường Đồng Xuân', 'Phường Hàng Mã', 'Phường Hàng Buồm',
            'Phường Hàng Đào', 'Phường Hàng Bồ', 'Phường Cửa Đông', 'Phường Lý Thái Tổ',
            'Phường Hàng Bạc', 'Phường Hàng Gai', 'Phường Chương Dương', 'Phường Cửa Nam',
            'Phường Hàng Trống', 'Phường Phan Chu Trinh', 'Phường Tràng Tiền', 'Phường Trần Hưng Đạo',
            'Phường Hàng Bài', 'Phường Hàng Bông'
        ],
        'Quận Tây Hồ': [
            'Phường Phú Thượng', 'Phường Nhật Tân', 'Phường Tứ Liên', 'Phường Quảng An',
            'Phường Xuân La', 'Phường Yên Phụ', 'Phường Bưởi', 'Phường Thụy Khuê'
        ],
        'Quận Long Biên': [
            'Phường Thượng Thanh', 'Phường Ngọc Thụy', 'Phường Giang Biên', 'Phường Đức Giang',
            'Phường Việt Hưng', 'Phường Gia Thụy', 'Phường Ngọc Lâm', 'Phường Phúc Lợi',
            'Phường Bồ Đề', 'Phường Sài Đồng', 'Phường Long Biên', 'Phường Thạch Bàn',
            'Phường Phúc Đồng', 'Phường Cự Khối'
        ],
        'Quận Cầu Giấy': [
            'Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Mai Dịch', 'Phường Dịch Vọng',
            'Phường Dịch Vọng Hậu', 'Phường Quan Hoa', 'Phường Yên Hòa', 'Phường Trung Hòa'
        ],
        'Quận Đống Đa': [
            'Phường Cát Linh', 'Phường Văn Miếu', 'Phường Quốc Tử Giám', 'Phường Láng Thượng',
            'Phường Ô Chợ Dừa', 'Phường Văn Chương', 'Phường Hàng Bột', 'Phường Láng Hạ',
            'Phường Khâm Thiên', 'Phường Thổ Quan', 'Phường Nam Đồng', 'Phường Trung Phụng',
            'Phường Quang Trung', 'Phường Trung Liệt', 'Phường Phương Liên', 'Phường Thịnh Quang',
            'Phường Trung Tự', 'Phường Kim Liên', 'Phường Phương Mai', 'Phường Ngã Tư Sở', 'Phường Khương Thượng'
        ],
        'Quận Hai Bà Trưng': [
            'Phường Nguyễn Du', 'Phường Bạch Đằng', 'Phường Phạm Đình Hổ', 'Phường Lê Đại Hành',
            'Phường Đồng Nhân', 'Phường Phố Huế', 'Phường Đống Mác', 'Phường Thanh Lương',
            'Phường Thanh Nhàn', 'Phường Cầu Dền', 'Phường Bách Khoa', 'Phường Đồng Tâm',
            'Phường Vĩnh Tuy', 'Phường Bạch Mai', 'Phường Quỳnh Mai', 'Phường Quỳnh Lôi',
            'Phường Minh Khai', 'Phường Trương Định'
        ],
        'Quận Thanh Xuân': [
            'Phường Nhân Chính', 'Phường Thượng Đình', 'Phường Khương Trung', 'Phường Khương Mai',
            'Phường Thanh Xuân Trung', 'Phường Phương Liệt', 'Phường Hạ Đình', 'Phường Khương Đình',
            'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Nam', 'Phường Kim Giang'
        ],

        // Đà Nẵng
        'Quận Hải Châu': [
            'Phường Thanh Bình', 'Phường Thuận Phước', 'Phường Thạch Thang', 'Phường Hải Châu 1',
            'Phường Hải Châu 2', 'Phường Phước Ninh', 'Phường Hòa Thuận Tây', 'Phường Hòa Thuận Đông',
            'Phường Nam Dương', 'Phường Bình Hiên', 'Phường Bình Thuận', 'Phường Hòa Cường Bắc',
            'Phường Hòa Cường Nam'
        ],
        'Quận Thanh Khê': [
            'Phường Tam Thuận', 'Phường Thanh Khê Tây', 'Phường Thanh Khê Đông', 'Phường Xuân Hà',
            'Phường Tân Chính', 'Phường Chính Gián', 'Phường Vĩnh Trung', 'Phường Thạc Gián',
            'Phường An Khê', 'Phường Hòa Khê'
        ],
        'Quận Sơn Trà': [
            'Phường Thọ Quang', 'Phường Nại Hiên Đông', 'Phường Mân Thái', 'Phường An Hải Bắc',
            'Phường Phước Mỹ', 'Phường An Hải Tây', 'Phường An Hải Đông'
        ],
        'Quận Ngũ Hành Sơn': [
            'Phường Mỹ An', 'Phường Khuê Mỹ', 'Phường Hòa Quý', 'Phường Hòa Hải'
        ],
        'Quận Liên Chiểu': [
            'Phường Hòa Hiệp Bắc', 'Phường Hòa Hiệp Nam', 'Phường Hòa Khánh Bắc', 'Phường Hòa Khánh Nam',
            'Phường Hòa Minh'
        ],
        'Quận Cẩm Lệ': [
            'Phường Khuê Trung', 'Phường Hòa Phát', 'Phường Hòa An', 'Phường Hòa Thọ Tây',
            'Phường Hòa Thọ Đông', 'Phường Hòa Xuân'
        ]
    };

    const wards = wardsByDistrict[district] || [];
    wards.forEach(ward => {
        const option = document.createElement('option');
        option.value = ward;
        option.textContent = ward;
        wardSelect.appendChild(option);
    });

    wardSelect.addEventListener('change', function() {
        clearFieldError('ward');
    });
}

// ===================================
// 8. XỬ LÝ GỬI BIỂU MẪU
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
    formData.append('province', document.getElementById('province').value);
    formData.append('district', document.getElementById('district').value);
    formData.append('ward', document.getElementById('ward').value);

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
    .then(response => {
        if (!response.ok) {
            throw new Error('Có lỗi xảy ra');
        }
        return response.json();
    })
    .then(data => {
        showAlert('Đăng tin thành công!', 'success');
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
