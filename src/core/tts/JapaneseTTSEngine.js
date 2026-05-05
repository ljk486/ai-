/**
 * 日语 TTS 引擎
 * 使用浏览器内置 Web Speech API，优化日语女声
 */
export class JapaneseTTSEngine {
  constructor() {
    this.synth = window.speechSynthesis
    this.voice = null
    this.rate = 1.0
    this.pitch = 1.3
    this.volume = 1.0
    this.isPlaying = false

    // 回调函数
    this.mouthOpenCallback = null
    this.mouthAnimationTimer = null

    // 可用语音列表
    this.availableVoices = []

    // 初始化
    this.init()
  }

  init() {
    // 等待语音列表加载
    if (this.synth.getVoices().length === 0) {
      this.synth.onvoiceschanged = () => {
        this.loadVoices()
        this.selectBestVoice()
      }
    } else {
      this.loadVoices()
      this.selectBestVoice()
    }
  }

  /**
   * 加载可用语音
   */
  loadVoices() {
    const allVoices = this.synth.getVoices()

    // 筛选日语和中文语音
    this.availableVoices = allVoices.filter(v =>
      v.lang.startsWith('ja') || v.lang.startsWith('zh')
    )

    console.log('可用语音:', this.availableVoices.map(v => `${v.name} (${v.lang})`))
  }

  /**
   * 选择最佳语音
   */
  selectBestVoice() {
    const voices = this.availableVoices

    // 优先选择日语女声
    const jaFemaleVoices = voices.filter(v =>
      v.lang.startsWith('ja') &&
      (v.name.includes('Female') || v.name.includes('female') ||
       !v.name.includes('Male'))
    )

    // 日语语音
    const jaVoices = voices.filter(v => v.lang.startsWith('ja'))

    // 中文女声
    const zhFemaleVoices = voices.filter(v =>
      v.lang.startsWith('zh') &&
      (v.name.includes('Female') || v.name.includes('女') ||
       v.name.includes('Xiaoxiao') || v.name.includes('Xiaoyi'))
    )

    // 选择优先级：日语女声 > 日语语音 > 中文女声 > 任何语音
    this.voice = jaFemaleVoices[0] || jaVoices[0] || zhFemaleVoices[0] || voices[0]

    if (this.voice) {
      console.log('选择语音:', this.voice.name, '语言:', this.voice.lang)
    }
  }

  /**
   * 获取可用语音列表
   * @returns {Array} 语音列表
   */
  getVoices() {
    return this.availableVoices.map(v => ({
      name: v.name,
      lang: v.lang,
      voiceURI: v.voiceURI
    }))
  }

  /**
   * 设置语音
   * @param {string} voiceName - 语音名称
   */
  setVoice(voiceName) {
    const voice = this.availableVoices.find(v => v.name === voiceName)
    if (voice) {
      this.voice = voice
      console.log('切换语音:', voice.name)
    }
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
      utterance.lang = 'ja-JP'
      utterance.rate = this.rate
      utterance.pitch = this.pitch
      utterance.volume = this.volume

      // 开始回调
      utterance.onstart = () => {
        this.isPlaying = true
        this.startMouthAnimation()
      }

      // 结束回调
      utterance.onend = () => {
        this.isPlaying = false
        this.stopMouthAnimation()
        resolve()
      }

      // 错误回调
      utterance.onerror = (event) => {
        this.isPlaying = false
        this.stopMouthAnimation()
        console.error('TTS 错误:', event.error)
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

    let isOpen = false
    this.mouthAnimationTimer = setInterval(() => {
      if (!this.isPlaying) {
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
   * 停止播放
   */
  stop() {
    this.synth.cancel()
    this.isPlaying = false
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
   * 销毁资源
   */
  destroy() {
    this.stop()
    this.mouthOpenCallback = null
  }
}
