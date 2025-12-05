import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  questionApi, 
  answerApi, 
  commentApi, 
  topicApi, 
  forumUserApi, 
  searchApi, 
  interactionApi 
} from '../api/forum'
import { showToast } from '../utils/toast'

export const useForumStore = defineStore('forum', () => {
  // 状态
  const questions = ref([])
  const currentQuestion = ref(null)
  const answers = ref([])
  const topics = ref([])
  const hotTopics = ref([])
  const searchResults = ref({})
  const myQuestions = ref([])
  const myAnswers = ref([])
  const myCollections = ref([])
  const loading = ref(false)

  // 获取问题列表
  async function fetchQuestions(params = {}) {
    try {
      loading.value = true
      const response = await questionApi.getQuestions(params)
      if (response.code === 200) {
        questions.value = response.data || []
        return response.data
      } else {
        showToast(response.message || '获取问题列表失败', 'error')
        return []
      }
    } catch (error) {
      console.error('获取问题列表失败:', error)
      showToast('获取问题列表失败', 'error')
      return []
    } finally {
      loading.value = false
    }
  }

  // 获取问题详情
  async function fetchQuestionDetail(id) {
    try {
      loading.value = true
      const response = await questionApi.getQuestionDetail(id)
      if (response.code === 200) {
        currentQuestion.value = response.data
        return response.data
      } else {
        showToast(response.message || '获取问题详情失败', 'error')
        return null
      }
    } catch (error) {
      console.error('获取问题详情失败:', error)
      showToast('获取问题详情失败', 'error')
      return null
    } finally {
      loading.value = false
    }
  }

  // 创建问题
  async function createQuestion(data) {
    try {
      loading.value = true
      const response = await questionApi.createQuestion(data)
      if (response.code === 200) {
        showToast('问题发布成功', 'success')
        return response.data
      } else {
        showToast(response.message || '发布问题失败', 'error')
        return null
      }
    } catch (error) {
      console.error('发布问题失败:', error)
      showToast('发布问题失败', 'error')
      return null
    } finally {
      loading.value = false
    }
  }

  // 获取回答列表
  async function fetchAnswers(questionId, params = {}) {
    try {
      loading.value = true
      const response = await questionApi.getAnswers(questionId, params)
      if (response.code === 200) {
        answers.value = response.data || []
        return response.data
      } else {
        showToast(response.message || '获取回答列表失败', 'error')
        return []
      }
    } catch (error) {
      console.error('获取回答列表失败:', error)
      showToast('获取回答列表失败', 'error')
      return []
    } finally {
      loading.value = false
    }
  }

  // 创建回答
  async function createAnswer(data) {
    try {
      loading.value = true
      const response = await answerApi.createAnswer(data)
      if (response.code === 200) {
        showToast('回答发布成功', 'success')
        return response.data
      } else {
        showToast(response.message || '发布回答失败', 'error')
        return null
      }
    } catch (error) {
      console.error('发布回答失败:', error)
      showToast('发布回答失败', 'error')
      return null
    } finally {
      loading.value = false
    }
  }

  // 点赞回答
  async function voteAnswer(id) {
    try {
      const response = await answerApi.voteAnswer(id)
      if (response.code === 200) {
        // 更新本地状态
        const answer = answers.value.find(a => a.id === id)
        if (answer) {
          answer.vote_count = response.data.vote_count
          answer.is_voted = response.data.is_voted
        }
        return response.data
      } else {
        showToast(response.message || '操作失败', 'error')
        return null
      }
    } catch (error) {
      console.error('点赞失败:', error)
      showToast('操作失败', 'error')
      return null
    }
  }

  // 收藏回答
  async function collectAnswer(id) {
    try {
      const response = await answerApi.collectAnswer(id)
      if (response.code === 200) {
        showToast(response.data.is_collected ? '收藏成功' : '取消收藏成功', 'success')
        return response.data
      } else {
        showToast(response.message || '操作失败', 'error')
        return null
      }
    } catch (error) {
      console.error('收藏失败:', error)
      showToast('操作失败', 'error')
      return null
    }
  }

  // 关注问题
  async function followQuestion(id) {
    try {
      const response = await questionApi.followQuestion(id)
      if (response.code === 200) {
        if (currentQuestion.value && currentQuestion.value.id === id) {
          currentQuestion.value.follow_count = response.data.follow_count
          currentQuestion.value.is_followed = response.data.is_followed
        }
        return response.data
      } else {
        showToast(response.message || '操作失败', 'error')
        return null
      }
    } catch (error) {
      console.error('关注失败:', error)
      showToast('操作失败', 'error')
      return null
    }
  }

  // 关注话题
  async function followTopic(id) {
    try {
      const response = await topicApi.followTopic(id)
      if (response.code === 200) {
        showToast(response.data.is_followed ? '关注成功' : '取消关注成功', 'success')
        return response.data
      } else {
        showToast(response.message || '操作失败', 'error')
        return null
      }
    } catch (error) {
      console.error('关注失败:', error)
      showToast('操作失败', 'error')
      return null
    }
  }

  // 关注用户
  async function followUser(id) {
    try {
      const response = await forumUserApi.followUser(id)
      if (response.code === 200) {
        showToast(response.data.is_followed ? '关注成功' : '取消关注成功', 'success')
        return response.data
      } else {
        showToast(response.message || '操作失败', 'error')
        return null
      }
    } catch (error) {
      console.error('关注失败:', error)
      showToast('操作失败', 'error')
      return null
    }
  }

  // 获取热门话题
  async function fetchHotTopics() {
    try {
      const response = await topicApi.getHotTopics()
      if (response.code === 200) {
        hotTopics.value = response.data || []
        return response.data
      }
      return []
    } catch (error) {
      console.error('获取热门话题失败:', error)
      return []
    }
  }

  // 搜索
  async function search(params) {
    try {
      loading.value = true
      const response = await searchApi.search(params)
      if (response.code === 200) {
        searchResults.value = response.data || {}
        return response.data
      } else {
        showToast(response.message || '搜索失败', 'error')
        return {}
      }
    } catch (error) {
      console.error('搜索失败:', error)
      showToast('搜索失败', 'error')
      return {}
    } finally {
      loading.value = false
    }
  }

  // 获取我的提问
  async function fetchMyQuestions(params = {}) {
    try {
      loading.value = true
      const response = await interactionApi.getMyQuestions(params)
      if (response.code === 200) {
        myQuestions.value = response.data || []
        return response.data
      } else {
        showToast(response.message || '获取失败', 'error')
        return []
      }
    } catch (error) {
      console.error('获取失败:', error)
      showToast('获取失败', 'error')
      return []
    } finally {
      loading.value = false
    }
  }

  // 获取我的回答
  async function fetchMyAnswers(params = {}) {
    try {
      loading.value = true
      const response = await interactionApi.getMyAnswers(params)
      if (response.code === 200) {
        myAnswers.value = response.data || []
        return response.data
      } else {
        showToast(response.message || '获取失败', 'error')
        return []
      }
    } catch (error) {
      console.error('获取失败:', error)
      showToast('获取失败', 'error')
      return []
    } finally {
      loading.value = false
    }
  }

  // 获取我的收藏
  async function fetchMyCollections(params = {}) {
    try {
      loading.value = true
      const response = await interactionApi.getMyCollections(params)
      if (response.code === 200) {
        myCollections.value = response.data || []
        return response.data
      } else {
        showToast(response.message || '获取失败', 'error')
        return []
      }
    } catch (error) {
      console.error('获取失败:', error)
      showToast('获取失败', 'error')
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    questions,
    currentQuestion,
    answers,
    topics,
    hotTopics,
    searchResults,
    myQuestions,
    myAnswers,
    myCollections,
    loading,
    // 方法
    fetchQuestions,
    fetchQuestionDetail,
    createQuestion,
    fetchAnswers,
    createAnswer,
    voteAnswer,
    collectAnswer,
    followQuestion,
    followTopic,
    followUser,
    fetchHotTopics,
    search,
    fetchMyQuestions,
    fetchMyAnswers,
    fetchMyCollections
  }
})

