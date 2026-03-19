"""TechCrunch Fetcher"""

import feedparser
from types import NewsItem, FetchResult
from filters import parse_date

TECHCRUNCH_AI_URL = "https://techcrunch.com/category/artificial-intelligence/feed/"

def fetch_techcrunch_ai(limit: int = 15) -> FetchResult:
    """抓取 TechCrunch AI 新闻"""
    try:
        feed = feedparser.parse(TECHCRUNCH_AI_URL)
        
        items = []
        for entry in feed.entries[:limit]:
            published = None
            if hasattr(entry, 'published'):
                published = parse_date(entry.published)
            
            # 清理摘要中的 HTML 标签
            summary = entry.get('summary', '')
            if summary:
                import re
                summary = re.sub(r'<[^>]+>', '', summary)[:200]
            
            item = NewsItem(
                title=entry.get('title', ''),
                url=entry.get('link', ''),
                source="TechCrunch",
                published_at=published,
                summary=summary
            )
            items.append(item)
        
        return FetchResult(
            source="TechCrunch AI",
            items=items,
            success=True
        )
    except Exception as e:
        return FetchResult(
            source="TechCrunch AI",
            items=[],
            success=False,
            error=str(e)
        )
