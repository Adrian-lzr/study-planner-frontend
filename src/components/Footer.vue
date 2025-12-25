<template>
  <footer class="bg-dark text-light py-4 mt-5">
    <div class="container text-center">
      <p class="mb-0">{{ $t('footer.copyright') }}</p>
    </div>
  </footer>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

