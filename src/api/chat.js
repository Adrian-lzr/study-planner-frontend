import request from './request'

// 聊天相关 API
export const chatApi = {
  // 获取历史消息（如果需要）
  getHistoryMessages(params = {}) {
    return request({
      url: '/chat/messages',
      method: 'get',
      params
    })
  },

  // 获取在线用户列表（如果需要HTTP接口）
  getOnlineUsers() {
    return request({
      url: '/chat/online-users',
      method: 'get'
    })
  }
}

