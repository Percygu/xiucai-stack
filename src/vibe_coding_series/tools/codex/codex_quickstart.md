---
title: 1. Codex 快速上手核心指南
description: Vibe Coding教程第29篇：Codex 快速上手核心指南。讲透 Codex 是什么、CLI 安装、用 ChatGPT 订阅登录、首次会话，以及终端 CLI、IDE 扩展、云端委托、GitHub 四种形态的总览与选择。
category:
  - Vibe Coding
tag:
  - Vibe Coding
  - AI编程
  - Codex
  - AI编程工具
---

如果说 Claude Code 是终端里的自主编码代理、Cursor 是 AI 原生的编辑器，那 Codex 给人的第一印象会有点不一样：它不是单一一个工具，而是 OpenAI 一整套形态——终端里有它、编辑器里有它、ChatGPT 网页里能调它、GitHub 上也有它的身影。它们背后共享同一个模型、同一个账号。

这种「一套大脑、多个入口」的设计，是 Codex 最该先建立的认知。这一篇带你把 Codex 上手打通：怎么装、怎么用 ChatGPT 账号登录、第一次会话怎么跑，以及那四种形态分别是什么、什么活该用哪个。

## **1. Codex 是什么**

Codex 是 OpenAI 的智能编码系统。注意这个词——它是一套系统，不是一个孤立的程序。它有好几个形态：在终端里运行的 CLI、嵌进编辑器的 IDE 扩展、在 ChatGPT 网页里委托任务的云端形态、以及挂在 GitHub 上的机器人。这些形态共享同一个底层模型和同一份账号上下文，所以你在哪个形态里干活，用的都是同一个 Codex。

它当前这一代跑在 GPT-5.5 上——OpenAI 专门为「智能体优先」训练的模型，擅长自主地一步步把一个编码任务做完。理解 Codex 的关键，就是把它看成一个能从多个入口召唤的同一个编码代理：你在终端、在编辑器、在网页、在 GitHub，召唤的是同一个它。

> 【建议配图1 —— Codex 多形态共享一个大脑】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的「中心辐射」图。正中央画 Codex 的核心——用 OpenAI/Codex 的黑色花瓣标志，标「同一个模型 GPT-5.5 + 同一个账号」，作为最大最醒目的焦点。从中央向四周辐射出四个形态入口，每个配图标和标签：「终端 CLI」（终端窗口图标）、「IDE 扩展」（VS Code/编辑器图标）、「云端委托」（ChatGPT 网页+云图标）、「GitHub」（黑色 GitHub 猫头图标）。四个入口用线连回中央，强调它们都通向同一个 Codex。配色语义：中央黑色为核心大脑，四个入口用各自平台色区分。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者第一眼建立「Codex 是一套共享同一大脑的多形态系统」的核心认知，而不是一个孤立工具。

## **2. 安装**

最常用的形态是终端 CLI，安装一条命令搞定。macOS 或 Linux 上：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Windows 用 PowerShell；如果你装了 Node，也可以用 npm 全局安装：

```bash
npm i -g @openai/codex
```

装完在终端敲 `codex` 就能启动。如果你更习惯在编辑器里干活，Codex 也提供 IDE 扩展，支持 VS Code、Cursor、Windsurf——在编辑器的扩展市场里搜 Codex 安装即可，它和 CLI 用的是同一个账号、同一个模型。

> 🔴待截图2 —— Codex CLI 安装完成、首次启动
>
> 截图位置：终端里跑完安装命令、首次敲 `codex` 启动的画面
> 截图内容：Codex CLI 启动后的欢迎/界面，或安装成功的提示
> 标注要求：用红框框出启动命令和界面
> 建议保存为：../../../assets/img/vibe_coding/tools/codex/codex_quickstart/codex_quickstart2.png

## **3. 用 ChatGPT 账号登录**

第一次运行 Codex，它会让你登录。最推荐的方式是用你的 ChatGPT 账号——如果你已经订阅了 ChatGPT（Plus、Pro、Business、Enterprise 任一），直接用它登录，额度就走你的订阅，不必再单独配 API key。这对国内用户也更省心：用订阅账号登录，比单独申请、充值 API 更直接。

另一种方式是用 API key 登录，适合你想按用量计费、或在自动化脚本里用的场景。普通上手用 ChatGPT 账号登录就好。登录的网络配置、国内可用性这些细节，环境搭建篇有专门一篇细讲，这里能登录进去即可。

> 🔴待截图3 —— Codex 登录界面（用 ChatGPT 账号）
>
> 截图位置：首次运行 Codex 时弹出的登录选择界面
> 截图内容：提供「用 ChatGPT 账号登录」和「用 API key 登录」两种选择的画面
> 标注要求：用红框框出「用 ChatGPT 账号登录」选项
> 建议保存为：../../../assets/img/vibe_coding/tools/codex/codex_quickstart/codex_quickstart3.png

## **4. 第一次会话**

登录后，进到一个你的项目目录，敲 `codex` 启动，就可以开始干活了。最好的熟悉方式是交它一个小任务。

先让它认识项目：「解释一下这个项目的结构和主要功能」，它会去读代码、给你概览。然后交个真正的小活，比如「给 README 补一个安装步骤说明」或「把这个函数加上参数校验」。你会看到它的工作方式——它读相关文件、规划、动手改、必要时在沙箱里跑命令验证。和 Claude Code 类似，Codex 也是一个自主的终端代理：你说要什么，它一步步做，关键节点按你设的审批模式征求你同意。

CLI 的交互很直接：启动后是一个对话式界面，你打字描述需求、回车，它就开始干，过程中改文件、跑命令会按审批模式弹出确认让你批准或拒绝。一上来就让它干大活并不明智——先用小任务摸清它读哪些文件、怎么改、什么时候问你，建立起信任和体感，再逐步交给它更复杂的任务。另外，和 Claude Code 的 CLAUDE.md、Cursor 的 Rules 一样，Codex 也能读项目根目录的 `AGENTS.md` 来了解你项目的约定——这是下一篇的主题，先记住它的存在：把项目规矩写进 `AGENTS.md`，Codex 干活时就自动遵守。

> 🔴待截图4 —— Codex 完成第一个小任务
>
> 截图位置：在一个项目里用 codex 交一个小任务（如补 README、加参数校验）后的过程
> 截图内容：Codex 读文件、改动、给出结果的会话画面
> 标注要求：用红框框出它的改动和结果
> 建议保存为：../../../assets/img/vibe_coding/tools/codex/codex_quickstart/codex_quickstart4.png

## **5. 四种形态总览**

回到那个核心特点——多形态。把四种形态分清，你才知道什么活在哪干最顺。

**终端 CLI** 是最核心、最灵活的形态，在你本地终端跑，适合日常在命令行里干活、跑脚本、深度自主的任务，也是本系列后面几篇主要演示的形态。**IDE 扩展**把 Codex 嵌进 VS Code、Cursor、Windsurf，适合你习惯在编辑器里边写边用、想要图形化看 diff 的场景——它和 CLI 同账号同模型，只是入口在编辑器里。**云端委托**在 ChatGPT 网页里——你用自然语言描述任务，Codex 在云端开一个沙箱环境、克隆你的仓库、自己把活干完，适合放手让它在云端跑、不占你本地，还能同时委托好几个任务并行。**GitHub** 形态让它直接在你的仓库上干活、参与 PR 流程，适合把它接进团队的代码评审。此外它还有读屏操作电脑的 computer-use 能力，属于更前沿的形态，日常先不展开。

这四种形态最妙的地方在于它们是连贯的：因为共享账号和上下文，你可以在云端委托一个任务，回头在本地 CLI 把它拉下来接着调；或者在 IDE 里写着写着，把一个大活甩到云端去跑。不是四个割裂的工具，而是同一个 Codex 的四个入口。

> 【建议配图5 —— Codex 四种形态对比】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的四栏卡片对比图，介绍 Codex 四种形态。每栏一个图标、名称、主题色和一句定位：①「终端 CLI」（终端图标，蓝）「本地命令行、最灵活、深度自主」；②「IDE 扩展」（编辑器图标，紫）「嵌进 VS Code/Cursor/Windsurf，边写边用」；③「云端委托」（ChatGPT+云图标，绿）「网页里派任务，云端沙箱克隆仓库自己干」；④「GitHub」（GitHub 猫头图标，橙）「在仓库上干活、参与 PR」。四栏等宽并列，底部一行小字「四种形态共享同一模型与账号」。配色语义：蓝=本地终端、紫=编辑器、绿=云端、橙=GitHub。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者一览 Codex 四种形态各自的定位，知道分别适合什么场景。

## **6. 各形态怎么选**

选形态，看这个任务你要不要互动、要不要占本地、要不要进 PR 流程。

要边看边调、即时反馈的活，用终端 CLI 或 IDE 扩展，它就在你眼前。喜欢命令行、要跑脚本和管道的用 CLI；喜欢在编辑器里边写边用的用 IDE 扩展。能交代清楚、放手让它在云端慢慢做、不占你本地、还想并行多个的活，用云端委托。要和团队的代码评审、PR 流程绑在一起的，用 GitHub 形态。

一个朴素判断：**要互动留本地（CLI/IDE），能放手丢云端，要进 PR 流程上 GitHub。** 这套「本地 vs 云端」的取舍，和你在 Cursor 的本地 Agent vs 云端代理那一篇里见过的思路是一样的。

> 【建议配图6 —— Codex 形态选择决策图】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的纵向决策树。顶部起点框（灰色）「我有个任务，用哪种 Codex 形态？」。第一个菱形（橙色）「需要边看边调、即时互动吗？」：「是」分支再分两路——「喜欢命令行」指向蓝色框「终端 CLI」、「喜欢在编辑器里」指向紫色框「IDE 扩展」。「否（能放手）」向下到第二个菱形「要和 PR/代码评审绑定吗？」：「是」指向橙色框「GitHub 形态」；「否」指向绿色框「云端委托（沙箱里自己跑、可并行）」。判断节点用橙色菱形，结果框按形态配色。配色语义：蓝=CLI、紫=IDE、绿=云端、橙=GitHub。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：给读者一套照着走就能选对 Codex 形态的决策流程。

## **7. 审批模式初识**

Codex 干活时，会按你设的审批模式决定它能多放手——改文件、跑命令前要不要先问你。和 Claude Code 的权限模式、Cursor 的模式是一个道理：从「每步都问你确认」的谨慎挡，到「在沙箱里自主连续干」的放手挡，你按对这个任务的信任程度来选。新手建议从需要确认的挡位起步，熟悉它的行为后再逐步放手。审批模式和沙箱安全的细节，本系列后面有专门一篇深入讲，这里先知道有这么个「放手程度」的开关即可。

> 【建议配图7 —— Codex 审批模式的放手光谱】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的横向光谱条，从左到右「越谨慎 ←→ 越放手」。左端（绿色，盾牌图标）「每步改文件/跑命令都先问你」；中间（橙色，半自动图标）「自动改、但危险操作仍确认」；右端（红色，火箭图标）「在沙箱里自主连续干」。光谱条下方小字「按你对这个任务的信任程度选，新手从谨慎端起步」。配色语义：绿=谨慎安全、橙=折中、红=放手（沙箱兜底）。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者初步理解 Codex 有一个「放手程度」开关，知道它干活前会按审批模式决定要不要先问你。

## **8. 常见问题**

**Q：Codex 和 ChatGPT 是一回事吗？**
不是。ChatGPT 是对话助手，Codex 是专门的编码代理。但它们能共用账号——你可以用 ChatGPT 订阅登录 Codex，也能在 ChatGPT 网页里委托 Codex 干活（云端形态）。

**Q：一定要单独买 API 吗？**
不用。有 ChatGPT 订阅（Plus/Pro 等）就能直接登录 Codex 用，对国内用户尤其省事。想按量计费再用 API key。

**Q：CLI 和 IDE 扩展能同时用吗？**
能。它们共享同一账号同一模型，你可以在终端用 CLI、在编辑器用扩展，按手头的活切换。

**Q：Codex 和 Claude Code 像吗？**
终端 CLI 形态很像——都是自主的终端编码代理。差别在 Codex 是多形态系统（还有 IDE/云端/GitHub），底层是 GPT-5.5。具体用法各有特色，后面几篇展开。

## **9. 小结**

Codex 的上手，关键是先建立「一套大脑、多个入口」的认知：终端 CLI、IDE 扩展、云端委托、GitHub，四种形态共享同一个 GPT-5.5 模型和同一份账号。安装一条命令、用 ChatGPT 订阅登录，就能在终端里跑起来，交它一个小任务感受它自主干活的方式。

选形态的标准也简单：要互动留本地的 CLI 或 IDE，能放手丢云端委托，要进 PR 流程上 GitHub；它干活的放手程度由审批模式控制。把这套总览装进脑子，后面几篇 AGENTS.md、命令、Skills、MCP、云端任务、沙箱审批，就都是在这个框架上深入了。

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
