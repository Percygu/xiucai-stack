import { sidebar } from "vuepress-theme-hope";


// 左侧侧边栏
export default sidebar({
  "/Go语言系列/": [
    {
      text: "Go语言系列",
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
          ]
        },
        "/Go语言系列/Go编码规范/Go编码规范.md",
      ],
    },
  ],
  "/线上问题排查系列/": [
    "/线上问题排查系列/Java线上接口响应慢如何排查.md",
    "/线上问题排查系列/Go程序数据库连接池耗尽如何排查.md"
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
 
});
