---
title: "MCP 协议深度解析：给 AI 接上真实世界的标准接口"
date: 2026-02-25
tags:
  - "MCP"
  - "Anthropic"
  - "AI Agent"
  - "工具调用"
description: "MCP（Model Context Protocol）是 Anthropic 在 2024 年底推出的开放协议，旨在标准化 AI 模型与外部工具之间的通信。本文深入解析 MCP 架构设计与实现方法。"
cover:
  image: "/articles/mcp-cover.png"
  alt: "MCP 协议深度解析"
  caption: "由 Tiny Stable Diffusion 生成"
showToc: true
TocOpen: true
---

2024 年 11 月，Anthropic 发布了 MCP（Model Context Protocol）。这个协议要解决的问题很具体：每个 AI 应用都在各自为战地实现工具调用，没有标准，重复造轮子。

MCP 的目标是成为 AI 模型接入外部世界的 USB-C 接口——统一标准，任何客户端可以连任何服务端。

## MCP 与 Function Calling 的区别

很多人第一反应是：这不就是 OpenAI 的 Function Calling 吗？区别在于层次不同：

| | Function Calling | MCP |
|---|---|---|
| **协议层** | HTTP/REST | JSON-RPC 2.0 |
| **传输层** | 由应用决定 | stdio 或 SSE |
| **工具定义** | 内嵌在 API 调用 | 独立的 MCP Server |
| **可复用性** | 低，绑定单个应用 | 高，一个 Server 服务多个客户端 |
| **额外能力** | 仅工具调用 | 工具 + 资源 + Prompt 模板 |

Function Calling 本质上是"每次 API 调用里夹带一个工具列表"；MCP 是"启动一个独立进程/服务，任何支持 MCP 的客户端都能连上用"。

## 架构：Host、Client、Server

MCP 有三个角色：

```text
┌──────────────────────────────────────┐
│  Host（宿主，如 Claude Desktop）      │
│                                      │
│  ┌─────────────┐  ┌───────────────┐  │
│  │ MCP Client  │  │ MCP Client    │  │
│  └──────┬──────┘  └───────┬───────┘  │
└─────────┼─────────────────┼──────────┘
          │ stdio/SSE        │ stdio/SSE
          ▼                  ▼
   ┌─────────────┐   ┌─────────────┐
   │  MCP Server │   │  MCP Server │
   │ (文件系统)  │   │  (数据库)   │
   └─────────────┘   └─────────────┘
```

- **Host**：持有 LLM 的应用，如 Claude Desktop、Cursor、自己写的 AI 助手
- **Client**：Host 内部的 MCP 连接管理器，负责与 Server 通信
- **Server**：暴露工具/资源/Prompt 的独立进程。你自己写的业务逻辑就在这里

## MCP Server 能暴露什么

MCP Server 可以暴露三类能力：

1. **Tools（工具）**：模型可以调用的函数，如查数据库、发邮件、执行代码
2. **Resources（资源）**：模型可以读取的数据，如文件内容、数据库记录（只读）
3. **Prompts（提示模板）**：预定义的 Prompt 模板，供宿主应用使用

## 动手写一个 MCP Server

### 安装 SDK

```bash
pip install mcp
```

### 最简示例：一个计算工具

```python
# calculator_server.py
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

app = Server("calculator")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="calculate",
            description="执行基本的数学计算，支持加减乘除",
            inputSchema={
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "要计算的数学表达式，如 '2 + 3 * 4'"
                    }
                },
                "required": ["expression"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "calculate":
        expression = arguments["expression"]
        # 注意：生产中要用安全的表达式解析器，而非 eval
        try:
            result = eval(expression, {"__builtins__": {}}, {})
            return [TextContent(type="text", text=f"结果：{result}")]
        except Exception as e:
            return [TextContent(type="text", text=f"计算错误：{str(e)}")]
    raise ValueError(f"未知工具：{name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
```

运行这个 Server：

```bash
python calculator_server.py
```

Server 通过 **stdin/stdout** 与 Client 通信（stdio 传输模式），这就是为什么 Claude Desktop 配置里是用 `command` 启动一个进程。

### 更完整的示例：数据库查询工具

```python
# db_server.py
import asyncio
import sqlite3
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, Resource, TextContent

DB_PATH = "company.db"

app = Server("company-db")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="query_employees",
            description="根据部门查询员工列表",
            inputSchema={
                "type": "object",
                "properties": {
                    "department": {"type": "string", "description": "部门名称"},
                    "limit": {"type": "integer", "description": "返回数量，默认10", "default": 10}
                },
                "required": ["department"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "query_employees":
        dept = arguments["department"]
        limit = arguments.get("limit", 10)

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # 使用参数化查询防止 SQL 注入
        cursor.execute(
            "SELECT name, position, email FROM employees WHERE department = ? LIMIT ?",
            (dept, limit)
        )
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return [TextContent(type="text", text=f"未找到 {dept} 部门的员工")]

        result = f"{dept} 部门员工（共 {len(rows)} 人）：\n"
        for name, position, email in rows:
            result += f"- {name}（{position}）: {email}\n"
        return [TextContent(type="text", text=result)]

@app.list_resources()
async def list_resources():
    return [
        Resource(
            uri="db://departments",
            name="部门列表",
            description="公司所有部门",
            mimeType="text/plain"
        )
    ]

@app.read_resource()
async def read_resource(uri: str):
    if uri == "db://departments":
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT department FROM employees")
        departments = [row[0] for row in cursor.fetchall()]
        conn.close()
        return "\n".join(departments)

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
```

## 接入 Claude Desktop

在 Claude Desktop 配置文件中（macOS 路径：`~/Library/Application Support/Claude/claude_desktop_config.json`）添加：

```json
{
  "mcpServers": {
    "company-db": {
      "command": "python",
      "args": ["/path/to/db_server.py"],
      "env": {
        "PYTHONPATH": "/path/to/project"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/Documents"]
    }
  }
}
```

配置后重启 Claude Desktop，助手就能调用你的工具了。

## SSE 传输：构建 HTTP MCP Server

stdio 适合本地工具，如果要部署成服务，用 SSE（Server-Sent Events）传输：

```python
# sse_server.py
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Route, Mount
import uvicorn

app = Server("my-remote-server")

sse = SseServerTransport("/messages/")

async def handle_sse(request):
    async with sse.connect_sse(request.scope, request.receive, request._send) as streams:
        await app.run(streams[0], streams[1], app.create_initialization_options())

starlette_app = Starlette(
    routes=[
        Route("/sse", endpoint=handle_sse),
        Mount("/messages/", app=sse.handle_post_message),
    ]
)

if __name__ == "__main__":
    uvicorn.run(starlette_app, host="0.0.0.0", port=8000)
```

客户端连接时配置 URL：

```json
{
  "mcpServers": {
    "remote-server": {
      "url": "http://localhost:8000/sse"
    }
  }
}
```

## 用 MCP Python Client 测试

不必每次都开 Claude Desktop 来测试，可以直接用 Python Client：

```python
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test_server():
    server_params = StdioServerParameters(
        command="python",
        args=["db_server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            tools = await session.list_tools()
            print("可用工具：", [t.name for t in tools.tools])

            result = await session.call_tool(
                "query_employees",
                {"department": "工程部", "limit": 5}
            )
            print(result.content[0].text)

asyncio.run(test_server())
```

## 协议细节：JSON-RPC 2.0

MCP 底层是标准 JSON-RPC 2.0 协议。通过 stdio 通信时，实际传输的是这样的消息：

**Client → Server（工具调用请求）：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "query_employees",
    "arguments": {"department": "工程部"}
  }
}
```

**Server → Client（响应）：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {"type": "text", "text": "工程部员工（共 3 人）：\n..."}
    ],
    "isError": false
  }
}
```

理解这个层次有助于调试问题——出错时可以直接在 stdio 管道上打印原始消息。

## 现有的 MCP Server 生态

官方和社区已有大量现成的 MCP Server 可以直接用：

- `@modelcontextprotocol/server-filesystem`：文件系统读写
- `@modelcontextprotocol/server-github`：GitHub API（仓库、PR、Issues）
- `@modelcontextprotocol/server-postgres`：PostgreSQL 查询
- `@modelcontextprotocol/server-brave-search`：Brave 搜索
- `mcp-server-sqlite`：本地 SQLite 数据库

完整列表见 [MCP Servers 仓库](https://github.com/modelcontextprotocol/servers)。

## 总结

MCP 的价值在于**标准化**。有了标准接口：

- 工具可以跨应用复用（写一次，在 Claude、Cursor、Zed 等都能用）
- 企业可以把内部系统包装成 MCP Server，不需要为每个 AI 产品单独集成
- 生态可以积累：社区共享 Server，用户直接安装使用

目前 MCP 已获得 OpenAI、Google DeepMind 等厂商支持，有成为行业标准的势头。如果你在搭建 AI 工具链，值得现在就了解并采用。
