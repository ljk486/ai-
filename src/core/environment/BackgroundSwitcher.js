/**
 * 背景切换器
 * 根据时段切换背景
 */
export class BackgroundSwitcher {
  constructor() {
    // 背景配置
    this.backgrounds = {
      morning: {
        gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        description: '清晨阳光'
      },
      forenoon: {
        gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
        description: '上午教室'
      },
      noon: {
        gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
        description: '午休时光'
      },
      afternoon: {
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        description: '午后操场'
      },
      evening: {
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        description: '放学小径'
      },
      night: {
        gradient: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 100%)',
        description: '夜晚星空'
      }
    }

    this.currentBackground = null
    this.onBackgroundChange = null
  }

  /**
   * 根据时段切换背景
   * @param {string} period - 时段名称
   */
  switchByPeriod(period) {
    const background = this.backgrounds[period]
    if (!background) return

    this.currentBackground = background

    if (this.onBackgroundChange) {
      this.onBackgroundChange(background)
    }
  }

  /**
   * 获取当前背景
   * @returns {object} 背景配置
   */
  getCurrentBackground() {
    return this.currentBackground
  }

  /**
   * 获取背景样式
   * @returns {object} CSS 样式
   */
  getBackgroundStyle() {
    if (!this.currentBackground) {
      return { background: this.backgrounds.afternoon.gradient }
    }

    return { background: this.currentBackground.gradient }
  }

  /**
   * 添加自定义背景
   * @param {string} period - 时段名称
   * @param {object} config - 背景配置
   */
  addBackground(period, config) {
    this.backgrounds[period] = config
  }

  /**
   * 获取所有背景配置
   * @returns {object} 所有背景配置
   */
  getAllBackgrounds() {
    return { ...this.backgrounds }
  }
}
