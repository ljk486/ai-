/**
 * 浏览器内置 TTS 引擎
 * 使用 Web Speech API 实现语音合成
 */
export class BrowserTTSEngine {
  constructor() {
    this.synth = window.speechSynthesis
    this.voice = null
    this.rate = 1.0
    this.pitch = 1.0
    this.volume = 1.0
    this.isSpeaking = false
    this.isPaused = false

    // 回调函数
    this.onStart = null
    this.onEnd = null
    this.onPhoneme = null
    this.onError = null

    // 口型同步相关
    this.mouthOpenCallback = null
    this.mouthAnimationTimer = null

    // 初始化语音
    this.initVoice()
  }

  /**
   * 初始化语音
   */
  initVoice() {
    // 等待语音列表加载
    if (this.synth.getVoices().length === 0) {
      this.synth.onvoiceschanged = () => {
        this.selectVoice()
      }
    } else {
      this.selectVoice()
    }
  }

  /**
   * 选择语音
   */
  selectVoice() {
    const voices = this.synth.getVoices()

    // 优先选择中文女声
    const zhFemaleVoices = voices.filter(v =>
      v.lang.startsWith('zh') &&
      (v.name.includes('Female') || v.name.includes('女') ||
       v.name.includes('Xiaoxiao') || v.name.includes('Xiaoyi') ||
       v.name.includes('Tingting') || v.name.includes('Lili') ||
       v.name.includes('Yaoyao') || v.name.includes('Kangkang'))
    )

    const zhVoices = voices.filter(v => v.lang.startsWith('zh'))

    // 优先选择中文女声，然后是中文语音，最后是任何语音
    this.voice = zhFemaleVoices[0] || zhVoices[0] || voices[0]

    // 设置更可爱的音调参数
    this.pitch = 1.2  // 提高音调，让声音更可爱
    this.rate = 1.0   // 正常语速

    console.log('选择语音:', this.voice?.name, '音调:', this.pitch, '语速:', this.rate)
  }

  /**
   * 播放文本
   * @param {string} text - 要播放的文本
   * @returns {Promise<void>}
   */
  speak(text) {
    return new Promise((resolve, reject) => {
      if (!text) {
        resolve()
        return
      }

      // 停止当前播放
      this.stop()

      // 创建语音对象
      const utterance = new SpeechSynthesisUtterance(text)

      // 设置语音参数
      if (this.voice) {
        utterance.voice = this.voice
      }
      utterance.rate = this.rate
      utterance.pitch = this.pitch
      utterance.volume = this.volume

      // 开始回调
      utterance.onstart = () => {
        this.isSpeaking = true
        this.startMouthAnimation()
        if (this.onStart) {
          this.onStart()
        }
      }

      // 结束回调
      utterance.onend = () => {
        this.isSpeaking = false
        this.stopMouthAnimation()
        if (this.onEnd) {
          this.onEnd()
        }
        resolve()
      }

      // 错误回调
      utterance.onerror = (event) => {
        this.isSpeaking = false
        this.stopMouthAnimation()
        if (this.onError) {
          this.onError(event.error)
        }
        reject(event.error)
      }

      // 开始播放
      this.synth.speak(utterance)
    })
  }

  /**
   * 开始口型动画
   */
  startMouthAnimation() {
    this.stopMouthAnimation()

    // 模拟口型动画
    let isOpen = false
    this.mouthAnimationTimer = setInterval(() => {
      if (!this.isSpeaking) {
        this.stopMouthAnimation()
        return
      }

      isOpen = !isOpen
      const openY = isOpen ? 0.5 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2

      if (this.mouthOpenCallback) {
        this.mouthOpenCallback(openY)
      }
    }, 100)
  }

  /**
   * 停止口型动画
   */
  stopMouthAnimation() {
    if (this.mouthAnimationTimer) {
      clearInterval(this.mouthAnimationTimer)
      this.mouthAnimationTimer = null
    }

    // 闭合嘴巴
    if (this.mouthOpenCallback) {
      this.mouthOpenCallback(0)
    }
  }

  /**
   * 设置口型回调
   * @param {function} callback - 口型参数回调
   */
  setMouthCallback(callback) {
    this.mouthOpenCallback = callback
  }

  /**
   * 暂停播放
   */
  pause() {
    if (this.isSpeaking) {
      this.synth.pause()
      this.isPaused = true
    }
  }

  /**
   * 恢复播放
   */
  resume() {
    if (this.isPaused) {
      this.synth.resume()
      this.isPaused = false
    }
  }

  /**
   * 停止播放
   */
  stop() {
    this.synth.cancel()
    this.isSpeaking = false
    this.isPaused = false
    this.stopMouthAnimation()
  }

  /**
   * 设置语速
   * @param {number} rate - 语速 (0.1 - 10)
   */
  setRate(rate) {
    this.rate = Math.max(0.1, Math.min(10, rate))
  }

  /**
   * 设置音调
   * @param {number} pitch - 音调 (0 - 2)
   */
  setPitch(pitch) {
    this.pitch = Math.max(0, Math.min(2, pitch))
  }

  /**
   * 设置音量
   * @param {number} volume - 音量 (0 - 1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * 获取可用语音列表
   * @returns {SpeechSynthesisVoice[]}
   */
  getVoices() {
    return this.synth.getVoices()
  }

  /**
   * 设置语音
   * @param {string} voiceName - 语音名称
   */
  setVoice(voiceName) {
    const voices = this.synth.getVoices()
    const voice = voices.find(v => v.name === voiceName)
    if (voice) {
      this.voice = voice
    }
  }

  /**
   * 销毁资源
   */
  destroy() {
    this.stop()
    this.mouthOpenCallback = null
  }
}
