---
title: "MCP 入门：给 AI 装上「手脚」"
date: 2026-02-25
weight: 2
tags:
  - "MCP"
  - "模型上下文协议"
  - "AI工具"
description: "MCP（模型上下文协议）让 AI 能够调用外部工具、访问文件、浏览网页。这是 AI 从「说」到「做」的关键一跃。"
showToc: true
TocOpen: true
---

## MCP 定义

**MCP = Model Context Protocol = 模型上下文协议**

> 由 Anthropic（Claude 母公司）于 2024 年 11 月发布

**一句话解释：让 AI 能"动手"做事的通用标准**

---

## 为什么需要 MCP？

### 以前的问题

```text
AI 只能聊天 (不支持)
每个工具都要单独开发接口 (不支持)
```

### 有 MCP 后

```text
AI 不仅能聊天，还能做事 (支持)
一个协议连接所有工具 (支持)
```

---

## MCP 的核心概念

```text
┌─────────────────────────────────────────────────────────────┐
│                        AI 应用                              │
│                    (ChatGPT、Claude)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ MCP 协议
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server                               │
│              (连接工具和数据的桥梁)                           │
└──────────┬────────────┬────────────┬───────────────┬───────┘
           ↓            ↓            ↓               ↓
     ┌─────────┐  ┌─────────┐  ┌─────────┐    ┌──────────┐
     │ 文件系统 │  │  数据库  │  │  GitHub │    │  搜索   │
     │ Server  │  │  Server  │  │  Server │    │  Server  │
     └─────────┘  └─────────┘  └─────────┘    └──────────┘
```

### 1. MCP Host（宿主）
- AI 应用本身
- 如：Claude Desktop、Cursor

### 2. MCP Server（服务器）
- 连接 AI 和外部工具的"翻译器"
- 每个工具对应一个 MCP Server

### 3. Resources（资源）
- AI 可以读取的数据
- 如：文件、数据库内容

### 4. Tools（工具）
- AI 可以执行的操作
- 如：搜索、发送邮件、读写文件

### 5. Prompts（提示词）
- 预设的提示模板

---

## MCP 能做什么？

### 常用 MCP Server

| 类型 | 功能 | 示例 |
|------|------|------|
| 终端 | 执行命令行 | run command |
| 文件 | 读写文件 | read/write file |
| 搜索 | 联网搜索 | web search |
| Git | Git 操作 | commit, push, PR |
| 代码 | 代码执行 | execute code |
| 数据库 | 数据库查询 | SQL query |
| 网页 | 浏览器控制 | browser automation |

---

## MCP vs API

| 特性 | 传统 API | MCP |
|------|----------|-----|
| 标准化 | 每家不同 | 统一协议 |
| 开发量 | 每个工具单独开发 | 一次开发 |
| 可复用 | 难复用 | 天然复用 |
| 生态 | 封闭 | 开放 |

---

## 2026 年 MCP 发展趋势

- **MCP Apps** - AI 可以渲染完整 UI
- **流式资源** - 实时数据推送
- **更好的认证** - 内置 OAuth
- **远程服务器** - 云端 MCP 服务

---

## 知名 MCP 产品

- [OpenAI MCP](https://platform.openai.com/docs/mcp) - OpenAI 官方
- [Anthropic MCP](https://www.anthropic.com/news/model-context-protocol) - Claude 官方
- [n8n](https://n8n.io) - 工作流自动化 + MCP
- [Zapier](https://zapier.com) - 自动化平台 + MCP

---

## 下一步

学习 MCP 实战 → [MCP 实战教程](./docs/mcp-practice.md)

继续学习 → [什么是 AI Agent？](./docs/agent-intro.md)
