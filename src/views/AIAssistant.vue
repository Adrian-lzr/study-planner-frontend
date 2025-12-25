<template>
  <div>
    <Navbar />
    
    <main class="container my-5">
      <div class="row justify-content-center">
        <div class="col-md-10">
          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0"><i class="bi bi-robot"></i> {{ $t('aiAssistant.aiAssistant') }}</h5>
              <small>{{ $t('aiAssistant.subtitle') }}</small>
            </div>
            <div class="card-body">
              <!-- 聊天消息容器 -->
              <div class="chat-container" ref="chatContainer">
                <div
                  v-for="(msg, index) in messages"
                  :key="index"
                  :class="['chat-message', msg.role === 'user' ? 'user' : 'ai', 'd-flex']"
                  :style="msg.role === 'user' ? 'justify-content: flex-end' : ''"
                >
                  <div>
                    <div v-if="msg.role === 'assistant'" class="small text-muted mb-1">
                      <i class="bi bi-robot"></i> {{ $t('aiAssistant.aiAssistant') }}
                    </div>
                    <div 
                      v-if="msg.role === 'assistant'"
                      class="ai-response-content markdown-content"
                      v-html="renderMarkdown(msg.content)"
                    ></div>
                    <div v-else>{{ msg.content }}</div>
                  </div>
                </div>
                
                <!-- 加载中 -->
                <div v-if="loading" class="chat-message ai">
                  <div class="loading-spinner"></div>
                  <span class="ms-2">{{ $t('aiAssistant.thinking') }}</span>
                </div>
              </div>

              <!-- 输入区域 -->
              <form @submit.prevent="sendMessage" class="mt-3">
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    v-model="userInput"
                    :placeholder="$t('aiAssistant.inputPlaceholder')"
                    :disabled="loading"
                    required
                  />
                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="loading || !userInput.trim()"
                  >
                    <i class="bi bi-send"></i> {{ $t('aiAssistant.send') }}
                  </button>
                </div>
              </form>

              <!-- 建议问题 -->
              <div class="mt-3">
                <small class="text-muted">{{ $t('aiAssistant.suggestedQuestions') }}</small>
                <div class="d-flex flex-wrap gap-2 mt-2">
                  <button
                    v-for="(question, index) in suggestedQuestions"
                    :key="index"
                    class="btn btn-sm btn-outline-secondary"
                    @click="askQuestion(question)"
                    :disabled="loading"
                  >
                    {{ question }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { aiApi } from '../api/ai'
import { showToast } from '../utils/toast'
import { renderMarkdown } from '../utils/markdown'

const { t } = useI18n()
const messages = ref([])
const userInput = ref('')
const loading = ref(false)
const chatContainer = ref(null)

const suggestedQuestions = computed(() => [
  t('aiAssistant.question1'),
  t('aiAssistant.question2'),
  t('aiAssistant.question3')
])

onMounted(() => {
  // 加载历史消息
  const savedHistory = localStorage.getItem('aiChatHistory')
  if (savedHistory) {
    messages.value = JSON.parse(savedHistory)
  } else {
    // 添加欢迎消息
    messages.value.push({
      role: 'assistant',
      content: t('aiAssistant.welcome', { defaultValue: '你好！我是你的AI学习助手，有什么可以帮助你的吗？' })
    })
  }
})

async function sendMessage() {
  console.log('sendMessage 被调用')
  console.log('userInput.value:', userInput.value)
  
  if (!userInput.value.trim()) {
    console.log('输入为空，返回')
    return
  }

  const question = userInput.value.trim()
  console.log('准备发送的问题:', question)
  userInput.value = ''

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: question
  })

  scrollToBottom()
  loading.value = true

  try {
    console.log('调用 aiApi.chat，消息数量:', messages.value.length)
    const result = await aiApi.chat(messages.value)
    console.log('收到响应:', result)

    if (result && result.code === 200) {
      // 添加AI回复
      const aiResponse = result.data?.content || result.data || t('aiAssistant.cannotUnderstand')
      console.log('AI回复:', aiResponse)
      messages.value.push({
        role: 'assistant',
        content: aiResponse
      })
      
      // 保存到本地
      localStorage.setItem('aiChatHistory', JSON.stringify(messages.value))
      scrollToBottom()
    } else {
      const errorMsg = result?.message || t('aiAssistant.requestFailed')
      console.error('请求失败:', errorMsg)
      showToast(errorMsg, 'error')
      // 移除用户消息（因为请求失败）
      messages.value.pop()
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    console.error('错误详情:', error.response || error.message)
    showToast(t('errors.network') + ': ' + (error.message || t('errors.unknown')), 'error')
    // 移除用户消息（因为请求失败）
    if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === 'user') {
      messages.value.pop()
    }
  } finally {
    loading.value = false
    console.log('sendMessage 完成')
  }
}

function askQuestion(question) {
  userInput.value = question
  sendMessage()
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.ai-response-content {
  line-height: 1.8;
}

.ai-response-content :deep(h1),
.ai-response-content :deep(h2),
.ai-response-content :deep(h3),
.ai-response-content :deep(h4),
.ai-response-content :deep(h5),
.ai-response-content :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.ai-response-content :deep(p) {
  margin-bottom: 1em;
}

.ai-response-content :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'Courier New', monospace;
}

.ai-response-content :deep(pre) {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
}

.ai-response-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.ai-response-content :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  margin-left: 0;
  color: #666;
  font-style: italic;
}

.ai-response-content :deep(ul),
.ai-response-content :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.ai-response-content :deep(li) {
  margin: 0.5em 0;
}

.ai-response-content :deep(a) {
  color: #1890ff;
  text-decoration: none;
}

.ai-response-content :deep(a:hover) {
  text-decoration: underline;
}

.ai-response-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.ai-response-content :deep(th),
.ai-response-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.ai-response-content :deep(th) {
  background-color: #f5f5f5;
  font-weight: 600;
}
</style>

