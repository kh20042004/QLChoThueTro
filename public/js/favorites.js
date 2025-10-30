/**
 * ===================================
 * FAVORITE FUNCTIONALITY
 * Xử lý thêm/xóa yêu thích phía client
 * ===================================
 */

class FavoriteManager {
  constructor() {
    this.favorites = new Set();
    this.init();
  }

  /**
   * Khởi tạo - tải danh sách yêu thích từ server
   */
  async init() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        result.data.forEach(property => {
          this.favorites.add(property._id);
        });
        this.updateUI();
      }
    } catch (error) {
      console.error('Lỗi tải yêu thích:', error);
    }
  }

  /**
   * Toggle yêu thích - thêm hoặc xóa
   */
  async toggle(propertyId, button = null) {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      const isFavorite = this.favorites.has(propertyId);
      const method = isFavorite ? 'DELETE' : 'POST';
      const endpoint = `/api/favorites/${propertyId}`;

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (isFavorite) {
          this.favorites.delete(propertyId);
          this.showNotification('Đã xóa khỏi yêu thích', 'success');
        } else {
          this.favorites.add(propertyId);
          this.showNotification('Đã thêm vào yêu thích', 'success');
        }

        this.updateUI();
        if (button) this.updateButton(button, propertyId);
      } else {
        const error = await response.json();
        this.showNotification(error.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (error) {
      console.error('Lỗi:', error);
      this.showNotification('Có lỗi khi xử lý yêu thích', 'error');
    }
  }

  /**
   * Kiểm tra property có trong yêu thích không
   */
  isFavorite(propertyId) {
    return this.favorites.has(propertyId);
  }

  /**
   * Cập nhật UI - làm nổi bật icon yêu thích
   */
  updateUI() {
    const buttons = document.querySelectorAll('.favorite-btn[data-favorite-property]');
    buttons.forEach(button => {
      const propertyId = button.dataset.favoriteProperty;
      this.updateButton(button, propertyId);
    });
    
    // Cập nhật badge số lượng yêu thích
    this.updateBadge();
  }

  /**
   * Cập nhật badge số lượng yêu thích
   */
  updateBadge() {
    const badge = document.getElementById('favoriteBadge');
    if (badge) {
      badge.textContent = this.favorites.size;
      // Ẩn badge nếu không có yêu thích
      if (this.favorites.size === 0) {
        badge.classList.add('hidden');
      } else {
        badge.classList.remove('hidden');
      }
    }
  }

  /**
   * Cập nhật button yêu thích
   */
  updateButton(button, propertyId) {
    const isFavorite = this.favorites.has(propertyId);
    const icon = button.querySelector('i');
    
    if (isFavorite) {
      button.classList.add('favorite-active');
      button.classList.remove('bg-red-100', 'text-red-600', 'hover:bg-red-200');
      button.classList.add('bg-red-500', 'text-white', 'hover:bg-red-600');
      if (icon) {
        icon.classList.remove('far');
        icon.classList.add('fas');
      }
      button.title = 'Bỏ yêu thích';
    } else {
      button.classList.remove('favorite-active');
      button.classList.remove('bg-red-500', 'text-white', 'hover:bg-red-600');
      button.classList.add('bg-red-100', 'text-red-600', 'hover:bg-red-200');
      if (icon) {
        icon.classList.remove('fas');
        icon.classList.add('far');
      }
      button.title = 'Thêm yêu thích';
    }
  }

  /**
   * Hiển thị thông báo
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 animate-slideDown ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      'bg-blue-500'
    } text-white`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.favoriteManager = new FavoriteManager();
});

/**
 * Gắn sự kiện cho nút yêu thích
 * Sử dụng: onclick="toggleFavorite(event, propertyId)"
 */
function toggleFavorite(event, propertyId) {
  event.preventDefault();
  event.stopPropagation();
  
  if (window.favoriteManager) {
    window.favoriteManager.toggle(propertyId, event.currentTarget);
  }
}

/**
 * Gắn sự kiện cho badge yêu thích trên thẻ property
 * Sử dụng: <i class="far fa-heart" onclick="handleFavoriteBadge(event, propertyId)"></i>
 */
function handleFavoriteBadge(event, propertyId) {
  event.preventDefault();
  event.stopPropagation();
  
  if (window.favoriteManager) {
    window.favoriteManager.toggle(propertyId, event.currentTarget);
    event.currentTarget.classList.toggle('fas');
    event.currentTarget.classList.toggle('far');
    event.currentTarget.classList.toggle('text-red-500');
  }
}
