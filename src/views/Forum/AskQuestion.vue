<template>
  <div class="ask-question">
    <Navbar />
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">
              <h4 class="mb-0">提问</h4>
            </div>
            <div class="card-body">
              <form @submit.prevent="submitQuestion">
                <!-- 标题 -->
                <div class="mb-3">
                  <label for="title" class="form-label">问题标题</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="title"
                    v-model="form.title"
                    placeholder="请输入问题标题"
                    required
                  >
                </div>

                <!-- 问题描述 -->
                <div class="mb-3">
                  <label for="content" class="form-label">问题描述</label>
                  <div class="d-flex gap-2 mb-2">
                    <button 
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      @click="showPreview = !showPreview"
                    >
                      {{ showPreview ? '编辑' : '预览' }}
                    </button>
                  </div>
                  <textarea 
                    class="form-control" 
                    id="content"
                    rows="12"
                    v-model="form.content"
                    placeholder="详细描述你的问题（支持 Markdown）..."
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
                  <label class="form-label">选择话题</label>
                  <div class="d-flex flex-wrap gap-2 mb-2">
                    <span 
                      v-for="topic in selectedTopics" 
                      :key="topic.id"
                      class="badge bg-primary d-flex align-items-center"
                    >
                      {{ topic.name }}
                      <button 
                        type="button"
                        class="btn-close btn-close-white ms-2"
                        @click="removeTopic(topic.id)"
                      ></button>
                    </span>
                  </div>
                  <div class="input-group">
                    <input 
                      type="text" 
                      class="form-control"
                      v-model="topicInput"
                      placeholder="输入话题名称，按回车添加"
                      @keyup.enter="addTopic"
                    >
                    <button 
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="addTopic"
                    >
                      添加
                    </button>
                  </div>
                  <div class="mt-2">
                    <small class="text-muted">热门话题：</small>
                    <div class="d-flex flex-wrap gap-1 mt-1">
                      <button 
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        v-for="topic in hotTopics"
                        :key="topic.id"
                        @click="selectTopic(topic)"
                        v-if="!selectedTopics.find(t => t.id === topic.id)"
                      >
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
                    匿名提问
                  </label>
                </div>

                <!-- 操作按钮 -->
                <div class="d-flex justify-content-between">
                  <button 
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="saveDraft"
                  >
                    保存草稿
                  </button>
                  <div>
                    <button 
                      type="button"
                      class="btn btn-outline-secondary me-2"
                      @click="$router.back()"
                    >
                      取消
                    </button>
                    <button 
                      type="submit"
                      class="btn btn-primary"
                      :disabled="!form.title.trim() || submitting"
                    >
                      {{ submitting ? '发布中...' : '发布问题' }}
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
import { useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import Footer from '../../components/Footer.vue'
import { renderMarkdown } from '../../utils/markdown'
import { useForumStore } from '../../stores/forum'
import { showToast } from '../../utils/toast'

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
  if (!selectedTopics.value.find(t => t.id === topic.id)) {
    selectedTopics.value.push(topic)
  }
}

function addTopic() {
  const name = topicInput.value.trim()
  if (!name) return
  
  // 检查是否已存在
  if (selectedTopics.value.find(t => t.name === name)) {
    showToast('该话题已添加', 'warning')
    topicInput.value = ''
    return
  }
  
  // 创建新话题对象（实际应该调用API创建）
  selectedTopics.value.push({
    id: Date.now(), // 临时ID
    name: name,
    follow_count: 0
  })
  
  topicInput.value = ''
}

function removeTopic(topicId) {
  selectedTopics.value = selectedTopics.value.filter(t => t.id !== topicId)
}

function saveDraft() {
  const draft = {
    title: form.value.title,
    content: form.value.content,
    topics: selectedTopics.value,
    anonymous: form.value.anonymous
  }
  localStorage.setItem('question_draft', JSON.stringify(draft))
  showToast('草稿已保存', 'success')
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
    showToast('请输入问题标题', 'warning')
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
      // 跳转到问题详情页
      router.push(`/forum/question/${result.id}`)
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

