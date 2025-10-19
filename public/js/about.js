/**
 * ABOUT.JS - Script dành cho trang Giới thiệu
 * HomeRent
 */

document.addEventListener('DOMContentLoaded', function() {
  initAboutPage();
});

/**
 * Khởi tạo các tương tác dành riêng cho trang Giới thiệu
 * Lưu ý: Các logic chung (counter, navbar, floating buttons, toast, ...) nằm ở /js/main.js
 */
function initAboutPage() {
  console.log('📄 About page initialized');

  // Smooth scroll cho anchor nội bộ nếu có
  const internalLinks = document.querySelectorAll('a[href^="#"]');
  internalLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Lazy-load ảnh trong trang giới thiệu nếu có thuộc tính data-src
  const images = document.querySelectorAll('img');
  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver(function(entries, obs) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const dataSrc = el.getAttribute('data-src');
          if (dataSrc) {
            el.src = dataSrc;
            el.removeAttribute('data-src');
          }
          obs.unobserve(el);
        }
      });
    }, { rootMargin: '50px', threshold: 0.01 });

    images.forEach(function(img) {
      imgObserver.observe(img);
    });
  }

  // Kích hoạt lại counter nếu section thống kê có mặt (dùng hàm global từ main.js)
  try {
    if (typeof initCounterAnimation === 'function') {
      initCounterAnimation();
    }
  } catch (_) {}

  // Placeholder cho các tính năng tương lai:
  // - Hiệu ứng cho team cards
  // - Theo dõi tương tác người dùng trên trang giới thiệu
  // - Tích hợp analytics riêng cho About page
}