<template>
  <div class="bg-light" style="min-height: 100vh;">
    <div class="container">
      <div class="row justify-content-center mt-5">
        <div class="col-md-5">
          <div class="card shadow">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <h2><i class="bi bi-book text-primary"></i></h2>
                <h4>{{ $t('auth.login.title') }}</h4>
                <p class="text-muted">{{ $t('auth.login.welcome') }}</p>
              </div>

              <form @submit.prevent="handleLogin">
                <div class="mb-3">
                  <label for="username" class="form-label">{{ $t('auth.login.username') }}</label>
                  <input
                    type="text"
                    class="form-control"
                    id="username"
                    v-model="username"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">{{ $t('auth.login.password') }}</label>
                  <input
                    type="password"
                    class="form-control"
                    id="password"
                    v-model="password"
                    required
                  />
                </div>
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ $t('auth.login.submit') }}
                  </button>
                </div>
              </form>

              <hr class="my-4" />

              <p class="text-center mb-0">
                {{ $t('auth.login.noAccount') }}<router-link to="/register">{{ $t('auth.login.registerNow') }}</router-link>
              </p>
            </div>
          </div>

          <div class="text-center mt-3">
            <router-link to="/" class="text-muted">
              <i class="bi bi-arrow-left"></i> {{ $t('common.back') }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { showToast } from '../utils/toast'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  
  try {
    const result = await userStore.login(username.value, password.value)
    
    if (result.success) {
      showToast(t('auth.loginSuccess'), 'success')
      
      // 检查是否有重定向URL
      const redirect = route.query.redirect
      setTimeout(() => {
        if (redirect) {
          router.push(redirect)
        } else {
          router.push('/dashboard')
        }
      }, 500)
    } else {
      showToast(result.message || t('errors.unknown'), 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

