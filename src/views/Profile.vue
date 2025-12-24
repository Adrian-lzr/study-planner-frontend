<template>
  <div>
    <Navbar />
    
    <main class="container my-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0"><i class="bi bi-person-circle"></i> 个人资料</h5>
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
                <p class="text-muted small">点击相机图标更换头像 (支持裁剪和压缩，最大5MB)</p>
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
                <h6 class="text-muted mb-3">基本信息</h6>
                <div class="row mb-3">
                  <label class="col-sm-3 col-form-label">用户名</label>
                  <div class="col-sm-9">
                    <input type="text" class="form-control" :value="user?.username" disabled />
                  </div>
                </div>
                <div class="row mb-3">
                  <label class="col-sm-3 col-form-label">邮箱</label>
                  <div class="col-sm-9">
                    <input type="email" class="form-control" v-model="profileData.email" />
                  </div>
                </div>
                <div class="row mb-3">
                  <label class="col-sm-3 col-form-label">注册时间</label>
                  <div class="col-sm-9">
                    <input type="text" class="form-control" :value="formatDateTime(user?.createTime)" disabled />
                  </div>
                </div>
                <div class="text-end">
                  <button class="btn btn-primary" @click="updateProfile" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-check"></i>
                    保存修改
                  </button>
                </div>
              </div>

              <hr />

              <!-- 提醒设置 -->
              <div class="mb-4">
                <h6 class="text-muted mb-3"><i class="bi bi-bell"></i> 提醒设置</h6>
                <div class="row mb-3">
                  <label class="col-sm-3 col-form-label">闲置时间阈值</label>
                  <div class="col-sm-9">
                    <div class="input-group">
                      <input 
                        type="number" 
                        class="form-control" 
                        v-model.number="settingsData.inactiveMinutes"
                        min="1"
                        max="10080"
                        placeholder="分钟"
                      />
                      <span class="input-group-text">分钟</span>
                    </div>
                    <small class="text-muted">超过此时间未打卡算闲置（1-10080分钟，即1分钟到7天）</small>
                  </div>
                </div>
                <div class="row mb-3">
                  <label class="col-sm-3 col-form-label">提醒间隔</label>
                  <div class="col-sm-9">
                    <div class="input-group">
                      <input 
                        type="number" 
                        class="form-control" 
                        v-model.number="settingsData.reminderIntervalMinutes"
                        min="1"
                        max="10080"
                        placeholder="分钟"
                      />
                      <span class="input-group-text">分钟</span>
                    </div>
                    <small class="text-muted">闲置后每隔多久提醒一次（1-10080分钟，即1分钟到7天）</small>
                  </div>
                </div>
                <div class="text-end">
                  <button class="btn btn-primary" @click="updateSettings" :disabled="settingsLoading">
                    <span v-if="settingsLoading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-check"></i>
                    保存设置
                  </button>
                </div>
              </div>

              <hr />

              <!-- 修改密码 -->
              <div class="mb-4">
                <h6 class="text-muted mb-3">修改密码</h6>
                <form @submit.prevent="changePassword">
                  <div class="row mb-3">
                    <label class="col-sm-3 col-form-label">原密码</label>
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
                    <label class="col-sm-3 col-form-label">新密码</label>
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
                    <label class="col-sm-3 col-form-label">确认新密码</label>
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
                      修改密码
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
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import AvatarCropper from '../components/AvatarCropper.vue'
import { useUserStore } from '../stores/user'
import { userApi } from '../api/user'
import { settingsApi } from '../api/settings'
import { showToast } from '../utils/toast'
import { formatDateTime } from '../utils/format'

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
    showToast('闲置时间必须在1-10080分钟之间', 'error')
    return
  }
  if (!settingsData.reminderIntervalMinutes || settingsData.reminderIntervalMinutes < 1 || settingsData.reminderIntervalMinutes > 10080) {
    showToast('提醒间隔必须在1-10080分钟之间', 'error')
    return
  }

  settingsLoading.value = true
  
  try {
    const result = await settingsApi.updateSettings({
      inactiveMinutes: settingsData.inactiveMinutes,
      reminderIntervalMinutes: settingsData.reminderIntervalMinutes
    })
    if (result && result.code === 200) {
      showToast('设置更新成功', 'success')
    } else {
      showToast(result?.message || '更新失败', 'error')
    }
  } catch (error) {
    console.error('更新设置失败:', error)
    showToast('更新失败', 'error')
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
    showToast('请选择图片文件（JPG、PNG、GIF等）', 'error')
    event.target.value = ''
    return
  }
  
  // 验证文件大小（5MB限制）
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    showToast('图片大小不能超过5MB', 'error')
    event.target.value = ''
    return
  }

  try {
    showToast('正在处理图片...', 'info')
    
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
      showToast('请调整裁剪区域（1:1比例）', 'info')
    }
    reader.onerror = () => {
      showToast('图片读取失败', 'error')
    }
    reader.readAsDataURL(processedFile)
    
  } catch (error) {
    console.error('处理图片失败:', error)
    showToast('图片处理失败: ' + error.message, 'error')
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
    showToast('裁剪失败，请重试', 'error')
    return
  }
  
  console.log('收到裁剪后的图片:', {
    size: blob.size,
    type: blob.type,
    sizeKB: (blob.size / 1024).toFixed(2) + ' KB'
  })
  
  showCropper.value = false
  showToast('正在上传头像...', 'info')
  
  // 创建FormData
  const formData = new FormData()
  const fileName = `avatar_${Date.now()}.jpg`
  formData.append('file', blob, fileName)
  
  try {
    const result = await userApi.uploadAvatar(formData)
    console.log('上传结果:', result)
    
    if (result && result.code === 200) {
      showToast('头像上传成功！', 'success')
      
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
      const errorMsg = result?.message || '上传失败'
      console.error('上传失败:', errorMsg)
      showToast(errorMsg, 'error')
    }
  } catch (error) {
    console.error('上传头像失败:', error)
    console.error('错误详情:', error.response || error.message)
    
    let errorMessage = '上传失败'
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
      showToast('资料更新成功', 'success')
      await userStore.checkLoginStatus()
    } else {
      showToast(result?.message || '更新失败', 'error')
    }
  } catch (error) {
    console.error('更新资料失败:', error)
    showToast('更新失败', 'error')
  } finally {
    loading.value = false
  }
}

async function changePassword() {
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    showToast('两次输入的密码不一致', 'error')
    return
  }

  passwordLoading.value = true
  
  try {
    const result = await userApi.changePassword(
      passwordData.oldPassword,
      passwordData.newPassword
    )
    
    if (result && result.code === 200) {
      showToast('密码修改成功，请重新登录', 'success')
      
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
      showToast(result?.message || '修改失败', 'error')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    showToast('修改失败', 'error')
  } finally {
    passwordLoading.value = false
  }
}
</script>

