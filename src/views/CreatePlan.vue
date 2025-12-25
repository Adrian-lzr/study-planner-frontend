<template>
  <div>
    <Navbar />
    
    <main class="container my-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0"><i class="bi bi-magic"></i> {{ $t('createPlan.title') }}</h5>
            </div>
            <div class="card-body p-4">
              <form @submit.prevent="handleSubmit">
                <!-- 学习目标 -->
                <div class="mb-4">
                  <label for="goal" class="form-label fw-bold">
                    <i class="bi bi-bullseye text-primary"></i> {{ $t('createPlan.goal') }}
                  </label>
                  <textarea
                    class="form-control"
                    id="goal"
                    v-model="formData.goal"
                    rows="3"
                    required
                    :placeholder="$t('createPlan.goalPlaceholder')"
                  ></textarea>
                  <div class="form-text">{{ $t('createPlan.goalHint') }}</div>
                </div>

                <!-- 基础水平 -->
                <div class="mb-4">
                  <label for="level" class="form-label fw-bold">
                    <i class="bi bi-bar-chart text-success"></i> {{ $t('createPlan.level') }}
                  </label>
                  <select class="form-select" id="level" v-model="formData.level" required>
                    <option value="零基础">{{ $t('createPlan.levelZero') }}</option>
                    <option value="初级">{{ $t('createPlan.levelBeginner') }}</option>
                    <option value="中级">{{ $t('createPlan.levelIntermediate') }}</option>
                    <option value="高级">{{ $t('createPlan.levelAdvanced') }}</option>
                  </select>
                </div>

                <div class="row">
                  <!-- 每日学习时间 -->
                  <div class="col-md-6 mb-4">
                    <label for="dailyHours" class="form-label fw-bold">
                      <i class="bi bi-clock text-warning"></i> {{ $t('createPlan.dailyHours') }}
                    </label>
                    <div class="input-group">
                      <input
                        type="number"
                        class="form-control"
                        id="dailyHours"
                        v-model.number="formData.dailyHours"
                        min="0.5"
                        max="12"
                        step="0.5"
                        required
                      />
                      <span class="input-group-text">{{ $t('createPlan.hours') }}</span>
                    </div>
                  </div>

                  <!-- 计划天数 -->
                  <div class="col-md-6 mb-4">
                    <label for="totalDays" class="form-label fw-bold">
                      <i class="bi bi-calendar3 text-info"></i> {{ $t('createPlan.totalDays') }}
                    </label>
                    <div class="input-group">
                      <input
                        type="number"
                        class="form-control"
                        id="totalDays"
                        v-model.number="formData.totalDays"
                        min="1"
                        max="365"
                        required
                      />
                      <span class="input-group-text">{{ $t('createPlan.days') }}</span>
                    </div>
                  </div>
                </div>

                <!-- 计划标题 -->
                <div class="mb-4">
                  <label for="title" class="form-label fw-bold">
                    <i class="bi bi-card-heading text-secondary"></i> {{ $t('createPlan.planTitle') }}
                  </label>
                  <input
                    type="text"
                    class="form-control"
                    id="title"
                    v-model="formData.title"
                    :placeholder="$t('createPlan.planTitlePlaceholder')"
                  />
                </div>

                <!-- 提交按钮 -->
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-robot"></i>
                    {{ loading ? $t('createPlan.generating') : $t('createPlan.submit') }}
                  </button>
                </div>
              </form>

              <!-- 生成结果区域 -->
              <div v-if="showResult" class="mt-4">
                <hr />
                <h5><i class="bi bi-check-circle text-success"></i> {{ $t('createPlan.planGeneratedSuccess') }}</h5>
                <div class="alert alert-success">
                  <strong>{{ resultPlan.title || resultPlan.goal }}</strong><br />
                  <small>{{ $t('planDetail.totalDays') }}：{{ resultPlan.totalDays }}{{ $t('createPlan.days') }}</small>
                </div>
                <div class="d-grid gap-2">
                  <router-link to="/my-plans" class="btn btn-success">
                    <i class="bi bi-list-check"></i> {{ $t('createPlan.viewMyPlans') }}
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- 提示卡片 -->
          <div class="card mt-4 border-info">
            <div class="card-body">
              <h6 class="card-title text-info"><i class="bi bi-lightbulb"></i> {{ $t('createPlan.tips') }}</h6>
              <ul class="mb-0 small text-muted">
                <li>{{ $t('createPlan.tip1') }}</li>
                <li>{{ $t('createPlan.tip2') }}</li>
                <li>{{ $t('createPlan.tip3') }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { planApi } from '../api/plan'
import { showToast } from '../utils/toast'

const { t, locale } = useI18n()
const router = useRouter()

const formData = reactive({
  goal: '',
  level: '零基础',
  dailyHours: 2,
  totalDays: 30,
  title: ''
})

const loading = ref(false)
const showResult = ref(false)
const resultPlan = ref({})

async function handleSubmit() {
  loading.value = true
  showResult.value = false

  try {
    // 添加当前语言设置到请求数据
    const requestData = {
      ...formData,
      language: locale.value // 传递当前i18n语言设置（zh-CN 或 en-US）
    }
    const result = await planApi.generatePlan(requestData)

    if (result && result.code === 200) {
      showToast(t('createPlan.planGeneratedSuccess'), 'success')
      resultPlan.value = result.data
      showResult.value = true
    } else {
      showToast(result?.message || t('createPlan.generateFailed'), 'error')
    }
  } catch (error) {
    console.error('生成计划失败:', error)
    showToast(t('errors.network'), 'error')
  } finally {
    loading.value = false
  }
}
</script>

