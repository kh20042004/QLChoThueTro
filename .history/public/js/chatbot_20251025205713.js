/**
 * ===================================
 * CHATBOT JAVASCRIPT
 * Logic cho AI chatbot widget với Gemini
 * ===================================
 */

class Chatbot {
  constructor() {
    this.container = null;
    this.toggleBtn = null;
    this.chatWindow = null;
    this.messagesContainer = null;
    this.inputField = null;
    this.sendBtn = null;
    this.conversationHistory = [];
    this.isTyping = false;

    this.init();
  }

  init() {
    this.createChatbotHTML();
    this.attachEventListeners();
    this.loadConversationHistory();
    this.showWelcomeMessage();
  }

  createChatbotHTML() {
    const html = `
      <div class="chatbot-container">
        <!-- Toggle Button -->
        <button class="chatbot-toggle" id="chatbotToggle">
          <i class="fas fa-comments"></i>
          <i class="fas fa-times"></i>
          <span class="chatbot-badge" style="display: none;">1</span>
        </button>

        <!-- Chat Window -->
        <div class="chatbot-window" id="chatbotWindow">
          <!-- Header -->
          <div class="chatbot-header">
            <div class="chatbot-avatar">
              🤖
            </div>
            <div class="chatbot-info">
              <h3>Trợ lý AI</h3>
              <div class="chatbot-status">
                <span class="status-dot"></span>
                <p>Đang hoạt động</p>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div class="chatbot-messages" id="chatbotMessages">
            <!-- Messages will be added here -->
          </div>

          <!-- Quick Replies -->
          <div class="quick-replies" id="quickReplies">
            <!-- Quick reply buttons will be added here -->
          </div>

          <!-- Typing Indicator -->
          <div class="typing-indicator" id="typingIndicator">
            <div class="message-avatar">🤖</div>
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <!-- Input -->
          <div class="chatbot-input">
            <input 
              type="text" 
              id="chatbotInput" 
              placeholder="Nhập câu hỏi của bạn..."
              autocomplete="off"
            />
            <button id="chatbotSend" type="button">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Get references
    this.container = document.querySelector('.chatbot-container');
    this.toggleBtn = document.getElementById('chatbotToggle');
    this.chatWindow = document.getElementById('chatbotWindow');
    this.messagesContainer = document.getElementById('chatbotMessages');
    this.inputField = document.getElementById('chatbotInput');
    this.sendBtn = document.getElementById('chatbotSend');
  }

  attachEventListeners() {
    // Toggle chatbot
    this.toggleBtn.addEventListener('click', () => this.toggleChatbot());

    // Send message on button click
    this.sendBtn.addEventListener('click', () => this.sendMessage());

    // Send message on Enter key
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Quick replies
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-reply-btn')) {
        const message = e.target.textContent;
        this.sendQuickReply(message);
      }
    });
  }

  toggleChatbot() {
    this.toggleBtn.classList.toggle('active');
    this.chatWindow.classList.toggle('active');

    if (this.chatWindow.classList.contains('active')) {
      this.inputField.focus();
      this.hideNotificationBadge();
    }
  }

  showWelcomeMessage() {
    const welcomeHTML = `
      <div class="welcome-message">
        <div class="chatbot-avatar">🤖</div>
        <h4>Xin chào! Tôi là trợ lý AI</h4>
        <p>Tôi có thể giúp bạn tìm phòng trọ phù hợp, tư vấn về dịch vụ và trả lời các câu hỏi thường gặp. Hãy đặt câu hỏi cho tôi nhé!</p>
      </div>
    `;
    this.messagesContainer.innerHTML = welcomeHTML;

    // Show quick replies
    this.showQuickReplies([
      'Tìm phòng trọ giá rẻ',
      'Hướng dẫn đăng tin',
      'Chính sách thanh toán',
      'Liên hệ hỗ trợ'
    ]);
  }

  showQuickReplies(replies) {
    const quickRepliesContainer = document.getElementById('quickReplies');
    quickRepliesContainer.innerHTML = '';
    
    replies.forEach(reply => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply-btn';
      btn.textContent = reply;
      quickRepliesContainer.appendChild(btn);
    });
  }

  async sendMessage() {
    const message = this.inputField.value.trim();
    
    if (!message || this.isTyping) return;

    // Add user message to UI
    this.addMessage(message, 'user');
    
    // Clear input
    this.inputField.value = '';

    // Hide quick replies after first message
    if (this.conversationHistory.length === 0) {
      document.getElementById('quickReplies').innerHTML = '';
    }

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Send to API
      const response = await this.callChatAPI(message);
      
      // Hide typing indicator
      this.hideTypingIndicator();

      // Add bot response
      this.addMessage(response, 'bot');

    } catch (error) {
      this.hideTypingIndicator();
      this.showError('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.');
      console.error('Chatbot error:', error);
    }
  }

  async sendQuickReply(message) {
    this.inputField.value = message;
    await this.sendMessage();
  }

  async callChatAPI(message) {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        history: this.conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error('API call failed');
    }

    const data = await response.json();
    
    // Save to conversation history
    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });
    this.conversationHistory.push({
      role: 'model',
      parts: [{ text: data.reply }]
    });

    this.saveConversationHistory();

    return data.reply;
  }

  addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const time = new Date().toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const avatar = sender === 'user' ? '👤' : '🤖';

    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-bubble">${this.formatMessage(text)}</div>
        <div class="message-time">${time}</div>
      </div>
    `;

    // Remove welcome message if exists
    const welcomeMsg = this.messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
      welcomeMsg.remove();
    }

    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  formatMessage(text) {
    // Check if text is undefined or null
    if (!text) {
      return '';
    }

    // Convert to string if needed
    text = String(text);

    // Convert URLs to links
    text = text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank">$1</a>'
    );

    // Convert line breaks
    text = text.replace(/\n/g, '<br>');

    // Convert bold text **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert italic text *text*
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    return text;
  }

  showTypingIndicator() {
    this.isTyping = true;
    document.getElementById('typingIndicator').classList.add('active');
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.isTyping = false;
    document.getElementById('typingIndicator').classList.remove('active');
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    `;
    this.messagesContainer.appendChild(errorDiv);
    this.scrollToBottom();

    // Remove error after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
  }

  showNotificationBadge() {
    const badge = this.toggleBtn.querySelector('.chatbot-badge');
    if (badge && !this.chatWindow.classList.contains('active')) {
      badge.style.display = 'flex';
    }
  }

  hideNotificationBadge() {
    const badge = this.toggleBtn.querySelector('.chatbot-badge');
    if (badge) {
      badge.style.display = 'none';
    }
  }

  saveConversationHistory() {
    try {
      localStorage.setItem('chatbot_history', JSON.stringify(this.conversationHistory));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }

  loadConversationHistory() {
    try {
      const saved = localStorage.getItem('chatbot_history');
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      this.conversationHistory = [];
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    localStorage.removeItem('chatbot_history');
    this.messagesContainer.innerHTML = '';
    this.showWelcomeMessage();
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new Chatbot();
});
