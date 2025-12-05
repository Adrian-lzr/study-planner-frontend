<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
      <router-link class="navbar-brand" to="/">
        <i class="bi bi-book"></i> 智能学习计划生成器
      </router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/forum">论坛</router-link>
          </li>
          <li v-if="isLoggedIn" class="nav-item">
            <router-link class="nav-link" to="/dashboard">仪表盘</router-link>
          </li>
          <li v-if="isLoggedIn" class="nav-item">
            <router-link class="nav-link" to="/create-plan">创建计划</router-link>
          </li>
          <li v-if="isLoggedIn" class="nav-item">
            <router-link class="nav-link" to="/my-plans">我的计划</router-link>
          </li>
          <li v-if="isLoggedIn" class="nav-item">
            <router-link class="nav-link" to="/ai-assistant">AI助手</router-link>
          </li>
          <li v-if="isLoggedIn" class="nav-item">
            <router-link class="nav-link" to="/chat">
              <i class="bi bi-chat-dots"></i> 聊天室
            </router-link>
          </li>
        </ul>
        <ul class="navbar-nav">
          <template v-if="isLoggedIn">
            <li class="nav-item dropdown" ref="dropdownRef">
              <a
                class="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                id="userDropdown"
                role="button"
                @click.prevent="toggleDropdown"
                :class="{ show: isDropdownOpen }"
                aria-expanded="false"
              >
                <img 
                  v-if="user?.avatar" 
                  :src="user.avatar" 
                  class="rounded-circle me-2" 
                  style="width: 24px; height: 24px; object-fit: cover;"
                  alt="Avatar"
                >
                <i v-else class="bi bi-person-circle me-1"></i> 
                {{ user?.username }}
              </a>
              <ul class="dropdown-menu dropdown-menu-end" :class="{ show: isDropdownOpen }">
                <li>
                  <router-link class="dropdown-item" to="/profile" @click="isDropdownOpen = false">
                    <i class="bi bi-person"></i> 个人资料
                  </router-link>
                </li>
                <li>
                  <router-link class="dropdown-item" to="/forum/my-content">
                    <i class="bi bi-file-text"></i> 我的内容
                  </router-link>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a class="dropdown-item" href="#" @click.prevent="handleLogout">
                    <i class="bi bi-box-arrow-right"></i> 退出登录
                  </a>
                </li>
              </ul>
            </li>
          </template>
          <template v-else>
            <li class="nav-item">
              <router-link class="nav-link" to="/login">登录</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/register">注册</router-link>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const user = computed(() => userStore.user)

const isDropdownOpen = ref(false)
const dropdownRef = ref(null)

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function closeDropdown(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

async function handleLogout() {
  isDropdownOpen.value = false
  await userStore.logout()
  router.push('/')
}
</script>

