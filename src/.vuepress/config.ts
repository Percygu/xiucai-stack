import { defineUserConfig } from "vuepress";
import { docsearchPlugin } from "@vuepress/plugin-docsearch";
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
    docsearchPlugin({
      appId: "3F08C0VVP6",
      apiKey: "0b8beebca043d79cd85521dd92654a5f",
      indexName: "xiucaistack",
      locales: {
        "/": {
          placeholder: "搜索文档",
          translations: {
            button: {
              buttonText: "搜索文档",
              buttonAriaLabel: "搜索文档",
            },
            modal: {
              searchBox: {
                resetButtonTitle: "清除查询条件",
                resetButtonAriaLabel: "清除查询条件",
                cancelButtonText: "取消",
                cancelButtonAriaLabel: "取消",
              },
              startScreen: {
                recentSearchesTitle: "搜索历史",
                noRecentSearchesText: "没有搜索历史",
                saveRecentSearchButtonTitle: "保存至搜索历史",
                removeRecentSearchButtonTitle: "从搜索历史中移除",
                favoriteSearchesTitle: "收藏",
                removeFavoriteSearchButtonTitle: "从收藏中移除",
              },
              errorScreen: {
                titleText: "无法获取结果",
                helpText: "你可能需要检查你的网络连接",
              },
              footer: {
                selectText: "选择",
                navigateText: "切换",
                closeText: "关闭",
                searchByText: "搜索提供者",
              },
              noResultsScreen: {
                noResultsText: "无法找到相关结果",
                suggestedQueryText: "你可以尝试查询",
                reportMissingResultsText: "你认为该查询应该有结果？",
                reportMissingResultsLinkText: "点击反馈",
              },
            },
          },
        },
      },
    }),
    sitemapPlugin({
      hostname: "https://xiucaistack.cn",
    }),
  ],

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
