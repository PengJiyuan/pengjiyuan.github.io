---
title: "AI Agent 的确定性工程：当 LLM 遇见可靠性要求"
date: 2026-04-08
tags:
  - "Agent"
  - "确定性"
  - "LLM"
  - "系统工程"
  - "可靠性"
  - "Prompt工程"
  - "Guardrails"
description: "LLM 天生是非确定性的，但生产环境的 AI Agent 必须可靠。2026 年，一套围绕「让 AI 行为可预测」的工程技术正在成熟——从 Prompt 约束、输出校验到状态机架构、多版本锚定。本文系统梳理 Agent 确定性工程的核心策略、主流工具与实战避坑指南。"
showToc: true
TocOpen: true
difficulty: "advanced"
---

LLM 有一个根本矛盾：它的输出是概率性的，同一个输入每次调用都可能得到不同的回答。而生产环境的 AI Agent 对可靠性有刚性要求——同样的操作不能这次成功下次失败，同一个查询不能这次给正确答案下次胡说八道。

这个矛盾在 2025 年之前还能靠「LLM 就是这样，将就用」来回避。但 2026 年，当企业把 AI Agent 部署到真正的业务流程里——审批合同、处理订单、生成代码——确定性就成了生死线。

**确定性工程**（Determinism Engineering）正在成为 AI Agent 领域的核心话题。它的目标很直接：给概率模型套上缰绳，让它在关键环节的行为可预测、可控制。

本文系统梳理 2026 年 Agent 确定性工程的完整技术栈，从 Prompt 层到系统层，从单 Agent 到多 Agent 协作。

---

## 一、为什么 LLM 的不确定性是一等公民问题

很多人把 LLM 的不确定性当作「特性」而非「问题」——creative writing 的时候有点随机性挺好。但当你把 LLM 放进一个每天处理 10 万次用户请求的系统里，「有时候对有时候错」不是创意，这是灾难。

举几个典型的不确定性灾难场景：

**函数调用参数漂移**。同一个意图，模型这次可能调用 `create_order`，下次可能调用 `submit_order`，参数格式也可能飘。两个不同供应商的 API 调用，参数名不一致，系统直接报错。

**Agent 行为分叉**。一个处理客服请求的 Agent，这次走了「先查库存再回复用户」的路径，下次同样的请求走了「直接回复已知信息」的路径。如果两条路径的后续逻辑不同，用户体验就不一致，严重时业务状态会出错。

**多 Agent 协作的指数级不确定性**。两个 Agent 协作，每个 Agent 有 3 种可能的行为路径，组合起来是 9 种可能。如果业务逻辑只覆盖了其中 2 种，另外 7 种就变成了未定义行为。

**越狱和 Prompt 注入的蝴蝶效应**。一个精心设计的恶意输入，让模型在某个环节跳过安全检查，后续整个 Agent 链的行为就完全失控。

不确定性不是小概率事件。在高并发场景下，任何非确定性都会成为必然事件——只要运行次数够多，所有可能的分叉都会被走到。

---

## 二、确定性工程的第一层：Prompt 约束

最基础的确定性工程从 Prompt 层开始。目标是：用结构化的指令边界，把模型的输出空间约束到可接受的范围。

### 2.1 输出格式约束

让模型只输出特定格式，是最简单也最有效的确定性手段。

```python
from pydantic import BaseModel, Field

class OrderStatusResponse(BaseModel):
    order_id: str = Field(description="订单号")
    status: Literal["pending", "processing", "shipped", "delivered", "cancelled"]
    estimated_delivery: str | None = Field(default=None, description="预计送达时间")
    actions: list[str] = Field(
        description="用户可执行的操作列表",
        default_factory=list
    )

# 结构化输出减少了理解偏差
response = model.with_structured_output(OrderStatusResponse)
result = response.invoke("帮我查下订单 ORD-2026-0412 的状态")
# result.order_id 永远是字符串
# result.status 永远是枚举中的五个值之一
```

这个模式叫 **Schema-Constrained Generation**。模型不再自由发挥，而是被严格限制在预定义的 schema 内。OpenAI、Anthropic、Google 的主流模型都支持这个能力。

### 2.2 少样本约束（Few-Shot Locking）

当输出格式本身不够（比如情感分类、意图识别这类开放判断），少样本示例能把模型锚定到具体的行为模式上。

```python
# 差的情况：只给描述，让模型自由理解
prompt = """
判断用户情感的极性：正面、负面、中性。
用户输入：我对这个功能有点失望。
"""

# 好的情况：给明确的示例覆盖边缘case
prompt = """
判断用户情感的极性：正面、负面、中性。

示例：
输入：「太棒了，完全符合预期」 → 正面
输入：「有点贵」 → 中性（不是负面，只是陈述价格）
输入：「这东西简直是垃圾，浪费我时间」 → 负面
输入：「我有点失望」 → 负面（「有点」表达了明确的负面情绪）

判断：
输入：「说实话，这个功能还算能用」 →
"""
```

少样本约束的本质是把判断标准显式化。模型看到足够多的示例后，会模仿示例的模式，而不是自由发挥。关键是把边界 case（neutral 不是 negative、有点失望是负面）显式写出来。

### 2.3 思维链约束（Chain-of-Thought Pinning）

推理模型（o1、o3、Claude 3.7 Sonnet 等）的思维链本身也是不确定性的来源——同一个问题，思维链可能不同，最终结论可能不同。

对于关键决策节点，有两个策略：

**强制思维链并校验中间结论**。不是让模型自己想，而是给出推理框架，让模型在框架内填空。

```python
DECISION_FRAMEWORK = """
对于每个候选方案，按以下维度打分（1-5分）：
1. 合规风险：是否可能违反公司政策或法律法规？
2. 用户价值：对用户的实际帮助有多大？
3. 执行成本：开发和维护成本有多高？
4. 可逆性：如果决策错误，恢复难度有多大？

最终决策规则：
- 如果任何维度得分≤2，必须选择风险最低的方案
- 如果合规风险=5（一票否决），直接拒绝
- 否则，选择总分最高的方案

按照上述框架分析并给出最终推荐。不要跳过任何维度。
"""
```

**思维链事后校验**。对于高风险决策，让模型先推理，再让第二个模型（或规则引擎）校验推理链的一致性。

---

## 三、确定性工程的第二层：输出校验与 Guardrails

Prompt 约束能覆盖 70% 的场景，但剩下 30% 需要运行时校验。这层的核心理念是：**不要相信，要验证**。

### 3.1 结构化输出的后验校验

即使模型支持结构化输出，每次调用后都应该校验输出的合法性。

```python
from pydantic import ValidationError

try:
    result = OrderStatusResponse.model_validate(model_output)
except ValidationError as e:
    # 结构化校验失败，降级处理
    logger.warning(f"LLM output validation failed: {e}, falling back to rule-based")
    return fallback_query(order_id)
```

这不是过度防御。模型在边缘输入下（比如超长文本、特殊字符、混合语言）的结构化输出失败率远高于正常情况。

### 3.2 语义校验（Semantic Guardrails）

结构校验只能检查格式，无法检查语义正确性。语义校验需要判断模型输出的「意思」是否与预期一致。

典型场景：用户问「今天能发货吗」，模型说「可以」，但实际上今天已经截单了。格式完全正确，但内容错了。

```python
from chevron import template

SEMANTIC_CHECK_PROMPT = template(
    """你是一个订单系统的事实核查员。
    
    订单信息：{{order_info}}
    用户问题：{{user_question}}
    LLM回答：{{llm_answer}}
    
    请判断 LLM 回答是否与订单信息一致。
    如果一致，返回 {"consistent": true}
    如果不一致，返回 {"consistent": false, "correct_answer": "正确的回答"}
    
    只返回 JSON，不要有其他内容。
    """,
    {
        "order_info": get_order_info(order_id),
        "user_question": user_input,
        "llm_answer": raw_llm_response
    }
)
```

这是一个 **LLM-as-Judge** 模式：用第二个 LLM 调用来校验第一个 LLM 的输出。成本翻倍，但关键路径的准确性也翻倍。

### 3.3 规则引擎兜底

对于高确定性的业务规则，永远不要依赖 LLM 判断——规则引擎是确定性兜底。

```python
# 永远不要让 LLM 决定这些
IMPOSSIBLE_RULES = {
    "discount_rate": lambda cart: 0.1 if cart.total > 1000 else 0,
    "shipping_cutoff": lambda: datetime.now().hour < 18,
    "blocked_users": lambda user_id: user_id in BLOCKED_LIST,
}

# LLM 只负责生成自然语言解释
explanation = llm.generate(f"解释为什么订单{order_id}适用此折扣")
```

规则引擎+LLM 解释的分工模式，是当前最实用的确定性架构：规则保证业务正确性，LLM 提升交互体验。

---

## 四、确定性工程的第三层：架构级约束

Prompt 和输出校验解决的是单次交互的确定性。但 Agent 的真正问题在于**行为轨迹的确定性**——从接收请求到完成任务，Agent 走过的那条路径必须可预期。

### 4.1 状态机架构：把 Agent 行为锁在预定义路径上

纯 LLM 驱动的 Agent 行为是自由形式的——模型想怎么走就怎么走。状态机架构是应对这一问题的最直接方式。

```python
from enum import Enum
from typing import Callable

class OrderAgentState(Enum):
    INITIAL = "initial"
    VALIDATING = "validating"
    INVENTORY_CHECK = "inventory_check"
    PAYMENT_PROCESSING = "payment_processing"
    FULFILLMENT = "fulfillment"
    CONFIRMATION = "confirmation"
    FAILED = "failed"

class StateMachineAgent:
    def __init__(self):
        self.state = OrderAgentState.INITIAL
        self.transitions: dict[OrderAgentState, list[OrderAgentState]] = {
            OrderAgentState.INITIAL: [OrderAgentState.VALIDATING],
            OrderAgentState.VALIDATING: [OrderAgentState.INVENTORY_CHECK, OrderAgentState.FAILED],
            OrderAgentState.INVENTORY_CHECK: [OrderAgentState.PAYMENT_PROCESSING, OrderAgentState.FAILED],
            OrderAgentState.PAYMENT_PROCESSING: [OrderAgentState.FULFILLMENT, OrderAgentState.FAILED],
            OrderAgentState.FULFILLMENT: [OrderAgentState.CONFIRMATION],
            OrderAgentState.CONFIRMATION: [],
            OrderAgentState.FAILED: [],
        }

    def transition(self, next_state: OrderAgentState) -> None:
        if next_state not in self.transitions[self.state]:
            raise AgentDeterminismViolationError(
                f"Invalid transition: {self.state} -> {next_state}"
            )
        self.state = next_state

    def process(self, order: Order) -> OrderResult:
        while self.state != OrderAgentState.CONFIRMATION and self.state != OrderAgentState.FAILED:
            self._execute_state(order)
        return self._generate_result(order)
```

这个状态机的关键约束：**Agent 只能按照预定义的路径走，任何偏离路径的尝试都会抛出异常**。LLM 仍然负责每个状态内的推理，但状态之间的流转由确定性逻辑控制。

### 4.2 确定性执行计划（Deterministic Execution Plan）

对于复杂的多步任务，让 LLM 在执行前先生成一个「执行计划」，这个计划经过校验后才执行。计划本身是确定性的字符串，执行时严格按计划走。

```python
PLANNING_PROMPT = """
你是一个订单处理 Agent。现在收到用户请求：「{user_request}」

请生成一个结构化的执行计划，格式如下：
1. [ACTION] <具体操作>
2. [DECISION] if <条件> then <路径A> else <路径B>
3. [CALL] <tool_name>(<参数>)
4. [RESPOND] <最终回复内容>

执行计划必须：
- 覆盖用户请求的所有分支
- 包含错误处理分支
- 每个 LLM 判断点都要有明确的决策规则

输出格式：纯文本执行计划，每行一个步骤。
"""

# LLM 生成计划
execution_plan = llm.invoke(PLANNING_PROMPT)

# 计划校验
validated_plan = plan_validator.validate(execution_plan)

# 确定性执行
result = plan_executor.execute(validated_plan)
```

这个模式的本质是**把 LLM 的「规划」和「执行」解耦**。规划阶段允许 LLM 自由推理（可以多次调用、可以反思），一旦计划被校验通过，执行阶段就是纯确定性的。

### 4.3 版本锚定（Version Pinning）

LLM 提供商会不断更新模型，同一个 Prompt 在新模型上可能得到不同结果。对于需要严格一致性的场景，可以在模型调用时锁定版本。

```python
# 不推荐：始终使用最新版
client = Anthropic()

# 推荐：锁定具体版本
client = Anthropic(
    model="claude-3-7-sonnet-20261111"  # YYYY-MM-DD 格式，锁定到具体日期的版本
)

# 更保守：同时锁定模型和推理参数
response = client.messages.create(
    model="claude-3-7-sonnet-20261111",
    temperature=0.0,  # 确定性输出必须 temperature=0
    top_p=1.0,        # 禁用 nucleus sampling
    # 不传 system 则每次行为完全一致
)
```

**temperature=0** 是最基础的确定性配置，但很多人忽略了 **top_p=1.0**。即使 temperature 为 0，top_p 的值也会影响采样的分布——top_p=0.9 意味着模型只会考虑累积概率前 90% 的 token，这会引入隐式随机性。

---

## 五、关键场景的确定性实战

### 5.1 函数/工具调用的确定性

Function Calling 最大的不确定性来源是「选错工具」和「参数错误」。解决思路是双层校验：

```python
# 第一层：严格的工具描述和参数 schema
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_order_status",
            "description": "查询订单状态。仅用于用户明确询问订单物流、发货状态时使用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "pattern": "^ORD-\\d{4}-\\d{4}$",  # 正则约束参数格式
                        "description": "订单号，格式必须为 ORD-YYYY-NNNN"
                    }
                },
                "required": ["order_id"]
            }
        }
    }
]

# 第二层：调用前用规则引擎校验参数合法性
def validate_tool_call(tool_name: str, arguments: dict) -> None:
    if tool_name == "get_order_status":
        if not re.match(r"^ORD-\d{4}-\d{4}$", arguments["order_id"]):
            raise InvalidParameterError(f"Invalid order_id format: {arguments['order_id']}")
        if arguments["order_id"] in CANCELLED_ORDERS:
            raise OrderCancelledError(f"Order {arguments['order_id']} has been cancelled")
```

### 5.2 多 Agent 协作的确定性

Multi-agent 系统的不确定性是单 Agent 的指数叠加。2026 年最有效的控制手段是 **Shared Schema + choreography over orchestration**：

```python
# 差的模式：Agent A 控制 Agent B 的行为（强耦合）
class AgentA:
    def delegate_to_b(self, task):
        response = agent_b.invoke(task)
        if "reject" in response:
            # Agent A 需要猜测 Agent B 的行为
            return self.handle_rejection(response)

# 好的模式：共享状态机，Agent 在预定义状态下自主行动
SHARED_STATE = {
    "current_phase": "order_validation",  # 所有 Agent 都读这个状态
    "validation_result": None,
    "approved_tools": ["get_order_status", "apply_discount"],  # 白名单
}

class OrderValidationAgent:
    def act(self, state: dict) -> dict:
        if state["current_phase"] != "order_validation":
            return {}  # 静默跳过，不是我该管的时候
        result = self.validate_order(state["order"])
        return {"validation_result": result}

class FulfillmentAgent:
    def act(self, state: dict) -> dict:
        if state["current_phase"] != "fulfillment":
            return {}  # 等待状态机推进到这里
        if not state["validation_result"]["approved"]:
            return {}  # 校验没通过，不执行
        return self.fulfill_order(state["order"])
```

每个 Agent 读共享状态，根据状态决定自己的行为，而不是被另一个 Agent 直接指挥。这样即使某个 Agent 行为异常，也不会破坏整体协作框架。

---

## 六、确定性工程的边界

确定性工程有明确的适用边界，不是所有问题都值得用工程手段消除不确定性。

**值得追求确定性的场景**：财务计算、法律合规、安全敏感操作、API 调用、医疗判断——这些场景的错误成本远高于额外工程投入的成本。

**不值得追求的场景**：创意写作、头脑风暴、情感陪伴、开放式问答——这些场景的「确定性」反而是体验的敌人。用户问「帮我写封情书」，每次输出都不一样才是对的。

2026 年的工程实践越来越倾向于**在架构层面区分这两种场景**：关键路径用确定性工程严防死守，探索路径给 LLM 足够的自由度。这种「确定性+探索性」的双轨架构，正在成为 AI Agent 系统设计的主流范式。

---

## 总结

确定性工程不是消除 LLM 的概率本质，而是承认这个本质，然后用工程手段把关键行为约束到可接受的确定范围内。

核心要点：

- **Prompt 约束**是成本最低的第一道防线——结构化输出、少样本锚定、思维链框架化
- **输出校验**是必要的运行时安全网——结构校验、语义校验、规则引擎兜底
- **架构约束**解决行为轨迹的不确定性——状态机、执行计划、版本锁定
- **多 Agent 协作**用共享状态机替代直接指挥，避免指数级不确定性叠加
- 确定性有边界：关键路径严防死守，探索路径保持自由

LLM 的概率性是它的优势，不是缺陷。确定性工程的目标是：**在需要确定性的地方消灭不确定性，在需要创造性的地方保留它**。
