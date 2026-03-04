---
title: "如何获取 AI API Key"
date: 2026-02-12
weight: 12
tags:
  - "API Key"
  - "OpenAI"
  - "Claude"
description: "一站式指南：OpenAI、Anthropic、通义千问等主流厂商 API Key 申请全流程。"
showToc: true
TocOpen: true
---

## 什么是 API Key？

**API Key = 打开 AI 服务的"钥匙"**

就像进门需要钥匙一样，用 AI 的 API 也需要这把"钥匙"。

---

## 获取 OpenAI API Key

### 1. 访问官网
打开 **platform.openai.com**

### 2. 注册/登录

### 3. 创建 API Key
1. 点击右上角 "API Keys"
2. 点击 "Create new secret key"
3. 给 Key 起个名字
4. 点击创建

### 4. 保存 Key
**⚠️ 重要：创建后只能看到一次！一定要保存下来！**

---

## 获取 Claude API Key

### 1. 访问官网
打开 **console.anthropic.com**

### 2. 注册/登录

### 3. 创建 API Key
1. 点击 "API Keys"
2. 点击 "Create Key"
3. 给 Key 起个名字
4. 复制保存

---

## 获取国内 AI API

### 阿里通义千问
1. 访问 **dashscope.console.aliyun.com**
2. 注册阿里云账号
3. 开通服务，获取 Key

### 百度文心一言
1. 访问 **yiyan.baidu.com**
2. 开发者中心申请 API

---

## 安全注意事项

⚠️ **不要把 Key 公开！**
- 不要发到 GitHub
- 不要发给别人
- 前端代码不要直接暴露

⚠️ **保护好你的 Key**
- 用环境变量存储
- 定期更换 Key

---

## 下一步

学会在代码中使用 API → [如何在 Python 中调用 AI](./13-call-ai-in-python.md)
