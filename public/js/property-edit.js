/* ===================================
   PROPERTY-EDIT.JS - Xử lý trang chỉnh sửa bài đăng
   =================================== */

// Biến toàn cục
let currentStep = 1;
const totalSteps = 5;
const uploadedImages = [];
const maxImages = 10;
const maxFileSize = 5 * 1024 * 1024; // 5MB
let propertyId = null;
let currentProperty = null;
let existingImages = []; // Lưu ảnh đã có

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
        showAlert('Vui lòng đăng nhập để chỉnh sửa bài đăng', 'danger');
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 2000);
        return;
    }

    // Lấy ID từ URL
    const urlParts = window.location.pathname.split('/');
    propertyId = urlParts[urlParts.length - 1];

    if (!propertyId) {
        showAlert('Không tìm thấy bài đăng', 'danger');
        setTimeout(() => {
            window.location.href = '/my-properties';
        }, 2000);
        return;
    }

    // Khởi tạo sự kiện
    initEventListeners();
    initImageUpload();
    updateProgressBar();
    
    // Khởi tạo searchable select boxes
    initSearchableSelects();
    
    // Load dữ liệu bài đăng
    loadPropertyData();
    
    console.log('Trang chỉnh sửa đã khởi tạo thành công, Property ID:', propertyId);
});

// ===================================
// 2. LOAD DỮ LIỆU BÀI ĐĂNG
// ===================================
async function loadPropertyData() {
    try {
        // Load provinces trước
        await loadLocationData();
        
        // Thử load từ API trước
        const response = await fetch(`/api/properties/${propertyId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            currentProperty = await response.json();
        } else {
            // Nếu không có từ API, thử từ localStorage
            const myProperties = JSON.parse(localStorage.getItem('myProperties')) || [];
            currentProperty = myProperties.find(p => p._id === propertyId);
        }

        if (!currentProperty) {
            throw new Error('Không tìm thấy bài đăng');
        }

        // Populate form với dữ liệu hiện tại
        await populateForm(currentProperty);
        
    } catch (error) {
        console.error('Lỗi khi load dữ liệu:', error);
        showAlert('Không thể tải dữ liệu bài đăng', 'danger');
        setTimeout(() => {
            window.location.href = '/my-properties';
        }, 2000);
    }
}

// ===================================
// 3. POPULATE FORM
// ===================================
async function populateForm(property) {
    // Step 1: Thông tin cơ bản
    const titleEl = document.getElementById('title');
    const descriptionEl = document.getElementById('description');
    const propertyTypeEl = document.getElementById('propertyType');
    
    if (titleEl) titleEl.value = property.title || '';
    if (descriptionEl) descriptionEl.value = property.description || '';
    if (propertyTypeEl) propertyTypeEl.value = property.propertyType || 'phong-tro';
    
    // Step 2: Giá và diện tích
    const priceEl = document.getElementById('price');
    const areaEl = document.getElementById('area');
    const bedroomsEl = document.getElementById('bedrooms');
    const bathroomsEl = document.getElementById('bathrooms');
    
    if (priceEl) priceEl.value = property.price || '';
    if (areaEl) areaEl.value = property.area || '';
    if (bedroomsEl) bedroomsEl.value = property.bedrooms || 1;
    if (bathroomsEl) bathroomsEl.value = property.bathrooms || 1;
    
    // Step 3: Địa chỉ - Set trực tiếp sau khi provinces đã load
    if (property.address) {
        // Set province
        if (provinceChoice && property.address.province) {
            provinceChoice.setChoiceByValue(property.address.province);
            
            // Load và set district
            if (property.address.district) {
                await loadDistricts(property.address.province);
                await new Promise(resolve => setTimeout(resolve, 300)); // Wait for render
                districtChoice.setChoiceByValue(property.address.district);
                
                // Load và set ward
                if (property.address.ward) {
                    await loadWards(property.address.district);
                    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for render
                    wardChoice.setChoiceByValue(property.address.ward);
                }
            }
        }
        
        const streetEl = document.getElementById('street');
        if (streetEl) streetEl.value = property.address.street || '';
    }
    
    // Step 4: Tiện nghi
    if (property.amenities) {
        Object.keys(property.amenities).forEach(key => {
            const checkbox = document.getElementById(key);
            if (checkbox) {
                checkbox.checked = property.amenities[key] === true;
            }
        });
    }
    
    // Step 5: Hình ảnh
    if (property.images && property.images.length > 0) {
        existingImages = [...property.images];
        displayExistingImages(property.images);
    }
    
    console.log('Form đã được populate với dữ liệu:', property);
}

// ===================================
// 4. HIỂN THỊ ẢNH ĐÃ CÓ
// ===================================
function displayExistingImages(images) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    
    preview.innerHTML = '';
    
    images.forEach((imageUrl, index) => {
        const imageCard = document.createElement('div');
        imageCard.className = 'relative group';
        imageCard.innerHTML = `
            <img src="${imageUrl}" alt="Ảnh ${index + 1}" 
                 class="w-full h-32 object-cover rounded-lg shadow-md">
            <button type="button" 
                    onclick="removeExistingImage(${index})"
                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600">
                <i class="fas fa-times"></i>
            </button>
            <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Ảnh ${index + 1}
            </div>
        `;
        preview.appendChild(imageCard);
    });
    
    // Cập nhật counter
    document.getElementById('imageCount').textContent = images.length;
}

// ===================================
// 5. XÓA ẢNH ĐÃ CÓ
// ===================================
window.removeExistingImage = function(index) {
    existingImages.splice(index, 1);
    displayExistingImages(existingImages);
};

// ===================================
// 6. QUẢN LÝ CÁC BƯỚC (giống property-create.js)
// ===================================
function changeStep(step) {
    if (step < 1 || step > totalSteps) return;

    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.add('hidden');
    });

    const nextStepElement = document.getElementById(`step${step}`);
    if (nextStepElement) {
        nextStepElement.classList.remove('hidden');
    }

    currentStep = step;
    updateProgressBar();
    updateButtonState();

    const formElement = document.getElementById('propertyForm');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function nextStep() {
    if (!validateCurrentStep()) {
        return;
    }
    if (currentStep < totalSteps) {
        changeStep(currentStep + 1);
    }
}

function prevStep() {
    if (currentStep > 1) {
        changeStep(currentStep - 1);
    }
}

function updateProgressBar() {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (progressText) {
        progressText.textContent = `Bước ${currentStep}/${totalSteps}`;
    }
}

function updateButtonState() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (prevBtn) {
        prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    }

    if (nextBtn && submitBtn) {
        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-flex';
        } else {
            nextBtn.style.display = 'inline-flex';
            submitBtn.style.display = 'none';
        }
    }
}

// ===================================
// 7. VALIDATION
// ===================================
function validateCurrentStep() {
    let isValid = true;
    let errorMessage = '';

    switch(currentStep) {
        case 1: // Thông tin cơ bản
            const title = document.getElementById('title').value.trim();
            const description = document.getElementById('description').value.trim();
            
            if (!title || title.length < 10) {
                errorMessage = 'Tiêu đề phải có ít nhất 10 ký tự';
                isValid = false;
            } else if (!description || description.length < 50) {
                errorMessage = 'Mô tả phải có ít nhất 50 ký tự';
                isValid = false;
            }
            break;

        case 2: // Giá và diện tích
            const price = parseFloat(document.getElementById('price').value);
            const area = parseFloat(document.getElementById('area').value);
            
            if (!price || price < 100000) {
                errorMessage = 'Giá thuê phải từ 100,000 VNĐ trở lên';
                isValid = false;
            } else if (!area || area < 5) {
                errorMessage = 'Diện tích phải từ 5m² trở lên';
                isValid = false;
            }
            break;

        case 3: // Địa chỉ
            const province = provinceChoice ? provinceChoice.getValue().value : '';
            const district = districtChoice ? districtChoice.getValue().value : '';
            const ward = wardChoice ? wardChoice.getValue().value : '';
            const street = document.getElementById('street').value.trim();
            
            if (!province || !district || !ward) {
                errorMessage = 'Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện, Phường/Xã';
                isValid = false;
            } else if (!street) {
                errorMessage = 'Vui lòng nhập số nhà/tên đường';
                isValid = false;
            }
            break;

        case 4: // Tiện nghi - không bắt buộc
            break;

        case 5: // Hình ảnh
            if (existingImages.length === 0 && uploadedImages.length === 0) {
                errorMessage = 'Vui lòng tải lên ít nhất 1 hình ảnh';
                isValid = false;
            }
            break;
    }

    if (!isValid) {
        showAlert(errorMessage, 'danger');
    }

    return isValid;
}

// ===================================
// 8. XỬ LÝ UPLOAD ẢNH
// ===================================
function initImageUpload() {
    const imageInput = document.getElementById('propertyImages');
    const imageUploadArea = document.getElementById('imageUploadArea');
    
    if (imageUploadArea && imageInput) {
        imageUploadArea.addEventListener('click', () => {
            imageInput.click();
        });
    }
    
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }
}

function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    
    if (uploadedImages.length + files.length > maxImages) {
        showAlert(`Chỉ được upload tối đa ${maxImages} hình ảnh`, 'danger');
        return;
    }
    
    files.forEach(file => {
        if (file.size > maxFileSize) {
            showAlert(`File ${file.name} quá lớn. Kích thước tối đa 5MB`, 'danger');
            return;
        }
        
        if (!file.type.match('image.*')) {
            showAlert(`File ${file.name} không phải là hình ảnh`, 'danger');
            return;
        }
        
        uploadedImages.push(file);
        displayImage(file, uploadedImages.length - 1);
    });
    
    e.target.value = '';
}

function displayImage(file, index) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        if (!preview) return;
        
        // Thêm ảnh mới sau ảnh đã có
        const imageCard = document.createElement('div');
        imageCard.className = 'relative group';
        imageCard.dataset.newImageIndex = index; // Đánh dấu index của ảnh mới
        imageCard.innerHTML = `
            <img src="${e.target.result}" alt="Ảnh mới ${index + 1}" 
                 class="w-full h-32 object-cover rounded-lg shadow-md">
            <button type="button" 
                    onclick="removeNewImage(${index})"
                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600">
                <i class="fas fa-times"></i>
            </button>
            <div class="absolute bottom-2 left-2 bg-blue-500/70 text-white text-xs px-2 py-1 rounded">
                Mới
            </div>
        `;
        preview.appendChild(imageCard);
        
        // Cập nhật counter
        const totalImages = existingImages.length + uploadedImages.length;
        document.getElementById('imageCount').textContent = totalImages;
    };
    
    reader.readAsDataURL(file);
}

window.removeNewImage = function(index) {
    uploadedImages.splice(index, 1);
    
    // Xóa tất cả ảnh mới trong preview và render lại
    const preview = document.getElementById('imagePreview');
    if (preview) {
        // Xóa tất cả các thẻ có dataset.newImageIndex
        const newImageCards = preview.querySelectorAll('[data-new-image-index]');
        newImageCards.forEach(card => card.remove());
        
        // Hiển thị lại tất cả ảnh mới với index đúng
        uploadedImages.forEach((file, i) => {
            displayImage(file, i);
        });
        
        // Cập nhật counter
        const totalImages = existingImages.length + uploadedImages.length;
        document.getElementById('imageCount').textContent = totalImages;
    }
};

// ===================================
// 9. SUBMIT FORM - CẬP NHẬT BÀI ĐĂNG
// ===================================
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang cập nhật...';
    
    try {
        const formData = new FormData();
        
        // Thêm thông tin cơ bản
        formData.append('title', document.getElementById('title').value.trim());
        formData.append('description', document.getElementById('description').value.trim());
        formData.append('propertyType', document.getElementById('propertyType').value);
        formData.append('price', document.getElementById('price').value);
        formData.append('area', document.getElementById('area').value);
        formData.append('bedrooms', document.getElementById('bedrooms').value);
        formData.append('bathrooms', document.getElementById('bathrooms').value);
        formData.append('floor', document.getElementById('floor').value);
        
        // Địa chỉ
        const address = {
            province: provinceChoice ? provinceChoice.getValue().value : '',
            district: districtChoice ? districtChoice.getValue().value : '',
            ward: wardChoice ? wardChoice.getValue().value : '',
            street: document.getElementById('street').value.trim()
        };
        formData.append('address', JSON.stringify(address));
        
        // Tiện nghi
        const amenities = {
            wifi: document.getElementById('wifi')?.checked || false,
            parking: document.getElementById('parking')?.checked || false,
            ac: document.getElementById('ac')?.checked || false,
            kitchen: document.getElementById('kitchen')?.checked || false,
            water: document.getElementById('water')?.checked || false,
            laundry: document.getElementById('laundry')?.checked || false,
            balcony: document.getElementById('balcony')?.checked || false,
            security: document.getElementById('security')?.checked || false
        };
        formData.append('amenities', JSON.stringify(amenities));
        
        // Ảnh đã có (giữ lại)
        formData.append('existingImages', JSON.stringify(existingImages));
        
        // Ảnh mới upload
        uploadedImages.forEach(file => {
            formData.append('images', file);
        });
        
        // Gửi request cập nhật
        const response = await fetch(`/api/properties/${propertyId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Cập nhật localStorage
            updateLocalStorage(data.data || data);
            
            showAlert('Cập nhật bài đăng thành công!', 'success');
            
            setTimeout(() => {
                window.location.href = '/my-properties';
            }, 1500);
        } else {
            throw new Error(data.message || 'Có lỗi xảy ra');
        }
        
    } catch (error) {
        console.error('Lỗi khi cập nhật:', error);
        showAlert(error.message || 'Có lỗi xảy ra khi cập nhật bài đăng', 'danger');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ===================================
// 10. CẬP NHẬT LOCALSTORAGE
// ===================================
function updateLocalStorage(updatedProperty) {
    try {
        let myProperties = JSON.parse(localStorage.getItem('myProperties')) || [];
        
        // Tìm và cập nhật property
        const index = myProperties.findIndex(p => p._id === propertyId);
        if (index !== -1) {
            myProperties[index] = updatedProperty;
        } else {
            myProperties.unshift(updatedProperty);
        }
        
        // Giới hạn 50 properties
        if (myProperties.length > 50) {
            myProperties = myProperties.slice(0, 50);
        }
        
        localStorage.setItem('myProperties', JSON.stringify(myProperties));
        console.log('LocalStorage đã được cập nhật');
    } catch (error) {
        console.error('Lỗi khi cập nhật localStorage:', error);
    }
}

// ===================================
// 11. INIT EVENT LISTENERS
// ===================================
function initEventListeners() {
    const form = document.getElementById('propertyForm');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); nextStep(); });
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); prevStep(); });
    if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
    if (form) form.addEventListener('submit', handleSubmit);
}

// ===================================
// 12. INIT SEARCHABLE SELECTS (copy từ property-create.js)
// ===================================
function initSearchableSelects() {
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');

    if (provinceSelect) {
        provinceChoice = new Choices(provinceSelect, {
            searchEnabled: true,
            searchResultLimit: 100,
            searchPlaceholderValue: 'Tìm kiếm tỉnh/thành phố...',
            noResultsText: 'Không tìm thấy',
            itemSelectText: 'Nhấn để chọn',
            position: 'bottom',
            shouldSort: false,
            removeItemButton: false
        });

        provinceSelect.addEventListener('change', function(e) {
            const provinceValue = provinceChoice.getValue().value;
            if (provinceValue) {
                loadDistricts(provinceValue);
            } else {
                districtChoice.clearStore();
                wardChoice.clearStore();
            }
        });
    }

    if (districtSelect) {
        districtChoice = new Choices(districtSelect, {
            searchEnabled: true,
            searchResultLimit: 100,
            searchPlaceholderValue: 'Chọn tỉnh/thành phố trước...',
            noResultsText: 'Không tìm thấy',
            itemSelectText: 'Nhấn để chọn',
            position: 'bottom',
            shouldSort: false
        });

        districtSelect.addEventListener('change', function(e) {
            const districtValue = districtChoice.getValue().value;
            if (districtValue) {
                loadWards(districtValue);
            } else {
                wardChoice.clearStore();
            }
        });
    }

    if (wardSelect) {
        wardChoice = new Choices(wardSelect, {
            searchEnabled: true,
            searchResultLimit: 100,
            searchPlaceholderValue: 'Chọn quận/huyện trước...',
            noResultsText: 'Không tìm thấy',
            itemSelectText: 'Nhấn để chọn',
            position: 'bottom',
            shouldSort: false
        });
    }
}

// Load provinces
async function loadLocationData() {
    try {
        const response = await fetch('/api/locations/provinces');
        const data = await response.json();
        
        if (data.success && provinceChoice) {
            const choices = data.data.map(province => ({
                value: province.code,
                label: province.name
            }));
            
            provinceChoice.setChoices(choices, 'value', 'label', true);
        }
    } catch (error) {
        console.error('Lỗi khi load tỉnh/thành phố:', error);
    }
}

// Load districts
async function loadDistricts(provinceCode) {
    try {
        const response = await fetch(`/api/locations/districts/${provinceCode}`);
        const data = await response.json();
        
        if (data.success && districtChoice) {
            districtChoice.clearStore();
            wardChoice.clearStore();
            
            const choices = data.data.map(district => ({
                value: district.code,
                label: district.name
            }));
            
            districtChoice.setChoices(choices, 'value', 'label', true);
        }
    } catch (error) {
        console.error('Lỗi khi load quận/huyện:', error);
    }
}

// Load wards
async function loadWards(districtCode) {
    try {
        const response = await fetch(`/api/locations/wards/${districtCode}`);
        const data = await response.json();
        
        if (data.success && wardChoice) {
            wardChoice.clearStore();
            
            const choices = data.data.map(ward => ({
                value: ward.code,
                label: ward.name
            }));
            
            wardChoice.setChoices(choices, 'value', 'label', true);
        }
    } catch (error) {
        console.error('Lỗi khi load phường/xã:', error);
    }
}

// ===================================
// 13. SHOW ALERT
// ===================================
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        console.warn('Alert container not found');
        alert(message);
        return;
    }

    const alertDiv = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 
                   type === 'danger' ? 'bg-red-500' : 
                   type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
    
    alertDiv.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between mb-4 animate-fadeInUp`;
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'} mr-3"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" class="ml-4 hover:bg-white/20 rounded p-1">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
