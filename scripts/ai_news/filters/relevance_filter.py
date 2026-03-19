"""AI 相关性过滤器"""

import re
from config import AI_KEYWORDS

def is_ai_related(title: str, summary: str = "") -> bool:
    """检查新闻是否与 AI 相关"""
    text = (title + " " + (summary or "")).lower()
    
    for keyword in AI_KEYWORDS:
        if keyword.lower() in text:
            return True
    
    return False

def filter_relevant(items: list) -> list:
    """过滤出 AI 相关新闻"""
    return [item for item in items if is_ai_related(item.title, item.summary)]

def deduplicate(items: list, similarity_threshold: float = 0.8) -> list:
    """去重（基于标题相似度）"""
    if not items:
        return []
    
    # 简单实现：标准化标题后比较
    def normalize(title: str) -> str:
        # 转小写，移除特殊字符，空格标准化
        return re.sub(r'[^\w\s]', '', title.lower())
    
    seen = set()
    unique_items = []
    
    for item in items:
        norm_title = normalize(item.title)
        is_dup = False
        
        for seen_title in seen:
            # 简单相似度：检查是否有大量重叠词汇
            words1 = set(norm_title.split())
            words2 = set(seen_title.split())
            if words1 and words2:
                overlap = len(words1 & words2) / min(len(words1), len(words2))
                if overlap >= similarity_threshold:
                    is_dup = True
                    break
        
        if not is_dup:
            seen.add(norm_title)
            unique_items.append(item)
    
    return unique_items
