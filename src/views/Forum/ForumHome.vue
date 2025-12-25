<template>
  <div class="forum-home">
    <Navbar />
    <div class="container py-4">
      <div class="row">
        <!-- 左侧内容区 -->
        <div class="col-lg-8">
          <!-- 顶部导航 -->
          <div class="d-flex align-items-center mb-4 border-bottom pb-3">
            <button 
              class="btn btn-link text-decoration-none me-3"
              :class="{ 'fw-bold': activeTab === 'all' }"
              @click="switchTab('all')"
            >
              {{ $t('forum.home') }}
            </button>
            <button 
              class="btn btn-link text-decoration-none me-3"
              :class="{ 'fw-bold': activeTab === 'favorite' }"
              @click="switchTab('favorite')"
              v-if="userStore.isLoggedIn"
            >
              {{ $t('forum.favorite') }}
            </button>
            <button 
              class="btn btn-link text-decoration-none me-3"
              :class="{ 'fw-bold': activeTab === 'recommend' }"
              @click="switchTab('recommend')"
            >
              {{ $t('forum.recommend') }}
            </button>
            <button 
              class="btn btn-link text-decoration-none"
              :class="{ 'fw-bold': activeTab === 'hot' }"
              @click="switchTab('hot')"
            >
              {{ $t('forum.hot') }}
            </button>
            <div class="ms-auto">
              <router-link to="/forum/ask" class="btn btn-primary">
                <i class="bi bi-plus-circle"></i> {{ $t('forum.askQuestion') }}
              </router-link>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="alert alert-danger mb-3">
            <strong>{{ $t('forum.error') }}：</strong>{{ error }}
            <button class="btn btn-sm btn-outline-danger ms-2" @click="error = null; loadQuestions(); loadHotTopics()">{{ $t('forum.retry') }}</button>
          </div>
          
          <!-- 问题列表 -->
          <div v-if="forumStore.loading" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">{{ $t('forum.loading') }}</span>
            </div>
          </div>
          
          <div v-else-if="!forumStore.questions || forumStore.questions.length === 0" class="text-center py-5">
            <p class="text-muted">{{ $t('forum.question.noQuestions') }}</p>
            <router-link to="/forum/ask" class="btn btn-primary">{{ $t('forum.askQuestion') }}</router-link>
          </div>
          
          <div v-else>
            <QuestionCard 
              v-for="question in forumStore.questions" 
              :key="question.id"
              :question="question"
            />
          </div>
        </div>

        <!-- 右侧边栏 -->
        <div class="col-lg-4">
          <div class="sticky-top" style="top: 20px; z-index: 100;">
            <!-- 热门话题 -->
            <div class="card mb-3">
              <div class="card-header">
                <h6 class="mb-0">热门话题</h6>
              </div>
              <div class="card-body">
                <div v-if="hotTopics.length === 0" class="text-muted small">
                  暂无话题
                </div>
                <div v-else>
                  <div 
                    v-for="topic in hotTopics" 
                    :key="topic.id"
                    class="mb-2"
                  >
                    <router-link 
                      :to="`/forum/topic/${topic.id}`"
                      class="text-decoration-none"
                    >
                      {{ topic.name }}
                    </router-link>
                    <span class="text-muted small ms-2">
                      {{ topic.question_count || 0 }} 问题
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 学习统计卡片 -->
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0">{{ $t('dashboard.studyStats') }}</h6>
              </div>
              <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                  <span>{{ $t('forum.user.questions') }}</span>
                  <span class="fw-bold">{{ stats.todayQuestions }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span>{{ $t('forum.user.answers') }}</span>
                  <span class="fw-bold">{{ stats.todayAnswers }}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span>{{ $t('forum.question.noQuestions') }}</span>
                  <span class="fw-bold">{{ stats.totalQuestions }}</span>
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
import { ref, onMounted, onActivated, onErrorCaptured } from 'vue'
import { useI18n } from 'vue-i18n'
import Navbar from '../../components/Navbar.vue'
import Footer from '../../components/Footer.vue'
import { useForumStore } from '../../stores/forum'
import { useUserStore } from '../../stores/user'
import QuestionCard from '../../components/Forum/QuestionCard.vue'

const { t } = useI18n()
const forumStore = useForumStore()
const userStore = useUserStore()

const activeTab = ref('all')
const hotTopics = ref([])
const stats = ref({
  todayQuestions: 0,
  todayAnswers: 0,
  totalQuestions: 0
})
const error = ref(null)

// 捕获组件错误
onErrorCaptured((err, instance, info) => {
  console.error('组件错误:', err, info)
  error.value = err.message
  return false // 阻止错误继续传播
})

onMounted(async () => {
  try {
    console.log('ForumHome 页面加载开始')
    await Promise.all([
      loadQuestions(),
      loadHotTopics()
    ])
    console.log('ForumHome 页面加载完成')
  } catch (err) {
    console.error('ForumHome 页面初始化失败:', err)
    error.value = err.message
  }
  
  // 监听问题创建事件，自动刷新列表
  window.addEventListener('forum-question-created', () => {
    loadQuestions()
    loadHotTopics()
  })
  
  // 监听话题更新事件
  window.addEventListener('topic-updated', () => {
    loadHotTopics()
  })
})

// 当页面激活时刷新（从其他页面返回时，如果使用了keep-alive）
onActivated(() => {
  loadQuestions()
  loadHotTopics()
})


function switchTab(tab) {
  activeTab.value = tab
  loadQuestions()
}

async function loadQuestions() {
  try {
    const params = {}
    if (activeTab.value === 'hot') {
      params.sort = 'hot'
    } else if (activeTab.value === 'recommend') {
      params.sort = 'recommend'
    } else if (activeTab.value === 'favorite') {
      params.favorite = true
    } else if (activeTab.value === 'following') {
      params.following = true
    }
    
    await forumStore.fetchQuestions(params)
  } catch (error) {
    console.error('加载问题列表失败:', error)
  }
}

async function loadHotTopics() {
  try {
    const topics = await forumStore.fetchHotTopics()
    hotTopics.value = topics || []
  } catch (error) {
    console.error('加载热门话题失败:', error)
    hotTopics.value = []
  }
}
</script>

<style scoped>
.forum-home {
  min-height: calc(100vh - 200px);
}
</style>

