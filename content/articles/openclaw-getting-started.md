---
title: "OpenClaw 上手指南：从安装到深度实践"
date: 2026-03-10
tags:
  - "OpenClaw"
  - "AI Agent"
  - "Telegram"
  - "WhatsApp"
  - "自托管"
description: "OpenClaw 是一个开源的 AI Agent 网关，支持多平台消息接入。本文详细介绍如何安装、配置、以及利用其强大的 Subagent、Cron、Memory 等功能打造个人 AI 助手。"
cover:
  image: "/articles/openclaw-cover.png"
  alt: "OpenClaw 上手指南"
  caption: "由 Tiny Stable Diffusion 生成"
showToc: true
TocOpen: true
---

> 核心理念：把 AI 助手装进自己的服务器，通过任意聊天软件随时召唤。

OpenClaw 是一个**自托管的 AI 网关**，它把你的各种聊天软件（微信、Telegram、Discord等）和一个 AI Agent 连接起来。你不需要在手机上装奇怪的插件，也不需要把数据交给第三方——一切都在你自己的机器上运行。

## 安装：5 分钟入门

### 环境要求

- Node.js 22+
- macOS / Linux / Windows (WSL)
- 一个 AI API Key（OpenAI、Claude、MiniMax 等）

### 一键安装

```bash
# 全局安装
npm install -g openclaw@latest

# 初始化配置（交互式）
openclaw onboard
```

`onboard` 命令会引导你完成：
1. 选择 AI Provider（OpenAI / Claude / MiniMax 等）
2. 配置 API Key
3. 选择要接入的渠道（Telegram / WhatsApp / Discord 等）
4. 安装系统服务（可选，守护进程开机自启）

### 启动网关

```bash
# 方式一：前台运行
openclaw gateway

# 方式二：后台守护进程
openclaw daemon start
```

启动后访问本地控制台：`http://127.0.0.1:18789/`

## 渠道接入：消息从哪里来

### Telegram

```bash
# 登录 Telegram（获取 bot token）
openclaw channels login telegram
```

在 Telegram 中搜索 @BotFather，创建一个新 Bot，获取 Token。然后填入配置。

### WhatsApp

```bash
openclaw channels login whatsapp
```

会弹出一个二维码，用手机 WhatsApp 扫码即可。

### 飞书（Feishu）

飞书是目前国内最常用的企业通讯工具，OpenClaw 原生支持：

```bash
openclaw channels login feishu
```

配置飞书应用权限后，可以：
- 接收/发送消息
- 操作飞书文档
- 管理云盘文件
- 操作飞书维基页面

详细配置见 [飞书配置文档](/channels/feishu)。

## 核心概念：Workspace

OpenClaw 用 **Workspace** 来隔离不同用户/项目的数据。

默认 Workspace：`~/.openclaw/`

```
.openclaw/
├── workspace/          # 工作目录（你的代码、项目）
├── config.json         # 网关配置
├── sessions/           # 会话历史
├── memory/             # 长期记忆
├── skills/             # 自定义技能
└── media/              # 媒体文件
```

你可以在 Workspace 里放自己的代码，Agent 可以直接读取和修改。

## 进阶功能

### 1. Subagent：多Agent协作

你可以 spawn（孵化）多个子 Agent 来并行处理任务：

```typescript
// 在代码中调用
await sessions_spawn({
  runtime: "subagent",
  task: "帮我查一下今天 AI 圈发生了什么大事",
  label: "research-agent"
});
```

典型场景：
- **内容运营 Agent**：负责搜集资讯、发布文章
- **技术研发 Agent**：写代码、改 Bug
- **行政管理 Agent**：提醒日程、整理资料

每个 Subagent 有独立会话，互不干扰。

### 2. Cron：定时任务

```bash
# 每天早上 9 点推送 AI 资讯
openclaw cron add "AI 资讯推送" "cron 0 9 * * *" \
  --task "搜索今天 AI 圈重大新闻，推送到指定渠道"
```

定时任务非常适合：
- 每日资讯汇总
- 定期检查项目状态
- 定时提醒

### 3. Memory：长期记忆

OpenClaw 有两层记忆：

- **短期**：`sessions/` 目录，每个会话的消息历史
- **长期**：`memory/` 目录，跨会话持久化的关键信息

```typescript
// 记住重要信息
await write("MEMORY.md", "用户喜欢在下午 2 点开会");
```

下次对话时，Agent 自动读取 Memory，了解用户偏好。

### 4. Browser：浏览器控制

OpenClaw 内置无头浏览器，可以自动化网页操作：

```typescript
// 截图
await browser({ action: "screenshot", path: "./screenshot.png" });

// 自动化操作
await browser({
  action: "act",
  request: { kind: "click", ref: "login-btn" }
});
```

实际应用：
- 自动化填表
- 网页数据抓取
- 定时检查网站状态

### 5. Skills：自定义技能

Skills 是可复用的工具集。比如你想让 AI 帮你查天气：

```bash
# 安装天气技能
clawhub install weather
```

内置技能包括：
- **天气查询**：wttr.in / Open-Meteo
- **飞书文档操作**：读、写、创建文档
- **图像生成**：Tiny Stable Diffusion 文生图
- **小红书发布**：自动化发笔记
- **MCP 工具**：支持 Model Context Protocol 扩展

### 6. MCP：模型上下文协议

MCP（Model Context Protocol）是 2024 年底由 Anthropic 推出的标准化协议，让 AI 能够安全地调用外部工具。

```typescript
// 配置 MCP 服务
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/pengjiyuan/projects"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search", "--api-key", "你的 key"]
    }
  }
}
```

### 7. A2A：Agent 到 Agent 通信

A2A（Agent to Agent）是 2025 年 Google 推出的协议，让不同 Agent 之间能够相互通信协作。

```typescript
// 跨 Agent 协作
const result = await a2a.send({
  agent: "research-agent",
  task: "调研 OpenAI 最新模型",
  callback: "my-agent"  // 结果返回给我
});
```

## 实战：打造个人 AI 助手

### 场景 1：AI 写作助手（企业场景）

```
用户需求：销售团队需要每天自动生成客户案例分析报告
```

```typescript
// 定时触发：每天早上 9 点
// 1. 读取昨天 CRM 数据
const crmData = await feishu_bitale_list_records({
  app_token: "你的 CRM 应用",
  table_id: "客户表"
});

// 2. 让 AI 分析并生成报告
const report = await callAI({
  model: "deepseek/deepseek-r1",
  messages: [
    { role: "system", content: "你是一个专业的商业分析师" },
    { role: "user", content: `分析以下客户数据，生成今日报告：${JSON.stringify(crmData)}` }
  ]
});

// 3. 写入飞书文档并通知相关人
await feishu_doc({
  action: "append",
  doc_token: "团队共享文档",
  content: report
});

await feishu_chat({
  action: "send",
  chat_id: "销售群",
  message: "📊 今日客户分析报告已生成"
});
```

### 场景 2：代码审查助手

```
用户需求：GitHub PR 自动审查，提供优化建议
```

```typescript
// 监听 GitHub Webhook
// 当有新 PR 时自动触发

const prDetails = await github.getPR({ owner, repo, pr_number });

const review = await callAI({
  model: "claude-sonnet-4",
  messages: [
    { 
      role: "system", 
      content: "你是一个资深代码审查专家，关注：安全性、性能、可维护性" 
    },
    { 
      role: "user", 
      content: `审查以下 PR：\n\nTitle: ${prDetails.title}\n\nDiff: ${prDetails.diff}` 
    }
  ]
});

// 评论 PR
await github.createReviewComment({
  owner, repo, pr_number,
  body: review
});
```

### 场景 3：智能客服机器人

```
用户需求：自动回复客户问题，分类处理，升级人工
```

```typescript
// 监听消息
onmessage(async (msg) => {
  // 1. 意图识别
  const intent = await callAI({
    model: "qwen/qwen-2.5-72b",
    messages: [
      { role: "user", content: msg.text }
    ],
    tools: [{
      name: "classify_intent",
      description: "识别用户意图",
      parameters: {
        type: "object",
        properties: {
          intent: { type: "string", enum: ["咨询", "投诉", "技术问题", "其他"] },
          urgency: { type: "string", enum: ["低", "中", "高"] }
        }
      }
    }]
  });

  // 2. 根据意图处理
  if (intent.intent === "技术问题") {
    // 检索知识库
    const solution = await rag.search(intent.query);
    await msg.reply(solution);
  } else if (intent.urgency === "高") {
    // 升级人工客服
    await notifyHuman({
      channel: "feishu",
      user: "客服主管",
      message: `高优先级工单：${msg.text}`
    });
  }
});
```

### 场景 4：每日 AI 资讯推送

```typescript
// 每天定时执行
openclaw cron add "AI 资讯推送" \
  "cron 0 9 * * * @ Asia/Shanghai"

const news = await tavily_search({
  query: "AI news today",
  topic: "news",
  time_range: "day"
});

await feishu_doc({
  action: "write",
  doc_token: "你的飞书文档 ID",
  content: formatNews(news)
});
```

### 场景 5：语音助手

配合 TTS（文字转语音）：

```typescript
await tts({
  text: "今天天气晴朗，适合外出",
  channel: "telegram"
});
```

结合手机节点，还能实现语音对话交互。

### 场景 6：自动化发小红书

```typescript
// 生成封面图
await canvas({
  action: "present",
  javaScript: `generateCover("${title}", "${subtitle}")`
});

// 自动发布
await xhs_publisher({
  title: "AI 教程",
  content: "今天教大家用...",
  images: ["./cover.png"]
});
```

## 配置参考

完整配置 `~/.openclaw/openclaw.json`：

```json5
{
  // AI Provider 配置
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    minimax: { apiKey: process.env.MINIMAX_API_KEY }
  },
  
  // 默认模型
  model: "minimax-portal/MiniMax-M2.5",
  
  // 渠道配置
  channels: {
    telegram: { enabled: true },
    feishu: { enabled: true }
  },
  
  // 安全设置
  security: {
    allowlist: ["你的 user ID"]
  },
  
  // 消息设置
  messages: {
    groupChat: {
      requireMention: true  // 群聊需要 @ 才响应
    }
  }
}
```

## 常见问题

### Q: 如何保证数据安全？

- 所有数据存在本地（`~/.openclaw/`）
- 不依赖第三方服务器
- API Key 不上传，完全本地处理

### Q: 支持哪些模型？

理论上任何支持 Function Calling 的模型都可以用。2026 年主流模型推荐：

**推理王者：**
- **OpenAI o1 / o3-mini**：推理能力极强，适合复杂任务
- **DeepSeek R1**：国产开源推理模型，免费可自部署
- **Claude 3.7 Sonnet**：代码能力顶尖，新增 Extended Thinking 模式

**多模态：**
- **GPT-4o**：原生多模态，实时语音/视频输入
- **Gemini 2.0 Flash**：Google 最新多模态模型，速度快
- **Qwen 2.5 VL**：阿里开源多模态，效果逼近 GPT-4o

**性价比：**
- **DeepSeek V3**：开源白菜价，API 极便宜
- **MiniMax M2.5**：国内稳定，支持超长上下文

> 2026 年最佳实践：用 o1/DeepSeek R1 做推理，用 GPT-4o/Claude 做日常对话，用 V3/R1 做大批量任务。

### Q: 能同时用多少个渠道？

没有限制。一个 Gateway 可以同时连接 Telegram、WhatsApp、Discord、飞书……只要你的机器和网络撑得住。

## 总结

OpenClaw 的核心价值：

1. **数据自主** — 跑在自己机器上，不交还给任何人
2. **多渠道统一** — 一个入口，接入所有聊天软件
3. **Agent 原生** — 为 AI 协作设计，不是把 chatbot 强行塞进聊天窗口
4. **可扩展** — Skills、Subagent、Cron、Browser，都是现成的构建块

花 5 分钟装好，剩下的，慢慢调教成你的专属 AI 助手。

---

*有问题？来 [OpenClaw Discord](https://discord.com/invite/clawd) 聊聊。*
