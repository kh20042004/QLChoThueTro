/**
 * ===================================
 * CHAT BADGE - Update unread count globally
 * Cập nhật số tin nhắn chưa đọc trên tất cả các trang
 * ===================================
 */

(function() {
  // Function to update chat badge
  async function updateChatBadge() {
    const token = localStorage.getItem('token');
    const badge = document.getElementById('chatBadge');
    
    // Nếu chưa đăng nhập hoặc không có badge element thì return
    if (!token || !badge) {
      return;
    }

    try {
      // Gọi API để lấy số tin nhắn chưa đọc
      const response = await fetch('/api/chat/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.data || 0;
        
        // Update badge text
        badge.textContent = unreadCount;
        
        // Hiển thị hoặc ẩn badge
        if (unreadCount > 0) {
          badge.style.display = 'flex';
          // Update title để user biết có tin nhắn mới
          if (unreadCount > 0 && !document.title.startsWith('(')) {
            document.title = `(${unreadCount}) ${document.title}`;
          }
        } else {
          badge.style.display = 'none';
          // Remove count from title
          document.title = document.title.replace(/^\(\d+\)\s/, '');
        }
      }
    } catch (error) {
      console.error('Error updating chat badge:', error);
    }
  }

  // Update badge khi trang load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateChatBadge);
  } else {
    updateChatBadge();
  }

  // Update badge mỗi 30 giây
  setInterval(updateChatBadge, 30000);

  // Update badge khi user focus vào trang (quay lại từ tab khác)
  window.addEventListener('focus', updateChatBadge);

  // Export function để các script khác có thể gọi
  window.updateChatBadge = updateChatBadge;
})();
