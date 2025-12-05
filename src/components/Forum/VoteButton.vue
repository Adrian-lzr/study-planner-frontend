<template>
  <button 
    class="btn btn-sm vote-button"
    :class="{
      'btn-outline-primary': !isVoted,
      'btn-primary': isVoted
    }"
    @click="handleVote"
    :disabled="loading"
  >
    <i class="bi" :class="isVoted ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'"></i>
    <span class="ms-1">{{ voteCount }}</span>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  voteCount: {
    type: Number,
    default: 0
  },
  isVoted: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['vote'])

const loading = ref(false)
const localVoteCount = ref(props.voteCount)
const localIsVoted = ref(props.isVoted)

const voteCount = computed(() => localVoteCount.value)
const isVoted = computed(() => localIsVoted.value)

async function handleVote() {
  if (loading.value) return
  
  loading.value = true
  try {
    const result = await emit('vote')
    if (result) {
      localVoteCount.value = result.vote_count
      localIsVoted.value = result.is_voted
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.vote-button {
  transition: all 0.2s;
}

.vote-button:hover:not(:disabled) {
  transform: scale(1.05);
}
</style>

