/**
 * ===================================
 * AUTH.JS - Xử lý đăng nhập/đăng ký
 * Hệ thống cho thuê nhà/phòng trọ
 * ===================================
 */

document.addEventListener('DOMContentLoaded', function() {
    // Xử lý form đăng nhập
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Xử lý form đăng ký
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

/**
 * Xử lý đăng nhập
 */
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
        showAlert('Vui lòng nhập email và mật khẩu', 'warning');
        return;
    }

    try {
        showLoading();

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        hideLoading();

        if (data.success) {
            // Lưu token vào localStorage
            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            // Lưu thông tin user
            if (data.user) {
                localStorage.setItem('userData', JSON.stringify(data.user));
            }

            // Hiển thị thông báo thành công
            showAlert('Đăng nhập thành công!', 'success');

            // Cập nhật navbar nếu có hàm updateNavbarAfterLogin
            if (window.HomeRent && window.HomeRent.updateNavbarAfterLogin) {
                window.HomeRent.updateNavbarAfterLogin(data.user);
            }

            // Chuyển hướng sau 1.5 giây
            setTimeout(() => {
                window.location.href = data.redirect || '/';
            }, 1500);
        } else {
            showAlert(data.error || 'Đăng nhập thất bại', 'danger');
        }
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        showAlert('Có lỗi xảy ra. Vui lòng thử lại.', 'danger');
    }
}

/**
 * Xử lý đăng ký
 */
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('name')?.value;
    const email = document.getElementById('email')?.value;
    const phone = document.getElementById('phone')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
        showAlert('Vui lòng điền đầy đủ thông tin', 'warning');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Mật khẩu không khớp', 'warning');
        return;
    }

    if (password.length < 6) {
        showAlert('Mật khẩu phải có ít nhất 6 ký tự', 'warning');
        return;
    }

    try {
        showLoading();

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, password })
        });

        const data = await response.json();
        hideLoading();

        if (data.success) {
            showAlert('Đăng ký thành công! Vui lòng đăng nhập.', 'success');

            // Chuyển hướng về trang đăng nhập sau 2 giây
            setTimeout(() => {
                window.location.href = data.redirect || '/auth/login';
            }, 2000);
        } else {
            showAlert(data.error || 'Đăng ký thất bại', 'danger');
        }
    } catch (error) {
        hideLoading();
        console.error('Register error:', error);
        showAlert('Có lỗi xảy ra. Vui lòng thử lại.', 'danger');
    }
}

/**
 * Hiển thị thông báo toast ở góc trên bên phải
 */
function showAlert(message, type = 'info') {
    // Tạo container cho toast nếu chưa có
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(toastContainer);
    }

    // Map type to icon and color
    const typeConfig = {
        success: {
            icon: '✓',
            bgColor: '#10b981',
            iconBg: '#059669'
        },
        danger: {
            icon: '✕',
            bgColor: '#ef4444',
            iconBg: '#dc2626'
        },
        warning: {
            icon: '⚠',
            bgColor: '#f59e0b',
            iconBg: '#d97706'
        },
        info: {
            icon: 'ℹ',
            bgColor: '#3b82f6',
            iconBg: '#2563eb'
        }
    };

    const config = typeConfig[type] || typeConfig.info;

    // Tạo toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        background: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
        min-width: 320px;
        border-left: 4px solid ${config.bgColor};
    `;

    toast.innerHTML = `
        <div style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${config.bgColor};
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            font-weight: bold;
            flex-shrink: 0;
        ">${config.icon}</div>
        <div style="flex: 1; color: #1f2937; font-size: 14px; font-weight: 500;">
            ${message}
        </div>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s;
        " onmouseover="this.style.background='#f3f4f6'; this.style.color='#1f2937'" 
           onmouseout="this.style.background='none'; this.style.color='#9ca3af'">×</button>
    `;

    // Thêm animation CSS nếu chưa có
    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    toastContainer.appendChild(toast);

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * Hiển thị loading
 */
function showLoading() {
    const button = document.querySelector('button[type="submit"]');
    if (button) {
        button.disabled = true;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Đang xử lý...
        `;
    }
}

/**
 * Ẩn loading
 */
function hideLoading() {
    const button = document.querySelector('button[type="submit"]');
    if (button) {
        button.disabled = false;
        button.innerHTML = button.getAttribute('data-original-text') || 'Đăng nhập';
    }
}

// Lưu text ban đầu của button
document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('button[type="submit"]');
    if (button) {
        button.setAttribute('data-original-text', button.innerHTML);
    }
});
