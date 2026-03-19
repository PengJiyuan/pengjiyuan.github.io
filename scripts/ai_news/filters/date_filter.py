"""日期过滤器 - 只保留当天发布的新闻"""

from datetime import datetime, timedelta, timezone
from typing import Optional
import re

# 中国时区
CST = timezone(timedelta(hours=8))

def parse_date(date_str: str) -> Optional[datetime]:
    """解析各种日期格式"""
    if not date_str:
        return None
    
    # 尝试解析 RFC 822 格式 (RSS 常用)
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%d %b %Y %H:%M:%S %z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ]
    
    for fmt in formats:
        try:
            # 移除星期几前缀如果存在
            if fmt.startswith("%a"):
                date_str = re.sub(r'^[A-Za-z]{3},\s*', '', date_str)
            dt = datetime.strptime(date_str.strip(), fmt.replace("%a, ", ""))
            # 转换为 CST
            if dt.tzinfo:
                dt = dt.astimezone(CST)
            return dt
        except:
            continue
    
    return None

def is_recent(published_at: Optional[datetime], hours: int = 24) -> bool:
    """检查新闻是否在指定时间范围内"""
    if published_at is None:
        return True  # 无法确定时保留
    
    now = datetime.now(CST)
    cutoff = now - timedelta(hours=hours)
    
    return published_at >= cutoff

def filter_by_date(items: list, hours: int = 24) -> list:
    """按日期过滤新闻"""
    filtered = []
    for item in items:
        if is_recent(item.published_at, hours):
            filtered.append(item)
    return filtered
