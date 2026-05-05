/**
 * ElevenLabs TTS 引擎
 * 通过本地代理服务器调用 ElevenLabs API
 * 使用 Web Audio API AnalyserNode 实时分析音频驱动口型同步
 */
export class BertVITS2Engine {
  constructor() {
    this.isPlaying = false
    this.mouthOpenCallback = null

    // 音频播放
    this.audioElement = new Audio()

    // Web Audio API 分析
    this.audioContext = null
    this.analyser = null
    this.sourceNode = null
    this.dataArray = null
    this.animFrameId = null
    this.useWebAudio = false

    // 口型平滑
    this.smoothOpenY = 0
    this.smoothFactor = 0.8

    // Fallback timer
    this.mouthAnimationTimer = null

    // API 配置
    this.apiBaseUrl = 'http://localhost:5000'

    this._initAudio()
  }

  _initAudio() {
    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false
      this._stopLipSyncLoop()
      this._smoothCloseMouth()
    })
    this.audioElement.addEventListener('error', (e) => {
      console.error('音频播放错误:', e)
      this.isPlaying = false
      this._stopLipSyncLoop()
      this._stopMouthFallback()
    })

    // 初始化 Web Audio 分析链路
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.audioContext = new AudioCtx()
        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement)
        this.analyser = this.audioContext.createAnalyser()
        this.analyser.fftSize = 256
        this.analyser.smoothingTimeConstant = 0.3
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
        this.sourceNode.connect(this.analyser)
        this.analyser.connect(this.audioContext.destination)
        this.useWebAudio = true
      }
    } catch (e) {
      console.warn('Web Audio API 不可用，使用 fallback 口型动画:', e)
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/health`)
      return response.ok
    } catch (error) {
      console.error('TTS 服务不可用:', error)
      return false
    }
  }

  async speak(text) {
    if (!text) return
    this.stop()

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)
      this.audioElement.src = audioUrl
      this.isPlaying = true

      // Resume suspended AudioContext (browser autoplay policy)
      if (this.useWebAudio) {
        console.log('[TTS] AudioContext state:', this.audioContext.state)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume()
          console.log('[TTS] AudioContext resumed:', this.audioContext.state)
        }
      }

      await this.audioElement.play()
      console.log('[TTS] 音频播放中, useWebAudio:', this.useWebAudio)

      if (this.useWebAudio) {
        this.smoothOpenY = 0
        this._startLipSyncLoop()
      } else {
        this._startMouthFallback()
      }
    } catch (error) {
      console.error('TTS 播放失败:', error)
      this.isPlaying = false
      this._fallbackSpeak(text)
    }
  }

  // ---- Web Audio 振幅分析口型 ----

  _startLipSyncLoop() {
    let frameCount = 0
    let silentFrames = 0
    const update = () => {
      if (!this.isPlaying || !this.analyser) return

      this.analyser.getByteFrequencyData(this.dataArray)

      // 计算 RMS 振幅
      let sum = 0
      for (let i = 0; i < this.dataArray.length; i++) {
        const v = this.dataArray[i] / 255
        sum += v * v
      }
      const rms = Math.sqrt(sum / this.dataArray.length)

      // 如果分析器持续返回全零数据，降级到 timer 动画
      if (rms === 0) {
        silentFrames++
        if (silentFrames > 10) {
          console.warn('[LipSync] 分析器无数据，降级到 timer 动画')
          this._stopLipSyncLoop()
          this._startMouthFallback()
          return
        }
      } else {
        silentFrames = 0
      }

      // 每 30 帧打印调试信息
      frameCount++
      if (frameCount % 30 === 0) {
        console.log('[LipSync] rms:', rms.toFixed(3))
      }

      // 映射到口型值 (0-1)
      // rms 通常在 0.05~0.5 之间，需要压缩到 0~0.8 范围
      let rawOpenY = 0
      if (rms > 0.03) {
        rawOpenY = Math.min(0.8, (rms - 0.03) * 1.8)
      }

      // 指数平滑
      this.smoothOpenY += (rawOpenY - this.smoothOpenY) * this.smoothFactor

      const openY = this.smoothOpenY < 0.05 ? 0 : this.smoothOpenY

      if (this.mouthOpenCallback) this.mouthOpenCallback(openY)

      this.animFrameId = requestAnimationFrame(update)
    }
    this.animFrameId = requestAnimationFrame(update)
  }

  _stopLipSyncLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  _smoothCloseMouth() {
    const close = () => {
      this.smoothOpenY *= 0.7
      if (this.smoothOpenY < 0.02) {
        this.smoothOpenY = 0
        if (this.mouthOpenCallback) this.mouthOpenCallback(0)
        return
      }
      if (this.mouthOpenCallback) this.mouthOpenCallback(this.smoothOpenY)
      requestAnimationFrame(close)
    }
    requestAnimationFrame(close)
  }

  // ---- Fallback timer 口型 ----

  _startMouthFallback() {
    this._stopMouthFallback()
    let isOpen = false
    this.mouthAnimationTimer = setInterval(() => {
      if (!this.isPlaying) { this._stopMouthFallback(); return }
      isOpen = !isOpen
      const openY = isOpen ? 0.5 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2
      if (this.mouthOpenCallback) this.mouthOpenCallback(openY)
    }, 100)
  }

  _stopMouthFallback() {
    if (this.mouthAnimationTimer) {
      clearInterval(this.mouthAnimationTimer)
      this.mouthAnimationTimer = null
    }
    if (this.mouthOpenCallback) this.mouthOpenCallback(0)
  }

  _fallbackSpeak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      const voices = speechSynthesis.getVoices()
      const jaVoice = voices.find(v => v.lang.startsWith('ja')) || voices[0]
      if (jaVoice) utterance.voice = jaVoice
      utterance.lang = 'ja-JP'
      utterance.pitch = 1.2
      utterance.rate = 1.1
      utterance.onstart = () => { this.isPlaying = true; this._startMouthFallback() }
      utterance.onend = () => { this.isPlaying = false; this._stopMouthFallback() }
      speechSynthesis.speak(utterance)
    }
  }

  // ---- 公共接口 ----

  setMouthCallback(callback) {
    this.mouthOpenCallback = callback
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
    }
    this._stopLipSyncLoop()
    this._stopMouthFallback()
    this.isPlaying = false
    this.smoothOpenY = 0
    if (this.mouthOpenCallback) this.mouthOpenCallback(0)
  }

  setVolume(volume) {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume))
    }
  }

  destroy() {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
    if (this.audioElement) {
      this.audioElement.src = ''
      this.audioElement = null
    }
    this.analyser = null
    this.sourceNode = null
    this.dataArray = null
    this.mouthOpenCallback = null
  }
}
