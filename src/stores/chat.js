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

  // 初始化WebSocket连接
  function initConnection() {
    if (!userStore.isLoggedIn) {
      showToast('请先登录', 'warning')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showToast('未找到登录凭证', 'error')
      return
    }

    // 监听连接状态
    wsManager.on('connected', () => {
      isConnected.value = true
      showToast('已连接到聊天室', 'success')
    })

    wsManager.on('disconnected', () => {
      isConnected.value = false
    })

    // 监听新消息
    wsManager.on('message', (messageData) => {
      addMessage(messageData)
    })

    // 监听用户加入
    wsManager.on('user_joined', (userData) => {
      if (userData.user_id !== userStore.user?.id) {
        showToast(`${userData.username} 加入了聊天室`, 'info')
      }
      updateOnlineUsers(userData.users || [])
    })

    // 监听用户离开
    wsManager.on('user_left', (userData) => {
      if (userData.user_id !== userStore.user?.id) {
        showToast(`${userData.username} 离开了聊天室`, 'info')
      }
      updateOnlineUsers(userData.users || [])
    })

    // 监听在线用户列表
    wsManager.on('online_users', (users) => {
      updateOnlineUsers(users)
    })

    // 连接WebSocket
    wsManager.connect(token)
  }

  // 断开连接
  function disconnect() {
    wsManager.disconnect()
    isConnected.value = false
    messages.value = []
    onlineUsers.value = []
  }

  // 添加消息
  function addMessage(messageData) {
    const message = {
      id: messageData.id || Date.now() + Math.random(),
      user_id: messageData.user_id,
      username: messageData.username,
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

  // 加载历史消息（如果需要）
  async function loadHistoryMessages() {
    // 这个功能需要后端API支持
    // 暂时留空，等后端实现
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

