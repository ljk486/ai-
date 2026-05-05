/**
 * 时钟管理器
 * 获取系统时间，划分时段
 */
export class ClockManager {
  constructor() {
    this.currentTime = new Date()
    this.currentPeriod = this.calculatePeriod()
    this.listeners = []
    this.updateInterval = null
  }

  /**
   * 开始监听时间变化
   * @param {number} interval - 更新间隔（毫秒）
   */
  start(interval = 60000) {
    this.updateInterval = setInterval(() => {
      this.update()
    }, interval)
  }

  /**
   * 停止监听
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  /**
   * 更新时间
   */
  update() {
    const now = new Date()
    const oldPeriod = this.currentPeriod

    this.currentTime = now
    this.currentPeriod = this.calculatePeriod()

    // 如果时段发生变化，通知监听器
    if (oldPeriod !== this.currentPeriod) {
      this.notifyListeners()
    }
  }

  /**
   * 计算当前时段
   * @returns {string} 时段名称
   */
  calculatePeriod() {
    const hour = this.currentTime.getHours()

    if (hour >= 5 && hour < 9) {
      return 'morning'
    } else if (hour >= 9 && hour < 12) {
      return 'forenoon'
    } else if (hour >= 12 && hour < 14) {
      return 'noon'
    } else if (hour >= 14 && hour < 17) {
      return 'afternoon'
    } else if (hour >= 17 && hour < 20) {
      return 'evening'
    } else {
      return 'night'
    }
  }

  /**
   * 获取时段描述
   * @param {string} period - 时段名称
   * @returns {string} 时段描述
   */
  getPeriodDescription(period) {
    const descriptions = {
      morning: '清晨',
      forenoon: '上午',
      noon: '中午',
      afternoon: '下午',
      evening: '傍晚',
      night: '夜晚'
    }
    return descriptions[period] || '未知'
  }

  /**
   * 获取问候语
   * @returns {string} 问候语
   */
  getGreeting() {
    const greetings = {
      morning: '早上好，西片！今天也精神满满呢～',
      forenoon: '上午好，西片同学！上课要认真听讲哦～',
      noon: '午休时间到了，西片～吃饭了吗？',
      afternoon: '下午好，西片！有点困了吧？',
      evening: '放学了呢，西片～一起回家吗？',
      night: '这么晚了还不睡，西片你在做什么呢？'
    }
    return greetings[this.currentPeriod] || '你好，西片！'
  }

  /**
   * 添加时间变化监听器
   * @param {function} listener - 监听器函数
   */
  addListener(listener) {
    this.listeners.push(listener)
  }

  /**
   * 移除监听器
   * @param {function} listener - 监听器函数
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  /**
   * 通知所有监听器
   */
  notifyListeners() {
    const data = {
      time: this.currentTime,
      period: this.currentPeriod,
      description: this.getPeriodDescription(this.currentPeriod),
      greeting: this.getGreeting()
    }

    this.listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error('时钟监听器错误:', error)
      }
    })
  }

  /**
   * 获取当前时间信息
   * @returns {object} 时间信息
   */
  getTimeInfo() {
    return {
      time: this.currentTime,
      period: this.currentPeriod,
      description: this.getPeriodDescription(this.currentPeriod),
      greeting: this.getGreeting()
    }
  }

  /**
   * 格式化时间
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }
}
