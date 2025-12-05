<template>
  <router-link 
    :to="`/forum/topic/${topic.id}`" 
    class="badge bg-primary text-decoration-none"
    style="cursor: pointer;"
  >
    {{ topic.name }}
    <span v-if="topic.follow_count" class="ms-1">
      ({{ topic.follow_count }})
    </span>
  </router-link>
</template>

<script setup>
defineProps({
  topic: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.badge {
  font-weight: normal;
  padding: 0.35em 0.65em;
}
</style>

