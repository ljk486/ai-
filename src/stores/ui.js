import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // Toast 通知
  const toast = ref({
    visible: false,
    message: '',
    type: 'info'
  })

  // 加载状态
  const isLoading = ref(false)
  const loadingText = ref('')

  // 显示 Toast
  function showToast(message, type = 'info') {
    toast.value = {
      visible: true,
      message,
      type
    }
  }

  // 隐藏 Toast
  function hideToast() {
    toast.value.visible = false
  }

  // 显示加载
  function showLoading(text = '加载中...') {
    isLoading.value = true
    loadingText.value = text
  }

  // 隐藏加载
  function hideLoading() {
    isLoading.value = false
    loadingText.value = ''
  }

  return {
    toast,
    isLoading,
    loadingText,
    showToast,
    hideToast,
    showLoading,
    hideLoading
  }
})
