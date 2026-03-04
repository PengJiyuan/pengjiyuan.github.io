---
title: "Python 调用 AI API 实战"
date: 2026-02-13
weight: 13
tags:
  - "Python"
  - "API"
  - "编程实战"
description: "从零开始，用 Python 调用 OpenAI API，实现对话、续写、摘要等功能，附完整可运行代码。"
showToc: true
TocOpen: true
---

## 环境准备

### 1. 安装 Python
```bash
# 检查是否已安装
python3 --version
```

### 2. 安装 SDK
```bash
pip install openai
```

### 3. 设置 API Key
```bash
# 方式1：环境变量
export OPENAI_API_KEY="你的Key"

# 方式2：在代码中（不推荐）
import os
os.environ["OPENAI_API_KEY"] = "你的Key"
```

---

## 简单例子：调用 GPT

### 基本代码
```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "你好，介绍一下自己"}
    ]
)

print(response.choices[0].message.content)
```

### 带上下文的对话
```python
from openai import OpenAI

client = OpenAI()

messages = [
    {"role": "system", "content": "你是一个热情的助手"}
]

while True:
    user_input = input("你: ")
    messages.append({"role": "user", "content": user_input})
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=messages
    )
    
    print("AI:", response.choices[0].message.content)
    messages.append({"role": "assistant", "content": response.choices[0].message.content})
```

---

## 调用 Claude

```python
import anthropic

client = anthropic.Anthropic(
    api_key="你的Claude Key"
)

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1000,
    messages=[
        {"role": "user", "content": "你好"}
    ]
)

print(message.content[0].text)
```

---

## 实用函数封装

```python
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def ask_ai(question, model="gpt-4o"):
    """简单的 AI 对话函数"""
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": question}
        ]
    )
    return response.choices[0].message.content

# 使用
answer = ask_ai("什么是 Python？")
print(answer)
```

---

## 注意事项

⚠️ **费用**
- 按 token 计费
- 用多少付多少
- 注意设置预算

⚠️ **错误处理**
```python
try:
    response = client.chat.completions.create(...)
except Exception as e:
    print(f"错误: {e}")
```

---

## 下一步

动手做一个自己的 AI 助手 → [做一个自己的 AI 助手](./14-build-ai-assistant.md)
