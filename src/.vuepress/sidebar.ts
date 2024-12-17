import { sidebar } from "vuepress-theme-hope";

// 左侧侧边栏
export default sidebar({
  "/": [
    "",             // 项目主页，即HOME，对应.vuepress目录下的README.md
    "portfolio",    // 档案主页,对应.vuepress目录下的portfolio.md
    {
      text: "案例",
      icon: "laptop-code",
      prefix: "demo/",
      link: "demo/",
      children: "structure",
    },
    {
      text: "文档",
      icon: "book",
      prefix: "guide/",
      children: "structure",
    },
    {
      text: "幻灯片",
      icon: "person-chalkboard",
      link: "https://ecosystem.vuejs.press/zh/plugins/markdown/revealjs/demo.html",
    }
  ],
  "/Go语言系列/":[
    {
      text: "Go语言系列",
      collapsible: true,
      children: ["/Go语言系列/环境安装/环境安装.md"]
    },
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
  ]
});
