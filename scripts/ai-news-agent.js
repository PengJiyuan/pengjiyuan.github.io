#!/usr/bin/env node
/**
 * AI News Agent - 每日 AI 资讯推送
 * 
 * 多源聚合版本：
 * - Hacker News
 * - Reddit (AI, MachineLearning)
 * - TechCrunch AI
 * 
 * 运行方式：
 *   node ai-news-agent.js
 *   node ai-news-agent.js --dry-run
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============

const AI_KEYWORDS = [
  'ai', 'llm', 'gpt', 'claude', 'gemini', 'openai', 'anthropic', 'deepseek',
  'qwen', 'kimi', '通义', 'chatgpt', 'agent', 'rag', 'embedding', 
  '机器学习', '深度学习', '神经网络', 'transformer', 'diffusion',
  'sora', '文生图', '文生视频', 'stable diffusion',
  'copilot', 'cursor', 'windsurf', '编程', '代码生成',
  '自动驾驶', '智能驾驶', '机器人', '具身智能',
  'gpu', 'nvidia', 'h100', '芯片', 'mcp',
];

const NEWS_SOURCES = [
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { name: 'Hacker News AI', url: 'https://hnrss.org/newest?q=ai' },
  { name: 'Reddit r/AI', url: 'https://www.reddit.com/r/ArtificialIntelligence/.rss' },
  { name: 'Reddit r/ML', url: 'https://www.reddit.com/r/MachineLearning/.rss' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
];

// ============ 工具函数 ============

function cleanHNContent(text) {
  if (!text) return '';
  // 清理 HN 特有的冗余信息
  return text
    .replace(/Article URL:.*$/gm, '')
    .replace(/Comments URL:.*$/gm, '')
    .replace(/Points:.*$/gm, '')
    .replace(/# Comments:.*$/gm, '')
    .replace(/<\/?p>/g, '')
    .replace(/<a[^>]*>/g, '')
    .replace(/<\/a>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRSS(xml) {
  const items = [];
  const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    
    // 提取各字段
    const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/);
    const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/);
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    
    let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    const link = linkMatch ? linkMatch[1].trim() : '';
    const description = descMatch ? descMatch[1] : '';
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    
    // HN 特殊处理：Ask HN 标题可能不在 title 里
    if (!title || title.startsWith('Ask HN')) {
      const askMatch = description.match(/Ask HN:[^<]*/);
      if (askMatch) {
        title = 'Ask HN: ' + askMatch[0].replace('Ask HN:', '').trim();
      }
    }
    
    if (title && link) {
      items.push({
        title: cleanHNContent(title),
        url: link,
        publishedAt: parseDate(pubDate),
        summary: cleanHNContent(description).substring(0, 150),
      });
    }
  }
  
  return items;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    // RFC 822: "Thu, 19 Mar 2026 03:29:55 +0000"
    const cleaned = dateStr.replace(/\s+\w+$/, '').trim();
    const date = new Date(cleaned);
    
    if (isNaN(date.getTime())) return null;
    
    // 转为北京时间 (UTC+8)
    return new Date(date.getTime() + 8 * 60 * 60 * 1000);
  } catch {
    return null;
  }
}

function isTodayBeijing(date) {
  if (!date) return false;
  
  // 获取北京时间今天日期
  const now = new Date();
  const beijingNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const todayStr = `${beijingNow.getFullYear()}-${String(beijingNow.getMonth() + 1).padStart(2, '0')}-${String(beijingNow.getDate()).padStart(2, '0')}`;
  
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  return dateStr === todayStr;
}

function isAIRelated(title, summary = '') {
  const text = (title + ' ' + summary).toLowerCase();
  return AI_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

function deduplicate(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.title.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '').substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============ 抓取 ============

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'AI-News-Agent/1.0' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function fetchSource(name, url) {
  try {
    console.log(`📡 ${name}...`);
    const xml = await fetchURL(url);
    return { name, items: parseRSS(xml), success: true };
  } catch (e) {
    console.log(`   ❌ ${e.message}`);
    return { name, items: [], success: false, error: e.message };
  }
}

// ============ 主逻辑 ============

async function fetchAllNews() {
  const results = await Promise.all(NEWS_SOURCES.map(s => fetchSource(s.name, s.url)));
  return results.flatMap(r => r.items.map(i => ({ ...i, source: r.name })));
}

function processNews(items) {
  console.log(`\n🔍 处理 ${items.length} 条...`);
  
  // 1. 日期过滤（只保留今天北京时间）
  const today = items.filter(i => isTodayBeijing(i.publishedAt));
  console.log(`   📅 今天: ${today.length} 条`);
  
  // 2. AI 相关性
  const relevant = today.filter(i => isAIRelated(i.title, i.summary));
  console.log(`   🎯 AI相关: ${relevant.length} 条`);
  
  // 3. 去重
  const unique = deduplicate(relevant);
  console.log(`   🔄 去重: ${unique.length} 条`);
  
  // 4. 排序
  unique.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return b.publishedAt - a.publishedAt;
  });
  
  return unique;
}

function formatNews(items) {
  if (!items.length) {
    return '# 今日 AI 资讯\n\n暂无更新 📭\n';
  }
  
  const lines = ['# 今日 AI 资讯\n'];
  lines.push('> 来源: Hacker News, Reddit, TechCrunch | 筛选: 当天 · AI相关 · 去重\n');
  
  items.slice(0, 12).forEach((item, i) => {
    const time = item.publishedAt 
      ? item.publishedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : '';
    
    lines.push(`## ${i + 1}. ${item.title}`);
    if (time) lines.push(`> ${item.source} · ${time}`);
    if (item.summary) lines.push(`>\n> ${item.summary}`);
    lines.push(`>\n> [阅读更多](${item.url})\n`);
  });
  
  lines.push('---');
  lines.push(`*更新时间: ${new Date().toLocaleString('zh-CN')}*`);
  
  return lines.join('\n');
}

function saveNews(content, dateStr) {
  const filePath = path.join(__dirname, '..', 'content', 'news', `${dateStr}.md`);
  fs.writeFileSync(filePath, content);
  console.log(`\n📝 已保存: ${filePath}`);
}

// ============ CLI ============

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

async function main() {
  console.log('🚀 AI News Agent 启动');
  console.log(`   时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('='.repeat(40));
  
  // 抓取
  const allItems = await fetchAllNews();
  
  // 处理
  const items = processNews(allItems);
  
  // 格式化
  const content = formatNews(items);
  
  if (dryRun) {
    console.log('\n📝 预览:');
    console.log('-'.repeat(40));
    console.log(content);
    console.log('-'.repeat(40));
    return;
  }
  
  // 保存
  const todayStr = new Date().toISOString().slice(0, 10);
  saveNews(content, todayStr);
  
  console.log('\n✅ 完成!');
}

main().catch(console.error);
