import { BaseAdapter } from './BaseAdapter'

/**
 * 千问大模型适配器
 * 对接阿里云千问 API（兼容 OpenAI 格式）
 */
export class QwenAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config)
    this.name = 'qwen'
    this.baseUrl = config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    this.model = config.model || 'qwen-turbo'
    this.maxTokens = config.maxTokens || 1000
    this.temperature = config.temperature || 0.8
  }

  /**
   * 流式聊天
   * @param {Array} messages - 消息数组
   * @yields {string} 流式输出的文本片段
   */
  async *streamChat(messages) {
    if (!this.config.apiKey) {
      throw new Error('千问 API Key 未设置')
    }

    const formattedMessages = this.formatMessages(messages)

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (!trimmed.startsWith('data: ')) continue

          try {
            const data = JSON.parse(trimmed.slice(6))
            const content = data.choices?.[0]?.delta?.content
            if (content) {
              yield content
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    } catch (error) {
      console.error('千问流式请求失败:', error)
      throw error
    }
  }

  /**
   * 非流式聊天
   * @param {Array} messages - 消息数组
   * @returns {Promise<string>} 完整的回复文本
   */
  async chat(messages) {
    if (!this.config.apiKey) {
      throw new Error('千问 API Key 未设置')
    }

    const formattedMessages = this.formatMessages(messages)

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: false
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    } catch (error) {
      console.error('千问请求失败:', error)
      throw error
    }
  }

  /**
   * 健康检查
   * @returns {Promise<boolean>} 服务是否可用
   */
  async healthCheck() {
    try {
      if (!this.config.apiKey) {
        this.isAvailable = false
        return false
      }

      // 发送简单请求测试
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5
        })
      })

      this.isAvailable = response.ok
      return this.isAvailable
    } catch (error) {
      this.isAvailable = false
      return false
    }
  }
}
