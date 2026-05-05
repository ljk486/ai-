import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useChatStore = defineStore('chat', () => {
  // 消息列表
  const messages = ref([])

  // 输入中的消息
  const inputMessage = ref('')

  // 是否正在等待 AI 回复
  const isLoading = ref(false)

  // 当前使用的 AI 适配器
  const currentAdapter = ref('gpt')

  // API Keys
  const apiKeys = ref({
    gpt: localStorage.getItem('gpt_api_key') || '',
    claude: localStorage.getItem('claude_api_key') || '',
    qwen: localStorage.getItem('qwen_api_key') || ''
  })

  // 消息数量
  const messageCount = computed(() => messages.value.length)

  // 添加用户消息
  function addUserMessage(content) {
    messages.value.push({
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date()
    })
  }

  // 添加 AI 回复
  function addAIMessage(content) {
    messages.value.push({
      id: Date.now(),
      role: 'assistant',
      content,
      timestamp: new Date()
    })
  }

  // 更新最后一条 AI 消息（用于流式输出）
  function updateLastAIMessage(content) {
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage && lastMessage.role === 'assistant') {
      lastMessage.content = content
    }
  }

  // 清空消息
  function clearMessages() {
    messages.value = []
  }

  // 设置 API Key
  function setApiKey(adapter, key) {
    apiKeys.value[adapter] = key
    localStorage.setItem(`${adapter}_api_key`, key)
  }

  // 切换适配器
  function switchAdapter(adapter) {
    currentAdapter.value = adapter
  }

  return {
    messages,
    inputMessage,
    isLoading,
    currentAdapter,
    apiKeys,
    messageCount,
    addUserMessage,
    addAIMessage,
    updateLastAIMessage,
    clearMessages,
    setApiKey,
    switchAdapter
  }
})
