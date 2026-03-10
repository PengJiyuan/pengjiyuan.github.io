---
title: "A2A 协议完全指南：2026 年 AI Agent 通信标准"
date: 2026-03-10
tags:
  - "A2A"
  - "Agent"
  - "协议"
  - "多Agent"
  - "MCP"
  - "Google"
description: "A2A（Agent-to-Agent）协议是 Google 推出的开放标准，旨在解决 AI Agent 之间的通信与协作问题。本文深入解析 A2A 的核心概念、Agent Card 机制、与 MCP 的关系，以及实际开发中的应用场景。"
cover:
  image: "/articles/a2a-protocol-2026-cover.png"
  alt: "A2A 协议完全指南"
  caption: "由 Tiny Stable Diffusion 生成"
showToc: true
TocOpen: true
difficulty: "advanced"
---

2025 年 4 月，Google 正式发布了 A2A（Agent-to-Agent）协议，这被视为 AI Agent 领域的"HTTP 协议"。一年后的 2026 年，A2A 正在成为多 Agent 系统的事实标准。

如果你已经了解 MCP（Model Context Protocol），那么 A2A 就是它的"孪生兄弟"——MCP 解决的是 Agent 与工具的连接问题，而 A2A 解决的是 Agent 与 Agent 之间的通信问题。

本文将深入解析 A2A 协议的核心概念、工作机制，以及与 MCP 的互补关系。

---

## 一、为什么需要 A2A 协议？

### 1.1 多 Agent 系统的崛起

2026 年，单一 Agent 的能力已经很强——Claude Code 可以独立完成编码任务，Operator 可以操作浏览器。但现实世界的复杂任务往往需要多个 Agent 协作：

- **研究 Agent** 负责搜集信息
- **分析 Agent** 负责处理数据
- **写作 Agent** 负责生成报告
- **审核 Agent** 负责质量把控

这些 Agent 可能来自不同团队、不同厂商、不同技术栈。问题是：它们如何发现彼此？如何通信？如何协作？

### 1.2 传统方案的局限性

在 A2A 出现之前，业界尝试过几种方案：

**方案一：同一框架内的多 Agent**
LangGraph、CrewAI、AutoGen 等框架可以编排多个 Agent，但这些 Agent 被"困"在同一个框架内。一旦需要与外部 Agent 通信，就变得非常困难。

**方案二：自定义 API**
每个团队为自己的 Agent 编写 API。这种方式缺乏标准，Agent 之间很难互操作。

**方案三：A2A 的出现**

A2A 提供了统一的通信协议，让不同厂商、不同框架开发的 Agent 能够无缝协作。就像 HTTP 让不同网站可以互联一样，A2A 让不同 Agent 可以互通。

---

## 二、A2A 协议核心概念

### 2.1 四大核心概念

A2A 协议定义了四个核心概念：

**1. Agent Card（Agent 卡片）**

每个 A2A Agent 必须暴露一个 JSON 格式的 Agent Card，相当于 Agent 的"名片"。Agent Card 包含：

- Agent 名称和描述
- 支持的技能（Skills）
- 端点 URL
- 认证方式
- 能力列表

```json
{
  "name": "Research Agent",
  "description": "专业的研究分析 Agent，擅长信息搜集和整理",
  "url": "https://agent.example.com/a2a",
  "version": "2025-04-02",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "skills": [
    {
      "id": "web_search",
      "name": "网页搜索",
      "description": "搜索互联网获取最新信息"
    },
    {
      "id": "data_analysis",
      "name": "数据分析",
      "description": "分析结构化数据并生成报告"
    }
  ],
  "authentication": {
    "schemes": ["Bearer"]
  }
}
```

**2. Client-Server 架构**

A2A 采用经典的客户端-服务器模式：

- **Client Agent**：发起任务的 Agent
- **Remote Agent**：执行任务的 Agent

Client 向 Remote 发送任务请求，Remote 完成处理后返回结果。

**3. 任务生命周期（Task Lifecycle）**

A2A 定义了完整的任务状态机：

```
submitted → working → input-required → completed
                    ↓
                  failed
                    ↓
                  canceled
```

- `submitted`：任务已提交
- `working`：正在处理
- `input-required`：需要用户输入
- `completed`：成功完成
- `failed`：执行失败
- `canceled`：已取消

**4. 消息与工件（Messages & Artifacts）**

A2A 支持多种消息格式：

- **TextMessage**：纯文本
- **ImageMessage**：图片
- **FileMessage**：文件
- **Artifact**：Agent 生成的产物（文档、代码、数据等）

---

## 三、Agent Card 机制详解

### 3.1 Agent 发现方式

Client 如何找到 Remote Agent？A2A 提供了三种发现方式：

**方式一：已知 URL**

如果知道 Agent 的地址，可以直接访问其 Agent Card：

```
GET /.well-known/agent.json
```

**方式二：目录服务**

企业可以部署 Agent 目录，Client 先查询目录获取可用的 Agent 列表。

**方式三：广播发现**

在某些场景下，Agent 可以通过广播的方式被发现。

### 3.2 Skills（技能）

Agent Card 中的 `skills` 字段定义了 Agent 的能力：

```json
{
  "skills": [
    {
      "id": "code_review",
      "name": "代码审查",
      "description": "审查代码质量并提出改进建议",
      "tags": ["programming", "quality"],
      "examples": [
        "审查这个 PR 的代码质量",
        "检查函数是否有安全漏洞"
      ]
    }
  ]
}
```

Client 可以根据 `skills` 选择最适合的 Agent 来执行任务。

---

## 四、A2A 与 MCP：互补而非竞争

### 4.1 两者定位不同

| 维度 | MCP | A2A |
|------|-----|-----|
| 解决什么问题 | Agent 与工具的连接 | Agent 与 Agent 的通信 |
| 类比 | USB-C（设备与配件的连接） | HTTP（设备与设备的连接） |
| 发起方 | Agent | Agent |
| 接收方 | 工具、服务、数据 | 另一个 Agent |
| 状态 | 通常是无状态的 | 有状态的任务生命周期 |

### 4.2 典型的组合架构

```
┌─────────────────────────────────────────┐
│           Client Agent (A2A)            │
│  (负责任务编排和协调)                    │
└─────────────┬───────────────────────────┘
              │ A2A
    ┌─────────┴─────────┐
    ▼                   ▼
┌─────────────┐   ┌─────────────┐
│  Research   │   │   Writer    │
│  Agent      │   │   Agent     │
│  (A2A)      │   │   (A2A)     │
└──────┬──────┘   └──────┬──────┘
       │                 │
       │ MCP             │ MCP
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ Web Search  │   │   Docs      │
│  Server     │   │   API       │
└─────────────┘   └─────────────┘
```

这个架构展示了 A2A 与 MCP 的协作模式：

- **A2A** 负责 Agent 之间的任务分配和结果传递
- **MCP** 负责每个 Agent 与其所需工具的连接

### 4.3 2026 年的生态现状

截至 2026 年：

- **MCP**：8,000+ 社区服务器，支持 Claude、GPT、Gemini、Cursor、Windsurf 等主流客户端
- **A2A**：由 Google 推出，Linux Foundation 托管，已被多个厂商采用

两者正在形成互补的生态，共同构成 Agent 互联的基础设施。

---

## 五、实战：A2A + MCP 组合使用

### 5.1 场景：自动化研究报告生成

假设我们要构建一个自动生成行业研究报告的系统：

1. **研究 Agent**（A2A Client）：协调整个流程
2. **搜索 Agent**（A2A Server + MCP）：负责信息搜集
3. **分析 Agent**（A2A Server + MCP）：负责数据分析
4. **写作 Agent**（A2A Server + MCP）：负责生成报告

### 5.2 实现步骤

**第一步：定义 Agent Card**

```json
{
  "name": "Search Agent",
  "description": "专业的互联网信息搜索 Agent",
  "url": "https://search-agent.example.com/a2a",
  "version": "2025-04-02",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "web_search",
      "name": "网页搜索",
      "description": "使用搜索引擎获取信息"
    }
  ]
}
```

**第二步：实现 A2A Server**

```python
from a2a.server import A2AServer
from a2a.types import AgentCard, TextMessage, TaskStatus

agent_card = AgentCard(
    name="Search Agent",
    description="专业的互联网信息搜索 Agent",
    url="http://localhost:8000",
    version="2025-04-02",
    capabilities={"streaming": True}
)

server = A2AServer(agent_card=agent_card)

@server.task_handler()
async def handle_task(task):
    query = task.message.content
    results = await search_web(query)
    
    return TaskStatus(
        state="completed",
        artifacts=[{"type": "text", "content": results}]
    )
```

**第三步：实现 A2A Client**

```python
from a2a.client import A2AClient

client = A2AClient("https://search-agent.example.com/a2a")

# 发现 Agent
agent_card = await client.discover_agent()

# 发送任务
task = await client.send_task({
    "message": {
        "role": "user",
        "content": "搜索 2026 年 AI Agent 发展趋势"
    }
})

print(task.result)
```

### 5.3 MCP 集成

每个 Agent 内部可以通过 MCP 连接工具：

```python
from mcp import Client

# 搜索 Agent 内部使用 MCP 连接搜索引擎
mcp_client = Client("mcp-server-web-search")

results = await mcp_client.call_tool("search", {
    "query": "AI trends 2026"
})
```

---

## 六、A2A 协议的安全考量

### 6.1 认证与授权

A2A 支持多种认证方式：

- **Bearer Token**：OAuth 2.0 风格的令牌认证
- **API Key**：简单的密钥认证
- **自定义**：支持扩展的认证机制

### 6.2 安全最佳实践

**1. 验证 Agent Card**

Agent Card 可能包含恶意内容，必须验证其来源和完整性。

**2. 输入 sanitization**

来自外部 Agent 的所有输入都应被视为不可信，进行适当的过滤和验证。

**3. 最小权限原则**

每个 Agent 应该只被授予完成任务所需的最小权限。

**4. 审计日志**

记录所有 A2A 通信，便于安全审计和问题排查。

---

## 七、常见问题

### Q1：已经有 MCP 了，为什么还需要 A2A？

MCP 和 A2A 解决的是不同层次的问题。MCP 让 Agent 能"做事"（调用工具），A2A 让 Agent 能"协作"（与其他 Agent 配合）。两者是互补关系，而非替代关系。

### Q2：A2A 与现有的多 Agent 框架（如 LangGraph）冲突吗？

不冲突。A2A 是通信协议，LangGraph 是编排框架。你可以在 LangGraph 中使用 A2A 来连接外部 Agent。

### Q3：A2A 支持实时流式输出吗？

支持。A2A 的 `capabilities.streaming` 字段表示是否支持服务器发送事件（SSE）进行流式输出。

### Q4：如何在生产环境中部署 A2A？

A2A 本质上是基于 HTTP 的协议，可以部署在任何支持 HTTP 的基础设施上。建议使用 API 网关进行负载均衡、认证和监控。

---

## 八、总结

A2A 协议代表了 2026 年 AI Agent 发展的重要方向——从单 Agent 能力增强走向多 Agent 协作生态。

**核心要点：**

1. **A2A 是 Agent 之间的通信协议**，让不同厂商、不同框架的 Agent 能够互联互通
2. **Agent Card 是 A2A 的核心**，定义了 Agent 的身份、能力和服务端点
3. **A2A 与 MCP 互补**：MCP 连接 Agent 与工具，A2A 连接 Agent 与 Agent
4. **2026 年生态正在成熟**，A2A + MCP 组合正在成为多 Agent 系统的标准架构

如果你正在构建多 Agent 系统，理解 A2A 协议将是必备技能。

---

## 参考资源

- [A2A 官方 GitHub](https://github.com/a2aproject)
- [A2A 协议规范](https://a2a.ai)
- [MCP vs A2A 对比](https://devtk.ai/en/blog/mcp-vs-a2a-comparison-2026/)
