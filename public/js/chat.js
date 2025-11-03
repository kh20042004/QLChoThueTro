/**
 * ===================================
 * CHAT.JS - Frontend Chat với Socket.IO
 * Quản lý kết nối WebSocket và UI chat
 * ===================================
 */

// Prevent duplicate declaration if script loaded twice
if (typeof window.chatSocket === 'undefined') {
  window.chatSocket = null;
}
if (typeof window.chatCurrentConversationId === 'undefined') {
  window.chatCurrentConversationId = null;
}
if (typeof window.chatCurrentReceiverId === 'undefined') {
  window.chatCurrentReceiverId = null;
}

// Use global variables to prevent redeclaration
let socket = window.chatSocket;
let currentConversationId = window.chatCurrentConversationId;
let currentReceiverId = window.chatCurrentReceiverId;
let typingTimeout = null;

// State
const state = {
  conversations: [],
  messages: [],
  onlineUsers: new Set(),
  currentPage: 1,
  hasMoreMessages: true
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  await initializeChat();
  setupEventListeners();
  await loadConversations();
  
  // Kiểm tra nếu có conversation cần mở từ property detail
  checkAndOpenPendingConversation();
});

// ==========================================
// AUTH & SOCKET SETUP
// ==========================================
async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/auth/login';
    return;
  }
}

async function initializeChat() {
  const token = localStorage.getItem('token');
  
  // Kết nối Socket.IO
  socket = io({
    auth: { token }
  });

  // Socket event listeners
  socket.on('connect', () => {
    console.log('✅ Connected to chat server');
    updateConnectionStatus(true);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from chat server');
    updateConnectionStatus(false);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    showNotification('Lỗi kết nối', 'error');
  });

  // User online/offline events
  socket.on('user:online', ({ userId }) => {
    state.onlineUsers.add(userId);
    updateUserStatus(userId, true);
  });

  socket.on('user:offline', ({ userId }) => {
    state.onlineUsers.delete(userId);
    updateUserStatus(userId, false);
  });

  // Message events
  socket.on('message:received', ({ message, conversation }) => {
    handleMessageReceived(message, conversation);
  });

  socket.on('message:sent', ({ message }) => {
    appendMessage(message);
  });

  socket.on('message:new', (message) => {
    if (currentConversationId === message.conversation) {
      appendMessage(message);
      scrollToBottom();
    }
  });

  // Typing events
  socket.on('typing:started', ({ conversationId, userName }) => {
    if (currentConversationId === conversationId) {
      showTypingIndicator(userName);
    }
  });

  socket.on('typing:stopped', ({ conversationId }) => {
    if (currentConversationId === conversationId) {
      hideTypingIndicator();
    }
  });

  // Read receipts
  socket.on('messages:read', ({ conversationId, readBy }) => {
    if (currentConversationId === conversationId) {
      markMessagesAsRead();
    }
  });
}

// ==========================================
// LOAD CONVERSATIONS
// ==========================================
async function loadConversations() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/chat/conversations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      state.conversations = data.data;
      renderConversations(data.data);
      
      // Cập nhật badge tổng tin nhắn chưa đọc
      const totalUnread = data.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      updateUnreadBadge(totalUnread);
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
    showNotification('Không thể tải danh sách hội thoại', 'error');
  }
}

function renderConversations(conversations) {
  const container = document.getElementById('conversationsList');
  
  if (conversations.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-comments text-4xl mb-2"></i>
        <p>Chưa có cuộc hội thoại nào</p>
      </div>
    `;
    return;
  }

  // Filter out conversations with missing otherUser
  const validConversations = conversations.filter(conv => {
    if (!conv.otherUser || !conv.otherUser._id) {
      console.warn('Invalid conversation (missing otherUser):', conv);
      return false;
    }
    return true;
  });

  container.innerHTML = validConversations.map(conv => `
    <div class="conversation-item p-4 hover:bg-gray-50 cursor-pointer border-b transition-colors ${currentConversationId === conv._id ? 'bg-blue-50' : ''}"
         data-id="${conv._id}"
         onclick="openConversation('${conv._id}', '${conv.otherUser._id}', '${escapeHtml(conv.otherUser.name)}', '${conv.otherUser.avatar || ''}')">
      <div class="flex items-start space-x-3">
        <div class="relative flex-shrink-0">
          <img src="${conv.otherUser.avatar || '/images/default-avatar.png'}" 
               onerror="this.src='/images/default-avatar.png'"
               alt="${escapeHtml(conv.otherUser.name)}" 
               class="w-12 h-12 rounded-full object-cover">
          <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${state.onlineUsers.has(conv.otherUser._id) ? 'bg-green-500' : 'bg-gray-400'}"
                id="status-${conv.otherUser._id}"></span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-sm font-semibold text-gray-900 truncate">${conv.otherUser.name}</h3>
            <span class="text-xs text-gray-500">${formatMessageTime(conv.lastMessageTime)}</span>
          </div>
          <p class="text-sm text-gray-600 truncate">
            ${conv.lastMessage ? (conv.lastMessage.content || 'Đã gửi file đính kèm') : 'Chưa có tin nhắn'}
          </p>
        </div>
        ${conv.unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">${conv.unreadCount}</span>` : ''}
      </div>
    </div>
  `).join('');
}

// ==========================================
// OPEN CONVERSATION
// ==========================================
async function openConversation(conversationId, receiverId, receiverName, receiverAvatar) {
  currentConversationId = conversationId;
  currentReceiverId = receiverId;
  
  // Cập nhật UI header
  document.getElementById('chatUserName').textContent = receiverName;
  document.getElementById('chatUserAvatar').src = receiverAvatar || 'https://via.placeholder.com/40';
  
  // Hiển thị chat area
  document.getElementById('emptyChatState').style.display = 'none';
  document.getElementById('chatArea').style.display = 'flex';
  
  // Highlight conversation đã chọn
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.remove('bg-blue-50');
  });
  
  // Tìm và highlight conversation item hiện tại
  const currentItem = document.querySelector(`.conversation-item[data-id="${conversationId}"]`);
  if (currentItem) {
    currentItem.classList.add('bg-blue-50');
  }
  
  // Join conversation qua socket
  socket.emit('conversation:join', conversationId);
  
  // Load messages
  await loadMessages(conversationId);
}

// ==========================================
// LOAD MESSAGES
// ==========================================
async function loadMessages(conversationId, page = 1) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/chat/conversations/${conversationId}/messages?page=${page}&limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      if (page === 1) {
        state.messages = data.data;
        renderMessages(data.data);
      } else {
        state.messages = [...data.data, ...state.messages];
        prependMessages(data.data);
      }
      
      state.hasMoreMessages = data.pagination.page < data.pagination.pages;
      scrollToBottom();
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    showNotification('Không thể tải tin nhắn', 'error');
  }
}

function renderMessages(messages) {
  const container = document.getElementById('messagesContainer');
  const currentUserId = getCurrentUserId();
  
  if (messages.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-comment-dots text-4xl mb-2"></i>
        <p>Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = messages.map(msg => createMessageHTML(msg, currentUserId)).join('');
}

function createMessageHTML(message, currentUserId) {
  const isSent = message.sender._id === currentUserId;
  
  return `
    <div class="flex ${isSent ? 'justify-end' : 'justify-start'} mb-4">
      ${!isSent ? `
        <img src="${message.sender.avatar || 'https://via.placeholder.com/32'}" 
             alt="${message.sender.name}" 
             class="w-8 h-8 rounded-full mr-2">
      ` : ''}
      <div class="max-w-xs lg:max-w-md">
        <div class="${isSent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'} rounded-lg px-4 py-2">
          ${message.content ? `<p class="text-sm">${escapeHtml(message.content)}</p>` : ''}
          ${message.attachments && message.attachments.length > 0 ? renderAttachments(message.attachments) : ''}
        </div>
        <div class="flex items-center mt-1 space-x-2">
          <span class="text-xs text-gray-500">${formatMessageTime(message.createdAt)}</span>
          ${isSent && message.isRead ? '<i class="fas fa-check-double text-blue-500 text-xs"></i>' : ''}
        </div>
      </div>
    </div>
  `;
}

function appendMessage(message) {
  const container = document.getElementById('messagesContainer');
  const currentUserId = getCurrentUserId();
  container.insertAdjacentHTML('beforeend', createMessageHTML(message, currentUserId));
  scrollToBottom();
}

// ==========================================
// SEND MESSAGE
// ==========================================
function setupEventListeners() {
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendMessageBtn');
  
  // Send on button click
  sendBtn?.addEventListener('click', sendMessage);
  
  // Send on Enter (Shift+Enter for new line)
  input?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Typing indicator
  input?.addEventListener('input', () => {
    if (!currentConversationId || !currentReceiverId) return;
    
    socket.emit('typing:start', {
      conversationId: currentConversationId,
      receiverId: currentReceiverId
    });
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('typing:stop', {
        conversationId: currentConversationId,
        receiverId: currentReceiverId
      });
    }, 1000);
  });
  
  // Search conversations
  const searchInput = document.getElementById('searchConversations');
  searchInput?.addEventListener('input', debounce(searchConversations, 300));
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const content = input.value.trim();
  
  if (!content || !currentConversationId || !currentReceiverId) return;
  
  // Emit qua socket
  socket.emit('message:send', {
    conversationId: currentConversationId,
    receiverId: currentReceiverId,
    content,
    messageType: 'text'
  });
  
  // Clear input
  input.value = '';
  input.style.height = 'auto';
}

// ==========================================
// SEARCH & UTILITY FUNCTIONS
// ==========================================
async function searchConversations() {
  const query = document.getElementById('searchConversations').value.trim();
  
  if (!query) {
    renderConversations(state.conversations);
    return;
  }
  
  const filtered = state.conversations.filter(conv => 
    conv.otherUser.name.toLowerCase().includes(query.toLowerCase()) ||
    conv.otherUser.email.toLowerCase().includes(query.toLowerCase())
  );
  
  renderConversations(filtered);
}

function formatMessageTime(date) {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now - messageDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút`;
  if (diffHours < 24) return `${diffHours} giờ`;
  if (diffDays < 7) return `${diffDays} ngày`;
  
  return messageDate.toLocaleDateString('vi-VN');
}

function getCurrentUserId() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.id;
}

function updateUserStatus(userId, isOnline) {
  const statusDot = document.getElementById(`status-${userId}`);
  if (statusDot) {
    statusDot.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`;
  }
}

function updateConnectionStatus(isConnected) {
  // Có thể thêm indicator ở header
  console.log(`Connection status: ${isConnected ? 'Online' : 'Offline'}`);
}

function updateUnreadBadge(count) {
  const badge = document.getElementById('chatBadge');
  if (badge) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function showTypingIndicator(userName) {
  const container = document.getElementById('messagesContainer');
  const existing = document.getElementById('typingIndicator');
  
  if (!existing) {
    container.insertAdjacentHTML('beforeend', `
      <div id="typingIndicator" class="flex items-center space-x-2 mb-4 text-gray-500">
        <div class="flex space-x-1">
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
        <span class="text-sm">${userName} đang nhập...</span>
      </div>
    `);
    scrollToBottom();
  }
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

function scrollToBottom() {
  const container = document.getElementById('messagesContainer');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function handleMessageReceived(message, conversation) {
  // Cập nhật conversation list
  loadConversations();
  
  // Update global chat badge if function exists (from chat-badge.js)
  if (typeof window.updateChatBadge === 'function') {
    window.updateChatBadge();
  }
  
  // Nếu đang mở conversation này, append message
  if (currentConversationId === message.conversation) {
    appendMessage(message);
    socket.emit('messages:markAsRead', { conversationId: currentConversationId });
  } else {
    // Show notification
    showNotification(`Tin nhắn mới từ ${message.sender.name}`, 'info');
  }
}

function markMessagesAsRead() {
  // Update read status in UI
  document.querySelectorAll('.message-read-status').forEach(el => {
    el.innerHTML = '<i class="fas fa-check-double text-blue-500 text-xs"></i>';
  });
}

function renderAttachments(attachments) {
  return attachments.map(att => {
    if (att.type === 'image') {
      return `<img src="${att.url}" alt="${att.filename}" class="max-w-full rounded mt-2">`;
    }
    return `<a href="${att.url}" target="_blank" class="text-blue-300 underline">${att.filename}</a>`;
  }).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  // Simple notification - có thể dùng thư viện như Toastify
  alert(message);
}

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

// ==========================================
// AUTO-OPEN CONVERSATION FROM PROPERTY
// ==========================================
async function checkAndOpenPendingConversation() {
  const openConversationId = localStorage.getItem('openConversationId');
  
  console.log('🔍 Checking for pending conversation:', openConversationId); // Debug
  
  if (openConversationId) {
    // Đợi conversations load xong (tăng timeout lên 1000ms)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📋 Current conversations:', state.conversations); // Debug
    
    // Tìm conversation trong danh sách
    const conversation = state.conversations.find(c => c._id === openConversationId);
    
    console.log('✅ Found conversation:', conversation); // Debug
    
    if (conversation && conversation.otherUser && conversation.otherUser._id) {
      // Mở conversation
      await openConversation(
        conversation._id,
        conversation.otherUser._id,
        conversation.otherUser.name,
        conversation.otherUser.avatar || ''
      );
      
      // Scroll đến conversation trong sidebar
      const conversationElement = document.querySelector(`.conversation-item[data-id="${openConversationId}"]`);
      if (conversationElement) {
        conversationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      console.log('✅ Conversation opened successfully'); // Debug
    } else {
      console.warn('⚠️ Conversation not found in list or missing otherUser, reloading...'); // Debug
      // Nếu không tìm thấy, reload conversations và thử lại
      await loadConversations();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const retryConversation = state.conversations.find(c => c._id === openConversationId);
      if (retryConversation && retryConversation.otherUser && retryConversation.otherUser._id) {
        await openConversation(
          retryConversation._id,
          retryConversation.otherUser._id,
          retryConversation.otherUser.name,
          retryConversation.otherUser.avatar || ''
        );
        console.log('✅ Conversation opened on retry'); // Debug
      } else {
        console.error('❌ Could not open conversation - missing data'); // Debug
      }
    }
    
    // Xóa flag sau khi đã xử lý
    localStorage.removeItem('openConversationId');
    localStorage.removeItem('openConversationUser');
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
