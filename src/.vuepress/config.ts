import { defineUserConfig } from "vuepress";
import sitemapPlugin from "vuepress-plugin-sitemap";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "秀才的进阶之路",
  description: "通俗易懂、风趣幽默的技术学习指南，涵盖Go语言、AI应用、后端架构、面试攻略等核心知识点",

  head: [
    // 基本favicon设置
    ["link", { rel: "icon", href: "/web_logo2.png" }],
    ["link", { rel: "shortcut icon", href: "/web_logo2.png" }],
    // 添加各种尺寸的图标以确保兼容性
    ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/web_logo2.png" }],
    ["link", { rel: "icon", type: "image/png", sizes: "16x16", href: "/web_logo2.png" }],
    ["link", { rel: "apple-touch-icon", href: "/web_logo2.png" }],
    // 删除对favicon.ico的引用，避免覆盖web_logo2.png
    
    ["meta", { name: "docsearch:language", content: "zh-CN" }],
    // 默认canonical链接，将在页面渲染时被替换为实际URL
    ["link", { rel: "canonical", href: "https://golangstar.cn" }],
    // 百度统计
    [
      "script",
      {},
      `var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?06d8b22f1a62d469e92f5bef68d96d63";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();`
    ],
  ],

  theme,

  plugins: [
    sitemapPlugin({
      hostname: "https://golangstar.cn",
      // 确保使用正确的URI编码生成sitemap
      changefreq: "weekly",
      exclude: ["/404.html"],
    }),
  ],

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
