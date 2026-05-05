# 网页交互式高木同学虚拟形象

一个高度还原《擅长捉弄人的高木同学》女主角形象的网页互动系统。

## 当前状态

- **前端框架**: Vue3 + Vite ✓
- **Live2D 渲染**: Cubism 4 (Hiyori 模型) ✓
- **AI 对话**: GPT-4o / Claude 3.5 适配器 ✓
- **语音合成**: 浏览器内置 TTS ✓
- **环境感知**: 时钟联动背景切换 ✓

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 打开浏览器

访问 `http://localhost:3006`

### 4. 配置 API Key

点击右上角设置按钮，配置 GPT 或 Claude 的 API Key。

## 功能说明

### Live2D 模型

- 当前使用 Live2D 官方样例模型（Hiyori）
- 支持视线追踪（鼠标/触摸跟随）
- 支持碰撞检测（点击模型触发反应）
- 支持口型同步（TTS 播放时自动同步）

### AI 对话

- 支持 GPT-4o 和 Claude 3.5
- 流式输出，实时显示回复
- 情感分析和记忆系统
- 高木同学性格设定

### 语音合成

- 使用浏览器内置 TTS（Web Speech API）
- 支持中文语音
- 自动口型同步

### 环境感知

- 时钟联动背景切换
- 时间感知问候语

## 项目结构

```
project-takagi/
├── public/
│   ├── live2dcubismcore.min.js  # Cubism 4 核心库
│   └── models/takagi/          # Live2D 模型文件
├── src/
│   ├── components/             # Vue 组件
│   │   ├── Live2DCanvas.vue    # Live2D 渲染
│   │   ├── ChatWindow.vue      # 对话窗口
│   │   ├── SettingsPanel.vue   # 设置面板
│   │   └── ToastNotification.vue
│   ├── core/                   # 核心模块
│   │   ├── ai/                 # AI 引擎
│   │   ├── live2d/             # Live2D 管理
│   │   ├── tts/                # 语音合成
│   │   └── environment/        # 环境感知
│   ├── stores/                 # Pinia 状态管理
│   └── App.vue                 # 主应用
├── config/
│   └── character_prompt.txt    # 角色提示词
└── package.json
```

## 使用说明

1. **配置 API Key**: 点击设置按钮，输入 GPT 或 Claude 的 API Key
2. **切换 AI 模型**: 在对话窗口标题栏切换 GPT/Claude
3. **语音开关**: 点击标题栏的语音按钮开启/关闭语音
4. **与模型互动**: 移动鼠标，模型会跟随视线；点击模型触发反应

## 未来计划

- [ ] 替换为高木同学定制 Live2D 模型
- [ ] 部署 Bert-VITS2 语音服务（高桥李依声线）
- [ ] 添加小游戏（石头剪刀布等）
- [ ] AR 扩展（WebXR）

## 注意事项

- 需要现代浏览器（Chrome、Firefox、Edge 等）
- 需要网络连接加载模型文件
- API Key 请妥善保管，不要泄露
