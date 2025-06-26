import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "Go语言进阶之路",
    icon: "book",
    link: "/Go语言系列/",
  },
  {
    text: "后端进阶之路",
    icon: "chart-simple",
    children: [
      {
        text: "面试场景题",
        icon: "question",
        children: [
          "/后端进阶之路/面试场景题/Go程序数据库连接池耗尽如何排查.md",
          "/后端进阶之路/面试场景题/Java线上接口响应慢如何排查.md",
        ]
      }
    ],
  },
  {
    text: "架构学习之路",
    icon: "server",
    children: [
      {
        text: "Mysql",
        icon: "database",
        link: "/后端组件/Mysql/mysql.md",
      },
      {
        text: "Redis",
        icon: "database",
        link: "/后端组件/Redis/redis.md",
      },
      {
        text: "面试题",
        icon: "question",
        children: [
          {
            text: "高级程序员面试场景题",
            icon: "book",
            link: "/面试题/高级程序员面试题/消息丢失.md",
          },
        ],
      },
    ],
  },
  {
    text: "AI进阶之路",
    icon: "robot",
    link: "/AI进阶之路/",
  },
  {
    text: "V2 文档",
    icon: "book",
    link: "https://theme-hope.vuejs.press/zh/",
  },
]);
