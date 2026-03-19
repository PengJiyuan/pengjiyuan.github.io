#!/usr/bin/env node
/**
 * AI News Agent - 每日 AI 资讯推送
 * 
 * 数据源：
 * - Hacker News (首页 + AI关键词)
 * - Reddit (AI, MachineLearning)
 * - TechCrunch AI
 * - AIbase 今日热榜
 * - TopHub 今日热榜
 * - 微博 AI 话题
 * - 知乎 AI 话题
 * - 微信公众号 (RSS抓取)
 * 
 * 运行方式：
 *   node ai-news-agent.js
 *   node ai-news-agent.js --dry-run
 */

const https = require('https');
const http = require('http');
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
  '大模型', '人工智能', 'AI模型', '生成式AI',
];

// RSS 源配置
const RSS_SOURCES = [
  // 英文技术源
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', lang: 'en' },
  { name: 'Hacker News AI', url: 'https://hnrss.org/newest?q=ai', lang: 'en' },
  { name: 'Reddit r/AI', url: 'https://www.reddit.com/r/ArtificialIntelligence/.rss', lang: 'en' },
  { name: 'Reddit r/ML', url: 'https://www.reddit.com/r/MachineLearning/.rss', lang: 'en' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', lang: 'en' },
  
  // 中文媒体
  { name: '36氪', url: 'https://36kr.com/feed', lang: 'zh' },
  { name: '少数派', url: 'https://sspai.com/feed', lang: 'zh' },
  { name: '钛媒体', url: 'https://www.tmtpost.com/rss', lang: 'zh' },
  
  // Product Hunt
  { name: 'Product Hunt', url: 'https://www.producthunt.com/feed', lang: 'en' },
];

// 微博热搜 API (模拟)
const WEIBO_API = 'https://weibo.com/ajax/statuses/hot_band';

const ZHIHU_TOPIC = 'https://www.zhihu.com/topic/19550517/hot';

const DEFAULT_WINDOW_HOURS = 24;

// ============ 工具函数 ============

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/Article URL:.*$/gm, '')
    .replace(/Comments URL:.*$/gm, '')
    .replace(/Points:.*$/gm, '')
    .replace(/# Comments:.*$/gm, '')
    .replace(/<\/?p>/g, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<a[^>]*href=["'][^"']*["'][^>]*>([^<]*)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const cleaned = dateStr.replace(/\s+\w+$/, '').trim();
    const date = new Date(cleaned);
    if (isNaN(date.getTime())) return null;
    return new Date(date.getTime() + 8 * 60 * 60 * 1000);
  } catch {
    return null;
  }
}

function isTodayBeijing(date) {
  if (!date) return false;
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const today = `${beijing.getFullYear()}-${String(beijing.getMonth() + 1).padStart(2, '0')}-${String(beijing.getDate()).padStart(2, '0')}`;
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return dateStr === today;
}

function isWithinHours(date, hours) {
  if (!date) return true;
  const now = new Date();
  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
  return date >= cutoff;
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

// ============ 抓取函数 ============

function fetchURL(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, {
      headers: { 
        'User-Agent': 'AI-News-Agent/1.0',
        'Accept': 'application/rss+xml, application/xml, text/html, */*',
      }
    }, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetchURL(res.headers.location, timeout));
        return;
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ============ RSS 解析 ============

function parseRSS(xml, sourceName) {
  if (!xml || xml.length < 100) return [];
  
  const items = [];
  const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    
    // 提取各字段
    let title = '';
    let link = '';
    let description = '';
    let pubDate = '';
    
    const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const pubMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const dcDateMatch = itemXml.match(/<dc:date>([\s\S]*?)<\/dc:date>/i);
    
    title = titleMatch ? titleMatch[1] : '';
    link = linkMatch ? linkMatch[1] : '';
    description = descMatch ? descMatch[1] : '';
    pubDate = pubMatch ? pubMatch[1] : (dcDateMatch ? dcDateMatch[1] : '');
    
    // 清理标题
    title = cleanText(title);
    
    // 跳过空标题
    if (!title || title.length < 3) continue;
    
    // HN/Ask HN 特殊处理
    if (sourceName?.includes('Hacker News') && !title) {
      const askMatch = description.match(/Ask HN:[^<]*/);
      if (askMatch) title = 'Ask HN: ' + askMatch[0].replace('Ask HN:', '').trim();
    }
    
    if (title && link) {
      items.push({
        title,
        url: link.trim(),
        publishedAt: parseDate(pubDate),
        summary: cleanText(description).substring(0, 200),
        source: sourceName || 'Unknown',
      });
    }
  }
  
  return items;
}

// ============ 平台抓取 ============

async function fetchRSSSource(source) {
  try {
    process.stdout.write(`📡 ${source.name}... `);
    const xml = await fetchURL(source.url);
    const items = parseRSS(xml, source.name);
    console.log(`✅ ${items.length}条`);
    return { source: source.name, items, success: true };
  } catch (e) {
    console.log(`❌ ${e.message}`);
    return { source: source.name, items: [], success: false, error: e.message };
  }
}

async function fetchAllInOne() {
  // 使用 RSSHub 聚合多个中文源
  try {
    process.stdout.write('📡 AI聚合热榜... ');
    // AIbase, 机器之心, 量子位 等聚合
    const url = 'https://rsshub.app/aibase';
    const xml = await fetchURL(url);
    const items = parseRSS(xml, 'AIbase');
    console.log(`✅ ${items.length}条`);
    return { source: 'AIbase', items, success: true };
  } catch (e) {
    console.log(`❌ ${e.message}`);
    return { source: 'AIbase', items: [], success: false, error: e.message };
  }
}

// ============ 主逻辑 ============

async function fetchAllNews() {
  console.log('\n📡 开始抓取...\n');
  
  // 1. RSS 源
  const rssResults = await Promise.all(RSS_SOURCES.map(fetchRSSSource));
  
  // 2. 其他平台 (可选，暂时移除不稳定的源)
  const otherPromises = [];
  
  const otherResults = await Promise.all(otherPromises);
  
  // 合并结果
  const allResults = [...rssResults, ...otherResults];
  const allItems = allResults.flatMap(r => r.items);
  
  console.log(`\n📊 共抓取 ${allItems.length} 条 (${allResults.filter(r=>r.success).length}/${allResults.length} 个源成功)`);
  
  return allItems;
}

function processNews(items) {
  console.log(`\n🔍 开始过滤...\n`);
  
  // 1. 日期过滤（北京时间今天）
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
  lines.push('> 来源: Hacker News, Reddit, TechCrunch, 36氪, 少数派, 钛媒体 | 筛选: 当天 · AI相关 · 去重\n');
  
  items.slice(0, 15).forEach((item, i) => {
    const time = item.publishedAt 
      ? item.publishedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      : '';
    
    lines.push(`## ${i + 1}. ${item.title}`);
    lines.push(`> ${item.source}${time ? ' · ' + time : ''}`);
    if (item.summary) {
      const summary = item.summary.substring(0, 100) + (item.summary.length > 100 ? '...' : '');
      lines.push(`> ${summary}`);
    }
    lines.push(`>\n> [阅读更多](${item.url})\n`);
  });
  
  lines.push('---');
  const beijing = new Date(Date.now() + 8 * 60 * 60 * 1000);
  lines.push(`*更新时间: ${beijing.toLocaleString('zh-CN')}*`);
  
  return lines.join('\n');
}

function saveNews(content) {
  // 使用北京时间
  const beijing = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const todayStr = `${beijing.getFullYear()}-${String(beijing.getMonth() + 1).padStart(2, '0')}-${String(beijing.getDate()).padStart(2, '0')}`;
  const filePath = path.join(__dirname, '..', 'content', 'news', `${todayStr}.md`);
  fs.writeFileSync(filePath, content);
  console.log(`\n📝 已保存: ${filePath}`);
}

// ============ CLI ============

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

async function main() {
  console.log('🚀 AI News Agent 启动');
  console.log(`   时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('='.repeat(50));
  
  const allItems = await fetchAllNews();
  const items = processNews(allItems);
  const content = formatNews(items);
  
  if (dryRun) {
    console.log('\n' + '='.repeat(50));
    console.log(content);
    console.log('='.repeat(50));
    return;
  }
  
  saveNews(content);
  console.log('\n✅ 完成!');
}

main().catch(console.error);
