"""Reddit Fetcher"""

import feedparser
from types import NewsItem, FetchResult
from filters import parse_date

REDDIT_FEEDS = {
    "reddit_ai": "https://www.reddit.com/r/ArtificialIntelligence/.rss",
    "reddit_machineLearning": "https://www.reddit.com/r/MachineLearning/.rss",
    "reddit_LocalLLaMA": "https://www.reddit.com/r/LocalLLaMA/.rss",
}

def fetch_reddit(subreddit: str, limit: int = 20) -> FetchResult:
    """抓取指定 Subreddit 的 RSS"""
    url = REDDIT_FEEDS.get(subreddit)
    if not url:
        return FetchResult(
            source=subreddit,
            items=[],
            success=False,
            error=f"Unknown subreddit: {subreddit}"
        )
    
    try:
        feed = feedparser.parse(url)
        
        items = []
        source_name = f"Reddit r/{subreddit.replace('reddit_', '')}"
        
        for entry in feed.entries[:limit]:
            published = None
            if hasattr(entry, 'published'):
                published = parse_date(entry.published)
            
            # 清理标题（移除 [OC] 等标签）
            title = entry.get('title', '')
            
            item = NewsItem(
                title=title,
                url=entry.get('link', ''),
                source=source_name,
                published_at=published,
                summary=entry.get('summary', '')[:200] if hasattr(entry, 'summary') else ''
            )
            items.append(item)
        
        return FetchResult(
            source=source_name,
            items=items,
            success=True
        )
    except Exception as e:
        return FetchResult(
            source=source_name,
            items=[],
            success=False,
            error=str(e)
        )

def fetch_all_reddit(limit_per_sub: int = 15) -> list[FetchResult]:
    """抓取所有配置的 Reddit 源"""
    results = []
    for subreddit in REDDIT_FEEDS.keys():
        result = fetch_reddit(subreddit, limit_per_sub)
        results.append(result)
    return results
