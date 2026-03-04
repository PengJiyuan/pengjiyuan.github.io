---
title: "从零构建一个 AI 助手"
date: 2026-02-14 10:00:00
categories: [AI教程, AI开发]
tags: [AI应用, 开发, 实战项目]
excerpt: "综合前面所有知识，完整实现一个具备记忆、人格、工具调用能力的个人 AI 助手项目。"
---

## 项目目标

做一个命令行 AI 助手，可以：
- 随时对话
- 保存对话历史
- 支持多个 AI 模型

---

## 完整代码

```python
import os
from openai import OpenAI

# 初始化
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 对话历史
history = [
    {"role": "system", "content": "你是一个友好的 AI 助手，用中文回答问题。"}
]

def chat(message):
    """发送消息并获取回复"""
    history.append({"role": "user", "content": message})
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=history
    )
    
    reply = response.choices[0].message.content
    history.append({"role": "assistant", "content": reply})
    
    return reply

def main():
    print("=" * 50)
    print("🤖 AI 助手已启动！")
    print("输入 'quit' 或 '退出' 结束对话")
    print("输入 'clear' 清除对话历史")
    print("=" * 50)
    
    while True:
        user_input = input("\n你: ")
        
        if user_input.lower() in ["quit", "退出"]:
            print("再见！👋")
            break
        
        if user_input.lower() in ["clear", "清除"]:
            history.clear()
            history.append({"role": "system", "content": "你是一个友好的 AI 助手，用中文回答问题。"})
            print("对话历史已清除")
            continue
        
        try:
            reply = chat(user_input)
            print(f"\nAI: {reply}")
        except Exception as e:
            print(f"错误: {e}")

if __name__ == "__main__":
    main()
```

---

## 使用方法

### 1. 运行代码
```bash
python ai_assistant.py
```

### 2. 设置 API Key
```bash
export OPENAI_API_KEY="你的Key"
```

---

## 进阶功能

### 添加语音输入
```python
import speech_recognition as sr

def voice_input():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("请说话...")
        audio = r.listen(source)
    return r.recognize_google(audio, language='zh-CN')
```

### 添加语音输出
```python
import pyttsx3

def speak(text):
    engine = pyttsx3.init()
    engine.say(text)
    engine.runAndWait()
```

---

## 扩展思路

1. **接入多个模型** - GPT、Claude、国产模型
2. **添加插件** - 联网查资料、发送邮件
3. **网页界面** - 用 Flask 或 Streamlit 做个网页
4. **微信机器人** - 接入微信，随时对话

---

## 后续学习

恭喜你完成了 AI 开发入门！🎉

继续探索：
- 学习 LangChain
- 了解向量数据库
- 搭建 RAG 系统

---

> 🚀 动手实践是最好的学习方式！
