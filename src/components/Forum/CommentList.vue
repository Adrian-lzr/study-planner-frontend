<template>
  <div class="comment-list">
    <div v-if="comments.length === 0 && !loading" class="text-muted small">
      {{ $t('forum.comment.noComments') }}
    </div>
    
    <div v-for="comment in comments" :key="comment.id" class="comment-item mb-2">
      <div class="d-flex align-items-start">
        <div class="flex-grow-1">
          <div class="d-flex align-items-center mb-1">
            <span class="fw-bold small">{{ comment.author?.username || '匿名用户' }}</span>
            <span class="text-muted small ms-2">{{ formatTime(comment.created_at) }}</span>
          </div>
          <p class="mb-1 small">{{ comment.content }}</p>
          <div class="d-flex align-items-center gap-2">
            <button 
              class="btn btn-sm btn-link p-0 text-decoration-none"
              @click="handleReply(comment)"
            >
              {{ $t('forum.comment.reply') }}
            </button>
            <button 
              class="btn btn-sm btn-link p-0 text-decoration-none"
              :class="{ 'text-primary': comment.is_voted }"
              @click="handleVote(comment)"
            >
              <i class="bi" :class="comment.is_voted ? 'bi-heart-fill' : 'bi-heart'"></i>
              {{ comment.vote_count || 0 }}
            </button>
          </div>
          
          <!-- 回复列表 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="ms-3 mt-2">
            <div 
              v-for="reply in comment.replies" 
              :key="reply.id" 
              class="comment-item mb-2"
            >
              <div class="d-flex align-items-start">
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center mb-1">
                    <span class="fw-bold small">{{ reply.author?.username || '匿名用户' }}</span>
                    <span class="text-muted small ms-2">{{ formatTime(reply.created_at) }}</span>
                  </div>
                  <p class="mb-1 small">
                    <span class="text-primary">@{{ reply.parent?.author?.username }}</span>
                    {{ reply.content }}
                  </p>
                  <div class="d-flex align-items-center gap-2">
                    <button 
                      class="btn btn-sm btn-link p-0 text-decoration-none"
                      :class="{ 'text-primary': reply.is_voted }"
                      @click="handleVote(reply)"
                    >
                      <i class="bi" :class="reply.is_voted ? 'bi-heart-fill' : 'bi-heart'"></i>
                      {{ reply.vote_count || 0 }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 评论输入框 -->
    <div class="comment-input mt-3">
      <div class="input-group">
        <input 
          type="text" 
          class="form-control form-control-sm"
          v-model="newComment"
          :placeholder="$t('forum.comment.placeholder')"
          @keyup.enter="submitComment"
        >
        <button 
          class="btn btn-sm btn-primary" 
          type="button"
          @click="submitComment"
          :disabled="!newComment.trim()"
        >
          {{ $t('forum.comment.submit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { commentApi } from '../../api/forum'
import { formatTime } from '../../utils/format'
import { showToast } from '../../utils/toast'

const props = defineProps({
  answerId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['comment-added'])

const comments = ref([])
const loading = ref(false)
const newComment = ref('')
const replyingTo = ref(null)
const voting = ref(null)

onMounted(() => {
  fetchComments()
})

async function fetchComments() {
  try {
    loading.value = true
    const response = await commentApi.getComments({
      answer_id: props.answerId
    })
    if (response.code === 200) {
      comments.value = response.data || []
    }
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    loading.value = false
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return
  
  try {
    const response = await commentApi.createComment({
      answer_id: props.answerId,
      content: newComment.value,
      parent_id: replyingTo.value?.id || null
    })
    
    if (response.code === 200) {
      showToast(t('common.success'), 'success')
      newComment.value = ''
      replyingTo.value = null
      await fetchComments()
      emit('comment-added')
    } else {
      showToast(response.message || t('errors.unknown'), 'error')
    }
  } catch (error) {
    console.error('评论失败:', error)
    showToast(t('errors.unknown'), 'error')
  }
}

function handleReply(comment) {
  replyingTo.value = comment
  // 可以在这里聚焦输入框
}

async function handleVote(comment) {
  if (voting.value === comment.id) return
  
  try {
    voting.value = comment.id
    const response = await commentApi.voteComment(comment.id)
    if (response.code === 200 && response.data) {
      comment.vote_count = response.data.vote_count || comment.vote_count
      comment.is_voted = response.data.is_voted !== undefined ? response.data.is_voted : !comment.is_voted
    } else {
      showToast(response.message || t('errors.unknown'), 'error')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    showToast(t('errors.unknown'), 'error')
  } finally {
    voting.value = null
  }
}
</script>

<style scoped>
.comment-item {
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.comment-input {
  border-top: 1px solid #dee2e6;
  padding-top: 0.5rem;
}
</style>

