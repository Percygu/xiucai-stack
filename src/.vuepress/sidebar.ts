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
        "/go_series/go_interview/go_interview.md",
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
      text: "Mysql面试题",
      collapsible: true,
      children: [
        "/backend_series/mysql_interview/mysql_interview.md",
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
        "/backend_series/advanced_interview/circuit_breaker.md",
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
        "/backend_series/advanced_interview/database_index.md",
        "/backend_series/advanced_interview/data_migrate.md",
        "/backend_series/advanced_interview/database_estimate.md",
        "/backend_series/advanced_interview/database_primary_key.md",
        "/backend_series/advanced_interview/database_index.md",
        "/backend_series/advanced_interview/sql_optimization.md",
       // "/backend_series/advanced_interview/database_lock.md",
        "/backend_series/advanced_interview/database_mvcc.md",
        "/backend_series/advanced_interview/database_transaction.md",
       "/backend_series/advanced_interview/slow_sql.md",
       "/backend_series/advanced_interview/java_request_slow.md",
        "/backend_series/advanced_interview/go_connection_pool.md",  
        "/backend_series/advanced_interview/tinyurl.md",
        "/backend_series/advanced_interview/rate_limiter.md",
        "/backend_series/advanced_interview/comments_system.md",
        "/backend_series/advanced_interview/video_ranking.md",    
      ]
    },
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
  "/ai_series/": [
    {
      text: "AI进阶之路",
      collapsible: true,
      children: [
        {
          text: "生成式AI入门指南",
          collapsible: true,
          children: [
            "/ai_series/generative_ai/ai_introduction.md",
            "/ai_series/generative_ai/machine_learning.md",
            "/ai_series/generative_ai/deep_learning.md",
            "/ai_series/generative_ai/generative_ai.md",
            "/ai_series/generative_ai/llm.md",
          ]
        },
        {
          text: "提示词工程",
          collapsible: true,
          children: [

          ]
        },
        {
          text: "大模型应用开发",
          collapsible: true,
          children: [
            {
              text: "大模型导论",
              collapsible: true,
              children: [
                "/ai_series/llm_development/llm_introduction/llm_ Introduction.md",
                "/ai_series/llm_development/llm_introduction/llm_introduction1.md"
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
            {
              text: "RAG系列",
              collapsible: true,
              children: ["/ai_series/llm_development/rag_series/rag_concepts.md"]
            }
          ]
        },
        {
          text: "AI编程",
          collapsible: true,
          children: ["/ai_series/ai_coding/cursor1.md"]
        },
        {
          text: "AI应用",
          collapsible: true,
          children: ["/ai_series/ai_app/vector_database.md"]
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
