---
title: 7. Hooks 自动化与实战工作流
description: Vibe Coding教程第28篇：Cursor Hooks 自动化与实战工作流。讲透 Cursor Hooks（beta）的生命周期事件、hooks.json 配置、自动格式化与拦截危险命令实战，并盘点 Cursor 的高效实战工作流。
category:
  - Vibe Coding
tag:
  - Vibe Coding
  - AI编程
  - Cursor
  - AI编程工具
---

到这里，Cursor 的核心能力你已经一一过了一遍：四种模式、Rules、上下文与记忆、MCP、云端代理。最后这一篇做两件事——先讲 Cursor 较新的 Hooks 能力，让你能把规矩变成确定性自动执行的动作；再把前面所有能力收拢成一套实战工作流，告诉你日常该怎么把它们串起来用，以及怎么和别的工具配合。

## **1. Cursor Hooks 是什么**

Hooks（钩子）是 Cursor 从 1.7 版本起加入的能力，目前还是 beta。它让你在 Agent 干活的生命周期节点上挂自己的脚本，从而拦截或改变它的行为。

它要解决的问题，和你在 Claude Code 的 Hooks 篇里看到的完全一样：有些规矩你不能接受 AI「偶尔忘一次」——改完代码必须格式化、危险命令绝不能执行、敏感信息不能发给模型。靠提示不可靠，靠 Hook 才是确定的：只要到了那个事件，你挂的脚本就一定运行。Cursor 的 Hooks 就是把这套确定性自动化带进了它的 Agent 循环。

> 【建议配图1 —— Cursor Hooks 挂在 Agent 生命周期上】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的横向时间轴流程图，展示 Cursor Agent 一次干活的生命周期，并标出可挂钩的节点。时间轴从左到右经过几个节点，每个配圆形图标和事件名标签：①「会话开始」`sessionStart`（电源图标，灰）；②「提交提示前」`beforeSubmitPrompt`（对话气泡图标，蓝）；③「执行 shell 前」`beforeShellExecution`（盾牌图标，红，标「可拦截」）；④「读文件前」`beforeReadFile`（眼睛+遮罩图标，紫，标「可脱敏」）；⑤「改完文件后」`afterFileEdit`（齿轮/刷子图标，绿，标「可格式化」）；⑥「答完一轮」`stop`（旗帜图标，紫）。节点用粗箭头顺序相连，红色盾牌节点额外标「在动作发生前介入」。配色语义：红=安全拦截、紫=内容处理、绿=收尾、蓝/灰=输入与边界。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者看清 Cursor Hooks 能挂在 Agent 干活的哪些时刻，尤其 beforeShellExecution、afterFileEdit 这些关键节点。

## **2. 配置与常用事件**

Cursor 的 hooks 配置写在 `hooks.json` 里，两个位置：用户主目录的 `~/.cursor/hooks.json` 全局生效，项目里的 `<项目>/.cursor/hooks.json` 只对该项目生效（可提交 git 共享）。结构是一个 `version` 加一个 `hooks` 对象，每个事件下挂要执行的命令：

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [{ "command": "./hooks/format.sh" }],
    "beforeShellExecution": [{ "command": "./hooks/audit.sh" }]
  }
}
```

可挂的生命周期事件不少，几个最实用的：`afterFileEdit`（改完文件后）最常用来自动格式化；`beforeShellExecution`（执行 shell 命令前）用来审计或拦截危险命令；`beforeReadFile`（读文件前）可以在内容到达模型前把敏感信息脱敏；`beforeSubmitPrompt`（提交提示前）可以校验或补充上下文；`stop`（答完一轮）可以做收尾检查。此外还有会话起止、子代理起止、MCP 调用前后等一系列事件，需要时查官方文档。

> 【建议配图2 —— hooks.json 的结构】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的「标注式 JSON 卡片」图。中央一个 `hooks.json` 代码卡片（等宽字体），用引线标注三处：`"version": 1`→「配置版本」；事件名 `"afterFileEdit"`→「在这个生命周期事件触发」（绿色）；`{ "command": "./hooks/format.sh" }`→「要执行的脚本」（橙色）。左侧再画两个小文件夹图标表示两个配置位置：`~/.cursor/hooks.json`（标「全局」，蓝）和 `项目/.cursor/hooks.json`（标「项目级、可提交 git」，绿）。配色语义：绿=事件、橙=命令、蓝=全局、绿=项目。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者看懂 hooks.json 的「事件→命令」结构和两个配置位置，照着就能写。

> 🔴待截图3 —— Cursor 里 hooks 配置生效后的运行
>
> 截图位置：配好一个 afterFileEdit 格式化 hook 后，让 Agent 改一个文件，观察 hook 自动跑格式化的过程（或 Cursor 设置里 hooks 的状态）
> 截图内容：hook 在 Agent 改完文件后自动触发的迹象（终端输出 / 状态提示）
> 标注要求：用红框框出 hook 触发的提示
> 建议保存为：../../../assets/img/vibe_coding/tools/cursor/cursor_hooks_workflow/cursor_hooks_workflow3.png

## **3. 三个实战 hook**

把常用场景落成具体的 hook。第一个，改完文件自动格式化——挂在 `afterFileEdit`，让脚本对刚改的文件跑格式化工具，AI 改完代码风格自动统一，不必你提醒。

第二个，拦截或审计危险命令——挂在 `beforeShellExecution`，脚本检查 Agent 这次想跑的命令，命中危险模式（`rm -rf`、强推、删库等）就拦下或记审计日志。这给放手让 Agent 跑命令加了一道机器把守的闸门。

第三个，敏感信息脱敏——挂在 `beforeReadFile`，在文件内容进入模型之前，把里面的密钥、token、隐私字段替换掉。这样即便代码里夹着敏感信息，也不会原样发给模型。

以自动格式化为例，把它配齐就是两步。先在项目里写一个脚本 `hooks/format.sh`，对传进来的文件跑格式化工具：

```bash
#!/bin/bash
# Cursor 会把本次事件数据以 JSON 传给脚本，从中取出被改的文件路径
FILE=$(jq -r '.file_path')
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx) npx prettier --write "$FILE" ;;
  *.py) black "$FILE" ;;
  *.go) gofmt -w "$FILE" ;;
esac
```

再在 `.cursor/hooks.json` 里把它挂到 `afterFileEdit`：

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [{ "command": "./hooks/format.sh" }]
  }
}
```

之后 Agent 每改完一个文件，格式自动按文件类型统一。审计危险命令的 hook 同理——挂到 `beforeShellExecution`，脚本从事件数据里取出待执行的命令，命中危险模式就拒绝或记日志。

这三个场景和 Claude Code 的 Hooks 几乎一一对应，思路完全相通：找到那个「希望每次都发生」的时刻，把对应的事件和一段脚本绑定。区别只在配置文件的格式和事件命名，理解了一个，另一个一看就懂。

> 【建议配图4 —— 三个实战 hook 的作用位置】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的图，把三个实战 hook 标注到 Agent 工作流的对应节点上。一条横向流程线，三个挂钩点用不同颜色气泡引出：①在「读文件前」处挂紫色气泡「beforeReadFile → 敏感信息脱敏，密钥/token 进模型前替换掉」（配遮罩/星号图标）；②在「执行命令前」处挂红色盾牌气泡「beforeShellExecution → 拦截/审计危险命令」（配盾牌图标）；③在「改完文件后」处挂绿色气泡「afterFileEdit → 自动格式化」（配刷子图标）。每个气泡配对应小图标。配色语义：紫=脱敏、红=安全拦截、绿=格式化。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者把三个最实用的 hook 和它们各自该挂的生命周期节点对应起来，建立「该自动化的事挂到对应时刻」的方法论。

需要提醒的是，Hooks 目前还是 beta，能力和细节可能随版本调整；而且 hook 脚本是用你的权限运行的真实代码，别不加审查就用别人给的配置，尤其团队共享的项目级 hook，用前看清它跑了什么——这条安全底线和 Claude Code 那边一样。

## **4. Cursor 高效实战工作流**

把前面六篇的能力收拢成一套日常节奏，你用 Cursor 的效率才真正释放出来。

写代码时，靠 `Tab` 连续接受补全，把大量机械的连带改动一路 `Tab` 下去；要改眼前一小块、范围明确，选中按 `Cmd+K` 精准改；交一个完整任务，`Cmd+I` 唤起 Agent。任务一复杂，先按 `Shift+Tab` 进 Plan 模式让它出计划、你审过方向再执行，别一上来就让 Agent 莽。提问和派活前，用 `@` 把相关文件、符号、`@Docs` 文档精准喂进去，让它基于真实上下文干活。模型按难易换挡——日常用 Composer 或 Sonnet 又快又省，硬骨头切 Opus。能放手的大任务丢给云端代理并行跑，自己腾出手。开了 PR，让 BugBot 自动审一遍把关。而项目的规矩沉淀进 Rules、AI 的经验积累进 Memories，让它越用越懂你的项目。

> 【建议配图5 —— Cursor 高效工作流全景】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的环形/放射工作流全景图。中心写「Cursor 高效工作流」（黑色立方体图标）。围绕中心放射出若干能力节点，每个配图标和一句短标签，按「写→规划→喂上下文→选模型→放手→把关→沉淀」的逻辑排布：`Tab 连续补全`（闪电）、`Cmd+K 局部精修`（魔棒）、`Cmd+I + Plan 先规划`（蓝图）、`@ 引用喂准上下文`（@符号）、`按难易换模型`（多模型切换图标）、`云端代理并行`（云）、`BugBot 自动审 PR`（机器人放大镜）、`Rules+Memories 沉淀`（文档+大脑）。节点用不同低饱和主题色，整体呈现一套完整闭环。配色语义：各能力用区分色，中心统一。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：把 Cursor 系列七篇的能力收拢成一张可照着走的工作流全景，让读者建立从写代码到把关沉淀的完整节奏。

这套节奏的内核和 Claude Code 的工作流是一致的：人负责想清楚、做决策、把关，AI 负责执行、查找、处理重复劳动；小步快跑、及时验证、随时能退（Cursor 的改动都是 diff，可逐处接受、拒绝、回退）。

## **5. 与其他工具配合**

最后说一句跨工具配合。本系列讲三大 Coding Agent——Claude Code、Cursor、Codex——并不是要你只选一个，它们完全可以搭配着用。常见的组合是：在 Cursor 这个编辑器里写代码、用 Tab 和 Cmd+K 做即时编辑，同时在终端里跑 Claude Code 处理那些更适合命令行、批处理、或要深度自主的任务；或者用 Cursor 的 BugBot 审查另一个工具产出的 PR。

让它们能配合的关键，是共享同一份项目约定。前面讲过，`AGENTS.md` 是一个跨工具的开放约定——写一份放项目根目录，Cursor、Codex 等都认它，不必为每个工具各写一套规矩。这样无论你这一刻用哪个工具，它们遵循的都是同一套项目规范。工具是手段，按手头的活挑最顺手的那个、让它们共享上下文协同，才是高效的用法。

## **6. 常见问题**

**Q：Cursor 的 hooks 和 Claude Code 的 hooks 是一回事吗？**
思路一样——都是在 AI 干活的生命周期事件上挂脚本做确定性自动化。区别在配置文件格式（Cursor 用 `hooks.json`）和事件命名。理解一个，另一个很快上手。

**Q：hooks 配了不生效？**
确认文件位置（`~/.cursor/hooks.json` 或项目 `.cursor/hooks.json`）和结构对（有 `version` 和 `hooks`），事件名拼写准确。它还是 beta，遇到异常可对照官方文档最新说明。

**Q：我已经用 Claude Code 了，还要学 Cursor 吗？**
看场景。Cursor 的强项是编辑器内的即时编辑体验（Tab、Cmd+K）和可视化操作，Claude Code 的强项是终端里的深度自主和管道自动化。很多人两个都用、按活切换。

**Q：怎么让 Cursor 和别的工具用同一套规矩？**
在项目根目录写一份 `AGENTS.md`，多个工具通用，省得各配一套。

## **7. 小结**

Cursor 的 Hooks 把你的工程规矩变成由程序保证的确定性自动化——改完自动格式化、危险命令自动拦截、敏感信息进模型前自动脱敏，思路和 Claude Code 完全相通，只是换了配置格式。而把 Cursor 七篇的能力收拢成一套工作流后你会发现，它的高效从来不在某个单一功能，而在于把 Tab、Cmd+K、Plan、@引用、多模型、云端代理、BugBot、Rules 和 Memories 按节奏串起来用。

工具之间也不是非此即彼。让 Claude Code、Cursor、Codex 共享同一份 `AGENTS.md`、各展所长地协同，你才算真正驾驭了这一代 AI 编程工具——它们是你调度的一套班子，而不是相互替代的选项。

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
