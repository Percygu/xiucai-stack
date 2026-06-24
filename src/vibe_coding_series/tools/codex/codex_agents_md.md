---
title: 2. AGENTS.md 与配置完全指南
description: Vibe Coding教程第30篇：Codex AGENTS.md 与配置完全指南。讲透 AGENTS.md 写法与分层加载、config.toml 的模型/审批/沙箱配置，以及 Profiles 一键切换多套配置，给 Codex 立规矩、调行为。
category:
  - Vibe Coding
tag:
  - Vibe Coding
  - AI编程
  - Codex
  - AI编程工具
---

让 Codex 真正懂你的项目、按你的偏好干活，要做两件事：一是告诉它项目的规矩（用什么技术栈、什么约定），二是调好它自己的行为（用哪个模型、多放手、在多大范围里跑）。前者写在 `AGENTS.md` 里，后者配在 `config.toml` 里。

这一篇把这两个文件讲透：`AGENTS.md` 怎么写、它如何分层加载，`config.toml` 能配什么、怎么用 Profiles 一键切换多套配置。理解了它们的分工，你就能让 Codex 既守你项目的规矩、又按你最舒服的方式运转。

## **1. AGENTS.md 是什么**

`AGENTS.md` 是写给 Codex 看的项目约定文件。Codex 在动手干活之前，会先读它，从中了解这个项目的技术栈、目录结构、编码规范、常见任务的做法。这样每次开工，它都带着对项目的正确预期，不必你每次对话重新交代。

它和你在 Claude Code 里用的 CLAUDE.md、在 Cursor 里用的 Rules 是同一类东西，作用完全一致——给 AI 立项目规矩。而且 `AGENTS.md` 是一个跨工具的开放约定：不只 Codex 认它，Cursor 等工具也认，所以写一份就能让多个工具共享同一套项目规范，不必各配一套。这正是本系列反复强调的一点——三大工具的核心概念相通，`AGENTS.md` 就是它们之间的通用语言。

> 【建议配图1 —— AGENTS.md 给 Codex 立项目规矩】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的示意图。中央画一个 `AGENTS.md` 文件图标（带条款的文档），从它向右用箭头注入到 Codex（黑色花瓣图标），Codex 读取后生成的代码整齐、标绿对勾「自动符合项目规范」。文件左侧列几条规约缩略（「技术栈：Go + Postgres」「测试用 testing 包」「接口统一错误格式」）。关键：在 `AGENTS.md` 下方画一行小图标 Codex、Cursor 等都连向它，标「跨工具通用：一份约定多个工具都认」。配色语义：绿=规范生效、文件为枢纽。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者理解 AGENTS.md 是给 Codex（及其他工具通用）立项目规矩的文件，写一次自动遵守。

## **2. AGENTS.md 怎么写**

`AGENTS.md` 就是一个普通的 markdown 文件，放在项目根目录。内容用自然语言写清楚你希望 Codex 知道的项目信息即可，没有死板格式。一份实用的 `AGENTS.md` 大致包含这些：

```markdown
# 项目说明

这是一个用 Go 写的订单服务，数据库用 PostgreSQL。

## 技术栈与结构
- 后端：Go 1.22，Web 框架用 Gin
- 目录：handler/ 放接口，service/ 放业务，repo/ 放数据访问
- 测试：标准库 testing，表驱动测试，放在被测文件同目录

## 编码约定
- 接口返回统一 { code, data, message }，错误统一用 AppError
- 不要引入新依赖，先问我
- 所有数据库操作要处理错误并记日志

## 常见任务
- 加接口：先写 handler，再写 service，最后补表驱动测试
- 跑测试：go test ./...
```

要点和写 CLAUDE.md 一样：写具体、可执行的约定，别写空泛口号；把项目的技术栈、结构、规范、常见任务的标准做法交代清楚。写得越具体，Codex 生成的代码越合你的规矩。

还有个实用细节：`AGENTS.md` 可以放在子目录里。大项目的不同模块约定不同，你可以在 `src/frontend/AGENTS.md` 写前端的规矩、`src/backend/AGENTS.md` 写后端的，Codex 在动对应目录的代码时自动带上那个目录的约定。这样根目录放全项目通用的、子目录放模块专属的，规矩既不冲突又各管一摊——和 Cursor 的嵌套 Rules 是一个思路。一开始别贪多，先把最关键的几条规范写进根目录的 `AGENTS.md`，跑一段时间发现 Codex 反复犯某类错，再把对应的约束补进去，让它边用边长。

## **3. AGENTS.md 分层加载**

`AGENTS.md` 一个值得知道的机制是分层。Codex 启动时会构建一条指令链：既读全局层面的 `AGENTS.md`（你放在用户级、对所有项目生效的通用指导），也读当前项目的 `AGENTS.md`（项目专属的约定），把它们叠加起来。

这样你可以把「我个人的通用偏好」（比如总是用中文回复、总是先写测试）放全局，把「这个项目特有的规矩」放项目里，两层叠加，既有统一的个人风格、又有项目专属的规范。项目层的约定优先级更高，能覆盖全局的通用设定。

> 【建议配图2 —— AGENTS.md 的全局 + 项目分层加载】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的分层叠加图。画两层文件叠在一起，下层是「全局 AGENTS.md」（蓝色，标「你的通用偏好：中文回复、先写测试…」），上层是「项目 AGENTS.md」（绿色，标「项目专属约定：技术栈、目录、规范…」），上层半透明叠在下层之上，用一个向下箭头汇成右侧一条「指令链」交给 Codex（黑色花瓣图标）。在两层之间标注「项目层优先级更高，可覆盖全局」。配色语义：蓝=全局通用、绿=项目专属、叠加=合并成指令链。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者理解 AGENTS.md 是全局通用 + 项目专属两层叠加，项目层可覆盖全局。

## **4. config.toml 配置 Codex 的行为**

如果说 `AGENTS.md` 是告诉 Codex「这个项目是怎样的」，那 `config.toml` 就是告诉 Codex「你自己该怎么运转」。它放在 `~/.codex/config.toml`，用 TOML 格式配置 Codex 的运行参数。常用的几项：

```toml
# 用哪个模型
model = "gpt-5.5-codex"

# 审批策略：什么时候暂停征求你同意
approval_policy = "on-request"

# 沙箱模式：Codex 能在多大范围内动手
sandbox_mode = "workspace-write"
```

`model` 选用哪个模型；`approval_policy` 控制 Codex 在改文件、跑命令前什么时候停下来问你——交互式干活推荐 `on-request`（需要时才问），非交互的自动化场景可以用 `never`；`sandbox_mode` 控制它的活动范围，从只读（`read-only`）到只能写工作区（`workspace-write`）、到完全放开（`danger-full-access`），是安全的核心开关。审批和沙箱这两项关系到安全和放手程度，本系列后面有专门一篇深入讲，这里先知道它们配在 `config.toml` 里。

除了这三个核心键，`config.toml` 还能调不少东西，比如模型的推理强度（让它在难题上多想一会儿）、要不要连某些 MCP 服务器、各种界面和行为偏好。不用一上来全配，先把模型、审批、沙箱这三项设成你舒服的默认值，其余等遇到具体需求再查配置参考补。需要提醒的是，如果你用的是公司统一管理的机器，组织可能通过一份约束文件强制某些底线（比如不许把审批设成 `never`、不许开完全放开的沙箱），这种情况下你的个人配置要在允许范围内。

> 【建议配图3 —— config.toml 配置 Codex 的运行行为】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的「标注式配置卡片」图。中央一个 `~/.codex/config.toml` 卡片（等宽字体），列出三个键并各引一条注释引线：`model`→「用哪个模型」（蓝）；`approval_policy`→「何时停下来问你（on-request / never）」（橙）；`sandbox_mode`→「能在多大范围动手（只读 / 写工作区 / 完全放开）」（红，标「安全核心」）。卡片标题旁画一个齿轮图标表示「调 Codex 自身行为」。配色语义：蓝=模型、橙=审批、红=安全范围。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者看懂 config.toml 配的是 Codex 自身的运行行为（模型、审批、沙箱），照着就能改。

## **5. Profiles 多套配置一键切换**

你常常需要在不同场景用不同配置：日常开发想要谨慎些（每步确认）、批量自动化想要放手些（不打断）、不同项目想用不同模型。每次手动改 `config.toml` 太麻烦，Profiles 就是为此而生——它让你把几套命名的配置层存好，用命令行一键切换。

在 `config.toml` 里定义不同的 profile，每个 profile 是一组配置。用的时候加 `--profile 名字`，Codex 会先加载基础 `config.toml`，再叠上你指定的那个 profile 的配置：

```toml
# 基础配置
model = "gpt-5.5-codex"
approval_policy = "on-request"

# 一个放手跑自动化的 profile
[profiles.yolo]
approval_policy = "never"
sandbox_mode = "workspace-write"

# 一个只读分析的 profile
[profiles.review]
sandbox_mode = "read-only"
```

这样日常直接 `codex` 用基础配置，要放手批量跑就 `codex --profile yolo`，只想让它读代码做分析就 `codex --profile review`。把常用的几套场景固化成 profile，切换成本就降到一条命令。

> 【建议配图4 —— Profiles 多套配置一键切换】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的图，表现用 --profile 在多套配置间切换。中央画一个像「档位选择器」或多个标签卡的结构，三张配置卡片并排：「默认（on-request）」（绿色，盾牌）、「yolo（never，放手跑）」（红色，火箭）、「review（只读分析）」（蓝色，放大镜）。每张卡片下方标对应命令：`codex`、`codex --profile yolo`、`codex --profile review`。一只手/光标指向某张卡片表示「一键切到这套」。底部小字「把常用场景固化成 profile，切换只要一条命令」。配色语义：绿=谨慎、红=放手、蓝=只读。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者理解 Profiles 把多套配置存好、用 --profile 一键切换，省去反复改配置文件。

## **6. AGENTS.md 与 config.toml 怎么分**

这两个文件容易混，一句话分清：**AGENTS.md 是给 AI 看的项目约定，config.toml 是给 Codex 看的运行配置。**

`AGENTS.md` 写的是「这个项目是什么样、该怎么写代码」，用自然语言，内容是给模型理解的，随项目走、可提交 git 团队共享。`config.toml` 写的是「Codex 这个程序怎么运行」——用哪个模型、要不要每步问你、能在多大范围动手，用 TOML，是工具的运行参数，偏个人环境。一个管「项目规矩」，一个管「工具行为」，各司其职。理解了这层分工，你就不会再纠结某条设置该写哪——是项目的编码约定就进 `AGENTS.md`，是 Codex 的运行方式就进 `config.toml`。

> 【建议配图5 —— AGENTS.md vs config.toml】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的左右对比图。左半「AGENTS.md」配绿色：图标为带条款的文档，标「给 AI 看的项目约定」，下面小字「自然语言、写项目技术栈/结构/规范、随项目走、可提交 git 共享」。右半「config.toml」配蓝色：图标为齿轮+配置文件，标「给 Codex 看的运行配置」，下面小字「TOML、配模型/审批/沙箱、是工具运行参数、偏个人环境」。中间一条竖虚线分隔，顶部各放标题，底部一行小字「一个管项目规矩，一个管工具行为」。配色语义：绿=项目约定、蓝=运行配置。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：帮读者一次分清 AGENTS.md（项目约定，给 AI 看）和 config.toml（运行配置，给工具看）的定位。

## **7. 常见问题**

**Q：AGENTS.md 和 CLAUDE.md、Cursor Rules 是一回事吗？**
作用完全一样，都是给 AI 立项目规矩。`AGENTS.md` 是跨工具的开放约定，写一份 Codex、Cursor 等都认，适合跨工具团队统一用。

**Q：AGENTS.md 写了 Codex 不遵守？**
确认放在项目根目录、内容具体可执行。太空泛的约定（「代码要优雅」）它没法落地，写成「函数超 50 行就拆」这类具体规则才管用。

**Q：config.toml 找不到或不生效？**
它在 `~/.codex/config.toml`，第一次可能需要你自己创建。改完重启会话生效。用 `--profile` 时它会在基础配置上叠加对应 profile。

**Q：我该用 Profiles 吗？**
如果你常在「谨慎确认」和「放手自动化」之间切、或不同项目用不同模型，Profiles 很省事。只用一套配置的话，配好基础 `config.toml` 就够了。

## **8. 小结**

让 Codex 又懂项目又顺手，靠两个文件分工：`AGENTS.md` 给它立项目规矩——用自然语言写清技术栈、结构、规范，全局与项目两层叠加，还能跨工具共享；`config.toml` 调它自己的行为——用哪个模型、何时征求你同意、能在多大范围动手，再用 Profiles 把多套场景固化成一键可切的配置。

一句话记住分工：项目的规矩进 `AGENTS.md`，工具的行为进 `config.toml`。把这两个配好，Codex 就从一个通用代理，变成了一个懂你项目、合你习惯的专属助手——这和你在 Claude Code、Cursor 里做的事是同一回事，只是换了文件名。

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
