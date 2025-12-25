<template>
  <div>
    <Navbar />
    
    <!-- 主内容区 -->
    <main class="container my-5">
      <!-- Hero Section -->
      <section class="text-center py-5">
        <h1 class="display-4 fw-bold text-primary">
          <i class="bi bi-lightbulb"></i> {{ $t('home.title') }}
        </h1>
        <p class="lead text-muted">
          {{ $t('home.subtitle') }}
        </p>
        <div class="mt-4">
          <router-link to="/create-plan" class="btn btn-primary btn-lg me-2">
            <i class="bi bi-plus-circle"></i> {{ $t('home.createPlan') }}
          </router-link>
          <router-link v-if="!isLoggedIn" to="/login" class="btn btn-outline-primary btn-lg">
            <i class="bi bi-person"></i> {{ $t('home.loginRegister') }}
          </router-link>
        </div>
      </section>

      <!-- 功能介绍 -->
      <section class="py-5">
        <h2 class="text-center mb-5">{{ $t('home.features') }}</h2>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body text-center">
                <div
                  class="feature-icon bg-primary bg-gradient text-white rounded-circle mb-3 mx-auto"
                  style="width: 60px; height: 60px; line-height: 60px"
                >
                  <i class="bi bi-robot fs-4"></i>
                </div>
                <h5 class="card-title">{{ $t('home.aiGenerate') }}</h5>
                <p class="card-text text-muted">
                  {{ $t('home.aiGenerateDesc') }}
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body text-center">
                <div
                  class="feature-icon bg-success bg-gradient text-white rounded-circle mb-3 mx-auto"
                  style="width: 60px; height: 60px; line-height: 60px"
                >
                  <i class="bi bi-calendar-check fs-4"></i>
                </div>
                <h5 class="card-title">{{ $t('home.dailyCheckIn') }}</h5>
                <p class="card-text text-muted">
                  {{ $t('home.dailyCheckInDesc') }}
                </p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body text-center">
                <div
                  class="feature-icon bg-warning bg-gradient text-white rounded-circle mb-3 mx-auto"
                  style="width: 60px; height: 60px; line-height: 60px"
                >
                  <i class="bi bi-graph-up fs-4"></i>
                </div>
                <h5 class="card-title">{{ $t('home.studyStats') }}</h5>
                <p class="card-text text-muted">
                  {{ $t('home.studyStatsDesc') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 使用流程 -->
      <section class="py-5 bg-light rounded-3">
        <h2 class="text-center mb-5">{{ $t('home.usageFlow') }}</h2>
        <div class="row justify-content-center">
          <div class="col-md-10">
            <div class="row g-4">
              <div class="col-md-3 text-center">
                <div
                  class="step-number bg-primary text-white rounded-circle mx-auto mb-3"
                  style="width: 50px; height: 50px; line-height: 50px; font-size: 1.5rem"
                >
                  1
                </div>
                <h6>{{ $t('home.step1') }}</h6>
                <p class="small text-muted">{{ $t('home.step1Desc') }}</p>
              </div>
              <div class="col-md-3 text-center">
                <div
                  class="step-number bg-primary text-white rounded-circle mx-auto mb-3"
                  style="width: 50px; height: 50px; line-height: 50px; font-size: 1.5rem"
                >
                  2
                </div>
                <h6>{{ $t('home.step2') }}</h6>
                <p class="small text-muted">{{ $t('home.step2Desc') }}</p>
              </div>
              <div class="col-md-3 text-center">
                <div
                  class="step-number bg-primary text-white rounded-circle mx-auto mb-3"
                  style="width: 50px; height: 50px; line-height: 50px; font-size: 1.5rem"
                >
                  3
                </div>
                <h6>{{ $t('home.step3') }}</h6>
                <p class="small text-muted">{{ $t('home.step3Desc') }}</p>
              </div>
              <div class="col-md-3 text-center">
                <div
                  class="step-number bg-primary text-white rounded-circle mx-auto mb-3"
                  style="width: 50px; height: 50px; line-height: 50px; font-size: 1.5rem"
                >
                  4
                </div>
                <h6>{{ $t('home.step4') }}</h6>
                <p class="small text-muted">{{ $t('home.step4Desc') }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { useUserStore } from '../stores/user'

const { t } = useI18n()
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
</script>

