---
title: 7. Skills 技能封装
description: Vibe Coding教程第19篇：Claude Code Skills 技能封装完全指南。讲透技能是什么、三层渐进加载机制、SKILL.md 目录结构与字段、与命令和 MCP 的区别、配套脚本、自动触发与调用控制，把团队流程沉淀成可复用技能。
category:
  - Vibe Coding
tag:
  - Vibe Coding
  - AI编程
  - Claude Code
  - Skills
---

你大概已经发现，有些指令你会一遍遍对 Claude 重复：怎么按团队规范审查代码、怎么生成符合格式的提交信息、怎么为一个文件补测试。每次都把这套流程从头敲一遍，又费字又容易漏。CLAUDE.md 能放一些常驻规矩，但它放的是「事实」，不适合放一长串「分几步怎么做」的流程；自定义命令能封装一段指令，但当流程复杂到需要配套脚本、模板、参考文档时，单个 markdown 文件也不够用了。

Skills（技能）就是为此而生的。它把一套专业知识、工作流程、最佳实践打包成一个可复用的技能包，需要时由 Claude 自动加载、或你手动调用。这一篇讲透 Skills：它是什么、那套省 Token 的三层加载机制怎么运作、一个技能由哪些文件组成、和命令与 MCP 怎么分工、怎么写一个带脚本的强力技能，以及怎么控制它的触发和分发。

## **1. Skills 是什么**

一个 Skill 就是一个目录，里面有一个必备的 `SKILL.md` 文件，写着「这个技能是干什么的」和「该怎么一步步做」。当你的请求匹配上某个技能的描述时，Claude 自动把它的指令加载进来照着做；你也可以用 `/技能名` 直接调用它。

它和你随手打的提示词有本质区别。提示词是临时的、每次都要重打、用完即散，没法跨会话复用；技能是持久的，配置一次就反复可用，能提交到 git 做版本管理、和团队共享。一句话：**凡是你会反复用到的流程，都值得从「每次重打的提示词」升级成「一次封装的技能」。**

![从重复提示词到可复用技能](../../../assets/img/vibe_coding/tools/claude_code/claude_code_skills/claude_code_skills1.png)

## **2. 与命令和 MCP 的分工**

刚接触时很容易把 Skills 和命令、MCP 搞混，先用一句话把它们的定位分清。

命令、技能、MCP 三者里，**Skills 和 MCP 是互补的两件事：Skills 告诉 AI「怎么做」，MCP 给 AI「能用什么」。** 技能是一段知识和流程（markdown 写的步骤），MCP 是一组工具和接口（连上外部系统的能力）。你可能既有一个「发布流程」技能告诉 Claude 按什么步骤发版，又接了 GitHub 的 MCP 让它真能去开 PR——一个管流程、一个管能力。

而命令和技能，在新版里其实是同一种东西的两种写法（命令已并入 Skills）。区别只在繁简：`.claude/commands/x.md` 是单文件的轻量写法，适合就是一段指令的简单命令；`.claude/skills/x/SKILL.md` 是带目录的技能写法，能附带脚本、模板、参考文档，能力更强，还能让 Claude 自动触发。

![提示词、命令、技能、MCP 四者定位](../../../assets/img/vibe_coding/tools/claude_code/claude_code_skills/claude_code_skills2.png)

## **3. 三层渐进加载机制**

理解 Skills 为什么能让你装一堆技能却几乎不占上下文，关键在它的三层渐进加载。这套机制是 Skills 设计上最巧妙的地方。

第一层是元数据。会话一启动，Claude 只把每个技能的名字和描述（`description`）读进上下文——每个技能只占几十个 token。这一层的作用，是让 Claude 知道「手头有哪些技能、各自管什么」，以便判断该不该用。

第二层是完整指令。只有当某个技能真正被触发（你调用、或 Claude 判断该用）时，它的 `SKILL.md` 正文才被加载进来，这部分通常几千 token。没被用到的技能，正文永远不进上下文。

第三层是配套文件。技能目录里的脚本、模板、参考文档，只有当流程真的需要时才被读取或执行，平时完全不占上下文。

![Skills 的三层渐进加载](../../../assets/img/vibe_coding/tools/claude_code/claude_code_skills/claude_code_skills3.png)

这套机制的好处很实在。换算成 token 体感：每个技能常驻的名字加描述只占几十 token，触发后加载的完整正文约几千 token，配套文件不占上下文。所以你可以在机器上装几十个技能，会话启动时它们加起来也只占很少的上下文；真正用到哪个，才把那个的完整内容调进来。装得多而不臃肿，这是 Skills 比「把所有流程都堆进 CLAUDE.md」高明的地方——CLAUDE.md 的内容每轮对话都常驻，而技能的正文只在用到时才进场。

正因为正文只在被触发时加载、之后整段留在对话里直到会话结束，写 `SKILL.md` 时要把它当成一套常驻指令来写：说清「做什么」，别啰嗦「为什么、怎么来的」，每一行都是会持续占用上下文的成本。和写 CLAUDE.md 一样，越精炼越好；篇幅长的参考资料挪到 `references/` 里按需加载，别堆在 `SKILL.md` 正文。

## **4. 一个技能由哪些文件组成**

技能是一个目录，`SKILL.md` 是入口和唯一必需的文件，其余都是可选的配套：

```text
my-skill/
├── SKILL.md          # 必需：技能定义（元数据 + 指令）
├── scripts/          # 可选：可执行脚本
│   └── helper.py
├── templates/        # 可选：输出模板
├── references/       # 可选：详细参考文档（用时才加载）
└── examples/         # 可选：示例输出
```

`SKILL.md` 本身分两部分：上面是 YAML frontmatter（元数据），下面是 markdown 正文（指令）。一个最简的代码审查技能长这样：

```markdown
---
name: review-pr
description: 审查当前改动的代码质量、安全与测试覆盖。用户说审查代码、看看这次改动时使用。
---

## 审查流程

1. 风格检查：命名是否清晰、注释是否充分、是否符合项目规范
2. 安全检查：有无潜在漏洞、敏感信息、缺失的输入校验
3. 测试检查：关键路径与边界情况是否有测试覆盖
4. 总体结论：列出优点、必改项、建议项，给出是否可以合并
```

frontmatter 里 `name` 是技能名（小写字母、数字、连字符），目录名通常就是调用名；`description` 是最关键的字段，Claude 全靠它判断什么时候该自动用这个技能，所以要写清「做什么 + 什么时候用」。正文就是 Claude 触发这个技能后要遵循的步骤。`allowed-tools` 可以预先授权这个技能用哪些工具而不必每次问你；`disable-model-invocation`、`user-invocable` 控制谁能调它（第 7 节细讲）；还有个 `context: fork` 能让技能在一个隔离的子代理里跑——适合那种独立的大任务，让它的执行过程不占用你主对话的上下文。

下面两个开箱即用的模板，复制到 `~/.claude/skills/对应目录/SKILL.md` 改改就能用。第一个是自动提交：

```markdown
---
name: git-commit
description: 检测改动、生成符合 Conventional Commits 规范的提交信息并提交。用户说提交代码、commit 时使用。
disable-model-invocation: true
allowed-tools: Bash(git add *), Bash(git status *), Bash(git diff *), Bash(git commit *)
---

## 执行流程
1. 跑 git status 和 git diff 看清这次改动
2. 生成 Conventional Commits 格式的中文提交信息（feat/fix/docs… 前缀）
3. 安全检查：确认没把 node_modules/、dist/、.env 等不该提交的东西带上，没有敏感信息
4. 把提交信息给我确认，确认后执行 commit，并问我要不要 push
```

第二个是为指定文件补单元测试：

```markdown
---
name: gen-test
description: 为某个文件或函数生成单元测试，覆盖正常、边界、异常情况。用户说补测试、写单测时使用。
---

## 工作流程
1. 读目标文件，识别它用的测试框架和现有测试风格
2. 生成测试，覆盖正常路径、边界值、异常输入
3. 真实跑一遍测试，确认能通过、能检出问题再交付
（JS/TS 用 Jest 或 Vitest，Python 用 pytest，Go 用 testing 包）
```

这两个一摆出来，技能的写法就具体了：一段 frontmatter 定清楚名字、描述、权限，一段正文写清分几步怎么做，Claude 在匹配到对应请求时就照着执行。

![技能目录结构与 SKILL.md 两部分](../../../assets/img/vibe_coding/tools/claude_code/claude_code_skills/claude_code_skills4.png)

## **5. 配套脚本让技能更强**

Skills 真正甩开普通提示词的地方，是能在目录里捆绑脚本，让 Claude 干一些单靠对话做不到的事。一个常见模式是生成可视化产物：技能里带一个脚本，Claude 调它生成一个 HTML 文件，在浏览器里打开看。

举个例子，做一个把当前代码库结构可视化成可折叠树状图的技能。`SKILL.md` 的 frontmatter 和指令这样写：

```markdown
---
name: codebase-visualizer
description: 把代码库结构生成一张可折叠的交互式树状图。探索新仓库、想看清项目结构、找大文件时使用。
allowed-tools: Bash(python3 *)
---

# 代码库可视化

从项目根目录运行脚本，它会扫描目录、生成一个自包含的 HTML 文件并在浏览器打开：
运行 python3 ${CLAUDE_SKILL_DIR}/scripts/visualize.py 加上当前目录。
生成的页面包含：可折叠目录、每个文件大小、按类型着色、各目录体积汇总。
```

把可视化脚本放在这个技能的 `scripts/visualize.py` 里，`${CLAUDE_SKILL_DIR}` 这个占位符会解析成技能所在目录，所以无论技能装在个人级、项目级还是插件里，脚本路径都对。`allowed-tools: Bash(python3 *)` 预先授权技能运行 python，免得每次问你。之后你只要说「把这个代码库可视化一下」，Claude 就会触发这个技能、跑脚本、生成并打开页面。

这个模式适用面很广：依赖关系图、测试覆盖率报告、数据库结构图，都能这么做——脚本干重活，Claude 负责编排。

![带脚本的技能生成可视化产物的实际效果](../../../assets/img/vibe_coding/tools/claude_code/claude_code_skills/claude_code_skills5.png)

## **6. 写好 description 是触发的关键**

技能能不能在该用的时候被 Claude 自动用上，几乎全取决于 `description` 写得好不好。Claude 没有硬编码的路由规则，完全靠读你的描述、用语言理解去判断该不该触发某个技能。所以描述写得越具体、越贴近用户真实会说的话，触发就越准。

对比一下就清楚。模糊的写法只说功能、不说场景：

```
description: 帮我提交代码
```

具体的写法把「做什么 + 什么时候用 + 触发词」都点到：

```
description: 检测改动、生成符合 Conventional Commits 规范的提交信息并提交。
用户说提交代码、commit、帮我提交时使用；提交前会检查敏感信息。
```

后者把用户可能说的话（提交代码、commit）写了进去，Claude 一听到这类请求就能准确匹配。这和写自定义命令的描述、写子代理的描述是同一个道理：描述是触发的钥匙，写具体了，自动化才灵。

![description 好坏决定能否被触发](../../../assets/img/vibe_coding/tools/claude_code/claude_code_skills/claude_code_skills6.png)

## **7. 控制谁能调用**

默认情况下，一个技能既能你手动 `/调用`，Claude 也能在合适时自动触发。两个 frontmatter 字段让你收紧这个行为。

`disable-model-invocation: true` 表示只有你能手动调，Claude 不会自动触发。这适合有副作用、你想自己掌握时机的技能，比如 `/deploy`、`/commit`——你不希望 Claude 看代码差不多了就自作主张部署。`user-invocable: false` 则相反，表示只有 Claude 能用、不出现在 `/` 菜单里，适合那种是背景知识、用户不会直接当命令调用的技能，比如一段「这个老系统是怎么工作的」的参考资料。

一个原则：只读、安全的技能可以放开自动触发；有副作用、有风险的，加 `disable-model-invocation: true` 把扳机攥在自己手里。这一套和命令篇讲的调用控制完全一致，因为它们本就是同一套机制。

## **8. 创建技能的两种方式**

不必从零手写。最省事的两条路：

一是直接让 Claude 帮你建。你用一句话把需求说清楚——技能叫什么、干什么、分几步、有什么要求——让它生成 `SKILL.md`。这适合简单技能，也适合你清楚要什么、但不熟悉格式的时候。

二是用官方的 `skill-creator` 插件。它把创建流程规范化，适合做复杂、要反复打磨的技能。它最值钱的地方是能帮你给技能做评估：一个技能光看到它被触发，不等于它做对了——评估要分别量两件事，该触发时是否真的触发、触发后输出对不对。`skill-creator` 会让你写几条真实的测试用例，分别在「装了技能」和「关掉技能」两种情况下各跑一遍做对比，告诉你这个技能到底有没有带来改进、有没有在不该触发时乱触发，还能在你改了技能后做新旧版本的盲测，确认这次改动确实是进步再提交。对要长期维护的重要技能，这套评估能省掉很多「以为改好了其实变差了」的坑。

技能建好后，直接在磁盘上加的需要重启会话或用 `/reload-skills` 重扫才生效；通过界面建的立即可用。用 `/skills` 能列出当前所有可用技能、看各自占多少 token、隐藏不想要的。

## **9. 共享与分发**

技能最大的价值之一是沉淀团队经验。三种分发方式按受众选：项目级技能放进 `.claude/skills/` 提交到 git，团队克隆项目就自动拥有；想跨项目、跨团队分发的，打包成插件（下一种扩展形态，后面专门讲）；组织级统一下发的，走托管设置。

把团队的审查规范、发布流程、文档模板都做成项目技能提交上去，新人拉下代码就继承了整套最佳实践，比写一堆 wiki 让大家照着做有效得多——因为技能是 Claude 真正会执行的流程，不是躺在文档里的文字。

## **10. 常见问题**

**Q：技能建好了不被触发？**
最常见三个原因：一是 frontmatter 的 YAML 格式有错，检查 `---` 和缩进；二是 `description` 太笼统，补上具体功能、使用场景和用户会说的触发词；三是新建后没生效，重启会话或 `/reload-skills`。

**Q：技能和自定义命令到底什么关系？**
同一套机制的两种写法。就一段指令的简单活，用 `.claude/commands/` 单文件最省事；需要带脚本、模板，或想让 Claude 自动触发的完整工作流，用 `.claude/skills/` 目录。两者同名时技能优先。

**Q：技能和 MCP 该用哪个？**
看你缺的是「流程」还是「能力」。要规范 Claude 按什么步骤做事，用技能；要让它能访问一个它原本够不着的外部系统（数据库、GitHub），用 MCP。两者常配合使用。

**Q：装很多技能会拖慢或占满上下文吗？**
不会。三层加载机制下，启动时只加载每个技能几十 token 的名字和描述，完整内容用到才加载。放心多装。

**Q：怎么知道某个技能占了多少上下文？**
`/skills` 里按 token 排序就能看到，也能在那里把占用大又不常用的技能隐藏掉。

## **11. 小结**

Skills 把你和团队反复使用的流程，从每次重打的提示词，升级成一次封装、处处可用、可版本管理的技能包。它和 MCP 是互补的两半——技能告诉 AI 怎么做，MCP 给 AI 能用什么；它和命令是同一套机制的繁简两种写法，简单的用命令、复杂的带配套文件的用技能。

真正用好它，记住两件事：靠那套三层加载机制，你可以放心地把一堆技能装上而不担心上下文；靠一个写得具体的 `description`，让该用的技能在该用的时候被准确触发。把团队的专家经验一个个沉淀成技能提交进仓库，AI 干活就不再是每次从头交代，而是带着你们积累的整套流程上手。

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
