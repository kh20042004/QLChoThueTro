/**
 * CONTACT.JS - Script dành cho trang Liên hệ
 * HomeRent
 */

document.addEventListener('DOMContentLoaded', function() {
  initContactForm();
});

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Tránh trùng listener nếu trang còn script inline
  let activeForm = form;
  try {
    const cloned = form.cloneNode(true);
    form.parentNode.replaceChild(cloned, form);
    activeForm = cloned;
  } catch (e) {}

  // Lấy các phần tử form
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const phoneEl = document.getElementById('phone');
  const subjectEl = document.getElementById('subject');
  const messageEl = document.getElementById('message');
  const agreeEl = document.getElementById('agree');

  // Tiện ích từ HomeRent
  const toast = window.HomeRent?.showToast;
  const showLoading = window.HomeRent?.showLoading;
  const hideLoading = window.HomeRent?.hideLoading;
  const validateEmail = window.HomeRent?.validateEmail;
  const validatePhone = window.HomeRent?.validatePhone;
  const debounceFn = window.HomeRent?.debounce;
  const throttleFn = window.HomeRent?.throttle;

  // Nạp bản nháp nếu có
  const draftKey = 'contactFormDraft';
  try {
    const raw = localStorage.getItem(draftKey);
    if (raw) {
      const draft = JSON.parse(raw);
      if (nameEl) nameEl.value = draft.name || '';
      if (emailEl) emailEl.value = draft.email || '';
      if (phoneEl) phoneEl.value = draft.phone || '';
      if (subjectEl) subjectEl.value = draft.subject || '';
      if (messageEl) messageEl.value = draft.message || '';
    }
  } catch (e) {}

  // Tự động lưu bản nháp theo thời gian thực
  const fields = ['name', 'email', 'phone', 'subject', 'message'];
  fields.forEach(function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', throttle(function() {
      const snapshot = {};
      fields.forEach(function(fid) {
        const fe = document.getElementById(fid);
        snapshot[fid] = fe ? fe.value : '';
      });
      try { localStorage.setItem(draftKey, JSON.stringify(snapshot)); } catch (_) {}
    }, 500));
  });

  // Validate realtime email
  if (emailEl) {
    emailEl.addEventListener('input', debounce(function() {
      const valid = !emailEl.value || (validateEmail ? validateEmail(emailEl.value) : true);
      emailEl.classList.toggle('is-invalid', !valid);
    }, 300));
  }

  // Validate realtime phone
  if (phoneEl) {
    phoneEl.addEventListener('input', debounce(function() {
      const valid = !phoneEl.value || (validatePhone ? validatePhone(phoneEl.value) : true);
      phoneEl.classList.toggle('is-invalid', !valid);
    }, 300));
  }

  // Submit form
  activeForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = nameEl?.value.trim() || '';
    const email = emailEl?.value.trim() || '';
    const phone = phoneEl?.value.trim() || '';
    const subject = subjectEl?.value.trim() || '';
    const message = messageEl?.value.trim() || '';
    const agree = !!(agreeEl && agreeEl.checked);

    if (!name || !email || !phone || !subject || !message || !agree) {
      toast && toast('Vui lòng điền đầy đủ thông tin và đồng ý điều khoản.', 'warning');
      return;
    }
    if (validateEmail && !validateEmail(email)) {
      toast && toast('Email không hợp lệ.', 'warning');
      return;
    }
    if (validatePhone && !validatePhone(phone)) {
      toast && toast('Số điện thoại không hợp lệ.', 'warning');
      return;
    }

    const payload = { name, email, phone, subject, message, ts: new Date().toISOString() };

    showLoading && showLoading('Đang gửi liên hệ...');
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Không thể gửi liên hệ');
      }

      toast && toast('Đã gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm.', 'success');
      activeForm.reset();
      try { localStorage.removeItem(draftKey); } catch (_) {}
    } catch (err) {
      toast && toast(err.message || 'Không thể gửi liên hệ hiện tại. Vui lòng thử lại sau.', 'danger');
    } finally {
      hideLoading && hideLoading();
    }
  });

  // Reset sẽ xóa bản nháp
  activeForm.addEventListener('reset', function() {
    try { localStorage.removeItem(draftKey); } catch (_) {}
  });

  // Helpers: debounce/throttle fallback nếu HomeRent chưa có
  function debounce(fn, wait) {
    if (typeof debounceFn === 'function') return debounceFn(fn, wait);
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    }
  }

  function throttle(fn, limit) {
    if (typeof throttleFn === 'function') return throttleFn(fn, limit);
    let inThrottle = false;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }
}