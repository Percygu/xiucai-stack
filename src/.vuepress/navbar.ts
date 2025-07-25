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
    link: "/backend_series/advanced_interview/service_registry.md",
  },
  {
    text: "AI进阶之路",
    icon: "robot",
    link: "/ai_series/generative_ai/ai_introduction.md",
  },
  {
    text: "26届秋招企业汇总表",
    icon: "table",
    link: "/26jobs.md",
  },
  {
    text: "关于作者",
    icon: "user",
    link: "/about-author.md",
  },
]);
