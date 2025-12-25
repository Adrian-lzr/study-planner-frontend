import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

// 从localStorage获取保存的语言设置，默认为中文
const savedLocale = localStorage.getItem('locale') || 'zh-CN'

const i18n = createI18n({
  legacy: false, // 使用Composition API模式
  locale: savedLocale,
  fallbackLocale: 'zh-CN',
  globalInjection: true, // 全局注入$t函数
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export default i18n


