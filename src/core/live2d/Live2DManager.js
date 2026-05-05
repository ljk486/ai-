import * as PIXI from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display/cubism4'

window.PIXI = PIXI

export class Live2DManager {
  constructor() {
    this.app = null
    this.model = null
    this.canvas = null
    this.isLoading = false
    this.onModelLoaded = null
    this.onHitAreaTap = null
    this._resizeObserver = null
  }

  init(canvas, width, height) {
    this.canvas = canvas

    this.app = new PIXI.Application({
      view: canvas,
      width,
      height,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    })

    this._resizeObserver = new ResizeObserver(() => {
      this._handleResize()
    })
    this._resizeObserver.observe(canvas.parentElement)
    this._handleResize()
  }

  async loadModel(modelPath) {
    if (this.isLoading) return
    this.isLoading = true

    try {
      if (this.model) {
        this.app.stage.removeChild(this.model)
        this.model.destroy()
        this.model = null
      }

      console.log('[Live2D] 开始加载模型:', modelPath)
      const startTime = performance.now()

      this.model = await Live2DModel.from(modelPath, {
        autoInteract: true,
        autoUpdate: true
      })

      const loadTime = ((performance.now() - startTime) / 1000).toFixed(2)
      console.log(`[Live2D] 模型加载完成，耗时 ${loadTime}s`)

      this.app.stage.addChild(this.model)
      this._fitModel()
      this._setupInteraction()

      if (this.onModelLoaded) {
        this.onModelLoaded(this.model)
      }
    } catch (error) {
      console.error('[Live2D] 模型加载失败:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }

  _fitModel() {
    if (!this.model || !this.app) return

    const sw = this.app.renderer.width / (window.devicePixelRatio || 1)
    const sh = this.app.renderer.height / (window.devicePixelRatio || 1)

    const scaleX = sw / this.model.width
    const scaleY = sh / this.model.height
    const scale = Math.min(scaleX, scaleY) * 0.7

    this.model.scale.set(scale)
    this.model.anchor.set(0.5, 0.5)
    this.model.x = sw / 2
    this.model.y = sh / 2
  }

  _handleResize() {
    if (!this.app || !this.canvas) return

    const parent = this.canvas.parentElement
    if (!parent) return

    const w = parent.clientWidth
    const h = parent.clientHeight

    this.app.renderer.resize(w, h)
    this._fitModel()
  }

  _setupInteraction() {
    if (!this.model) return
    this.model.interactive = true
    this.model.buttonMode = true

    this.model.on('hit', (hitAreas) => {
      if (this.onHitAreaTap) {
        this.onHitAreaTap(hitAreas)
      }
    })
  }

  playMotion(group, index = 0, priority = 1) {
    if (!this.model) return
    this.model.motion(group, index, priority)
  }

  setExpression(expression) {
    if (!this.model) return
    this.model.expression(expression)
  }

  setLipSync(value) {
    if (!this.model) return
    try {
      const coreModel = this.model.internalModel.coreModel
      coreModel.setParameterValueById('ParamMouthOpenY', value)
      // 嘴巴张开时添加轻微的嘴型变化，让口型更自然
      if (value > 0.1) {
        const mouthForm = (Math.random() - 0.5) * 0.3
        coreModel.setParameterValueById('ParamMouthForm', mouthForm)
      } else {
        coreModel.setParameterValueById('ParamMouthForm', 0)
      }
    } catch (e) {}
  }

  setLookAt(x, y) {
    if (!this.model) return
    this.model.focus(x, y)
  }

  destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }
    if (this.model) {
      this.model.destroy()
      this.model = null
    }
    if (this.app) {
      this.app.destroy(true)
      this.app = null
    }
  }
}
