---
title: 5. MCP 集成与多模型完全指南
description: Vibe Coding教程第26篇：Cursor MCP 集成与多模型完全指南。讲透在 .cursor/mcp.json 配置 MCP server、一键安装与常用 server，以及 Composer、Sonnet、Opus 等多模型的选择策略。
category:
  - Vibe Coding
tag:
  - Vibe Coding
  - AI编程
  - Cursor
  - AI编程工具
---

Cursor 有两个能力，是它区别于「只会聊天的编辑器」的关键：一是能接 MCP，让它直接连上 GitHub、数据库、浏览器这些外部工具，自己去读去写，不必你来回复制粘贴；二是能随时切换底层模型，同一个对话框背后可以是 Claude、GPT、Gemini，也可以是 Cursor 自研的模型，按活的难易和预算挑。

这一篇把这两件事讲透：在 Cursor 里怎么配 MCP、有哪些常用 server，以及面对一长串模型该怎么选、什么活用什么模型最划算。

## **1. 在 Cursor 里配 MCP**

MCP（Model Context Protocol）是什么、为什么要用，本系列在 Claude Code 的 MCP 篇里已经讲透了——一句话回顾：它是一个开放标准，让 AI 直接连上外部工具和数据源，自己去调用，省掉你人肉搬运信息的功夫。因为是开放标准，同一个 server 既能接进 Claude Code，也能接进 Cursor，概念完全通用。这里只讲 Cursor 这边怎么配。

Cursor 的 MCP 配置放在一个 `mcp.json` 文件里，有两个位置：项目根目录的 `.cursor/mcp.json` 只对当前项目生效（可提交 git 团队共享），用户主目录的 `~/.cursor/mcp.json` 对你所有项目生效。除了直接写文件，更省事的是用界面——在 Settings → Tools & MCP 里管理 server，还能从 Cursor 的市场或社区目录（cursor.directory）一键安装现成的 MCP server，不用手动写配置。

> 【建议配图1 —— Cursor 里 MCP 的两个配置位置】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的对比图。左半「项目级」配绿色：画一个项目文件夹，里面有 `.cursor/mcp.json`，标「只对当前项目生效，可提交 git 共享给团队」，旁边一个 git+队友图标。右半「全局级」配蓝色：画一个用户主目录图标，里面有 `~/.cursor/mcp.json`，标「对你所有项目都生效」，连向多个项目图标。底部横跨一条带 Cursor 黑色立方体图标的小条，标「也可在 Settings → Tools & MCP 界面管理，或从市场一键安装」。配色语义：绿=项目共享、蓝=个人全局。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者分清 Cursor 的 MCP 两个配置位置（项目级 vs 全局）以及界面管理入口。

## **2. 配一个 server 实战**

`mcp.json` 的结构是一个 `mcpServers` 对象，每个 server 一个条目，写清启动命令、参数、环境变量。配一个本地 server 大致长这样：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "你的令牌" }
    }
  }
}
```

写好后，回到 Cursor 在 Settings → Tools & MCP 里能看到这个 server 的连接状态，连上后它提供的工具就进入了 Agent 的可用工具池——你让 Agent 干活时，它会在需要时自动调用，比如让它「看看 GitHub 上指派给我的 issue」，它就自己去读。带密钥的 server，注意把 `env` 里的令牌当敏感信息处理，别提交进公开仓库。

> 🔴待截图2 —— Cursor 设置里的 Tools & MCP 管理界面
>
> 截图位置：Cursor 的 Settings → Tools & MCP 页面
> 截图内容：已配置的 MCP server 列表及连接状态，以及一键安装/添加 server 的入口
> 标注要求：用红框框出 server 连接状态和添加入口
> 建议保存为：../../../assets/img/vibe_coding/tools/cursor/cursor_mcp/cursor_mcp2.png

一份配多个 server 的 `mcp.json` 就是在 `mcpServers` 下并列写多条，比如同时接 GitHub、浏览器自动化和数据库：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "你的令牌" }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

常用的 server 和 Claude Code 那边基本一致：GitHub 让它读写 issue 和 PR、按 issue 改代码提 PR；数据库 server 让它直接查你的库、边开发边核对真实数据；浏览器自动化（Playwright）让它打开你做的页面、截图、验证交互，对前端开发特别有用；Notion、Linear 等协作工具让它直接读需求和任务卡片。判断要不要接的标准也一样——当你发现自己反复从某个工具复制内容粘进对话时，就把它接进来。接 server 的完整玩法、作用域、排错，可以回看 Claude Code 的 MCP 篇，那套思路在 Cursor 这边同样适用，区别只在配置文件的位置和格式。

## **3. 多模型自由切换**

这是 Cursor 一个很突出的特色：它不绑死某一家模型，而是让你在一长串模型里随时挑。聊天面板顶部有个模型选择器，点开就能看到当前可选的模型、随时切换。

截至目前，Cursor 接入的模型覆盖了几家主流厂商，加上它自研的两个：Anthropic 的 Claude（Sonnet、Opus 等）、OpenAI 的 GPT 系列、Google 的 Gemini、xAI 的 Grok，以及 Cursor 自己的 Composer 和 Fusion。这种多模型策略的好处是，你不必为了换模型换工具，在同一个编辑器里就能按需调用最适合的那个。

> 【建议配图3 —— Cursor 的多模型选择器】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的「模型货架」图。中央画一个 Cursor 对话面板顶部的模型选择器下拉框（黑色立方体 Cursor 图标旁），下拉展开后列出多家模型，每家用各自品牌图标和主色区分并分组：Anthropic 区（Claude 橙色星芒）列「Sonnet」「Opus」；OpenAI 区（黑色花瓣）列「GPT 系列」；Google 区（Gemini 蓝紫渐变菱形）列「Gemini」；xAI 区（Grok 黑色 X）列「Grok」；Cursor 自研区（黑色立方体）列「Composer（自研 Agent 模型）」「Fusion（驱动 Tab）」。每个模型条目用小图标+名称。顶部标「随时切换，不绑死一家」。配色语义：各家用各自品牌色，自研区单独高亮。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者看清 Cursor 能在一个编辑器里调用多家厂商和自研模型，建立「按需选模型」的概念。

## **4. 各模型怎么选**

模型一多，新手容易犯选择困难。其实抓住几个关键差异就够了。

**Composer** 是 Cursor 自研的 Agent 模型，专为编辑器深度优化、延迟低、擅长在代码库里持续干活，性价比是它的长处——日常大量的常规编码任务用它又快又省。**Claude 的 Sonnet** 是均衡之选，能力和速度兼顾，是很多人写代码的默认主力。**Claude 的 Opus** 是最强档，擅长复杂推理和难题，适合架构设计、棘手 bug 这种需要深度思考的活，但更贵更慢。**GPT 系列**和 **Gemini** 各有所长，可以在某类任务上当备选对比着用。而 **Fusion** 你其实一直在用——它是驱动 Tab 补全的那个模型，专为低延迟的下一步预测而生。

把它们的定位列成一张表对照着看更清楚：

| 模型 | 出身 | 擅长 | 什么时候用 |
|------|------|------|-----------|
| Composer | Cursor 自研 | 低延迟、代码库内持续干活、性价比高 | 日常大量常规编码 |
| Sonnet | Anthropic | 能力与速度均衡 | 写代码的默认主力 |
| Opus | Anthropic | 复杂推理、啃难题 | 架构设计、棘手 bug、性能优化 |
| GPT 系列 | OpenAI | 另一种思路，综合能力强 | 当备选、对比方案 |
| Gemini | Google | 长上下文、多模态 | 大范围分析、备选对比 |
| Fusion | Cursor 自研 | 极低延迟的下一步预测 | 驱动 Tab 补全（你一直在用） |

一句话记：**日常常规编码用 Composer 或 Sonnet，啃硬骨头切 Opus，Tab 补全背后是 Fusion。** 具体哪个版本号最新、各家又出了什么新模型，会一直变，但「自研省钱档 / 均衡主力档 / 最强攻坚档」这套分层是稳定的，按这个分层去对号即可。

> 【建议配图4 —— 按任务难度和成本选模型】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的二维定位图（象限图）。横轴标「任务难度：简单 → 复杂」，纵轴标「成本/算力：低 → 高」。在象限里摆放几个模型气泡，按定位放置并配品牌色：左下（简单、低成本）放「Composer 自研」（黑色立方体，绿色高亮，标「日常编码、快而省」）和「Fusion」（标「驱动 Tab 补全」）；中部（均衡）放「Sonnet」（橙色星芒，标「能力速度兼顾、默认主力」）；右上（复杂、高成本）放「Opus」（橙色星芒，深色，标「架构/难题深度推理」）；旁边再放「GPT / Gemini / Grok」（各品牌色，标「备选、可对比着用」）。气泡大小可随算力递增。配色语义：绿=高性价比、橙=主力与最强、其他家用各自色。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者用「任务难度 × 成本」两个维度，一眼定位每个模型适合干什么，告别选择困难。

## **5. 模型选择策略**

知道了各模型的定位，实战里怎么用？三条原则。

**按任务难度换挡。** 简单、重复的活（补全、改个小函数、套路化的 CRUD）用快而省的模型；复杂、要深度思考的活（架构取舍、棘手 bug、性能优化）切到最强的模型。别用最贵的模型干最简单的活，也别用最快的模型硬啃难题。

**先用便宜的试，不行再升。** 一个任务先用性价比高的模型跑一遍，结果满意就省了钱；如果它卡住了、方案不对，再切到更强的模型重试。这样大部分任务用便宜模型解决，只有少数硬骨头才动用贵模型。

**同一难题可以换模型对比。** 遇到一个棘手问题，不同模型的思路可能不一样。让 Sonnet 给个方案，再让 Opus 或 GPT 给一个，对比着看——这是多模型的一个隐藏价值，单一模型工具给不了。

这套策略的内核和 Claude Code 里用 `/model` 切换、按活选模型是一致的：把模型当成有不同性价比的工具，按手头的活挑最合适的那个，而不是从头到尾只用一个。

这里还要提醒一点用量成本的事，因为它直接关系到你的钱包。Cursor 的订阅有用量额度，不同模型消耗额度的速度差别很大——自研的 Composer 这类性价比模型消耗低，Opus、GPT 这类最强档消耗高。所以「日常用便宜模型、难题才升级」不只是为了速度，也实实在在地省额度。如果你发现额度掉得快，多半是把贵模型当默认在用了，换成 Composer 或 Sonnet 当主力能立刻缓解。具体每个模型怎么计费、订阅怎么选，会随官方政策变动，用之前在 Cursor 的用量页确认当前规则即可。

## **6. 常见问题**

**Q：MCP server 配了连不上？**
先在 Settings → Tools & MCP 看状态。本地 server 确认启动命令（`npx` 那条）能单独跑通、需要的环境变量（如令牌）填了；远程 server 检查 URL 和认证。这套排错和 Claude Code 的 MCP 篇完全一致。

**Q：项目级和全局级 MCP 配置冲突了听谁的？**
项目级 `.cursor/mcp.json` 针对当前项目，全局 `~/.cursor/mcp.json` 对所有项目。想团队共享就放项目级提交 git，想自己跨项目用就放全局。

**Q：模型那么多，我就想要个默认主力？**
日常用 Composer 或 Claude Sonnet 当默认完全够用，遇到难题再临时切 Opus。不必每次纠结，养成「默认主力 + 难题升级」的习惯就好。

**Q：换模型会丢掉当前对话吗？**
不会，模型选择器随时切，当前对话照常继续，只是后续回复换成新模型来生成。

## **7. 小结**

MCP 和多模型，是 Cursor 把「能用」推向「好用」的两块关键拼图。MCP 让它能直接对接 GitHub、数据库、浏览器等外部世界，在 `.cursor/mcp.json` 里配好、或从界面一键装上，Agent 就多了一整套外部工具——这套概念和 Claude Code 完全通用，迁移无门槛。多模型则让你在一个编辑器里调度多家厂商和自研模型，按任务难度和成本灵活换挡：日常用 Composer 或 Sonnet 又快又省，硬骨头切 Opus 深度啃，必要时换模型对比方案。

把这两件用顺，Cursor 在你手里就不只是个补全工具，而是一个既能连通你整套工具链、又能按需调用最合适大脑的开发伙伴。

<div style="background-color: #f0f9eb; padding: 10px 15px; border-radius: 4px; border-left: 5px solid #67c23a; margin: 20px 0; color:rgb(64, 147, 255);">

<h2><span style="color: #006400;"><strong>关注秀才公众号：</strong></span><span style="color: red;"><strong>IT杨秀才</strong></span><span style="color: #006400;"><strong>，回复：</strong></span><span style="color: red;"><strong>面试</strong></span></h2>

<div style="text-align: center;"><span style="color: #006400; font-size: 28px;"><strong>领取后端/AI面试题库PDF</strong></span></div>

![](/assets/icon/avatar.png)

<div style="text-align: center; margin-top: 22px; padding-top: 20px; border-top: 1px solid #c2e7b0;">
<div style="color: #006400; font-size: 20px; font-weight: bold;">🔥 配套实战项目，拆得开、跑得起、能写进简历</div>
<div style="color: red; font-size: 16px; font-weight: bold; margin-top: 8px;">多 Agent 编排 + RAG 混合检索 · 31 篇深度教程 + 50+ 面试题</div>
<a href="/projects/dev-support.html" style="display: inline-block; margin-top: 14px; background: #ff7a18; color: #fff; font-size: 18px; font-weight: bold; padding: 10px 28px; border-radius: 24px; text-decoration: none;">点击查看 DevSupport AI 实战项目 →</a>
</div>
</div>
