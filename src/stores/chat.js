import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { wsManager } from '../utils/websocket'
import { useUserStore } from './user'
import { showToast } from '../utils/toast'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export const useChatStore = defineStore('chat', () => {
  const userStore = useUserStore()
  
  // 状态
  const messages = ref([])
  const onlineUsers = ref([])
  const isConnected = ref(false)
  const isLoading = ref(false)

  // 计算属性
  const onlineCount = computed(() => onlineUsers.value.length)

  // 事件监听器引用（用于移除）
  let eventListeners = {
    connected: null,
    disconnected: null,
    message: null,
    user_joined: null,
    user_left: null,
    online_users: null
  }

  // 初始化WebSocket连接
  function initConnection() {
    if (!userStore.isLoggedIn) {
      showToast('请先登录', 'warning')
      return
    }

    // 如果已经连接，先断开旧连接（用户可能切换了账户）
    if (isConnected.value) {
      console.log('用户切换，断开旧连接')
      disconnect()
      // 等待一下再重新连接
      setTimeout(() => {
        doConnect()
      }, 1000)
      return
    }

    doConnect()
  }

  // 执行连接
  function doConnect() {
    // 先移除旧的事件监听器（防止重复注册）
    removeEventListeners()
    
    // 使用 Session 认证，不需要 token
    // 但为了兼容，可以传递一个占位符 token 或用户 ID
    // WebSocket 会通过 cookie/session 自动认证
    const token = userStore.user?.id ? String(userStore.user.id) : ''
    const currentUserId = userStore.user?.id

    console.log('准备连接WebSocket，当前用户ID:', currentUserId)

    // 监听连接状态
    eventListeners.connected = async () => {
      isConnected.value = true
      showToast('已连接到聊天室', 'success')
      // 连接成功后加载历史消息
      await loadHistoryMessages()
    }
    wsManager.on('connected', eventListeners.connected)

    eventListeners.disconnected = () => {
      isConnected.value = false
    }
    wsManager.on('disconnected', eventListeners.disconnected)

    // 监听新消息（群聊接收所有消息）
    eventListeners.message = (messageData) => {
      // 群聊中接收所有消息，但验证消息数据完整性
      if (messageData && messageData.content) {
        console.log('收到消息:', messageData.user_id, messageData.username, messageData.content)
        addMessage(messageData)
      } else {
        console.warn('收到无效消息:', messageData)
      }
    }
    wsManager.on('message', eventListeners.message)

    // 监听用户加入
    eventListeners.user_joined = (userData) => {
      if (userData.user_id !== userStore.user?.id) {
        showToast(`${userData.username} 加入了聊天室`, 'info')
      }
      updateOnlineUsers(userData.users || [])
    }
    wsManager.on('user_joined', eventListeners.user_joined)

    // 监听用户离开
    eventListeners.user_left = (userData) => {
      if (userData.user_id !== userStore.user?.id) {
        showToast(`${userData.username} 离开了聊天室`, 'info')
      }
      updateOnlineUsers(userData.users || [])
    }
    wsManager.on('user_left', eventListeners.user_left)

    // 监听在线用户列表
    eventListeners.online_users = (users) => {
      updateOnlineUsers(users)
    }
    wsManager.on('online_users', eventListeners.online_users)

    // 连接WebSocket
    wsManager.connect(token)
  }

  // 移除事件监听器
  function removeEventListeners() {
    Object.keys(eventListeners).forEach(event => {
      if (eventListeners[event]) {
        wsManager.off(event, eventListeners[event])
        eventListeners[event] = null
      }
    })
  }

  // 断开连接
  function disconnect() {
    removeEventListeners()
    wsManager.disconnect()
    isConnected.value = false
    messages.value = []
    onlineUsers.value = []
  }
  
  // 监听用户变化事件
  if (typeof window !== 'undefined') {
    window.addEventListener('user-changed', () => {
      console.log('检测到用户切换，重新连接WebSocket')
      if (isConnected.value) {
        disconnect()
        setTimeout(() => {
          if (userStore.isLoggedIn) {
            initConnection()
          }
        }, 1000)
      }
    })
    
    window.addEventListener('user-logged-out', () => {
      console.log('用户已登出，断开WebSocket连接')
      disconnect()
    })
  }

  // 添加消息（去重）
  function addMessage(messageData) {
    // 检查消息是否已存在（防止重复）
    const existingMessage = messages.value.find(msg => 
      msg.id === messageData.id || 
      (msg.user_id === messageData.user_id && 
       msg.content === messageData.content && 
       Math.abs(new Date(msg.created_at) - new Date(messageData.created_at || new Date())) < 1000)
    )
    
    if (existingMessage) {
      console.log('消息已存在，跳过:', messageData.id)
      return
    }
    
    const message = {
      id: messageData.id || Date.now() + Math.random(),
      user_id: messageData.user_id,
      username: messageData.username || '未知用户',
      avatar: messageData.avatar || '',
      content: messageData.content,
      created_at: messageData.created_at || new Date().toISOString(),
      is_own: messageData.user_id === userStore.user?.id
    }
    messages.value.push(message)
    
    // 限制消息数量，保留最近500条
    if (messages.value.length > 500) {
      messages.value = messages.value.slice(-500)
    }
  }

  // 更新在线用户列表
  function updateOnlineUsers(users) {
    onlineUsers.value = users || []
  }

  // 发送消息
  function sendMessage(content) {
    if (!content || !content.trim()) {
      return false
    }

    if (!isConnected.value) {
      showToast('连接未建立，请稍后重试', 'warning')
      return false
    }

    const success = wsManager.sendMessage(content)
    if (success) {
      // 消息会在收到服务器响应后通过 addMessage 添加
      // 这里可以添加一个临时消息显示发送中状态
    }
    return success
  }

  // 加载历史消息
  async function loadHistoryMessages() {
    try {
      isLoading.value = true
      const { chatApi } = await import('../api/chat')
      const response = await chatApi.getMessages(1, 50)
      
      if (response.code === 200 && response.data?.list) {
        // 清空现有消息，加载历史消息
        messages.value = []
        const historyMessages = response.data.list
        
        // 将历史消息添加到列表（按时间正序）
        for (const msg of historyMessages) {
          addMessage(msg)
        }
        
        console.log('已加载历史消息:', historyMessages.length, '条')
      }
    } catch (error) {
      console.error('加载历史消息失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 格式化时间
  function formatTime(timestamp) {
    const date = dayjs(timestamp)
    const now = dayjs()
    const diff = now.diff(date, 'minute')

    if (diff < 1) {
      return '刚刚'
    } else if (diff < 60) {
      return `${diff}分钟前`
    } else if (diff < 1440) {
      return date.format('HH:mm')
    } else {
      return date.format('MM-DD HH:mm')
    }
  }

  // 清空消息
  function clearMessages() {
    messages.value = []
  }

  return {
    // 状态
    messages,
    onlineUsers,
    isConnected,
    isLoading,
    onlineCount,
    // 方法
    initConnection,
    disconnect,
    sendMessage,
    loadHistoryMessages,
    formatTime,
    clearMessages
  }
})

