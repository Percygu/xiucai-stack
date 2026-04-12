import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "Go语言进阶之路",
    icon: "book",
    link: "/go_series/introduction.md",
  },
  {
    text: "🔥后端/AI面试题",
    //icon: "chart-simple",
    link: "/backend_series/advanced_interview/load_balance.md",
  },
  {
    text: "🤖Go Agent实战指南",
    //icon: "robot",
    link: "/go_agent_series/llm_base/llm_overview.md",
  },
  {
    text: "🧑‍💻程序人生",
    link: "/life_series/35.md",
  },
  {
    text: "🌟求职训练营🌟",
    //icon: "user",
    link: "/offer.md",
  },
  {
    text: "关于作者",
    icon: "user",
    link: "/about-author.md",
  },
  
]);
