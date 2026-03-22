---
title: "[我的想法] AI Agent 经济需要哪些基础设施"
date: 2026-03-22
tags:
  - "AI Agent"
  - "副业"
  - "MCP"
  - "基础设施"
description: "当 AI Agent 能自主买卖、协作之后，支付、身份、信任、审计这些商业基础设施也得跟着变。这是一个比「做 Agent 应用」更底层的方向，值得想深一点。"
---

# [我的想法] AI Agent 经济需要哪些基础设施

Meta 收购 Moltbook（AI Agent 专属社交网络）、Lemrock 拿了 $6M 做 Agent 内部的商业层——这两件事放在一起看，有个更大的故事：**当 Agent 能买卖之后，谁来建基础设施？**

这像极了 2003 年的互联网。那时候淘宝起来了，但支付宝还没出生；eBay 进来中国，但信用体系不完善。真正的电商爆发，是基础设施成熟之后的事。

今天的 AI Agent 经济，大概也处在这个节点。

## Agent 经济需要什么？

**1. 身份层（Agent ID）**
Agent 协作首先得知道对方是谁。不是自然人 ID，是"这个 Agent 有没有权限做这件事"的数字身份。Google 提出过"digital passport for agents"，Oasis Security 拿了 $120M B 轮做的就是 just-in-time access for AI agents。需求真实。

**2. 支付层（Agent Payments）**
Agent 之间买卖服务，需要支付指令、托管、退款。Stripe 解决了人类电商支付，但 Agent 支付的颗粒度更细（按 token 计量、按任务结算），现在的支付基础设施不一定合适。这是 Lemrock 在做的事。

**3. 信任层（Agent Trust）**
eBay 当年的评价系统解决了"卖家靠不靠谱"的问题。Agent 也需要类似的东西——这个 Agent 历史上守约吗？它的决策质量如何？Oasis Security 在做访问信任，Lemrock 在做交易信任，但评价体系还没人做。

**4. 审计层（Agent Audit）**
企业部署了 Agent，得知道 Agent 做了什么。32-61 分钟的威胁调查被压缩到 3 分钟（Qevlar AI），这个方向 Google、Deutsche Telekom、Onyx Security 都在做。日志 + 可视化 + 合规审计，需求刚。

**5. 互联层（Agent Discovery）**
MCP 协议正在成为 Agent 界的"USB 接口"。Anthropic/Amazon/FreeWheel 支持，Google 做 A2A，Yahoo/PubMatic 做 AdCP。标准正在收敛，但标准之间的桥接器还没人做——就像当年 RSS 阅读器需要兼容多个 RSS 标准一样。

## 哪个方向最适合独立开发者切入？

如果让我排优先级：

- **MCP 集成工具**：技术可行，现有大模型上下文里已经支持 MCP，有清晰的客户付费意愿（企业 MCP Server 搭建）
- **Agent 审计日志**：竞品多，但都是大厂方案，中小企业需要 easy mode
- **Agent 身份层**：壁垒高，需要更深的安全背景，适合长期押注

Agent 支付层看起来最性感的，但支付受监管影响大，不适合早期副业。

---

*这波 AI 浪潮里，应用层已经卷成红海，基础设施层还是荒地。能不能比大厂早半年看到、早动手做，可能是独立开发者唯一的机会窗口。*
