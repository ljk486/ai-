/**
 * 情感分析器
 * 分析用户输入的情绪状态
 */
export class EmotionAnalyzer {
  constructor() {
    // 情绪关键词映射
    this.emotionKeywords = {
      happy: ['开心', '高兴', '快乐', '哈哈', '嘻嘻', '太好了', '棒', '赞', '喜欢', '爱'],
      sad: ['难过', '伤心', '哭', '呜呜', '惨', '糟糕', '失望', '累', '烦', '无聊'],
      shy: ['害羞', '脸红', '不好意思', '那个...', '嗯...', '才不是', '没有啦', '别误会'],
      angry: ['生气', '讨厌', '烦人', '哼', '才不要', '笨蛋', '白痴', '滚'],
      surprised: ['什么', '真的吗', '不会吧', '天啊', '哇', '诶', '啊', '竟然'],
      nervous: ['紧张', '担心', '害怕', '怎么办', '完了', '糟糕', '不妙'],
      embarrassed: ['丢人', '出丑', '尴尬', '完蛋', '被看到了', '羞耻']
    }

    // 情绪描述
    this.emotionDescriptions = {
      happy: '开心',
      sad: '难过',
      shy: '害羞',
      angry: '生气',
      surprised: '惊讶',
      nervous: '紧张',
      embarrassed: '尴尬',
      neutral: '平静'
    }
  }

  /**
   * 分析文本情绪
   * @param {string} text - 输入文本
   * @returns {string} 情绪类型
   */
  analyze(text) {
    if (!text) return 'neutral'

    const scores = {}

    // 初始化分数
    for (const emotion of Object.keys(this.emotionKeywords)) {
      scores[emotion] = 0
    }

    // 统计关键词出现次数
    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          scores[emotion]++
        }
      }
    }

    // 找出最高分的情绪
    let maxScore = 0
    let dominantEmotion = 'neutral'

    for (const [emotion, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        dominantEmotion = emotion
      }
    }

    return dominantEmotion
  }

  /**
   * 获取情绪描述
   * @param {string} emotion - 情绪类型
   * @returns {string} 情绪描述
   */
  getDescription(emotion) {
    return this.emotionDescriptions[emotion] || '未知'
  }

  /**
   * 分析情绪强度
   * @param {string} text - 输入文本
   * @returns {number} 强度 (0-1)
   */
  getIntensity(text) {
    if (!text) return 0

    // 根据标点符号和语气词判断强度
    let intensity = 0.5

    // 感叹号增加强度
    const exclamationCount = (text.match(/！|!/g) || []).length
    intensity += exclamationCount * 0.1

    // 省略号降低强度
    const ellipsisCount = (text.match(/。|\.\.\./g) || []).length
    intensity -= ellipsisCount * 0.05

    // 重复字符增加强度
    const repeatedChars = text.match(/(.)\1{2,}/g)
    if (repeatedChars) {
      intensity += repeatedChars.length * 0.1
    }

    return Math.max(0, Math.min(1, intensity))
  }
}
