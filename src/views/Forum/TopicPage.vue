<template>
  <div class="topic-page">
    <Navbar />
    <div class="container py-4">
      <div class="row">
        <div class="col-lg-8">
          <!-- 话题信息 -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">加载中...</span>
            </div>
          </div>

          <div v-else-if="topic" class="card mb-4">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h2 class="mb-2">{{ topic.name }}</h2>
                  <p class="text-muted mb-3" v-if="topic.description">
                    {{ topic.description }}
                  </p>
                  <div class="d-flex align-items-center text-muted small">
                    <span class="me-3">
                      <i class="bi bi-people"></i>
                      {{ topic.follow_count || 0 }} 关注
                    </span>
                    <span>
                      <i class="bi bi-question-circle"></i>
                      {{ topic.question_count || 0 }} 问题
                    </span>
                  </div>
                </div>
                <button 
                  class="btn"
                  :class="topic.is_followed ? 'btn-primary' : 'btn-outline-primary'"
                  @click="handleFollow"
                  v-if="userStore.isLoggedIn"
                >
                  <i class="bi" :class="topic.is_followed ? 'bi-heart-fill' : 'bi-heart'"></i>
                  {{ topic.is_followed ? '已关注' : '关注' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 问题列表 -->
          <div>
            <h5 class="mb-3">相关问题</h5>
            <div v-if="questionsLoading" class="text-center py-3">
              <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">加载中...</span>
              </div>
            </div>
            <div v-else-if="questions.length === 0" class="text-center py-5 text-muted">
              该话题下暂无问题
            </div>
            <QuestionCard 
              v-for="question in questions" 
              :key="question.id"
              :question="question"
            />
          </div>
        </div>

        <!-- 右侧边栏 -->
        <div class="col-lg-4">
          <div class="sticky-top" style="top: 20px;">
            <!-- 优秀回答者 -->
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0">优秀回答者</h6>
              </div>
              <div class="card-body">
                <div v-if="topAnswerers.length === 0" class="text-muted small">
                  暂无数据
                </div>
                <div v-else>
                  <div 
                    v-for="user in topAnswerers" 
                    :key="user.id"
                    class="d-flex align-items-center mb-3"
                  >
                    <img 
                      v-if="user.avatar" 
                      :src="user.avatar" 
                      class="rounded-circle me-2"
                      style="width: 40px; height: 40px;"
                      alt="avatar"
                    >
                    <div class="flex-grow-1">
                      <router-link 
                        :to="`/forum/user/${user.id}`"
                        class="text-decoration-none fw-bold"
                      >
                        {{ user.username }}
                      </router-link>
                      <div class="text-muted small">
                        {{ user.answer_count || 0 }} 回答
                      </div>
                    </div>
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
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import Footer from '../../components/Footer.vue'
import { topicApi } from '../../api/forum'
import { useUserStore } from '../../stores/user'
import { useForumStore } from '../../stores/forum'
import { showToast } from '../../utils/toast'
import QuestionCard from '../../components/Forum/QuestionCard.vue'

const route = useRoute()
const userStore = useUserStore()
const forumStore = useForumStore()

const topic = ref(null)
const loading = ref(false)
const questions = ref([])
const questionsLoading = ref(false)
const topAnswerers = ref([])

onMounted(() => {
  loadTopic()
  loadQuestions()
})

watch(() => route.params.id, () => {
  loadTopic()
  loadQuestions()
})

async function loadTopic() {
  const id = route.params.id
  if (!id) return
  
  loading.value = true
  try {
    const response = await topicApi.getTopicDetail(id)
    if (response.code === 200) {
      topic.value = response.data
    } else {
      showToast(response.message || '获取话题失败', 'error')
    }
  } catch (error) {
    console.error('获取话题失败:', error)
    showToast('获取话题失败', 'error')
  } finally {
    loading.value = false
  }
}

async function loadQuestions() {
  const id = route.params.id
  if (!id) return
  
  questionsLoading.value = true
  try {
    const response = await topicApi.getTopicQuestions(id)
    if (response.code === 200) {
      questions.value = response.data || []
    }
  } catch (error) {
    console.error('获取问题列表失败:', error)
  } finally {
    questionsLoading.value = false
  }
}

async function handleFollow() {
  if (!userStore.isLoggedIn) {
    showToast('请先登录', 'warning')
    return
  }
  
  await forumStore.followTopic(topic.value.id)
  // 更新本地状态
  if (topic.value) {
    topic.value.is_followed = !topic.value.is_followed
    topic.value.follow_count = topic.value.is_followed 
      ? (topic.value.follow_count || 0) + 1 
      : Math.max(0, (topic.value.follow_count || 0) - 1)
  }
}
</script>

<style scoped>
.topic-page {
  min-height: calc(100vh - 200px);
}
</style>

