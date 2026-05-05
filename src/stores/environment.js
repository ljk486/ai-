import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ClockManager } from '../core/environment/ClockManager'
import { BackgroundSwitcher } from '../core/environment/BackgroundSwitcher'

export const useEnvironmentStore = defineStore('environment', () => {
  // 时钟管理器
  const clockManager = new ClockManager()
  // 背景切换器
  const backgroundSwitcher = new BackgroundSwitcher()

  // 当前时间段
  const currentTimePeriod = ref('afternoon')
  // 当前问候语
  const currentGreeting = ref('')
  // 当前时间描述
  const currentTimeDescription = ref('')
  // 自定义背景
  const customBackground = ref(null)

  // 计算当前背景（优先使用自定义背景）
  const currentBackground = computed(() => {
    if (customBackground.value) {
      return customBackground.value
    }
    return backgroundSwitcher.getBackgroundStyle().background
  })

  // 更新时间段
  function updateTimePeriod() {
    const timeInfo = clockManager.getTimeInfo()
    currentTimePeriod.value = timeInfo.period
    currentGreeting.value = timeInfo.greeting
    currentTimeDescription.value = timeInfo.description
    backgroundSwitcher.switchByPeriod(timeInfo.period)
  }

  // 设置自定义背景
  function setBackground(gradient) {
    customBackground.value = gradient
  }

  // 清除自定义背景（恢复自动）
  function clearCustomBackground() {
    customBackground.value = null
  }

  // 初始化时更新时间
  updateTimePeriod()

  // 监听时间变化
  clockManager.addListener((data) => {
    currentTimePeriod.value = data.period
    currentGreeting.value = data.greeting
    currentTimeDescription.value = data.description
    backgroundSwitcher.switchByPeriod(data.period)
  })

  // 启动时钟监听
  clockManager.start(60000) // 每分钟更新一次

  return {
    currentTimePeriod,
    currentGreeting,
    currentTimeDescription,
    currentBackground,
    updateTimePeriod,
    setBackground,
    clearCustomBackground
  }
})
