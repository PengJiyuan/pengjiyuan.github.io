"""AI News 配置"""

# AI 相关关键词（用于过滤）
AI_KEYWORDS = [
    "ai", "的人工智能", "大模型", "llm", "gpt", "claude", "gemini",
    "openai", "anthropic", "deepseek", "qwen", "kimi", "通义",
    "chatgpt", "chatbot", "agent", "rag", "embedding", "向量数据库",
    "机器学习", "深度学习", "神经网络", "transformer", "diffusion",
    "sora", "video", "文生图", "文生视频", "图像生成", "stable diffusion",
    "copilot", "cursor", "windsurf", "编程", "代码生成",
    "自动驾驶", "智能驾驶", "机器人", "具身智能",
    "gpu", "nvidia", "h100", "h200", "芯片",
    "mcp", "model context protocol", "agentic",
    "prompt", "提示词", "微调", "fine-tune", "训练",
]

# 新闻源配置
NEWS_SOURCES = {
    "hackernews": {
        "name": "Hacker News",
        "url": "https://hnrss.org/frontpage",
        "enabled": True,
    },
    "reddit_ai": {
        "name": "Reddit AI",
        "url": "https://www.reddit.com/r/ArtificialIntelligence/.rss",
        "enabled": True,
    },
    "reddit_machineLearning": {
        "name": "Reddit MachineLearning",
        "url": "https://www.reddit.com/r/MachineLearning/.rss",
        "enabled": True,
    },
    "techcrunch_ai": {
        "name": "TechCrunch AI",
        "url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "enabled": True,
    },
    "量子位": {
        "name": "量子位",
        "url": "https://www.zhihu.com/rss/questions?tab=hot&day=2024-01-01",  # 备用
        "enabled": False,  # 需要特殊处理
    },
}

# 日期过滤配置
DATE_FILTER_HOURS = 24  # 只保留过去 24 小时内的新闻
