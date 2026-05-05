export class EyeTracker {
  constructor() {
    this.model = null
    this.targetX = 0.5
    this.targetY = 0.5
    this.currentX = 0.5
    this.currentY = 0.5
    this.smoothing = 0.1 // 平滑系数
    this.isEnabled = true
    this.animationFrame = null
  }

  /**
   * 初始化视线追踪
   * @param {object} model - Live2D 模型实例
   */
  init(model) {
    this.model = model
    this.startTracking()
  }

  /**
   * 更新追踪目标
   * @param {number} x - 目标 X 坐标 (0-1)
   * @param {number} y - 目标 Y 坐标 (0-1)
   */
  updateTarget(x, y) {
    this.targetX = Math.max(0, Math.min(1, x))
    this.targetY = Math.max(0, Math.min(1, y))
  }

  /**
   * 开始追踪动画
   */
  startTracking() {
    const animate = () => {
      if (!this.isEnabled || !this.model) return

      // 平滑插值
      this.currentX += (this.targetX - this.currentX) * this.smoothing
      this.currentY += (this.targetY - this.currentY) * this.smoothing

      // 更新模型视线
      this.updateModelGaze()

      this.animationFrame = requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * 更新模型视线参数
   */
  updateModelGaze() {
    if (!this.model || !this.model.internalModel) return

    try {
      const coreModel = this.model.internalModel.coreModel

      // 将坐标转换为参数范围 (-1 到 1)
      const paramX = (this.currentX - 0.5) * 2
      const paramY = (this.currentY - 0.5) * 2

      // 设置眼球参数
      coreModel.setParameterValueById('ParamEyeBallX', paramX)
      coreModel.setParameterValueById('ParamEyeBallY', paramY)

      // 设置头部参数（可选，增加自然感）
      coreModel.setParameterValueById('ParamAngleX', paramX * 10)
      coreModel.setParameterValueById('ParamAngleY', paramY * 10)
    } catch (error) {
      // 忽略参数设置错误
    }
  }

  /**
   * 启用/禁用视线追踪
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.isEnabled = enabled
    if (enabled) {
      this.startTracking()
    } else {
      this.stopTracking()
    }
  }

  /**
   * 停止追踪动画
   */
  stopTracking() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  /**
   * 设置平滑系数
   * @param {number} smoothing - 平滑系数 (0-1)
   */
  setSmoothing(smoothing) {
    this.smoothing = Math.max(0.01, Math.min(1, smoothing))
  }

  /**
   * 重置视线位置
   */
  reset() {
    this.targetX = 0.5
    this.targetY = 0.5
    this.currentX = 0.5
    this.currentY = 0.5
  }

  /**
   * 销毁资源
   */
  destroy() {
    this.stopTracking()
    this.model = null
  }
}
