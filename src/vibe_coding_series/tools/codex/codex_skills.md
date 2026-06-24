---
title: 4. Skills 完全指南
description: Vibe Coding教程第32篇：Codex Skills 完全指南。讲透 SKILL.md 目录结构、技能存放位置、显式与隐式调用、三层渐进加载、skill-installer 安装，以及跨工具通用的 Agent Skills 开放标准。
category:
  - Vibe Coding
tag:
  - Vibe Coding
  - AI编程
  - Codex
  - AI编程工具
---

上一篇结尾提过，Codex 的自定义 Prompt 正在让位给 Skills。这一篇就来讲 Skills——它是 Codex 封装可复用工作流的更强形态，把一套专业指令、参考资料、甚至可执行脚本打包成一个技能包，需要时由 Codex 自动调用或你手动触发。

如果你看过本系列 Claude Code 的 Skills 篇，会有强烈的既视感——因为它们用的是同一个开放标准。这恰恰是 Skills 最值得讲的一点：写一份技能，多个工具都能用。这一篇讲透 Codex 的 Skills：怎么组成、放哪、怎么调用、怎么装现成的，以及那个让它跨工具通用的开放标准。

## **1. Skills 是什么**

一个 Skill 是一个目录，里面有一个 `SKILL.md` 文件，写着这个技能是干什么的、该怎么一步步做，可以再配上脚本和参考资料。当你的任务匹配上某个技能的描述时，Codex 自动加载它的指令照着干；你也可以手动点名调用。

它要解决的，是把你反复用到的流程沉淀下来：按团队规范审查代码、生成符合格式的提交信息、跑一套固定的发布检查。与其每次重打一段长指令，不如封装成技能一次写好。Codex 的 Skills 在 2025 年底作为实验特性推出后，很快成了它最重要的能力之一——因为它把「教 AI 一套专门流程」这件事变得可复用、可分享。

> 【建议配图1 —— Skills 打包可复用工作流】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的「打包」示意图。左侧画三个零散的元素（一段指令文档、一个脚本文件、一份参考资料），用箭头汇入中央一个礼包/积木盒子（贴 `SKILL.md` 标签）。盒子右侧连向 Codex（黑色花瓣图标），Codex 据此干活、输出整齐结果（绿对勾）。盒子下方小字「打包：指令 + 脚本 + 参考资料 = 一个可复用技能」。配色语义：绿=封装成技能、Codex 黑色为执行方。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者理解 Skill 是把指令、脚本、参考资料打包成一个可复用工作流的技能包。

## **2. 一个 Skill 由哪些文件组成**

Skill 是一个目录，`SKILL.md` 是入口和核心，其余是可选配套：

```text
my-skill/
├── SKILL.md          # 必需：技能定义（名字、描述、指令）
├── scripts/          # 可选：可执行脚本
└── references/       # 可选：参考文档（用时才加载）
```

`SKILL.md` 上面是带 `name` 和 `description` 的 frontmatter，下面是指令正文。一个代码审查技能大致这样：

```markdown
---
name: review-code
description: 审查当前改动的质量、安全与测试覆盖。用户说审查代码、看看这次改动时使用。
---

## 审查流程
1. 看清这次改动涉及哪些文件
2. 逐项检查：命名、错误处理、边界情况、安全风险、重复逻辑
3. 按「严重 / 建议 / 可选」给出问题，每条贴出问题代码并给改进版
```

`description` 是最关键的字段——Codex 靠它判断什么时候该自动用这个技能，所以要写清「做什么 + 什么时候用」，把用户可能说的话写进去。这套写法和 Claude Code 的 SKILL.md 一模一样，因为它们是同一个标准。

## **3. Skill 放在哪**

Codex 找技能的位置有两类。项目级放在 `.agents/skills/` 下，Codex 会从你当前所在目录一路向上扫到仓库根目录，把沿途每个 `.agents/skills/` 里的技能都纳入——所以你既能在仓库根放全项目通用的技能，也能在子目录放模块专属的。用户级放在 `~/.agents/skills/` 下，对你所有项目生效，适合放你个人离不开的通用技能。

项目级技能提交到 git，团队每个人拉下来就共享了同一套技能——这是 Skills 比上一篇的自定义 Prompt（只存本地、不随仓库走）更适合团队的关键。

> 【建议配图2 —— Skill 的两类存放位置】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的图。左半「项目级」配绿色：画一个项目目录树，根目录和子目录里都有 `.agents/skills/`，用一个向上的箭头表示「从当前目录逐级向上扫到仓库根」，旁边一个 git+队友图标标「提交 git，团队共享」。右半「用户级」配蓝色：画一个用户主目录图标含 `~/.agents/skills/`，连向多个项目，标「对你所有项目生效」。中间竖虚线分隔。配色语义：绿=项目共享、蓝=个人全局。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者分清 Codex 技能的两类位置——项目级 .agents/skills（逐级向上扫、可 git 共享）和用户级 ~/.agents/skills。

## **4. 三层渐进加载**

Skills 能让你装一堆却不占上下文，靠的是渐进加载。Codex 启动时，只把每个技能的名字、描述和文件路径读进来——很轻；只有当它决定要用某个技能时，才加载那个技能完整的 `SKILL.md` 指令；技能目录里的脚本、参考资料更是用到才读。

这意味着你可以放心地装很多技能，启动开销极小，用到哪个才把哪个的完整内容调进来。这套机制和 Claude Code 的三层加载是同一回事——同一个标准，连省上下文的方式都一样。

> 【建议配图3 —— Skills 的三层渐进加载】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的三层阶梯图，自上而下展示加载时机。第一层（顶部，最窄，蓝色）：标签/名片图标，「① 名字+描述+路径」，右标「启动就加载 · 很轻」，画多个小技能图标排一行表示全部技能都加载这层。第二层（中间，橙色）：展开的文档图标，「② 完整 SKILL.md 指令」，右标「决定用时才加载」，只点亮一两个。第三层（底部，最宽，绿色）：脚本/资料文件夹图标，「③ 脚本·参考资料」，右标「用到才读、不占上下文」。层间向下箭头表示越晚加载越省。配色语义：蓝=常驻轻量、橙=按需、绿=用时取。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者理解 Codex 技能靠三层加载省上下文——只有名字描述常驻，完整指令和资料按需加载。

## **5. 两种调用方式**

技能怎么被用上，有两种方式。

显式调用是你主动点名：在 CLI 或 IDE 里敲 `/skills` 看可用技能列表，或直接打 `$` 提及某个技能来触发它。隐式调用是 Codex 自己判断：当你的任务匹配上某个技能的 `description`，它会自动选用，不必你点名。这也是为什么 `description` 要写好——它既是给你在菜单里认的，也是 Codex 自动匹配的依据。

一个实用习惯：明确知道要用哪个技能就用 `$` 直接点名，最快最准；不确定有没有合适的，就把任务说清楚、让 Codex 自己按描述去匹配。

> 【建议配图4 —— 显式调用 vs 隐式调用】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的左右对比图。左半「显式调用」配蓝色：画一个输入框打 `$review-code` 或敲 `/skills`，用户主动点名，一条直箭头精准触发某个技能（标「你主动点名，最快最准」）。右半「隐式调用」配绿色：画一个用户说「帮我看看这次改动有没有问题」的气泡，Codex（黑色花瓣）读到后，从一排技能里自动匹配并点亮 description 对得上的那个（标「Codex 按 description 自动选用」）。中间竖虚线分隔。配色语义：蓝=主动点名、绿=自动匹配。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者分清技能的两种触发方式——显式 $ 点名和隐式按描述自动匹配，知道各自什么时候用。

## **6. 安装现成 Skill 与写自己的**

不必全部从零写。OpenAI 维护了官方和社区的技能目录，你可以在 Codex 里用 `$skill-installer` 安装精选或实验性的现成技能，装完重启 Codex 让它生效。遇到常见需求（生成文档、代码审查、特定框架的脚手架），先看看目录里有没有现成的，往往拿来就能用。

写自己的也简单：在 `.agents/skills/` 或 `~/.agents/skills/` 下建一个技能目录，放一个写清 `name`、`description` 和步骤的 `SKILL.md` 即可，需要配套脚本就放进 `scripts/`。和写自定义 Prompt 相比，Skill 多了目录和配套文件的能力，还能被隐式自动调用——这正是它取代自定义 Prompt 的原因。

> 🔴待截图5 —— 用 $skill-installer 安装技能 / /skills 列表
>
> 截图位置：在 Codex 里用 $skill-installer 安装一个技能，或敲 /skills 查看已有技能列表
> 截图内容：技能安装过程，或 /skills 列出的可用技能清单
> 标注要求：用红框框出安装命令或技能列表
> 建议保存为：../../../assets/img/vibe_coding/tools/codex/codex_skills/codex_skills5.png

## **7. 跨工具通用的开放标准**

这一篇反复提到「和 Claude Code 一样」，背后是一个关键事实：Skills 用的是 Agent Skills 开放标准，`SKILL.md` 的格式是通用的。这意味着同一个技能，Codex 认、Claude Code 也认——你写一份代码审查技能，可以在两个工具里都用，不必各写一套。

这对常常多工具并用的人价值很大：你的技能库不绑死在某个工具上，而是一份可以跨工具携带的资产。再加上前面讲过的 `AGENTS.md` 也是跨工具开放约定，你会发现这一代 AI 编程工具正在共享越来越多的标准——这也是本系列把三大工具放在一起讲的底气：核心概念相通，技能和约定还能直接互通。

> 【建议配图6 —— 一份 SKILL.md，多个工具通用】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的图。中央画一个 `SKILL.md` 技能盒子（标「Agent Skills 开放标准」），从它向右用两条箭头分别连到两个工具：Codex（黑色花瓣图标）和 Claude Code（Claude 橙色星芒图标），各打一个绿色对勾「都认这份技能」。盒子下方小字「一份技能，跨工具通用，不绑死某个工具」。配色语义：中央技能为共享资产、两侧工具用各自品牌色。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者记住 Skills 是跨工具开放标准，一份 SKILL.md 能在 Codex、Claude Code 等多个工具通用。

## **8. 常见问题**

**Q：Skill 和自定义 Prompt 该用哪个？**
就一段指令、自己用，自定义 Prompt 仍方便。要带脚本/资料、想团队共享（放项目里提交 git）、或想让 Codex 自动调用的，用 Skill。官方方向是 Skills。

**Q：技能建好了不被调用？**
检查 `description` 是否具体、含用户会说的触发词；确认目录位置对（`.agents/skills/` 或 `~/.agents/skills/`）。装了新技能要重启 Codex 才生效。

**Q：我在 Claude Code 写的技能能在 Codex 用吗？**
能。`SKILL.md` 是 Agent Skills 开放标准，两边通用，把技能目录放到 Codex 的技能位置即可。

**Q：装很多技能会占满上下文吗？**
不会。三层加载下启动只读名字和描述，完整内容用到才加载，放心多装。

## **9. 小结**

Skills 是 Codex 封装可复用工作流的主力形态：把一套专业流程连同脚本、资料打包成一个带 `SKILL.md` 的技能包，放进 `.agents/skills/`（项目级、可 git 共享）或 `~/.agents/skills/`（用户级），靠写好的 `description` 让 Codex 在该用时显式点名或隐式自动调用，再靠三层加载做到装得多而不占上下文。

而它最大的价值，是建立在 Agent Skills 开放标准上的跨工具通用——一份技能 Codex 和 Claude Code 都认。把团队的流程沉淀成技能，你不仅省去了反复交代，还攒下了一份不绑死工具、能跨平台携带的资产。这也是为什么三大工具都在往 Skills 上走。

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
