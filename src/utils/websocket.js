import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { showToast } from './toast'

class WebSocketManager {
  constructor() {
    this.client = null
    this.subscription = null // 订阅对象
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.listeners = new Map()
    this.isConnecting = false
    this.isConnected = false
    this.lastSentMessage = null // 最后发送的消息key（防重复）
  }

  // 连接WebSocket
  connect(token) {
    if (this.isConnecting || (this.isConnected && this.client?.connected)) {
      return
    }

    this.isConnecting = true
    
    // 构建WebSocket URL
    const wsProtocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const wsHost = import.meta.env.VITE_WS_URL || window.location.host
    // 使用 SockJS，它会自动处理协议
    let wsUrl = `${wsProtocol}//${wsHost}/api/chat/ws`
    
    // 如果有 token，添加到 URL
    if (token) {
      wsUrl += `?token=${token}`
    }

    try {
      // 创建 STOMP 客户端
      this.client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame) => {
          console.log('WebSocket连接成功', frame)
          this.isConnected = true
          this.isConnecting = false
          this.reconnectAttempts = 0
          
          // 先订阅消息，再触发 connected 事件
          this.subscribeToMessages()
          
          // 延迟一点触发 connected，确保订阅已完成
          setTimeout(() => {
            this.emit('connected')
          }, 100)
        },
        onStompError: (frame) => {
          console.error('STOMP错误:', frame)
          this.isConnecting = false
          this.emit('error', frame)
        },
        onWebSocketClose: () => {
          console.log('WebSocket连接关闭')
          this.isConnected = false
          this.isConnecting = false
          this.emit('disconnected')
        },
        onDisconnect: () => {
          console.log('STOMP断开连接')
          this.isConnected = false
          this.isConnecting = false
          
          // 自动重连
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            setTimeout(() => {
              console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
              this.connect(token)
            }, this.reconnectDelay)
          } else {
            showToast('连接失败，请刷新页面重试', 'error')
          }
        }
      })

      // 激活客户端
      this.client.activate()
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      this.isConnecting = false
      showToast('连接失败', 'error')
    }
  }

  // 订阅消息（防止重复订阅）
  subscribeToMessages() {
    if (!this.client || !this.client.connected) {
      return
    }

    // 检查是否已经订阅过
    if (this.subscription) {
      console.log('已经订阅过消息，跳过重复订阅')
      return
    }

    // 订阅聊天消息
    this.subscription = this.client.subscribe('/topic/chat', (message) => {
      try {
        const data = JSON.parse(message.body)
        this.handleMessage(data)
      } catch (error) {
        console.error('解析消息失败:', error)
      }
    })

    console.log('已订阅 /topic/chat')
  }

  // 处理接收到的消息
  handleMessage(data) {
    const { type, payload } = data

    switch (type) {
      case 'message':
        // 新消息
        this.emit('message', payload)
        break
      case 'user_joined':
        // 用户加入
        this.emit('user_joined', payload)
        break
      case 'user_left':
        // 用户离开
        this.emit('user_left', payload)
        break
      case 'online_users':
        // 在线用户列表
        this.emit('online_users', payload)
        break
      case 'error':
        // 错误消息
        showToast(payload.message || '服务器错误', 'error')
        this.emit('error', payload)
        break
      default:
        console.log('未知消息类型:', type, payload)
    }
  }

  // 发送消息（防止重复发送）
  sendMessage(content) {
    if (!this.isConnected || !this.client?.connected) {
      showToast('连接未建立，请稍后重试', 'warning')
      return false
    }

    // 防止重复发送（使用消息内容+时间戳作为key）
    const trimmedContent = content.trim()
    const messageKey = trimmedContent + '_' + Math.floor(Date.now() / 1000) // 使用秒级时间戳
    if (this.lastSentMessage === messageKey) {
      console.log('检测到重复发送，跳过:', trimmedContent)
      return false
    }

    try {
      const message = {
        type: 'message',
        payload: {
          content: trimmedContent
        }
      }
      
      // 发送到 /app/chat/message（对应后端的 @MessageMapping("/chat/message")）
      this.client.publish({
        destination: '/app/chat/message',
        body: JSON.stringify(message)
      })
      
      // 记录最后发送的消息（2秒内相同内容不重复发送）
      this.lastSentMessage = messageKey
      setTimeout(() => {
        if (this.lastSentMessage === messageKey) {
          this.lastSentMessage = null
        }
      }, 2000)
      
      console.log('消息已发送:', trimmedContent)
      return true
    } catch (error) {
      console.error('发送消息失败:', error)
      showToast('发送失败', 'error')
      return false
    }
  }

  // 订阅事件
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  // 取消订阅
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // 触发事件
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`事件回调错误 (${event}):`, error)
        }
      })
    }
  }

  // 断开连接
  disconnect() {
    // 取消订阅
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    
    if (this.client) {
      this.client.deactivate()
      this.client = null
    }
    this.isConnected = false
    this.isConnecting = false
    this.listeners.clear()
    this.reconnectAttempts = this.maxReconnectAttempts // 阻止自动重连
    this.lastSentMessage = null // 清除最后发送的消息记录
  }

  // 获取连接状态
  getStatus() {
    return {
      isConnected: this.isConnected && this.client?.connected,
      isConnecting: this.isConnecting,
      readyState: this.client?.connected ? 1 : 0
    }
  }
}

// 单例模式
export const wsManager = new WebSocketManager()

