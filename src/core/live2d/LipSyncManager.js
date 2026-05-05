import { PhonemeMapper } from '../tts/PhonemeMapper'

/**
 * 口型同步管理器
 * 驱动 Live2D 模型的口型参数
 */
export class LipSyncManager {
  constructor() {
    this.model = null
    this.phonemeMapper = new PhonemeMapper()
    this.isEnabled = true
    this.animationFrame = null
    this.phonemeQueue = []
    this.currentPhoneme = null
    this.phonemeStartTime = 0
    this.isSpeaking = false
  }

  /**
   * 初始化口型同步
   * @param {object} model - Live2D 模型实例
   */
  init(model) {
    this.model = model
    this.startAnimation()
  }

  /**
   * 开始口型动画循环
   */
  startAnimation() {
    const animate = () => {
      if (!this.isEnabled || !this.model) return

      this.updateMouth()
      this.animationFrame = requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * 更新口型参数
   */
  updateMouth() {
    if (!this.model || !this.model.internalModel) return

    try {
      const coreModel = this.model.internalModel.coreModel
      const now = performance.now()

      // 处理音素队列
      if (this.phonemeQueue.length > 0) {
        const phoneme = this.phonemeQueue[0]

        // 检查是否需要切换到下一个音素
        if (!this.currentPhoneme || now - this.phonemeStartTime >= phoneme.duration * 1000) {
          this.currentPhoneme = phoneme
          this.phonemeStartTime = now
          this.phonemeQueue.shift()
        }

        // 设置口型参数
        const mouthShape = this.phonemeMapper.getMouthShape(phoneme.phoneme)
        const smoothed = this.phonemeMapper.smooth(mouthShape)

        coreModel.setParameterValueById('ParamMouthOpenY', smoothed.openY)
        coreModel.setParameterValueById('ParamMouthForm', smoothed.form)
      } else {
        // 没有音素时，闭合嘴巴
        const smoothed = this.phonemeMapper.smooth({ openY: 0, form: 0 })
        coreModel.setParameterValueById('ParamMouthOpenY', smoothed.openY)
        coreModel.setParameterValueById('ParamMouthForm', smoothed.form)
      }
    } catch (error) {
      // 忽略参数设置错误
    }
  }

  /**
   * 设置音素序列
   * @param {Array} phonemes - 音素数组 [{phoneme: string, duration: number}]
   */
  setPhonemes(phonemes) {
    this.phonemeQueue = phonemes
    this.currentPhoneme = null
    this.isSpeaking = phonemes.length > 0
  }

  /**
   * 添加音素到队列
   * @param {string} phoneme - 音素
   * @param {number} duration - 持续时间（秒）
   */
  addPhoneme(phoneme, duration = 0.1) {
    this.phonemeQueue.push({ phoneme, duration })
    this.isSpeaking = true
  }

  /**
   * 直接设置口型参数
   * @param {number} openY - 张嘴程度 (0-1)
   * @param {number} form - 嘴型形状 (-1 到 1)
   */
  setMouthShape(openY, form) {
    if (!this.model || !this.model.internalModel) return

    try {
      const coreModel = this.model.internalModel.coreModel
      coreModel.setParameterValueById('ParamMouthOpenY', openY)
      coreModel.setParameterValueById('ParamMouthForm', form)
    } catch (error) {
      // 忽略参数设置错误
    }
  }

  /**
   * 停止说话并闭合嘴巴
   */
  stopSpeaking() {
    this.phonemeQueue = []
    this.currentPhoneme = null
    this.isSpeaking = false
  }

  /**
   * 启用/禁用口型同步
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.isEnabled = enabled
    if (!enabled) {
      this.stopSpeaking()
    }
  }

  /**
   * 设置平滑系数
   * @param {number} smoothing - 平滑系数 (0-1)
   */
  setSmoothing(smoothing) {
    this.phonemeMapper.smoothing = smoothing
  }

  /**
   * 停止动画循环
   */
  stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  /**
   * 销毁资源
   */
  destroy() {
    this.stopAnimation()
    this.stopSpeaking()
    this.model = null
  }
}
