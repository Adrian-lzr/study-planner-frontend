<template>
  <div>
    <Navbar />
    
    <main class="container my-4">
      <!-- 欢迎信息 -->
      <div class="row mb-4">
        <div class="col">
          <h4>{{ $t('dashboard.welcomeBack', { name: user?.username }) }}</h4>
          <p class="text-muted">{{ $t('dashboard.motivation') }}</p>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="row g-4 mb-4">
        <div class="col-md-3">
          <div class="card stat-card primary h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">{{ $t('dashboard.activePlans') }}</p>
                  <h3 class="mb-0">{{ stats.activePlans || 0 }}</h3>
                </div>
                <i class="bi bi-journal-text fs-1 text-primary opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card success h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">{{ $t('dashboard.totalCheckIns') }}</p>
                  <h3 class="mb-0">{{ stats.totalDays || 0 }} <small class="text-muted">{{ $t('dashboard.days') }}</small></h3>
                </div>
                <i class="bi bi-calendar-check fs-1 text-success opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card warning h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">{{ $t('dashboard.streakDays') }}</p>
                  <h3 class="mb-0">{{ stats.streakDays || 0 }} <small class="text-muted">{{ $t('dashboard.days') }}</small></h3>
                </div>
                <i class="bi bi-fire fs-1 text-warning opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card info h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">{{ $t('dashboard.totalStudyHours') }}</p>
                  <h3 class="mb-0">{{ formatNumber(stats.totalHours) }} <small class="text-muted">{{ $t('dashboard.hours') }}</small></h3>
                </div>
                <i class="bi bi-clock-history fs-1 text-info opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习进度图表 -->
      <div class="row mb-4">
        <div class="col-12">
          <StudyChart :chart-data="chartData" />
        </div>
      </div>

      <div class="row g-4">
        <!-- 今日任务 -->
        <div class="col-md-8">
          <div class="card today-task h-100">
            <div class="card-body">
              <h5 class="card-title"><i class="bi bi-star-fill"></i> {{ $t('dashboard.todayTask') }}</h5>
              <div v-if="loading" class="text-center py-4">
                <div class="spinner-border text-light" role="status"></div>
              </div>
              <div v-else-if="todayTask">
                <div class="mb-2">
                  <span class="badge bg-light text-dark">{{ $t('dashboard.dayNumber', { day: todayTask.dayNumber }) }}</span>
                </div>
                <p class="mb-3">{{ todayTask.content }}</p>
                <div class="d-flex align-items-center">
                  <span class="me-3"><i class="bi bi-clock"></i> {{ formatNumber(todayTask.duration) }}{{ $t('dashboard.hours') }}</span>
                  <span v-if="todayTask.isCompleted" class="badge bg-success">
                    <i class="bi bi-check"></i> {{ $t('dashboard.completed') }}
                  </span>
                  <span v-else class="badge bg-warning">{{ $t('dashboard.pending') }}</span>
                </div>
              </div>
              <div v-else>
                <p class="mb-0">{{ $t('dashboard.noActivePlans') }}</p>
                <router-link to="/create-plan" class="btn btn-light btn-sm mt-2">{{ $t('dashboard.createPlan') }}</router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-header">
              <h6 class="mb-0"><i class="bi bi-lightning"></i> {{ $t('dashboard.quickActions') }}</h6>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <router-link to="/create-plan" class="btn btn-primary">
                  <i class="bi bi-plus-circle"></i> {{ $t('dashboard.createNewPlan') }}
                </router-link>
                <button
                  class="btn btn-success"
                  :disabled="!todayTask || todayTask.isCompleted"
                  @click="quickCheckIn"
                >
                  <i class="bi bi-check-circle"></i> {{ $t('dashboard.checkInToday') }}
                </button>
                <router-link to="/ai-assistant" class="btn btn-outline-primary">
                  <i class="bi bi-robot"></i> {{ $t('dashboard.askAI') }}
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近计划 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0"><i class="bi bi-journal-bookmark"></i> {{ $t('dashboard.myStudyPlans') }}</h6>
              <router-link to="/my-plans" class="btn btn-sm btn-outline-primary">{{ $t('dashboard.viewAll') }}</router-link>
            </div>
            <div class="card-body">
              <div v-if="plans.length === 0" class="text-center py-4">
                <i class="bi bi-inbox fs-1 text-muted"></i>
                <p class="text-muted mt-2">{{ $t('dashboard.noPlansYet') }}</p>
                <router-link to="/create-plan" class="btn btn-primary">{{ $t('dashboard.createPlan') }}</router-link>
              </div>
              <div v-else>
                <div
                  v-for="plan in plans.slice(0, 3)"
                  :key="plan.id"
                  class="d-flex justify-content-between align-items-center border-bottom py-3"
                >
                  <div>
                    <h6 class="mb-1">{{ plan.title }}</h6>
                    <small class="text-muted">
                      {{ plan.startDate }} ~ {{ plan.endDate }} | {{ $t('dashboard.dailyHours', { hours: formatNumber(plan.dailyHours) }) }}
                    </small>
                  </div>
                  <span
                    :class="['badge', plan.status === t('plan.inProgress') ? 'bg-success' : 'bg-secondary']"
                  >
                    {{ plan.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import StudyChart from '../components/StudyChart.vue'
import { useUserStore } from '../stores/user'
import { planApi } from '../api/plan'
import { checkinApi } from '../api/checkin'
import { showToast } from '../utils/toast'
import { formatNumber } from '../utils/format'

const { t } = useI18n()
const userStore = useUserStore()
const user = computed(() => userStore.user)

const loading = ref(true)
const stats = ref({})
const todayTask = ref(null)
const plans = ref([])
const currentPlanId = ref(null)
// 添加 chartData 响应式变量
const chartData = ref({
  week: { xAxis: [], series: [] },
  month: { xAxis: [], series: [] }
})

onMounted(() => {
  loadDashboard()
})

async function loadDashboard() {
  loading.value = true
  
  try {
    // 加载统计数据
    const statsResult = await checkinApi.getStats()
    if (statsResult && statsResult.code === 200) {
      stats.value = statsResult.data || {}
    }

    // 加载图表数据
    const chartResult = await checkinApi.getChartData()
    if (chartResult && chartResult.code === 200) {
      chartData.value = chartResult.data
    }

    // 加载计划列表
    const plansResult = await planApi.getPlans()
    if (plansResult && plansResult.code === 200) {
      plans.value = plansResult.data || []
      const activePlans = plans.value.filter(p => p.status === t('plan.inProgress'))
      stats.value.activePlans = activePlans.length

      // 加载今日任务
      if (activePlans.length > 0) {
        currentPlanId.value = activePlans[0].id
        await loadTodayTask(activePlans[0].id)
      }
    }
  } catch (error) {
    console.error('加载仪表盘失败:', error)
    showToast(t('dashboard.loadDataFailed'), 'error')
  } finally {
    loading.value = false
  }
}

async function loadTodayTask(planId) {
  try {
    const result = await planApi.getTodayTask(planId)
    if (result && result.code === 200 && result.data) {
      todayTask.value = result.data
    }
  } catch (error) {
    console.error('加载今日任务失败:', error)
  }
}

async function quickCheckIn() {
  if (!todayTask.value || !currentPlanId.value) {
    showToast(t('dashboard.noTaskToCheckIn'), 'warning')
    return
  }

  try {
    const result = await checkinApi.checkIn({
      planId: currentPlanId.value,
      detailId: todayTask.value.id,
      studyHours: todayTask.value.duration || 2
    })

    if (result && result.code === 200) {
      showToast(t('dashboard.checkInSuccess', { hours: todayTask.value.duration }), 'success')
      loadDashboard()
    } else {
      showToast(result?.message || t('dashboard.checkInFailed'), 'error')
    }
  } catch (error) {
    console.error('打卡失败:', error)
    showToast(t('dashboard.checkInFailed'), 'error')
  }
}
</script>

