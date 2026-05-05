/**
 * Edge TTS 引擎
 * 使用微软 Edge TTS 服务，提供高质量的日语女声
 */
export class EdgeTTSEngine {
  constructor() {
    this.isPlaying = false
    this.audioElement = null
    this.mouthOpenCallback = null
    this.mouthAnimationTimer = null

    // Edge TTS 语音列表（高质量日语女声）
    this.voices = {
      // 日语女声（推荐）
      'ja-JP-NanamiNeural': { name: 'nanami', lang: 'ja', gender: 'female', desc: '温柔可爱' },
      'ja-JP-MayuNeural': { name: 'mayu', lang: 'ja', gender: 'female', desc: '活泼开朗' },
      'ja-JP-AoiNeural': { name: 'aoi', lang: 'ja', gender: 'female', desc: '甜美清新' },
      'ja-JP-ShioriNeural': { name: 'shiori', lang: 'ja', gender: 'female', desc: '知性优雅' },
      // 中文女声
      'zh-CN-XiaoxiaoNeural': { name: 'xiaoxiao', lang: 'zh', gender: 'female', desc: '温柔甜美' },
      'zh-CN-XiaoyiNeural': { name: 'xiaoyi', lang: 'zh', gender: 'female', desc: '活泼可爱' },
    }

    // 当前选择的语音
    this.currentVoice = 'ja-JP-NanamiNeural'

    // TTS API 地址（使用免费的公共代理）
    this.apiBaseUrl = 'https://edge-tts-api.vercel.app/api/tts'

    // 初始化
    this.init()
  }

  init() {
    // 创建音频元素
    this.audioElement = new Audio()
    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false
      this.stopMouthAnimation()
    })
    this.audioElement.addEventListener('error', (e) => {
      console.error('音频播放错误:', e)
      this.isPlaying = false
      this.stopMouthAnimation()
    })
  }

  /**
   * 设置语音
   * @param {string} voiceKey - 语音标识
   */
  setVoice(voiceKey) {
    if (this.voices[voiceKey]) {
      this.currentVoice = voiceKey
    }
  }

  /**
   * 获取可用语音列表
   * @returns {object} 语音列表
   */
  getVoices() {
    return { ...this.voices }
  }

  /**
   * 播放文本
   * @param {string} text - 要播放的文本
   * @returns {Promise<void>}
   */
  async speak(text) {
    if (!text) return

    // 停止当前播放
    this.stop()

    try {
      this.isPlaying = true
      this.startMouthAnimation()

      // 调用 Edge TTS API
      const audioUrl = await this.fetchAudio(text)

      if (audioUrl) {
        this.audioElement.src = audioUrl
        await this.audioElement.play()
      }
    } catch (error) {
      console.error('TTS 播放失败:', error)
      this.isPlaying = false
      this.stopMouthAnimation()
      // 降级到浏览器内置 TTS
      this.fallbackSpeak(text)
    }
  }

  /**
   * 获取音频 URL
   * @param {string} text - 文本
   * @returns {Promise<string>} 音频 URL
   */
  async fetchAudio(text) {
    try {
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: this.currentVoice,
          rate: '+0%',
          pitch: '+0Hz',
          volume: '+0%'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Edge TTS API 请求失败:', error)
      return null
    }
  }

  /**
   * 降级到浏览器内置 TTS
   * @param {string} text - 文本
   */
  fallbackSpeak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)

      // 选择日语语音
      const voices = speechSynthesis.getVoices()
      const jaVoice = voices.find(v => v.lang.startsWith('ja')) || voices[0]
      if (jaVoice) {
        utterance.voice = jaVoice
      }

      utterance.lang = 'ja-JP'
      utterance.pitch = 1.2
      utterance.rate = 1.0

      utterance.onstart = () => {
        this.isPlaying = true
        this.startMouthAnimation()
      }

      utterance.onend = () => {
        this.isPlaying = false
        this.stopMouthAnimation()
      }

      speechSynthesis.speak(utterance)
    }
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
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
    }
    this.isPlaying = false
    this.stopMouthAnimation()
  }

  /**
   * 设置音量
   * @param {number} volume - 音量 (0-1)
   */
  setVolume(volume) {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * 销毁资源
   */
  destroy() {
    this.stop()
    if (this.audioElement) {
      this.audioElement.src = ''
      this.audioElement = null
    }
    this.mouthOpenCallback = null
  }
}
