<template>
  <div class="my-content">
    <Navbar />
    <div class="container py-4">
      <div class="row">
        <div class="col-lg-10">
          <h3 class="mb-4">我的内容</h3>

          <!-- 标签页 -->
          <ul class="nav nav-tabs mb-4">
            <li class="nav-item">
              <button 
                class="nav-link"
                :class="{ active: activeTab === 'questions' }"
                @click="switchTab('questions')"
              >
                我的提问
              </button>
            </li>
            <li class="nav-item">
              <button 
                class="nav-link"
                :class="{ active: activeTab === 'answers' }"
                @click="switchTab('answers')"
              >
                我的回答
              </button>
            </li>
            <li class="nav-item">
              <button 
                class="nav-link"
                :class="{ active: activeTab === 'collections' }"
                @click="switchTab('collections')"
              >
                我的收藏
              </button>
            </li>
            <li class="nav-item">
              <button 
                class="nav-link"
                :class="{ active: activeTab === 'following' }"
                @click="switchTab('following')"
              >
                我的关注
              </button>
            </li>
          </ul>

          <!-- 内容列表 -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">加载中...</span>
            </div>
          </div>

          <!-- 我的提问 -->
          <div v-else-if="activeTab === 'questions'">
            <div v-if="forumStore.myQuestions.length === 0" class="text-center py-5 text-muted">
              暂无提问
              <div class="mt-3">
                <router-link to="/forum/ask" class="btn btn-primary">去提问</router-link>
              </div>
            </div>
            <div v-else>
              <QuestionCard 
                v-for="question in forumStore.myQuestions" 
                :key="question.id"
                :question="question"
              />
            </div>
          </div>

          <!-- 我的回答 -->
          <div v-else-if="activeTab === 'answers'">
            <div v-if="forumStore.myAnswers.length === 0" class="text-center py-5 text-muted">
              暂无回答
            </div>
            <div v-else>
              <div 
                v-for="answer in forumStore.myAnswers" 
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
                  <div class="d-flex align-items-center justify-content-between">
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
                    <div>
                      <button 
                        class="btn btn-sm btn-outline-primary me-2"
                        @click="editAnswer(answer)"
                      >
                        编辑
                      </button>
                      <button 
                        class="btn btn-sm btn-outline-danger"
                        @click="deleteAnswer(answer.id)"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 我的收藏 -->
          <div v-else-if="activeTab === 'collections'">
            <div v-if="forumStore.myCollections.length === 0" class="text-center py-5 text-muted">
              暂无收藏
            </div>
            <div v-else>
              <div 
                v-for="item in forumStore.myCollections" 
                :key="item.id"
                class="card mb-3"
              >
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <router-link 
                        :to="`/forum/question/${item.target_id}`"
                        class="text-decoration-none fw-bold"
                      >
                        {{ item.target?.title || '已删除' }}
                      </router-link>
                      <div class="text-muted small mt-1">
                        <i class="bi bi-clock"></i>
                        {{ formatTime(item.created_at) }}
                      </div>
                    </div>
                    <button 
                      class="btn btn-sm btn-outline-danger"
                      @click="removeCollection(item.id)"
                    >
                      取消收藏
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 我的关注 -->
          <div v-else-if="activeTab === 'following'">
            <div v-if="following.length === 0" class="text-center py-5 text-muted">
              暂无关注
            </div>
            <div v-else>
              <div class="card mb-3">
                <div class="card-header">
                  <h6 class="mb-0">关注的问题</h6>
                </div>
                <div class="card-body">
                  <div v-if="following.questions?.length === 0" class="text-muted small">
                    暂无关注的问题
                  </div>
                  <QuestionCard 
                    v-for="question in following.questions" 
                    :key="question.id"
                    :question="question"
                  />
                </div>
              </div>
              
              <div class="card mb-3">
                <div class="card-header">
                  <h6 class="mb-0">关注的话题</h6>
                </div>
                <div class="card-body">
                  <div v-if="following.topics?.length === 0" class="text-muted small">
                    暂无关注的话题
                  </div>
                  <div v-else>
                    <div 
                      v-for="topic in following.topics" 
                      :key="topic.id"
                      class="mb-2"
                    >
                      <router-link 
                        :to="`/forum/topic/${topic.id}`"
                        class="text-decoration-none"
                      >
                        {{ topic.name }}
                      </router-link>
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
import { ref, onMounted } from 'vue'
import Navbar from '../../components/Navbar.vue'
import Footer from '../../components/Footer.vue'
import { renderMarkdown } from '../../utils/markdown'
import { useForumStore } from '../../stores/forum'
import { interactionApi, answerApi } from '../../api/forum'
import { formatTime } from '../../utils/format'
import { showToast } from '../../utils/toast'
import QuestionCard from '../../components/Forum/QuestionCard.vue'

const forumStore = useForumStore()

const activeTab = ref('questions')
const loading = ref(false)
const following = ref({
  questions: [],
  topics: []
})

onMounted(() => {
  loadContent()
})

async function loadContent() {
  loading.value = true
  try {
    if (activeTab.value === 'questions') {
      await forumStore.fetchMyQuestions()
    } else if (activeTab.value === 'answers') {
      await forumStore.fetchMyAnswers()
    } else if (activeTab.value === 'collections') {
      await forumStore.fetchMyCollections()
    } else if (activeTab.value === 'following') {
      await loadFollowing()
    }
  } finally {
    loading.value = false
  }
}

async function loadFollowing() {
  try {
    const response = await interactionApi.getMyFollowing()
    if (response.code === 200) {
      following.value = response.data || { questions: [], topics: [] }
    }
  } catch (error) {
    console.error('获取关注列表失败:', error)
  }
}

function switchTab(tab) {
  activeTab.value = tab
  loadContent()
}

function truncateContent(content) {
  if (!content) return ''
  const text = content.replace(/[#*`\[\]()]/g, '').trim()
  const truncated = text.length > 200 ? text.substring(0, 200) + '...' : text
  return renderMarkdown(truncated)
}

function editAnswer(answer) {
  // 跳转到问题详情页，可以在这里实现编辑功能
  window.location.href = `/forum/question/${answer.question_id}`
}

async function deleteAnswer(answerId) {
  if (!confirm('确定要删除这条回答吗？')) return
  
  try {
    const response = await answerApi.deleteAnswer(answerId)
    if (response.code === 200) {
      showToast('删除成功', 'success')
      await forumStore.fetchMyAnswers()
    } else {
      showToast(response.message || '删除失败', 'error')
    }
  } catch (error) {
    console.error('删除失败:', error)
    showToast('删除失败', 'error')
  }
}

async function removeCollection(collectionId) {
  // 这里需要调用取消收藏的API
  showToast('功能开发中', 'info')
}
</script>

<style scoped>
.my-content {
  min-height: calc(100vh - 200px);
}

.nav-tabs .nav-link {
  cursor: pointer;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
}
</style>

