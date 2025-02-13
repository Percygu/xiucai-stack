import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/杂文/",
  {
    text: "Go语言系列",
    icon: "book",
    link: "/Go语言系列/Go语言前景/Go语言前景.md",
  },
  "/线上问题排查系列/",
  {
    text: "后端组件",
    icon: "gears",
    //prefix: "/后端组件/",
    children: [
      {
        text: "Mysql",
        icon: "book",
        link: "/后端组件/Mysql/mysql.md",
      },
      {
        text: "Redis",
        icon: "book",
        link: "/后端组件/Redis/redis.md",
      },
    ],
  },
  {
    text: "V2 文档",
    icon: "book",
    link: "https://theme-hope.vuejs.press/zh/",
  },
]);
