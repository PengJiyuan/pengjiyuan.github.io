---
title: "Agentic RAG 实战：让检索拥有「规划能力」的 2026 进阶指南"
date: 2026-03-24
tags:
  - "Agentic RAG"
  - "RAG"
  - "AI Agent"
  - "检索增强"
  - "多步推理"
  - "知识库"
description: "传统 RAG 只能「检索-生成」一步到位，面对复杂多步查询时力不从心。Agentic RAG 将规划、反思、工具调用引入检索流程，让 AI 像专业研究员一样自主设计检索策略、迭代修正结果。本文深入解析 Agentic RAG 的架构核心、记忆分层、与传统 RAG 的本质区别，以及 LangGraph/LlamaIndex 的实战实现。"
cover:
  image: "/articles/agentic-rag-2026-cover.png"
  alt: "Agentic RAG 实战"
  caption: "由 Tiny Stable Diffusion 生成"
showToc: true
TocOpen: true
difficulty: "advanced"
---

2026 年，你向知识库 AI 提问：

>「过去半年里，A 类客户的平均客单价有什么变化？并对比一下这和竞争对手最近发布的产品线调整有没有关联。」

传统 RAG 会怎么做？它会把这句话向量化，在向量数据库里做相似度搜索，返回最相关的文档片段，然后让模型生成答案。

结果：检索不到「竞品产品线调整」这类外部动态信息，返回的只是你公司内部的历史数据，模型只能给出一个不完整的回答。

**Agentic RAG 的做法完全不同**：它理解这是一个需要多步研究的问题——先查客户数据，再查竞品动态，最后做关联分析。它会自己决定调用哪些工具、如何迭代、什么时候停止检索。

这就是本文要讲的核心：**RAG 的下一次进化，不是更好的检索，而是让检索拥有规划能力。**

---

## 一、为什么传统 RAG 遇到瓶颈

### 1.1 线性管线的局限

传统 RAG 的工作流程本质上是线性的：

```
用户查询 → 向量检索（一次） → 上下文拼接 → LLM 生成
```

这套架构在简单问答场景（"这个文档讲了什么？"）下工作得很好。但现实世界的查询往往更复杂：

**多跳问题**：需要跨越多个知识库节点才能回答（"X 公司的技术架构和 Y 公司有什么异同？"）

**动态信息需求**：问题需要外部实时数据（RAG 索引里没有的信息），传统 RAG 根本不知道自己去查 API

**模糊意图**：用户的问题是"看看这个季度的情况"，Agentic RAG 能拆解为时间范围限定 + 指标查询 + 趋势分析，而传统 RAG 只是找最「相似」的文本

**检索结果质量不稳定**：如果首次检索没有找到相关内容，线性 RAG 会拿着错误的上下文硬生成（幻觉风险），而 Agentic RAG 会识别出「信息不足」，主动进行二次或多次检索

### 1.2 学术界的判断

arXiv 2026 年发表的系统论文（SoK: Agentic RAG）指出：传统 RAG 将上下文视为「动态但短暂」的——每次独立查询都是从零重建世界观。这种假设让 Agent 失去了**身份连续性和历史感知**。

换句话说，传统 RAG 没有「记忆」，只有「检索」。

---

## 二、Agentic RAG 的核心架构

### 2.1 与传统 RAG 的本质区别

| 维度 | 传统 RAG | Agentic RAG |
|------|----------|-------------|
| 检索触发 | 一次查询，一次检索 | Agent 决定是否检索、何时检索、检索什么 |
| 工具能力 | 仅向量检索 | 检索工具 + API 工具 + 计算工具 + 文件工具 |
| 查询理解 | 一次性 embedding | 自主分解任务为子问题 |
| 结果验证 | 无验证环节 | 反思机制，检查答案是否足够好 |
| 上下文处理 | 全部塞入 context | 动态上下文修剪 + 选择性注入 |
| 记忆 | 无状态，每次重建 | 分层记忆系统（短/长/情景） |
| 透明度 | 黑盒检索 | Agent 展示推理轨迹 |

### 2.2 核心循环：ReAct + 检索

Agentic RAG 的基础运行模式是 **ReAct（Reason + Act）循环**：

```
用户问题
    ↓
Agent 分析问题 → 决定是否需要检索
    ↓（是）
调用检索工具 → 获取初步结果
    ↓
Agent 评估结果质量 → 结果是否足够？
    ↓（否）
反思原因 → 调整检索策略（换关键词/扩大范围/查不同数据源）
    ↓
再次检索 → 迭代直到质量达标或达到最大轮次
    ↓
生成最终答案
```

这个循环让 Agentic RAG 天然适合复杂查询。GAIA 基准测试（General AI Assistant Benchmark）专门设计了多步推理任务——正是在测试 Agent 的这种自主迭代能力。

### 2.3 三大技术支柱

**（1）规划（Planning）**

Agent 在开始检索前，先把用户问题拆解成子任务序列。例如：

- 用户：「为什么我们 Q3 的客户流失率上升了？」
- Agent 拆解为：
  - 子任务 1：查询 Q3 流失率具体数据
  - 子任务 2：查询 Q2 及历史同期数据（做对比）
  - 子任务 3：查询 Q3 期间发生的关键事件（产品更新、竞对动作、用户反馈）
  - 子任务 4：关联分析，生成结论

**（2）记忆分层（Memory Architecture）**

Agentic RAG 的记忆分为三层：

| 层级 | 类比 | 作用 | 技术实现 |
|------|------|------|----------|
| 工作记忆 | RAM | 当前会话的上下文、检索结果、中间结论 | Context window + 动态修剪 |
| 情景记忆 | 情景记忆 | 过去类似问题的检索轨迹和答案模式 | 向量存储，跨会话 |
| 长期记忆 | 知识图谱 | 结构化的领域知识、公司Facts | 知识图谱/结构化数据库 |

长期记忆层的引入是 Agentic RAG 和传统 RAG 最大的工程差异。当用户再次问类似问题时，Agent 先查长期记忆——这条路已经走过了吗？上次的结果是什么？有没有需要更新的节点？

**（3）工具编排（Tool Orchestration）**

Agentic RAG 的 Agent 不只调用向量检索工具，还可以：

- 调用 Web Search API（查竞品信息、新闻）
- 调用 SQL 查询（直接查数据库里的结构化数据）
- 调用计算工具（做百分比计算、趋势分析）
- 调用文件工具（读取 PDF、Excel 等非结构化附件）

这意味着 Agentic RAG 可以构建一个**混合检索引擎**：向量数据库解决语义匹配，结构化 SQL 解决精确数据查询，Web 搜索解决外部动态信息。

---

## 三、实战实现：用 LangGraph 构建 Agentic RAG

### 3.1 架构概览

```
用户输入
    ↓
[stategraph]
    ↓
Router（判断：检索？计算？直接回答？）
    ↓
Retriever Agent（检索子图）
    ↓
Grader（评估检索质量）
    ↓
│ 质量差 → 重新检索（调整策略）
│ 质量好 → 继续
    ↓
Generator（综合所有上下文，生成答案）
    ↓
答案 + 引用来源
```

### 3.2 核心代码实现

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel
from typing import TypedDict, List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.documents import Document

# 定义 Agent 状态
class AgentState(TypedDict):
    question: str
    plan: List[str]           # 分解后的子任务
    current_task: str         # 当前处理的任务
    documents: List[Document] # 已检索到的文档
    answer: str               # 最终答案
    iterations: int           # 迭代轮次

# 检索工具
@tool
def retrieve(query: str) -> List[Document]:
    """从向量数据库检索相关文档"""
    return vector_store.similarity_search(query, k=5)

@tool
def web_search(query: str) -> str:
    """搜索外部网络（用于动态信息）"""
    return search_api.run(query)

# 规划节点：分解问题
def planner_node(state: AgentState) -> AgentState:
    llm = ChatOpenAI(model="gpt-4o")
    question = state["question"]
    
    # LLM 自主分解任务
    plan = llm.bind_tools([retrieve, web_search]).invoke(
        f"将以下问题分解为检索步骤：{question}"
    )
    
    return {**state, "plan": plan}

# 检索质量评估节点
def grade_node(state: AgentState) -> AgentState:
    """判断检索结果是否足够回答问题"""
    llm = ChatOpenAI(model="gpt-4o")
    
    context = "\n".join([doc.page_content for doc in state["documents"]])
    question = state["question"]
    
    grade_prompt = f"""
    问题：{question}
    检索到的上下文：{context}
    
    这个上下文是否足够完整地回答问题？回答 YES 或 NO，并说明理由。
    """
    
    response = llm.invoke(grade_prompt)
    
    if response.content.startswith("YES"):
        return {**state, "quality": "adequate"}
    else:
        # 提取改进建议，重新检索
        return {**state, "quality": "inadequate", "iterations": state.get("iterations", 0) + 1}

# 生成答案节点
def generate_node(state: AgentState) -> AgentState:
    llm = ChatOpenAI(model="gpt-4o")
    
    context = "\n".join([doc.page_content for doc in state["documents"]])
    
    answer = llm.invoke(
        f"基于以下上下文回答问题。\n\n上下文：{context}\n\n问题：{state['question']}"
    )
    
    return {**state, "answer": answer.content}

# 构建图
graph = StateGraph(AgentState)

graph.add_node("planner", planner_node)
graph.add_node("retrieve", ToolNode([retrieve, web_search]))
graph.add_node("grade", grade_node)
graph.add_node("generate", generate_node)

# 边
graph.set_entry_point("planner")
graph.add_edge("planner", "retrieve")
graph.add_edge("retrieve", "grade")

# 条件边：质量不足则重新检索（最多3次）
def should_retry(state: AgentState) -> str:
    if state.get("quality") == "adequate":
        return "generate"
    elif state.get("iterations", 0) >= 3:
        return "generate"  # 达到上限，强制生成
    else:
        return "retrieve" # 重新检索

graph.add_conditional_edges("grade", should_retry)
graph.add_edge("generate", END)

app = graph.compile()
```

### 3.3 关键设计：动态上下文修剪

当检索结果积累多轮后，Context Window 可能溢出。Agentic RAG 需要主动修剪：

```python
def context_pruner(state: AgentState, max_tokens: int = 120000) -> AgentState:
    """动态修剪上下文，保留最相关的内容"""
    current_tokens = estimate_tokens(state["documents"])
    
    if current_tokens <= max_tokens:
        return state
    
    # 按相关度重新排序，裁剪低相关度文档
    scored = []
    for doc in state["documents"]:
        score = embedding_similarity(state["question"], doc.page_content)
        scored.append((score, doc))
    
    scored.sort(reverse=True)
    
    kept = []
    token_count = 0
    for score, doc in scored:
        doc_tokens = estimate_tokens(doc.page_content)
        if token_count + doc_tokens <= max_tokens:
            kept.append(doc)
            token_count += doc_tokens
    
    return {**state, "documents": kept}
```

---

## 四、企业级 Agentic RAG 的额外考量

### 4.1 安全与访问控制

在企业场景里，RAG 检索必须遵循数据权限。Agentic RAG 引入**文档级 ACL（访问控制列表）**：

```python
def filtered_retrieve(query: str, user_roles: List[str]) -> List[Document]:
    """按用户角色过滤后才返回文档"""
    candidates = vector_store.similarity_search(query, k=20)
    
    filtered = []
    for doc in candidates:
        acl = doc.metadata.get("acl", {})  # 文档元数据携带权限信息
        if any(role in acl.get("allowed_roles", []) for role in user_roles):
            filtered.append(doc)
    
    return filtered[:5]
```

### 4.2 检索质量评估：Golden Set 方法

建立 200 条「黄金问题集」，每条包含：
- 标准问题文本
- 期望引用的文档
- 期望答案的要点

每次修改 Agentic RAG 流程时，跑一遍 Golden Set，计算**引用准确率（Citation Accuracy）**和**答案完整率**，防止破坏性变更。

### 4.3 监控与可观测性

Agentic RAG 的可观测性维度比传统 RAG 多很多：

| 指标 | 含义 |
|------|------|
| 平均检索轮次 | 反映问题的复杂度和检索效率 |
| 工具调用分布 | 哪些工具被调用最频繁 |
| 拒绝回答率 | Agent 判定信息不足而无法回答的比例 |
| 幻觉引用率 | Agent 引用的文档中不包含答案内容的比例 |
| P95 延迟 | 从提问到返回答案的 P95 响应时间 |

---

## 五、与相关技术的互补关系

**Agentic RAG vs. RAG Intro**

RAG Intro 讲的是基础 RAG 架构（索引 + 查询）。Agentic RAG 不是替代它，而是**在它基础上加了一层 Agent 编排层**。两者是递进关系。

**Agentic RAG vs. Agent Memory**

Agent Memory 讲的是如何在 Agent 层面维护记忆。Agentic RAG 的记忆系统（短/长/情景）是 Agent Memory 思想在 RAG 场景的具体实现——你可以把 Agentic RAG 理解为「把记忆能力融入检索流程」。

**Agentic RAG vs. Multi-Agent Systems**

在 Multi-Agent 架构里，一个专门负责检索的 Agent 本质上就是一个 Agentic RAG 节点。它接收问题，返回带引用的答案——是 Multi-Agent 系统中的信息提供者角色。

---

## 六、什么时候该用 Agentic RAG

**适合的场景：**

- 需要回答需要多步推理的复杂问题
- 知识库数据来源多样化（向量库 + SQL + Web）
- 需要对外引用来源（金融、法律、医疗等合规场景）
- 用户问题模糊，需要 Agent 主动澄清或迭代检索

**传统 RAG 更合适的场景：**

- 简单的事实型问答（"这个文档的摘要是什么？"）
- 数据量不大，查询模式简单
- 对延迟敏感（Agentic RAG 的多轮迭代会增加延迟）

---

## 总结

Agentic RAG 是 RAG 范式在 Agent 时代的自然演进。它解决的核心问题是：**让检索从一次性的「找文本」，变成主动的「做研究」**。

实现路径上，有三个关键决策点：

1. **选框架**：LangGraph（灵活，支持复杂条件分支）vs. LlamaIndex Agent（更抽象，适合快速搭建）
2. **建评估集**：Golden Set 是保障质量不下滑的基础设施
3. **设计记忆层**：短期+长期记忆的分层设计决定了 Agent 能否在真实任务中持续进化

从工程角度，90 天可以完成第一个生产级 Agentic RAG 流水线：前 45 天搭检索和评估基础设施，后 45 天加 Agent 编排和监控。关键是从一个小而具体的用例开始，而不是一开始就追求大而全。
