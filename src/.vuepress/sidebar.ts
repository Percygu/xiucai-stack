import { sidebar } from "vuepress-theme-hope";


// 左侧侧边栏
export default sidebar({
  "/Go语言系列/": [
    {
      text: "Go语言进阶之路",
      collapsible: true,
      children: [
        "/Go语言系列/Go语言前景/Go语言前景.md",
        "/Go语言系列/Go环境搭建/Go环境搭建.md",
        {
          text: "Go语言基础",
          collapsible: true,
          children: [
            "/Go语言系列/Go语言基础/Go语言代码结构.md",
            "/Go语言系列/Go语言基础/Go语言命名规范.md",
            "/Go语言系列/Go语言基础/Go语言变量.md",
            "/Go语言系列/Go语言基础/Go语言常量.md",
            "/Go语言系列/Go语言基础/Go语言运算符.md",
            "/Go语言系列/Go语言基础/Go语言结构体.md",
            "/Go语言系列/Go语言基础/Go语言数组与切片.md",
            "/Go语言系列/Go语言基础/Go语言Map.md",
            "/Go语言系列/Go语言基础/Go语言条件句.md",
            "/Go语言系列/Go语言基础/Go语言循环.md",
            "/Go语言系列/Go语言基础/Go语言指针.md",
            "/Go语言系列/Go语言基础/Go语言函数.md",
            "/Go语言系列/Go语言基础/Go语言方法.md",
            "/Go语言系列/Go语言基础/Go语言接口.md",
            "/Go语言系列/Go语言基础/Go语言error.md",
            "/Go语言系列/Go语言基础/Go语言defer.md",
            "/Go语言系列/Go语言基础/Go语言异常捕获.md",
            "/Go语言系列/Go语言基础/Go语言依赖管理.md",
          ]
        },
        {
          text: "Go语言进阶",
          collapsible: true,
          children: [
            "/Go语言系列/Go语言进阶/并发概述.md",
            "/Go语言系列/Go语言进阶/Goroutine.md",
            "/Go语言系列/Go语言进阶/Channel.md",
            "/Go语言系列/Go语言进阶/Sync.md",
            "/Go语言系列/Go语言进阶/Select.md",
            "/Go语言系列/Go语言进阶/Context.md",
            "/Go语言系列/Go语言进阶/定时器.md",
            "/Go语言系列/Go语言进阶/协程池.md",
            "/Go语言系列/Go语言进阶/反射.md",
            "/Go语言系列/Go语言进阶/范型.md",
          ]
        },
        {
          text: "Go语言框架",
          collapsible: true,
          children: [
            "/Go语言系列/Go语言框架/gorm.md",
            "/Go语言系列/Go语言框架/gin.md",
          ]
        },
        {
          text: "Go语言原理",
          collapsible: true,
          children: [
            "/Go语言系列/Go语言原理/程序初始化.md",
            "/Go语言系列/Go语言原理/string原理.md",
            "/Go语言系列/Go语言原理/slice原理.md",
            "/Go语言系列/Go语言原理/map原理.md",
            "/Go语言系列/Go语言原理/sync.map原理.md",
            "/Go语言系列/Go语言原理/channel原理.md",
            "/Go语言系列/Go语言原理/context原理.md",
            "/Go语言系列/Go语言原理/defer原理.md",
            "/Go语言系列/Go语言原理/interface原理.md",
            "/Go语言系列/Go语言原理/逃逸分析.md",
            "/Go语言系列/Go语言原理/内存管理.md",
            "/Go语言系列/Go语言原理/垃圾回收.md",
            "/Go语言系列/Go语言原理/gmp调度原理.md",
          ]
        },
        "/Go语言系列/Go语言单测/Go语言单测.md",
        "/Go语言系列/Go编码规范/Go编码规范.md",
        {
          text: "Go面试题库",
          collapsible: true,
          children: [
            "/Go语言系列/Go面试题库/基础面试题.md",
            "/Go语言系列/Go面试题库/Slice面试题.md",
            "/Go语言系列/Go面试题库/Map面试题.md",
            "/Go语言系列/Go面试题库/Channel面试题.md",
            "/Go语言系列/Go面试题库/Sync面试题.md",
            "/Go语言系列/Go面试题库/Context面试题.md",
            "/Go语言系列/Go面试题库/Interface面试题.md",
            "/Go语言系列/Go面试题库/反射面试题.md",
            "/Go语言系列/Go面试题库/GMP面试题.md",
            "/Go语言系列/Go面试题库/内存管理面试题.md",
            "/Go语言系列/Go面试题库/垃圾回收面试题.md",
            "/Go语言系列/Go面试题库/代码面试题.md",
          ]
        },
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
  "/杂文":[
    {
      text: "宋词",   
      collapsible: true,
      children: [
        {
          text: "李煜",
          collapsible: true,
          children: ["/杂文/李煜/李煜1.md","/杂文/李煜/李煜2.md"]
        },
        {
          text: "辛弃疾",
          collapsible: true,
          children: ["/杂文/辛弃疾/辛弃疾1.md","/杂文/辛弃疾/辛弃疾2.md"]
        }
      ],
    }
  ],
  "/后端组件/":[
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
  "/AI进阶之路/":[
    {
      text: "AI进阶之路",
      collapsible: true,
      children: [
        {
          text: "生成式AI入门指南",
          collapsible: true,
          children: [
            "/AI进阶之路/生成式AI入门/生成式AI简介.md",
            "/AI进阶之路/生成式AI入门/理解机器学习.md",
          ]
        },
        {
          text: "大模型应用开发",
          collapsible: true,
          children: [
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
  "/面试题/":[
    {
      text: "高级程序员面试场景题",
      collapsible: true,
      children: ["/面试题/高级程序员面试题/消息丢失.md"]
    }
  ],
 
});
