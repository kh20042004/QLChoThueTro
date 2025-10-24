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
 * Hiển thị thông báo
 */
function showAlert(message, type = 'info') {
    // Kiểm xem có thông báo cũ không
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Tạo element thông báo
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Chèn vào đầu body
    document.body.insertBefore(alertDiv, document.body.firstChild);

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
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
