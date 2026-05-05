/**
 * 记忆系统
 * 记录用户互动频次与常见的"败北"倾向
 */
export class MemorySystem {
  constructor() {
    // 用户档案
    this.userProfile = {
      interactionCount: 0,
      shyCount: 0,
      embarrassedCount: 0,
      lastInteraction: null,
      commonTopics: [],
      defeatTendencies: [], // "败北"倾向
      favoriteTopics: [],   // 喜欢的话题
      interactionHistory: [] // 互动历史
    }

    // 对话摘要
    this.conversationSummaries = []

    // 从本地存储加载
    this.loadFromStorage()
  }

  /**
   * 更新记忆
   * @param {string} userMessage - 用户消息
   * @param {string} aiResponse - AI 回复
   * @param {string} emotion - 情绪类型
   */
  update(userMessage, aiResponse, emotion) {
    // 更新交互计数
    this.userProfile.interactionCount++
    this.userProfile.lastInteraction = new Date().toISOString()

    // 更新情绪统计
    if (emotion === 'shy') {
      this.userProfile.shyCount++
    } else if (emotion === 'embarrassed') {
      this.userProfile.embarrassedCount++
    }

    // 检测"败北"倾向
    this.detectDefeatTendency(userMessage, emotion)

    // 提取话题
    this.extractTopics(userMessage)

    // 记录互动历史
    this.recordInteraction(userMessage, aiResponse, emotion)

    // 保存到本地存储
    this.saveToStorage()
  }

  /**
   * 检测"败北"倾向
   * @param {string} message - 用户消息
   * @param {string} emotion - 情绪类型
   */
  detectDefeatTendency(message, emotion) {
    // 害羞或尴尬时可能有"败北"倾向
    if (emotion === 'shy' || emotion === 'embarrassed') {
      const tendency = {
        timestamp: new Date().toISOString(),
        message: message.substring(0, 50), // 只保留前50字
        emotion
      }

      this.userProfile.defeatTendencies.push(tendency)

      // 只保留最近20条
      if (this.userProfile.defeatTendencies.length > 20) {
        this.userProfile.defeatTendencies = this.userProfile.defeatTendencies.slice(-20)
      }
    }
  }

  /**
   * 提取话题关键词
   * @param {string} message - 用户消息
   */
  extractTopics(message) {
    // 简单的话题关键词提取
    const topicKeywords = {
      '学习': ['考试', '作业', '上课', '老师', '学校', '成绩'],
      '游戏': ['游戏', '玩', '比赛', '赢', '输', '对战'],
      '食物': ['吃', '饭', '零食', '好吃', '饿', '午餐'],
      '动漫': ['动漫', '动画', '漫画', '角色', '剧情'],
      '运动': ['运动', '跑步', '体育', '锻炼', '球'],
      '音乐': ['音乐', '歌', '听', '唱', '钢琴'],
      '天气': ['天气', '下雨', '晴天', '热', '冷']
    }

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        if (!this.userProfile.commonTopics.includes(topic)) {
          this.userProfile.commonTopics.push(topic)
          // 只保留最近10个话题
          if (this.userProfile.commonTopics.length > 10) {
            this.userProfile.commonTopics = this.userProfile.commonTopics.slice(-10)
          }
        }
      }
    }
  }

  /**
   * 记录互动历史
   * @param {string} userMessage - 用户消息
   * @param {string} aiResponse - AI 回复
   * @param {string} emotion - 情绪类型
   */
  recordInteraction(userMessage, aiResponse, emotion) {
    const interaction = {
      timestamp: new Date().toISOString(),
      userMessage: userMessage.substring(0, 100),
      aiResponse: aiResponse.substring(0, 100),
      emotion
    }

    this.userProfile.interactionHistory.push(interaction)

    // 只保留最近50条记录
    if (this.userProfile.interactionHistory.length > 50) {
      this.userProfile.interactionHistory = this.userProfile.interactionHistory.slice(-50)
    }
  }

  /**
   * 获取相关上下文
   * @param {string} currentMessage - 当前消息
   * @returns {string} 相关上下文
   */
  getRelevantContext(currentMessage) {
    const contexts = []

    // 添加交互统计
    if (this.userProfile.interactionCount > 0) {
      contexts.push(`这是第 ${this.userProfile.interactionCount} 次对话`)
    }

    // 添加害羞统计
    if (this.userProfile.shyCount > 3) {
      contexts.push(`用户经常害羞（已害羞 ${this.userProfile.shyCount} 次）`)
    }

    // 添加败北倾向
    if (this.userProfile.defeatTendencies.length > 0) {
      const recentDefeats = this.userProfile.defeatTendencies.slice(-3)
      const defeatMessages = recentDefeats.map(d => d.message).join('、')
      contexts.push(`用户曾因 "${defeatMessages}" 表现出害羞`)
    }

    // 添加常见话题
    if (this.userProfile.commonTopics.length > 0) {
      contexts.push(`用户常聊话题: ${this.userProfile.commonTopics.join('、')}`)
    }

    return contexts.length > 0 ? contexts.join('；') : ''
  }

  /**
   * 获取用户档案
   * @returns {object} 用户档案
   */
  getUserProfile() {
    return { ...this.userProfile }
  }

  /**
   * 获取互动统计
   * @returns {object} 统计信息
   */
  getStats() {
    return {
      totalInteractions: this.userProfile.interactionCount,
      shyCount: this.userProfile.shyCount,
      embarrassedCount: this.userProfile.embarrassedCount,
      commonTopics: this.userProfile.commonTopics,
      defeatCount: this.userProfile.defeatTendencies.length
    }
  }

  /**
   * 保存到本地存储
   */
  saveToStorage() {
    try {
      localStorage.setItem('takagi_memory', JSON.stringify(this.userProfile))
    } catch (error) {
      console.warn('保存记忆失败:', error)
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('takagi_memory')
      if (data) {
        const parsed = JSON.parse(data)
        Object.assign(this.userProfile, parsed)
      }
    } catch (error) {
      console.warn('加载记忆失败:', error)
    }
  }

  /**
   * 清空记忆
   */
  clear() {
    this.userProfile = {
      interactionCount: 0,
      shyCount: 0,
      embarrassedCount: 0,
      lastInteraction: null,
      commonTopics: [],
      defeatTendencies: [],
      favoriteTopics: [],
      interactionHistory: []
    }
    this.conversationSummaries = []
    localStorage.removeItem('takagi_memory')
  }
}
