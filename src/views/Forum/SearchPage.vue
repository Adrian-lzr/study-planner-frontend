<template>
  <div class="search-page">
    <Navbar />
    <div class="container py-4">
      <div class="row">
        <div class="col-lg-8">
          <!-- 搜索框 -->
          <div class="card mb-4">
            <div class="card-body">
              <div class="input-group">
                <input 
                  type="text" 
                  class="form-control"
                  v-model="keyword"
                  placeholder="搜索问题、用户、话题..."
                  @keyup.enter="performSearch"
                >
                <button 
                  class="btn btn-primary"
                  @click="performSearch"
                >
                  <i class="bi bi-search"></i> 搜索
                </button>
              </div>
            </div>
          </div>

          <!-- 筛选条件 -->
          <div class="d-flex align-items-center mb-3 gap-3">
            <div class="btn-group" role="group">
              <button 
                class="btn btn-sm btn-outline-secondary"
                :class="{ active: searchType === 'all' }"
                @click="changeType('all')"
              >
                全部
              </button>
              <button 
                class="btn btn-sm btn-outline-secondary"
                :class="{ active: searchType === 'question' }"
                @click="changeType('question')"
              >
                问题
              </button>
              <button 
                class="btn btn-sm btn-outline-secondary"
                :class="{ active: searchType === 'user' }"
                @click="changeType('user')"
              >
                用户
              </button>
              <button 
                class="btn btn-sm btn-outline-secondary"
                :class="{ active: searchType === 'topic' }"
                @click="changeType('topic')"
              >
                话题
              </button>
            </div>
            <div class="btn-group" role="group">
              <button 
                class="btn btn-sm btn-outline-secondary"
                :class="{ active: sortBy === 'relevance' }"
                @click="changeSort('relevance')"
              >
                相关度
              </button>
              <button 
                class="btn btn-sm btn-outline-secondary"
                :class="{ active: sortBy === 'time' }"
                @click="changeSort('time')"
              >
                时间
              </button>
            </div>
          </div>

          <!-- 搜索结果 -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">加载中...</span>
            </div>
          </div>

          <div v-else-if="!hasSearched" class="text-center py-5 text-muted">
            请输入关键词进行搜索
          </div>

          <div v-else-if="hasResults">
            <!-- 问题结果 -->
            <div v-if="(searchType === 'all' || searchType === 'question') && results.questions?.length > 0">
              <h5 class="mb-3">问题 ({{ results.questions.length }})</h5>
              <QuestionCard 
                v-for="question in results.questions" 
                :key="question.id"
                :question="question"
              />
            </div>

            <!-- 用户结果 -->
            <div v-if="(searchType === 'all' || searchType === 'user') && results.users?.length > 0" class="mt-4">
              <h5 class="mb-3">用户 ({{ results.users.length }})</h5>
              <div 
                v-for="user in results.users" 
                :key="user.id"
                class="card mb-3"
              >
                <div class="card-body">
                  <div class="d-flex align-items-center">
                    <img 
                      v-if="user.avatar" 
                      :src="user.avatar" 
                      class="rounded-circle me-3"
                      style="width: 50px; height: 50px;"
                      alt="avatar"
                    >
                    <div class="flex-grow-1">
                      <router-link 
                        :to="`/forum/user/${user.id}`"
                        class="text-decoration-none fw-bold"
                      >
                        {{ user.username }}
                      </router-link>
                      <p class="text-muted small mb-0" v-if="user.bio">
                        {{ user.bio }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 话题结果 -->
            <div v-if="(searchType === 'all' || searchType === 'topic') && results.topics?.length > 0" class="mt-4">
              <h5 class="mb-3">话题 ({{ results.topics.length }})</h5>
              <div 
                v-for="topic in results.topics" 
                :key="topic.id"
                class="card mb-3"
              >
                <div class="card-body">
                  <router-link 
                    :to="`/forum/topic/${topic.id}`"
                    class="text-decoration-none fw-bold"
                  >
                    {{ topic.name }}
                  </router-link>
                  <p class="text-muted small mb-0" v-if="topic.description">
                    {{ topic.description }}
                  </p>
                  <div class="text-muted small mt-2">
                    {{ topic.follow_count || 0 }} 关注 · {{ topic.question_count || 0 }} 问题
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-5 text-muted">
            没有找到相关结果
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import Footer from '../../components/Footer.vue'
import { useForumStore } from '../../stores/forum'
import QuestionCard from '../../components/Forum/QuestionCard.vue'

const route = useRoute()
const forumStore = useForumStore()

const keyword = ref('')
const searchType = ref('all')
const sortBy = ref('relevance')
const loading = ref(false)
const hasSearched = ref(false)

const results = computed(() => forumStore.searchResults || {})
const hasResults = computed(() => {
  const r = results.value
  return (r.questions && r.questions.length > 0) ||
         (r.users && r.users.length > 0) ||
         (r.topics && r.topics.length > 0)
})

onMounted(() => {
  // 从路由参数获取搜索关键词
  if (route.query.keyword) {
    keyword.value = route.query.keyword
    performSearch()
  }
})

function changeType(type) {
  searchType.value = type
  if (hasSearched.value) {
    performSearch()
  }
}

function changeSort(sort) {
  sortBy.value = sort
  if (hasSearched.value) {
    performSearch()
  }
}

async function performSearch() {
  if (!keyword.value.trim()) {
    return
  }
  
  loading.value = true
  hasSearched.value = true
  
  try {
    await forumStore.search({
      keyword: keyword.value,
      type: searchType.value === 'all' ? undefined : searchType.value,
      sort: sortBy.value
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.search-page {
  min-height: calc(100vh - 200px);
}

.btn-group .btn.active {
  background-color: #0d6efd;
  color: white;
}
</style>

