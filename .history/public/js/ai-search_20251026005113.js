/**
 * ===================================
 * AI SEARCH - Tìm kiếm phòng bằng AI
 * Hội thoại với AI để tìm phòng phù hợp
 * ===================================
 */

class AISearch {
    constructor() {
        this.chatHistory = [];
        this.isSearching = false;
        this.modal = null;
        this.init();
    }

    init() {
        // Lắng nghe sự kiện click nút AI Search
        const aiSearchBtn = document.getElementById('aiSearchBtn');
        if (aiSearchBtn) {
            aiSearchBtn.addEventListener('click', () => this.openModal());
        }
    }

    /**
     * Mở modal AI Search
     */
    openModal() {
        // Tạo modal nếu chưa có
        if (!this.modal) {
            this.createModal();
        }

        // Hiển thị modal
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Focus vào input
        const input = this.modal.querySelector('#aiSearchInput');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }

        // Reset chat nếu chưa có history
        if (this.chatHistory.length === 0) {
            this.addMessage('ai', 'Xin chào! 👋 Tôi là trợ lý tìm kiếm phòng trọ bằng AI. Hãy cho tôi biết bạn đang tìm kiếm loại phòng như thế nào nhé? 🏠');
        }
    }

    /**
     * Đóng modal
     */
    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Reset chat
     */
    resetChat() {
        this.chatHistory = [];
        const messagesContainer = this.modal.querySelector('#aiSearchMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        this.addMessage('ai', 'Xin chào! 👋 Tôi là trợ lý tìm kiếm phòng trọ bằng AI. Hãy cho tôi biết bạn đang tìm kiếm loại phòng như thế nào nhé? 🏠');
    }

    /**
     * Tạo modal HTML
     */
    createModal() {
        const modalHTML = `
            <div id="aiSearchModal" class="ai-search-modal" style="display: none;">
                <div class="ai-search-overlay" onclick="window.aiSearch.closeModal()"></div>
                <div class="ai-search-container">
                    <!-- Header -->
                    <div class="ai-search-header">
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">
                                <i class="fas fa-magic mr-2 text-blue-500"></i>
                                Tìm kiếm bằng AI
                            </h3>
                            <p class="text-sm text-gray-500 mt-1">Hãy nói với tôi về phòng mà bạn mong muốn</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.aiSearch.resetChat()" class="text-gray-500 hover:text-gray-700 transition-colors p-2" title="Bắt đầu lại">
                                <i class="fas fa-redo"></i>
                            </button>
                            <button onclick="window.aiSearch.closeModal()" class="text-gray-500 hover:text-gray-700 transition-colors p-2" title="Đóng">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Messages -->
                    <div id="aiSearchMessages" class="ai-search-messages">
                        <!-- Messages will be added here -->
                    </div>

                    <!-- Input -->
                    <div class="ai-search-input-container">
                        <div class="flex gap-2">
                            <input 
                                type="text" 
                                id="aiSearchInput" 
                                placeholder="Nhập yêu cầu của bạn..."
                                class="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                onkeypress="if(event.key === 'Enter') window.aiSearch.sendMessage()"
                            />
                            <button 
                                onclick="window.aiSearch.sendMessage()" 
                                class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                id="aiSearchSendBtn"
                            >
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        <p class="text-xs text-gray-400 mt-2">
                            <i class="fas fa-lightbulb mr-1"></i>
                            Ví dụ: "Tôi cần tìm phòng trọ giá rẻ gần trường đại học"
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Thêm modal vào body
        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        document.body.appendChild(div.firstElementChild);

        // Lưu reference
        this.modal = document.getElementById('aiSearchModal');

        // Thêm CSS
        this.addStyles();
    }

    /**
     * Thêm CSS cho modal
     */
    addStyles() {
        if (document.getElementById('ai-search-styles')) return;

        const styles = `
            <style id="ai-search-styles">
                .ai-search-modal {
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .ai-search-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                }

                .ai-search-container {
                    position: relative;
                    width: 100%;
                    max-width: 700px;
                    max-height: 90vh;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .ai-search-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .ai-search-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .ai-search-message {
                    display: flex;
                    gap: 12px;
                    animation: fadeIn 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .ai-search-message.user {
                    flex-direction: row-reverse;
                }

                .ai-search-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    font-size: 18px;
                }

                .ai-search-message.ai .ai-search-avatar {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .ai-search-message.user .ai-search-avatar {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                }

                .ai-search-message-content {
                    flex: 1;
                    max-width: 75%;
                }

                .ai-search-message.ai .ai-search-message-content {
                    background: #f3f4f6;
                    color: #1f2937;
                    padding: 12px 16px;
                    border-radius: 12px 12px 12px 4px;
                }

                .ai-search-message.user .ai-search-message-content {
                    background: #3b82f6;
                    color: white;
                    padding: 12px 16px;
                    border-radius: 12px 12px 4px 12px;
                    margin-left: auto;
                }

                .ai-search-typing {
                    display: flex;
                    gap: 4px;
                    padding: 8px;
                }

                .ai-search-typing span {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #9ca3af;
                    animation: typing 1.4s infinite;
                }

                .ai-search-typing span:nth-child(2) { animation-delay: 0.2s; }
                .ai-search-typing span:nth-child(3) { animation-delay: 0.4s; }

                @keyframes typing {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-10px); }
                }

                .ai-search-input-container {
                    padding: 20px 24px;
                    border-top: 1px solid #e5e7eb;
                    background: #fafafa;
                    border-radius: 0 0 16px 16px;
                }

                .ai-search-property-card {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 8px;
                    transition: all 0.2s;
                    cursor: pointer;
                }

                .ai-search-property-card:hover {
                    border-color: #3b82f6;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Thêm message vào chat
     */
    addMessage(role, content) {
        const messagesContainer = this.modal.querySelector('#aiSearchMessages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-search-message ${role}`;
        
        const avatar = role === 'ai' ? '🤖' : '👤';
        
        messageDiv.innerHTML = `
            <div class="ai-search-avatar">${avatar}</div>
            <div class="ai-search-message-content">
                ${content}
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Lưu vào history
        this.chatHistory.push({
            role: role === 'ai' ? 'model' : 'user',
            content: content
        });
    }

    /**
     * Hiển thị typing indicator
     */
    showTyping() {
        const messagesContainer = this.modal.querySelector('#aiSearchMessages');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-search-message ai';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="ai-search-avatar">🤖</div>
            <div class="ai-search-message-content">
                <div class="ai-search-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Ẩn typing indicator
     */
    hideTyping() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * Gửi message
     */
    async sendMessage() {
        const input = this.modal.querySelector('#aiSearchInput');
        const sendBtn = this.modal.querySelector('#aiSearchSendBtn');
        
        if (!input || !input.value.trim() || this.isSearching) return;

        const message = input.value.trim();
        input.value = '';

        // Thêm message của user
        this.addMessage('user', message);

        // Disable input
        this.isSearching = true;
        input.disabled = true;
        sendBtn.disabled = true;

        // Show typing
        this.showTyping();

        try {
            const response = await fetch('/api/ai/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: this.chatHistory.slice(0, -1) // Không gửi message vừa thêm
                })
            });

            const data = await response.json();

            // Hide typing
            this.hideTyping();

            if (data.success) {
                // Thêm response của AI
                this.addMessage('ai', data.data.message);

                // Nếu AI đã hoàn thành tìm kiếm và có properties
                if (data.data.isComplete && data.data.properties && data.data.properties.length > 0) {
                    setTimeout(() => {
                        this.showPropertyResults(data.data.properties);
                    }, 300);
                }
            } else {
                this.addMessage('ai', '😔 Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('AI Search Error:', error);
            this.hideTyping();
            this.addMessage('ai', '😔 Không thể kết nối đến server. Vui lòng thử lại sau!');
        } finally {
            // Enable input
            this.isSearching = false;
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }
}

// Khởi tạo AI Search khi DOM ready
document.addEventListener('DOMContentLoaded', function() {
    window.aiSearch = new AISearch();
    console.log('🔍 AI Search initialized');
});
