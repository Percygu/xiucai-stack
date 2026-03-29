# Go Agent 进阶之路 — 内容规划

> 参照 Go 语言系列的体系化结构（前景 → 基础 → 进阶 → 原理 → 框架 → 面试），打造一套完整的 Go Agent 学习路径。
>
> 核心框架：Google ADK（Agent Development Kit）Go 版本
>
> 总计：**39篇 + 1篇导读**

---

## 学习路径

```
大模型基础 → Agent认知 → ADK入门 → ADK进阶 → RAG实战 → 项目实战 → 工程化 → 面试题
   ↑ 理论筑基          ↑ 框架掌握         ↑ 动手实战        ↑ 查漏补缺
```

---

## 整体目录结构

```
go_agent_series/                    # 共 39 篇
├── introduction.md                 # 系列导读（1篇）
├── llm_base/                       # 一、大模型基础（4篇）
├── agent_concepts/                 # 二、Agent认知（5篇）
├── adk_basic/                      # 三、ADK入门（6篇）
├── adk_advanced/                   # 四、ADK进阶（7篇）
├── rag/                            # 五、RAG实战（4篇）
├── projects/                       # 六、项目实战（4篇）
├── engineering/                    # 七、部署工程化（3篇）
└── interview/                      # 八、面试题库（6篇）
```

---

## 一、大模型基础（4篇）

> 目录：`go_agent_series/llm_base/`
>
> 目标：建立大模型的基础认知，理解 LLM 的核心概念，并用 Go 语言完成第一次 API 调用。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `llm_overview.md` | 大模型概述与发展历程 | GPT系列演进、Transformer架���简介、从GPT到Claude/Gemini的发展脉络、开源vs闭源生态 |
| 2 | `llm_core_concepts.md` | 大模型核心概念 | Token、Prompt、Temperature、Top-P、上下文窗口、推理与训练的区别、API调用模式 |
| 3 | `prompt_engineering.md` | Prompt Engineering实战 | Zero-shot/Few-shot、CoT思维链、System/User/Assistant角色、Prompt设计模式与最佳实践 |
| 4 | `llm_api_practice.md` | Go语言调用大模型API实战 | 用Go调用OpenAI/Gemini API、流式输出、错误处理、`google.golang.org/genai` SDK使用 |

---

## 二、Agent 认知篇（5篇）

> 目录：`go_agent_series/agent_concepts/`
>
> 目标：深入理解 AI Agent 的本质、架构与核心能力，为框架学习打下理论基础。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `agent_definition.md` | 什么是AI Agent | Agent定义、与传统ChatBot的区别、Agent的核心能力（感知/规划/行动/记忆）、应用场景 |
| 2 | `agent_architecture.md` | Agent核心架构 | 感知-思考-行动循环、ReAct框架、Agent系统组成（LLM+工具+记忆+规划） |
| 3 | `agent_planning.md` | Agent的规划能力 | 任务分解、Plan-and-Execute、Tree of Thoughts、Reflection与自我纠错 |
| 4 | `agent_memory.md` | Agent的记忆机制 | 短期记忆（上下文）、长期记忆（向量检索）、工作记忆、Session状态管理 |
| 5 | `agent_tool_use.md` | Agent的工具使用 | Function Calling原理、工具描述与选择、工具调用链、MCP协议介绍 |

---

## 三、ADK 框架入门（6篇）

> 目录：`go_agent_series/adk_basic/`
>
> 目标：掌握 Google ADK Go 框架的核心概念与基础用法，���独立构建简单的 Agent 应用。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `adk_overview.md` | Google ADK Go框架概述 | ADK是什么、核心理念（code-first）、架构全景、与LangChain/CrewAI对比、为什么选Go |
| 2 | `adk_quickstart.md` | ADK快速上手 | 环境搭建、第一个Agent、Runner运行、Launcher启动Web UI |
| 3 | `adk_model.md` | 模型层详解 | `gemini.NewModel`配置、模型参数调优、多模型支持、`model.LLMRequest/Response` |
| 4 | `adk_agent_config.md` | Agent配置详解 | `llmagent.Config`全字段解析、Instruction模板变量、Description最佳实践 |
| 5 | `adk_session.md` | Session会话管理 | `session.Service`接口、InMemory/持久化存储、Session State作用域（user/app/session） |
| 6 | `adk_runner.md` | Runner运行机制 | `runner.New`配置、`r.Run()`事件流、StreamingMode、RunConfig详解 |

---

## 四、ADK 框架进阶（7篇）

> 目录：`go_agent_series/adk_advanced/`
>
> 目标：深入 ADK 高级特性，掌握工具系统、插件机制、多 Agent 协作与工作流编排。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `adk_tools.md` | 工具系统深入 | 自定义Function Tool、`geminitool.GoogleSearch`、工具参数Schema、工具执行上下文 |
| 2 | `adk_mcp.md` | MCP协议集成 | MCP Server/Client概念、在ADK中集成MCP工具、跨系统工具调用 |
| 3 | `adk_callbacks.md` | 回调与插件机制 | `plugin.New`全回调详解（BeforeRun/AfterRun/BeforeModel/AfterModel/BeforeTool/OnEvent） |
| 4 | `adk_multi_agent.md` | 多智能体系统 | `agent.NewMultiLoader`、Agent路由与协作、专家Agent设计模式 |
| 5 | `adk_workflow.md` | 工作流Agent | Sequential Agent（顺序执行）、Parallel Agent（并行执行）、Loop Agent（循环执行） |
| 6 | `adk_artifact.md` | Artifact与Memory服务 | `artifact.Service`文件管理、`memory.Service`长期记忆、向量检索集成 |
| 7 | `adk_streaming.md` | 流式输出与事件处理 | SSE流式模式、Event事件模型、`IsFinalResponse()`判断、实时UI更新 |

---

## 五、RAG 实战篇（4篇）

> 目录：`go_agent_series/rag/`
>
> 目标：掌握 RAG 的原理与实现，用 Go + ADK 构建一个完整的知识检索增强 Agent。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `rag_overview.md` | RAG原理与架构 | 检索增强生成原理、为什么需要RAG、RAG vs 微调、架构设计 |
| 2 | `rag_embedding.md` | Embedding与向量数据库 | 文本向量化原理、Embedding模型选择、向量数据库（Milvus/Weaviate）Go客户端 |
| 3 | `rag_chunking.md` | 文档处理与Chunking策略 | 文档加载、分块策略（固定/语义/递归）、元数据提取、Go实现 |
| 4 | `rag_adk_practice.md` | 基于ADK构建RAG Agent | ADK + 向量数据库实战、检索工具封装、上下文注入、效果优化 |

---

## 六、项目实战篇（4篇）

> 目录：`go_agent_series/projects/`
>
> 目标：通过 4 个完整项目，综合运用所学知识，构建真实可用的 Agent 应用。

| 序号 | 文件名 | 标题 | 核心技术 |
|------|--------|------|----------|
| 1 | `project_customer_service.md` | 项目一：智能客服系统 | 多轮对话、意图识别、知识库检索、工单创建，基于ADK多Agent协作 |
| 2 | `project_code_assistant.md` | 项目二：代码助手Agent | 代码生成/审查/解释、Git工具集成、MCP接入IDE，Sequential Workflow |
| 3 | `project_data_analyst.md` | 项目三：数据分析Agent | SQL生成与执行、图表生成、报告输出，Tool Chain + Artifact存储 |
| 4 | `project_multi_agent_platform.md` | 项目四：多Agent协作平台 | Agent编排引擎、动态路由、并行任务、监控面板，ADK全功能综合实战 |

---

## 七、部署与工程化（3篇）

> 目录：`go_agent_series/engineering/`
>
> 目标：掌握 Agent 应用的测试、监控与生产部署，让 Agent 系统真正可靠运行。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `agent_testing.md` | Agent测试策略 | 单元测试、集成测试、Agent行为评估、Mock工具与模型 |
| 2 | `agent_observability.md` | 可观测性与监控 | 日志插件、Token用量追踪、调用链追踪、Prometheus/Grafana集成 |
| 3 | `agent_deployment.md` | 生产部署实践 | Docker容器化、K8s部署、API Gateway接入、限流与成本控制 |

---

## 八、面试题库（6篇）

> 目录：`go_agent_series/interview/`
>
> 目标：覆盖 Agent 开发领域的高频面试题，帮助读者系统准备面试。

| 序号 | 文件名 | 标题 | 核心考点 |
|------|--------|------|----------|
| 1 | `interview_llm_base.md` | 大模型基础面试题 | Transformer、注意力机制、Token化、位置编码、幻觉问题 |
| 2 | `interview_agent.md` | Agent架构面试题 | Agent定义���ReAct、规��策略、记忆机制、工具调用 |
| 3 | `interview_rag.md` | RAG面试题 | 检索策略、Chunking、Embedding、向量数据库选型、RAG优化 |
| 4 | `interview_engineering.md` | 工程化面试题 | Agent评估、可观测性、成本优化、安全防护、幂等与重试 |
| 5 | `interview_multi_agent.md` | 多智能体面试题 | 多Agent协作模式、通信机制、任务分配、一致性问题 |
| 6 | `interview_scenario.md` | Agent场景设计题 | 设计一个XX Agent系统、架构选型、瓶颈分析、扩展方案 |

---

## Sidebar 配置参考

> 以下为 VuePress Theme Hope 的 sidebar 配置结构，可直接集成到 `sidebar.ts` 中。

```typescript
"/go_agent_series/": [
  {
    text: "Go Agent进阶之路",
    icon: "robot",
    collapsible: true,
    children: [
      "introduction",
      {
        text: "一、大模型基础",
        collapsible: true,
        children: [
          "llm_base/llm_overview",
          "llm_base/llm_core_concepts",
          "llm_base/prompt_engineering",
          "llm_base/llm_api_practice",
        ],
      },
      {
        text: "二、Agent认知",
        collapsible: true,
        children: [
          "agent_concepts/agent_definition",
          "agent_concepts/agent_architecture",
          "agent_concepts/agent_planning",
          "agent_concepts/agent_memory",
          "agent_concepts/agent_tool_use",
        ],
      },
      {
        text: "三、ADK框架入门",
        collapsible: true,
        children: [
          "adk_basic/adk_overview",
          "adk_basic/adk_quickstart",
          "adk_basic/adk_model",
          "adk_basic/adk_agent_config",
          "adk_basic/adk_session",
          "adk_basic/adk_runner",
        ],
      },
      {
        text: "四、ADK框架进阶",
        collapsible: true,
        children: [
          "adk_advanced/adk_tools",
          "adk_advanced/adk_mcp",
          "adk_advanced/adk_callbacks",
          "adk_advanced/adk_multi_agent",
          "adk_advanced/adk_workflow",
          "adk_advanced/adk_artifact",
          "adk_advanced/adk_streaming",
        ],
      },
      {
        text: "五、RAG实战",
        collapsible: true,
        children: [
          "rag/rag_overview",
          "rag/rag_embedding",
          "rag/rag_chunking",
          "rag/rag_adk_practice",
        ],
      },
      {
        text: "六、项目实战",
        collapsible: true,
        children: [
          "projects/project_customer_service",
          "projects/project_code_assistant",
          "projects/project_data_analyst",
          "projects/project_multi_agent_platform",
        ],
      },
      {
        text: "七、部署与工程化",
        collapsible: true,
        children: [
          "engineering/agent_testing",
          "engineering/agent_observability",
          "engineering/agent_deployment",
        ],
      },
      {
        text: "八、面试题库",
        collapsible: true,
        children: [
          "interview/interview_llm_base",
          "interview/interview_agent",
          "interview/interview_rag",
          "interview/interview_engineering",
          "interview/interview_multi_agent",
          "interview/interview_scenario",
        ],
      },
    ],
  },
],
```

---

## Navbar 配置参考

```typescript
{
  text: "Go Agent进阶之路",
  link: "/go_agent_series/introduction.md",
},
```

---

## 写作建议

1. **风格一致**：延续现有系列通俗易懂、风趣幽默的写作风格
2. **代码驱动**：每篇文章都应包含完整可运行的 Go 代码示例
3. **图文并茂**：架构图、流程图、对比表格不可少
5. **实战为王**：理论篇控制在 40%，代码实战占 60%
6. **面试导向**：每篇理论文章末尾可附 2-3 道相关面试题，与最终面试题库呼应
