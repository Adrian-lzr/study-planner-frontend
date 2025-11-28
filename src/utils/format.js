/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期
 */
export function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 格式化日期时间
 * @param {string} dateString - 日期时间字符串
 * @returns {string} 格式化后的日期时间
 */
export function formatDateTime(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * HTML转义
 * @param {string} text - 需要转义的文本
 * @returns {string} 转义后的文本
 */
export function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 截断文本
 * @param {string} text - 需要截断的文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * 格式化数字，最多保留两位小数
 * @param {number|string} value - 数值
 * @returns {string} 格式化后的数值
 */
export function formatNumber(value) {
  if (value === undefined || value === null || value === '') return '0'
  const num = parseFloat(value)
  if (isNaN(num)) return '0'
  return parseFloat(num.toFixed(2)).toString()
}

