---
title: 3. 命令与自定义 Prompt 完全指南
description: Vibe Coding教程第31篇：Codex 命令与自定义 Prompt 完全指南。讲透斜杠命令快捷操作、常用内置命令、自定义 Prompt 的写法与参数（$1/$ARGUMENTS），以及它向 Skills 的演进，把高频指令固化成可复用命令。
category:
  - Vibe Coding
tag:
  - Vibe Coding
  - AI编程
  - Codex
  - AI编程工具
---

在 Codex 里干活，很多操作不必打一长串字描述：切换模型、调审批策略、压缩太长的对话、审查改动、生成项目约定文件……一个斜杠命令就够了。而那些你每天要重复对 Codex 说的话，还能固化成自己的命令，调用一次顶你打一段。

这一篇把 Codex 的命令体系讲透：斜杠命令怎么用、有哪些常用的，以及怎么把高频指令做成可复用的自定义 Prompt。如果你看过本系列 Claude Code 的命令篇，会发现这套设计思路高度相通。

## **1. 斜杠命令是什么**

斜杠命令是在 Codex 输入框里敲 `/` 触发的快捷操作。敲下 `/`，会弹出一个命令菜单，你可以选择切换模型、调整权限、总结长对话等动作，不必离开终端、也不用打字描述。继续输入字母会实时过滤，选中回车即可执行。

它的定位和 Claude Code、Cursor 的斜杠命令一样——把对工具本身的高频操作变成一个 `/` 就能触发的快捷动作。记不住没关系，敲 `/` 现查现用，用几次就成肌肉记忆了。

> 【建议配图1 —— 斜杠命令快捷操作】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的示意图。中央画一个 Codex 终端输入框，里面一个醒目的 `/` 符号和闪烁光标，下方弹出一个命令下拉菜单，列出几条命令及简短说明：`/init`「生成 AGENTS.md」、`/review`「审查改动」、`/model`「切换模型」、`/approvals`「调审批策略」、`/compact`「压缩长对话」。菜单项用等宽字体，每条前带一个小 `/` 图标。顶部标「敲 / 弹出，选中即用」。配色语义：命令菜单干净，`/` 高亮。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者一眼理解 Codex 斜杠命令是敲 / 弹出菜单、快捷执行对工具操作的入口。

> 🔴待截图2 —— Codex 输入框敲 / 弹出的命令菜单
>
> 截图位置：在 Codex CLI 输入框开头敲一个 `/`，不要回车
> 截图内容：弹出的斜杠命令菜单及各命令的简短说明
> 标注要求：用红框框出 `/` 和菜单
> 建议保存为：../../../assets/img/vibe_coding/tools/codex/codex_commands_prompts/codex_commands_prompts2.png

## **2. 常用内置命令**

Codex 的内置命令覆盖了从项目初始化到日常推进的各个环节。下面挑日常高频的列出来：

| 命令 | 作用 |
|------|------|
| `/init` | 扫描项目、生成一份起步用的 `AGENTS.md` |
| `/review` | 审查当前改动，挑出潜在问题 |
| `/diff` | 查看当前改动 |
| `/model` | 切换模型、调推理强度 |
| `/approvals` | 调整审批策略（什么操作要先问你） |
| `/compact` | 把长对话压缩成摘要、腾出上下文 |
| `/new` | 开一个新对话、清空上下文 |

几个最该养成习惯的：刚进一个新项目先 `/init` 让它生成 `AGENTS.md`，给后续干活立好规矩；改完一批代码用 `/review` 让它自查一遍；对话聊长了用 `/compact` 压缩、或 `/new` 开新的，别让上下文越堆越乱——这和 Claude Code 里 `/clear`、`/compact` 的用法是一个道理。`/model` 和 `/approvals` 则是干活中途随时调挡：遇到难题切更强模型或调高推理强度，要放手批量跑就把审批策略放宽，干完再收回谨慎挡。完整命令列表敲 `/` 现查即可，不用全记，菜单里每条都带简短说明。

> 【建议配图3 —— Codex 内置命令按场景分组】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的分组图，把 Codex 内置命令按场景分四区。2×2 四象限卡片：左上「项目初始化」（绿色，齿轮图标）列 /init；右上「审查与查看」（紫色，放大镜图标）列 /review /diff；左下「干活推进」（橙色，前进箭头）列 /model /approvals；右下「上下文管理」（蓝色，对话气泡）列 /compact /new。每个命令用等宽字体小标签，前带 `/`。配色语义：每象限一个低饱和主题色。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者按「什么时候用」把 Codex 常用命令归类记忆，而不是面对一堆命令无从下手。

## **3. 自定义 Prompt**

内置命令覆盖不了你的个性化需求——你可能每天都要让 Codex「按团队规范写提交信息」「把这段代码翻成 TypeScript 并加测试」。这种高频指令，可以固化成自定义 Prompt，做成你自己的斜杠命令。

自定义 Prompt 就是放在 `~/.codex/prompts/` 目录下的 markdown 文件。文件名就是命令名，内容就是这个命令触发时交给 Codex 的指令。比如建一个 `~/.codex/prompts/commit.md`：

```markdown
---
description: 按 Conventional Commits 规范生成提交信息
---

查看当前 git 暂存区的改动，生成一条符合 Conventional Commits 规范的中文提交信息：
用 feat/fix/docs/refactor 等前缀，标题不超过 50 字，改动多则分点列出。
只输出提交信息本身。
```

存好后，在 Codex 里通过 `/prompts:` 菜单就能找到并调用它，菜单里会显示你 frontmatter 里写的 `description`。注意 Codex 只扫描 `~/.codex/prompts/` 顶层的 markdown 文件，别放进子目录；而且这些 prompt 存在你本地的 Codex 主目录、不随项目仓库共享。

## **4. 给自定义 Prompt 传参数**

自定义 Prompt 能接收参数，让一个命令应付不同输入。用占位符接参数，调用时跟在命令后面的内容会被填进去。

`$ARGUMENTS` 代表你传入的全部参数；`$1` 到 `$9` 是按位置取的单个参数；还支持 `KEY=value` 形式的命名参数。frontmatter 里的 `argument-hint` 用来在菜单里提示该传什么。比如一个按编号修 issue 的 prompt：

```markdown
---
description: 按编号修复一个 GitHub issue
argument-hint: [issue编号]
---

修复 GitHub issue $1，遵循我们项目的编码规范，改完补上测试。
```

调用时传入编号，`$1` 就被替换成它。带空格的参数用引号包起来当一个传。除了位置参数，还能用命名参数 `KEY=value`，在 prompt 里用对应的占位符引用，适合参数多、想让调用更可读的场景；要在文本里写一个真正的美元符号、不想被当占位符，用 `$$` 转义。这套参数机制和 Claude Code 自定义命令的 `$ARGUMENTS`、`$1` 几乎一模一样——三大工具在这件事上的设计如出一辙。

再看一个实战例子，把一段代码翻译成 TypeScript 并补测试，建 `~/.codex/prompts/to-ts.md`：

```markdown
---
description: 把指定文件翻译成 TypeScript 并补类型与测试
argument-hint: [文件路径]
---

把 $1 这个文件改写成 TypeScript：补全类型标注、消除所有 any，
保持原有逻辑不变，并为它补一份单元测试。改完跑一遍测试确认通过。
```

之后 `/prompts:to-ts src/util.js` 就能一键触发。诀窍始终是同一个：留意你每天重复对 Codex 说的话，把它们一条条做成 prompt——和你在 Claude Code 里攒自定义命令的思路完全一致。

> 【建议配图4 —— 自定义 Prompt 的参数替换】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的示意图。顶部一个终端输入行 `/prompts:fix-issue 123`，把 `123` 用橙色底高亮。中间一条带颜色的虚线箭头，从 `123` 指向下方 prompt 文件里的占位符 `$1`（同样橙色高亮）。下方展示 prompt 文件片段 `修复 GitHub issue $1…`，占位符高亮。再一个向下箭头指向最终结果 `修复 GitHub issue 123…`。所有代码用等宽字体。配色语义：橙=参数按位置替换。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：用颜色对应直观展示自定义 Prompt 的 $1/$ARGUMENTS 占位符怎么把命令后的输入填进指令。

> 🔴待截图5 —— 自定义 Prompt 的实际调用效果
>
> 截图位置：建好一个自定义 prompt（如 commit）后，在 Codex 里通过 /prompts: 菜单调用它的过程与结果
> 截图内容：调用自定义 prompt 后 Codex 执行并给出结果的会话画面
> 标注要求：用红框框出调用的命令和生成的结果
> 建议保存为：../../../assets/img/vibe_coding/tools/codex/codex_commands_prompts/codex_commands_prompts5.png

## **5. 自定义 Prompt 正在让位给 Skills**

这里有个必须讲清的趋势：OpenAI 已经把自定义 Prompt 标记为不再主推，转而推荐用 Skills 来封装可复用的指令。原因和 Claude Code 把自定义命令并入 Skills 是一样的——单个 prompt 文件只能放一段指令，而 Skill 是一个目录，除了指令还能带配套脚本、模板、参考文档，能力更强，还能让 Codex 在合适时自动调用，而不只是你手动触发。

所以现在的建议是：简单的、就是一段指令的高频操作，用自定义 Prompt 仍然方便、老的也继续能用；但需要带脚本、模板，或想做成更完整工作流的，直接用 Skills。Codex 的 Skills 是下一篇的主题，那里会讲它怎么写、怎么调用、和这里的自定义 Prompt 有什么区别。理解了这条演进，你就明白为什么三大工具不约而同地走向了 Skills——它是封装可复用 AI 工作流的更强形态。

> 【建议配图6 —— 从内置命令到自定义 Prompt 再到 Skills】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的三段演进图，从左到右用箭头表示能力递进。①「内置命令」（蓝色，齿轮图标）「工具自带的快捷操作，写死的」；②「自定义 Prompt」（橙色，单文档图标）「一段你写的指令，做成 /命令，手动调用」；③「Skills」（绿色，积木盒/目录图标，标「推荐」）「一个目录：指令+脚本+模板，能力更强、可自动触发」。三段用加粗箭头相连，箭头上标「封装能力递增」。在②和③之间标一个小提示「Codex 正从自定义 Prompt 转向 Skills」。配色语义：蓝=内置、橙=单文件、绿=完整封装。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者理解 Codex 的命令体系从内置命令、自定义 Prompt 演进到 Skills，知道复杂封装该用 Skills。

## **6. 常见问题**

**Q：自定义 Prompt 建好了菜单里没出现？**
确认文件放在 `~/.codex/prompts/` 顶层（不是子目录），是 `.md` 文件。Codex 只扫这一层的 markdown。

**Q：自定义 Prompt 能在团队里共享吗？**
不能直接共享——它存在你本地的 Codex 主目录、不随项目仓库走。要团队共享可复用工作流，用 Skills（可放项目里提交 git）更合适。

**Q：现在还该用自定义 Prompt 吗？**
简单的一段指令、自己用，仍然方便。但官方已转向 Skills，复杂的、要带配套文件或想团队共享的，建议直接用 Skills。

**Q：Codex 的命令和 Claude Code 的像吗？**
非常像。斜杠命令、自定义命令带 `$ARGUMENTS`/`$1` 参数、向 Skills 演进，这几点三大工具高度一致，学会一个迁移到另一个几乎零成本。

## **7. 小结**

Codex 的命令体系分两层：内置斜杠命令把切模型、调审批、审查、压缩上下文这些高频操作变成 `/` 一敲就触发的快捷动作，记不住就现敲现查；自定义 Prompt 让你把每天重复说的指令固化成自己的 `/命令`，用 `$ARGUMENTS`、`$1` 接参数应付不同输入。

而方向上，自定义 Prompt 正在让位给能力更强的 Skills——这和 Claude Code 的演进完全同步。掌握了这套命令体系，你就能把和 Codex 的协作，从每次从头交代，升级成调用一套为自己定制的快捷工具。

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
