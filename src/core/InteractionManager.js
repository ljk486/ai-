import { Live2DManager } from './live2d/Live2DManager'
import { HitTestManager } from './live2d/HitTestManager'
import { EyeTracker } from './live2d/EyeTracker'
import { LipSyncManager } from './live2d/LipSyncManager'
import { AIEngine } from './ai/AIEngine'
import { TTSEngine } from './tts/TTSEngine'
import { ClockManager } from './environment/ClockManager'
import { BackgroundSwitcher } from './environment/BackgroundSwitcher'

/**
 * 交互管理器
 * 整合所有模块，管理完整交互流程
 */
export class InteractionManager {
  constructor() {
    // Live2D 模块
    this.live2dManager = new Live2DManager()
    this.hitTestManager = new HitTestManager()
    this.eyeTracker = new EyeTracker()
    this.lipSyncManager = new LipSyncManager()

    // AI 模块
    this.aiEngine = new AIEngine()

    // TTS 模块
    this.ttsEngine = new TTSEngine()

    // 环境模块
    this.clockManager = new ClockManager()
    this.backgroundSwitcher = new BackgroundSwitcher()

    // 状态
    this.isInitialized = false
    this.isProcessing = false

    // 回调函数
    this.onMessage = null
    this.onReaction = null
    this.onBackgroundChange = null
    this.onError = null
  }

  /**
   * 初始化交互管理器
   * @param {HTMLCanvasElement} canvas - Live2D 画布
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   */
  async init(canvas, width, height) {
    try {
      // 初始化 Live2D
      this.live2dManager.init(canvas, width, height)

      // 设置碰撞检测回调
      this.live2dManager.onHitAreaTap = (hitAreas) => {
        this.handleHitAreaTap(hitAreas)
      }

      // 设置模型加载完成回调
      this.live2dManager.onModelLoaded = (model) => {
        this.eyeTracker.init(model)
        this.lipSyncManager.init(model)
      }

      // 加载模型
      await this.live2dManager.loadModel('/models/takagi/haru_greeter_t03.model3.json')

      // 设置时钟监听
      this.clockManager.addListener((data) => {
        this.handleTimeChange(data)
      })

      // 启动时钟监听
      this.clockManager.start(60000)

      // 初始化背景
      const timeInfo = this.clockManager.getTimeInfo()
      this.backgroundSwitcher.switchByPeriod(timeInfo.period)

      this.isInitialized = true
      console.log('交互管理器初始化成功')
    } catch (error) {
      console.error('交互管理器初始化失败:', error)
      if (this.onError) {
        this.onError(error)
      }
      throw error
    }
  }

  /**
   * 处理用户输入
   * @param {string} message - 用户消息
   */
  async handleUserInput(message) {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      // 获取 AI 流式回复
      let fullResponse = ''
      for await (const chunk of this.aiEngine.streamChat(message)) {
        if (chunk.type === 'text') {
          fullResponse += chunk.content
          if (this.onMessage) {
            this.onMessage({
              role: 'assistant',
              content: fullResponse,
              isStreaming: true
            })
          }
        } else if (chunk.type === 'emotion') {
          // 根据情绪触发表情
          this.triggerEmotion(chunk.content)
        }
      }

      // 语音合成
      if (fullResponse) {
        await this.speakText(fullResponse)
      }

      if (this.onMessage) {
        this.onMessage({
          role: 'assistant',
          content: fullResponse,
          isStreaming: false
        })
      }
    } catch (error) {
      console.error('处理用户输入失败:', error)
      if (this.onError) {
        this.onError(error)
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 语音合成并播放
   * @param {string} text - 要合成的文本
   */
  async speakText(text) {
    try {
      // 设置音素回调
      this.ttsEngine.onPhoneme = (phonemes) => {
        this.lipSyncManager.setPhonemes(phonemes)
      }

      // 合成并播放
      await this.ttsEngine.speak(text)
    } catch (error) {
      console.warn('语音合成失败:', error)
      // 语音合成失败不影响主流程
    }
  }

  /**
   * 处理碰撞区域点击
   * @param {string[]} hitAreas - 碰撞区域
   */
  handleHitAreaTap(hitAreas) {
    const reaction = this.hitTestManager.handleHit(hitAreas)

    if (reaction && this.onReaction) {
      this.onReaction(reaction)
    }

    // 播放对应动画
    this.live2dManager.playMotion('Tap', 0, 1)
  }

  /**
   * 处理时间变化
   * @param {object} data - 时间数据
   */
  handleTimeChange(data) {
    // 切换背景
    this.backgroundSwitcher.switchByPeriod(data.period)

    if (this.onBackgroundChange) {
      this.onBackgroundChange(this.backgroundSwitcher.getBackgroundStyle())
    }
  }

  /**
   * 触发表情
   * @param {string} emotion - 情绪类型
   */
  triggerEmotion(emotion) {
    const emotionExpressionMap = {
      happy: 'f00',
      sad: 'f02',
      shy: 'f03',
      angry: 'f04',
      surprised: 'f01',
      embarrassed: 'f03'
    }

    const expression = emotionExpressionMap[emotion]
    if (expression) {
      this.live2dManager.setExpression(expression)
    }
  }

  /**
   * 更新视线追踪
   * @param {number} x - X 坐标 (0-1)
   * @param {number} y - Y 坐标 (0-1)
   */
  updateEyeTracking(x, y) {
    this.eyeTracker.updateTarget(x, y)
    this.live2dManager.setLookAt(x, y)
  }

  /**
   * 设置 API Key
   * @param {string} adapter - 适配器名称
   * @param {string} apiKey - API 密钥
   */
  setApiKey(adapter, apiKey) {
    this.aiEngine.setApiKey(adapter, apiKey)
  }

  /**
   * 切换 AI 适配器
   * @param {string} adapter - 适配器名称
   */
  switchAdapter(adapter) {
    this.aiEngine.switchAdapter(adapter)
  }

  /**
   * 设置音量
   * @param {number} volume - 音量 (0-1)
   */
  setVolume(volume) {
    this.ttsEngine.setVolume(volume)
  }

  /**
   * 获取问候语
   * @returns {string} 问候语
   */
  getGreeting() {
    return this.clockManager.getGreeting()
  }

  /**
   * 获取状态
   * @returns {object} 状态信息
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isProcessing: this.isProcessing,
      ai: this.aiEngine.getStatus(),
      time: this.clockManager.getTimeInfo()
    }
  }

  /**
   * 销毁资源
   */
  destroy() {
    this.clockManager.stop()
    this.live2dManager.destroy()
    this.eyeTracker.destroy()
    this.lipSyncManager.destroy()
    this.ttsEngine.destroy()
  }
}
