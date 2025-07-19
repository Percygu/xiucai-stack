import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "Go语言进阶之路",
    icon: "book",
    link: "/go_series/introduction.md",
  },
  {
    text: "后端进阶之路",
    icon: "chart-simple",
    link: "/后端进阶之路/面试场景题/微服务架构核心：服务注册与发现的AP与CP抉择.md",
  },
  {
    text: "AI进阶之路",
    icon: "robot",
    link: "/AI进阶之路/生成式AI入门/人工智能导论.md",
  },
]);
