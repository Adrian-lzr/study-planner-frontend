<template>
  <div class="card h-100">
    <div class="card-header d-flex justify-content-between align-items-center bg-white">
      <h6 class="mb-0"><i class="bi bi-bar-chart-line"></i> 学习进度可视化</h6>
      <div class="btn-group btn-group-sm">
        <button 
          type="button" 
          class="btn btn-outline-primary" 
          :class="{ active: period === 'week' }"
          @click="period = 'week'"
        >
          本周
        </button>
        <button 
          type="button" 
          class="btn btn-outline-primary" 
          :class="{ active: period === 'month' }"
          @click="period = 'month'"
        >
          本月
        </button>
      </div>
    </div>
    <div class="card-body">
      <div ref="chartRef" style="width: 100%; height: 300px;"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, toRefs } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({
      week: { xAxis: [], series: [] },
      month: { xAxis: [], series: [] }
    })
  }
})

const { chartData } = toRefs(props)
const chartRef = ref(null)
let chartInstance = null
const period = ref('week') // 'week' or 'month'

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

watch([period, chartData], () => {
  updateChart()
}, { deep: true })

function initChart() {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    updateChart()
  }
}

function handleResize() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

function updateChart() {
  if (!chartInstance) return

  const isWeek = period.value === 'week'
  const data = isWeek ? chartData.value.week : chartData.value.month
  
  // 如果没有数据，显示空状态或默认坐标轴
  const xAxisData = data?.xAxis?.length ? data.xAxis : []
  const seriesData = data?.series?.length ? data.series : []
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b} <br/> 学习时长: {c} 小时'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData
    },
    yAxis: {
      type: 'value',
      name: '小时'
    },
    series: [
      {
        name: '学习时长',
        type: 'line',
        smooth: true,
        data: data.series,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(13, 110, 253, 0.5)' },
            { offset: 1, color: 'rgba(13, 110, 253, 0.1)' }
          ])
        },
        itemStyle: {
          color: '#0d6efd'
        },
        lineStyle: {
          width: 3
        }
      }
    ]
  }

  chartInstance.setOption(option)
}
</script>

<style scoped>
.card {
  border-radius: 15px;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>
