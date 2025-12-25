<template>
  <div class="ask-question">
    <Navbar />
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">
              <h4 class="mb-0">{{ $t('forum.askQuestion.title') }}</h4>
            </div>
            <div class="card-body">
              <form @submit.prevent="submitQuestion">
                <!-- 标题 -->
                <div class="mb-3">
                  <label for="title" class="form-label">{{ $t('forum.askQuestion.questionTitle') }}</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="title"
                    v-model="form.title"
                    :placeholder="$t('forum.askQuestion.titlePlaceholder')"
                    required
                  >
                </div>

                <!-- 问题描述 -->
                <div class="mb-3">
                  <label for="content" class="form-label">{{ $t('forum.askQuestion.questionContent') }}</label>
                  <div class="d-flex gap-2 mb-2">
                    <button 
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      @click="showPreview = !showPreview"
                    >
                      {{ showPreview ? $t('common.edit') : $t('common.preview') }}
                    </button>
                  </div>
                  <textarea 
                    class="form-control" 
                    id="content"
                    rows="12"
                    v-model="form.content"
                    :placeholder="$t('forum.askQuestion.contentPlaceholder')"
                    v-if="!showPreview"
                  ></textarea>
                  <div 
                    v-else
                    class="border rounded p-3"
                    style="min-height: 300px;"
                    v-html="previewContent"
                  ></div>
                </div>

                <!-- 话题/标签 -->
                <div class="mb-3">
                  <label class="form-label">{{ $t('forum.askQuestion.selectTopics') }}</label>
                  <div class="d-flex flex-wrap gap-2 mb-2" v-if="selectedTopics.length > 0">
                    <span 
                      v-for="topic in selectedTopics" 
                      :key="topic.id"
                      class="badge bg-primary d-flex align-items-center gap-1 px-3 py-2"
                      style="font-size: 0.9rem;"
                    >
                      <i class="bi bi-check-circle-fill"></i>
                      {{ topic.name }}
                      <button 
                        type="button"
                        class="btn-close btn-close-white ms-1"
                        style="font-size: 0.7rem;"
                        @click="removeTopic(topic.id)"
                        aria-label="移除"
                      ></button>
                    </span>
                  </div>
                  <div v-else class="text-muted small mb-2">
                    <i class="bi bi-info-circle"></i> {{ $t('forum.askQuestion.noTopicsSelected') }}
                  </div>
                  <div class="input-group">
                    <input 
                      type="text" 
                      class="form-control"
                      v-model="topicInput"
                      :placeholder="$t('forum.askQuestion.topicInputPlaceholder')"
                      @keyup.enter="addTopic"
                    >
                    <button 
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="addTopic"
                    >
                      {{ $t('forum.askQuestion.add') }}
                    </button>
                  </div>
                  <div class="mt-2">
                    <small class="text-muted">{{ $t('forum.askQuestion.hotTopics') }}</small>
                    <div class="d-flex flex-wrap gap-1 mt-1">
                      <button 
                        type="button"
                        class="btn btn-sm"
                        :class="selectedTopics.find(t => t.id === topic.id) ? 'btn-primary' : 'btn-outline-primary'"
                        v-for="topic in hotTopics"
                        :key="topic.id"
                        @click="selectTopic(topic)"
                      >
                        <i 
                          class="bi"
                          :class="selectedTopics.find(t => t.id === topic.id) ? 'bi-check-circle-fill' : 'bi-circle'"
                        ></i>
                        {{ topic.name }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 匿名提问 -->
                <div class="mb-3 form-check">
                  <input 
                    type="checkbox" 
                    class="form-check-input" 
                    id="anonymous"
                    v-model="form.anonymous"
                  >
                  <label class="form-check-label" for="anonymous">
                    {{ $t('forum.askQuestion.anonymous') }}
                  </label>
                </div>

                <!-- 操作按钮 -->
                <div class="d-flex justify-content-between">
                  <button 
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="saveDraft"
                  >
                    {{ $t('common.saveDraft') }}
                  </button>
                  <div>
                    <button 
                      type="button"
                      class="btn btn-outline-secondary me-2"
                      @click="$router.back()"
                    >
                      {{ $t('common.cancel') }}
                    </button>
                    <button 
                      type="submit"
                      class="btn btn-primary"
                      :disabled="!form.title.trim() || submitting"
                    >
                      {{ submitting ? $t('forum.askQuestion.submitting') : $t('forum.askQuestion.submit') }}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import Footer from '../../components/Footer.vue'
import { renderMarkdown } from '../../utils/markdown'
import { useForumStore } from '../../stores/forum'
import { showToast } from '../../utils/toast'
import { topicApi } from '../../api/forum'

const { t } = useI18n()
const router = useRouter()
const forumStore = useForumStore()

const form = ref({
  title: '',
  content: '',
  anonymous: false
})

const selectedTopics = ref([])
const topicInput = ref('')
const hotTopics = ref([])
const showPreview = ref(false)
const submitting = ref(false)

const previewContent = computed(() => {
  if (!form.value.content) return ''
  return renderMarkdown(form.value.content)
})

onMounted(() => {
  loadHotTopics()
  loadDraft()
})

async function loadHotTopics() {
  const topics = await forumStore.fetchHotTopics()
  hotTopics.value = topics || []
}

function selectTopic(topic) {
  const existing = selectedTopics.value.find(t => t.id === topic.id)
  if (existing) {
    // 如果已选择，则取消选择
    removeTopic(topic.id)
    showToast(t('forum.askQuestion.topicUnselected') + `: ${topic.name}`, 'info')
  } else {
    // 如果未选择，则添加
    selectedTopics.value.push(topic)
    showToast(t('forum.askQuestion.topicSelected') + `: ${topic.name}`, 'success')
  }
}

async function addTopic() {
  const name = topicInput.value.trim()
  if (!name) {
    showToast(t('forum.askQuestion.pleaseEnterTopicName'), 'warning')
    return
  }
  
  // 检查是否已在已选列表中
  if (selectedTopics.value.find(t => t.name === name)) {
    showToast('该话题已添加', 'warning')
    topicInput.value = ''
    return
  }
  
  try {
    // 调用API创建或获取话题
    const response = await topicApi.createTopic({ name, description: '' })
    if (response.code === 200 && response.data) {
      // 检查是否已存在（可能API返回了已存在的话题）
      const existing = selectedTopics.value.find(t => t.id === response.data.id)
      if (!existing) {
        selectedTopics.value.push(response.data)
        showToast(t('common.success'), 'success')
      } else {
        showToast(t('forum.askQuestion.topicAlreadyAdded'), 'warning')
      }
      topicInput.value = ''
      // 刷新热门话题列表
      loadHotTopics()
    } else {
      // 处理业务错误
      const errorMsg = response.message || '添加话题失败'
      if (errorMsg.includes('已存在')) {
        showToast('该话题已存在，请从热门话题中选择', 'warning')
      } else {
        showToast(errorMsg, 'error')
      }
    }
  } catch (error) {
    console.error('添加话题失败:', error)
    // 处理网络错误或异常
    if (error.response?.data?.message) {
      const errorMsg = error.response.data.message
      if (errorMsg.includes('已存在') || errorMsg.includes('Duplicate')) {
        showToast('该话题已存在，请从热门话题中选择', 'warning')
      } else {
        showToast(errorMsg, 'error')
      }
    } else {
      showToast(t('forum.askQuestion.addTopicFailed') + ': ' + (error.message || t('errors.network')), 'error')
    }
  }
}

function removeTopic(topicId) {
  const topic = selectedTopics.value.find(t => t.id === topicId)
  selectedTopics.value = selectedTopics.value.filter(t => t.id !== topicId)
  if (topic) {
    showToast(t('forum.askQuestion.topicRemoved') + `: ${topic.name}`, 'info')
  }
}

function saveDraft() {
  const draft = {
    title: form.value.title,
    content: form.value.content,
    topics: selectedTopics.value,
    anonymous: form.value.anonymous
  }
  localStorage.setItem('question_draft', JSON.stringify(draft))
  showToast(t('forum.askQuestion.draftSaved'), 'success')
}

function loadDraft() {
  const draft = localStorage.getItem('question_draft')
  if (draft) {
    try {
      const data = JSON.parse(draft)
      form.value.title = data.title || ''
      form.value.content = data.content || ''
      form.value.anonymous = data.anonymous || false
      selectedTopics.value = data.topics || []
    } catch (error) {
      console.error('加载草稿失败:', error)
    }
  }
}

async function submitQuestion() {
  if (!form.value.title.trim()) {
    showToast(t('forum.askQuestion.pleaseEnterTitle'), 'warning')
    return
  }
  
  submitting.value = true
  try {
    const result = await forumStore.createQuestion({
      title: form.value.title,
      content: form.value.content,
      topic_ids: selectedTopics.value.map(t => t.id),
      anonymous: form.value.anonymous
    })
    
    if (result) {
      // 清除草稿
      localStorage.removeItem('question_draft')
      showToast(t('forum.askQuestion.questionPublished'), 'success')
      // 跳转到问题详情页
      router.push(`/forum/question/${result.id}`).then(() => {
        // 触发论坛首页刷新（通过事件或直接调用）
        window.dispatchEvent(new CustomEvent('forum-question-created'))
      })
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.preview-content {
  line-height: 1.8;
}

.preview-content :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

.preview-content :deep(pre) {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
}
</style>

