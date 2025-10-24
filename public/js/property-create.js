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

    // Ẩn bước hiện tại
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.add('d-none');
    });

    // Hiển thị bước mới
    const nextStepElement = document.getElementById(`step${step}`);
    console.log(`Looking for element with ID: step${step}`, nextStepElement);
    
    if (nextStepElement) {
        nextStepElement.classList.remove('d-none');
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

    // Cuộn lên đầu trang
    document.querySelector('.card-body').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        field.classList.add('is-invalid');
        // Xóa thông báo lỗi cũ
        const oldError = field.parentElement.querySelector('.invalid-feedback');
        if (oldError) {
            oldError.remove();
        }
        // Thêm thông báo lỗi mới
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
    }
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.remove('is-invalid');
        const errorDiv = field.parentElement.querySelector('.invalid-feedback');
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
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
        progressBar.setAttribute('aria-valuenow', percentage);
    }

    // Cập nhật văn bản tiến độ
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `Bước ${currentStep} của ${totalSteps}`;
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
    // Dữ liệu quận/huyện theo tỉnh (tạm thời, có thể mở rộng)
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');

    if (!districtSelect) return;

    districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
    wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';

    // Dữ liệu mẫu cho một số tỉnh
    const districtsByProvince = {
        'Hà Nội': ['Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Thanh Xuân', 'Đống Đa', 'Hai Bà Trưng', 'Cầu Giấy', 'Bắc Từ Liêm', 'Nam Từ Liêm'],
        'TP. Hồ Chí Minh': ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12'],
        'Đà Nẵng': ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ']
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

    wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';

    // Dữ liệu mẫu cho phường/xã
    const wardsByDistrict = {
        'Ba Đình': ['Phường Phúc Tân', 'Phường Quán Thánh', 'Phường Trúc Bạch'],
        'Hoàn Kiếm': ['Phường Hàng Đồng', 'Phường Cửa Đông', 'Phường Hàng Gai'],
        'Quận 1': ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cô Giang'],
        'Quận 2': ['Phường An Phú', 'Phường An Khánh', 'Phường Thạnh Mỹ Lợi']
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
    const amenities = [];
    document.querySelectorAll('input[name="amenities"]:checked').forEach(checkbox => {
        amenities.push(checkbox.value);
    });
    formData.append('amenities', JSON.stringify(amenities));

    // Step 4: Ảnh
    uploadedImages.forEach((image, index) => {
        formData.append(`images`, image.file);
    });

    // Step 5: Thông tin liên hệ
    formData.append('contactName', document.getElementById('contactName').value);
    formData.append('contactPhone', document.getElementById('contactPhone').value);
    formData.append('allowCalls', document.getElementById('allowCalls').checked);
    formData.append('allowSMS', document.getElementById('allowSMS').checked);

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
    document.querySelectorAll('.form-control, .form-select').forEach(field => {
        field.addEventListener('input', function() {
            clearFieldError(this.id);
        });

        field.addEventListener('change', function() {
            clearFieldError(this.id);
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
// 10. THÔNG BÁO
// ===================================
function showAlert(message, type) {
    const alertContainer = document.querySelector('.alert-container') || document.querySelector('.card-body');
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Chèn cảnh báo vào đầu card
    const cardBody = document.querySelector('.card-body');
    if (cardBody) {
        cardBody.insertBefore(alert, cardBody.firstChild);

        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    }
}
