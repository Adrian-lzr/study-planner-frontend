<template>
  <div class="chat-container">
    <div class="chat-header">
      <h4 class="mb-0">
        <i class="bi bi-chat-dots"></i> 学习交流群
      </h4>
      <div class="chat-status">
        <span v-if="chatStore.isConnected" class="badge bg-success">
          <i class="bi bi-circle-fill"></i> 在线 ({{ chatStore.onlineCount }}人)
        </span>
        <span v-else class="badge bg-secondary">
          <i class="bi bi-circle"></i> 连接中...
        </span>
      </div>
    </div>

    <!-- 在线用户列表（侧边栏，可选） -->
    <div v-if="showOnlineUsers" class="online-users-sidebar">
      <div class="sidebar-header">
        <h6>在线用户 ({{ chatStore.onlineCount }})</h6>
        <button class="btn btn-sm btn-link" @click="showOnlineUsers = false">
          <i class="bi bi-x"></i>
        </button>
      </div>
      <div class="user-list">
        <div
          v-for="user in chatStore.onlineUsers"
          :key="user.id"
          class="user-item"
        >
          <i class="bi bi-person-circle"></i>
          <span>{{ user.username }}</span>
        </div>
        <div v-if="chatStore.onlineUsers.length === 0" class="text-muted text-center p-3">
          暂无在线用户
        </div>
      </div>
    </div>

    <!-- 消息区域 -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="chatStore.messages.length === 0" class="empty-state">
        <i class="bi bi-chat-quote"></i>
        <p>还没有消息，快来第一个发言吧！</p>
      </div>
      
      <div
        v-for="message in chatStore.messages"
        :key="message.id"
        class="message-item"
        :class="{ 'message-own': message.is_own }"
      >
        <div class="message-avatar">
          <i class="bi bi-person-circle"></i>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-username">{{ message.username }}</span>
            <span class="message-time">{{ chatStore.formatTime(message.created_at) }}</span>
          </div>
          <div class="message-text">{{ message.content }}</div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-area">
      <div class="input-toolbar">
        <button
          class="btn btn-sm btn-outline-secondary"
          @click="showOnlineUsers = !showOnlineUsers"
          title="在线用户"
        >
          <i class="bi bi-people"></i>
        </button>
      </div>
      <div class="input-wrapper">
        <textarea
          v-model="inputMessage"
          @keydown.enter.exact.prevent="handleSendMessage"
          @keydown.enter.shift.exact="inputMessage += '\n'"
          class="form-control"
          placeholder="输入消息... (Enter发送, Shift+Enter换行)"
          rows="2"
          :disabled="!chatStore.isConnected"
        ></textarea>
        <button
          class="btn btn-primary"
          @click="handleSendMessage"
          :disabled="!chatStore.isConnected || !inputMessage.trim()"
        >
          <i class="bi bi-send"></i> 发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import { showToast } from '../utils/toast'

const chatStore = useChatStore()
const userStore = useUserStore()
const router = useRouter()

const inputMessage = ref('')
const messagesContainer = ref(null)
const showOnlineUsers = ref(false)

// 检查登录状态
if (!userStore.isLoggedIn) {
  showToast('请先登录', 'warning')
  router.push('/login?redirect=/chat')
}

// 初始化连接
onMounted(() => {
  if (userStore.isLoggedIn) {
    chatStore.initConnection()
  }
  
  // 自动滚动到底部
  scrollToBottom()
})

// 清理
onUnmounted(() => {
  // 注意：这里不断开连接，保持全局连接
  // 如果需要在离开页面时断开，可以调用 chatStore.disconnect()
})

// 监听新消息，自动滚动
watch(
  () => chatStore.messages.length,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  }
)

// 发送消息
function handleSendMessage() {
  if (!inputMessage.value.trim()) {
    return
  }

  if (!chatStore.isConnected) {
    showToast('连接未建立，请稍后重试', 'warning')
    return
  }

  const success = chatStore.sendMessage(inputMessage.value)
  if (success) {
    inputMessage.value = ''
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-header h4 {
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chat-status .badge {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
}

.chat-container {
  position: relative;
}

.online-users-sidebar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 250px;
  background: #f8f9fa;
  border-left: 1px solid #dee2e6;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #dee2e6;
}

.sidebar-header h6 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  transition: background 0.2s;
}

.user-item:hover {
  background: #e9ecef;
}

.user-item i {
  font-size: 1.5rem;
  color: #6c757d;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f8f9fa;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.message-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  animation: fadeIn 0.3s ease-in;
}

.message-item.message-own {
  flex-direction: row-reverse;
}

.message-item.message-own .message-content {
  background: #667eea;
  color: white;
}

.message-item.message-own .message-content .message-header {
  color: rgba(255, 255, 255, 0.9);
}

.message-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-avatar i {
  font-size: 2rem;
  color: #6c757d;
}

.message-item.message-own .message-avatar i {
  color: #667eea;
}

.message-content {
  flex: 1;
  max-width: 70%;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.message-username {
  font-weight: 600;
  color: #495057;
}

.message-time {
  color: #6c757d;
  font-size: 0.75rem;
}

.message-text {
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
}

.chat-input-area {
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #dee2e6;
}

.input-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.input-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.input-wrapper textarea {
  flex: 1;
  resize: none;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 0.75rem;
}

.input-wrapper textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.input-wrapper button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  white-space: nowrap;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar,
.user-list::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track,
.user-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-messages::-webkit-scrollbar-thumb,
.user-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover,
.user-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 80px);
    border-radius: 0;
  }

  .online-users-sidebar {
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }

  .message-content {
    max-width: 85%;
  }
}
</style>

