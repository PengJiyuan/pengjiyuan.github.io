---
title: "什么是 API？"
date: 2026-02-11
weight: 11
tags:
  - "API"
  - "开发"
  - "入门"
description: "API 是连接 AI 服务与你的应用之间的桥梁。本文用最简单的语言解释 API 的工作原理。"
showToc: true
TocOpen: true
---

## 通俗解释

**API = 应用程序接口**

想象一下：
- 你是餐厅顾客（你的程序）
- 厨师是 AI 服务商
- 服务员就是 API

你不需要知道厨房怎么做菜，只需要告诉服务员你要什么，服务员会把菜端给你。

---

## 为什么要用 API？

### 不用 API
- 只能网页上手动操作
- 每次都要复制粘贴
- 效率低

### 用 API
- 程序自动调用
- 可以批量处理
- 效率高

---

## 生活中的 API 例子

### 🌤️ 天气 API
```
你的程序 → 调用天气 API → 获取天气预报
```

### 🗺️ 地图 API
```
你的程序 → 调用地图 API → 显示地图、导航
```

### 🤖 AI API
```
你的程序 → 调用 AI API → 获取 AI 回答
```

---

## AI API 能做什么？

有了 AI API，你可以：

1. **批量生成内容**
   - 自动写 100 篇文章
   - 批量生成产品描述

2. **做自己的 AI 产品**
   - 做聊天机器人
   - 做 AI 助手

3. **自动化工作**
   - 自动回复邮件
   - 自动处理数据

---

## 怎么使用 AI API？

### 第一步：获取 API Key

1. 访问 AI 服务商官网
2. 注册账号
3. 获取 API Key（类似密码）

### 第二步：调用 API

```python
import requests

# 简单的 API 调用示例
response = requests.post(
    "https://api.openai.com/v1/chat/completions",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "model": "gpt-4",
        "messages": [{"role": "user", "content": "你好"}]
    }
)

print(response.json())
```

---

## 常见 AI API

| 服务商 | API 名称 | 特点 |
|--------|----------|------|
| OpenAI | GPT API | 最强大 |
| Anthropic | Claude API | 更安全 |
| 阿里 | 通义千问 | 中文好 |
| 百度 | 文心一言 | 中文好 |

---

## 费用说明

- 大多数 AI API 是**按量收费**
- 按 token（字数）计费
- 新用户通常有免费额度

---

## 下一步

学会获取自己的 API Key → [如何获取 API Key](./12-get-api-key.md)
