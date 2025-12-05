<template>
  <div class="question-detail">
    <Navbar />
    <div class="container py-4">
      <div class="row">
        <!-- 左侧内容区 -->
        <div class="col-lg-8">
          <!-- 加载状态 -->
          <div v-if="forumStore.loading && !question" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">加载中...</span>
            </div>
          </div>

          <!-- 问题展示区 -->
          <div v-else-if="question" class="card mb-4">
            <div class="card-body">
              <h1 class="card-title mb-3">{{ question.title }}</h1>
              
              <div class="d-flex flex-wrap gap-2 mb-3" v-if="question.topics && question.topics.length > 0">
                <TopicTag 
                  v-for="topic in question.topics" 
                  :key="topic.id" 
                  :topic="topic"
                />
              </div>

              <div class="question-content mb-3" v-html="renderedContent"></div>

              <div class="d-flex align-items-center justify-content-between border-top pt-3">
                <div class="d-flex align-items-center text-muted small">
                  <img 
                    v-if="question.author?.avatar" 
                    :src="question.author.avatar" 
                    class="rounded-circle me-2"
                    style="width: 32px; height: 32px;"
                    alt="avatar"
                  >
                  <div>
                    <router-link 
                      :to="`/forum/user/${question.author?.id}`"
                      class="text-decoration-none"
                    >
                      {{ question.author?.username || '匿名用户' }}
                    </router-link>
                    <span class="ms-2">{{ formatTime(question.created_at) }}</span>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <button 
                    class="btn btn-sm"
                    :class="question.is_followed ? 'btn-primary' : 'btn-outline-primary'"
                    @click="handleFollow"
                  >
                    <i class="bi" :class="question.is_followed ? 'bi-heart-fill' : 'bi-heart'"></i>
                    <span class="ms-1">{{ question.follow_count || 0 }}</span>
                  </button>
                  <button class="btn btn-sm btn-outline-secondary">
                    <i class="bi bi-share"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 回答列表 -->
          <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5>{{ answerCount }} 个回答</h5>
              <div class="btn-group" role="group">
                <button 
                  class="btn btn-sm btn-outline-secondary"
                  :class="{ active: sortBy === 'default' }"
                  @click="changeSort('default')"
                >
                  默认排序
                </button>
                <button 
                  class="btn btn-sm btn-outline-secondary"
                  :class="{ active: sortBy === 'time' }"
                  @click="changeSort('time')"
                >
                  时间排序
                </button>
                <button 
                  class="btn btn-sm btn-outline-secondary"
                  :class="{ active: sortBy === 'vote' }"
                  @click="changeSort('vote')"
                >
                  点赞排序
                </button>
              </div>
            </div>

            <div v-if="answersLoading" class="text-center py-3">
              <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">加载中...</span>
              </div>
            </div>

            <div v-else-if="forumStore.answers.length === 0" class="text-center py-5 text-muted">
              暂无回答，成为第一个回答者吧！
            </div>

            <AnswerCard 
              v-for="answer in forumStore.answers" 
              :key="answer.id"
              :answer="answer"
              @vote="handleVote"
              @collect="handleCollect"
              @edit="handleEditAnswer"
              @delete="handleDeleteAnswer"
              @comment-added="loadAnswers"
            />
          </div>

          <!-- 回答编辑区 -->
          <div class="card" v-if="userStore.isLoggedIn">
            <div class="card-header">
              <h6 class="mb-0">写下你的回答</h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <textarea 
                  class="form-control" 
                  rows="8"
                  v-model="answerContent"
                  placeholder="输入你的回答（支持 Markdown）..."
                ></textarea>
              </div>
              <div class="d-flex justify-content-between">
                <div>
                  <button class="btn btn-sm btn-outline-secondary" @click="showPreview = !showPreview">
                    {{ showPreview ? '编辑' : '预览' }}
                  </button>
                </div>
                <div>
                  <button class="btn btn-outline-secondary me-2" @click="saveDraft">保存草稿</button>
                  <button class="btn btn-primary" @click="submitAnswer" :disabled="!answerContent.trim() || submitting">
                    {{ submitting ? '发布中...' : '发布回答' }}
                  </button>
                </div>
              </div>
              
              <!-- 预览区 -->
              <div v-if="showPreview && answerContent" class="mt-3 p-3 border rounded">
                <div v-html="previewContent"></div>
              </div>
            </div>
          </div>

          <div v-else class="card">
            <div class="card-body text-center">
              <p class="text-muted">请先登录后再回答问题</p>
              <router-link to="/login" class="btn btn-primary">登录</router-link>
            </div>
          </div>
        </div>

        <!-- 右侧边栏 -->
        <div class="col-lg-4">
          <div class="sticky-top" style="top: 20px;">
            <!-- 相关问题 -->
            <div class="card mb-3">
              <div class="card-header">
                <h6 class="mb-0">相关问题</h6>
              </div>
              <div class="card-body">
                <div v-if="relatedQuestions.length === 0" class="text-muted small">
                  暂无相关问题
                </div>
                <div v-else>
                  <div 
                    v-for="q in relatedQuestions" 
                    :key="q.id"
                    class="mb-2"
                  >
                    <router-link 
                      :to="`/forum/question/${q.id}`"
                      class="text-decoration-none small"
                    >
                      {{ q.title }}
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import Footer from '../../components/Footer.vue'
import { renderMarkdown } from '../../utils/markdown'
import { useForumStore } from '../../stores/forum'
import { useUserStore } from '../../stores/user'
import { formatTime } from '../../utils/format'
import { showToast } from '../../utils/toast'
import TopicTag from '../../components/Forum/TopicTag.vue'
import AnswerCard from '../../components/Forum/AnswerCard.vue'

const route = useRoute()
const router = useRouter()
const forumStore = useForumStore()
const userStore = useUserStore()

const question = computed(() => forumStore.currentQuestion)
const answerCount = computed(() => question.value?.answer_count || 0)
const sortBy = ref('default')
const answersLoading = ref(false)
const answerContent = ref('')
const showPreview = ref(false)
const submitting = ref(false)
const relatedQuestions = ref([])

const renderedContent = computed(() => {
  if (!question.value?.content) return ''
  return renderMarkdown(question.value.content)
})

const previewContent = computed(() => {
  if (!answerContent.value) return ''
  return renderMarkdown(answerContent.value)
})

onMounted(() => {
  loadQuestion()
  loadAnswers()
})

watch(() => route.params.id, () => {
  loadQuestion()
  loadAnswers()
})

async function loadQuestion() {
  const id = route.params.id
  if (!id) return
  await forumStore.fetchQuestionDetail(id)
}

async function loadAnswers() {
  const id = route.params.id
  if (!id) return
  
  answersLoading.value = true
  try {
    const params = {}
    if (sortBy.value === 'time') {
      params.sort = 'created_at'
    } else if (sortBy.value === 'vote') {
      params.sort = 'vote_count'
    }
    await forumStore.fetchAnswers(id, params)
  } finally {
    answersLoading.value = false
  }
}

function changeSort(sort) {
  sortBy.value = sort
  loadAnswers()
}

async function handleFollow() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  await forumStore.followQuestion(question.value.id)
}

async function handleVote(answerId) {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  return await forumStore.voteAnswer(answerId)
}

async function handleCollect(answerId) {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  await forumStore.collectAnswer(answerId)
  loadAnswers()
}

function handleEditAnswer(answer) {
  answerContent.value = answer.content
  // 可以滚动到编辑器
}

async function handleDeleteAnswer(answerId) {
  try {
    const { answerApi } = await import('../../api/forum')
    const response = await answerApi.deleteAnswer(answerId)
    if (response.code === 200) {
      showToast('删除成功', 'success')
      loadAnswers()
    } else {
      showToast(response.message || '删除失败', 'error')
    }
  } catch (error) {
    console.error('删除失败:', error)
    showToast('删除失败', 'error')
  }
}

async function submitAnswer() {
  if (!answerContent.value.trim()) return
  
  submitting.value = true
  try {
    const result = await forumStore.createAnswer({
      question_id: question.value.id,
      content: answerContent.value
    })
    
    if (result) {
      answerContent.value = ''
      showPreview.value = false
      loadAnswers()
      // 更新问题回答数
      if (question.value) {
        question.value.answer_count = (question.value.answer_count || 0) + 1
      }
    }
  } finally {
    submitting.value = false
  }
}

function saveDraft() {
  localStorage.setItem(`draft_answer_${question.value.id}`, answerContent.value)
  showToast('草稿已保存', 'success')
}
</script>

<style scoped>
.question-content {
  line-height: 1.8;
}

.question-content :deep(h1),
.question-content :deep(h2),
.question-content :deep(h3) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.question-content :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

.question-content :deep(pre) {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
}

.question-content :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  margin-left: 0;
  color: #666;
}

.btn-group .btn.active {
  background-color: #0d6efd;
  color: white;
}
</style>

