/**
 * API 适配器基类
 * 所有 AI 适配器都必须继承此类并实现抽象方法
 */
export class BaseAdapter {
  constructor(config = {}) {
    this.config = config
    this.name = 'base'
    this.isAvailable = false
  }

  /**
   * 流式聊天
   * @param {Array} messages - 消息数组 [{role: 'user'|'assistant'|'system', content: string}]
   * @yields {string} 流式输出的文本片段
   */
  async *streamChat(messages) {
    throw new Error('streamChat() must be implemented')
  }

  /**
   * 非流式聊天
   * @param {Array} messages - 消息数组
   * @returns {Promise<string>} 完整的回复文本
   */
  async chat(messages) {
    throw new Error('chat() must be implemented')
  }

  /**
   * 健康检查
   * @returns {Promise<boolean>} 服务是否可用
   */
  async healthCheck() {
    throw new Error('healthCheck() must be implemented')
  }

  /**
   * 设置 API Key
   * @param {string} apiKey - API 密钥
   */
  setApiKey(apiKey) {
    this.config.apiKey = apiKey
  }

  /**
   * 获取适配器状态
   * @returns {object} 状态信息
   */
  getStatus() {
    return {
      name: this.name,
      isAvailable: this.isAvailable,
      hasApiKey: !!this.config.apiKey
    }
  }

  /**
   * 格式化消息为标准格式
   * @param {Array} messages - 原始消息数组
   * @returns {Array} 格式化后的消息数组
   */
  formatMessages(messages) {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  }
}
