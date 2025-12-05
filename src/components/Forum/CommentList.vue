<template>
  <div class="comment-list">
    <div v-if="comments.length === 0 && !loading" class="text-muted small">
      暂无评论
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
              回复
            </button>
            <button 
              class="btn btn-sm btn-link p-0 text-decoration-none"
              @click="handleVote(comment)"
            >
              <i class="bi bi-hand-thumbs-up"></i>
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
          placeholder="写下你的评论..."
          @keyup.enter="submitComment"
        >
        <button 
          class="btn btn-sm btn-primary" 
          type="button"
          @click="submitComment"
          :disabled="!newComment.trim()"
        >
          发送
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
      showToast('评论成功', 'success')
      newComment.value = ''
      replyingTo.value = null
      await fetchComments()
      emit('comment-added')
    } else {
      showToast(response.message || '评论失败', 'error')
    }
  } catch (error) {
    console.error('评论失败:', error)
    showToast('评论失败', 'error')
  }
}

function handleReply(comment) {
  replyingTo.value = comment
  // 可以在这里聚焦输入框
}

async function handleVote(comment) {
  try {
    const response = await commentApi.voteComment(comment.id)
    if (response.code === 200) {
      comment.vote_count = response.data.vote_count
    }
  } catch (error) {
    console.error('点赞失败:', error)
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

