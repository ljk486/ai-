/**
 * 错误处理器
 * 统一处理各类错误并提供友好的错误提示
 */
export class ErrorHandler {
  constructor() {
    this.errorMessages = {
      // API 相关错误
      'API_KEY_MISSING': '请先在设置中配置 API Key',
      'API_KEY_INVALID': 'API Key 无效，请检查后重新输入',
      'API_QUOTA_EXCEEDED': 'API 调用次数已达上限，请稍后再试',
      'API_RATE_LIMITED': '请求过于频繁，请稍后再试',
      'API_SERVER_ERROR': '服务器暂时不可用，请稍后再试',

      // 网络相关错误
      'NETWORK_ERROR': '网络连接失败，请检查网络设置',
      'NETWORK_TIMEOUT': '网络请求超时，请稍后再试',
      'NETWORK_OFFLINE': '当前处于离线状态',

      // Live2D 相关错误
      'MODEL_LOAD_FAILED': '模型加载失败，请刷新页面重试',
      'MODEL_NOT_FOUND': '找不到模型文件',
      'WEBGL_NOT_SUPPORTED': '您的浏览器不支持 WebGL',

      // TTS 相关错误
      'TTS_SERVER_UNAVAILABLE': '语音服务暂时不可用',
      'TTS_CONNECTION_FAILED': '无法连接到语音服务器',
      'TTS_SYNTHESIS_FAILED': '语音合成失败',

      // 未知错误
      'UNKNOWN_ERROR': '发生了未知错误，请刷新页面重试'
    }
  }

  /**
   * 获取友好的错误消息
   * @param {Error|string} error - 错误对象或错误代码
   * @returns {string} 友好的错误消息
   */
  getFriendlyMessage(error) {
    if (typeof error === 'string') {
      return this.errorMessages[error] || this.errorMessages['UNKNOWN_ERROR']
    }

    if (error instanceof Error) {
      // 根据错误消息匹配
      const message = error.message.toLowerCase()

      if (message.includes('api key') || message.includes('api_key')) {
        return this.errorMessages['API_KEY_MISSING']
      }
      if (message.includes('unauthorized') || message.includes('401')) {
        return this.errorMessages['API_KEY_INVALID']
      }
      if (message.includes('quota') || message.includes('429')) {
        return this.errorMessages['API_QUOTA_EXCEEDED']
      }
      if (message.includes('rate limit')) {
        return this.errorMessages['API_RATE_LIMITED']
      }
      if (message.includes('network') || message.includes('fetch')) {
        return this.errorMessages['NETWORK_ERROR']
      }
      if (message.includes('timeout')) {
        return this.errorMessages['NETWORK_TIMEOUT']
      }
      if (message.includes('model') || message.includes('moc3')) {
        return this.errorMessages['MODEL_LOAD_FAILED']
      }
      if (message.includes('websocket') || message.includes('tts')) {
        return this.errorMessages['TTS_SERVER_UNAVAILABLE']
      }
    }

    return this.errorMessages['UNKNOWN_ERROR']
  }

  /**
   * 处理错误并显示提示
   * @param {Error|string} error - 错误
   * @param {function} showToast - 显示提示的函数
   */
  handleError(error, showToast) {
    const message = this.getFriendlyMessage(error)
    console.error('Error:', error)

    if (showToast) {
      showToast(message, 'error')
    }

    return message
  }

  /**
   * 检查是否为网络错误
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否为网络错误
   */
  isNetworkError(error) {
    if (!(error instanceof Error)) return false

    const message = error.message.toLowerCase()
    return message.includes('network') ||
           message.includes('fetch') ||
           message.includes('timeout') ||
           message.includes('offline')
  }

  /**
   * 检查是否为 API 错误
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否为 API 错误
   */
  isAPIError(error) {
    if (!(error instanceof Error)) return false

    const message = error.message.toLowerCase()
    return message.includes('api') ||
           message.includes('unauthorized') ||
           message.includes('quota') ||
           message.includes('rate limit')
  }

  /**
   * 添加自定义错误消息
   * @param {string} code - 错误代码
   * @param {string} message - 错误消息
   */
  addErrorMessage(code, message) {
    this.errorMessages[code] = message
  }
}
