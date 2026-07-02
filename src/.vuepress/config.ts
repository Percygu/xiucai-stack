import { defineUserConfig } from "vuepress";
import { readmorePlugin } from "vuepress-plugin-readmore-popular-next";
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
    // 百度站长验证
    ["meta", { name: "baidu-site-verification", content: "codeva-huKj7TCOQm" }],
    // Bing站长验证
    ["meta", { name: "msvalidate.01", content: "68574E14F538D261A948C3E5F815E169" }],
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
    readmorePlugin({
      // 填写 TechGrow 后台博客 ID 和公众号自动回复关键词后，解锁功能才会正式可用。
      blogId: "06470-0293055288582-940",
      name: "IT杨秀才",
      keyword: "验证码",
      qrcode: "/assets/icon/IT_yangxiucai.jpg",
      selector: "div[vp-content]",
      cssUrl: "https://qiniu.techgrow.cn/readmore/dist/vuepress2.css",
      reverse: true,
      excludes: {
        strExp: [
          "/backend_series/advanced_interview/*",
          "/backend_series/distributed_interview/*",
          "/backend_series/go_interview/*",
          "/backend_series/llm_interview/*",
          "/backend_series/mq_interview/*",
          "/backend_series/mysql_interview/*",
          "/backend_series/redis_interview/*",
          "/go_series/go_interview/*",
          "/vibe_coding_series/*",
          "/面试题/*",
        ],
        regExp: ["^/go_agent_series/(?!introduction\\.html$|eino_basic/eino_overview\\.html$).+"],
      },
      allowMobile: false,
      height: 1600,
      random: 1.0,
    }),
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
