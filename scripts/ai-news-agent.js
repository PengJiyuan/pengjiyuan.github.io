#!/usr/bin/env node
/**
 * AI News Agent - 每日 AI 资讯推送
 * 
 * 数据源：
 * - Hacker News (首页 + AI关键词)
 * - Reddit (AI, MachineLearning)
 * - TechCrunch AI
 * - 36氪
 * - 少数派
 * - 钛媒体
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
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', lang: 'en' },
  { name: 'Hacker News AI', url: 'https://hnrss.org/newest?q=ai', lang: 'en' },
  { name: 'Reddit r/AI', url: 'https://www.reddit.com/r/ArtificialIntelligence/.rss', lang: 'en' },
  { name: 'Reddit r/ML', url: 'https://www.reddit.com/r/MachineLearning/.rss', lang: 'en' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', lang: 'en' },
  { name: '36氪', url: 'https://36kr.com/feed', lang: 'zh' },
  { name: '少数派', url: 'https://sspai.com/feed', lang: 'zh' },
  { name: '钛媒体', url: 'https://www.tmtpost.com/rss', lang: 'zh' },
];

// 分类关键词
const CATEGORIES = {
  '技术突破': ['模型', '训练', '算法', '架构', '论文', '研究', '突破', '开源', 'GPT', 'Claude', 'Gemini', 'LLM', 'benchmark', 'benchmark', '技术报告'],
  '产业动态': ['公司', '产品', '合作', '推出', '上线', '战略', '布局', 'CEO', '发布', '融资', '收购', 'YC', 'Launch', 'Show HN'],
  '资本动态': ['融资', '投资', '上市', '估值', '亿美元', '亿元', '资金', '收购', '并购'],
  '应用落地': ['应用', '落地', '场景', '案例', '服务', '平台', '用户', '产品', '设备', '系统'],
  '政策动态': ['政策', '监管', '法规', '政府', '规划', '报告', '部门', '专项行动', '倡议'],
};

function classifyItem(title, summary) {
  const text = (title + ' ' + summary).toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  return '产业动态';
}

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

function parseRSS(xml, sourceName) {
  if (!xml || xml.length < 100) return [];
  
  const items = [];
  const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    
    let title = '', link = '', description = '', pubDate = '';
    
    const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const pubMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const dcDateMatch = itemXml.match(/<dc:date>([\s\S]*?)<\/dc:date>/i);
    
    title = titleMatch ? titleMatch[1] : '';
    link = linkMatch ? linkMatch[1] : '';
    description = descMatch ? descMatch[1] : '';
    pubDate = pubMatch ? pubMatch[1] : (dcDateMatch ? dcDateMatch[1] : '');
    
    title = cleanText(title);
    if (!title || title.length < 3) continue;
    
    if (title && link) {
      items.push({
        title,
        url: link.trim(),
        publishedAt: parseDate(pubDate),
        summary: cleanText(description).substring(0, 300),
        source: sourceName || 'Unknown',
      });
    }
  }
  
  return items;
}

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

// ============ 主逻辑 ============

async function fetchAllNews() {
  console.log('\n📡 开始抓取...\n');
  const results = await Promise.all(RSS_SOURCES.map(fetchRSSSource));
  const allItems = results.flatMap(r => r.items);
  console.log(`\n📊 共抓取 ${allItems.length} 条 (${results.filter(r=>r.success).length}/${results.length} 个源成功)`);
  return allItems;
}

function processNews(items) {
  console.log(`\n🔍 开始过滤...\n`);
  
  const today = items.filter(i => isTodayBeijing(i.publishedAt));
  console.log(`   📅 今天: ${today.length} 条`);
  
  const relevant = today.filter(i => isAIRelated(i.title, i.summary));
  console.log(`   🎯 AI相关: ${relevant.length} 条`);
  
  const unique = deduplicate(relevant);
  console.log(`   🔄 去重: ${unique.length} 条`);
  
  // 按分类
  const categorized = {};
  for (const item of unique) {
    const cat = classifyItem(item.title, item.summary);
    if (!categorized[cat]) categorized[cat] = [];
    categorized[cat].push(item);
  }
  
  // 排序
  unique.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return b.publishedAt - a.publishedAt;
  });
  
  console.log(`   📂 分类: ${Object.keys(categorized).join(', ')}`);
  
  return { items: unique, categorized };
}

function formatNews({ items, categorized }) {
  const beijing = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const dateStr = `${beijing.getFullYear()}年${beijing.getMonth() + 1}月${beijing.getDate()}日`;
  
  // 生成描述
  const topItems = items.slice(0, 5);
  const desc = topItems.map((item, i) => `${i + 1}. ${item.title}`).join('、');
  
  const lines = [];
  lines.push('---');
  lines.push(`title: "AI 资讯速递（${dateStr}）"`);
  lines.push(`date: ${beijing.toISOString().slice(0, 19)}+08:00`);
  lines.push('tags:');
  lines.push('  - "资讯"');
  lines.push('  - "2026"');
  lines.push('  - "AI动态"');
  lines.push(`description: '${dateStr}：${desc}'`);
  lines.push('showToc: true');
  lines.push('TocOpen: true');
  lines.push('---');
  lines.push('');
  lines.push(`## AI 资讯速递（${dateStr}）`);
  lines.push('');
  lines.push(`> 来源: Hacker News, Reddit, TechCrunch, 36氪, 少数派, 钛媒体 | 共 ${items.length} 条\n`);
  
  // 按分类输出
  const categoryOrder = ['技术突破', '产业动态', '资本动态', '应用落地', '政策动态'];
  
  for (const cat of categoryOrder) {
    if (!categorized[cat] || categorized[cat].length === 0) continue;
    
    lines.push(`## ${cat}`);
    lines.push('');
    
    for (let i = 0; i < categorized[cat].length && i < 8; i++) {
      const item = categorized[cat][i];
      const summary = item.summary ? item.summary.substring(0, 100).replace(/\n/g, ' ').trim() : '';
      lines.push(`${i + 1}. **${item.title}**`);
      lines.push(`   - 来源：${item.source}`);
      if (summary) {
        lines.push(`   - ${summary}${item.summary.length > 100 ? '...' : ''}`);
      }
      lines.push('');
    }
  }
  
  lines.push('---');
  lines.push(`*更新时间: ${beijing.toLocaleString('zh-CN')}*`);
  
  return lines.join('\n');
}

function saveNews(content) {
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
  const { items, categorized } = processNews(allItems);
  const content = formatNews({ items, categorized });
  
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
