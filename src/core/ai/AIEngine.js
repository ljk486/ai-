import { GPTAdapter } from './adapters/GPTAdapter'
import { ClaudeAdapter } from './adapters/ClaudeAdapter'
import { QwenAdapter } from './adapters/QwenAdapter'
import { EmotionAnalyzer } from './EmotionAnalyzer'
import { MemorySystem } from './MemorySystem'

/**
 * AI 引擎调度器
 * 支持运行时切换适配器，内置主备回退策略
 */
export class AIEngine {
  constructor() {
    // 适配器映射
    this.adapters = {
      gpt: new GPTAdapter(),
      claude: new ClaudeAdapter(),
      qwen: new QwenAdapter()
    }

    // 当前主适配器
    this.primaryAdapter = 'gpt'
    // 备用适配器
    this.fallbackAdapter = 'claude'

    // 情感分析器
    this.emotionAnalyzer = new EmotionAnalyzer()
    // 记忆系统
    this.memorySystem = new MemorySystem()

    // 对话历史
    this.conversationHistory = []

    // 角色提示词
    this.systemPrompt = ''
  }

  /**
   * 设置角色提示词
   * @param {string} prompt - 角色提示词
   */
  setSystemPrompt(prompt) {
    this.systemPrompt = prompt
  }

  /**
   * 设置 API Key
   * @param {string} adapter - 适配器名称 ('gpt' | 'claude')
   * @param {string} apiKey - API 密钥
   */
  setApiKey(adapter, apiKey) {
    if (this.adapters[adapter]) {
      this.adapters[adapter].setApiKey(apiKey)
    }
  }

  /**
   * 切换主适配器
   * @param {string} adapter - 适配器名称
   */
  switchAdapter(adapter) {
    if (this.adapters[adapter]) {
      this.primaryAdapter = adapter
      // 更新备用适配器
      const fallbackMap = {
        gpt: 'claude',
        claude: 'gpt',
        qwen: 'gpt'
      }
      this.fallbackAdapter = fallbackMap[adapter] || 'gpt'
    }
  }

  /**
   * 获取当前适配器
   * @returns {BaseAdapter} 当前适配器实例
   */
  getCurrentAdapter() {
    return this.adapters[this.primaryAdapter]
  }

  /**
   * 流式聊天
   * @param {string} userMessage - 用户消息
   * @yields {object} {type: 'text'|'emotion'|'memory', content: string}
   */
  async *streamChat(userMessage) {
    // 分析用户情绪
    const emotion = this.emotionAnalyzer.analyze(userMessage)

    // 获取记忆上下文
    const memoryContext = this.memorySystem.getRelevantContext(userMessage)

    // 构建完整消息
    const messages = this.buildMessages(userMessage, emotion, memoryContext)

    // 尝试主适配器
    try {
      const adapter = this.adapters[this.primaryAdapter]
      let fullResponse = ''

      for await (const chunk of adapter.streamChat(messages)) {
        fullResponse += chunk
        yield { type: 'text', content: chunk }
      }

      // 更新对话历史
      this.addToHistory('user', userMessage)
      this.addToHistory('assistant', fullResponse)

      // 更新记忆
      this.memorySystem.update(userMessage, fullResponse, emotion)

      yield { type: 'emotion', content: emotion }
    } catch (error) {
      console.warn(`主适配器 ${this.primaryAdapter} 失败:`, error)

      // 尝试备用适配器
      try {
        const fallback = this.adapters[this.fallbackAdapter]
        let fullResponse = ''

        for await (const chunk of fallback.streamChat(messages)) {
          fullResponse += chunk
          yield { type: 'text', content: chunk }
        }

        this.addToHistory('user', userMessage)
        this.addToHistory('assistant', fullResponse)
        this.memorySystem.update(userMessage, fullResponse, emotion)

        yield { type: 'emotion', content: emotion }
      } catch (fallbackError) {
        console.error('备用适配器也失败:', fallbackError)
        throw new Error('所有 AI 服务均不可用')
      }
    }
  }

  /**
   * 非流式聊天
   * @param {string} userMessage - 用户消息
   * @returns {Promise<object>} {text: string, emotion: string}
   */
  async chat(userMessage) {
    const emotion = this.emotionAnalyzer.analyze(userMessage)
    const memoryContext = this.memorySystem.getRelevantContext(userMessage)
    const messages = this.buildMessages(userMessage, emotion, memoryContext)

    try {
      const adapter = this.adapters[this.primaryAdapter]
      const response = await adapter.chat(messages)

      this.addToHistory('user', userMessage)
      this.addToHistory('assistant', response)
      this.memorySystem.update(userMessage, response, emotion)

      return { text: response, emotion }
    } catch (error) {
      console.warn(`主适配器 ${this.primaryAdapter} 失败:`, error)

      try {
        const fallback = this.adapters[this.fallbackAdapter]
        const response = await fallback.chat(messages)

        this.addToHistory('user', userMessage)
        this.addToHistory('assistant', response)
        this.memorySystem.update(userMessage, response, emotion)

        return { text: response, emotion }
      } catch (fallbackError) {
        throw new Error('所有 AI 服务均不可用')
      }
    }
  }

  /**
   * 构建完整消息数组
   * @param {string} userMessage - 用户消息
   * @param {string} emotion - 情绪分析结果
   * @param {string} memoryContext - 记忆上下文
   * @returns {Array} 消息数组
   */
  buildMessages(userMessage, emotion, memoryContext) {
    const messages = []

    // 添加系统提示词
    if (this.systemPrompt) {
      let systemContent = this.systemPrompt

      // 添加情绪分析上下文
      if (emotion) {
        systemContent += `\n\n[用户当前情绪: ${emotion}]`
      }

      // 添加记忆上下文
      if (memoryContext) {
        systemContent += `\n\n[记忆上下文: ${memoryContext}]`
      }

      messages.push({
        role: 'system',
        content: systemContent
      })
    }

    // 添加对话历史（保留最近 10 轮）
    const recentHistory = this.conversationHistory.slice(-20)
    messages.push(...recentHistory)

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: userMessage
    })

    return messages
  }

  /**
   * 添加到对话历史
   * @param {string} role - 角色
   * @param {string} content - 内容
   */
  addToHistory(role, content) {
    this.conversationHistory.push({ role, content })

    // 限制历史长度
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50)
    }
  }

  /**
   * 清空对话历史
   */
  clearHistory() {
    this.conversationHistory = []
  }

  /**
   * 获取适配器状态
   * @returns {object} 状态信息
   */
  getStatus() {
    return {
      primaryAdapter: this.primaryAdapter,
      fallbackAdapter: this.fallbackAdapter,
      adapters: {
        gpt: this.adapters.gpt.getStatus(),
        claude: this.adapters.claude.getStatus(),
        qwen: this.adapters.qwen.getStatus()
      },
      historyLength: this.conversationHistory.length
    }
  }

  /**
   * 健康检查所有适配器
   * @returns {Promise<object>} 健康状态
   */
  async healthCheckAll() {
    const results = {}
    for (const [name, adapter] of Object.entries(this.adapters)) {
      results[name] = await adapter.healthCheck()
    }
    return results
  }
}
