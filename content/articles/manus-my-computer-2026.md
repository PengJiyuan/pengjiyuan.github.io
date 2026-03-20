---
title: "Meta Manus「My Computer」：把 AI Agent 从云端拉回桌面"
date: 2026-03-20
tags:
  - "Manus"
  - "Meta"
  - "AI Agent"
  - "本地运行"
  - "OpenClaw"
description: "2026年3月16日，被 Meta 收购的 AI 创业公司 Manus 推出桌面应用「My Computer」，将 AI Agent 直接运行在用户的 Mac 和 PC 上。本文深度解析 My Computer 的功能特性、技术架构，以及它与 OpenClaw 的竞争格局。"
cover:
  image: "/articles/manus-my-computer-2026-cover.png"
  alt: "Meta Manus My Computer 桌面 AI Agent"
  caption: "由 Tiny Stable Diffusion 生成"
showToc: true
TocOpen: true
difficulty: "intermediate"
---

2026年3月16日，AI Agent 赛道迎来了一场桌面争夺战。被 Meta 收购的 AI 创业公司 Manus 正式推出桌面应用——**My Computer**，将 AI Agent 直接运行在用户的 Mac 和 Windows PC 上，无需云端中转。

这是对开源黑马 OpenClaw 的正面回应，也标志着 AI Agent 从「云端大脑」向「本地助手」的全面迁移。

## My Computer 能做什么？

My Computer 是 Manus Desktop 应用的核心功能。它通过在用户本地终端执行 CLI 命令，让 AI Agent 直接读写本地文件、操控应用程序、自动执行复杂工作流。

Manus 官方展示了两类典型场景：

**图片整理**：一位花店老板电脑里存着数千张混乱的照片——花束、绿植、客户合影全挤在一个文件夹。只需对 Manus 说「帮我整理花店的照片」，Agent 就会扫描每张图片的内容，自动创建分类子文件夹并完成分类，整个过程不过几分钟。

**批量重命名**：会计需要将数百张发票重命名为标准格式，这原本需要手工操作一下午，Manus 在几分钟内用几条终端命令搞定。

除了文件管理和任务自动化，My Computer 还能：
- 读取、分析和编辑本地代码文件
- 调用本地开发工具构建项目
- 与已安装的应用程序交互

## 技术架构：与 OpenClaw 的本质区别

My Computer 的发布让很多人第一时间联想到 OpenClaw——两者都是本地运行的 AI Agent，都直接操控用户电脑。但底层架构有根本差异。

| | **OpenClaw** | **Manus My Computer** |
|---|---|---|
| **底层模型** | 开源，可自由选择（Claude、GPT、Gemini 等） | Meta 专有模型栈 |
| **定价** | 免费（开源） | 订阅制 |
| **平台** | macOS / Windows / Linux | macOS / Windows（Apple Silicon 优先） |
| **配置方式** | 高自由度的 skill 配置 | 开箱即用，偏向产品化 |
| **架构理念** | 工具型框架，用户主导 | 成品型 Agent，厂商主导 |

OpenClaw 的优势在于透明和灵活——你完全掌控它使用的模型、调用哪些工具、如何处理数据。但代价是一定的配置门槛和输出质量的波动性。

Manus 则走了相反的路：Meta 把模型能力封装成一款「开箱即用」的商业产品。用户不需要懂 skill、不知道什么是 MCP 服务器，直接用自然语言下达指令即可。这对非技术用户有天然吸引力。

## 安全与隐私：那只悬在桌面的眼睛

AI Agent 直接运行在本地桌面，意味着它能访问你电脑上的所有文件。这个特性既是最大卖点，也是最大争议点。

Manus 明确要求**用户显式授权**后才能执行操作——每次访问文件、控制应用，都需要用户确认。这与 OpenClaw 的安全模型形成对比：

- **OpenClaw**：运行在宿主机上，默认拥有本机全部权限，安全性依赖用户对 skill 来源的判断
- **Manus**：采用更严格的应用级沙箱，任何文件/应用操作都需要用户点确认

从隐私角度看，Manus 强调「数据留在本地」，不会像云端版那样将文件上传到远程服务器处理。但 Meta 作为厂商背景，也让部分用户保持警惕——专有模型的调用数据是否会回传？

## Meta 的 Agent 战略：从云端到桌面

Manus 并不是突然冒出来的。2025年底，Meta 完成对 Manus 的收购，这是继 MoltBook（AI 社交网络）之后 Meta 在 AI Agent 领域的又一次落子。

更值得关注的是，据内部消息，Meta 正在推进 **Avocado 模型家族**、**Manus Agent 能力**和**OpenClaw 兼容层**的三方整合。这意味着 Meta 的 AI 战略并不排斥开源——它希望在 OpenClaw 建立的生态基础上叠加自己的商业化能力。

可以预见，2026年的桌面 AI Agent 市场将是：

- **Apple**：通过 on-device intelligence 框架深化系统级集成
- **Microsoft**：让 Copilot 更深度地接入 Windows 文件系统
- **Google**：将 Gemini 的 Agent 能力嵌入 ChromeOS 和 Android
- **Meta/Manus**：以跨平台 + 开箱即用为卖点争夺用户

## 值得关注的几个问题

**付费意愿 vs. 配置成本**

OpenClaw 免费但需要折腾，Manus 订阅即用。对于愿意花时间配置的用户，OpenClaw 的性价比更高；对于希望「装上就用」的用户，Manus 可能是首选。市场会验证这两类用户的规模对比。

**Meta 品牌信任度**

OpenClaw 的开发者 Peter Steinberger 是独立奥地利工程师，开源社区对这种「个人开发者造出病毒级产品」的故事天然有好感。Meta 作为巨头，用户是否愿意让它「入住」自己的桌面，信任问题不容忽视。

**竞争走向标准化**

无论Manus还是OpenClaw，都在推动一个共识：**本地 AI Agent 是下一代个人计算的基础设施**。当这种能力成为标配，差异化的竞争点将从前端产品转向底层安全标准和互操作协议——A2A、MCP 等标准的重要性会进一步凸显。

---

AI Agent 竞赛已从云端蔓延到桌面。2026年的争夺，才刚开始。

> 参考来源：The Next Web、9to5Mac、Digital Trends、CNBC（2026年3月报道）
