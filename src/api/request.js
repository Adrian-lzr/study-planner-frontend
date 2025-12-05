import axios from 'axios'
import { useUserStore } from '../stores/user'
import { showToast } from '../utils/toast'

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api', // Vite 会代理到后端
  timeout: 120000, // 延长超时时间到 2 分钟，适应 LLM 生成
  withCredentials: true, // 携带 cookie
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'  // 添加 Accept 头，解决 406 错误
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    
    // 如果返回的状态码为 401，说明未登录或登录过期
    if (res.code === 401) {
      const userStore = useUserStore()
      userStore.user = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      
      showToast('登录已过期，请重新登录', 'warning')
      
      // 跳转到登录页
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      }
      return Promise.reject(new Error('未登录'))
    }
    
    return res
  },
  error => {
    console.error('响应错误:', error)
    if (error.response) {
      showToast(`请求失败: ${error.response.status}`, 'error')
    } else if (error.request) {
      showToast('网络错误，请检查连接', 'error')
    } else {
      showToast('请求配置错误', 'error')
    }
    return Promise.reject(error)
  }
)

export default request

