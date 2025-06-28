import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "Go语言进阶之路",
    icon: "book",
    link: "/Go语言系列/Go语言前景/Go语言前景.md",
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
    text: "AI进阶之路",
    icon: "robot",
    link: "/AI进阶之路/",
  },
]);
