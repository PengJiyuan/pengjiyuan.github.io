#!/usr/bin/env node
/**
 * Sclaw AI News Agent V2 - 每日 AI 资讯推送
 * 
 * 多源聚合版本：
 * - Hacker News
 * - Reddit (AI, MachineLearning, LocalLLaMA)
 * - TechCrunch AI
 * 
 * 运行方式：
 *   node ai-news-agent-v2.js
 *   node ai-news-agent-v2.js --dry-run
 */

const https = require('https');

// ============ 配置 ============

const AI_KEYWORDS = [
  'ai', '的人工智能', '大模型', 'llm', 'gpt', 'claude', 'gemini',
  'openai', 'anthropic', 'deepseek', 'qwen', 'kimi', '通义',
  'chatgpt', 'chatbot', 'agent', 'rag', 'embedding', '向量数据库',
  '机器学习', '深度学习', '神经网络', 'transformer', 'diffusion',
  'sora', 'video', '文生图', '文生视频', '图像生成', 'stable diffusion',
  'copilot', 'cursor', 'windsurf', '编程', '代码生成',
  '自动驾驶', '智能驾驶', '机器人', '具身智能',
  'gpu', 'nvidia', 'h100', 'h200', '芯片',
  'mcp', 'model context protocol', 'agentic',
  'prompt', '提示词', '微调', 'fine-tune', '训练',
];

const NEWS_SOURCES = [
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', enabled: true },
  { name: 'Hacker News AI', url: 'https://hnrss.org/newest?q=ai', enabled: true },
  { name: 'Reddit r/AI', url: 'https://www.reddit.com/r/ArtificialIntelligence/.rss', enabled: true },
  { name: 'Reddit r/ML', url: 'https://www.reddit.com/r/MachineLearning/.rss', enabled: true },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', enabled: true },
];

const DATE_FILTER_HOURS = 24;

// ============ 工具函数 ============

/**
 * 简单的 RSS 解析器
 */
function parseRSS(xml, sourceName = '') {
  const items = [];
  
  // 检查是否是 HN RSS（需要特殊处理）
  const isHN = xml.includes('hnrss.org');
  
  const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    
    // 尝试获取标题
    let title = extractTag(itemXml, 'title') || extractTag(itemXml, 'dc:title');
    
    // 如果是 HN 且没有标题，尝试从 description 提取
    if (!title || title.startsWith('Ask HN')) {
      const desc = extractTag(itemXml, 'description') || '';
      // 提取 "Ask HN: xxx" 格式
      const askMatch = desc.match(/Ask HN:[^<]*/);
      if (askMatch) {
        title = askMatch[0].substring(0, 100);
      }
    }
    
    const link = extractTag(itemXml, 'link');
    const description = extractTag(itemXml, 'description') || '';
    const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date');
    
    if (title && link) {
      // 清理标题中的 CDATA 标记
      title = title.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      
      items.push({
        title: cleanHTML(title),
        url: link,
        source: '',
        publishedAt: parseDate(pubDate),
        summary: cleanHTML(description).substring(0, 200),
      });
    }
  }
  
  return items;
}

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : null;
}

function cleanHTML(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    // 解析 RFC 822 格式 (如: "Thu, 19 Mar 2026 03:29:55 +0000")
    let date;
    
    // 移除时区缩写，手动处理
    const cleanedDateStr = dateStr.replace(/\s+[A-Z]{2,4}$/, '').trim();
    date = new Date(cleanedDateStr);
    
    if (isNaN(date.getTime())) return null;
    
    // 转换为北京时间 (UTC+8)，不使用本地时区
    const cstOffset = 8 * 60 * 60 * 1000;
    const cstDate = new Date(date.getTime() + cstOffset);
    
    return cstDate;
  } catch {
    return null;
  }
}

function isToday(date) {
  if (!date) return true;
  
  const now = new Date();
  const beijingNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  
  const todayStr = beijingNow.toISOString().slice(0, 10); // "2026-03-19"
  const dateStr = date.toISOString().slice(0, 10);
  
  return dateStr === todayStr;
}

function isRecent(date, hours = 24) {
  // 更严格的过滤：只保留今天发布的新闻
  return isToday(date);
}

function isAIRelated(title, summary = '') {
  const text = (title + ' ' + summary).toLowerCase();
  return AI_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

function normalizeTitle(title) {
  return title.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '');
}

function isDuplicate(title, seen) {
  const norm = normalizeTitle(title);
  for (const seenTitle of seen) {
    const overlap = intersection(
      new Set(norm.split(/\s+/)), 
      new Set(seenTitle.split(/\s+/))
    ).size;
    const minLen = Math.min(norm.split(/\s+/).length, seenTitle.split(/\s+/).length);
    if (minLen > 0 && overlap / minLen >= 0.7) {
      return true;
    }
  }
  return false;
}

function intersection(setA, setB) {
  return new Set([...setA].filter(x => setB.has(x)));
}

// ============ 抓取 ============

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Sclaw-AI-News/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function fetchSource(source) {
  try {
    console.log(`📡 抓取 ${source.name}...`);
    const xml = await fetchURL(source.url);
    const items = parseRSS(xml);
    
    // 设置来源
    items.forEach(item => item.source = source.name);
    
    console.log(`   ✅ 获取 ${items.length} 条`);
    return { source: source.name, items, success: true };
  } catch (err) {
    console.log(`   ❌ 失败: ${err.message}`);
    return { source: source.name, items: [], success: false, error: err.message };
  }
}

// ============ 主逻辑 ============

async function fetchAllNews() {
  const results = await Promise.all(
    NEWS_SOURCES.filter(s => s.enabled).map(fetchSource)
  );
  
  const allItems = results.flatMap(r => r.items);
  return allItems;
}

function processNews(items) {
  console.log(`\n🔍 处理 ${items.length} 条原始新闻...`);
  
  // 1. 日期过滤
  const afterDate = items.filter(item => isRecent(item.publishedAt, DATE_FILTER_HOURS));
  console.log(`   📅 日期过滤后: ${afterDate.length} 条`);
  
  // 2. AI 相关性过滤
  const relevant = afterDate.filter(item => isAIRelated(item.title, item.summary));
  console.log(`   🎯 相关性过滤后: ${relevant.length} 条`);
  
  // 3. 去重
  const seen = new Set();
  const unique = relevant.filter(item => {
    const norm = normalizeTitle(item.title);
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });
  console.log(`   🔄 去重后: ${unique.length} 条`);
  
  // 4. 按时间排序
  unique.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return b.publishedAt - a.publishedAt;
  });
  
  return unique;
}

function formatNews(items) {
  if (!items.length) {
    return '## 今日 AI 资讯\n\n暂无最新资讯 😢';
  }
  
  const lines = ['## 今日 AI 资讯\n'];
  lines.push(`*来源: Hacker News, Reddit, TechCrunch | 筛选: 24小时内 · AI相关 · 去重*\n`);
  
  items.slice(0, 15).forEach((item, i) => {
    const dateStr = item.publishedAt 
      ? ` (${item.publishedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })})` 
      : '';
    
    lines.push(`### ${i + 1}. ${item.title}`);
    lines.push(`**来源**: ${item.source}${dateStr}`);
    if (item.summary) {
      lines.push(`\n${item.summary}`);
    }
    lines.push(`\n[阅读更多](${item.url})\n`);
    lines.push('---');
  });
  
  lines.push(`\n*更新时间: ${new Date().toLocaleString('zh-CN')}*`);
  return lines.join('\n');
}

// ============ Sclaw 发布 ============

async function postToSclaw(content, token) {
  try {
    const { Agent } = await import('sclaw');
    const agent = new Agent({ token });
    
    const result = await agent.post({
      title: `每日 AI 资讯 ${new Date().toLocaleDateString('zh-CN')}`,
      content,
      tags: ['AI', 'News', '每日简报'],
    });
    
    console.log(`✅ 发布成功! Post ID: ${result.id}`);
    return true;
  } catch (err) {
    console.log(`❌ 发布失败: ${err.message}`);
    return false;
  }
}

// ============ CLI ============

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');
const forceOld = args.includes('--force-old') || args.includes('-f');

async function main() {
  console.log('🚀 Sclaw AI News Agent V2 启动');
  console.log(`   时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('='.repeat(50));
  
  // 抓取
  const allItems = await fetchAllNews();
  
  // 处理
  const items = processNews(allItems);
  
  // 格式化
  const content = formatNews(items);
  
  if (dryRun) {
    console.log('\n📝 预览 (dry-run 模式):');
    console.log('-'.repeat(50));
    console.log(content.slice(0, 2000));
    if (content.length > 2000) console.log('... (truncated)');
    console.log('-'.repeat(50));
    return;
  }
  
  // 发布
  const token = process.env.SCLAW_TOKEN;
  if (!token) {
    console.log('\n❌ 请设置 SCLAW_TOKEN 环境变量');
    return;
  }
  
  console.log('\n📤 发布到 Sclaw...');
  await postToSclaw(content, token);
  
  console.log('\n👋 完成!');
}

main().catch(console.error);
