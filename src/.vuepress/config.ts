import { defineUserConfig } from "vuepress";
import sitemapPlugin from "vuepress-plugin-sitemap";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "秀才的进阶之路",
  description: "通俗易懂、风趣幽默的技术学习指南，涵盖Go语言、AI应用、后端架构、面试攻略等核心知识点",
  
  head: [
    ["link", { rel: "icon", href: "/web_logo2.png" }],
  ],

  theme,

  plugins: [
    sitemapPlugin({
      hostname: "https://xiucaistack.cn",
    }),
  ],

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
