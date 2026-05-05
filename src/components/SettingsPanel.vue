<template>
  <div class="settings-overlay" @click.self="$emit('close')">
    <div class="settings-panel">
      <div class="header">
        <h2>设置</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="content">
        <!-- API Key 设置 -->
        <section class="section">
          <h3>API 配置</h3>

          <div class="form-group">
            <label>GPT API Key</label>
            <input
              type="password"
              v-model="gptKey"
              placeholder="输入 OpenAI API Key"
            />
          </div>

          <div class="form-group">
            <label>Claude API Key</label>
            <input
              type="password"
              v-model="claudeKey"
              placeholder="输入 Anthropic API Key"
            />
          </div>

          <div class="form-group">
            <label>千问 API Key</label>
            <input
              type="password"
              v-model="qwenKey"
              placeholder="输入阿里云千问 API Key"
            />
          </div>

          <button class="save-btn" @click="saveApiKeys">保存</button>
        </section>

        <!-- 适配器选择 -->
        <section class="section">
          <h3>AI 模型</h3>
          <div class="adapter-options">
            <label
              :class="{ active: currentAdapter === 'gpt' }"
              @click="switchAdapter('gpt')"
            >
              <input type="radio" name="adapter" value="gpt" v-model="currentAdapter" />
              GPT-4o
            </label>
            <label
              :class="{ active: currentAdapter === 'claude' }"
              @click="switchAdapter('claude')"
            >
              <input type="radio" name="adapter" value="claude" v-model="currentAdapter" />
              Claude 3.5
            </label>
            <label
              :class="{ active: currentAdapter === 'qwen' }"
              @click="switchAdapter('qwen')"
            >
              <input type="radio" name="adapter" value="qwen" v-model="currentAdapter" />
              千问
            </label>
          </div>
        </section>

        <!-- 背景颜色 -->
        <section class="section">
          <h3>背景颜色</h3>
          <div class="color-options">
            <div
              v-for="(bg, key) in backgrounds"
              :key="key"
              class="color-item"
              :class="{ active: currentBgKey === key }"
              :style="{ background: bg.gradient }"
              @click="selectBackground(key)"
            >
              <span class="color-name">{{ bg.name }}</span>
            </div>
          </div>
        </section>

        <!-- 音量设置 -->
        <section class="section">
          <h3>音量</h3>
          <div class="volume-control">
            <input
              type="range"
              min="0"
              max="100"
              v-model="volume"
              @change="updateVolume"
            />
            <span>{{ volume }}%</span>
          </div>
        </section>

        <!-- 记忆管理 -->
        <section class="section">
          <h3>记忆</h3>
          <button class="danger-btn" @click="clearMemory">清空记忆</button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useChatStore } from '../stores/chat'
import { useEnvironmentStore } from '../stores/environment'

const emit = defineEmits(['close'])
const chatStore = useChatStore()
const environmentStore = useEnvironmentStore()

const gptKey = ref('')
const claudeKey = ref('')
const qwenKey = ref('')
const currentAdapter = ref('gpt')
const volume = ref(80)
const currentBgKey = ref('auto')

const backgrounds = {
  auto: { name: '自动', gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
  pink: { name: '浅粉', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  blue: { name: '蓝色', gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  purple: { name: '紫色', gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
  green: { name: '绿色', gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
  sunset: { name: '日落', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  night: { name: '夜晚', gradient: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 100%)' }
}

onMounted(() => {
  gptKey.value = chatStore.apiKeys.gpt
  claudeKey.value = chatStore.apiKeys.claude
  qwenKey.value = chatStore.apiKeys.qwen || ''
  currentAdapter.value = chatStore.currentAdapter
  volume.value = parseInt(localStorage.getItem('takagi_volume') || '80')
  currentBgKey.value = localStorage.getItem('takagi_bg') || 'auto'
})

function saveApiKeys() {
  chatStore.setApiKey('gpt', gptKey.value)
  chatStore.setApiKey('claude', claudeKey.value)
  chatStore.setApiKey('qwen', qwenKey.value)
  alert('API Key 已保存')
}

function switchAdapter(adapter) {
  currentAdapter.value = adapter
  chatStore.switchAdapter(adapter)
}

function selectBackground(key) {
  currentBgKey.value = key
  localStorage.setItem('takagi_bg', key)
  if (key === 'auto') {
    environmentStore.updateTimePeriod()
  } else {
    environmentStore.setBackground(backgrounds[key].gradient)
  }
}

function updateVolume() {
  localStorage.setItem('takagi_volume', volume.value.toString())
}

function clearMemory() {
  if (confirm('确定要清空所有记忆吗？')) {
    localStorage.removeItem('takagi_memory')
    alert('记忆已清空')
  }
}
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(5px);
}

.settings-panel {
  background: white;
  border-radius: 20px;
  width: 420px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
}

.content {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #666;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  border-color: #ff6b9d;
}

.save-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 8px;
}

.save-btn:hover {
  opacity: 0.9;
}

.adapter-options {
  display: flex;
  gap: 12px;
}

.adapter-options label {
  flex: 1;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.adapter-options label.active {
  border-color: #ff6b9d;
  background: #fff5f8;
}

.adapter-options input {
  display: none;
}

.color-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.color-item {
  height: 50px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  border: 3px solid transparent;
  transition: all 0.2s ease;
}

.color-item:hover {
  transform: scale(1.05);
}

.color-item.active {
  border-color: #ff6b9d;
  box-shadow: 0 0 10px rgba(255, 107, 157, 0.5);
}

.color-name {
  font-size: 11px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volume-control input {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  background: #eee;
  border-radius: 3px;
  outline: none;
}

.volume-control input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #ff6b9d;
  border-radius: 50%;
  cursor: pointer;
}

.danger-btn {
  width: 100%;
  padding: 12px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.danger-btn:hover {
  background: #ff6b81;
}
</style>
