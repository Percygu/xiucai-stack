import { sidebar } from "vuepress-theme-hope";

const numberedInterviewQuestions = (
  questions: { text: string; link: string }[]
) => questions.map((question, index) => ({
  text: `${index + 1}. ${question.text}`,
  link: question.link,
}));

const llmInterviewGroups = [
  {
    text: "01 | 大模型基础面试题",
    collapsible: true,
    children: numberedInterviewQuestions([
      {
        text: "请详细解释一下 Transformer 模型中的自注意力机制是如何工作的？它为什么比 RNN 更适合处理长序列？",
        link: "/backend_series/llm_interview/transform_attention.md",
      },
      {
        text: "什么是位置编码？在 Transformer 中，为什么它是必需的？请列举至少两种实现方式",
        link: "/backend_series/llm_interview/position_code.md",
      },
      {
        text: "有微调过 Agent 能力吗？数据集如何收集？",
        link: "/backend_series/llm_interview/fine_tuning.md",
      },
    ]),
  },
  {
    text: "02 | Agent面试题",
    collapsible: true,
    children: numberedInterviewQuestions([
      {
        text: "你如何定义一个基于 LLM 的智能体？它通常由哪些核心组件构成？",
        link: "/backend_series/llm_interview/agent_definition.md",
      },
      {
        text: "请详细解释 ReAct 框架。它是如何将思维链和行动结合起来，以完成复杂任务的？",
        link: "/backend_series/llm_interview/react_definition.md",
      },
      {
        text: "Agent的规划能力有哪些主流的实现方法？",
        link: "/backend_series/llm_interview/agent_planning.md",
      },
      {
        text: "请问如何为Agent设计短期记忆和长期记忆系统？可以借助哪些外部工具或技术？",
        link: "/backend_series/llm_interview/agent_memory.md",
      },
      {
        text: "Agent 的记忆覆盖问题如何解决？",
        link: "/backend_series/llm_interview/agent_memory_cover.md",
      },
      {
        text: "在构建一个复杂的 Agent 时，你认为最主要的挑战是什么？",
        link: "/backend_series/llm_interview/agent_challenge.md",
      },
      {
        text: "什么是多Agent系统？让多个Agent 协同工作相比于单个 Agent 有什么优势？又会引入哪些新的复杂性？",
        link: "/backend_series/llm_interview/multi_agent.md",
      },
      {
        text: "你用过哪些 Agent 框架？选型是如何选的？你最终场景的评价指标是什么？",
        link: "/backend_series/llm_interview/agent_frame.md",
      },
      {
        text: "Tool Use是扩展Agent能力的有效途径。请解释LLM是如何学会调用外部API或工具的？",
        link: "/backend_series/llm_interview/agent_tool.md",
      },
      {
        text: "如何确保一个Agent的行为是安全、可控且符合人类意图的？在Agent的设计中，有哪些保障对齐方法？",
        link: "/backend_series/llm_interview/agent_safety.md",
      },
      {
        text: "请比较一下LangChain 和 LlamaIndex，它们的核心应用场景有何不同？",
        link: "/backend_series/llm_interview/agent_frame_compare.md",
      },
      {
        text: "在 Agent 中，记忆模块你一般会怎么设计？",
        link: "/backend_series/llm_interview/agent_memory_design.md",
      },
      {
        text: "假如说要设计一个多轮对话Agent，你会怎么设计？",
        link: "/backend_series/llm_interview/agent_dialogue_design.md",
      },
      {
        text: "介绍一下多 Agent 如何实现工作？多个 Agent 之间如何协调和分工？",
        link: "/backend_series/llm_interview/agent_cooperation.md",
      },
      {
        text: "在高并发RAG Agent系统中，如何优化召回和生成阶段的延迟？",
        link: "/backend_series/llm_interview/agent_optimization.md",
      },
      {
        text: "LangChain 和 LangGraph 的区别是什么？各自适用什么场景？",
        link: "/backend_series/llm_interview/langchain_langgraph.md",
      },
      {
        text: "你的 Agent 服务是如何保证高可用和稳健性的？",
        link: "/backend_series/llm_interview/agent_high_availability.md",
      },
    ]),
  },
  {
    text: "03 | RAG面试题",
    collapsible: true,
    children: numberedInterviewQuestions([
      {
        text: "请解释 RAG 的工作原理。与直接对 LLM 进行微调相比，RAG 主要解决了什么问题？有哪些优势？",
        link: "/backend_series/llm_interview/rag.md",
      },
      {
        text: "在构建知识库时，文本切块策略至关重要。你会如何选择合适的切块大小和重叠长度？这背后有什么考虑？",
        link: "/backend_series/llm_interview/chunk.md",
      },
      {
        text: "如何选择一个合适的嵌入模型？评估一个 Embedding 模型的好坏有哪些指标？",
        link: "/backend_series/llm_interview/embedding.md",
      },
      {
        text: "除了基础的向量检索，你还知道哪些可以提升 RAG 检索质量的技术？",
        link: "/backend_series/llm_interview/rag_optimization.md",
      },
      {
        text: "如何全面地评估一个 RAG 系统的性能？请分别从检索和生成两个阶段提出评估指标",
        link: "/backend_series/llm_interview/rag_evaluate.md",
      },
      {
        text: "在什么场景下，你会选择使用图数据库或知识图谱来增强或替代传统的向量数据库检索？",
        link: "/backend_series/llm_interview/knowledge_graph.md",
      },
      {
        text: "RAG 系统在实际部署中可能面临哪些挑战？",
        link: "/backend_series/llm_interview/rag_deploy.md",
      },
      {
        text: "传统的 RAG 流程是“先检索后生成”，你是否了解一些其他的 RAG 范式，比如在生成过程中多次检索或自适应检索？",
        link: "/backend_series/llm_interview/rag_search.md",
      },
      {
        text: "你知道哪些方法可以提高RAG的检索正确率？",
        link: "/backend_series/llm_interview/rag_search_improve.md",
      },
      {
        text: "RAG 检索不到问题时如何定位问题？排查思路是什么？",
        link: "/backend_series/llm_interview/rag_ops.md",
      },
      {
        text: "RAGAS了解吗？它的评估指标有哪些？评估流程是怎样的？评估数据如何获取和构造？",
        link: "/backend_series/llm_interview/ragas.md",
      },
      {
        text: "RAG用户提问和向量库中的语义发生不匹配怎么办？如何解决语义鸿沟问题？",
        link: "/backend_series/llm_interview/rag_semantic_gaps.md",
      },
      {
        text: "什么是RAG 中的Rerank？具体需要怎么做？你了解哪些常用的 Rerank模型？",
        link: "/backend_series/llm_interview/rag_rerank.md",
      },
      {
        text: "你项目中 RAG 的存储架构是怎么设计的？",
        link: "/backend_series/llm_interview/rag_store.md",
      },
      {
        text: "RAG系统中如何进行query改写，以及如何基于检索结果构建有效prompt？",
        link: "/backend_series/llm_interview/rag_query.md",
      },
      {
        text: "你的RAG知识库更新策略是怎样的？",
        link: "/backend_series/llm_interview/rag_update.md",
      },
    ]),
  },
  {
    text: "04 | 大模型架构面试题",
    collapsible: true,
    children: numberedInterviewQuestions([
      {
        text: "如何设计实现一个 LLM Gateway ？",
        link: "/backend_series/llm_interview/llm_gateway.md",
      },
      {
        text: "你会怎么设计一个大模型应用的后端架构？",
        link: "/backend_series/llm_interview/llm_architecture.md",
      },
      {
        text: "Prompt 注入是什么？有哪些攻击方式？如何防护？",
        link: "/backend_series/llm_interview/prompt_injection.md",
      },
      {
        text: "Function Calling 的可靠性怎么保证？",
        link: "/backend_series/llm_interview/function_calling.md",
      },
    ]),
  },
];


// 左侧侧边栏
export default sidebar({
  "/go_series/": [
    {
      text: "Go语言进阶之路",
      collapsible: true,
      children: [
        "/go_series/introduction.md",
        "/go_series/go_prospect/go_prospect.md",
        "/go_series/go_environment/go_environment.md",
        {
          text: "四、Go语言基础",
          collapsible: true,
          children: [
            "/go_series/go_base/go_code_structure.md",
            "/go_series/go_base/go_naming_standards.md",
            "/go_series/go_base/go_variable.md",
            "/go_series/go_base/go_constant.md",
            "/go_series/go_base/go_operators.md",
            "/go_series/go_base/go_struct.md",
            "/go_series/go_base/go_slice.md",
            "/go_series/go_base/go_map.md",
            "/go_series/go_base/go_condition.md",
            "/go_series/go_base/go_loop.md",
            "/go_series/go_base/go_pointer.md",
            "/go_series/go_base/go_function.md",
            "/go_series/go_base/go_method.md",
            "/go_series/go_base/go_interface.md",
            "/go_series/go_base/go_error.md",
            "/go_series/go_base/go_defer.md",
            "/go_series/go_base/go_exception.md",
            "/go_series/go_base/go_dependency.md",
          ]
        },
        {
          text: "五、Go语言进阶",
          collapsible: true,
          children: [
            "/go_series/go_advanced/concurrency.md",
            "/go_series/go_advanced/goroutine.md",
            "/go_series/go_advanced/channel.md",
            "/go_series/go_advanced/sync.md",
            "/go_series/go_advanced/select.md",
            "/go_series/go_advanced/context.md",
            "/go_series/go_advanced/timer.md",
            "/go_series/go_advanced/goroutine_pool.md",
            "/go_series/go_advanced/reflect.md",
            "/go_series/go_advanced/generics.md",
          ]
        },
        {
          text: "六、Go语言框架",
          collapsible: true,
          children: [
            "/go_series/go_framework/gin.md",
            "/go_series/go_framework/gorm.md",
          ]
        },
        {
          text: "七、Go语言原理",
          collapsible: true,
          children: [
            "/go_series/go_principles/initialization.md",
            "/go_series/go_principles/string_principles.md",
            "/go_series/go_principles/slice_principles.md",
            "/go_series/go_principles/map_principles.md",
            "/go_series/go_principles/sync.map_principles.md",
            "/go_series/go_principles/channel_principles.md",
            "/go_series/go_principles/context_principles.md",
            "/go_series/go_principles/defer_principles.md",
            "/go_series/go_principles/interface_principles.md",
            "/go_series/go_principles/escape_principles.md",
            "/go_series/go_principles/memory_principles.md",
            "/go_series/go_principles/gc_principles.md",
            "/go_series/go_principles/gmp_principles.md",
          ]
        },
        "/go_series/go_testing/go_testing.md",
        "/go_series/go_coding_standards/go_coding_standards.md",
        {
          text: "十、Go语言面试题",
          link:"/backend_series/go_interview/go_interview.md",
        },
        
        // {
        //   text: "十、Go面试题库",
        //   collapsible: true,
        //   children: [
        //     "/Go语言系列/Go面试题库/基础面试题.md",
        //     "/Go语言系列/Go面试题库/Slice面试题.md",
        //     "/Go语言系列/Go面试题库/Map面试题.md",
        //     "/Go语言系列/Go面试题库/Channel面试题.md",
        //     "/Go语言系列/Go面试题库/Sync面试题.md",
        //     "/Go语言系列/Go面试题库/Context面试题.md",
        //     "/Go语言系列/Go面试题库/Interface面试题.md",
        //     "/Go语言系列/Go面试题库/反射面试题.md",
        //     "/Go语言系列/Go面试题库/GMP面试题.md",
        //     "/Go语言系列/Go面试题库/内存管理面试题.md",
        //     "/Go语言系列/Go面试题库/垃圾回收面试题.md",
        //     "/Go语言系列/Go面试题库/代码面试题.md",
        //   ]
        // },
      ],
    },
  ],
  "/backend_series/": [
    {
      text: "一、Go语言面试题",
      link: "/backend_series/go_interview/go_interview.md",
    },
    {
      text: "二、Mysql面试题",
      link: "/backend_series/mysql_interview/mysql_interview.md",
    },
    {
      text: "三、Redis面试题",
      link: "/backend_series/redis_interview/redis_interview.md",
    },
    {
      text: "四、消息队列面试题",
      link: "/backend_series/mq_interview/mq_interview.md",
    },
    {
      text: "五、分布式面试题",
      link: "/backend_series/distributed_interview/distributed_interview.md",
    },
    {
      text: "六、大模型面试题",
      collapsible: true,
      children: [
        ...llmInterviewGroups,
      ]
    },
    {
      text: "七、后端面试场景题",
      collapsible: true,
      children: [
        "/backend_series/advanced_interview/load_balance.md",
        "/backend_series/advanced_interview/service_registry.md",
        "/backend_series/advanced_interview/circuit_breaker.md",
        "/backend_series/advanced_interview/downgrade.md",
        "/backend_series/advanced_interview/rate_limiting.md",
        "/backend_series/advanced_interview/isolation.md",
        "/backend_series/advanced_interview/timeout_control.md",
        "/backend_series/advanced_interview/third_interface.md",
        "/backend_series/advanced_interview/high_availability.md",
        "/backend_series/advanced_interview/distributed_lock.md",
        "/backend_series/advanced_interview/distributed_transaction.md",
        "/backend_series/advanced_interview/mq_scene.md",
        "/backend_series/advanced_interview/mq_order.md",
        "/backend_series/advanced_interview/mq_block.md",
        "/backend_series/advanced_interview/mq_lost.md",
        "/backend_series/advanced_interview/mq_repeat.md",
        "/backend_series/advanced_interview/mq_kafka.md",       
        "/backend_series/advanced_interview/mq_design.md", 
        "/backend_series/advanced_interview/mq_delay.md",       
        "/backend_series/advanced_interview/database_index.md",
        "/backend_series/advanced_interview/data_migrate.md",
        "/backend_series/advanced_interview/database_estimate.md",
        "/backend_series/advanced_interview/database_primary_key.md",
        "/backend_series/advanced_interview/database_sharding.md",
        "/backend_series/advanced_interview/sql_optimization.md",
        "/backend_series/advanced_interview/database_lock.md",
        "/backend_series/advanced_interview/database_mvcc.md",
        "/backend_series/advanced_interview/database_transaction.md",
       "/backend_series/advanced_interview/slow_sql.md",
       "/backend_series/advanced_interview/cache_eliminate.md",
       "/backend_series/advanced_interview/cache_expired.md",
       "/backend_series/advanced_interview/cache_mode.md",
       "/backend_series/advanced_interview/cache_design.md",
       "/backend_series/advanced_interview/cache_system.md",
       "/backend_series/advanced_interview/java_request_slow.md",
        "/backend_series/advanced_interview/go_connection_pool.md",  
        "/backend_series/advanced_interview/tinyurl.md",
        "/backend_series/advanced_interview/rate_limiter.md",
        "/backend_series/advanced_interview/comments_system.md",
        "/backend_series/advanced_interview/video_ranking.md",    
      ]
    },
  ],
  "/life_series/": [
    {
      text: "程序人生",
      collapsible: true,
      children: [
        {
          text: "程序员职业规划",
          collapsible: true,
          children: [
            "/life_series/35.md",
            "/life_series/company.md",
          ]
        },
      ],
    }
  ],
  "/杂文": [
    {
      text: "宋词",
      collapsible: true,
      children: [
        {
          text: "李煜",
          collapsible: true,
          children: ["/杂文/李煜/李煜1.md", "/杂文/李煜/李煜2.md"]
        },
        {
          text: "辛弃疾",
          collapsible: true,
          children: ["/杂文/辛弃疾/辛弃疾1.md", "/杂文/辛弃疾/辛弃疾2.md"]
        }
      ],
    }
  ],
  "/go_agent_series/": [
    {
      text: "Go Agent实战指南",
      collapsible: true,
      children: [
        "/go_agent_series/introduction.md",
        {
          text: "二、大模型基础",
          collapsible: true,
          children: [
            "/go_agent_series/llm_base/llm_overview.md",
            "/go_agent_series/llm_base/llm_core_concepts.md",
            "/go_agent_series/llm_base/prompt_engineering.md",
            "/go_agent_series/llm_base/llm_api_practice.md",
          ]
        },
        {
          text: "三、Agent认知",
          collapsible: true,
          children: [
            "/go_agent_series/agent_concepts/agent_definition.md",
            "/go_agent_series/agent_concepts/agent_architecture.md",
            "/go_agent_series/agent_concepts/agent_planning.md",
            "/go_agent_series/agent_concepts/agent_memory.md",
            "/go_agent_series/agent_concepts/agent_tool_use.md",
          ]
        },
        {
          text: "四、Eino框架基础",
          collapsible: true,
          children: [
            "/go_agent_series/eino_basic/eino_overview.md",
            "/go_agent_series/eino_basic/eino_quickstart.md",
            "/go_agent_series/eino_basic/eino_chatmodel.md",
            "/go_agent_series/eino_basic/eino_prompt.md",
            "/go_agent_series/eino_basic/eino_tool.md",
            "/go_agent_series/eino_basic/eino_react_agent.md",
          ]
        },
        {
          text: "五、Eino框架进阶",
          collapsible: true,
          children:[
            "/go_agent_series/eino_advanced/eino_chain_graph.md",
            "/go_agent_series/eino_advanced/eino_workflow.md",
            "/go_agent_series/eino_advanced/eino_callback.md",
            "/go_agent_series/eino_advanced/eino_streaming.md",
            "/go_agent_series/eino_advanced/eino_mcp.md",
            "/go_agent_series/eino_advanced/eino_adk_agent.md",
            "/go_agent_series/eino_advanced/eino_adk_advanced.md",
          ]
        },
        {
          text: "六、RAG原理与实战",
          collapsible: true,
          children:[
            "/go_agent_series/rag/rag_overview.md",
            "/go_agent_series/rag/rag_embedding.md",
            "/go_agent_series/rag/rag_chunking.md",
            "/go_agent_series/rag/rag_eino_practice.md",
          ]
        },
        {
          text: "七、Agent项目实战",
          collapsible: true,
          children: [
            "/projects/dev-support.md",
            "/projects/interview-agent.md",
          ],
        },
        {
          text: "八、大模型面试题",
          collapsible: true,
          children: [
            ...llmInterviewGroups,
          ]
        },
        {
          text: "附、LangChain实战",
          collapsible: true,
          children: [
            "/ai_series/llm_development/langchain/concepts.md",
            "/ai_series/llm_development/langchain/model-io.md",
            "/ai_series/llm_development/langchain/data_connection.md",
            "/ai_series/llm_development/langchain/chain.md",
            "/ai_series/llm_development/langchain/memory.md",
            "/ai_series/llm_development/langchain/rag.md",
            "/ai_series/llm_development/langchain/agent.md",
            "/ai_series/llm_development/langchain/callbacks.md",
            "/ai_series/llm_development/langchain/lcel.md",
          ]
        },
      ],
    }
  ],


  "/vibe_coding_series/": [
    {
      text: "Vibe Coding实战指南",
      collapsible: true,
      children: [
        {
          text: "一、认知篇",
          collapsible: true,
          children: [
            "/vibe_coding_series/basics/what_is_vibe_coding.md",
            "/vibe_coding_series/basics/ai_coding_landscape.md",
            "/vibe_coding_series/basics/mindset_and_workflow.md",
          ],
        },
        {
          text: "二、环境搭建",
          collapsible: true,
          children: [
            "/vibe_coding_series/setup/dev_environment.md",
            "/vibe_coding_series/setup/claude_code_setup.md",
            "/vibe_coding_series/setup/cursor_setup.md",
            "/vibe_coding_series/setup/codex_setup.md",
          ],
        },
        {
          text: "三、Prompt技巧",
          collapsible: true,
          children: [
            "/vibe_coding_series/prompt/prompt_basics.md",
            "/vibe_coding_series/prompt/requirement_to_prompt.md",
            "/vibe_coding_series/prompt/prompt_patterns.md",
            "/vibe_coding_series/prompt/prompt_advanced.md",
          ],
        },
        {
          text: "四、工具精通",
          collapsible: true,
          children: [
            {
              text: "01 | 工具精通篇导读",
              link: "/vibe_coding_series/tools/tools_overview.md",
            },
            {
              text: "02 | Claude Code 深入浅出",
              collapsible: true,
              children: [
                "/vibe_coding_series/tools/claude_code/claude_code_quickstart.md",
                "/vibe_coding_series/tools/claude_code/claude_code_md.md",
                "/vibe_coding_series/tools/claude_code/claude_code_commands.md",
                "/vibe_coding_series/tools/claude_code/claude_code_mcp.md",
                "/vibe_coding_series/tools/claude_code/claude_code_subagents.md",
                "/vibe_coding_series/tools/claude_code/claude_code_hooks.md",
                "/vibe_coding_series/tools/claude_code/claude_code_skills.md",
                "/vibe_coding_series/tools/claude_code/claude_code_plugins.md",
                "/vibe_coding_series/tools/claude_code/claude_code_workflow.md",
              ],
            },
            {
              text: "03 | Codex 深入浅出",
              collapsible: true,
              children: [
                "/vibe_coding_series/tools/codex/codex_quickstart.md",
                "/vibe_coding_series/tools/codex/codex_agents_md.md",
                "/vibe_coding_series/tools/codex/codex_commands_prompts.md",
              ],
            },
          ],
        },
      ],
    },
  ],

  // Agent项目实战页面的侧边栏
  "/projects/": [
    {
      text: "Agent项目实战",
      collapsible: false,
      children: [
        "/projects/dev-support.md",
        "/projects/interview-agent.md",
      ],
    },
  ],

  // 关于作者页面的侧边栏
  "/about-author": [
    {
      text: "关于作者",
      collapsible: false,
      children: [
        "/about-author.md",
      ]
    }
  ],

});
