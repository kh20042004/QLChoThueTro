/**
 * ===================================
 * MAIN.JS - JavaScript cho trang chủ
 * Hệ thống cho thuê nhà/phòng trọ
 * ===================================
 */

// ===================================
// 1. KHỞI TẠO - Document ready
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 HomeRent System Loaded');
    
    // Gọi các hàm khởi tạo
    initScrollToTop();
    initCounterAnimation();
    initSearchForm();
    initAISearch();
    initChatButton();
    initPropertyCards();
    initNavbarScroll();
    initImagePlaceholders();
    initUserNavbar(); // Khởi tạo navbar người dùng
    initNotificationAndFavoriteButtons(); // Điều hướng khi click icon chuông/trái tim
    initFooterPartial(); // Nạp footer dùng partial cho tất cả các trang
    // JS trang Liên hệ đã tách riêng trong /js/contact.js
});

// ===================================
// 2. SCROLL TO TOP - Nút cuộn lên đầu
// ===================================
function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    
    if (!scrollTopBtn) return;
    
    // Hiển thị/ẩn nút khi scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });
    
    // Xử lý click - cuộn lên đầu trang
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===================================
// 3. COUNTER ANIMATION - Hiệu ứng đếm số
// ===================================
function initCounterAnimation() {
    const counters = document.querySelectorAll('[data-count]');
    
    if (counters.length === 0) return;
    
    // Tạo Intersection Observer để theo dõi khi phần tử xuất hiện
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target); // Chỉ chạy 1 lần
            }
        });
    }, observerOptions);
    
    // Theo dõi tất cả các counter
    counters.forEach(counter => observer.observe(counter));
}

/**
 * Hàm animate số đếm từ 0 đến giá trị target
 * @param {HTMLElement} element - Phần tử cần animate
 */
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000; // 2 giây
    const increment = target / (duration / 16); // 60fps
    let current = 0;
    
    const timer = setInterval(function() {
        current += increment;
        
        if (current >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 16);
}

/**
 * Format số với dấu phẩy ngăn cách hàng nghìn
 * @param {number} num - Số cần format
 * @returns {string} - Số đã được format
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ===================================
// 4. SEARCH FORM - Form tìm kiếm
// ===================================
function initSearchForm() {
    const searchForm = document.getElementById('searchForm');
    
    if (!searchForm) return;
    
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Lấy giá trị từ form
        const propertyType = document.getElementById('propertyType').value;
        const location = document.getElementById('location').value;
        const priceRange = document.getElementById('priceRange').value;
        
        // Tạo query string
        const params = new URLSearchParams();
        if (propertyType) params.append('type', propertyType);
        if (location) params.append('location', location);
        if (priceRange) params.append('price', priceRange);
        
        // Redirect đến trang kết quả tìm kiếm
        const queryString = params.toString();
        window.location.href = `/properties${queryString ? '?' + queryString : ''}`;
    });
}

// ===================================
// 5. AI SEARCH - Tìm kiếm bằng AI
// ===================================
function initAISearch() {
    const aiSearchBtn = document.getElementById('aiSearchBtn');
    
    if (!aiSearchBtn) return;
    
    aiSearchBtn.addEventListener('click', function() {
        // Hiển thị modal tìm kiếm AI (sẽ implement sau)
        showAISearchModal();
    });
}

/**
 * Hiển thị modal tìm kiếm bằng AI
 */
function showAISearchModal() {
    // Tạo prompt cho người dùng
    const userPrompt = prompt(
        '🤖 Mô tả phòng trọ bạn muốn tìm:\n\n' +
        'Ví dụ: "Tôi cần phòng trọ gần trường đại học, ' +
        'có điều hòa, giá dưới 3 triệu"'
    );
    
    if (userPrompt) {
        console.log('AI Search query:', userPrompt);
        
        // Hiển thị loading
        showLoading('Đang tìm kiếm bằng AI...');
        
        // Gọi API AI search (sẽ implement sau)
        setTimeout(() => {
            hideLoading();
            alert('Tính năng AI đang được phát triển! 🚀');
        }, 1500);
    }
}

// ===================================
// 6. CHAT BUTTON - Nút chat AI
// ===================================
function initChatButton() {
    const chatBtn = document.getElementById('chatBtn');
    
    if (!chatBtn) return;
    
    chatBtn.addEventListener('click', function() {
        // Mở cửa sổ chat AI (sẽ implement sau)
        openChatWindow();
    });
}

/**
 * Mở cửa sổ chat với AI
 */
function openChatWindow() {
    console.log('Opening chat window...');
    alert('💬 Chatbot AI đang được phát triển!\n\nSẽ hỗ trợ bạn 24/7 trong thời gian sớm nhất.');
}

// ===================================
// 7. PROPERTY CARDS - Xử lý card phòng trọ
// ===================================
function initPropertyCards() {
    const propertyCards = document.querySelectorAll('.property-card');
    
    if (propertyCards.length === 0) return;
    
    propertyCards.forEach(card => {
        // Thêm hiệu ứng khi hover
        card.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
        });
        
        // Click vào card (trừ nút) sẽ chuyển đến trang chi tiết
        card.addEventListener('click', function(e) {
            // Bỏ qua nếu click vào nút hoặc link
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                return;
            }
            
            // Lấy link từ nút "Xem chi tiết"
            const detailLink = this.querySelector('a[href^="/properties/"]');
            if (detailLink) {
                window.location.href = detailLink.href;
            }
        });
    });
}

// ===================================
// 8. NAVBAR SCROLL - Hiệu ứng navbar khi scroll
// ===================================
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    if (!navbar) return;
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 100) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });
}

// ===================================
// 9. IMAGE PLACEHOLDERS - Xử lý ảnh placeholder
// ===================================
function initImagePlaceholders() {
    // Tạo ảnh placeholder cho các ảnh chưa có
    const images = document.querySelectorAll('img[src*="/images/"]');
    
    images.forEach(img => {
        // Xử lý lỗi khi ảnh không tải được
        img.addEventListener('error', function() {
            // Tạo placeholder với màu ngẫu nhiên
            const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Tạo canvas làm placeholder
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            
            // Vẽ background màu
            ctx.fillStyle = randomColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Vẽ icon home
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = 'bold 100px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏠', canvas.width / 2, canvas.height / 2);
            
            // Set canvas làm src
            this.src = canvas.toDataURL();
            this.alt = 'Placeholder image';
        });
    });
}

// ===================================
// 10. LOADING OVERLAY - Overlay loading
// ===================================
let loadingOverlay = null;

/**
 * Hiển thị loading overlay
 * @param {string} message - Thông báo hiển thị
 */
function showLoading(message = 'Đang tải...') {
    // Tạo overlay nếu chưa có
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="loading-message text-white"></p>
            </div>
        `;
        
        // Thêm style inline
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        document.body.appendChild(loadingOverlay);
    }
    
    // Cập nhật message
    const messageEl = loadingOverlay.querySelector('.loading-message');
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    // Hiển thị
    loadingOverlay.style.display = 'flex';
}

/**
 * Ẩn loading overlay
 */
function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// ===================================
// 11. UTILITIES - Các hàm tiện ích
// ===================================

/**
 * Format giá tiền VND
 * @param {number} price - Giá cần format
 * @returns {string} - Giá đã format
 */
function formatPrice(price) {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + ' triệu';
    }
    return price.toLocaleString('vi-VN') + ' đ';
}

/**
 * Debounce function - Giảm số lần gọi hàm
 * @param {Function} func - Hàm cần debounce
 * @param {number} wait - Thời gian chờ (ms)
 * @returns {Function} - Hàm đã được debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function - Giới hạn số lần gọi hàm
 * @param {Function} func - Hàm cần throttle
 * @param {number} limit - Thời gian giới hạn (ms)
 * @returns {Function} - Hàm đã được throttle
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Show toast notification
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo (success, error, info, warning)
 */
function showToast(message, type = 'info') {
    // Kiểm tra Bootstrap Toast
    const toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        // Tạo container nếu chưa có
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    // Tạo toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                    data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    document.querySelector('.toast-container').appendChild(toastEl);
    
    // Hiển thị toast
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
    
    // Xóa toast sau khi ẩn
    toastEl.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

/**
 * Validate email format
 * @param {string} email - Email cần validate
 * @returns {boolean} - true nếu email hợp lệ
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate phone number (Vietnam)
 * @param {string} phone - Số điện thoại cần validate
 * @returns {boolean} - true nếu số điện thoại hợp lệ
 */
function validatePhone(phone) {
    const re = /^(0|\+84)[0-9]{9,10}$/;
    return re.test(phone);
}

// ===================================
// 12. USER NAVBAR - Quản lý navbar người dùng
// ===================================
function initUserNavbar() {
    // Kiểm tra xem có navbar elements không
    const guestNav = document.getElementById('navbarGuest');
    const userNav = document.getElementById('navbarUser');
    
    // Nếu không có elements navbar, bỏ qua
    if (!guestNav && !userNav) {
        console.log('⚠️ No navbar elements found, skipping navbar initialization');
        return;
    }

    // Kiểm tra token từ localStorage hoặc cookie
    const token = localStorage.getItem('token') || getCookie('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        // Người dùng đã đăng nhập
        try {
            const user = JSON.parse(userData);
            showUserNavbar(user);
        } catch (error) {
            console.error('Error parsing user data:', error);
            showGuestNavbar();
        }
    } else {
        // Người dùng chưa đăng nhập
        showGuestNavbar();
    }
}

/**
 * Hiển thị navbar cho người dùng đã đăng nhập
 */
function showUserNavbar(user) {
    const guestNav = document.getElementById('navbarGuest');
    const userNav = document.getElementById('navbarUser');
    
    if (guestNav) guestNav.style.display = 'none';
    if (userNav) {
        userNav.style.display = 'flex';
        
        // Cập nhật thông tin người dùng
        updateUserInfo(user);
    }
}

/**
 * Hiển thị navbar cho khách (chưa đăng nhập)
 */
function showGuestNavbar() {
    const guestNav = document.getElementById('navbarGuest');
    const userNav = document.getElementById('navbarUser');
    
    if (guestNav) guestNav.style.display = 'flex';
    if (userNav) userNav.style.display = 'none';
}

/**
 * Cập nhật thông tin người dùng trong navbar
 */
function updateUserInfo(user) {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userName) userName.textContent = user.name || 'Người dùng';
    if (userEmail) userEmail.textContent = user.email || 'user@example.com';
    
    // Cập nhật avatar nếu có
    if (user.avatar && userAvatar) {
        userAvatar.src = user.avatar;
    } else if (userAvatar) {
        // Tạo avatar từ chữ cái đầu của tên
        const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
        const colors = ['0d6efd', '6f42c1', 'dc3545', 'fd7e14', '198754'];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];
        userAvatar.src = `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff`;
    }
}

/**
 * Lấy giá trị cookie theo tên
 */
function getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length);
        }
    }
    return null;
}

/**
 * Xử lý đăng xuất
 */
function handleLogout(event) {
    event.preventDefault();
    
    // Xóa dữ liệu từ localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Xóa cookie token
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Hiển thị navbar khách
    showGuestNavbar();
    
    // Chuyển hướng về trang chủ
    window.location.href = '/';
}

/**
 * Hàm để cập nhật navbar sau khi đăng nhập
 * Sử dụng từ trang đăng nhập
 */
function updateNavbarAfterLogin(userData) {
    // Lưu thông tin người dùng vào localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Cập nhật navbar
    showUserNavbar(userData);
    
    console.log('✅ Navbar updated after login');
}

// ===================================
// 13. EXPORT - Xuất các hàm để sử dụng
// ===================================
// Các hàm có thể được gọi từ file khác
window.HomeRent = {
    formatPrice,
    formatNumber,
    showLoading,
    hideLoading,
    showToast,
    validateEmail,
    validatePhone,
    debounce,
    throttle,
    updateNavbarAfterLogin,
    handleLogout,
    showUserNavbar,
    showGuestNavbar
};

// ===================================
// 14. ERROR HANDLING - Xử lý lỗi toàn cục
// ===================================
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    // Có thể gửi error đến server để tracking
});

// Xử lý unhandled promise rejection
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});

// ===================================
// 15. PERFORMANCE - Theo dõi performance
// ===================================
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`⚡ Page load time: ${pageLoadTime}ms`);
        }, 0);
    });
}

// CONTACT PAGE logic đã tách sang /js/contact.js

// ===================================
// 16. NAV ICON SHORTCUTS - Điều hướng icon thông báo và yêu thích
// ===================================
function initNotificationAndFavoriteButtons() {
    const notifBtns = document.querySelectorAll('button.btn-icon-navbar[title="Thông báo"]');
    const favBtns = document.querySelectorAll('button.btn-icon-navbar[title="Yêu thích"]');
    
    notifBtns.forEach(btn => {
        // Điều hướng đến trang thông báo
        btn.addEventListener('click', () => { window.location.href = '/notifications'; }, { once: false });
    });
    
    favBtns.forEach(btn => {
        // Điều hướng đến trang yêu thích
        btn.addEventListener('click', () => { window.location.href = '/favorites'; }, { once: false });
    });
}

// ===================================
// END OF SCRIPT
// ===================================
console.log('✅ All scripts initialized successfully');

// ===================================
// 17. FOOTER PARTIAL - Nạp nội dung footer cho mọi trang
// ===================================
function initFooterPartial() {
    try {
        const footerEl = document.querySelector('footer.footer');
        if (!footerEl) {
            console.log('⚠️ Không tìm thấy phần tử footer để nạp partial');
            return;
        }

        fetch('/views/partials/footer.html', { cache: 'no-cache' })
            .then(res => {
                if (!res.ok) throw new Error('Footer partial fetch failed');
                return res.text();
            })
            .then(html => {
                footerEl.innerHTML = html;

                // Gắn sự kiện Đăng ký nhận bản tin
                const emailInput = footerEl.querySelector('input[type="email"]');
                const subscribeBtn = footerEl.querySelector('button[type="button"]');
                if (subscribeBtn && emailInput) {
                    subscribeBtn.addEventListener('click', () => {
                        const email = emailInput.value.trim();
                        const isValid = window.HomeRent && window.HomeRent.validateEmail
                            ? window.HomeRent.validateEmail(email)
                            : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

                        if (!isValid) {
                            window.HomeRent && window.HomeRent.showToast
                                ? window.HomeRent.showToast('Email không hợp lệ', 'warning')
                                : alert('Email không hợp lệ');
                            return;
                        }

                        // Hiện tại demo: chỉ hiện thông báo
                        window.HomeRent && window.HomeRent.showToast
                            ? window.HomeRent.showToast('Đã đăng ký nhận bản tin!', 'success')
                            : alert('Đã đăng ký nhận bản tin!');

                        emailInput.value = '';
                    });
                }

                // Gắn sự kiện cho liên kết mạng xã hội (demo)
                footerEl.querySelectorAll('.social-links a').forEach(a => {
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.HomeRent && window.HomeRent.showToast
                            ? window.HomeRent.showToast('Tính năng mạng xã hội sẽ được tích hợp sau', 'info')
                            : alert('Tính năng mạng xã hội sẽ được tích hợp sau');
                    });
                });
            })
            .catch(err => {
                console.error('❌ Không thể nạp footer partial:', err);
            });
    } catch (error) {
        console.error('Footer init error:', error);
    }
}
