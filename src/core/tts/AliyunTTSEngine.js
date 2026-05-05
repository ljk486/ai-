/**
 * 阿里云 TTS 引擎
 * 使用 DashScope API 实现高质量语音合成
 */
export class AliyunTTSEngine {
  constructor() {
    this.isPlaying = false
    this.audioElement = null
    this.audioContext = null
    this.mouthOpenCallback = null
    this.mouthAnimationTimer = null

    // API 配置
    this.apiKey = ''
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2audio/generation'

    // 音色列表（日语女声）
    this.voices = {
      'ja-JP-MayuNeural': { name: 'Mayu', lang: 'ja', gender: 'female', desc: '温柔可爱' },
      'ja-JP-NanamiNeural': { name: 'Nanami', lang: 'ja', gender: 'female', desc: '甜美清新' },
      'ja-JP-AoiNeural': { name: 'Aoi', lang: 'ja', gender: 'female', desc: '活泼开朗' },
      'ja-JP-ShioriNeural': { name: 'Shiori', lang: 'ja', gender: 'female', desc: '知性优雅' },
      'zh-CN-XiaoxiaoNeural': { name: 'Xiaoxiao', lang: 'zh', gender: 'female', desc: '温柔甜美' },
      'zh-CN-XiaoyiNeural': { name: 'Xiaoyi', lang: 'zh', gender: 'female', desc: '活泼可爱' },
    }

    // 当前选择的音色
    this.currentVoice = 'ja-JP-MayuNeural'

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
   * 设置 API Key
   * @param {string} apiKey - 阿里云 DashScope API Key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey
  }

  /**
   * 设置音色
   * @param {string} voiceKey - 音色标识
   */
  setVoice(voiceKey) {
    if (this.voices[voiceKey]) {
      this.currentVoice = voiceKey
    }
  }

  /**
   * 获取可用音色列表
   * @returns {object} 音色列表
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

    if (!this.apiKey) {
      console.error('阿里云 TTS API Key 未设置')
      // 降级到浏览器内置 TTS
      this.fallbackSpeak(text)
      return
    }

    // 停止当前播放
    this.stop()

    try {
      this.isPlaying = true
      this.startMouthAnimation()

      // 调用阿里云 TTS API
      const audioUrl = await this.fetchAudio(text)

      if (audioUrl) {
        this.audioElement.src = audioUrl
        await this.audioElement.play()
      }
    } catch (error) {
      console.error('阿里云 TTS 播放失败:', error)
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
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify({
          model: 'cosyvoice-v1',
          input: {
            text: text
          },
          parameters: {
            voice: this.currentVoice,
            format: 'mp3',
            sample_rate: 48000
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const data = await response.json()

      // 如果是异步任务，需要轮询获取结果
      if (data.output && data.output.task_id) {
        return await this.pollTaskResult(data.output.task_id)
      }

      // 如果直接返回音频 URL
      if (data.output && data.output.audio) {
        return data.output.audio
      }

      throw new Error('未获取到音频数据')
    } catch (error) {
      console.error('阿里云 TTS API 请求失败:', error)
      return null
    }
  }

  /**
   * 轮询任务结果
   * @param {string} taskId - 任务 ID
   * @returns {Promise<string>} 音频 URL
   */
  async pollTaskResult(taskId) {
    const maxRetries = 30
    const pollInterval = 500

    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))

      try {
        const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        })

        if (!response.ok) {
          continue
        }

        const data = await response.json()

        if (data.output && data.output.task_status === 'SUCCEEDED') {
          if (data.output.results && data.output.results.length > 0) {
            return data.output.results[0].url
          }
        }

        if (data.output && data.output.task_status === 'FAILED') {
          throw new Error('任务失败')
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error)
      }
    }

    throw new Error('任务超时')
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
