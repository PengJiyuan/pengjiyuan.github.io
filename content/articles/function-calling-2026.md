---
title: "LLM 函数调用实战：让大模型真正替你干活"
date: 2026-03-31
tags:
  - "函数调用"
  - "Tool Use"
  - "Function Calling"
  - "AI Agent"
  - "工程实践"
  - "MCP"
description: "函数调用是 AI Agent 感知真实世界的感官——让 LLM 从「能说会道」进化到「能做事」。本文深入解析函数调用的核心机制：工具 schema 设计、并行与顺序调用策略、错误处理与重试、安全边界，以及 2026 年函数调用生态的最新演进（MCP 工具注册表、动态工具加载）。"
cover:
  image: "/articles/function-calling-2026-cover.png"
  alt: "LLM 函数调用实战"
  caption: "由 Tiny Stable Diffusion 生成"
showToc: true
TocOpen: true
difficulty: "intermediate"
---

## 引言：Agent 为何需要函数调用

2026 年最强大的 LLM，在真实世界面前依然是「盲人」。

它能写诗、分析财报、调试代码——但它不知道今天北京的天气、无法帮你查航班、不能操控数据库。它被困在训练数据的时间胶囊里。

**函数调用（Function Calling / Tool Use）** 是打破这个困局的核心机制。它让 LLM 能够：

- 调用外部 API 获取实时信息（天气、股价、库存）
- 读写数据库、执行计算
- 操控文件、操作浏览器
- 调用其他 AI 模型或微服务

换句话说，函数调用是 AI Agent 的「手和脚」。没有它，Agent 再强也只是「嘴上功夫」。

本文系统解析 2026 年函数调用的工程实践，从 schema 设计到安全边界，帮你把 LLM 从「聊天机器人」升级为「真正的助手」。

---

## 一、函数调用的底层机制

### 1.1 工作原理

函数调用的本质是一个结构化输出（Structured Output）问题。

当你在 prompt 中声明了可用工具，LLM 在生成回复时，遇到需要外部信息的问题，不再「瞎猜」，而是：

1. **识别需求**：判断用户问题是否需要调用工具
2. **选择工具**：从可用工具列表中选择最合适的一个（或多个）
3. **填充参数**：根据工具的 schema 提取用户意图中的关键参数
4. **输出结构化指令**：以 JSON 格式输出函数名和参数

这个过程不需要调用任何外部服务——LLM 只是在「决定做什么」，真正的执行由你的代码完成。

```
用户: "北京今天适合穿什么？"

LLM 思考: 这需要查天气 -> 选择工具 get_weather -> 提取参数 location=北京, date=today
LLM 输出: { "name": "get_weather", "arguments": { "location": "北京", "date": "2026-03-31" } }

你的代码执行: 调用天气 API 获取数据
你的代码返回: { "temp": 18, "condition": "晴", "wind": "微风" }

LLM 最终回复: "今天北京18度，晴天，微风，适合穿薄外套或长袖。"
```

这就是函数调用的完整闭环：**LLM 决策 → 代码执行 → 结果反馈 → LLM 综合回复**。

### 1.2 并行调用 vs 顺序调用

LLM 可以同时调用多个互不依赖的工具，这叫**并行函数调用（Parallel Function Calling）**。

```
用户: "帮我查一下北京和上海今天的天气"

LLM 输出（并行）:
{
  "tool_calls": [
    { "name": "get_weather", "arguments": { "location": "北京", "date": "2026-03-31" } },
    { "name": "get_weather", "arguments": { "location": "上海", "date": "2026-03-31" } }
  ]
}
```

两个天气查询互不依赖，同时发出，耗时减半。

**顺序调用**则用于有依赖关系的工具调用——第二个工具需要第一个的结果：

```
用户: "帮我查下这家公司的员工数，然后发一封邮件通知 HR"

LLM 输出（顺序）:
Step 1: { "name": "get_employee_count", "arguments": { "company": "某公司" } }
  -> 返回: { "count": 1200 }

Step 2: { "name": "send_email", "arguments": { "to": "hr@company.com", "body": "公司现有员工1200人" } }
```

主流 LLM（GPT-4o、Claude 4、Gemini 2.5、通义千问 Qwen3）都支持并行函数调用。但在实际业务中，**LLM 有时会产生「幻觉工具调用」**——调用一个不存在的工具，或传入 schema 中不存在的参数。这是函数调用中最常见的工程难题。

---

## 二、工具 Schema 设计：LLM 能否看懂你的工具

工具 schema 是 LLM 理解「你能做什么」的唯一窗口。schema 设计的好坏，直接决定了工具调用的准确率。

### 2.1 JSON Schema：行业标准格式

2026 年，主流 LLM 都使用 [JSON Schema](https://json-schema.org/) 作为工具定义格式。以下是一个设计良好的天气查询工具 schema：

```json
{
  "name": "get_weather",
  "description": "查询指定城市指定日期的天气信息，包括温度、湿度、风速和天气状况。如果用户未指定日期，默认查询今天的天气。",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "城市名称，支持中文或英文，例如'北京'、'Shanghai'。不要使用'这个城市'等代词。",
        "examples": ["北京", "上海", "东京"]
      },
      "date": {
        "type": "string",
        "description": "查询日期，格式为 YYYY-MM-DD。不写则默认今天。",
        "examples": ["2026-03-31", "2026-04-01"]
      },
      "unit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"],
        "description": "温度单位，不填默认 celsius（摄氏度）。"
      }
    },
    "required": ["location"]
  }
}
```

### 2.2 决定调用准确率的 Schema 设计原则

根据 OpenAI、Anthropic 和 LangChain 的最佳实践，以下原则能显著提升 LLM 的工具调用准确率：

**原则 1：description 是灵魂**

LLM 通过 description 理解工具的用途和触发时机。description 至少要回答三个问题：
- 这个工具干什么用？
- 什么时候该用？
- 有什么限制条件？

```json
// ❌ 差：信息不足
{ "name": "search", "description": "搜索文档", "parameters": { ... } }

// ✅ 好：明确边界和触发时机
{ "name": "search_documents", "description": "在企业知识库中搜索内部文档。仅当用户明确要求查找'文档'、'资料'、'相关规定'时使用。不要用于查询外部信息或实时数据。", "parameters": { ... } }
```

**原则 2：examples 是锚点**

JSON Schema 的 `examples` 字段为 LLM 提供了具体参考，大幅减少参数提取错误。

```json
"properties": {
  "action": {
    "type": "string",
    "description": "要执行的操作类型",
    "examples": ["start", "stop", "restart", "status"]
  }
}
```

**原则 3：参数顺序——required 优先**

LLM 在提取参数时，对 `required` 字段中的参数优先级更高。把最重要的参数放在 `required` 中，减少 LLM「漏填」的概率。

**原则 4：避免模糊的 enum**

enum 可以限制 LLM 的输出，但过度限制会导致调用失败。

```json
// ❌ 过度限制：LLM 猜不中这些值
{ "status": { "enum": ["ACTIVE", "INACTIVE", "PENDING"] } }

// ✅ 适度限制：给出合理范围，但保留灵活性
{ "status": { "type": "string", "description": "订单状态，支持：pending（待处理）、paid（已支付）、shipped（已发货）、completed（已完成）、cancelled（已取消）" } }
```

**原则 5：嵌套不超过 3 层**

过深的嵌套（如 `object.properties.object.properties.array`）会让 LLM 难以正确填充。建议将深层嵌套拆分为多个独立工具。

---

## 三、错误处理：LLM 调用失败的五个常见场景

函数调用链条中，任何一环出错都会导致整个任务失败。以下是五个高频错误场景及其应对策略。

### 3.1 场景一：LLM 传了无效参数

LLM 可能会传入 schema 中存在但实际业务不接受的值。

```python
# 用户: "帮我取消订单 #ABC123"
# LLM 输出: { "name": "cancel_order", "arguments": { "order_id": "ABC123" } }

# 但系统要求订单 ID 必须是大写数字
# API 返回: 400 Bad Request: "order_id 格式不正确"

# 优雅处理：参数预处理
def cancel_order_handler(args):
    order_id = args["order_id"]
    # 标准化：去掉空格、转大写、验证格式
    order_id = order_id.strip().upper()
    if not order_id.match(r'^[A-Z0-9]{6,20}$'):
        return {"error": f"订单号格式无效: {order_id}"}
    return call_cancel_api(order_id)
```

### 3.2 场景二：工具执行超时或服务不可用

```python
# 优雅重试 + 降级策略
def call_weather_api(location, retries=3):
    for attempt in range(retries):
        try:
            return requests.get(f"https://api.weather.com/v3", timeout=5).json()
        except (Timeout, ConnectionError) as e:
            if attempt == retries - 1:
                # 降级：返回「无法查询」而非抛出异常
                return {"error": "weather_api_unavailable", "message": f"天气服务暂时不可用，请稍后重试"}
            time.sleep(2 ** attempt)  # 指数退避
```

### 3.3 场景三：LLM 反复调用同一失败工具（循环调用）

这是最危险的场景——LLM 在遇到错误后不断重试，形成死循环。

**解决方案：给 LLM 提供「错误反馈」工具**

不要只返回错误信息，而是让 LLM 主动选择下一步：

```python
def handle_tool_error(tool_name, error, context):
    return {
        "tool_result": {
            "success": False,
            "error": str(error),
            "recoverable": False,  # 关键标志
            "suggestion": "天气服务暂时不可用，建议告知用户当前无法提供天气信息，可建议用户稍后重试或手动查询。"
        }
    }
```

在 system prompt 中加入指导：
> 如果工具返回 `recoverable: false`，不要再尝试调用相同工具，而是改用自然语言告知用户当前情况。

### 3.4 场景四：LLM 生成了不存在的工具名

这通常发生在工具集较大（>20个）时，LLM 产生了「工具名称幻觉」。

**解决方案：严格校验 + 模糊匹配**

```python
AVAILABLE_TOOLS = {
    "get_weather": get_weather_func,
    "search_documents": search_documents_func,
    "send_email": send_email_func,
    # ...
}

def execute_tool_call(tool_name, arguments):
    if tool_name not in AVAILABLE_TOOLS:
        # 尝试模糊匹配（处理 LLM 大小写/拼写错误）
        matches = difflib.get_close_matches(tool_name, AVAILABLE_TOOLS.keys(), n=1, cutoff=0.6)
        if matches:
            tool_name = matches[0]  # 自动纠正
        else:
            return {"error": f"未找到工具: {tool_name}，可用工具: {list(AVAILABLE_TOOLS.keys())}"}
    
    return AVAILABLE_TOOLS[tool_name](arguments)
```

### 3.5 场景五：上下文窗口耗尽（TOCTOU 问题）

当工具调用链较长时，中间结果积累导致上下文耗尽。

**解决方案：压缩历史 + 选择性遗忘**

```python
def compact_conversation(messages, max_tokens=3000):
    """将旧的工具调用和结果压缩为摘要"""
    compacted = []
    tool_call_count = 0
    
    for msg in messages:
        if msg["role"] == "tool":
            tool_call_count += 1
            if tool_call_count <= 3:
                compacted.append(msg)  # 保留最近3次工具调用详情
            elif tool_call_count == 4:
                compacted.append({
                    "role": "system",
                    "content": f"[{tool_call_count}次工具调用已省略最近结果，均成功]"
                })
        else:
            compacted.append(msg)
    
    return compacted
```

---

## 四、安全边界：函数调用中的权限控制

函数调用绕过了 LLM 的内容安全限制——LLM 可以「借手行事」。这是 Agent 安全中最容易被忽视的漏洞。

### 4.1 最小权限原则

每个工具只授予完成任务所需的最小权限：

```python
# ❌ 危险：Agent 有完整数据库权限
tools = [
    {"name": "execute_sql", "description": "执行任意 SQL", "permissions": "FULL_DATABASE"},
]

# ✅ 安全：只读权限，限制操作类型
tools = [
    {"name": "query_orders", "description": "查询订单", "permissions": "READ_ONLY", "allowed_operations": ["SELECT"]},
]
```

### 4.2 参数白名单验证

```python
def safe_delete_file(args):
    # 1. 验证路径：不允许路径穿越
    filepath = os.path.abspath(args["filepath"])
    ALLOWED_DIRS = ["/data/uploads", "/data/exports"]
    if not any(filepath.startswith(d) for d in ALLOWED_DIRS):
        raise PermissionError(f"禁止访问目录之外的文件: {filepath}")
    
    # 2. 危险操作二次确认
    if args.get("confirm") != True:
        return {"status": "awaiting_confirmation", "message": "确定要删除此文件吗？请确认。"}
    
    return os.remove(filepath)
```

### 4.3 工具调用审计日志

每一次工具调用都应该被记录：

```python
import structlog
logger = structlog.get_logger()

def audited_tool_call(tool_name, arguments, user_id, session_id):
    logger.info(
        "tool_call",
        tool=tool_name,
        args=sanitize_args(arguments),  # 移除敏感字段如密码
        user=user_id,
        session=session_id,
        timestamp=datetime.utcnow().isoformat()
    )
    # 实际执行...
```

---

## 五、MCP 工具注册表：2026 年的函数调用生态

2026 年，函数调用生态最大的变化是 **MCP（Model Context Protocol）工具注册表**的崛起。

### 5.1 什么是 MCP 工具注册表

MCP 工具注册表是一个标准化工具发布和发现协议。开发者将工具发布到注册表，Agent 运行时动态发现和加载，无需硬编码工具列表。

```json
// 工具发布到 MCP 注册表
{
  "name": "github-repos",
  "version": "1.0.0",
  "description": "查询 GitHub 仓库信息、PR 和 Issue 状态",
  "provider": "github",
  "schema_url": "https://registry.mcp.tools/schemas/github-repos/v1.json",
  "auth": { "type": "oauth2", "scopes": ["repo"] }
}
```

这带来两个核心改变：
- **工具发现自动化**：Agent 启动时从注册表拉取可用工具，不再需要手动配置
- **版本管理**：工具 schema 变更通过注册表版本号管理，Agent 自动适配

### 5.2 当前主流 MCP 注册表

| 注册表 | 特点 | 工具数量 |
|--------|------|----------|
| MCP Official Registry | 官方维护，质量最高 | 200+ |
| Smithery.ai | 社区驱动，覆盖全面 | 3000+ |
| GitHub MCP Marketplace | 与 GitHub 深度集成 | 500+ |

### 5.3 动态工具加载示例

```python
from mcp_registry import RegistryClient

registry = RegistryClient("https://registry.mcp.tools")

# Agent 启动时：动态加载用户所需的工具
available_tools = registry.discover_tools(
    tags=["productivity", "data-analysis"],
    auth_required=False,
    quality_score_gte=0.8
)

# 加载到 Agent
agent.load_tools(available_tools)
```

---

## 六、实战模板：构建一个生产级函数调用 Pipeline

以下是一个完整的函数调用工程模板，适用于实际生产项目：

```python
from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional
import structlog

logger = structlog.get_logger()

class ToolResultStatus(Enum):
    SUCCESS = "success"
    RETRYABLE_ERROR = "retryable_error"
    FATAL_ERROR = "fatal_error"

@dataclass
class ToolResult:
    status: ToolResultStatus
    data: Optional[dict] = None
    error: Optional[str] = None
    suggestion: Optional[str] = None

class ToolRegistry:
    """生产级工具注册中心"""
    
    def __init__(self):
        self._tools: dict[str, callable] = {}
        self._schemas: dict[str, dict] = {}
    
    def register(self, schema: dict, handler: callable):
        self._tools[schema["name"]] = handler
        self._schemas[schema["name"]] = schema
        logger.info("tool_registered", name=schema["name"])
    
    def get_schema(self, name: str) -> Optional[dict]:
        return self._schemas.get(name)
    
    def list_tools(self) -> list[dict]:
        return list(self._schemas.values())
    
    def execute(self, name: str, args: dict, context: dict) -> ToolResult:
        if name not in self._tools:
            return ToolResult(
                status=ToolResultStatus.FATAL_ERROR,
                error=f"未知工具: {name}"
            )
        
        try:
            result = self._tools[name](args, context)
            return ToolResult(status=ToolResultStatus.SUCCESS, data=result)
        except RetryableError as e:
            return ToolResult(
                status=ToolResultStatus.RETRYABLE_ERROR,
                error=str(e),
                suggestion=e.suggestion
            )
        except Exception as e:
            logger.error("tool_execution_failed", tool=name, error=str(e))
            return ToolResult(
                status=ToolResultStatus.FATAL_ERROR,
                error=f"工具执行失败: {str(e)}"
            )

# 使用示例
registry = ToolRegistry()
registry.register(WEATHER_SCHEMA, get_weather_handler)
registry.register(SEARCH_SCHEMA, search_handler)
```

---

## 结语

函数调用是 AI Agent 落地的「最后一公里」。schema 设计、错误处理、安全边界、工具生态——每一个环节都有大量工程细节。

2026 年，函数调用正在经历三个趋势：
1. **工具注册表标准化**：MCP 协议让工具发现和加载自动化
2. **安全成为第一公民**：从「能调用」到「安全地调用」
3. **并行调用常态化**：LLM 原生支持并行，复杂任务拆解成多个工具同步执行

掌握函数调用，就是掌握 AI Agent 与真实世界交互的接口。下一篇文章我们将深入讲**多工具协同编排**——当一个 Agent 需要同时调用十几个工具时，如何设计清晰的任务规划流程。

---

*相关主题：[MCP 协议入门](/articles/mcp-intro/)、[Agent 评测实践](/articles/agent-evaluation-2026/)、[AgentOps 实战](/articles/agentops-2026/)*
