---
title: "Model Merging：如何把多个专家模型合并成一个？"
date: 2026-04-02
tags:
  - "Model Merging"
  - "模型融合"
  - "LLM"
  - "参数空间"
  - "TIES"
  - "DARE"
description: "Model Merging 通过直接对多个微调模型的权重参数做算术运算，将专家模型合并为一个多任务统一模型。不同于模型集成，合并后得到的是单个模型，推理零额外开销。本文深入解析 Task Vector、TIES-Merging、DARE 等核心方法，以及 ICLR 2026 最新研究进展。"
cover:
  image: "/articles/model-merging-2026-cover.png"
  alt: "Model Merging 示意图"
  caption: "由 Tiny Stable Diffusion 生成"
showToc: true
TocOpen: true
difficulty: "advanced"
---

2026 年，训练一个专属 LLM 的成本已经大幅下降。一个 7B 参数的模型，在单卡 A100 上微调几个小时就能完成。

于是新的问题来了：针对不同任务微调的模型，能不能合并成一个？

比如你有一个擅长数学推理的版本、一个擅长代码生成的版本、还有一个擅长中文对话的版本——能不能不做三次推理（ ensemble ），而是把三个模型"合并"成单个模型，零额外推理开销？

这就是 **Model Merging** 要做的事。

## 一、为什么需要 Model Merging

传统方式下，有几种"组合"模型能力的方法：

| 方法 | 怎么做 | 推理开销 | 训练成本 |
|------|--------|----------|----------|
| **模型集成（Ensemble）** | 同时运行多个模型，投票或加权 | N 倍（每个模型都要跑一遍） | 各自独立训练 |
| **多任务学习（Multi-task Learning）** | 所有任务数据混合训练一个模型 | 1× | 高，需要同时访问所有任务数据 |
| **模型合并（Model Merging）** | 直接在权重空间做算术运算 | **1×** | 低，复用已有的微调权重 |

Model Merging 的核心优势：**不需要重新训练，不需要访问原始数据，只需对权重做算术操作**，就能把多个专家模型合并成一个。

这意味着：
- 合并可以在 **CPU 或 8GB 显存的 GPU** 上完成，整个过程只需几分钟
- 合并后得到的是**单个模型**，部署和推理没有任何额外开销
- 数据不需要共享，解决了某些任务数据无法混合训练的场景

## 二、Task Vector：最基础的方法

Task Vector（任务向量）是 Model Merging 最基础的范式，由 ILERA 研究组在 2024 年提出。

### 核心思想

给定一个**基础模型** θ_base 和一个**任务微调模型** θ_ft，我们可以定义任务向量：

Δ = θ_ft − θ_base

这个 Δ 就是这次微调带来的权重更新方向——相当于"往这个方向走，就能获得这个任务的能力"。

合并多个任务的向量，只需把它们加起来：

θ_merge = θ_base + Σ λᵢ Δᵢ

其中 λᵢ 是每个任务的缩放系数。

### 一个具体例子

```python
import torch

def task_vector(base_model, finetuned_model, scale=1.0):
    """计算任务向量"""
    return (finetuned_model - base_model) * scale

def merge_task_vectors(base_model, task_vectors):
    """将多个任务向量合并到基础模型"""
    merged = {k: v.clone() for k, v in base_model.items()}
    for delta in task_vectors:
        for k in merged:
            merged[k] += delta[k]
    return merged

# 例子：合并数学和代码两个专家
math_delta = task_vector(base, math_model, scale=0.7)
code_delta = task_vector(base, code_model, scale=0.5)
merged_weights = merge_task_vectors(base.state_dict(), [math_delta, code_delta])
```

### Task Vector 的问题

简单相加在任务相似时效果不错（比如多个语言变体），但当任务差异很大时会出现**参数干扰（ interference ）**：两个任务对同一个权重参数要求的方向相反，简单相加会相互抵消，导致两边都退化。

## 三、TIES-Merging：解决参数干扰

TIES-Merging（Trim-Elect-Sign）由 Google Research 提出，是目前最广泛使用的合并方法，核心思路是三步走：**裁剪、选举、重合**。

### 三步流程

**Step 1: Trim（裁剪）**

保留每个任务向量中 magnitude（绝对值）最大的 top K% 参数，其余设为 0。

```python
def trim(delta, keep_ratio=0.2):
    """只保留 top K% 的参数"""
    flat = delta.flatten()
    threshold = torch.kthvalue(
        flat, int(len(flat) * (1 - keep_ratio))
    ).values
    mask = delta.abs() >= threshold.abs()
    return delta * mask
```

**Step 2: Elect Sign（选举）**

对于每个权重参数，统计所有任务向量的符号：
- 如果所有非零参数符号一致 → 保留
- 如果有冲突 → 只保留与**多数符号一致**的参数，其余设为 0

```python
def elect_sign(deltas):
    """符号选举，解决方向冲突"""
    stacked = torch.stack(deltas, dim=0)  # [num_tasks, ...]
    signs = torch.sign(torch.sum(stacked, dim=0))  # 多数符号
    result = []
    for delta in deltas:
        aligned = delta * (signs != 0)  # 保留与多数一致的
        result.append(aligned * (aligned * signs >= 0))  # mask 冲突的
    return result
```

**Step 3: Disjoint Merge（不交并合并）**

对剩余的参数做加权平均，然后用 1/(1-p) 重缩放（p 为裁剪比例）。

```python
def disjoint_merge(base, deltas, scales):
    """不交并合并"""
    merged = base.clone()
    for delta, scale in zip(deltas, scales):
        merged += delta * scale
    return merged
```

### TIES 的效果

在异构任务（数学 vs 对话 vs 代码）上，TIES-Merging 比简单 Task Vector 提升了 **10-20%**。但需要注意：裁剪率设置过高（>30%）可能在差异大的任务上丢失过多关键参数。

## 四、DARE：激进裁剪的新思路

DARE（Drop-And-REscale）来自斯坦福，提出一个更激进的观点：**大多数任务向量参数其实是可以丢掉的，重缩放后几乎不影响效果。**

### 核心机制

DARE 以很高的概率 p（常设 0.5-0.99）随机丢弃任务向量的参数，然后通过 1/(1-p) 的重缩放来补偿整体 magnitude：

```python
def dare_drop(delta, drop_prob=0.9):
    """DARE：丢弃 + 重缩放"""
    mask = (torch.rand_like(delta) > drop_prob).float()
    dropped = delta * mask
    rescaled = dropped / (1 - drop_prob)
    return rescaled
```

实验发现，即使丢弃 90-99% 的参数，合并后的模型在大多数任务上性能下降不到 2%。这说明**任务向量具有极高的稀疏性**——真正"有用"的权重更新只集中在少数参数上。

### DARE + TIES 的组合

实践中，DARE 通常作为 TIES-Merging 的前置步骤：

```python
def dare_then_ties(base, finetuned_models, drop_prob=0.9, keep_ratio=0.2):
    deltas = [ft - base for ft in finetuned_models]

    # Step 1: DARE 激进裁剪
    deltas = [dare_drop(d, drop_prob) for d in deltas]

    # Step 2: TIES 符号对齐
    deltas = elect_sign(deltas)

    # Step 3: 不交并合并
    scales = [1.0 / (1 - drop_prob)] * len(deltas)
    return disjoint_merge(base, deltas, scales)
```

## 五、ICLR 2026 最新进展

2026 年 ICLR 上有多篇 Model Merging 相关论文，几个值得关注的方向：

### 5.1 DRIFT-MEDIAN：Fisher 加权的 Median 合并

传统 TIES 对所有参数一视同仁，DRIFT-MEDIAN 提出用 **Fisher Information** 来加权：参数对任务越敏感（Fisher 越大），合并时越应该保护它不被破坏。

```python
# Fisher Information 加权 Median
# 对每个参数，选择使 Σ Fᵢ|θ - Δᵢ| 最小的 θ
# 其中 Fᵢ 是该参数的 Fisher 信息
```

实验显示，在混合任务（math + code + chat + safety）上，DRIFT-MEDIAN 比 TIES 稳定性更好，遗忘率更低。

### 5.2 Reversible Model Merging：可"还原"的合并

传统的合并是不可逆的——一旦合并，就无法还原出原来的专家模型。RMM（Reversible Model Merging）提出一种低秩基础分解方法：

1. 将所有 LoRA adapter 堆叠成矩阵，做 SVD 分解得到低秩基
2. 每个专家模型只需要存储一个系数向量
3. 合并后的"核心模型"是基的均值，但可以**按需重建**任意专家

这解决了"合并后还想单独用某个专家"的现实需求。

### 5.3 FlexMerge：精度-大小的灵活权衡

FlexMerge 提出了一个很实际的问题：**合并后的模型大小是否也可以控制？**

答案是可以的。FlexMerge 将合并后的大小作为可调预算：
- 用一部分预算存一个"核心合并模型"（全尺寸）
- 用剩余预算存各个专家的**稀疏残差**（按需注入）

这样可以在推理时选择：用小模型快速推理，还是加载残差做高精度推理。

### 5.4 Expert Merging++：层间系数学习

之前的方法对每一层都用相同的策略合并。Expert Merging++ 提出可以从**少量校准数据**中学习每层独立的合并系数：

```python
# 优化目标：最小化合并模型与各专家隐藏状态的差异
loss = α_l × L2(hidden_states_merge, hidden_states_expert_l)
       + KL(logits_merge, logits_expert)
# α_l 是每层的可学习系数向量
```

只需几千个无标签 token 做校准，就能找到比手工设定更好的层间合并权重。

## 六、实战：使用 MergeKit 合并模型

[MergeKit](https://github.com/arcee-ai/mergekit) 是目前最成熟的 Model Merging 工具，支持 Task Vector、TIES、DARE、Fisher 合并等多种方法。

### 安装

```bash
pip install mergekit
```

### YAML 配置

```yaml
# merge.yaml
models:
  - model: meta-llama/Llama-3-8B-Instruct
    parameters:
      weight: 1.0
  - model: meta-llama/Llama-3-8B-Code
    parameters:
      weight: 0.7
  - model: meta-llama/Llama-3-8B-Math
    parameters:
      weight: 0.5

merge_method: ties
base_model: meta-llama/Llama-3-8B

ties:
  trim_weight: 0.2
  rescale_weights: true
```

```bash
mergekit merge merge.yaml merged-model/ --output trust_remote_code=True
```

### MergeKit 支持的方法一览

| 方法 | 命令参数 | 适用场景 |
|------|----------|----------|
| Task Arithmetic | `--merge_method task_arithmetic` | 任务相似，参数方向一致 |
| TIES-Merging | `--merge_method ties` | 任务有差异，需要处理冲突 |
| DARE | `--merge_method dare` + `--dare.prune 0.9` | 需要激进裁剪，节省存储 |
| Fisher Merging | `--merge_method fisher` | 有校准数据，关注遗忘 |
| Linear | `--merge_method linear` | 简单加权平均的基线 |
| Model Soup | `--merge_method soup` | 多版本同模型融合 |

## 七、常见陷阱与最佳实践

### ⚠️ 不要直接合并 LoRA adapter

LoRA 的低秩矩阵直接用 TIES 合并会**严重降级**，因为低秩结构与全精度权重冲突。正确做法：
- 使用专门的低秩合并方法（如 RMM）
- 或者将 LoRA 合并回基础权重后再做模型级合并

```python
# 正确的 LoRA 合并流程
from peft import PeftModel

# 先将 LoRA 权重合并回基础模型
model = PeftModel.from_pretrained(base, lora_path)
model = model.merge_and_unload()
# 然后再对合并后的模型做 Task Vector 合并
```

### ⚠️ 异构任务的裁剪率不要设太高

当你要合并的任务差异很大（如数学推理 vs 闲聊）时：
- TIES 裁剪率建议 **10-20%**，而不是默认的 20%
- 优先用 **DRIFT-MEDIAN** 而不是原生 TIES

### ⚠️ 合并后一定要做评估

合并不是无损操作。建议：
- 在合并前后对比各任务的**准确率变化**
- 重点检查是否出现**基础能力的退化**（比如合并后模型连基本指令都听不懂了）

```python
# 评估脚本框架
def evaluate_merge(original_models, merged_model, tasks):
    results = {}
    for task_name, eval_fn in tasks.items():
        original_scores = [evaluate(m, eval_fn) for m in original_models]
        merged_score = evaluate(merged_model, eval_fn)
        forgetting = merged_score - max(original_scores)
        results[task_name] = {
            "merged": merged_score,
            "forgetting": forgetting  # 负值说明退化了
        }
    return results
```

## 八、总结

Model Merging 是一个极具实用价值的方向，它将"训练"和"组合"解耦，用纯算术方式探索权重空间。

几个关键要点：

1. **Task Vector** 是基础，核心思想是权重差的算术运算
2. **TIES-Merging** 通过裁剪+符号对齐解决参数干扰，是当前最常用的方法
3. **DARE** 揭示了任务向量高度稀疏的本质，丢弃 90%+ 参数几乎无损
4. **ICLR 2026** 的新进展主要在 Fisher 加权、可逆合并和精度-大小权衡三个方向
5. **MergeKit** 提供了开箱即用的工程实现，CPU 即可运行
6. **不要直接合并 LoRA**，要先 merge_and_unload
7. 异构任务合并时，**评估遗忘率**是必做项

随着开源模型生态越来越丰富，Model Merging 正在成为每个 AI 工程师都需要掌握的基础技能——它让"训练成本"变成了"合并脚本"，真正做到了专家模型能力的即开即用。
