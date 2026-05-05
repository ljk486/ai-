<template>
  <div class="live2d-container" ref="containerRef">
    <canvas ref="canvasRef"></canvas>

    <!-- 加载中 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">{{ loadingText }}</p>
    </div>

    <!-- 错误 -->
    <div v-if="error" class="error-overlay">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="retry">重试</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Live2DManager } from '../core/live2d/Live2DManager'

const containerRef = ref(null)
const canvasRef = ref(null)
const isLoading = ref(true)
const error = ref(null)
const loadingText = ref('正在初始化...')

const manager = new Live2DManager()
let isDressHovering = false
let shyParamTimer = null

defineExpose({
  setMouthOpen: (value) => manager.setLipSync(value),
  setExpression: (expression) => manager.setExpression(expression)
})

let loadTimer = null

onMounted(() => {
  init()
})

onUnmounted(() => {
  if (loadTimer) clearTimeout(loadTimer)
  if (shyParamTimer) clearInterval(shyParamTimer)
  const container = containerRef.value
  if (container) {
    container.removeEventListener('mousemove', onPointerMove)
    container.removeEventListener('touchmove', onTouchMove)
  }
  manager.destroy()
})

async function init() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  if (typeof Live2DCubismCore === 'undefined') {
    error.value = 'Live2D 核心库未加载，请刷新页面'
    isLoading.value = false
    return
  }

  try {
    loadingText.value = '正在初始化渲染引擎...'
    manager.init(canvas, container.clientWidth, container.clientHeight)

    manager.onHitAreaTap = (hitAreas) => {
      console.log('点击:', hitAreas)
    }

    manager.onModelLoaded = () => {
      isLoading.value = false
      if (loadTimer) clearTimeout(loadTimer)
    }

    loadingText.value = '正在加载模型文件...'

    loadTimer = setTimeout(() => {
      if (isLoading.value) {
        loadingText.value = '模型较大，请耐心等待...'
      }
    }, 3000)

    await manager.loadModel('/models/takagi/Hiyori.model3.json')

    container.addEventListener('mousemove', onPointerMove)
    container.addEventListener('touchmove', onTouchMove, { passive: true })
  } catch (err) {
    console.error('Live2D 初始化失败:', err)
    error.value = '模型加载失败: ' + err.message
    isLoading.value = false
  }
}

function retry() {
  error.value = null
  isLoading.value = true
  loadingText.value = '正在重试...'
  init()
}

function onPointerMove(e) {
  const container = containerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  // 像素坐标，相对于画布
  const px = e.clientX - rect.left
  const py = e.clientY - rect.top
  // 归一化坐标，用于区域检测
  const nx = px / rect.width
  const ny = py / rect.height

  // 使用像素坐标调用focus（pixi-live2d-display需要像素坐标）
  manager.setLookAt(px, py)

  // 检测裙子区域悬停
  checkDressHover(nx, ny)
}

function onTouchMove(e) {
  if (e.touches.length === 0) return
  const container = containerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  const px = e.touches[0].clientX - rect.left
  const py = e.touches[0].clientY - rect.top
  const nx = px / rect.width
  const ny = py / rect.height

  manager.setLookAt(px, py)
  checkDressHover(nx, ny)
}

function checkDressHover(nx, ny) {
  // 裙子区域：模型下方中间偏下
  const inDressArea = nx >= 0.35 && nx <= 0.65 && ny >= 0.55 && ny <= 0.85

  if (inDressArea && !isDressHovering) {
    isDressHovering = true
    onDressHoverEnter()
  } else if (!inDressArea && isDressHovering) {
    isDressHovering = false
    onDressHoverLeave()
  }
}

function onDressHoverEnter() {
  console.log('悬停在裙子区域 - 害羞反应')
  manager.playMotion('TapBody', 0, 1)
  startShyParams()
}

function onDressHoverLeave() {
  console.log('离开裙子区域 - 恢复默认')
  stopShyParams()
}

function startShyParams() {
  if (shyParamTimer) return
  shyParamTimer = setInterval(() => {
    if (!manager.model || !manager.model.internalModel) return
    try {
      const coreModel = manager.model.internalModel.coreModel
      coreModel.setParameterValueById('ParamEyeBallY', -0.5)
      coreModel.setParameterValueById('ParamAngleY', -8)
      coreModel.setParameterValueById('ParamEyeLOpen', 0.6)
      coreModel.setParameterValueById('ParamEyeROpen', 0.6)
    } catch (e) {}
  }, 16)
}

function stopShyParams() {
  if (shyParamTimer) {
    clearInterval(shyParamTimer)
    shyParamTimer = null
  }
  if (!manager.model || !manager.model.internalModel) return
  try {
    const coreModel = manager.model.internalModel.coreModel
    coreModel.setParameterValueById('ParamEyeBallY', 0)
    coreModel.setParameterValueById('ParamAngleY', 0)
    coreModel.setParameterValueById('ParamEyeLOpen', 1)
    coreModel.setParameterValueById('ParamEyeROpen', 1)
  } catch (e) {}
}
</script>

<style scoped>
.live2d-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.9);
  color: white;
  z-index: 10;
}

.error-overlay {
  background: rgba(26, 26, 46, 0.95);
}

.loading-text {
  margin-top: 16px;
  font-size: 14px;
  opacity: 0.8;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid #ff6b9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 24px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover {
  opacity: 0.9;
}
</style>
