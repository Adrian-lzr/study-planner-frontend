import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/create-plan',
      name: 'create-plan',
      component: () => import('../views/CreatePlan.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/my-plans',
      name: 'my-plans',
      component: () => import('../views/MyPlans.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/my-plans/:id',
      name: 'plan-detail',
      component: () => import('../views/PlanDetail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ai-assistant',
      name: 'ai-assistant',
      component: () => import('../views/AIAssistant.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 如果路由需要认证
  if (to.meta.requiresAuth) {
    // 如果没有用户信息，尝试获取
    if (!userStore.user) {
      await userStore.checkLoginStatus()
    }
    
    // 检查是否已登录
    if (!userStore.isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }
  
  // 如果已登录且访问登录/注册页，跳转到仪表盘
  if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn) {
    next('/dashboard')
    return
  }
  
  next()
})

export default router

