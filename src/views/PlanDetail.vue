<template>
  <div>
    <Navbar />
    
    <div class="container my-5">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">{{ $t('planDetail.loading') }}</p>
      </div>

      <div v-else-if="!plan" class="text-center py-5">
        <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
        <p class="mt-3">{{ $t('planDetail.notFound') }}</p>
        <button class="btn btn-primary" @click="router.push('/my-plans')">{{ $t('planDetail.returnToList') }}</button>
      </div>

      <div v-else>
        <!-- 计划头部信息 -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h2 class="card-title mb-2">{{ plan.title }}</h2>
                <p class="text-muted mb-2">
                  <span class="badge bg-primary me-2">{{ plan.level }}</span>
                  <span class="badge bg-info me-2">{{ plan.totalDays }}{{ $t('planDetail.day') }}</span>
                  <span class="badge bg-secondary">{{ formatNumber(plan.dailyHours) }}{{ $t('planDetail.hoursPerDay') }}</span>
                </p>
                <p class="card-text">{{ plan.goal }}</p>
              </div>
              <div class="text-end">
                <div class="mb-2">
                  <span :class="['badge', getStatusClass(plan.status)]" class="fs-6">
                    {{ plan.status }}
                  </span>
                </div>
                <div class="progress" style="width: 150px; height: 10px;">
                  <div class="progress-bar bg-success" :style="{ width: progress + '%' }"></div>
                </div>
                <small class="text-muted">{{ $t('planDetail.progress', { progress: formatNumber(progress) }) }}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- 每日任务列表 -->
        <div class="row">
          <div class="col-md-8">
            <h4 class="mb-3">{{ $t('planDetail.dailyTasks') }}</h4>
            <div class="accordion" id="planAccordion">
              <div v-for="detail in details" :key="detail.id" class="accordion-item">
                <h2 class="accordion-header">
                  <button 
                    class="accordion-button" 
                    :class="{ collapsed: detail.dayNumber !== currentDay }"
                    type="button" 
                    data-bs-toggle="collapse" 
                    :data-bs-target="'#collapse' + detail.id"
                  >
                    <div class="d-flex justify-content-between w-100 me-3">
                      <span>{{ $t('planDetail.dayNumber', { day: detail.dayNumber, content: detail.content.substring(0, 30) }) }}...</span>
                      <span v-if="detail.isCompleted" class="badge bg-success">{{ $t('planDetail.completedDays') }}</span>
                    </div>
                  </button>
                </h2>
                <div 
                  :id="'collapse' + detail.id" 
                  class="accordion-collapse collapse" 
                  :class="{ show: detail.dayNumber === currentDay }"
                  data-bs-parent="#planAccordion"
                >
                  <div class="accordion-body">
                    <p><strong>{{ $t('planDetail.learningContent') }}</strong>{{ detail.content }}</p>
                    <p><strong>{{ $t('planDetail.estimatedDuration') }}</strong>{{ formatNumber(detail.duration) }} {{ $t('planDetail.hours') }}</p>
                    <div v-if="detail.resources && detail.resources !== '[]'">
                      <strong>{{ $t('planDetail.recommendedResources') }}</strong>
                      <ul>
                        <li v-for="(res, idx) in parseResources(detail.resources)" :key="idx">
                          {{ res }}
                        </li>
                      </ul>
                    </div>
                    <div class="mt-3 text-end">
                      <button 
                        v-if="!detail.isCompleted" 
                        class="btn btn-success btn-sm"
                        @click="checkIn(detail)"
                      >
                        <i class="bi bi-check-circle"></i> {{ $t('planDetail.checkIn') }}
                      </button>
                      <span v-else class="text-success">
                        <i class="bi bi-check-circle-fill"></i> {{ $t('planDetail.completedAt', { date: formatDate(detail.updateTime) }) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 侧边栏 -->
          <div class="col-md-4">
            <div class="card mb-3">
              <div class="card-header">
                <h5 class="mb-0">{{ $t('planDetail.studyStats') }}</h5>
              </div>
              <div class="card-body">
                <p>{{ $t('planDetail.completedTasks') }}：{{ completedCount }} / {{ details.length }}</p>
                <p>{{ $t('planDetail.remainingTasks') }}：{{ details.length - completedCount }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { planApi } from '../api/plan'
import { checkinApi } from '../api/checkin'
import { showToast } from '../utils/toast'
import { formatDate, formatNumber } from '../utils/format'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const planId = route.params.id

const loading = ref(true)
const plan = ref(null)
const details = ref([])
const progress = ref(0)
const currentDay = ref(1)

const completedCount = computed(() => {
  return details.value.filter(d => d.isCompleted).length
})

onMounted(() => {
  loadPlanDetail()
})

async function loadPlanDetail() {
  loading.value = true
  try {
    const result = await planApi.getPlanDetail(planId)
    if (result && result.code === 200) {
      plan.value = result.data.plan
      details.value = result.data.details
      progress.value = result.data.progress
      
      // 找到第一个未完成的天数作为当前展开天
      const firstUnfinished = details.value.find(d => !d.isCompleted)
      if (firstUnfinished) {
        currentDay.value = firstUnfinished.dayNumber
      }
    } else {
      showToast(result?.message || t('myPlans.loadFailed'), 'error')
    }
  } catch (error) {
    console.error('加载详情失败:', error)
    showToast(t('myPlans.loadFailed'), 'error')
  } finally {
    loading.value = false
  }
}

function parseResources(resourcesStr) {
  try {
    return JSON.parse(resourcesStr)
  } catch (e) {
    return []
  }
}

function getStatusClass(status) {
  const map = {
    '进行中': 'bg-success',
    '已完成': 'bg-info',
    '已暂停': 'bg-warning'
  }
  return map[status] || 'bg-secondary'
}

async function checkIn(detail) {
  try {
    const result = await checkinApi.checkIn({
      planId: plan.value.id,
      detailId: detail.id,
      studyHours: detail.duration,
      note: '完成每日任务'
    })

    if (result && result.code === 200) {
      showToast(t('dashboard.checkInSuccess', { hours: detail.duration }), 'success')
      // 更新本地状态
      detail.isCompleted = 1
      // 重新计算进度
      const completed = details.value.filter(d => d.isCompleted).length
      progress.value = (completed / details.value.length) * 100
    } else {
      showToast(result?.message || t('dashboard.checkInFailed'), 'error')
    }
  } catch (error) {
    console.error('打卡失败:', error)
    showToast(t('dashboard.checkInFailed'), 'error')
  }
}
</script>
