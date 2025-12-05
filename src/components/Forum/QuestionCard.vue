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
              {{ question.author?.username || '匿名用户' }}
            </span>
            <span class="me-3">
              <i class="bi bi-clock"></i>
              {{ formatTime(question.created_at) }}
            </span>
            <span class="me-3">
              <i class="bi bi-chat-dots"></i>
              {{ question.answer_count || 0 }} 回答
            </span>
            <span class="me-3">
              <i class="bi bi-eye"></i>
              {{ question.view_count || 0 }} 浏览
            </span>
            <span v-if="question.follow_count">
              <i class="bi bi-heart"></i>
              {{ question.follow_count }} 关注
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TopicTag from './TopicTag.vue'
import { formatTime } from '../../utils/format'

const props = defineProps({
  question: {
    type: Object,
    required: true
  }
})

function truncateContent(content) {
  if (!content) return ''
  // 移除 Markdown 标记
  const text = content.replace(/[#*`\[\]()]/g, '').trim()
  return text.length > 150 ? text.substring(0, 150) + '...' : text
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

