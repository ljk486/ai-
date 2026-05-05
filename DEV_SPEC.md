# Developer Specification (DEV_SPEC): Project Takagi-San

**版本：1.0** — 网页交互式高木同学角色项目

---

## 1. 项目概述

本项目旨在开发一个高度还原《擅长捉弄人的高木同学》女主角形象的网页互动系统。通过集成 Live2D 渲染、大语言模型 (LLM) 以及 VITS 语音合成技术，创造一个能看穿用户意图、具备"捉弄感"且能进行实时音画同步互动的虚拟形象。

### 设计理念 (Design Philosophy)

- **角色驱动 (Character-Centric)**：所有的交互逻辑均围绕"高木同学"的性格展开，强调主动性、洞察力与温柔的捉弄感。
- **多模态融合 (Multimodal Fusion)**：结合文本、点击、时间等多种输入源，驱动 Live2D 动画与 TTS 语音输出。
- **沉浸式体验**：通过时间感知与环境背景切换，增强用户与角色共处同一空间的错觉。

---

## 2. 核心特点

### 2.1 捉弄感 AI 引擎 (Teasing AI Engine)

- **性格约束**：AI 必须遵循"看穿但不说破"和"以捉弄表达关心"的原则。
- **情感分析**：模型会分析用户的输入情绪，若用户表现出迟疑或害羞，高木会主动发起调侃。
- **动态追问**：当对话陷入停顿时，高木会根据上下文发起新的捉弄话题。
- **多模型适配**：支持 GPT-4o、Claude 3.5、通义千问三种 LLM，运行时可切换，内置主备回退策略。

### 2.2 Live2D 交互表现

- **碰撞检测 (Hit Testing)**：将模型划分为头部（点击触发吐槽）、脸颊（触发害羞）、身体（触发躲闪）等区域。
- **视线追踪 (Eye Tracking)**：高木的瞳孔与头部会随鼠标位置微动，保持与用户的"眼神交流"。
- **口型同步 (Lip-sync)**：语音流实时转换为模型口型参数，确保发音与动画同步。

### 2.3 环境与记忆

- **时钟联动**：背景及语音问候随系统时间变化（如：午后教室、放学小径）。
- **轻量记忆**：记录用户的互动频次与常见的"败北"倾向，并在对话中引用。

### 2.4 多引擎 TTS 语音合成

- **ElevenLabs**：主要 TTS 引擎，使用 `eleven_multilingual_v2` 多语言模型，通过本地 Python 代理服务器调用 ElevenLabs API，支持 Web Audio API 实时口型同步。
- **Edge TTS**：微软 Edge TTS 服务，提供高质量日语女声（Nanami、Mayu 等），轻量快速。
- **Aliyun TTS**：阿里云语音合成服务，高质量中文语音。
- **Browser TTS**：浏览器原生 SpeechSynthesis API，零依赖备用方案。
- **Japanese TTS**：日语语音合成引擎。

---

## 3. 技术选型

### 3.1 核心技术栈

| 模块 | 技术选型 | 说明 |
|------|----------|------|
| 前端框架 | Vue 3 + Vite + Pinia | 响应式体验、状态管理、高效开发 |
| 形象渲染 | PixiJS 6.5 + pixi-live2d-display | Live2D Cubism 模型渲染与交互 |
| 逻辑大脑 | GPT-4o / Claude 3.5 / 通义千问 | 多 LLM 适配器，支持运行时切换 |
| 语音合成 | ElevenLabs / Edge TTS / Aliyun TTS | 多引擎 TTS，ElevenLabs 为主力，按需切换 |
| 后端服务 | Express.js (Node) + Flask (Python) | Node 处理前端服务，Python 处理 TTS 推理 |

### 3.2 部署架构

- **前端**：Vite 开发服务器 / 静态构建部署
- **TTS 后端**：Python Flask 服务（ElevenLabs API 代理）
- **本地存储**：localStorage 记录 API Key、交互历史、用户偏好
- **通信协议**：HTTP REST API（TTS 服务）、流式 SSE（LLM 对话）

---

## 4. 系统架构与模块设计

### 4.1 目录结构

```
project-takagi/
├── src/
│   ├── components/
│   │   ├── Live2DCanvas.vue         # Live2D 模型渲染与碰撞检测
│   │   ├── ChatWindow.vue           # 气泡式对话界面
│   │   ├── SettingsPanel.vue        # 设置面板（API Key、TTS 引擎选择）
│   │   └── ToastNotification.vue    # 通知提示组件
│   ├── core/
│   │   ├── InteractionManager.js    # 交互管理器，整合所有模块
│   │   ├── ai/
│   │   │   ├── AIEngine.js          # AI 引擎调度器（多适配器管理）
│   │   │   ├── EmotionAnalyzer.js   # 情感分析器
│   │   │   ├── MemorySystem.js      # 记忆系统
│   │   │   └── adapters/
│   │   │       ├── BaseAdapter.js   # 适配器基类
│   │   │       ├── GPTAdapter.js    # OpenAI GPT 适配器
│   │   │       ├── ClaudeAdapter.js # Anthropic Claude 适配器
│   │   │       └── QwenAdapter.js   # 通义千问适配器
│   │   ├── live2d/
│   │   │   ├── Live2DManager.js     # Live2D 模型加载与管理
│   │   │   ├── HitTestManager.js    # 碰撞检测管理器
│   │   │   ├── EyeTracker.js        # 视线追踪
│   │   │   └── LipSyncManager.js    # 口型同步管理器
│   │   ├── tts/
│   │   │   ├── BertVITS2Engine.js   # ElevenLabs TTS 引擎（文件名沿用旧名）
│   │   │   ├── EdgeTTSEngine.js     # Edge TTS 引擎
│   │   │   ├── AliyunTTSEngine.js   # 阿里云 TTS 引擎
│   │   │   ├── BrowserTTSEngine.js  # 浏览器原生 TTS
│   │   │   └── JapaneseTTSEngine.js # 日语 TTS 引擎
│   │   ├── environment/
│   │   │   ├── ClockManager.js      # 时钟管理器（时间感知）
│   │   │   └── BackgroundSwitcher.js# 背景切换器
│   │   └── utils/
│   │       └── ErrorHandler.js      # 统一错误处理
│   ├── stores/
│   │   ├── chat.js                  # 聊天状态管理 (Pinia)
│   │   ├── environment.js           # 环境状态管理
│   │   └── ui.js                    # UI 状态管理
│   ├── assets/
│   │   └── backgrounds/             # 背景资源
│   ├── App.vue                      # 根组件
│   └── main.js                      # 应用入口
├── public/
│   ├── models/takagi/               # Live2D 模型文件
│   │   ├── Hiyori.moc3              # 模型核心文件
│   │   ├── Hiyori.model3.json       # 模型配置
│   │   ├── expressions/             # 表情定义
│   │   ├── motions/                 # 动作定义
│   │   └── haru_greeter_t03.*       # 辅助模型
│   ├── config/character_prompt.txt  # 角色提示词
│   └── live2dcubismcore.min.js      # Live2D Cubism Core
├── bert-vits2-server/               # Python TTS 后端（ElevenLabs 代理）
│   ├── server.py                    # Flask 服务入口（ElevenLabs API 代理）
│   ├── tts_engine.py                # ElevenLabs TTS 引擎封装
│   ├── requirements.txt             # Python 依赖
│   └── audio_cache/                 # 音频缓存目录
├── config/
│   └── character_prompt.txt         # 角色提示词（源文件）
├── index.html                       # HTML 入口
├── vite.config.js                   # Vite 配置
└── package.json                     # Node.js 依赖
```

### 4.2 角色系统提示词 (System Prompt) 核心

> "你现在是高木（Takagi），来自《擅长捉弄人的高木同学》。你总是能精准地猜到对方（西片）在想什么。你的语气永远温和、从容，带有三分狡黠。你喜欢捉弄对方，但在他真正失落时会给予温柔的鼓励。"

详细提示词见 `config/character_prompt.txt`。

### 4.3 核心模块交互流程

```
用户输入 → InteractionManager
  ├→ AIEngine (情感分析 + LLM 对话)
  │   ├→ EmotionAnalyzer (情绪识别)
  │   ├→ MemorySystem (上下文记忆)
  │   └→ Adapter (GPT/Claude/Qwen)
  ├→ TTSEngine (语音合成)
  │   └→ ElevenLabs / Edge / Aliyun / Browser
  ├→ Live2DManager (模型动画)
  │   ├→ LipSyncManager (口型同步)
  │   ├→ EyeTracker (视线追踪)
  │   └→ HitTestManager (碰撞反馈)
  └→ BackgroundSwitcher (环境切换)
```

---

## 5. 项目排期

| 阶段 | 任务目标 | 状态 |
|------|----------|------|
| Phase 1 | 初始化骨架，集成 Live2D 基础展示 | ✅ 已完成 |
| Phase 2 | 接入 LLM 接口，调试"高木感"对话逻辑 | ✅ 已完成 |
| Phase 3 | 实现语音生成与口型动画同步 | ✅ 已完成 |
| Phase 4 | 开发环境感知系统（时间/背景）与多点触摸 | ✅ 已完成 |
| Phase 5 | 全链路验收与性能调优 | 🔄 进行中 |

---

## 6. 运行指南

### 前端启动

```bash
npm install
npm run dev
```

### TTS 后端启动（可选，ElevenLabs 语音合成）

```bash
cd bert-vits2-server
pip install -r requirements.txt
python server.py
```

### 配置

在设置面板中填入对应的 API Key：
- OpenAI API Key（GPT-4o）
- Anthropic API Key（Claude 3.5）
- 通义千问 API Key
- ElevenLabs API Key（语音合成，配置在 `bert-vits2-server/.env`）

---

## 7. 未来展望

- **小游戏集成**：内置石头剪刀布、推橡皮等经典对战。
- **AR 扩展**：通过 WebXR 允许用户在现实环境开启互动。
- **多模态视觉**：允许高木通过摄像头识别用户的表情。
- **更多 TTS 引擎**：接入 VITS、GPT-SoVITS 等开源语音模型。
- **移动端适配**：响应式布局与触屏交互优化。
