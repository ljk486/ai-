export class HitTestManager {
  constructor() {
    // 碰撞区域定义
    this.hitAreas = {
      Head: {
        name: '头部',
        reactions: ['吐槽', '摸头', '害羞'],
        animation: 'Tap'
      },
      Body: {
        name: '身体',
        reactions: ['躲闪', '惊讶', '后退'],
        animation: 'Tap'
      }
    }

    // 反应计数器
    this.reactionCounts = {}

    // 回调函数
    this.onReaction = null
  }

  /**
   * 处理碰撞事件
   * @param {string[]} hitAreas - 碰撞区域名称数组
   */
  handleHit(hitAreas) {
    if (!hitAreas || hitAreas.length === 0) return

    hitAreas.forEach(area => {
      const areaConfig = this.hitAreas[area]
      if (!areaConfig) return

      // 更新反应计数
      this.reactionCounts[area] = (this.reactionCounts[area] || 0) + 1

      // 随机选择反应
      const reaction = this.getRandomReaction(area)

      console.log(`点击 ${areaConfig.name}: ${reaction}`)

      // 触发回调
      if (this.onReaction) {
        this.onReaction({
          area,
          areaName: areaConfig.name,
          reaction,
          count: this.reactionCounts[area]
        })
      }
    })
  }

  /**
   * 获取随机反应
   * @param {string} area - 碰撞区域
   * @returns {string} 反应文本
   */
  getRandomReaction(area) {
    const areaConfig = this.hitAreas[area]
    if (!areaConfig) return ''

    const reactions = areaConfig.reactions
    const index = Math.floor(Math.random() * reactions.length)
    return reactions[index]
  }

  /**
   * 获取碰撞区域配置
   * @param {string} area - 区域名称
   * @returns {object} 区域配置
   */
  getAreaConfig(area) {
    return this.hitAreas[area] || null
  }

  /**
   * 获取反应统计
   * @returns {object} 反应计数
   */
  getReactionStats() {
    return { ...this.reactionCounts }
  }

  /**
   * 重置反应计数
   */
  resetCounts() {
    this.reactionCounts = {}
  }
}
