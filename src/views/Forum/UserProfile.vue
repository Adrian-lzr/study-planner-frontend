<template>
  <div class="user-profile">
    <Navbar />
    <div class="container py-4">
      <div class="row">
        <div class="col-lg-8">
          <!-- 用户信息卡片 -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">加载中...</span>
            </div>
          </div>

          <div v-else-if="user" class="card mb-4">
            <div class="card-body">
              <div class="d-flex align-items-start">
                <img 
                  v-if="user.avatar" 
                  :src="user.avatar" 
                  class="rounded-circle me-4"
                  style="width: 80px; height: 80px;"
                  alt="avatar"
                >
                <div class="flex-grow-1">
                  <h3 class="mb-2">{{ user.username }}</h3>
                  <p class="text-muted mb-3" v-if="user.bio">
                    {{ user.bio }}
                  </p>
                  <div class="d-flex align-items-center gap-4 mb-3">
                    <div>
                      <div class="fw-bold">{{ user.follow_count || 0 }}</div>
                      <div class="text-muted small">关注</div>
                    </div>
                    <div>
                      <div class="fw-bold">{{ user.follower_count || 0 }}</div>
                      <div class="text-muted small">粉丝</div>
                    </div>
                    <div>
                      <div class="fw-bold">{{ user.answer_count || 0 }}</div>
                      <div class="text-muted small">回答</div>
                    </div>
                    <div>
                      <div class="fw-bold">{{ user.question_count || 0 }}</div>
                      <div class="text-muted small">提问</div>
                    </div>
                  </div>
                  <button 
                    v-if="userStore.isLoggedIn && userStore.user?.id !== user.id"
                    class="btn"
                    :class="user.is_followed ? 'btn-primary' : 'btn-outline-primary'"
                    @click="handleFollow"
                  >
                    <i class="bi" :class="user.is_followed ? 'bi-person-check-fill' : 'bi-person-plus'"></i>
                    {{ user.is_followed ? '已关注' : '关注' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 内容标签 -->
          <div class="mb-3">
            <div class="btn-group" role="group">
              <button 
                class="btn btn-outline-secondary"
                :class="{ active: activeTab === 'questions' }"
                @click="switchTab('questions')"
              >
                提问
              </button>
              <button 
                class="btn btn-outline-secondary"
                :class="{ active: activeTab === 'answers' }"
                @click="switchTab('answers')"
              >
                回答
              </button>
              <button 
                class="btn btn-outline-secondary"
                :class="{ active: activeTab === 'collections' }"
                @click="switchTab('collections')"
              >
                收藏
              </button>
            </div>
          </div>

          <!-- 内容列表 -->
          <div v-if="contentLoading" class="text-center py-3">
            <div class="spinner-border spinner-border-sm" role="status">
              <span class="visually-hidden">加载中...</span>
            </div>
          </div>

          <div v-else-if="activeTab === 'questions'">
            <div v-if="questions.length === 0" class="text-center py-5 text-muted">
              暂无提问
            </div>
            <QuestionCard 
              v-for="question in questions" 
              :key="question.id"
              :question="question"
            />
          </div>

          <div v-else-if="activeTab === 'answers'">
            <div v-if="answers.length === 0" class="text-center py-5 text-muted">
              暂无回答
            </div>
            <div 
              v-for="answer in answers" 
              :key="answer.id"
              class="card mb-3"
            >
              <div class="card-body">
                <div class="mb-2">
                  <router-link 
                    :to="`/forum/question/${answer.question_id}`"
                    class="text-decoration-none fw-bold"
                  >
                    {{ answer.question?.title }}
                  </router-link>
                </div>
                <div class="text-muted small mb-2" v-html="truncateContent(answer.content)"></div>
                <div class="d-flex align-items-center text-muted small">
                  <span class="me-3">
                    <i class="bi bi-hand-thumbs-up"></i>
                    {{ answer.vote_count || 0 }}
                  </span>
                  <span>
                    <i class="bi bi-clock"></i>
                    {{ formatTime(answer.created_at) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'collections'">
            <div v-if="collections.length === 0" class="text-center py-5 text-muted">
              暂无收藏
            </div>
            <div 
              v-for="item in collections" 
              :key="item.id"
              class="card mb-3"
            >
              <div class="card-body">
                <div class="mb-2">
                  <router-link 
                    :to="`/forum/question/${item.target_id}`"
                    class="text-decoration-none fw-bold"
                  >
                    {{ item.target?.title || '已删除' }}
                  </router-link>
                </div>
                <div class="text-muted small">
                  <i class="bi bi-clock"></i>
                  {{ formatTime(item.created_at) }}
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
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import Footer from '../../components/Footer.vue'
import { renderMarkdown } from '../../utils/markdown'
import { forumUserApi } from '../../api/forum'
import { useUserStore } from '../../stores/user'
import { useForumStore } from '../../stores/forum'
import { formatTime } from '../../utils/format'
import { showToast } from '../../utils/toast'
import QuestionCard from '../../components/Forum/QuestionCard.vue'

const route = useRoute()
const userStore = useUserStore()
const forumStore = useForumStore()

const user = ref(null)
const loading = ref(false)
const activeTab = ref('questions')
const questions = ref([])
const answers = ref([])
const collections = ref([])
const contentLoading = ref(false)

onMounted(() => {
  loadUser()
  loadContent()
})

watch(() => route.params.id, () => {
  loadUser()
  loadContent()
})

watch(activeTab, () => {
  loadContent()
})

async function loadUser() {
  const id = route.params.id
  if (!id) return
  
  loading.value = true
  try {
    const response = await forumUserApi.getUserInfo(id)
    if (response.code === 200) {
      user.value = response.data
    } else {
      showToast(response.message || '获取用户信息失败', 'error')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    showToast('获取用户信息失败', 'error')
  } finally {
    loading.value = false
  }
}

async function loadContent() {
  const id = route.params.id
  if (!id) return
  
  contentLoading.value = true
  try {
    if (activeTab.value === 'questions') {
      const response = await forumUserApi.getUserQuestions(id)
      if (response.code === 200) {
        questions.value = response.data || []
      }
    } else if (activeTab.value === 'answers') {
      const response = await forumUserApi.getUserAnswers(id)
      if (response.code === 200) {
        answers.value = response.data || []
      }
    } else if (activeTab.value === 'collections') {
      const response = await forumUserApi.getUserCollections(id)
      if (response.code === 200) {
        collections.value = response.data || []
      }
    }
  } catch (error) {
    console.error('获取内容失败:', error)
  } finally {
    contentLoading.value = false
  }
}

function switchTab(tab) {
  activeTab.value = tab
}

async function handleFollow() {
  if (!userStore.isLoggedIn) {
    showToast('请先登录', 'warning')
    return
  }
  
  await forumStore.followUser(user.value.id)
  // 更新本地状态
  if (user.value) {
    user.value.is_followed = !user.value.is_followed
    user.value.follower_count = user.value.is_followed 
      ? (user.value.follower_count || 0) + 1 
      : Math.max(0, (user.value.follower_count || 0) - 1)
  }
}

function truncateContent(content) {
  if (!content) return ''
  const text = content.replace(/[#*`\[\]()]/g, '').trim()
  const truncated = text.length > 200 ? text.substring(0, 200) + '...' : text
  return renderMarkdown(truncated)
}
</script>

<style scoped>
.user-profile {
  min-height: calc(100vh - 200px);
}

.btn-group .btn.active {
  background-color: #0d6efd;
  color: white;
}
</style>

