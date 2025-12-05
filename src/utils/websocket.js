import { showToast } from './toast'

class WebSocketManager {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.listeners = new Map()
    this.isConnecting = false
    this.isConnected = false
  }

  // 连接WebSocket
  connect(token) {
    if (this.isConnecting || (this.isConnected && this.ws?.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    
    // 构建WebSocket URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = import.meta.env.VITE_WS_URL || window.location.host
    const wsUrl = `${wsProtocol}//${wsHost}/api/chat/ws?token=${token}`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket连接成功')
        this.isConnected = true
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.emit('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('解析消息失败:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
        this.isConnecting = false
        this.emit('error', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket连接关闭')
        this.isConnected = false
        this.isConnecting = false
        this.emit('disconnected')
        
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
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      this.isConnecting = false
      showToast('连接失败', 'error')
    }
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

  // 发送消息
  sendMessage(content) {
    if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) {
      showToast('连接未建立，请稍后重试', 'warning')
      return false
    }

    try {
      const message = {
        type: 'message',
        payload: {
          content: content.trim()
        }
      }
      this.ws.send(JSON.stringify(message))
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
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.isConnecting = false
    this.listeners.clear()
    this.reconnectAttempts = this.maxReconnectAttempts // 阻止自动重连
  }

  // 获取连接状态
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      readyState: this.ws?.readyState
    }
  }
}

// 单例模式
export const wsManager = new WebSocketManager()

