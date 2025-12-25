<template>
  <div class="bg-light" style="min-height: 100vh;">
    <div class="container">
      <div class="row justify-content-center mt-5">
        <div class="col-md-5">
          <div class="card shadow">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <h2><i class="bi bi-book text-primary"></i></h2>
                <h4>{{ $t('auth.register.title') }}</h4>
                <p class="text-muted">{{ $t('auth.register.welcome') }}</p>
              </div>

              <form @submit.prevent="handleRegister">
                <div class="mb-3">
                  <label for="username" class="form-label">{{ $t('auth.register.username') }}</label>
                  <input
                    type="text"
                    class="form-control"
                    id="username"
                    v-model="username"
                    required
                    minlength="3"
                  />
                  <small class="text-muted">{{ $t('common.minLength', { count: 3 }) }}</small>
                </div>
                <div class="mb-3">
                  <label for="email" class="form-label">{{ $t('auth.register.email') }}</label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    v-model="email"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">{{ $t('auth.register.password') }}</label>
                  <input
                    type="password"
                    class="form-control"
                    id="password"
                    v-model="password"
                    required
                    minlength="6"
                  />
                  <small class="text-muted">{{ $t('common.minLength', { count: 6 }) }}</small>
                </div>
                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">{{ $t('auth.register.confirmPassword') }}</label>
                  <input
                    type="password"
                    class="form-control"
                    id="confirmPassword"
                    v-model="confirmPassword"
                    required
                  />
                </div>
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ $t('auth.register.submit') }}
                  </button>
                </div>
              </form>

              <hr class="my-4" />

              <p class="text-center mb-0">
                {{ $t('auth.register.hasAccount') }}<router-link to="/login">{{ $t('auth.register.loginNow') }}</router-link>
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
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { showToast } from '../utils/toast'

const { t } = useI18n()

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    showToast(t('errors.passwordMismatch'), 'error')
    return
  }

  loading.value = true
  
  try {
    const result = await userStore.register(username.value, password.value, email.value)
    
    if (result.success) {
      showToast(t('auth.registerSuccess'), 'success')
      setTimeout(() => {
        router.push('/login')
      }, 1000)
    } else {
      showToast(result.message || t('errors.unknown'), 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

