import { BaseAdapter } from './BaseAdapter'

/**
 * Claude 适配器
 * 对接 Anthropic Messages API（流式）
 */
export class ClaudeAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config)
    this.name = 'claude'
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com'
    this.model = config.model || 'claude-3-5-sonnet-20241022'
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
      throw new Error('Claude API Key 未设置')
    }

    const { system, formattedMessages } = this.formatClaudeMessages(messages)

    try {
      const body = {
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: formattedMessages,
        stream: true
      }

      if (system) {
        body.system = system
      }

      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
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
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          try {
            const data = JSON.parse(trimmed.slice(6))
            if (data.type === 'content_block_delta') {
              const content = data.delta?.text
              if (content) {
                yield content
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    } catch (error) {
      console.error('Claude 流式请求失败:', error)
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
      throw new Error('Claude API Key 未设置')
    }

    const { system, formattedMessages } = this.formatClaudeMessages(messages)

    try {
      const body = {
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: formattedMessages
      }

      if (system) {
        body.system = system
      }

      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.content?.[0]?.text || ''
    } catch (error) {
      console.error('Claude 请求失败:', error)
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

      // Claude 没有专门的健康检查端点，尝试发送一个简单请求
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      })

      this.isAvailable = response.ok || response.status === 400 // 400 也表示 API 可用
      return this.isAvailable
    } catch (error) {
      this.isAvailable = false
      return false
    }
  }

  /**
   * 格式化消息为 Claude 格式
   * Claude API 将 system 消息单独处理
   * @param {Array} messages - 原始消息数组
   * @returns {object} {system: string, formattedMessages: Array}
   */
  formatClaudeMessages(messages) {
    let system = ''
    const formattedMessages = []

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = msg.content
      } else {
        formattedMessages.push({
          role: msg.role,
          content: msg.content
        })
      }
    }

    return { system, formattedMessages }
  }
}
