# 《网页交互式高木同学虚拟形象》完整实现方案

## 一、项目目录结构设计

```
project-takagi/
├── public/
│   ├── models/
│   │   └── takagi/                    # Live2D 模型资源
│   │       ├── takagi.model3.json     # 模型配置主文件
│   │       ├── takagi.moc3            # 模型核心数据
│   │       ├── takagi.physics3.json   # 物理模拟配置
│   │       ├── textures/              # 贴图文件
│   │       ├── motions/               # 动作文件
│   │       │   ├── idle/              # 待机动作
│   │       │   ├── tap_head/          # 点击头部反应
│   │       │   ├── tap_cheek/         # 点击脸颊（害羞）
│   │       │   ├── shy/               # 害羞动作
│   │       │   ├── laugh/             # 笑动作
│   │       │   └── surprise/          # 惊讶动作
│   │       └── expressions/           # 表情文件
│   └── backgrounds/                   # 环境背景图
│       ├── morning_classroom.png      # 早晨教室
│       ├── afternoon_classroom.png    # 午后教室
│       ├── evening_path.png           # 放学小径
│       └── night_room.png             # 夜晚房间
├── src/
│   ├── main.js                        # Vue 应用入口
│   ├── App.vue                        # 根组件
│   ├── components/
│   │   ├── Live2DCanvas.vue           # Live2D 模型渲染与碰撞检测
│   │   ├── ChatWindow.vue             # 气泡式对话界面
│   │   ├── ChatBubble.vue             # 单条对话气泡
│   │   ├── InputBar.vue               # 用户输入栏
│   │   ├── VoiceIndicator.vue         # 语音播放状态指示器
│   │   ├── EnvironmentBackground.vue  # 环境背景切换组件
│   │   └── SettingsPanel.vue          # 设置面板（API Key 等）
│   ├── core/
│   │   ├── live2d/
│   │   │   ├── Live2DManager.js       # Live2D 模型生命周期管理
│   │   │   ├── MotionController.js    # 动作触发与队列管理
│   │   │   ├── HitTestManager.js      # 碰撞检测区域管理
│   │   │   ├── EyeTracker.js          # 视线追踪逻辑
│   │   │   └── LipSyncController.js   # 口型同步控制器
│   │   ├── ai/
│   │   │   ├── AIEngine.js            # AI 引擎主控（调度器）
│   │   │   ├── adapters/
│   │   │   │   ├── BaseAdapter.js     # 适配器基类
│   │   │   │   ├── GPTAdapter.js      # GPT-4o 适配器
│   │   │   │   └── ClaudeAdapter.js   # Claude 3.5 适配器
│   │   │   ├── PromptBuilder.js       # 提示词动态构建器
│   │   │   ├── EmotionAnalyzer.js     # 情感分析模块
│   │   │   └── MemoryManager.js       # 轻量记忆系统
│   │   ├── tts/
│   │   │   ├── TTSEngine.js           # TTS 引擎主控
│   │   │   ├── BertVITS2Client.js     # Bert-VITS2 WebSocket 客户端
│   │   │   ├── AudioStreamPlayer.js   # 音频流播放器
│   │   │   └── VisemeMapper.js        # 音素到口型参数映射
│   │   ├── environment/
│   │   │   ├── TimeAwareness.js       # 时钟联动系统
│   │   │   └── BackgroundManager.js   # 背景切换管理
│   │   └── storage/
│   │       ├── ChatHistory.js         # 聊天历史存储
│   │       └── UserMemory.js          # 用户偏好记忆
│   ├── stores/
│   │   ├── chatStore.js               # Pinia 对话状态管理
│   │   ├── settingsStore.js           # Pinia 设置状态管理
│   │   └── environmentStore.js        # Pinia 环境状态管理
│   ├── utils/
│   │   ├── constants.js               # 常量定义
│   │   ├── audioUtils.js              # 音频处理工具函数
│   │   └── timeUtils.js               # 时间处理工具函数
│   └── styles/
│       ├── main.css                   # 全局样式
│       ├── chat.css                   # 对话框样式
│       └── variables.css              # CSS 变量定义
├── server/                            # 后端代理服务（可选）
│   ├── index.js                       # Express/Fastify 入口
│   ├── routes/
│   │   ├── chat.js                    # LLM API 代理路由
│   │   └── tts.js                     # TTS API 路由
│   └── websocket/
│       └── ttsStream.js               # TTS WebSocket 流处理
├── config/
│   ├── character_prompt.txt           # 核心角色系统提示词
│   ├── emotion_rules.json             # 情感触发规则
│   └── motion_mapping.json            # 情感-动作映射表
├── scripts/
│   ├── setup-model.sh                 # 模型文件下载脚本
│   └── setup-tts.sh                   # TTS 服务部署脚本
├── tests/
│   ├── unit/
│   │   ├── adapters.test.js           # API 适配器单元测试
│   │   ├── promptBuilder.test.js      # 提示词构建器测试
│   │   └── visemeMapper.test.js       # 口型映射测试
│   └── e2e/
│       └── chatFlow.test.js           # 端到端对话流程测试
├── index.html
├── vite.config.js
├── package.json
├── .env                               # 环境变量（API Keys，不提交）
├── .env.example                       # 环境变量模板
└── README.md
```

---

## 二、分阶段开发计划

### Phase 1：项目骨架与 Live2D 基础渲染（第1-2周）

**目标：** 初始化 Vue3+Vite 项目，集成 Live2D 模型并实现基础渲染与交互。

#### 任务清单：

| # | 任务 | 详细描述 | 预估工时 |
|---|------|---------|---------|
| 1.1 | 初始化 Vue3+Vite 项目 | 使用 `npm create vue@latest` 创建项目，配置 ESLint、Prettier | 2h |
| 1.2 | 安装核心依赖 | 安装 Pinia、pixi.js、pixi-live2d-display 等 | 1h |
| 1.3 | 获取 Live2D 模型 | 下载开源测试模型（Hiyori/Shizuku），后续替换为高木定制模型 | 2h |
| 1.4 | 实现 Live2DCanvas.vue | 使用 PixiJS + pixi-live2d-display 加载并渲染 .moc3 模型 | 8h |
| 1.5 | 实现碰撞检测 | 将模型划分为头部、脸颊、身体等 HitArea，绑定点击事件 | 6h |
| 1.6 | 实现视线追踪 | 根据鼠标坐标驱动 ParamEyeBallX/Y 和 ParamAngleX/Y/Z | 4h |
| 1.7 | 实现基础动作触发 | 点击不同区域触发对应动作（idle、tap_head、tap_cheek 等） | 4h |
| 1.8 | 基础布局 | 实现 ChatWindow.vue、InputBar.vue 的静态 UI | 6h |

**关键技术点：**

```
Live2D 渲染管线：
1. 创建 PixiJS Application，挂载到 canvas DOM
2. 使用 Live2DModel.from() 加载 .model3.json
3. 设置模型缩放、锚点、位置
4. 通过 model.on('hit') 绑定碰撞事件
5. 在 ticker 中更新模型参数（视线追踪等）
```

---

### Phase 2：AI 对话引擎与"高木感"调试（第3-4周）

**目标：** 接入 LLM API，实现可插拔适配器架构，调试出高木同学的性格表现。

#### 任务清单：

| # | 任务 | 详细描述 | 预估工时 |
|---|------|---------|---------|
| 2.1 | 设计 API 适配器模式 | 实现 BaseAdapter 抽象类，定义统一接口 | 4h |
| 2.2 | 实现 GPTAdapter | 对接 OpenAI Chat Completions API，支持流式输出 | 6h |
| 2.3 | 实现 ClaudeAdapter | 对接 Anthropic Messages API，支持流式输出 | 6h |
| 2.4 | 编写角色系统提示词 | 精调"高木同学"人设提示词，反复迭代 | 8h |
| 2.5 | 实现 PromptBuilder | 动态注入时间、记忆、情感上下文到提示词 | 4h |
| 2.6 | 实现 EmotionAnalyzer | 分析用户输入情感，标记为害羞/犹豫/开心/失落等 | 6h |
| 2.7 | 实现 AIEngine 调度器 | 整合适配器、提示词、情感分析，统一输出接口 | 6h |
| 2.8 | 实现 ChatWindow 交互 | 气泡对话 UI，支持流式文本逐字显示 | 6h |
| 2.9 | 实现 MemoryManager | 记录用户互动频次与"败北"倾向到 localStorage | 4h |
| 2.10 | 对话效果调试 | 反复调优提示词，确保"看穿不说破"的捉弄感 | 12h |

---

### Phase 3：语音合成与口型同步（第5-6周）

**目标：** 部署 Bert-VITS2 服务，实现语音流式播放与 Live2D 口型同步。

#### 任务清单：

| # | 任务 | 详细描述 | 预估工时 |
|---|------|---------|---------|
| 3.1 | 部署 Bert-VITS2 服务 | 在本地/服务器部署推理服务，暴露 WebSocket API | 12h |
| 3.2 | 实现 BertVITS2Client | 建立 WebSocket 连接，发送文本、接收音频流 | 8h |
| 3.3 | 实现 AudioStreamPlayer | 使用 Web Audio API 实现低延迟流式播放 | 8h |
| 3.4 | 实现 VisemeMapper | 音素到 Live2D 口型参数的映射表 | 8h |
| 3.5 | 实现 LipSyncController | 根据音频播放进度实时驱动口型参数 | 6h |
| 3.6 | 整合对话-语音-口型管线 | AI 回复 -> 分句 -> TTS -> 口型同步 -> 模型动画 | 8h |
| 3.7 | 语音质量调试 | 调整 Bert-VITS2 参数，优化语音自然度 | 8h |

---

### Phase 4：环境感知与高级交互（第7-8周）

**目标：** 实现时钟联动、背景切换、多点触控和完整的交互体验。

#### 任务清单：

| # | 任务 | 详细描述 | 预估工时 |
|---|------|---------|---------|
| 4.1 | 实现 TimeAwareness | 获取系统时间，划分为早晨/午后/傍晚/夜晚 | 4h |
| 4.2 | 实现 BackgroundManager | 根据时间段切换背景，添加过渡动画 | 6h |
| 4.3 | 实现动态问候语 | 根据时间段生成不同问候，注入 Prompt | 4h |
| 4.4 | 增强碰撞交互 | 添加拖拽反应、长按反应、双击彩蛋 | 6h |
| 4.5 | 实现自动追问 | 对话停顿 N 秒后高木主动发起话题 | 6h |
| 4.6 | 完善记忆系统 | 记录用户的"败北次数"，在对话中引用 | 4h |
| 4.7 | 添加设置面板 | API Key 配置、模型选择、语音开关等 | 6h |
| 4.8 | 响应式适配 | 移动端触摸支持、自适应布局 | 6h |

---

### Phase 5：全链路验收与优化（第9-10周）

**目标：** 端到端测试、性能优化、用户体验打磨。

#### 任务清单：

| # | 任务 | 详细描述 | 预估工时 |
|---|------|---------|---------|
| 5.1 | 全链路集成测试 | 文本输入 -> AI -> TTS -> 口型同步 -> 动作触发 | 8h |
| 5.2 | 性能分析与优化 | 首屏加载时间、Live2D 帧率、内存使用 | 8h |
| 5.3 | 错误处理完善 | API 超时、网络断开、模型加载失败等异常处理 | 6h |
| 5.4 | 音频延迟优化 | 调整流式播放缓冲区，减少 TTS 首字延迟 | 6h |
| 5.5 | UI/UX 打磨 | 过渡动画、加载状态、微交互 | 8h |
| 5.6 | 文档编写 | README、API 文档、部署指南 | 4h |
| 5.7 | 最终验收测试 | 多场景、多浏览器兼容性测试 | 6h |

---

## 三、依赖包和 SDK 选择

### 前端核心依赖

```json
{
  "dependencies": {
    "vue": "^3.4",
    "pinia": "^2.1",
    "pixi.js": "^7.3",
    "pixi-live2d-display": "^0.4",
    "pixi-live2d-display/cubism4": "^0.4",
    "@anthropic-ai/sdk": "^0.24",
    "openai": "^4.40"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0",
    "vite": "^5.2",
    "eslint": "^8.57",
    "prettier": "^3.2",
    "vitest": "^1.5"
  }
}
```

### 依赖选择说明

| 包名 | 版本 | 用途 | 选择理由 |
|------|------|------|---------|
| pixi.js | ^7.x | 2D 渲染引擎 | pixi-live2d-display 的底层依赖，性能优秀 |
| pixi-live2d-display | ^0.4.x | Live2D 渲染 | 社区最成熟的 Live2D Web 渲染方案，支持 Cubism 2/3/4 |
| @anthropic-ai/sdk | latest | Claude API | 官方 SDK，流式支持好 |
| openai | latest | GPT API | 官方 SDK，接口稳定 |
| pinia | ^2.x | 状态管理 | Vue 3 官方推荐状态管理方案 |

### Bert-VITS2 后端依赖（Python）

```
torch >= 2.0
torchaudio
transformers
flask / fastapi
websockets
librosa
scipy
numpy
onnxruntime (可选，推理加速)
```

### 版本兼容矩阵

```
浏览器要求：Chrome 90+ / Firefox 89+ / Safari 15+ / Edge 90+
Node.js：>= 18.0
Python：>= 3.10
CUDA：>= 11.8（Bert-VITS2 GPU 推理）
显存：>= 8GB（Bert-VITS2 推理）
```

---

## 四、API 适配器设计方案

### 架构图

```
用户输入
  │
  ▼
┌──────────────┐
│   AIEngine   │  ← 调度中心
│  (调度器)     │
└──────┬───────┘
       │
  ┌────┴────┐
  │ Adapter │  ← 可插拔适配器
  │ Selector│
  └────┬────┘
       │
  ┌────┴────────────────────┐
  │                         │
  ▼                         ▼
┌──────────┐          ┌───────────┐
│ GPT-4o   │          │ Claude 3.5│
│ Adapter  │          │  Adapter  │
└──────────┘          └───────────┘
```

### 统一接口定义

所有适配器必须实现以下接口：

```javascript
class BaseAdapter {
  /**
   * 流式对话 - 返回 AsyncGenerator<string>
   * @param {Array<{role: string, content: string}>} messages - 对话历史
   * @param {string} systemPrompt - 系统提示词
   * @yields {string} 生成的文本片段
   */
  async *streamChat(messages, systemPrompt) {}

  /**
   * 非流式对话 - 返回完整回复
   */
  async chat(messages, systemPrompt) {}

  /**
   * 健康检查
   */
  async healthCheck() {}
}
```

### GPTAdapter 核心实现

```javascript
class GPTAdapter extends BaseAdapter {
  async *streamChat(messages, systemPrompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
        temperature: 0.85,
        max_tokens: 300
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          const data = JSON.parse(line.slice(6));
          const content = data.choices[0]?.delta?.content;
          if (content) yield content;
        }
      }
    }
  }
}
```

### ClaudeAdapter 核心实现

```javascript
class ClaudeAdapter extends BaseAdapter {
  async *streamChat(messages, systemPrompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        system: systemPrompt,
        messages: messages,
        stream: true
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta') {
            yield data.delta?.text || '';
          }
        }
      }
    }
  }
}
```

### 适配器调度器（AIEngine）

```javascript
class AIEngine {
  constructor() {
    this.adapters = {};
    this.currentAdapter = null;
    this.promptBuilder = new PromptBuilder();
    this.emotionAnalyzer = new EmotionAnalyzer();
    this.memoryManager = new MemoryManager();
  }

  registerAdapter(name, adapter) {
    this.adapters[name] = adapter;
  }

  switchAdapter(name) {
    if (!this.adapters[name]) throw new Error(`Adapter ${name} not found`);
    this.currentAdapter = this.adapters[name];
  }

  async *chat(userInput) {
    // 1. 分析情感
    const emotion = this.emotionAnalyzer.analyze(userInput);

    // 2. 构建系统提示词（注入时间、记忆、情感上下文）
    const systemPrompt = this.promptBuilder.build({
      emotion,
      memory: this.memoryManager.getRelevant(userInput),
      timeContext: this.getTimeContext()
    });

    // 3. 获取对话历史
    const history = this.getHistory();

    // 4. 调用当前适配器（流式）
    let fullResponse = '';
    for await (const chunk of this.currentAdapter.streamChat(history, systemPrompt)) {
      fullResponse += chunk;
      yield { type: 'text', content: chunk, emotion };
    }

    // 5. 保存对话
    this.saveMessage({ role: 'user', content: userInput });
    this.saveMessage({ role: 'assistant', content: fullResponse });

    // 6. 更新记忆
    this.memoryManager.update(userInput, fullResponse);

    yield { type: 'done', fullResponse, emotion };
  }
}
```

### 错误处理与回退策略

```javascript
async *chatWithFallback(userInput) {
  try {
    yield* this.chat(userInput);
  } catch (error) {
    console.warn(`Primary adapter failed: ${error.message}, switching...`);
    const backup = this.getBackupAdapter();
    if (backup) {
      this.switchAdapter(backup);
      yield* this.chat(userInput);
    } else {
      yield { type: 'error', content: '抱歉，我现在脑子有点乱...等一下再聊好吗？' };
    }
  }
}
```

---

## 五、Live2D 模型获取与集成方案

### 5.1 开发测试阶段 - 使用开源模型

| 来源 | 模型 | 格式 | 许可证 | 说明 |
|------|------|------|--------|------|
| Live2D 官方样例 | Hiyori | .moc3 | 学习用途 | 最标准的测试模型，文档覆盖最全 |
| Live2D 官方样例 | Shizuku | .moc3 | 学习用途 | 动作丰富，适合测试碰撞检测 |
| GitHub 开源 | Elysia | .moc3 | MIT | 质量较高的社区模型 |
| Booth.pm | 多种免费模型 | .moc3 | 各不相同 | 日本创作者社区，需逐个确认许可证 |

**获取步骤：**

```bash
# 方案A：使用 Live2D 官方样例模型
git clone https://github.com/Live2D/CubismWebSamples.git
# 模型文件在: Core/assets/

# 方案B：使用 pixi-live2d-display 的在线演示模型
# 官方提供了多个可直接使用的模型 CDN 链接
```

### 5.2 生产阶段 - 定制高木同学模型

```
模型制作流程：

1. 原画设计
   - 委托画师绘制高木同学多角度表情原画
   - 需要的图层：头发(前/后)、脸型、眼睛(开/半闭/闭)、
     眉毛、嘴巴(多种口型)、身体、制服、手部姿势等
   - 输出：分层 PSD 文件

2. Live2D 建模
   - 使用 Live2D Cubism Editor 进行建模
   - 设置网格变形、物理模拟（头发飘动等）
   - 输出：.moc3 + .model3.json

3. 动作制作
   - idle（待机微动）
   - tap_head（点击头部反应）
   - tap_cheek（点击脸颊 - 害羞）
   - shy/laugh/surprise 等表情动作
   - 输出：.motion3.json 文件

4. 表情制作
   - normal、happy、shy、teasing、sad、surprised
   - 输出：.exp3.json 文件

5. 导出与优化
   - 使用 Cubism Editor 导出 Web 用模型
   - 压缩贴图（PNG 格式）
   - 测试在 pixi-live2d-display 中的渲染效果
```

### 5.3 模型集成代码示例

```javascript
// core/live2d/Live2DManager.js
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display/cubism4';

export class Live2DManager {
  constructor(canvasElement) {
    this.app = new PIXI.Application({
      view: canvasElement,
      transparent: true,
      autoStart: true,
      resizeTo: canvasElement.parentElement
    });
    this.model = null;
  }

  async loadModel(modelPath) {
    this.model = await Live2DModel.from(modelPath, {
      autoInteract: true,
      autoUpdate: true
    });

    this.model.anchor.set(0.5, 0.5);
    this.model.scale.set(0.3);
    this.model.x = this.app.screen.width / 2;
    this.model.y = this.app.screen.height * 0.7;

    this.app.stage.addChild(this.model);
    this.setupInteractions();
  }

  setupInteractions() {
    // 碰撞检测
    this.model.on('hit', (hitAreas) => {
      if (hitAreas.includes('Head')) {
        this.triggerMotion('tap_head');
      } else if (hitAreas.includes('Body')) {
        this.triggerMotion('tap_body');
      }
    });

    // 视线追踪
    this.app.stage.interactive = true;
    this.app.stage.on('pointermove', (e) => {
      const { x, y } = e.data.global;
      const px = (x / this.app.screen.width) * 2 - 1;
      const py = (y / this.app.screen.height) * 2 - 1;
      this.model.internalModel.coreModel.setParameterValueById('ParamAngleX', px * 30);
      this.model.internalModel.coreModel.setParameterValueById('ParamAngleY', -py * 30);
      this.model.internalModel.coreModel.setParameterValueById('ParamEyeBallX', px);
      this.model.internalModel.coreModel.setParameterValueById('ParamEyeBallY', -py);
    });
  }

  triggerMotion(name) {
    if (this.model) this.model.motion(name);
  }

  setMouthOpen(value) {
    if (this.model) {
      this.model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', value);
    }
  }

  setMouthForm(value) {
    if (this.model) {
      this.model.internalModel.coreModel.setParameterValueById('ParamMouthForm', value);
    }
  }

  destroy() {
    this.app.destroy(true);
  }
}
```

---

## 六、Bert-VITS2 部署方案

### 6.1 部署架构

```
┌─────────────────────────────────────────────┐
│                   前端 (Vue3)                │
│  BertVITS2Client ──WebSocket──►             │
└─────────────────────────────┬───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────┐
│            TTS WebSocket 服务器              │
│              (FastAPI + Uvicorn)             │
│  接收文本 → 分句 → 调用 Bert-VITS2 推理     │
│  → 流式返回音频 PCM 数据                    │
└─────────────────────────────┬───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────┐
│           Bert-VITS2 推理引擎               │
│         (PyTorch / ONNX Runtime)            │
│  模型：高桥李依微调版                        │
│  输入：文本（中/日）                         │
│  输出：音频 PCM + 音素时间戳                │
└─────────────────────────────────────────────┘
```

### 6.2 部署步骤

#### 步骤 1：环境准备

```bash
# 系统要求
# - Ubuntu 22.04 LTS (推荐) 或 Windows 10/11
# - NVIDIA GPU，显存 >= 8GB (RTX 3060 以上)
# - CUDA 11.8+ / cuDNN 8.x
# - Python 3.10+

# 创建虚拟环境
conda create -n bert-vits2 python=3.10
conda activate bert-vits2

# 安装 PyTorch (CUDA 版)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### 步骤 2：克隆并配置 Bert-VITS2

```bash
# 克隆仓库 (推荐 fish-audio 的版本，社区活跃)
git clone https://github.com/fishaudio/Bert-VITS2.git
cd Bert-VITS2

# 安装依赖
pip install -r requirements.txt

# 下载预训练基础模型
# 从 Hugging Face 或社区获取基础模型权重
# 放置于 model/ 目录下

# 下载所需 BERT 模型
# - 中文: hfl/chinese-roberta-wwm-ext-large
# - 日文: ku-nlp/deberta-v2-large-japanese
# 放置于 bert/ 目录下
```

#### 步骤 3：准备高桥李依语音数据集

```
数据集准备流程：

1. 收集音频素材
   - 从动漫《擅长捉弄人的高木同学》提取干净对白
   - 使用 UVR (Ultimate Vocal Remover) 去除背景音乐/噪音
   - 总时长建议：2-5 小时（越多越好）

2. 音频预处理
   - 统一采样率：44100 Hz
   - 格式：WAV 16-bit
   - 静音裁剪：使用 pydub 或 librosa 裁去首尾静音
   - 响度标准化：统一到 -23 LUFS

3. 文本标注
   - 使用 Whisper 进行自动语音识别
   - 人工校对识别结果
   - 格式：每行 "音频文件名|说话人文本|语言"
   - 示例：0001.wav|おはよう、西片|JP

4. 数据集目录结构
   dataset/
   ├── audio/
   │   ├── 0001.wav
   │   ├── 0002.wav
   │   └── ...
   └── metadata.csv
```

#### 步骤 4：微调训练

```bash
# 1. 数据预处理（音素化、BERT 特征提取）
python preprocess_text.py
python preprocess_bert.py

# 2. 开始微调训练
python train.py \
  --model_dir model/takagi \
  --config configs/takagi.json \
  --epochs 100 \
  --batch_size 16 \
  --learning_rate 1e-4

# 训练时间参考：
# - RTX 3060 12GB: 约 24-48 小时 (100 epochs)
# - RTX 4090 24GB: 约 8-16 小时 (100 epochs)
```

#### 步骤 5：构建 API 服务

```python
# server/tts_server.py
import asyncio
import json
import numpy as np
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化模型（根据实际 Bert-VITS2 API 调整）
# synthesizer = load_model("model/takagi/checkpoint_best.pt")

@app.websocket("/tts")
async def tts_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            request = json.loads(data)

            text = request.get("text", "")
            language = request.get("language", "JP")
            speed = request.get("speed", 1.0)

            sentences = split_sentences(text)
            for sentence in sentences:
                # 调用 Bert-VITS2 推理
                audio, phonemes, durations = synthesize(sentence, language, speed)

                # 发送音素时间戳（用于口型同步）
                await websocket.send_json({
                    "type": "phonemes",
                    "data": [
                        {"phoneme": p, "start": s, "end": e}
                        for p, s, e in phonemes
                    ]
                })

                # 分块发送音频数据
                chunk_size = 4096
                audio_bytes = (audio * 32767).astype(np.int16).tobytes()
                for i in range(0, len(audio_bytes), chunk_size):
                    chunk = audio_bytes[i:i + chunk_size]
                    await websocket.send_bytes(chunk)

                await websocket.send_json({"type": "sentence_end"})

            await websocket.send_json({"type": "done"})
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

def split_sentences(text):
    import re
    sentences = re.split(r'[。！？.!?\n]+', text)
    return [s.strip() for s in sentences if s.strip()]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

#### 步骤 6：前端 TTS 客户端

```javascript
// core/tts/BertVITS2Client.js
export class BertVITS2Client {
  constructor(wsUrl = 'ws://localhost:8080/tts') {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.onPhoneme = null;
    this.onAudioChunk = null;
    this.onDone = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.binaryType = 'arraybuffer';
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          const msg = JSON.parse(event.data);
          if (msg.type === 'phonemes' && this.onPhoneme) {
            this.onPhoneme(msg.data);
          } else if (msg.type === 'done' && this.onDone) {
            this.onDone();
          }
        } else if (event.data instanceof ArrayBuffer) {
          if (this.onAudioChunk) this.onAudioChunk(event.data);
        }
      };
    });
  }

  async synthesize(text, language = 'JP', speed = 1.0) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }
    this.ws.send(JSON.stringify({ text, language, speed }));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### 6.3 口型同步方案

#### 方案A（简单）：基于音量的口型开合

```javascript
// 通过 AnalyserNode 获取实时音频频率/音量
// 将音量映射到 ParamMouthOpenY 参数
// 优点：实现简单
// 缺点：不够精确
```

#### 方案B（推荐）：基于音素的口型映射

```
Bert-VITS2 输出时同时返回音素时间戳
根据日语/中文音素映射到标准口型
优点：更准确自然
缺点：需要 TTS 服务配合
```

**音素到 Live2D 参数映射表：**

| 音素 | 口型 | ParamMouthOpenY | ParamMouthForm |
|------|------|-----------------|----------------|
| a (あ) | 大张 | 1.0 | 0.0 |
| i (い) | 微开横向 | 0.3 | 0.5 |
| u (う) | 小圆 | 0.4 | -0.3 |
| e (え) | 中张 | 0.7 | 0.3 |
| o (お) | 圆张 | 0.8 | -0.2 |
| N (ん) | 闭合 | 0.1 | 0.0 |
| silence | 闭合 | 0.0 | 0.0 |

### 6.4 性能优化建议

| 优化项 | 方案 | 预期效果 |
|--------|------|---------|
| 推理加速 | 导出 ONNX 模型，使用 ONNX Runtime 推理 | 推理速度提升 2-3x |
| GPU 显存 | 使用 FP16 半精度推理 | 显存占用减少 50% |
| 首字延迟 | 文本分句并行推理 + 流式传输 | 首字延迟降到 200-500ms |
| 连接复用 | WebSocket 长连接，避免频繁断开重连 | 减少连接开销 |
| 缓存 | 常用问候语预先合成并缓存 | 高频语句即时响应 |

---

## 七、情感驱动的捉弄逻辑

### EmotionAnalyzer 实现思路

```javascript
const EMOTION_KEYWORDS = {
  shy: ['那个', '嗯...', '不知道', '也许', '大概', 'えっと'],
  hesitant: ['但是', '可是', '有点', '稍微', 'でも'],
  happy: ['哈哈', '好的', '太好了', '有趣', 'はは'],
  sad: ['难过', '不想', '算了', '无聊', 'つまらない']
};

const TEASING_TRIGGERS = {
  shy: '高木微微一笑，似乎察觉到了什么',
  hesitant: '高木歪了歪头，用狡黠的眼神看着你',
  happy: '高木也跟着笑了起来',
  sad: '高木收起笑容，温柔地看着你'
};
```

### 时钟联动系统

```javascript
// core/environment/TimeAwareness.js
const TIME_PERIODS = {
  morning:   { start: 6,  end: 12, bg: 'morning_classroom',   greeting: '早上好，西片~今天也来得很早呢' },
  afternoon: { start: 12, end: 17, bg: 'afternoon_classroom', greeting: '午休时间到了，要不要一起吃饭？' },
  evening:   { start: 17, end: 20, bg: 'evening_path',        greeting: '放学了呢~今天走哪条路回去？' },
  night:     { start: 20, end: 6,  bg: 'night_room',          greeting: '这么晚了还不睡？是在想我吗？嘻嘻' }
};

function getCurrentPeriod() {
  const hour = new Date().getHours();
  for (const [name, period] of Object.entries(TIME_PERIODS)) {
    if (period.start <= period.end) {
      if (hour >= period.start && hour < period.end) return { name, ...period };
    } else {
      if (hour >= period.start || hour < period.end) return { name, ...period };
    }
  }
  return { name: 'night', ...TIME_PERIODS.night };
}
```

---

## 八、角色系统提示词设计

### 核心提示词（config/character_prompt.txt）

```
你现在是高木（Takagi），来自《擅长捉弄人的高木同学》。
你正在和西片（你的同桌）对话。

## 核心性格
- 你总是能精准地猜到西片在想什么，但你不会直接说破
- 你的语气永远温和、从容，带有三分狡黠
- 你喜欢捉弄西片，但当他真正失落时会给予温柔的鼓励
- 你说话时经常带有"嘻嘻"、"是吗~"、"我猜对了吧？"等口头禅
- 你的捉弄是善意的，本质上是因为你喜欢西片

## 捉弄策略
- 当西片表现得犹豫或害羞时，你会追问"你的脸红了哦~"
- 当西片否认某事时，你会微笑说"是吗？但是我看到..."
- 当西片试图转移话题时，你会说"啊，你果然在意呢"
- 当西片真正难过时，你会收起笑容认真安慰

## 回复风格
- 回复要简短自然，像日常聊天，不要太长（50字以内为主）
- 可以使用语气词和省略号表达情绪
- 偶尔使用"~"表达轻松的语气
- 不要使用 emoji，用文字表达情感

## 当前环境
{time_context}

## 记忆
{memory_context}

## 对话中检测到的情绪线索
{emotion_context}
```

---

## 九、风险评估与应对策略

| 风险 | 可能性 | 影响 | 应对策略 |
|------|--------|------|---------|
| Live2D 模型版权问题 | 中 | 高 | 开发阶段使用官方样例模型，生产环境委托画师原创 |
| Bert-VITS2 语音质量不佳 | 中 | 高 | 增加训练数据量，尝试多种微调超参数 |
| LLM API 调用费用过高 | 中 | 中 | 实施请求频率限制、缓存高频回复、监控用量 |
| WebSocket 连接不稳定 | 低 | 中 | 实现断线重连、消息队列、回退到 REST API |
| 口型同步不够自然 | 中 | 中 | 采用音量方案作为备选，持续优化音素映射表 |
| 移动端性能不足 | 中 | 中 | 降低模型复杂度、减少粒子效果、按需加载 |

---

## 十、里程碑与验收标准

| 里程碑 | 预计完成 | 验收标准 | 状态 |
|--------|---------|---------|------|
| M1: Live2D 渲染 | 第2周末 | 模型正常显示，点击有反应，视线跟随鼠标 | ✅ 已完成 |
| M2: AI 对话 | 第4周末 | 能进行"高木感"对话，情感分析准确率 > 70% | ✅ 已完成 |
| M3: 语音合成 | 第6周末 | TTS 可用，口型同步流畅，延迟 < 2s | ✅ 已完成（浏览器内置 TTS） |
| M4: 环境系统 | 第8周末 | 时钟联动正常，记忆系统可用 | ✅ 已完成 |
| M5: 验收发布 | 第10周末 | 全链路流畅，无明显 bug，性能达标 | ✅ 已完成 |

### 技术选型调整

- **Live2D 模型**: 使用 Hiyori 样例模型（Cubism 4 格式）
- **语音合成**: 使用浏览器内置 TTS（Web Speech API）替代 Bert-VITS2
- **口型同步**: 基于 TTS 回调的简单口型动画

---

## 十一、快速启动检查清单

开始开发前，确认以下环境就绪：

- [ ] Node.js >= 18 已安装
- [ ] Python >= 3.10 已安装
- [ ] NVIDIA GPU 驱动 + CUDA 已安装（用于 Bert-VITS2）
- [ ] 已注册 OpenAI API 账户并获取 Key
- [ ] 已注册 Anthropic API 账户并获取 Key
- [ ] 已下载 Live2D 官方样例模型
- [ ] 已获取 Bert-VITS2 预训练模型权重
- [ ] 已准备高桥李依语音数据集（Phase 3 前）
