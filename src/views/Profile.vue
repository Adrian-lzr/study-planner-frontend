<template>
  <div>
    <Navbar />
    
    <main class="container my-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0"><i class="bi bi-person-circle"></i> {{ $t('profile.title') }}</h5>
            </div>
            <div class="card-body p-4">
              <!-- 头像设置 -->
              <div class="mb-4 text-center">
                <div class="position-relative d-inline-block mb-3">
                  <div 
                    v-if="!user?.avatar" 
                    class="rounded-circle border d-flex align-items-center justify-content-center bg-light"
                    style="width: 120px; height: 120px; border: 2px solid #dee2e6 !important;"
                  >
                    <i class="bi bi-person-circle" style="font-size: 80px; color: #6c757d;"></i>
                  </div>
                  <img 
                    v-else
                    :src="user.avatar" 
                    class="rounded-circle border" 
                    style="width: 120px; height: 120px; object-fit: cover; border: 2px solid #dee2e6 !important;"
                    alt="User Avatar"
                  >
                  <label for="avatar-upload" class="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 cursor-pointer shadow-sm" style="cursor: pointer; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;" title="更换头像">
                    <i class="bi bi-camera-fill"></i>
                  </label>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    class="d-none" 
                    accept="image/*"
                    @change="handleAvatarSelect"
                  >
                </div>
                <p class="text-muted small">{{ $t('profile.changeAvatarHint') }}</p>
              </div>
              
              <!-- 头像裁剪组件 -->
              <AvatarCropper 
                :show="showCropper"
                :imageSrc="cropperImageSrc"
                @confirm="handleCropperConfirm"
                @cancel="showCropper = false"
              />

              <hr />

              <!-- 基本信息 -->
              <div class="mb-4">
                <h6 class="text-muted mb-3">{{ $t('profile.basicInfo') }}</h6>
                <div class="row mb-3">
                  <label class="col-sm-3 col-form-label">{{ $t('profile.username') }}</label>
                  <div class="col-sm-9">
                    <input type="text" class="form-control" :value="user?.username" disabled />
                  </div>
                </div>
                <div class="row mb-3">
                  <label class="col-sm-3 col-form-label">{{ $t('profile.email') }}</label>
                  <div class="col-sm-9">
                    <input type="email" class="form-control" v-model="profileData.email" />
                  </div>
                </div>
                <div class="row mb-3">
                  <label class="col-sm-3 col-form-label">{{ $t('profile.registerTime') }}</label>
                  <div class="col-sm-9">
                    <input type="text" class="form-control" :value="formatDateTime(user?.createTime)" disabled />
                  </div>
                </div>
                <div class="text-end">
                  <button class="btn btn-primary" @click="updateProfile" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-check"></i>
                    {{ $t('profile.saveChanges') }}
                  </button>
                </div>
              </div>

              <hr />

              <!-- 提醒设置 -->
              <div class="mb-4">
                <h6 class="text-muted mb-3"><i class="bi bi-bell"></i> {{ $t('profile.reminderSettings') }}</h6>
                <div class="row mb-3">
                  <label class="col-sm-3 col-form-label">{{ $t('profile.inactiveThreshold') }}</label>
                  <div class="col-sm-9">
                    <div class="input-group">
                      <input 
                        type="number" 
                        class="form-control" 
                        v-model.number="settingsData.inactiveMinutes"
                        min="1"
                        max="10080"
                        :placeholder="$t('profile.minutes')"
                      />
                      <span class="input-group-text">{{ $t('profile.minutes') }}</span>
                    </div>
                    <small class="text-muted">{{ $t('profile.inactiveThresholdHint') }}</small>
                  </div>
                </div>
                <div class="row mb-3">
                  <label class="col-sm-3 col-form-label">{{ $t('profile.reminderInterval') }}</label>
                  <div class="col-sm-9">
                    <div class="input-group">
                      <input 
                        type="number" 
                        class="form-control" 
                        v-model.number="settingsData.reminderIntervalMinutes"
                        min="1"
                        max="10080"
                        :placeholder="$t('profile.minutes')"
                      />
                      <span class="input-group-text">{{ $t('profile.minutes') }}</span>
                    </div>
                    <small class="text-muted">{{ $t('profile.reminderIntervalDesc') }}</small>
                  </div>
                </div>
                <div class="text-end">
                  <button class="btn btn-primary" @click="updateSettings" :disabled="settingsLoading">
                    <span v-if="settingsLoading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-check"></i>
                    {{ $t('profile.saveSettings') }}
                  </button>
                </div>
              </div>

              <hr />

              <!-- 修改密码 -->
              <div class="mb-4">
                <h6 class="text-muted mb-3">{{ $t('profile.changePassword') }}</h6>
                <form @submit.prevent="changePassword">
                  <div class="row mb-3">
                    <label class="col-sm-3 col-form-label">{{ $t('profile.oldPassword') }}</label>
                    <div class="col-sm-9">
                      <input
                        type="password"
                        class="form-control"
                        v-model="passwordData.oldPassword"
                        required
                      />
                    </div>
                  </div>
                  <div class="row mb-3">
                    <label class="col-sm-3 col-form-label">{{ $t('profile.newPassword') }}</label>
                    <div class="col-sm-9">
                      <input
                        type="password"
                        class="form-control"
                        v-model="passwordData.newPassword"
                        minlength="6"
                        required
                      />
                    </div>
                  </div>
                  <div class="row mb-3">
                    <label class="col-sm-3 col-form-label">{{ $t('profile.confirmPassword') }}</label>
                    <div class="col-sm-9">
                      <input
                        type="password"
                        class="form-control"
                        v-model="passwordData.confirmPassword"
                        required
                      />
                    </div>
                  </div>
                  <div class="text-end">
                    <button type="submit" class="btn btn-warning" :disabled="passwordLoading">
                      <span v-if="passwordLoading" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-key"></i>
                      {{ $t('profile.changePassword') }}
                    </button>
                  </div>
                </form>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import AvatarCropper from '../components/AvatarCropper.vue'
import { useUserStore } from '../stores/user'
import { userApi } from '../api/user'
import { settingsApi } from '../api/settings'
import { showToast } from '../utils/toast'
import { formatDateTime } from '../utils/format'

const { t } = useI18n()
const userStore = useUserStore()
const user = computed(() => userStore.user)

const loading = ref(false)
const passwordLoading = ref(false)
const settingsLoading = ref(false)
const showCropper = ref(false)
const cropperImageSrc = ref('')

const profileData = reactive({
  email: ''
})

const passwordData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const settingsData = reactive({
  inactiveMinutes: 3,
  reminderIntervalMinutes: 60
})

onMounted(() => {
  if (user.value) {
    profileData.email = user.value.email || ''
  }
  loadSettings()
})

async function loadSettings() {
  try {
    const result = await settingsApi.getSettings()
    if (result && result.code === 200 && result.data) {
      settingsData.inactiveMinutes = result.data.inactiveMinutes || 3
      settingsData.reminderIntervalMinutes = result.data.reminderIntervalMinutes || 60
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

async function updateSettings() {
  if (!settingsData.inactiveMinutes || settingsData.inactiveMinutes < 1 || settingsData.inactiveMinutes > 10080) {
    showToast(t('profile.inactiveThresholdRange'), 'error')
    return
  }
  if (!settingsData.reminderIntervalMinutes || settingsData.reminderIntervalMinutes < 1 || settingsData.reminderIntervalMinutes > 10080) {
    showToast(t('profile.reminderIntervalRange'), 'error')
    return
  }

  settingsLoading.value = true
  
  try {
    const result = await settingsApi.updateSettings({
      inactiveMinutes: settingsData.inactiveMinutes,
      reminderIntervalMinutes: settingsData.reminderIntervalMinutes
    })
    if (result && result.code === 200) {
      showToast(t('profile.settingsUpdateSuccess'), 'success')
    } else {
      showToast(result?.message || t('profile.updateFailed'), 'error')
    }
  } catch (error) {
    console.error('更新设置失败:', error)
    showToast(t('profile.updateFailed'), 'error')
  } finally {
    settingsLoading.value = false
  }
}

/**
 * 压缩图片
 * @param {File} file - 原始图片文件
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @param {number} quality - 图片质量 (0-1)
 * @returns {Promise<Blob>} 压缩后的图片blob
 */
function compressImage(file, maxWidth = 2000, maxHeight = 2000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 计算新尺寸
        let width = img.width
        let height = img.height
        
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width
            width = maxWidth
          } else {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        // 创建canvas进行压缩
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为blob
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('图片压缩完成:', {
              原始大小: (file.size / 1024).toFixed(2) + ' KB',
              压缩后大小: (blob.size / 1024).toFixed(2) + ' KB',
              压缩率: ((1 - blob.size / file.size) * 100).toFixed(1) + '%'
            })
            resolve(blob)
          } else {
            reject(new Error('图片压缩失败'))
          }
        }, file.type || 'image/jpeg', quality)
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 处理头像选择
 */
async function handleAvatarSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    showToast(t('profile.pleaseSelectImage'), 'error')
    event.target.value = ''
    return
  }
  
  // 验证文件大小（5MB限制）
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    showToast(t('profile.imageSizeExceeded'), 'error')
    event.target.value = ''
    return
  }

  try {
    showToast(t('profile.processingImage'), 'info')
    
    // 如果图片大于1MB，先进行压缩
    let processedFile = file
    if (file.size > 1024 * 1024) {
      console.log('图片较大，开始压缩...')
      const compressedBlob = await compressImage(file, 2000, 2000, 0.85)
      processedFile = new File([compressedBlob], file.name, { type: compressedBlob.type })
    }
    
    // 创建预览URL并显示裁剪器
    const reader = new FileReader()
    reader.onload = (e) => {
      cropperImageSrc.value = e.target.result
      showCropper.value = true
      showToast(t('profile.adjustCropArea'), 'info')
    }
    reader.onerror = () => {
      showToast(t('profile.imageReadFailed'), 'error')
    }
    reader.readAsDataURL(processedFile)
    
  } catch (error) {
    console.error('处理图片失败:', error)
    showToast(t('profile.imageProcessFailed') + ': ' + error.message, 'error')
  } finally {
    // 重置input
    event.target.value = ''
  }
}

/**
 * 处理裁剪确认 - 上传裁剪后的头像到数据库
 * @param {Blob} blob - 裁剪后的图片blob（200x200像素，1:1比例，JPEG格式）
 */
async function handleCropperConfirm(blob) {
  if (!blob) {
    console.error('No blob received from cropper')
    showToast(t('profile.cropFailed'), 'error')
    return
  }
  
  console.log('收到裁剪后的图片:', {
    size: blob.size,
    type: blob.type,
    sizeKB: (blob.size / 1024).toFixed(2) + ' KB'
  })
  
  showCropper.value = false
  showToast(t('profile.uploadingAvatar'), 'info')
  
  // 创建FormData
  const formData = new FormData()
  const fileName = `avatar_${Date.now()}.jpg`
  formData.append('file', blob, fileName)
  
  try {
    const result = await userApi.uploadAvatar(formData)
    console.log('上传结果:', result)
    
    if (result && result.code === 200) {
      showToast(t('profile.avatarUploadSuccess'), 'success')
      
      // 更新用户信息以显示新头像
      // 后端返回的 result.data 应该是 User 对象，包含更新后的 avatar URL
      if (result.data) {
        // 直接更新 userStore.user（因为 user 是 computed，会自动更新）
        if (result.data.avatar) {
          // 如果返回的是User对象，使用avatar字段
          userStore.user = { ...userStore.user, avatar: result.data.avatar }
        } else if (result.data.id) {
          // 如果返回的是完整的User对象
          userStore.user = result.data
        }
        
        // 同时保存到 localStorage 保持同步
        localStorage.setItem('user', JSON.stringify(userStore.user))
        
        console.log('头像更新成功，当前用户信息:', userStore.user)
      }
      
      // 重新获取用户信息确保与数据库同步
      await userStore.checkLoginStatus()
      
    } else {
      const errorMsg = result?.message || t('profile.uploadFailed')
      console.error('上传失败:', errorMsg)
      showToast(errorMsg, 'error')
    }
  } catch (error) {
    console.error('上传头像失败:', error)
    console.error('错误详情:', error.response || error.message)
    
    let errorMessage = t('profile.uploadFailed')
    if (error.response) {
      errorMessage = error.response.data?.message || `服务器错误: ${error.response.status}`
    } else if (error.message) {
      errorMessage = error.message
    }
    
    showToast(errorMessage, 'error')
  }
}

async function updateProfile() {
  loading.value = true
  
  try {
    const result = await userApi.updateProfile(profileData)
    if (result && result.code === 200) {
      showToast(t('profile.profileUpdateSuccess'), 'success')
      await userStore.checkLoginStatus()
    } else {
      showToast(result?.message || t('profile.updateFailed'), 'error')
    }
  } catch (error) {
    console.error('更新资料失败:', error)
    showToast(t('profile.updateFailed'), 'error')
  } finally {
    loading.value = false
  }
}

async function changePassword() {
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    showToast(t('errors.passwordMismatch'), 'error')
    return
  }

  passwordLoading.value = true
  
  try {
    const result = await userApi.changePassword(
      passwordData.oldPassword,
      passwordData.newPassword
    )
    
    if (result && result.code === 200) {
      showToast(t('profile.passwordChangeSuccess'), 'success')
      
      // 清空表单
      passwordData.oldPassword = ''
      passwordData.newPassword = ''
      passwordData.confirmPassword = ''
      
      // 登出并跳转到登录页
      setTimeout(() => {
        userStore.logout()
        window.location.href = '/login'
      }, 1500)
    } else {
      showToast(result?.message || t('profile.passwordChangeFailed'), 'error')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    showToast(t('profile.passwordChangeFailed'), 'error')
  } finally {
    passwordLoading.value = false
  }
}
</script>

