import { defineUserConfig } from "vuepress";

import theme from "./theme.js";
import { docsearchPlugin } from '@vuepress/plugin-docsearch'
import toolBarPlugin from "vuepress-plugin-toolbar"

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "秀才客栈",
  description: "秀才学习客栈",

  theme,

  plugins: [


    docsearchPlugin({
      locales: {
        '/': {
          placeholder: 'Search',
        },
        '/zh/': {
          placeholder: '搜索',
        },
      },
    }),

  ],



  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
