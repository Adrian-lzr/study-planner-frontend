<template>
  <div class="language-switcher">
    <button
      type="button"
      class="btn btn-sm btn-outline-light"
      @click="toggleLanguage"
      :title="currentLocale === 'zh-CN' ? 'Switch to English' : '切换到中文'"
    >
      {{ currentLocale === 'zh-CN' ? 'EN' : '中文' }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const currentLocale = computed(() => locale.value)

function toggleLanguage() {
  const newLocale = currentLocale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
}
</script>

<style scoped>
.language-switcher {
  display: inline-block;
}
</style>


