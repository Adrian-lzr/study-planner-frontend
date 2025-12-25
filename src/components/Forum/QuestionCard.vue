<template>
  <div class="question-card card mb-3">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1">
          <h5 class="card-title mb-2">
            <router-link :to="`/forum/question/${question.id}`" class="text-decoration-none">
              {{ question.title }}
            </router-link>
          </h5>
          <p class="card-text text-muted mb-2" v-if="question.content">
            {{ truncateContent(question.content) }}
          </p>
          <div class="d-flex flex-wrap gap-2 mb-2" v-if="question.topics && question.topics.length > 0">
            <TopicTag 
              v-for="topic in question.topics" 
              :key="topic.id" 
              :topic="topic"
            />
          </div>
          <div class="d-flex align-items-center text-muted small">
            <span class="me-3">
              <i class="bi bi-person"></i>
              {{ question.author?.username || $t('forum.questionCard.anonymousUser') }}
            </span>
            <span class="me-3">
              <i class="bi bi-clock"></i>
              {{ formatTime(question.created_at) }}
            </span>
            <span class="me-3">
              <i class="bi bi-chat-dots"></i>
              {{ question.answer_count || 0 }} {{ $t('forum.questionCard.answers') }}
            </span>
            <span class="me-3">
              <i class="bi bi-eye"></i>
              {{ question.view_count || 0 }} {{ $t('forum.questionCard.views') }}
            </span>
            <span v-if="question.follow_count" class="me-3">
              <i class="bi bi-heart"></i>
              {{ question.follow_count }} {{ $t('forum.questionCard.follows') }}
            </span>
            <span v-if="question.favorite_count" class="me-3">
              <i class="bi bi-star"></i>
              {{ question.favorite_count }} {{ $t('forum.questionCard.favorites') }}
            </span>
            <button 
              v-if="userStore.isLoggedIn"
              class="btn btn-sm btn-link p-0 text-decoration-none me-2"
              @click="handleFavorite"
              :disabled="favoriting"
              :title="$t('forum.questionCard.favorite')"
            >
              <i class="bi" :class="question.is_favorited ? 'bi-star-fill text-warning' : 'bi-star'"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TopicTag from './TopicTag.vue'
import { formatTime } from '../../utils/format'
import { useUserStore } from '../../stores/user'
import { useForumStore } from '../../stores/forum'
import { showToast } from '../../utils/toast'

const { t } = useI18n()

const props = defineProps({
  question: {
    type: Object,
    required: true
  }
})

const userStore = useUserStore()
const forumStore = useForumStore()
const favoriting = ref(false)

function truncateContent(content) {
  if (!content) return ''
  // 移除 Markdown 标记
  const text = content.replace(/[#*`\[\]()]/g, '').trim()
  return text.length > 150 ? text.substring(0, 150) + '...' : text
}

async function handleFavorite(e) {
  e.stopPropagation()
  if (!userStore.isLoggedIn) {
    showToast(t('auth.loginRequired'), 'warning')
    return
  }
  
  if (favoriting.value) return
  favoriting.value = true
  try {
    await forumStore.favoriteQuestion(props.question.id)
  } finally {
    favoriting.value = false
  }
}
</script>

<style scoped>
.question-card {
  transition: box-shadow 0.2s;
}

.question-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-title a {
  color: #1a1a1a;
}

.card-title a:hover {
  color: #1890ff;
}
</style>

