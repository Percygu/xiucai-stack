---
title: 3. Rules 规则完全指南
description: Vibe Coding教程第24篇：Cursor Rules 规则完全指南。讲透 .cursor/rules/*.mdc 文件与三个核心字段、四种激活方式、AGENTS.md 替代与团队规则共享，给 AI 立项目规矩、不必每次重复交代。
category:
  - Vibe Coding
tag:
  - Vibe Coding
  - AI编程
  - Cursor
  - AI编程工具
---

用 Cursor 久了你会发现一个反复出现的烦恼：每开一个新对话，它就把你项目的规矩忘得一干二净。你这个项目用 TypeScript 不用 any、组件统一放某个目录、接口返回统一用某种格式——这些约定，你得在每次对话里一遍遍重复交代，否则它生成的代码就不合你的规范。

Rules（规则）就是来解决这件事的。它让你把项目的约定写成文件，Cursor 在生成代码时自动带上，不必你每次重说。这一篇讲透 Cursor 的规则系统：规则文件长什么样、四种激活方式分别在什么时候生效、怎么写出真正管用的规则、怎么和团队共享，以及它和你在 Claude Code 里用的 CLAUDE.md 是什么关系。

## **1. Rules 是什么**

Rules 是你写给 Cursor 的一组项目约定。它本质上是一段常驻的指令，告诉 AI 在这个项目里该遵守什么规矩：用什么技术栈和写法、文件该放哪、命名怎么定、什么模式要用、什么做法要避免。设好之后，这些规矩会在合适的时机自动注入对话，AI 生成代码时就照着来。

它要解决的核心痛点是 AI 没有项目记忆。每个新对话对它来说都是一张白纸，你项目里那些只有你团队才知道的约定，它无从得知。与其每次手动交代，不如把这些约定沉淀成规则文件一次写好——这和你在 Claude Code 里用 CLAUDE.md 立规矩是完全相同的思路，只是 Cursor 的规则系统提供了更细的触发控制。

> 【建议配图1 —— 有没有规则的差别】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的左右对比图。左半「没有 Rules」配橙黄色：画一个用户每次对话都重复一长串交代（三个几乎一样的对话气泡叠着，写「记得用 TypeScript、组件放 components/、接口用统一格式…」），旁边 AI（Cursor 黑色立方体图标）生成的代码上标几个红叉「风格不一致、放错目录」，配小字「每次重说，还常忘」。右半「有 Rules」配绿色：画一个规则文件图标（标 `.cursor/rules/`），一条箭头自动注入到 AI，AI 生成的代码整齐、标绿对勾「自动符合项目规范」，配小字「写一次，自动带上」。中间一个加粗箭头从左到右。配色语义：橙黄=重复低效、绿=规则自动生效。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者一眼理解 Rules 的价值——把项目约定写一次，AI 自动遵守，不必每次对话重复交代。

## **2. 规则文件与三个字段**

Cursor 的项目规则放在 `.cursor/rules/` 目录下，每条规则是一个 `.mdc` 文件。注意必须是 `.mdc` 扩展名——普通的 `.md` 文件会被规则系统忽略，因为它没有用来控制触发的 frontmatter。

一个 `.mdc` 文件分两部分：上面是 frontmatter 元数据，下面是规则正文（也就是你要 AI 遵守的内容）。frontmatter 有三个核心字段，它们共同决定这条规则什么时候生效：

```markdown
---
description: 编写 API 接口时遵循的返回格式与错误处理约定
globs: src/api/**/*.ts
alwaysApply: false
---

所有接口返回统一用 { code, data, message } 结构；
错误统一抛 AppError，不要直接 return 裸错误；
所有入参必须做校验。
```

`description` 是这条规则的用途说明，AI 读它来判断当前任务要不要用上这条规则；`globs` 是文件路径匹配模式，当你打开或编辑匹配的文件时，规则自动挂上；`alwaysApply` 设为 true 则这条规则在每个对话都生效，设为 false 则交给 AI 按 `description` 判断。这三个字段怎么组合，就决定了规则的激活方式。

> 【建议配图2 —— .mdc 规则文件的结构】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的「标注式代码卡片」图。中央一个 `.mdc` 文件卡片（等宽字体），分上下两块：上块浅黄底是 frontmatter，逐行列 `description`、`globs`、`alwaysApply` 三个字段；下块浅蓝底是规则正文（写「接口返回统一用 {code,data,message}…」）。从三个字段各引一条注释引线到右侧小标签：`description`→「用途说明，AI 据此判断要不要用」；`globs`→「文件路径匹配，打开匹配文件就自动挂上」；`alwaysApply`→「true=每次都生效，false=AI 按需」。注释标签用浅灰底。配色语义：黄=元数据控制触发、蓝=规则内容。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者看懂一个 .mdc 规则文件由 frontmatter 三字段 + 正文组成，三字段分别控制规则何时触发。

## **3. 四种激活方式**

三个字段的不同组合，产生四种激活方式，理解它们才能让规则在该用的时候用、不该用的时候别打扰。

**Always（总是生效）**：`alwaysApply: true`。这条规则在每个对话都自动带上，适合放项目最核心、放之四海皆准的约定，比如整体技术栈、最高优先级的编码规范。但别滥用——每条 Always 规则都常驻上下文、占 token，只有真正每次都该遵守的才设 Always。

**Auto Attached（自动挂载）**：设了 `globs`。当你打开或编辑匹配该模式的文件时，规则自动挂上。比如一条规则 `globs: src/api/**/*.ts`，只在你动 API 文件时生效，写前端组件时它不来打扰。这是最精准的方式，让特定规则只在相关文件出现时上场。

**Agent Requested（AI 按需请求）**：只写 `description`、不设 `alwaysApply` 和 `globs`。AI 会读你的 `description`，自己判断当前任务要不要用这条规则。所以这种方式下 `description` 必须写清楚「什么时候该用」，写好了 AI 才请求得准。

**Manual（手动引用）**：以上都不设，规则只在你主动用 `@规则名` 引用时才生效。适合那些只在偶尔某些场景才需要的规则。

> 【建议配图3 —— 四种规则激活方式】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的四象限卡片图，介绍四种激活方式，每张标出对应的字段配置。①「Always」（红色，常亮灯泡图标）「alwaysApply: true · 每个对话都生效 · 放核心约定」；②「Auto Attached」（绿色，文件+磁铁图标）「设 globs · 打开匹配文件才挂上 · 最精准」；③「Agent Requested」（蓝色，AI判断/问号图标）「只写 description · AI 按需自己请求」；④「Manual」（橙色，@符号图标）「都不设 · 仅 @规则名 手动引用」。每张卡片用等宽字体标出关键字段配置。配色语义：红=常驻、绿=按文件、蓝=AI判断、橙=手动。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者一眼对应「字段配置→激活方式」，知道想让规则怎么触发就该怎么配 frontmatter。

一个实用的搭配原则：核心规范设 Always，针对特定模块/语言的规则用 globs 做 Auto Attached，偶尔才用的设 Manual。这样既保证关键约定永远在场，又避免每条规则都常驻把上下文塞满。

> 🔴待截图4 —— Cursor 设置里的 Rules 管理界面
>
> 截图位置：Cursor 设置（Settings）里的 Rules 页面，或新建一条 project rule 的界面
> 截图内容：已有规则列表及其激活方式标识，以及新建 .mdc 规则、填 description/globs 的界面
> 标注要求：用红框框出新建规则入口和激活方式设置项
> 建议保存为：../../../assets/img/vibe_coding/tools/cursor/cursor_rules/cursor_rules4.png

## **4. 写好规则的实践**

规则不是越多越全越好，写得不好反而会干扰 AI。几条实践能让规则真正管用。

**一条规则聚焦一件事，拆成多个文件。** 别把所有约定堆进一个巨大的规则文件，那样既难维护、又让 AI 抓不住重点。按主题拆开：一条管 API、一条管组件、一条管测试，各用各的 `globs` 在相关文件时生效。

**写具体、可执行的约定，别写空泛口号。** 「代码要优雅」这种 AI 没法落地，「函数超过 50 行就拆分」「禁止使用 any，用 unknown 加类型守卫」才有用。规则越具体，AI 越照得准。

**控制 Always 规则的体量。** 设成 Always 的规则每次都占上下文，所以它该短而精，只放真正每次都要遵守的。模块特定的细节交给 Auto Attached，用到才加载。

下面两个模板照着改就能用。第一个是放在 `.cursor/rules/project.mdc` 的项目级核心约定，设为 Always：

```markdown
---
description: 项目整体技术栈与编码核心约定
alwaysApply: true
---

- 技术栈：TypeScript + React + Tailwind，禁止引入 jQuery
- 组件统一放 src/components/，一个组件一个目录
- 禁用 any，需要时用 unknown 加类型守卫
- 命名：组件 PascalCase，函数/变量 camelCase，常量 UPPER_SNAKE
- 提交前确保通过 lint 和类型检查
```

第二个是只在写接口时生效的规则，放 `.cursor/rules/api.mdc`，用 `globs` 做 Auto Attached：

```markdown
---
description: 编写后端接口时的返回格式与错误处理约定
globs: src/api/**/*.ts
---

- 接口返回统一 { code, data, message } 结构
- 错误统一抛 AppError，不要 return 裸错误对象
- 所有入参先用 zod 校验再处理
- 数据库操作必须在 try/catch 里，失败要记日志
```

两条一摆出来，规则的写法就具体了：核心规范设 Always 永远在场，模块规则用 globs 只在动相关文件时上场，每条都写成可执行的短约定而非空泛口号。

## **5. AGENTS.md 与旧版 .cursorrules**

如果你不想用 `.mdc` 那套带 frontmatter 的格式，Cursor 也支持纯 markdown 的 `AGENTS.md` 文件——直接在项目根目录写一个 `AGENTS.md`，把项目约定用普通 markdown 写进去即可，简单直接。它没有 `.mdc` 那么精细的触发控制，但胜在通用：`AGENTS.md` 是一个跨工具的开放约定，Codex 等其他工具也认它，写一份多个工具通用。

你可能还在老项目里见过根目录的 `.cursorrules` 文件，那是 Cursor 早期的规则格式，现在已被 `.cursor/rules/` 目录这套取代。老的还能用，但新项目建议用 `.cursor/rules/*.mdc` 或 `AGENTS.md`，别再用 `.cursorrules`。

## **6. 嵌套规则与团队共享**

规则系统还支持两个让它更强的能力。

一是嵌套规则：你可以在子目录里放各自的 `.cursor/rules/`，让某个模块有它专属的规则。比如 `src/frontend/.cursor/rules/` 放前端的约定，`src/backend/.cursor/rules/` 放后端的，AI 在动对应目录的代码时自动用上该目录的规则。大项目里这样按模块分治，比所有规则挤在根目录清晰得多。

二是团队共享：把 `.cursor/rules/` 提交到 git，团队每个人拉下代码就共享了同一套规则，所有人的 Cursor 都按相同的规范生成代码。这是规则最大的团队价值——把团队的编码规范从「写在 wiki 里靠自觉」变成「AI 自动执行」。Cursor 也支持在团队层面统一下发规则，让组织级的规范覆盖到每个成员。

> 【建议配图5 —— 规则的作用范围与团队共享】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的层级示意图。中央画一个项目目录树：根目录有 `.cursor/rules/`（标「项目级规则」），下面 `src/frontend/.cursor/rules/` 和 `src/backend/.cursor/rules/`（标「嵌套规则：各模块专属」，颜色稍异）。右侧画一个 git 图标和三个队友头像，用箭头表示规则随 git 提交、共享给全队（标「团队共享：人人同一套规范」）。底部再放一个 `AGENTS.md` 小图标，标「纯 markdown 替代，跨工具通用」。用引线把「根规则=全局」「嵌套规则=模块专属」「git=团队共享」三层关系标清楚。配色语义：蓝=项目级、绿=团队共享、灰=跨工具替代。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者看清规则可以按模块嵌套、可随 git 共享给团队，建立「全局规则 + 模块专属规则 + 团队统一」的结构观。

## **7. 与 CLAUDE.md 的类比**

如果你看过本系列的 Claude Code 部分，会发现 Cursor 的 Rules 和 CLAUDE.md 几乎是一回事：都是把项目约定写成文件、让 AI 常驻遵守、可提交 git 团队共享。

差别主要在触发的精细度。CLAUDE.md 是整份常驻加载；Cursor 的规则系统多了 `globs` 自动挂载、`description` 按需请求这些机制，能让不同规则在不同文件、不同任务时才上场，对上下文的利用更精打细算。但思路完全一致：项目的规矩别每次重说，写成文件让 AI 自动带上。理解了其中一个，另一个一看就通——这也是为什么本系列把三大工具放在一起讲，它们的核心概念是相通的，换工具时迁移成本很低。

## **8. 常见问题**

**Q：我建了规则文件，AI 不遵守？**
先确认是 `.mdc` 文件、放在 `.cursor/rules/` 下（普通 `.md` 会被忽略）。再看激活方式是否对——想让它每次都遵守就设 `alwaysApply: true`，想让它在改某类文件时生效就设 `globs`。

**Q：规则太多会不会拖慢或占满上下文？**
会，所以别把所有规则都设 Always。核心的设 Always，模块特定的用 `globs` 按需挂载，偶尔用的设 Manual，这样只有相关规则才进上下文。

**Q：`.cursorrules` 还能用吗？**
能，但它是旧格式。新项目用 `.cursor/rules/*.mdc` 或 `AGENTS.md`。

**Q：Rules 和 CLAUDE.md 能共存吗？**
能。如果你既用 Cursor 又用 Claude Code，可以用通用的 `AGENTS.md` 写一份多工具共享的约定，再用各自的精细机制补充工具特有的部分。

## **9. 小结**

Rules 是 Cursor 给 AI 立项目规矩的机制：把「用什么写法、放哪、怎么命名、避免什么」写成 `.cursor/rules/` 下的 `.mdc` 文件，靠 `description`、`globs`、`alwaysApply` 三个字段控制它在 Always、Auto Attached、Agent Requested、Manual 四种方式里怎么触发，让该用的规则在该用的时候自动上场。

用好它的关键是分而治之：核心规范设 Always 常驻，模块规则用 `globs` 按文件挂载，把规则拆细、写具体，再提交 git 让团队共享。它和 CLAUDE.md 同源异曲——把项目的约定沉淀成文件，让 AI 自动遵守，是所有这些工具共通的高效之道。

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
