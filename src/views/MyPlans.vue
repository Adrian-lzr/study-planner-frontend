<template>
  <div class="d-flex flex-column min-vh-100">
    <Navbar />
    
    <div class="container my-5 flex-grow-1">
      <!-- 页面标题 -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2><i class="bi bi-journal-text"></i> 我的学习计划</h2>
        <router-link to="/create-plan" class="btn btn-primary">
          <i class="bi bi-plus-lg"></i> 创建新计划
        </router-link>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">正在加载您的计划...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="plans.length === 0" class="empty-state">
        <i class="bi bi-journal-x"></i>
        <h4>还没有学习计划</h4>
        <p class="text-muted">创建您的第一个智能学习计划，让AI帮您规划学习路径</p>
        <router-link to="/create-plan" class="btn btn-primary btn-lg mt-3">
          <i class="bi bi-plus-lg"></i> 创建计划
        </router-link>
      </div>

      <!-- 计划列表 -->
      <div v-else class="row">
        <div v-for="plan in plans" :key="plan.id" class="col-md-6 col-lg-4 mb-4">
          <div class="card plan-card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="card-title mb-0">{{ plan.subject || plan.title }}</h5>
                <span :class="['badge', getStatusClass(plan.status)]">
                  {{ getStatusText(plan.status) }}
                </span>
              </div>
              <p class="card-text text-muted small">
                <i class="bi bi-calendar"></i> {{ formatDate(plan.createTime) }}
                <span class="ms-2"><i class="bi bi-clock"></i> {{ formatNumber(plan.duration || plan.totalDays || 0) }}天</span>
              </p>
              <div class="mb-3">
                <div class="d-flex justify-content-between small mb-1">
                  <span>学习进度</span>
                  <span>{{ formatNumber(plan.progress || 0) }}%</span>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-success" :style="{ width: (plan.progress || 0) + '%' }"></div>
                </div>
              </div>
              <p class="card-text small">{{ truncateText(plan.goal || '暂无目标描述', 80) }}</p>
            </div>
            <div class="card-footer bg-transparent">
              <button class="btn btn-sm btn-outline-primary me-2" @click="viewDetail(plan.id)">
                <i class="bi bi-eye"></i> 查看详情
              </button>
              <button class="btn btn-sm btn-outline-secondary me-2" @click="openEditModal(plan)">
                <i class="bi bi-pencil"></i> 编辑
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="deletePlan(plan.id)">
                <i class="bi bi-trash"></i> 删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal fade" id="editPlanModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">编辑计划</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="planTitle" class="form-label">计划名称</label>
              <input type="text" class="form-control" id="planTitle" v-model="editingPlan.title">
            </div>
            <div class="mb-3">
              <label for="planGoal" class="form-label">学习目标</label>
              <textarea class="form-control" id="planGoal" rows="3" v-model="editingPlan.goal"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
            <button type="button" class="btn btn-primary" @click="savePlan">保存</button>
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Modal } from 'bootstrap'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { planApi } from '../api/plan'
import { showToast } from '../utils/toast'
import { formatDate, truncateText, formatNumber } from '../utils/format'

const router = useRouter()
const loading = ref(true)
const plans = ref([])
const editingPlan = ref({ id: null, title: '', goal: '' })
let editModalInstance = null

onMounted(() => {
  loadPlans()
  editModalInstance = new Modal(document.getElementById('editPlanModal'))
})

function openEditModal(plan) {
  editingPlan.value = { ...plan }
  editModalInstance.show()
}

async function savePlan() {
  try {
    const result = await planApi.updatePlan(editingPlan.value.id, {
      title: editingPlan.value.title,
      goal: editingPlan.value.goal
    })
    if (result && result.code === 200) {
      showToast('计划更新成功', 'success')
      editModalInstance.hide()
      loadPlans()
    } else {
      showToast(result?.message || '更新失败', 'error')
    }
  } catch (error) {
    console.error('更新失败:', error)
    showToast('更新失败', 'error')
  }
}

async function loadPlans() {
  loading.value = true
  
  try {
    const result = await planApi.getPlans()
    if (result && result.code === 200) {
      plans.value = result.data || []
    }
  } catch (error) {
    console.error('加载计划失败:', error)
    showToast('加载失败', 'error')
  } finally {
    loading.value = false
  }
}

function getStatusClass(status) {
  const map = {
    'active': 'bg-success',
    '进行中': 'bg-success',
    'completed': 'bg-info',
    '已完成': 'bg-info',
    'paused': 'bg-warning',
    '已暂停': 'bg-warning'
  }
  return map[status] || 'bg-secondary'
}

function getStatusText(status) {
  const map = {
    'active': '进行中',
    'completed': '已完成',
    'paused': '已暂停'
  }
  return map[status] || status
}

async function viewDetail(planId) {
  router.push(`/my-plans/${planId}`)
}

async function deletePlan(planId) {
  if (!confirm('确定要删除这个计划吗？此操作不可撤销。')) {
    return
  }

  try {
    const result = await planApi.deletePlan(planId)
    if (result && result.code === 200) {
      showToast('计划已删除', 'success')
      loadPlans()
    } else {
      showToast(result?.message || '删除失败', 'error')
    }
  } catch (error) {
    console.error('删除失败:', error)
    showToast('删除失败', 'error')
  }
}
</script>