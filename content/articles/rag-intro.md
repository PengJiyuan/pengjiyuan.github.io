---
title: "RAG 系统从零构建：原理、实现与工程化"
date: 2026-02-20
weight: 1
tags:
  - "RAG"
  - "向量数据库"
  - "LangChain"
  - "LlamaIndex"
description: "RAG（检索增强生成）是当前构建知识库问答系统的主流方案。本文深入讲解 RAG 的核心原理、完整实现以及工程化要点。"
showToc: true
TocOpen: true
---

RAG（Retrieval-Augmented Generation，检索增强生成）解决的是一个很实际的问题：大模型的知识有训练截止日期，不知道你公司内部的文档，也可能"一本正经地胡说"。

RAG 的思路很直接——在生成答案之前，先从外部知识库检索相关内容，把它作为上下文一起喂给模型，让模型基于真实资料回答。

## 核心架构

RAG 分两个阶段：**索引（Indexing）** 和 **查询（Querying）**。

```
索引阶段（离线）：
  文档 → 分块 → 向量化 → 存入向量数据库

查询阶段（在线）：
  用户问题 → 向量化 → 相似度检索 → 拼装 Prompt → LLM 生成答案
```

## 动手实现一个最简 RAG

依赖安装：

```bash
pip install langchain langchain-openai chromadb tiktoken
```

### 第一步：文档加载与分块

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

# 加载文档
loader = PyPDFLoader("company_docs.pdf")
documents = loader.load()

# 分块：chunk_size 控制每块大小，overlap 避免上下文截断
splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=64,
    separators=["\n\n", "\n", "。", "！", "？", " "]
)
chunks = splitter.split_documents(documents)
print(f"共 {len(chunks)} 个文本块")
```

分块策略很关键。`chunk_size` 太大会引入噪音，太小会丢失上下文。对于中文文档，建议 `separators` 里加上中文标点。

### 第二步：向量化并存入数据库

```python
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 构建向量数据库（首次运行会调用 embedding API）
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"   # 本地持久化
)
```

Embedding 模型的选择会直接影响检索质量。本地使用可以考虑 `BAAI/bge-m3`（对中文支持更好）：

```python
from langchain_huggingface import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-m3",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True}
)
```

### 第三步：构建 RAG Chain

```python
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

llm = ChatOpenAI(model="gpt-4o", temperature=0)

prompt_template = """你是一个专业的知识库助手。请根据以下上下文信息回答用户问题。
如果上下文中没有相关信息，请如实说"我在知识库中没有找到相关内容"，不要编造答案。

上下文：
{context}

问题：{question}

回答："""

prompt = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",            # stuff: 直接拼接所有检索结果
    retriever=vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5}     # 返回最相关的 5 个块
    ),
    chain_type_kwargs={"prompt": prompt},
    return_source_documents=True   # 返回引用来源
)

# 查询
result = qa_chain.invoke({"query": "公司的年假政策是什么？"})
print(result["result"])

# 查看引用来源
for doc in result["source_documents"]:
    print(f"来源：{doc.metadata.get('source')} 第 {doc.metadata.get('page')} 页")
```

## 分块策略的选择

不同文档类型适合不同分块方式：

| 策略 | 适用场景 | 特点 |
|------|---------|------|
| 固定大小分块 | 通用文本 | 简单，上下文可能被截断 |
| 递归字符分块 | 结构化文本 | 尊重段落层级，推荐默认使用 |
| 语义分块 | 高质量场景 | 按语义相近度切分，效果好但慢 |
| 文档结构分块 | Markdown/HTML | 按标题层级切分，保留结构 |

语义分块示例（需要 `langchain-experimental`）：

```python
from langchain_experimental.text_splitter import SemanticChunker

semantic_splitter = SemanticChunker(
    embeddings=embeddings,
    breakpoint_threshold_type="percentile",
    breakpoint_threshold_amount=95
)
chunks = semantic_splitter.split_documents(documents)
```

## 检索方式：稠密、稀疏与混合

默认的 `similarity` 检索是**稠密检索**（基于向量余弦距离）。但它对关键词精确匹配效果差——比如搜"GPT-4o"，语义检索可能返回一堆笼统的 LLM 介绍。

**混合检索（Hybrid Search）** 结合 BM25（关键词匹配）和向量检索，通常效果更好：

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# BM25 稀疏检索
bm25_retriever = BM25Retriever.from_documents(chunks)
bm25_retriever.k = 5

# 向量稠密检索
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# 混合：各占 50% 权重
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.5, 0.5]
)
```

## 进阶：HyDE（假设性文档嵌入）

一个提升检索质量的技巧：先让 LLM 假设性地生成一个"理想答案"，再用这个答案去检索，而不是直接用用户问题检索。逻辑是，答案和文档库的语义更接近。

```python
from langchain.chains import HypotheticalDocumentEmbedder

hyde_embeddings = HypotheticalDocumentEmbedder.from_llm(
    llm=llm,
    base_embeddings=embeddings,
    custom_prompt=PromptTemplate(
        input_variables=["QUESTION"],
        template="请用一段话回答这个问题（只写回答，不要解释）：{QUESTION}"
    )
)

hyde_vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=hyde_embeddings
)
```

## RAG 质量评估

无论如何优化，都需要量化评估。推荐用 [RAGAS](https://github.com/exploreragi/ragas) 框架：

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_recall

# 准备评估数据集
eval_dataset = {
    "question": ["公司年假天数是多少？"],
    "answer": ["根据知识库，公司年假为15天。"],
    "contexts": [["员工入职满一年后享有15天带薪年假..."]],
    "ground_truth": ["15天"]
}

result = evaluate(
    dataset=eval_dataset,
    metrics=[faithfulness, answer_relevancy, context_recall]
)
print(result)
# {'faithfulness': 0.97, 'answer_relevancy': 0.89, 'context_recall': 0.92}
```

三个核心指标：
- **Faithfulness（忠实度）**：答案是否基于检索内容，不编造
- **Answer Relevancy（相关性）**：答案是否回答了问题
- **Context Recall（上下文召回）**：检索到的内容是否包含正确答案

## 常见问题与调优

**问题1：检索到的内容不相关**

- 检查 `chunk_size` 是否合理，太大会稀释语义
- 换更好的 Embedding 模型（`bge-m3` 中文效果优于 OpenAI）
- 尝试混合检索

**问题2：模型忽略检索内容，仍然编造**

- 在 Prompt 中明确要求"只根据提供的上下文回答"
- 降低 `temperature` 到 0
- 检索块数量可适当减少（k=3 比 k=10 有时更准确）

**问题3：上下文窗口超限**

- 使用 `map_reduce` 或 `refine` 而非 `stuff` 的 chain_type
- 对检索结果做 ReRank（重排），只取最高分的 2-3 个

## 向量数据库选型

| 数据库 | 部署方式 | 适用规模 | 特点 |
|--------|---------|---------|------|
| Chroma | 本地 | 小规模 | 零配置，原型首选 |
| Qdrant | 本地/云 | 中大规模 | 高性能，支持过滤 |
| Milvus | 本地/云 | 大规模 | 功能最全，运维复杂 |
| Pinecone | 云服务 | 任意 | 免运维，有费用 |

生产环境推荐 Qdrant，性能好，支持 payload 过滤（可以按文档来源、时间等过滤检索结果）：

```python
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

vectorstore = QdrantVectorStore(
    client=client,
    collection_name="knowledge_base",
    embedding=embeddings,
)

# 带过滤的检索：只在某个部门的文档中检索
from qdrant_client.models import Filter, FieldCondition, MatchValue

results = vectorstore.similarity_search_with_score(
    query="年假政策",
    k=5,
    filter=Filter(
        must=[FieldCondition(key="department", match=MatchValue(value="HR"))]
    )
)
```

## 总结

一个 RAG 系统的质量上限，往往不在模型，而在数据的清洗质量和检索策略。从工程实践来看，优先要做的几件事：

1. 清洗原始文档，去除无关噪声（页眉页脚、表格格式等）
2. 选合适的 Embedding 模型，中文场景别直接用 `text-embedding-ada-002`
3. 加 Rerank 模型过滤低质量检索结果（`BAAI/bge-reranker-v2-m3`）
4. 评估驱动优化，用 RAGAS 建立基线后再改

RAG 是一个工程问题，而不是一个模型问题。
