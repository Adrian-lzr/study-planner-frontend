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
              全部
            </button>
            <button 
              class="btn btn-link text-decoration-none me-3"
              :class="{ 'fw-bold': activeTab === 'following' }"
              @click="switchTab('following')"
              v-if="userStore.isLoggedIn"
            >
              关注
            </button>
            <button 
              class="btn btn-link text-decoration-none me-3"
              :class="{ 'fw-bold': activeTab === 'recommend' }"
              @click="switchTab('recommend')"
            >
              推荐
            </button>
            <button 
              class="btn btn-link text-decoration-none"
              :class="{ 'fw-bold': activeTab === 'hot' }"
              @click="switchTab('hot')"
            >
              热榜
            </button>
            <div class="ms-auto">
              <router-link to="/forum/ask" class="btn btn-primary">
                <i class="bi bi-plus-circle"></i> 提问
              </router-link>
            </div>
          </div>

          <!-- 问题列表 -->
          <div v-if="forumStore.loading" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">加载中...</span>
            </div>
          </div>
          
          <div v-else-if="forumStore.questions.length === 0" class="text-center py-5">
            <p class="text-muted">暂无问题</p>
            <router-link to="/forum/ask" class="btn btn-primary">去提问</router-link>
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
          <div class="sticky-top" style="top: 20px;">
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
                <h6 class="mb-0">学习统计</h6>
              </div>
              <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                  <span>今日提问</span>
                  <span class="fw-bold">{{ stats.todayQuestions }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span>今日回答</span>
                  <span class="fw-bold">{{ stats.todayAnswers }}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span>总问题数</span>
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
import { ref, onMounted, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import Footer from '../../components/Footer.vue'
import { useForumStore } from '../../stores/forum'
import { useUserStore } from '../../stores/user'
import QuestionCard from '../../components/Forum/QuestionCard.vue'

const forumStore = useForumStore()
const userStore = useUserStore()

const activeTab = ref('all')
const hotTopics = ref([])
const stats = ref({
  todayQuestions: 0,
  todayAnswers: 0,
  totalQuestions: 0
})

onMounted(() => {
  loadQuestions()
  loadHotTopics()
})

function switchTab(tab) {
  activeTab.value = tab
  loadQuestions()
}

async function loadQuestions() {
  const params = {}
  if (activeTab.value === 'hot') {
    params.sort = 'hot'
  } else if (activeTab.value === 'recommend') {
    params.sort = 'recommend'
  } else if (activeTab.value === 'following') {
    params.following = true
  }
  
  await forumStore.fetchQuestions(params)
}

async function loadHotTopics() {
  const topics = await forumStore.fetchHotTopics()
  hotTopics.value = topics || []
}
</script>

<style scoped>
.forum-home {
  min-height: calc(100vh - 200px);
}
</style>

