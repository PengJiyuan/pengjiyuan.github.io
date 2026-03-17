---
title: "端到端 AI Coding 平台 Skill 配置与消费完全指南"
date: 2026-03-17
tags:
  - "AI"
  - "Skill"
  - "Claude Code"
  - "Cursor"
  - "Codex"
  - "指南"
description: "本文详细介绍什么是 Skill、主流 AI Coding 平台（Claude Code、OpenAI Codex、Cursor、Windsurf、SCLAW）的 Skill 系统、标准化格式、各平台配置方法以及最佳实践。"
cover:
  image: "/articles/ai-coding-platform-skill-guide-cover.png"
  alt: "AI Coding 平台 Skill 指南"
  caption: "由 Tiny Stable Diffusion 生成"
showToc: true
TocOpen: true
---

2026 年，AI Coding 平台（Claude Code、OpenAI Codex、Cursor、Windsurf 等）已经深度融入开发者的日常工作。

**Skill（技能）**是一种将 AI 编码助手能力标准化的方式。它让开发者可以：

- 📦 **复用工作流**：把重复的开发流程封装成可复用的指令
- 🎯 **精准触发**：让 AI 在特定场景下使用特定处理方式
- 📚 **知识沉淀**：把团队的技术栈规范、项目约定持久化
- 🔄 **跨平台共享**：一次编写，多个 AI 助手可用

### Skill vs 其他概念

| 概念 | 作用 | 触发方式 |
|------|------|----------|
| **Skill** | 多步骤工作流 | `/skill-name` 或自动触发 |
| **Rule/指令** | 系统级提示 | 始终加载或按路径匹配 |
| **Command** | 单命令快捷操作 | `/command-name` |
| **Subagent** | 独立子任务 | 调用子 agent |
| **MCP** | 外部工具集成 | 工具调用 |

---

## 主流 AI Coding 平台的 Skill 系统

### 2.1 平台对比

| 平台 | Skill 目录 | Skill 文件 | 触发方式 |
|------|------------|------------|----------|
| **Claude Code** | `.claude/skills/` | `SKILL.md` | `/skill-name` 或自动 |
| **OpenAI Codex** | `.agents/skills/` | `SKILL.md` | `$skill-name` 或 `/skills` |
| **Cursor** | `.cursor/skills/` | `SKILL.md` | `/skill-name` 或 `@skill-name` |
| **Windsurf** | `.windsurf/skills/` | `SKILL.md` | 类似 Claude Code |
| **SCLAW** | `.claude/skills/` | `SKILL.md` | `/skill-name` 或自动 |

> **注意**：大多数平台互相兼容彼此的 Skill 目录格式，例如 Cursor 会读取 `.claude/skills/`、`.codex/skills/` 等。

### 2.2 优先级顺序

以 Codex 为例（从高到低）：

1. **REPO** - `$CWD/.agents/skills` (当前项目)
2. **USER** - `~/.agents/skills` (用户级)
3. **ADMIN** - `/etc/codex/skills` (系统级)
4. **Built-in** - 内置 Skills

---

## Skill 的标准格式

### 3.1 目录结构

```
skill-name/
├── SKILL.md              # 必须：主技能文件
├── references/           # 可选：参考资料
│   ├── api-guide.md
│   └── examples/
├── scripts/              # 可选：可执行脚本
│   └── validate.sh
└── assets/              # 可选：模板、资源
    └── template.md
```

### 3.2 SKILL.md 格式

```yaml
---
name: skill-name              # 技能名称 (kebab-case)
description: 描述技能用途     # 简短描述，用于技能选择器
                                 # 建议包含 "WHEN" 触发条件
                                 # 例如："当用户要求写测试时使用"
disable-model-invocation: false  # 可选：是否禁用模型自动调用
allowed-tools:                  # 可选：允许使用的工具
  - Read
  - Write
  - Bash
---

# 技能详细说明

## 何时使用
当用户要求...时使用此技能

## 步骤

1. 第一步操作
2. 第二步操作
3. 第三步操作

## 示例

输入：
...

输出：
...

## 注意事项
- 注意点1
- 注意点2
```

### 3.3 关键规则

| 规则 | 说明 |
|------|------|
| **文件名** | 必须精确为 `SKILL.md`（大小写敏感） |
| **目录名** | 必须使用 kebab-case（如 `my-awesome-skill`） |
| **禁止** | 不要在目录内放 `README.md` |
| **YAML** | 必须使用 `---` 包裹 frontmatter |
| **描述** | 必须包含 WHAT（做什么）和 WHEN（何时用） |

---

## 各平台配置详解

### 4.1 Claude Code

#### 目录位置

```bash
# 用户级（全局可用）
~/.claude/skills/

# 项目级（仅当前项目可用）
.claude/skills/
```

#### 创建 Skill

```bash
# 1. 创建目录
mkdir -p ~/.claude/skills/my-skill

# 2. 编写 SKILL.md
cat > ~/.claude/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: 当用户要求生成单元测试时使用此技能
---

# 单元测试技能

## 使用场景
当用户说"写测试"、"添加测试"、"unit test"时使用。

## 步骤
1. 分析被测试代码
2. 确定测试框架（Vitest/Jest/Mocha）
3. 编写测试用例
4. 运行测试验证
EOF
```

#### 触发方式

```bash
# 方式1：手动触发
/my-skill

# 方式2：描述触发
"帮我给这个函数写个单元测试"
# Claude 会自动识别并加载 skill
```

#### 配置额外目录

```bash
# 设置环境变量添加额外 skill 目录
export CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1
```

---

### 4.2 OpenAI Codex

#### 目录位置

```bash
# 用户级
~/.agents/skills/      # 或 ~/.codex/skills/

# 项目级
.agents/skills/        # 代码库根目录

# 系统级（管理员）
/etc/codex/skills/
```

#### 安装 Skill（官方市场）

```bash
# 使用 skill-installer 安装
$skill-installer linear

# 从 GitHub 安装
$skill-installer https://github.com/user/repo/tree/main/skill-name
```

#### 创建 Skill

```bash
# 1. 启用 skills 功能
codex --enable skills

# 2. 创建目录
mkdir -p ~/.codex/skills/my-skill

# 3. 编写 SKILL.md
cat > ~/.codex/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: 技能描述
---

# 技能内容
EOF
```

#### 触发方式

```bash
# 方式1：使用 $ 前缀
$my-skill

# 方式2：使用 /skills 选择器
/skills
# 然后选择技能

# 方式3：自然语言触发
"用 my-skill 处理这个任务"
```

#### 配置启用/禁用

```toml
# ~/.codex/config.toml
[[skills]]
path = "/path/to/skill/SKILL.md"
enabled = false  # 禁用但不删除
```

---

### 4.3 Cursor

#### 目录位置

```bash
# 用户级
~/.cursor/skills/

# 项目级
.cursor/skills/
.cursor/rules/      # 规则文件
```

#### 创建 Skill

```bash
# 方式1：使用内置命令
/create-skill
# 然后按提示创建

# 方式2：手动创建
mkdir -p .cursor/skills/my-skill
cat > .cursor/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: 技能描述
---

# 技能内容
EOF
```

#### 触发方式

```bash
# 方式1：/ 命令
/my-skill

# 方式2：@ 引用
@my-skill

# 方式3：自然语言
"用 my-skill 技能处理"
```

#### Rules（类似 Skill 但不同）

```bash
# .cursor/rules/ 下的规则会始终加载
# 适合简短的代码规范

# 简单示例：.cursor/rules/coding-style.md
# 代码规范
- 使用 TypeScript
- 优先使用函数组件
- 数据库列使用 snake_case
```

---

### 4.4 Windsurf

Windsurf 基本兼容 Claude Code 的 Skill 系统：

```bash
# 目录位置
~/.windsurf/skills/
.windsurf/skills/
```

---

### 4.5 SCLAW (OpenClaw)

SCLAW 兼容 Claude Code 的 Skill 格式：

```bash
# Skill 目录
~/.claude/skills/           # 全局
.openclaw/workspace/skills/ # 工作区

# 技能市场
clawhub.com                 # 官方 Skill 市场
```

#### 安装 Skill

```bash
# 使用 clawhub CLI
clawhub install skill-name

# 或从 GitHub
clawhub install https://github.com/user/repo
```

---

## Skill 市场与分发

### 5.1 官方市场

| 市场 | 平台 | URL |
|------|------|-----|
| **skills.sh** | 多平台 | skills.sh |
| **Agent Skills** | OpenAI | developers.openai.com/codex/skills |
| **ClawHub** | SCLAW | clawhub.com |

### 5.2 安装工具

#### skilz CLI（通用安装器）

```bash
# 安装
pip install skilz

# 安装到 Claude Code（全局）
skilz install -g <skill-url>

# 安装到特定项目
skilz install <skill-url> --project ./my-project

# 安装到其他平台
skilz install <skill-url> --agent codex
skilz install <skill-url> --agent gemini
skilz install <skill-url> --agent cursor
```

#### 从 GitHub 安装

```bash
# Codex: 使用 skill-installer
$skill-installer https://github.com/user/repo/tree/main/path/to/skill

# SCLAW: 使用 clawhub
clawhub install user/repo --skill path/to/skill
```

### 5.3 发布 Skill

```bash
# 1. 准备 Skill 目录
my-skill/
└── SKILL.md

# 2. 压缩为 zip（发布到官方市场时需要）
zip -r my-skill.zip my-skill/

# 3. 推送到 GitHub
git add .
git commit -m "Add my-awesome-skill"
git push

# 4. 在市场提交（根据各平台要求）
```

---

## 最佳实践

### 6.1 Skill 编写指南

#### ✅ 推荐做法

1. **描述要具体**
   ```yaml
   # ❌ 差
   description: "写测试"
   
   # ✅ 好
   description: "当用户要求编写单元测试时使用此技能，包括分析代码、选择框架、编写用例、运行验证"
   ```

2. **包含触发关键词**
   ```yaml
   # 描述中包含常见触发词
   description: "当用户说'写测试'、'添加测试用例'、'unit test'、'编写测试'时使用"
   ```

3. **提供示例**
   ```yaml
   ## 示例
   
   输入：
   给我写的 utils.js 里的函数写测试
   
   输出：
   ```javascript
   describe('utils', () => {
     test('should work', () => {
       expect(true).toBe(true);
     });
   });
   ```
   ```

4. **错误处理**
   ```yaml
   ## 注意事项
   - 如果没有测试框架，先安装
   - 如果测试失败，提供修复建议
   - 不要修改生产代码
   ```

#### ❌ 避免的做法

- 在描述中使用 XML 标签 `< >`
- 技能名称使用下划线或大写
- 把所有知识都塞进一个 Skill
- 技能过于通用（没有特定用途）

### 6.2 项目结构示例

```
my-project/
├── .claude/
│   ├── skills/
│   │   ├── write-tests/
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   │       └── framework-guides.md
│   │   └── deploy/
│   │       └── SKILL.md
│   ├── commands/
│   │   └── custom-commands.md
│   └── settings.json
├── .cursor/
│   ├── rules/
│   │   └── project-rules.md
│   └── skills/  # 链接到 .claude/skills
└── CLAUDE.md
```

### 6.3 团队共享策略

1. **项目级 Skill**：放在仓库 `.claude/skills/`，随代码一起版本控制
2. **团队级 Skill**：放到团队共享仓库，用 submodule 引入
3. **个人 Skill**：放在 `~/.claude/skills/`

---

## 常见问题

### Q1: Skill 没有触发怎么办？

1. **检查描述**：确保描述包含常见触发词
2. **检查路径**：
   ```bash
   # Claude Code
   ls ~/.claude/skills/your-skill/SKILL.md
   
   # Codex
   ls ~/.codex/skills/your-skill/SKILL.md
   ```
3. **检查 YAML 语法**：确保 `---` 包裹，name 使用 kebab-case
4. **手动触发**：直接用 `/skill-name` 试试

### Q2: 多个 Skill 冲突怎么办？

Codex 不会合并同名的 Skill，所有同名的都会显示在选择器中。

### Q3: Skill 太大了怎么办？

使用 **references/** 目录拆分：
```yaml
---
name: large-skill
description: 大型技能
---

# 简要步骤
1. 读取 references/step1.md
2. 读取 references/step2.md
3. 执行...
```

### Q4: 各平台 Skill 兼容吗？

| 平台 | 读取其他平台目录 |
|------|------------------|
| Claude Code | ✅ `.claude/skills/` |
| Codex | ✅ `.agents/skills/`, `.codex/skills/` |
| Cursor | ✅ `.claude/skills/`, `.codex/skills/`, `.cursor/skills/` |
| Windsurf | ✅ `.claude/skills/` |

### Q5: 如何调试 Skill？

1. **使用内省命令**：
   ```bash
   # Codex
   /skills list
   
   # Claude Code
   /skills
   ```

2. **简化测试**：创建最简单的 Skill 确认能触发
   ```yaml
   ---
   name: debug-test
   description: 测试触发
   ---
   这是一个测试技能！
   ```

---

## 参考资源

- [Claude Code Skills 文档](https://code.claude.com/docs/en/skills)
- [OpenAI Codex Skills 文档](https://developers.openai.com/codex/skills/)
- [Cursor Skills 文档](https://cursor.com/help/customization/skills)
- [Atmos AI Agent Skills](https://atmos.tools/ai/agent-skills)
- [SkillHub (SCLAW)](https://clawhub.com)
- [skills.sh 市场](https://skills.sh)

---

*这份指南会持续更新。如果有问题或建议，欢迎提交 PR。*
