<template>
  <div class="chat-window" :class="{ 'is-open': isOpen }">
    <!-- 切换按钮 -->
    <button class="toggle-btn" @click="toggleChat">
      <span v-if="!isOpen">💬</span>
      <span v-else>✕</span>
    </button>

    <!-- 聊天界面 -->
    <div v-show="isOpen" class="chat-container">
      <!-- 标题栏 -->
      <div class="chat-header">
        <span class="title">高木同学</span>
        <div class="header-controls">
          <!-- 语音开关 -->
          <button
            class="voice-btn"
            :class="{ active: voiceEnabled }"
            @click="voiceEnabled = !voiceEnabled"
            title="语音开关"
          >
            {{ voiceEnabled ? '🔊' : '🔇' }}
          </button>
          <!-- 适配器切换 -->
          <div class="adapter-switch">
            <button
              :class="{ active: currentAdapter === 'gpt' }"
              @click="switchAdapter('gpt')"
            >GPT</button>
            <button
              :class="{ active: currentAdapter === 'claude' }"
              @click="switchAdapter('claude')"
            >Claude</button>
            <button
              :class="{ active: currentAdapter === 'qwen' }"
              @click="switchAdapter('qwen')"
            >千问</button>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="message-list" ref="messageListRef">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['message', msg.role]"
        >
          <div class="bubble">
            <div class="content">{{ msg.content }}</div>
            <div class="time">{{ formatTime(msg.timestamp) }}</div>
          </div>
        </div>
        <div v-if="isLoading" class="message assistant">
          <div class="bubble loading">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <textarea
          v-model="inputMessage"
          placeholder="和高木同学聊天..."
          @keydown.enter.exact.prevent="sendMessage"
          :disabled="isLoading"
        ></textarea>
        <button @click="sendMessage" :disabled="!inputMessage.trim() || isLoading">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '../stores/chat'
import { AIEngine } from '../core/ai/AIEngine'
import { BertVITS2Engine } from '../core/tts/BertVITS2Engine'

const chatStore = useChatStore()
const isOpen = ref(false)
const messageListRef = ref(null)
const inputMessage = ref('')
const voiceEnabled = ref(true)

// AI 引擎
const aiEngine = new AIEngine()

// Bert-VITS2 TTS 引擎
const ttsEngine = new BertVITS2Engine()

// 从 store 解构
const { messages, isLoading } = chatStore

// 使用 computed 确保响应式
const currentAdapter = computed(() => chatStore.currentAdapter.value)

// 获取父组件的 Live2D 引用
const emit = defineEmits(['mouthUpdate', 'emotionUpdate'])

onMounted(async () => {
  // 设置 TTS 口型回调
  ttsEngine.setMouthCallback((openY) => {
    // 发送口型更新事件给父组件
    emit('mouthUpdate', openY)
  })

  // 同步适配器状态
  aiEngine.switchAdapter(chatStore.currentAdapter)

  // 同步 API Keys
  if (chatStore.apiKeys.gpt) aiEngine.setApiKey('gpt', chatStore.apiKeys.gpt)
  if (chatStore.apiKeys.claude) aiEngine.setApiKey('claude', chatStore.apiKeys.claude)
  if (chatStore.apiKeys.qwen) aiEngine.setApiKey('qwen', chatStore.apiKeys.qwen)

  // 加载角色 prompt
  try {
    const resp = await fetch('/config/character_prompt.txt')
    if (resp.ok) {
      const prompt = await resp.text()
      aiEngine.setSystemPrompt(prompt)
    }
  } catch (e) {
    console.warn('加载 character_prompt 失败:', e)
  }
})

onUnmounted(() => {
  ttsEngine.destroy()
})

// 切换聊天窗口
function toggleChat() {
  isOpen.value = !isOpen.value
}

// 切换适配器
function switchAdapter(adapter) {
  chatStore.switchAdapter(adapter)
  aiEngine.switchAdapter(adapter)
}

// 发送消息
async function sendMessage() {
  const text = inputMessage.value.trim()
  if (!text || isLoading.value) return

  // 添加用户消息
  chatStore.addUserMessage(text)
  inputMessage.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 设置加载状态
  chatStore.isLoading = true

  // 添加空的 AI 消息
  chatStore.addAIMessage('')

  try {
    // 检查 API Key
    const currentAdapterName = chatStore.currentAdapter
    const apiKey = chatStore.apiKeys[currentAdapterName]

    if (!apiKey) {
      chatStore.updateLastAIMessage(`请先在设置中配置 ${currentAdapterName.toUpperCase()} API Key`)
      chatStore.isLoading = false
      return
    }

    // 流式获取回复（日文）
    let jaResponse = ''
    for await (const chunk of aiEngine.streamChat(text)) {
      if (chunk.type === 'text') {
        jaResponse += chunk.content
        chatStore.updateLastAIMessage(jaResponse)
        await nextTick()
        scrollToBottom()
      } else if (chunk.type === 'emotion') {
        emit('emotionUpdate', chunk.content)
      }
    }

    // 语音播放（日文原文）
    if (voiceEnabled.value && jaResponse) {
      ttsEngine.speak(jaResponse).catch(e => console.error('TTS 播放失败:', e))
    }

    // 翻译成中文显示
    if (jaResponse) {
      try {
        const resp = await fetch('http://localhost:5000/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: jaResponse })
        })
        if (resp.ok) {
          const data = await resp.json()
          chatStore.updateLastAIMessage(data.text)
          await nextTick()
          scrollToBottom()
        }
      } catch (e) {
        console.warn('翻译失败，保留日文显示:', e)
      }
    }
  } catch (error) {
    console.error('AI 回复失败:', error)
    chatStore.updateLastAIMessage(`AI 回复失败: ${error.message || '请检查 API Key 是否正确'}`)
  } finally {
    chatStore.isLoading = false
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 监听 API Key 变化
watch(() => chatStore.apiKeys, (keys) => {
  if (keys.gpt) aiEngine.setApiKey('gpt', keys.gpt)
  if (keys.claude) aiEngine.setApiKey('claude', keys.claude)
  if (keys.qwen) aiEngine.setApiKey('qwen', keys.qwen)
}, { deep: true, immediate: true })
</script>

<style scoped>
.chat-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 50;
}

.toggle-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  transform: scale(1.1);
}

.chat-container {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 380px;
  height: 500px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.voice-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
}

.voice-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.voice-btn.active {
  background: rgba(255, 255, 255, 0.4);
}

.adapter-switch {
  display: flex;
  gap: 6px;
}

.adapter-switch button {
  padding: 6px 14px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 14px;
  background: transparent;
  color: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  position: relative;
}

.adapter-switch button:hover {
  border-color: white;
  background: rgba(255, 255, 255, 0.1);
}

.adapter-switch button.active {
  background: white;
  color: #ff6b9d;
  font-weight: bold;
  border-color: white;
  box-shadow: 0 0 12px rgba(255, 107, 157, 0.6);
  transform: scale(1.05);
}

.adapter-switch button.active::after {
  content: '✓';
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff6b9d;
  color: white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
}

.message.user .bubble {
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .bubble {
  background: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4px;
}

.content {
  line-height: 1.5;
  word-break: break-word;
}

.time {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

.bubble.loading {
  display: flex;
  gap: 4px;
  padding: 16px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.input-area {
  padding: 16px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
}

textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 12px;
  resize: none;
  height: 48px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease;
}

textarea:focus {
  border-color: #ff6b9d;
}

button {
  padding: 12px 20px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s ease;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  opacity: 0.9;
}
</style>
