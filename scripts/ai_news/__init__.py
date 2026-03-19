"""AI News Aggregator - 多源 AI 资讯聚合"""

from .types import NewsItem, FetchResult
from .config import AI_KEYWORDS, NEWS_SOURCES, DATE_FILTER_HOURS
from .filters import filter_by_date, filter_relevant, deduplicate
from .fetchers import fetch_hackernews, fetch_hackernews_ai, fetch_all_reddit, fetch_techcrunch_ai

__all__ = [
    "NewsItem",
    "FetchResult",
    "AI_KEYWORDS",
    "NEWS_SOURCES",
    "DATE_FILTER_HOURS",
    "filter_by_date",
    "filter_relevant", 
    "deduplicate",
    "fetch_hackernews",
    "fetch_hackernews_ai",
    "fetch_all_reddit",
    "fetch_techcrunch_ai",
]
