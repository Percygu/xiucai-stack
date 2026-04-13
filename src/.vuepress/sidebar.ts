import { sidebar } from "vuepress-theme-hope";


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
            "/go_series/go_framework/gorm.md",
            "/go_series/go_framework/gin.md",
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
    "/backend_series/go_interview/go_interview.md",
    "/backend_series/mysql_interview/mysql_interview.md",
    "/backend_series/redis_interview/redis_interview.md",
    "/backend_series/mq_interview/mq_interview.md",
    "/backend_series/distributed_interview/distributed_interview.md",
    {
      text: "大模型面试题",
      collapsible: true,
      children: [
        "/backend_series/llm_interview/transform_attention.md",
        "/backend_series/llm_interview/agent_definition.md",
        "/backend_series/llm_interview/react_definition.md",
        "/backend_series/llm_interview/agent_planning.md",
        "/backend_series/llm_interview/position_code.md",
        "/backend_series/llm_interview/agent_memory.md",
        "/backend_series/llm_interview/agent_memory_cover.md",
        "/backend_series/llm_interview/agent_challenge.md",
        "/backend_series/llm_interview/multi_agent.md",
        "/backend_series/llm_interview/agent_frame.md",
        "/backend_series/llm_interview/agent_tool.md",
        "/backend_series/llm_interview/agent_safety.md",
        "/backend_series/llm_interview/agent_frame_compare.md",
        "/backend_series/llm_interview/agent_memory_design.md",
        "/backend_series/llm_interview/agent_dialogue_design.md",
        "/backend_series/llm_interview/agent_cooperation.md",
        "/backend_series/llm_interview/rag.md",
        "/backend_series/llm_interview/chunk.md",
        "/backend_series/llm_interview/embedding.md",
        "/backend_series/llm_interview/rag_optimization.md",
        "/backend_series/llm_interview/rag_evaluate.md",
        "/backend_series/llm_interview/knowledge_graph.md",
        "/backend_series/llm_interview/rag_deploy.md",
        "/backend_series/llm_interview/rag_search.md",
        "/backend_series/llm_interview/rag_search_improve.md",
        "/backend_series/llm_interview/fine_tuning.md",
        "/backend_series/llm_interview/rag_ops.md",
        "/backend_series/llm_interview/ragas.md",
        "/backend_series/llm_interview/rag_semantic_gaps.md",
        "/backend_series/llm_interview/langchain_langgraph.md",
        "/backend_series/llm_interview/rag_rerank.md",
      ]
    },
    {
      text: "后端面试场景题",
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
        {
          text: "一、大模型基础",
          collapsible: true,
          children: [
            "/go_agent_series/llm_base/llm_overview.md",
            "/go_agent_series/llm_base/llm_core_concepts.md",
            "/go_agent_series/llm_base/prompt_engineering.md",
            "/go_agent_series/llm_base/llm_api_practice.md",
          ]
        },
        {
          text: "二、Agent认知",
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
          text: "大模型面试题",
          collapsible: true,
          children: [
            "/backend_series/llm_interview/transform_attention.md",
            "/backend_series/llm_interview/agent_definition.md",
            "/backend_series/llm_interview/react_definition.md",
            "/backend_series/llm_interview/agent_planning.md",
            "/backend_series/llm_interview/position_code.md",
            "/backend_series/llm_interview/agent_memory.md",
            "/backend_series/llm_interview/agent_memory_cover.md",
            "/backend_series/llm_interview/agent_challenge.md",
            "/backend_series/llm_interview/multi_agent.md",
            "/backend_series/llm_interview/agent_frame.md",
            "/backend_series/llm_interview/agent_tool.md",
            "/backend_series/llm_interview/agent_safety.md",
            "/backend_series/llm_interview/agent_memory_design.md",
            "/backend_series/llm_interview/agent_dialogue_design.md",
            "/backend_series/llm_interview/agent_cooperation.md",
            "/backend_series/llm_interview/rag.md",
            "/backend_series/llm_interview/chunk.md",
            "/backend_series/llm_interview/embedding.md",
            "/backend_series/llm_interview/rag_optimization.md",
            "/backend_series/llm_interview/rag_evaluate.md",
            "/backend_series/llm_interview/knowledge_graph.md",
            "/backend_series/llm_interview/rag_deploy.md",
            "/backend_series/llm_interview/rag_search.md",
            "/backend_series/llm_interview/rag_search_improve.md",
            "/backend_series/llm_interview/fine_tuning.md",
            "/backend_series/llm_interview/agent_frame_compare.md",
            "/backend_series/llm_interview/rag_ops.md",
            "/backend_series/llm_interview/ragas.md",
            "/backend_series/llm_interview/rag_semantic_gaps.md",
            "/backend_series/llm_interview/langchain_langgraph.md",
            "/backend_series/llm_interview/rag_rerank.md",
          ]
        },
        {
          text: "LangChain从入门到精通",
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
