import { defineUserConfig } from "vuepress";
import sitemapPlugin from "vuepress-plugin-sitemap";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "秀才的进阶之路",
  description: "通俗易懂、风趣幽默的技术学习指南，涵盖Go语言、AI应用、后端架构、面试攻略等核心知识点",

  head: [
    // 首先设置标准favicon.ico（浏览器地址栏优先使用这个）
    ["link", { rel: "icon", href: "/favicon.ico", type: "image/x-icon" }],
    ["link", { rel: "shortcut icon", href: "/favicon.ico", type: "image/x-icon" }],
    
    // 然后提供PNG格式的图标作为备用和其他场景使用
    ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/web_logo2.png" }],
    ["link", { rel: "icon", type: "image/png", sizes: "16x16", href: "/web_logo2.png" }],
    ["link", { rel: "apple-touch-icon", href: "/web_logo2.png" }],
    
    ["meta", { name: "docsearch:language", content: "zh-CN" }],
    // 默认canonical链接，将在页面渲染时被替换为实际URL
    ["link", { rel: "canonical", href: "https://golangstar.cn" }],
    // 添加复制按钮JavaScript文件
    ["script", { src: "/js/copy-code.js" }],
    // 添加防复制脚本
    ["script", { src: "/js/anti-copy.js" }],
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
