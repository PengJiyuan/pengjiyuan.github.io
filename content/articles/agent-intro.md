---
title: "AI Agent 工程实践：从 ReAct 到多智能体协作"
date: 2026-03-01
tags:
  - "AI Agent"
  - "LangChain"
  - "LangGraph"
  - "ReAct"
description: "AI Agent 是能够自主规划、调用工具、执行多步任务的 AI 系统。本文从 ReAct 模式出发，介绍 Agent 的核心架构与工程实现，包括工具调用、记忆管理和多 Agent 协作。"
cover:
  image: "/articles/agent-intro-cover.png"
  alt: "AI Agent 工程实践"
  caption: "由 Tiny Stable Diffusion 生成"
showToc: true
TocOpen: true
---

Agent 这个词被用烂了。从"会调用几个工具"到"能自主完成复杂项目"，都被叫做 Agent。

比较准确的定义是：**Agent 是一个循环系统**，它持续地观察环境、推理下一步、执行行动，直到完成目标或达到终止条件。和普通的 LLM 调用不同，Agent 不是一问一答——它在一个任务内会自主决定做多少步、用哪些工具、是否需要纠正之前的错误。

## ReAct：Agent 的核心模式

大多数 Agent 框架底层都在用 **ReAct（Reasoning + Acting）** 模式，来自 2022 年的一篇论文。思路很简单：

```
Thought: 我需要先查一下当前比特币价格
Action: search_web
Action Input: "bitcoin price today"
Observation: Bitcoin 当前价格为 $67,234

Thought: 价格查到了，现在计算一下用户问的持仓盈亏
Action: calculate
Action Input: (67234 - 45000) * 0.5
Observation: 11117.0

Thought: 计算完成，可以给出答案了
Final Answer: 您持有 0.5 BTC，按当前价格计算盈利约 $11,117
```

模型在每一步都先"思考"（Thought），再决定行动（Action），然后观察结果（Observation），再思考下一步。这个循环一直到模型认为可以给出最终答案。

## 用 LangChain 实现一个 ReAct Agent

```bash
pip install langchain langchain-openai duckduckgo-search
```

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.prompts import PromptTemplate

llm = ChatOpenAI(model="gpt-4o", temperature=0)

search = DuckDuckGoSearchRun()

def calculator(expression: str) -> str:
    """安全的数学表达式计算器"""
    import ast
    import operator

    ops = {
        ast.Add: operator.add, ast.Sub: operator.sub,
        ast.Mult: operator.mul, ast.Div: operator.truediv,
        ast.Pow: operator.pow
    }

    def eval_node(node):
        if isinstance(node, ast.Constant):
            return node.value
        elif isinstance(node, ast.BinOp):
            return ops[type(node.op)](eval_node(node.left), eval_node(node.right))
        raise ValueError(f"不支持的操作")

    try:
        tree = ast.parse(expression, mode='eval')
        return str(eval_node(tree.body))
    except Exception as e:
        return f"计算错误：{e}"

tools = [
    Tool(name="search", func=search.run, description="搜索互联网获取最新信息"),
    Tool(name="calculator", func=calculator, description="计算数学表达式，输入如 '2 + 3 * 4'"),
]

react_prompt = PromptTemplate.from_template("""请用中文回答问题。你可以使用以下工具：

{tools}

回答时请遵循以下格式：

Question: 你要回答的问题
Thought: 思考下一步要做什么
Action: 使用的工具名称（必须是 [{tool_names}] 之一）
Action Input: 工具的输入
Observation: 工具返回的结果
...（可以重复 Thought/Action/Observation 多次）
Thought: 我现在知道最终答案了
Final Answer: 最终答案

开始！

Question: {input}
Thought: {agent_scratchpad}""")

agent = create_react_agent(llm, tools, react_prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,         # 打印每一步的推理过程
    max_iterations=10,    # 防止无限循环
    handle_parsing_errors=True
)

result = agent_executor.invoke({"input": "今天比特币价格是多少？如果我去年买了 1 个，现在盈利多少（假设买入价 30000 美元）？"})
print(result["output"])
```

把 `verbose=True` 打开，可以看到 Agent 完整的推理链：

```text
> Entering new AgentExecutor chain...
Thought: 需要先查询比特币最新价格
Action: search
Action Input: bitcoin price today USD
Observation: Bitcoin (BTC) price today is $67,234.12...
Thought: 知道了价格，现在计算盈亏
Action: calculator
Action Input: 67234.12 - 30000
Observation: 37234.12
Thought: 计算完成，可以给出答案
Final Answer: 今日比特币价格约 $67,234。如果去年以 $30,000 买入 1 BTC，当前盈利约 $37,234（涨幅约 124%）。
```

## 工具定义：用 @tool 装饰器

LangChain 提供了更简洁的工具定义方式，docstring 自动成为工具描述：

```python
from langchain.tools import tool
from typing import Optional
import requests

@tool
def get_weather(city: str, country_code: Optional[str] = "CN") -> str:
    """获取指定城市的当前天气。city: 城市名（中文或英文），country_code: 国家代码"""
    api_key = "your_api_key"
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city},{country_code}&appid={api_key}&units=metric&lang=zh_cn"

    response = requests.get(url, timeout=5)
    if response.status_code != 200:
        return f"无法获取 {city} 的天气"

    data = response.json()
    return (
        f"{city} 当前天气：{data['weather'][0]['description']}，"
        f"温度 {data['main']['temp']}°C，"
        f"体感 {data['main']['feels_like']}°C，"
        f"湿度 {data['main']['humidity']}%"
    )

print(get_weather.args_schema.schema())
```

## 记忆：让 Agent 记住对话历史

默认的 Agent 没有记忆，每次都是"从零开始"。加上对话历史：

```python
from langchain.memory import ConversationBufferWindowMemory

# 保留最近 10 轮对话
memory = ConversationBufferWindowMemory(
    k=10,
    memory_key="chat_history",
    return_messages=True
)

react_with_memory_prompt = PromptTemplate.from_template("""...
对话历史：
{chat_history}

Question: {input}
Thought: {agent_scratchpad}""")

agent_executor = AgentExecutor(
    agent=create_react_agent(llm, tools, react_with_memory_prompt),
    tools=tools,
    memory=memory,
    verbose=True
)
```

记忆类型的选择：

| 记忆类型 | 工作原理 | 适用场景 |
|---------|---------|---------|
| `ConversationBufferMemory` | 完整存储对话 | 短对话，简单场景 |
| `ConversationBufferWindowMemory` | 只保留最近 k 轮 | 控制 Token 消耗 |
| `ConversationSummaryMemory` | 用 LLM 压缩旧对话 | 长对话保留摘要 |
| `VectorStoreRetrieverMemory` | 向量检索相关历史 | 极长对话，精准召回 |

## LangGraph：构建复杂工作流

ReAct 适合简单的顺序任务，复杂场景（条件分支、并行执行、人工审批节点）需要 LangGraph：

```bash
pip install langgraph
```

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from typing import TypedDict, Annotated, Sequence
import operator

class AgentState(TypedDict):
    messages: Annotated[Sequence, operator.add]

def should_continue(state: AgentState) -> str:
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END

def call_model(state: AgentState):
    from langchain_openai import ChatOpenAI
    model = ChatOpenAI(model="gpt-4o").bind_tools(tools)
    response = model.invoke(state["messages"])
    return {"messages": [response]}

workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", ToolNode(tools))
workflow.set_entry_point("agent")

workflow.add_conditional_edges(
    "agent",
    should_continue,
    {"tools": "tools", END: END}
)
workflow.add_edge("tools", "agent")

app = workflow.compile()

from langchain_core.messages import HumanMessage
result = app.invoke({
    "messages": [HumanMessage(content="北京今天天气怎么样？")]
})
print(result["messages"][-1].content)
```

## 多 Agent：让专家各司其职

单个 Agent 啥都干会导致效果下降。更好的做法是拆分角色：

```python
# 研究 Agent：负责搜索和收集信息
def research_agent(state):
    llm = ChatOpenAI(model="gpt-4o").bind_tools([search_tool])
    # 系统 prompt 只说"你是研究员，专注收集信息"
    ...

# 写作 Agent：负责整理和撰写
def writing_agent(state):
    llm = ChatOpenAI(model="gpt-4o")
    # 系统 prompt 只说"你是写作者，根据研究内容写作"
    ...

# Supervisor：决定任务分配
def supervisor(state):
    # 根据当前状态决定下一步交给哪个 Agent
    ...

multi_agent_graph = StateGraph(...)
multi_agent_graph.add_node("supervisor", supervisor)
multi_agent_graph.add_node("researcher", research_agent)
multi_agent_graph.add_node("writer", writing_agent)

multi_agent_graph.add_conditional_edges(
    "supervisor",
    lambda state: state["next_agent"],
    {"researcher": "researcher", "writer": "writer", "FINISH": END}
)
```

## 人工介入：Human-in-the-Loop

Agent 执行高风险操作前，暂停等待人工确认：

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()
app = workflow.compile(
    checkpointer=checkpointer,
    interrupt_before=["tools"]   # 每次工具调用前暂停
)

config = {"configurable": {"thread_id": "task-001"}}

result = app.invoke(
    {"messages": [HumanMessage(content="删除 user_id=123 的所有数据")]},
    config=config
)

# Agent 已暂停，查看它想做什么，人工审核后继续
print("Agent 想执行：", result)
final_result = app.invoke(None, config=config)  # 传 None 继续
```

## 常见问题

**Agent 陷入循环怎么办？**

```python
AgentExecutor(
    agent=agent,
    tools=tools,
    max_iterations=15,
    max_execution_time=60,  # 秒
    early_stopping_method="generate"
)
```

**工具调用失败后 Agent 如何恢复？**

在工具函数中返回清晰的错误信息（而非抛出异常），让 Agent 能理解出了什么问题并尝试其他方式：

```python
@tool
def query_database(sql: str) -> str:
    """执行 SQL 查询"""
    try:
        result = db.execute(sql)
        return str(result)
    except Exception as e:
        return f"查询失败：{type(e).__name__}: {e}。请检查 SQL 语法或表名是否正确。"
```

## 总结

Agent 工程的难点不在于让模型"更聪明"，而在于：

1. **工具设计**：工具描述写得清不清晰，直接影响模型选择用哪个工具
2. **循环控制**：防止 Agent 跑偏，设好终止条件和最大步骤
3. **错误恢复**：工具失败时给出可机读的错误信息
4. **状态管理**：对话历史、任务状态怎么存，多轮任务怎么持久化

框架（LangChain/LangGraph）只是脚手架，真正决定 Agent 好不好用的是任务拆解粒度和工具质量。
