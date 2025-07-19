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
]);
