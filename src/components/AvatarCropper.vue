<template>
  <div v-if="show" class="avatar-cropper-modal" @click.self="cancel">
    <div class="avatar-cropper-container">
      <!-- 头部 -->
      <div class="avatar-cropper-header">
        <h5 class="mb-0">{{ $t('profile.cropAvatar') }}</h5>
        <button type="button" class="btn-close" @click="cancel" :aria-label="$t('common.close')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- 裁剪区域 -->
      <div class="avatar-cropper-body">
        <div class="cropper-preview-container">
          <!-- 主裁剪区域 -->
          <div class="cropper-main-area" ref="cropperContainer">
            <div class="cropper-image-wrapper" ref="imageWrapper">
              <img 
                ref="imageRef" 
                :src="imageSrc" 
                alt="Avatar"
                @load="onImageLoad"
                @error="onImageError"
              />
              <!-- 遮罩层 -->
              <div class="cropper-overlay">
                <div class="cropper-mask"></div>
                <!-- 裁剪框 -->
                <div 
                  class="cropper-box" 
                  ref="cropBox"
                  :style="cropBoxStyle"
                  @mousedown="startDrag"
                >
                  <!-- 裁剪框边框 -->
                  <div class="cropper-box-border"></div>
                  <!-- 辅助线 -->
                  <div class="cropper-guides">
                    <div class="guide-line guide-line-h"></div>
                    <div class="guide-line guide-line-h"></div>
                    <div class="guide-line guide-line-v"></div>
                    <div class="guide-line guide-line-v"></div>
                  </div>
                  <!-- 调整手柄（只在角落显示，保持1:1比例） -->
                  <div 
                    class="cropper-handle cropper-handle-nw"
                    @mousedown.stop="startResize('nw', $event)"
                  ></div>
                  <div 
                    class="cropper-handle cropper-handle-ne"
                    @mousedown.stop="startResize('ne', $event)"
                  ></div>
                  <div 
                    class="cropper-handle cropper-handle-sw"
                    @mousedown.stop="startResize('sw', $event)"
                  ></div>
                  <div 
                    class="cropper-handle cropper-handle-se"
                    @mousedown.stop="startResize('se', $event)"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 实时预览 -->
          <div class="cropper-preview-section">
            <div class="preview-label">{{ $t('common.preview') }}</div>
            <div class="preview-box">
              <canvas ref="previewCanvas" class="preview-canvas"></canvas>
            </div>
          </div>
        </div>

        <!-- 控制栏 -->
        <div class="cropper-controls">
          <div class="zoom-control">
            <button 
              class="btn btn-sm btn-outline-secondary" 
              @click="zoomOut"
              :disabled="scale <= minScale"
              :title="$t('profile.zoomOut')"
            >
              <i class="bi bi-dash-lg"></i>
            </button>
            <input 
              type="range" 
              class="zoom-slider"
              :min="minScale"
              :max="maxScale"
              :step="0.1"
              :value="scale"
              @input="onZoomChange"
            />
            <button 
              class="btn btn-sm btn-outline-secondary" 
              @click="zoomIn"
              :disabled="scale >= maxScale"
              :title="$t('profile.zoomIn')"
            >
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>
          <div class="control-buttons">
            <button class="btn btn-secondary" @click="cancel">{{ $t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="confirm">{{ $t('profile.confirmCrop') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  imageSrc: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

// DOM引用
const imageRef = ref(null)
const imageWrapper = ref(null)
const cropperContainer = ref(null)
const cropBox = ref(null)
const previewCanvas = ref(null)

// 图片信息
const imageWidth = ref(0)
const imageHeight = ref(0)
const imageLoaded = ref(false)

// 缩放相关
const scale = ref(1)
const minScale = ref(0.5)
const maxScale = ref(3)

// 裁剪框位置和大小（相对于图片）
const cropX = ref(0)
const cropY = ref(0)
const cropSize = ref(200) // 初始裁剪框大小（像素）

// 拖拽状态
const isDragging = ref(false)
const isResizing = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartCropX = ref(0)
const dragStartCropY = ref(0)
const resizeDirection = ref('')

// 容器尺寸
const containerWidth = ref(0)
const containerHeight = ref(0)

// 计算裁剪框样式
const cropBoxStyle = computed(() => {
  // 计算裁剪框在容器中的实际位置和大小
  const scaledSize = cropSize.value * scale.value
  const scaledX = cropX.value * scale.value
  const scaledY = cropY.value * scale.value
  
  return {
    width: `${scaledSize}px`,
    height: `${scaledSize}px`,
    left: `${scaledX}px`,
    top: `${scaledY}px`
  }
})

// 监听显示状态
watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initCropper()
    })
  } else {
    cleanup()
  }
})

// 图片加载完成
function onImageLoad() {
  if (!imageRef.value) return
  
  imageWidth.value = imageRef.value.naturalWidth
  imageHeight.value = imageRef.value.naturalHeight
  imageLoaded.value = true
  
  nextTick(() => {
    initCropBox()
    updatePreview()
    setupWheelZoom()
  })
}

// 图片加载错误
function onImageError() {
  console.error('图片加载失败')
  emit('cancel')
}

// 初始化裁剪器
function initCropper() {
  if (!imageRef.value || !cropperContainer.value) {
    return
  }
  
  // 计算容器尺寸
  updateContainerSize()
  
  // 如果图片已加载，初始化裁剪框
  if (imageLoaded.value) {
    initCropBox()
    updatePreview()
    setupWheelZoom()
  }
}

// 更新容器尺寸
function updateContainerSize() {
  if (cropperContainer.value) {
    containerWidth.value = cropperContainer.value.clientWidth
    containerHeight.value = cropperContainer.value.clientHeight
  }
}

// 初始化裁剪框（居中，大小为图片较小边的80%）
function initCropBox() {
  if (!imageWidth.value || !imageHeight.value) return
  
  // 计算合适的初始裁剪框大小（基于原始图片尺寸）
  const minDimension = Math.min(imageWidth.value, imageHeight.value)
  cropSize.value = minDimension * 0.8
  
  // 计算初始位置（居中）
  cropX.value = (imageWidth.value - cropSize.value) / 2
  cropY.value = (imageHeight.value - cropSize.value) / 2
  
  // 计算合适的初始缩放比例
  const containerSize = Math.min(containerWidth.value - 40, containerHeight.value - 200)
  const imageMaxDimension = Math.max(imageWidth.value, imageHeight.value)
  scale.value = Math.min(containerSize / imageMaxDimension, 1)
  
  // 限制缩放范围
  minScale.value = Math.min(0.3, scale.value * 0.5)
  maxScale.value = Math.max(3, scale.value * 2)
  
  updatePreview()
}

// 开始拖拽裁剪框
function startDrag(event) {
  if (event.button !== 0) return // 只处理左键
  
  isDragging.value = true
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  dragStartCropX.value = cropX.value
  dragStartCropY.value = cropY.value
  
  event.preventDefault()
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

// 拖拽中
function onDrag(event) {
  if (!isDragging.value) return
  
  const deltaX = (event.clientX - dragStartX.value) / scale.value
  const deltaY = (event.clientY - dragStartY.value) / scale.value
  
  let newX = dragStartCropX.value + deltaX
  let newY = dragStartCropY.value + deltaY
  
  // 限制裁剪框不超出图片边界
  newX = Math.max(0, Math.min(newX, imageWidth.value - cropSize.value))
  newY = Math.max(0, Math.min(newY, imageHeight.value - cropSize.value))
  
  cropX.value = newX
  cropY.value = newY
  
  updatePreview()
}

// 停止拖拽
function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 开始调整大小
function startResize(direction, event) {
  if (event.button !== 0) return
  
  isResizing.value = true
  resizeDirection.value = direction
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  dragStartCropX.value = cropX.value
  dragStartCropY.value = cropY.value
  
  const startSize = cropSize.value
  
  event.preventDefault()
  event.stopPropagation()
  
  function onResize(event) {
    if (!isResizing.value) return
    
    const deltaX = (event.clientX - dragStartX.value) / scale.value
    const deltaY = (event.clientY - dragStartY.value) / scale.value
    
    let newSize = startSize
    let newX = dragStartCropX.value
    let newY = dragStartCropY.value
    
    // 根据方向计算新的大小和位置（保持1:1比例）
    if (direction.includes('e')) {
      newSize = startSize + deltaX
    } else if (direction.includes('w')) {
      newSize = startSize - deltaX
      newX = dragStartCropX.value + deltaX
    }
    
    if (direction.includes('s')) {
      newSize = startSize + deltaY
    } else if (direction.includes('n')) {
      newSize = startSize - deltaY
      newY = dragStartCropY.value + deltaY
    }
    
    // 限制最小和最大尺寸
    const minSize = Math.min(imageWidth.value, imageHeight.value) * 0.1
    const maxSize = Math.min(imageWidth.value, imageHeight.value)
    newSize = Math.max(minSize, Math.min(newSize, maxSize))
    
    // 限制不超出边界
    newX = Math.max(0, Math.min(newX, imageWidth.value - newSize))
    newY = Math.max(0, Math.min(newY, imageHeight.value - newSize))
    
    cropSize.value = newSize
    cropX.value = newX
    cropY.value = newY
    
    updatePreview()
  }
  
  function stopResize() {
    isResizing.value = false
    document.removeEventListener('mousemove', onResize)
    document.removeEventListener('mouseup', stopResize)
  }
  
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

// 缩放控制
function zoomIn() {
  scale.value = Math.min(scale.value + 0.1, maxScale.value)
  updatePreview()
}

function zoomOut() {
  scale.value = Math.max(scale.value - 0.1, minScale.value)
  updatePreview()
}

function onZoomChange(event) {
  scale.value = parseFloat(event.target.value)
  updatePreview()
}

// 滚轮缩放
function setupWheelZoom() {
  if (!cropperContainer.value) return
  
  const container = cropperContainer.value
  container.addEventListener('wheel', handleWheel, { passive: false })
}

function handleWheel(event) {
  event.preventDefault()
  
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  scale.value = Math.max(minScale.value, Math.min(maxScale.value, scale.value + delta))
  
  updatePreview()
}

// 更新预览
function updatePreview() {
  if (!previewCanvas.value || !imageRef.value || !imageLoaded.value) return
  
  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')
  
  // 设置预览尺寸（200x200）
  canvas.width = 200
  canvas.height = 200
  
  // 清空画布
  ctx.clearRect(0, 0, 200, 200)
  
  // 计算裁剪区域在原始图片中的坐标
  const sourceX = cropX.value
  const sourceY = cropY.value
  const sourceSize = cropSize.value
  
  // 绘制裁剪后的图片
  ctx.drawImage(
    imageRef.value,
    sourceX, sourceY, sourceSize, sourceSize, // 源图片区域
    0, 0, 200, 200 // 目标画布区域
  )
}

// 确认裁剪
function confirm() {
  if (!imageRef.value || !imageLoaded.value) {
    emit('cancel')
    return
  }
  
  // 创建临时canvas进行裁剪
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  const ctx = canvas.getContext('2d')
  
  // 计算裁剪区域
  const sourceX = cropX.value
  const sourceY = cropY.value
  const sourceSize = cropSize.value
  
  // 绘制裁剪后的图片
  ctx.drawImage(
    imageRef.value,
    sourceX, sourceY, sourceSize, sourceSize,
    0, 0, 200, 200
  )
  
  // 转换为blob
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('裁剪失败')
      emit('cancel')
      return
    }
    
    console.log('裁剪完成:', {
      size: blob.size,
      type: blob.type,
      sizeKB: (blob.size / 1024).toFixed(2) + ' KB'
    })
    
    emit('confirm', blob)
    cleanup()
  }, 'image/jpeg', 0.92)
}

// 取消
function cancel() {
  cleanup()
  emit('cancel')
}

// 清理
function cleanup() {
  stopDrag()
  isResizing.value = false
  
  if (cropperContainer.value) {
    cropperContainer.value.removeEventListener('wheel', handleWheel)
  }
}

// 窗口大小改变时更新
function handleResize() {
  updateContainerSize()
  updatePreview()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cleanup()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.avatar-cropper-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.avatar-cropper-container {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.avatar-cropper-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e4e8;
  background: #f6f8fa;
}

.avatar-cropper-header h5 {
  margin: 0;
  font-weight: 600;
  font-size: 16px;
  color: #24292e;
}

.btn-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #586069;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e1e4e8;
  color: #24292e;
}

.avatar-cropper-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: hidden;
}

/* 裁剪预览容器 */
.cropper-preview-container {
  display: flex;
  gap: 20px;
  min-height: 0;
  flex: 1;
}

/* 主裁剪区域 */
.cropper-main-area {
  flex: 1;
  min-width: 0;
  position: relative;
  background: #f6f8fa;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 500px;
}

.cropper-image-wrapper {
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: 100%;
}

.cropper-image-wrapper img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  user-select: none;
  pointer-events: none;
}

/* 遮罩层 */
.cropper-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.cropper-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

/* 裁剪框 */
.cropper-box {
  position: absolute;
  border: 2px solid #0366d6;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  cursor: move;
  pointer-events: all;
  box-sizing: border-box;
}

.cropper-box-border {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid white;
  pointer-events: none;
}

/* 辅助线 */
.cropper-guides {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.guide-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.4);
}

.guide-line-h {
  left: 0;
  right: 0;
  height: 1px;
  top: 33.33%;
}

.guide-line-h:last-of-type {
  top: 66.66%;
}

.guide-line-v {
  top: 0;
  bottom: 0;
  width: 1px;
  left: 33.33%;
}

.guide-line-v:last-of-type {
  left: 66.66%;
}

/* 调整手柄 */
.cropper-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #0366d6;
  border: 2px solid white;
  border-radius: 2px;
  cursor: nwse-resize;
  z-index: 10;
}

.cropper-handle-nw {
  top: -6px;
  left: -6px;
  cursor: nwse-resize;
}

.cropper-handle-ne {
  top: -6px;
  right: -6px;
  cursor: nesw-resize;
}

.cropper-handle-sw {
  bottom: -6px;
  left: -6px;
  cursor: nesw-resize;
}

.cropper-handle-se {
  bottom: -6px;
  right: -6px;
  cursor: nwse-resize;
}

.cropper-handle:hover {
  background: #0256c2;
  transform: scale(1.2);
}

/* 预览区域 */
.cropper-preview-section {
  flex-shrink: 0;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-label {
  font-size: 12px;
  font-weight: 600;
  color: #586069;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-box {
  width: 200px;
  height: 200px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background: #f6f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-canvas {
  width: 200px;
  height: 200px;
  display: block;
  border-radius: 4px;
}

/* 控制栏 */
.cropper-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e1e4e8;
  gap: 16px;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.zoom-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e1e4e8;
  outline: none;
  -webkit-appearance: none;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0366d6;
  cursor: pointer;
}

.zoom-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0366d6;
  cursor: pointer;
  border: none;
}

.control-buttons {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cropper-preview-container {
    flex-direction: column;
  }
  
  .cropper-preview-section {
    width: 100%;
    align-items: center;
  }
  
  .cropper-controls {
    flex-direction: column;
    gap: 12px;
  }
  
  .zoom-control {
    width: 100%;
  }
  
  .control-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
