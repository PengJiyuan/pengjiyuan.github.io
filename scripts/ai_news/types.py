"""AI News 数据类型定义"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class NewsItem:
    """单条新闻"""
    title: str
    url: str
    source: str
    published_at: Optional[datetime] = None
    summary: Optional[str] = None
    
    def to_dict(self):
        return {
            "title": self.title,
            "url": self.url,
            "source": self.source,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "summary": self.summary
        }

@dataclass
class FetchResult:
    """抓取结果"""
    source: str
    items: list[NewsItem]
    success: bool
    error: Optional[str] = None
