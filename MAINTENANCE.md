# 🤖 AI 新手入门教程 - 自主维护手册

## 仓库信息

- **仓库地址**: https://github.com/PengJiyuan/ai-tech-wiki
- **目标用户**: 零基础 AI 新手
- **内容定位**: 从 0 到 1 体系化学习 AI

---

## 📋 每日维护检查清单

### 1. 链接检查（必须）
```bash
# 检查所有 md 文件中的链接
grep -r "\]\(" docs/*.md | grep -v "^docs/README"
```
- [ ] 检查 README.md 中所有链接是否有效
- [ ] 检查每个文档的相对链接指向的文件是否存在
- [ ] 检查外部链接是否可访问

### 2. 文件检查（必须）
```bash
# 查看 docs 目录下的所有文件
ls -la docs/
```
- [ ] README.md 引用的文件都存在
- [ ] 没有孤立的未引用文件
- [ ] 文件命名规范（01-xxx.md 格式）

### 3. 内容检查（建议）
- [ ] 错别字检查
- [ ] 代码示例是否能运行
- [ ] 链接是否最新

---

## 📅 更新计划

### 每日任务（2-5 次）
1. 搜集 AI 资讯热点
2. 搜索最新技术文章
3. 整理有价值内容
4. 更新到对应章节
5. 提交并推送到 GitHub

### 每周任务
1. 检查所有链接有效性
2. 清理无用文件
3. 优化现有内容
4. 根据用户反馈调整

### 每月任务
1. 大版本内容更新
2. 新增章节规划
3. 用户反馈整理
4. 仓库整体优化

---

## 📁 文件命名规范

```
docs/
├── 01-what-is-ai.md          # 01-基础概念
├── 02-what-ai-can-do.md      # 02-基础概念
├── 03-ai-terms.md            # 03-基础概念
├── 04-register-chatgpt.md    # 04-工具使用
├── 05-register-claude.md     # 04-工具使用
├── 06-ai-writing.md          # 04-工具使用
├── 07-ai-coding.md           # 04-工具使用
├── 08-what-is-prompt.md      # 05-Prompt
├── 09-write-good-prompt.md   # 05-Prompt
├── 10-prompt-templates.md    # 05-Prompt
├── 11-what-is-api.md         # 06-开发
├── 12-get-api-key.md         # 06-开发
├── 13-call-ai-in-python.md  # 06-开发
└── 14-build-ai-assistant.md  # 06-开发
```

---

## 🔧 常用命令

### 克隆仓库
```bash
git clone https://github.com/PengJiyuan/ai-tech-wiki.git
cd ai-tech-wiki
```

### 提交更改
```bash
git add .
git commit -m "feat: 更新内容描述"
git push origin main
```

### 检查链接
```bash
# 检查损坏的链接
grep -r "http" docs/*.md | cut -d'(' -f2 | cut -d')' -f1 | xargs -I {} curl -s -o /dev/null -w "%{} - %{http_code}\n" {}
```

---

## 📊 内容分类

| 阶段 | 内容类型 | 文件数量 |
|------|----------|----------|
| 第一阶段 | 基础概念 | 3 篇 |
| 第二阶段 | 工具使用 | 4 篇 |
| 第三阶段 | Prompt | 3 篇 |
| 第四阶段 | 开发 | 4 篇 |

---

## 🎯 质量标准

- [ ] 所有链接有效
- [ ] 无未引用文件
- [ ] 代码示例可运行
- [ ] 中文无错别字
- [ ] 格式统一规范
- [ ] 内容准确无误

---

## 🔄 自动化（待实现）

- [ ] 自动检查链接脚本
- [ ] 自动更新 GitHub Actions
- [ ] 自动同步 AI 资讯

---

*最后更新: 2026-03-02*
