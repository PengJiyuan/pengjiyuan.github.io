"""Hacker News Fetcher"""

import feedparser
from datetime import datetime
from types import NewsItem, FetchResult
from filters import parse_date

HN_RSS_URL = "https://hnrss.org/frontpage"

def fetch_hackernews(limit: int = 30) -> FetchResult:
    """抓取 Hacker News 首页新闻"""
    try:
        feed = feedparser.parse(HN_RSS_URL)
        
        items = []
        for entry in feed.entries[:limit]:
            # 尝试从内容中提取发布日期
            published = None
            if hasattr(entry, 'published'):
                published = parse_date(entry.published)
            elif hasattr(entry, 'updated'):
                published = parse_date(entry.updated)
            
            item = NewsItem(
                title=entry.get('title', ''),
                url=entry.get('link', ''),
                source="Hacker News",
                published_at=published,
                summary=entry.get('summary', '')[:200] if hasattr(entry, 'summary') else ''
            )
            items.append(item)
        
        return FetchResult(
            source="Hacker News",
            items=items,
            success=True
        )
    except Exception as e:
        return FetchResult(
            source="Hacker News",
            items=[],
            success=False,
            error=str(e)
        )

def fetch_hackernews_ai(limit: int = 30) -> FetchResult:
    """抓取 Hacker News AI 相关新闻"""
    try:
        # 使用关键词过滤的 RSS
        feed = feedparser.parse(f"https://hnrss.org/newest?q=ai&count={limit}")
        
        items = []
        for entry in feed.entries[:limit]:
            published = None
            if hasattr(entry, 'published'):
                published = parse_date(entry.published)
            
            item = NewsItem(
                title=entry.get('title', ''),
                url=entry.get('link', ''),
                source="Hacker News (AI)",
                published_at=published,
                summary=entry.get('summary', '')[:200] if hasattr(entry, 'summary') else ''
            )
            items.append(item)
        
        return FetchResult(
            source="Hacker News (AI)",
            items=items,
            success=True
        )
    except Exception as e:
        return FetchResult(
            source="Hacker News (AI)",
            items=[],
            success=False,
            error=str(e)
        )
