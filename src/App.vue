<template>
  <div class="app-container">
    <!-- 背景层 -->
    <div class="background-layer" :style="backgroundStyle"></div>

    <!-- Live2D 模型层 -->
    <Live2DCanvas ref="live2dCanvasRef" />

    <!-- 对话窗口层 -->
    <ChatWindow ref="chatWindowRef" @mouthUpdate="handleMouthUpdate" @emotionUpdate="handleEmotionUpdate" />

    <!-- 设置面板 -->
    <SettingsPanel v-if="showSettings" @close="showSettings = false" />

    <!-- Toast 通知 -->
    <ToastNotification
      :visible="uiStore.toast.visible"
      :message="uiStore.toast.message"
      :type="uiStore.toast.type"
      @close="uiStore.hideToast()"
    />

    <!-- 加载遮罩 -->
    <div v-if="uiStore.isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>{{ uiStore.loadingText }}</p>
    </div>

    <!-- 设置按钮 -->
    <button class="settings-btn" @click="showSettings = true">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Live2DCanvas from './components/Live2DCanvas.vue'
import ChatWindow from './components/ChatWindow.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import ToastNotification from './components/ToastNotification.vue'
import { useEnvironmentStore } from './stores/environment'
import { useUIStore } from './stores/ui'

const showSettings = ref(false)
const environmentStore = useEnvironmentStore()
const uiStore = useUIStore()

const live2dCanvasRef = ref(null)
const chatWindowRef = ref(null)

const backgroundStyle = computed(() => ({
  background: environmentStore.currentBackground
}))

// 情绪 → 表情映射
const emotionExpressionMap = {
  happy: 'f00',
  surprised: 'f01',
  sad: 'f02',
  shy: 'f03',
  embarrassed: 'f03',
  angry: 'f04',
  nervous: 'f01'
}

// 处理口型更新
function handleMouthUpdate(openY) {
  if (live2dCanvasRef.value) {
    live2dCanvasRef.value.setMouthOpen(openY)
  }
}

// 处理情绪更新 → 触发表情变化
function handleEmotionUpdate(emotion) {
  const expression = emotionExpressionMap[emotion]
  if (expression && live2dCanvasRef.value) {
    live2dCanvasRef.value.setExpression(expression)
  }
}

onMounted(() => {
  console.log('应用已启动')
})
</script>

<style scoped>
.app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.settings-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(30deg);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 500;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
