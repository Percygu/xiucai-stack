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
    link: "/backend_series/llm_interview/agent_definition.md",
  },
  {
    text: "🤖Go Agent实战指南",
    //icon: "robot",
    link: "/go_agent_series/introduction.md",
  },
  {
    text: "🔥Vibe Coding实战指南",
    //icon: "code",
    link: "/vibe_coding_series/basics/what_is_vibe_coding.md",
  },
  {
    text: "🔥Agent项目",
    //icon: "chart-simple",
    link: "/projects/dev-support.md",
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
