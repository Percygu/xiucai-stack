import { sidebar } from "vuepress-theme-hope";


// 左侧侧边栏
export default sidebar({
  "/go_series/": [
    {
      text: "Go语言进阶之路",
      collapsible: true,
      children: [
        "/go_series/introduction.md",
        "/go_series/go_ prospect/go_ prospect.md",
        "/go_series/go_environment/go_environment.md",
        {
          text: "四、Go语言基础",
          collapsible: true,
          children: [
            "/go_series/go_base/go_environment.md",
            "/go_series/go_base/go_naming_standards.md",
            "/go_series/go_base/go_ variable.md",
            "/go_series/go_base/go_ constant.md",
            "/go_series/go_base/go_ operators.md",
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
  "/后端进阶之路/": [
    {
      text: "面试场景题",
      collapsible: true,
      children: [
        "/后端进阶之路/面试场景题/微服务架构核心：服务注册与发现的AP与CP抉择.md",
        "/后端进阶之路/面试场景题/当面试官问起\"负载均衡\"，哪些点是核心？.md",
        "/后端进阶之路/面试场景题/熔断：如何优雅地应对服务雪崩与抖动.md",
        "/后端进阶之路/面试场景题/服务降级：从有损服务到保障核心业务的架构智慧.md",
        "/后端进阶之路/面试场景题/限流：从算法到阈值，一次性讲透.md",
        "/后端进阶之路/面试场景题/Go程序数据库连接池耗尽如何排查.md",
        "/后端进阶之路/面试场景题/Java线上接口响应慢如何排查.md",
      ]
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
  "/后端组件/": [
    {
      text: "后端组件",
      collapsible: true,
      children: [
        {
          text: "Mysql",
          collapsible: true,
          children: ["/后端组件/Mysql/mysql.md"]
        },
        {
          text: "Redis",
          collapsible: true,
          children: ["/后端组件/Redis/redis.md"]
        }
      ],
    }
  ],
  "/AI进阶之路/": [
    {
      text: "AI进阶之路",
      collapsible: true,
      children: [
        {
          text: "生成式AI入门指南",
          collapsible: true,
          children: [
            "/AI进阶之路/生成式AI入门/人工智能导论.md",
            "/AI进阶之路/生成式AI入门/理解机器学习.md",
            "/AI进阶之路/生成式AI入门/理解深度学习.md",
            "/AI进阶之路/生成式AI入门/生成式AI简介.md",
            "/AI进阶之路/生成式AI入门/什么是大语言模型.md",
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
              children: ["/AI进阶之路/大模型应用开发/大模型导论/大模型简介.md"]
            },
            {
              text: "LangChain从入门到精通",
              collapsible: true,
              children: [
                "/AI进阶之路/大模型应用开发/LangChain从入门到精通/LangChain基础概念.md",
                "/AI进阶之路/大模型应用开发/LangChain从入门到精通/Model-IO.md",
                "/AI进阶之路/大模型应用开发/LangChain从入门到精通/数据连接.md",
                "/AI进阶之路/大模型应用开发/LangChain从入门到精通/链.md",
                "/AI进阶之路/大模型应用开发/LangChain从入门到精通/Memery.md",
                "/AI进阶之路/大模型应用开发/LangChain从入门到精通/RAG(检索增强).md",
                "/AI进阶之路/大模型应用开发/LangChain从入门到精通/Agent.md",
                "/AI进阶之路/大模型应用开发/LangChain从入门到精通/回调.md",
                "/AI进阶之路/大模型应用开发/LangChain从入门到精通/LCEL.md",
              ]
            },
            {
              text: "RAG系列",
              collapsible: true,
              children: ["/AI进阶之路/大模型应用开发/RAG系列/RAG总体概览.md"]
            }
          ]
        },
        {
          text: "AI编程",
          collapsible: true,
          children: ["/AI进阶之路/AI编程/Cusor AI编程实战(1)：抖音爆款文案提取&改写工具(上).md"]
        },
        {
          text: "AI应用",
          collapsible: true,
          children: ["/AI进阶之路/AI应用/2025 年你必须知道的 10 个向量数据库.md"]
        },

      ],
    }
  ],
  "/面试题/": [
    {
      text: "高级程序员面试场景题",
      collapsible: true,
      children: ["/面试题/高级程序员面试题/消息丢失.md"]
    }
  ],

});
