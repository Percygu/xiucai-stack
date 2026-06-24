---
title: 4. MCP Server 集成完全指南
description: Vibe Coding教程第16篇：Claude Code MCP 集成完全指南。讲透 MCP 是什么、四种传输类型、claude mcp add 配置、三种作用域、认证与 Tool Search，以及常用 server 的接入与排错。
category:
  - Vibe Coding
tag:
  - Vibe Coding
  - AI编程
  - Claude Code
  - MCP
---

到目前为止，Claude Code 干的活基本都在你本地的代码和文件范围内。但真实开发里，信息是散的：需求躺在 GitHub issue 里，数据存在数据库里，线上报错堆在 Sentry 上，设计稿挂在 Figma 里。要让 Claude 用上这些，你只能一遍遍打开对应工具、复制内容、粘进对话框——干的全是人肉搬运的活。

MCP 就是来终结这种搬运的。它让 Claude Code 直接连上这些外部工具和数据源，自己去读、去查、去写。这一篇把 MCP 一次讲透：它是什么、四种传输怎么选、怎么用一条命令接上一个 server、三种作用域如何决定共享范围、认证怎么走、新版默认开启的 Tool Search 帮你省了什么，以及常用 server 的接法和出问题时的排查路径。

## **1. MCP 是什么**

MCP 全称 Model Context Protocol（模型上下文协议），是一个开放标准，专门用来把 AI 和各种外部工具、数据源连起来。一个 MCP server 就是按这个协议写的连接器：一头接着某个外部系统（GitHub、数据库、浏览器、监控平台……），另一头把这个系统的能力按统一格式暴露给 Claude Code。连上之后，Claude 就能直接调用那个系统。

一个 MCP server 通常给 Claude 提供三类东西。最核心的是工具，也就是让 Claude 去执行的操作，比如查数据库、创建 PR、打开网页——接上 server 后 Claude 多出来的本事，主要就是这些工具。其次是资源，指可被引用的数据，比如某个 issue、某条记录，你能像引用本地文件一样用 `@` 把它拉进对话。最后是提示，指 server 预置的指令模板，会以斜杠命令的形式出现在 `/` 菜单里。日常用得最多的是工具，资源和提示在第 9 节再展开。

因为 MCP 是开放标准，它有一个很实在的好处：一次接入、处处可用。任何工具只要按协议提供了 server，就能被 Claude Code 接入，也能被其他支持 MCP 的 AI 工具接入；你不必为每个工具学一套对接方式，统一用 `claude mcp add` 就行。这也是为什么如今主流云服务（Notion、Linear、Sentry、Stripe、HubSpot 等）几乎都提供了官方 MCP server。

![MCP 把 Claude Code 连接到外部工具的全景图](../../../assets/img/vibe_coding/tools/claude_code/claude_code_mcp/claude_code_mcp1.png)

判断要不要接一个 server，有个很准的信号：当你发现自己反复从某个工具里复制内容、再粘进对话框时，就该把那个工具接进来了。接上之后，Claude 不再依赖你粘的片段，而是直接读取和操作那个系统本身。反过来，也不是什么都值得接。如果一件事 Claude 用已有能力就能干——读写你项目里的文件、跑个 shell 命令、用内置的网页搜索——那就不必专门接 server。一个干净的判断标准：这件事需要访问一个 Claude 默认进不去的外部系统吗？需要，才接 MCP；不需要，直接让它做。别为接而接，每多一个 server 都会多占一点上下文、多一份维护成本。

![该不该接 MCP 的判断流程](../../../assets/img/vibe_coding/tools/claude_code/claude_code_mcp/claude_code_mcp2.png)

## **2. MCP 能帮你做什么**

接上 server 之后，你就能用一句自然语言指挥 Claude 完成原本要跨好几个工具才能做完的事。官方文档给的几个例子很有代表性：把 JIRA 上 ENG-4521 这个 issue 描述的功能实现了、在 GitHub 提个 PR（对接 issue 跟踪系统）；看看 Sentry 上这个功能最近 24 小时报了哪些错（分析监控数据）；从 PostgreSQL 里查出用过这个功能的 10 个用户邮箱（查询数据库）；照着 Slack 里贴的新 Figma 设计更新邮件模板（接入设计稿）；给这 10 个用户各起草一封 Gmail 邀请邮件（自动化流程）。

这些指令的共同点是跨系统。以前你得在浏览器、数据库工具、监控面板、编辑器之间来回切，手动把每一处的信息搬到下一处；接上对应 server 后，Claude 把整条链路替你串起来，你只管说要什么结果。

还有一种更进阶的玩法：有些 MCP server 不只被动等 Claude 调用，还能主动往会话里推消息，这叫 channel。配合它，Claude 能在你离开电脑时，对 CI 结果、监控告警、Telegram / Discord 消息等外部事件做出反应。这属于偏高级的能力，要在 server 端声明 `claude/channel` 能力、启动时用 `--channels` 开启，现在知道 MCP 不止单向调用、还能双向交互即可。

## **3. 四种传输类型**

接一个 server 前，先搞清楚它和 Claude Code 之间走哪种传输。这决定了你怎么配。很多人记的是三种，最新官方文档其实是四种，先建立完整认知再动手。

**HTTP（远程，首选）**：连接云端服务的推荐方式，适配最广。Notion、Stripe、Sentry 这类云服务都提供 HTTP 端点，给个 URL 就能连。配置文件里写 `type` 时，`http` 和 `streamable-http` 是同一个东西的两个名字——MCP 规范叫它 `streamable-http`，所以从 server 官方文档里抄来的配置不用改名也能用。

**stdio（本地）**：server 作为一个本地进程跑在你电脑上，适合需要直接访问你系统、或自定义脚本的工具。它通过标准输入输出和 Claude Code 通信，配置时要给出启动这个进程的命令。

**SSE（已废弃）**：早期的远程传输方式，官方已不推荐，能用 HTTP 就别用它。这里提一句，只是为了你看到老配置时认得出。

**WebSocket（远程，小众）**：保持一条持久的双向连接，适合那些会主动给 Claude 推事件的远程 server。但它只能用静态请求头认证、不支持 OAuth，也不支持 `claude mcp add --transport` 那种加法，得用配置文件或 `add-json` 加。普通场景几乎用不到，知道有这么个选项即可。

怎么判断某个服务该用哪种？看它的官方文档或连接器目录：给你一个 URL 的就是 HTTP（远程），让你在本地跑一条命令（`npx`、`python` 之类）把 server 启动起来的就是 stdio（本地）。一句话收口：**连云端服务用 HTTP，跑本地工具用 stdio，照官方说明配不会错。**

![MCP 四种传输类型对比](../../../assets/img/vibe_coding/tools/claude_code/claude_code_mcp/claude_code_mcp3.png)

## **4. 添加一个 server**

加 server 用 `claude mcp add`，在终端里运行（不是在 Claude Code 对话里）。

**加一个 HTTP 远程 server**，给出名字和 URL：

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

如果服务需要一个静态令牌，用 `--header` 带上：

```bash
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer YOUR_TOKEN"
```

**加一个 stdio 本地 server**，要在 `--` 后面写出启动它的命令：

```bash
claude mcp add --env AIRTABLE_API_KEY=YOUR_KEY --transport stdio airtable \
  -- npx -y airtable-mcp-server
```

这条命令的意思是：启动一个叫 airtable 的本地 server，用 `npx -y airtable-mcp-server` 把它跑起来，并通过 `--env` 把 API key 注入它的环境变量。这里的 `--` 双横线很关键，它把 Claude 自己的选项（`--transport`、`--env`、`--scope`）和后面真正启动 server 的命令分隔开，`--` 之后的内容会原样传给 server。少了它，Claude 会把 server 的参数（比如某个 `--port`）误当成自己的选项去解析，于是报错。还有个容易踩的小坑：`--env` 后面如果紧跟 server 名字，CLI 会把名字当成又一个 `KEY=value` 而报错，所以要在 `--env` 和 server 名字之间至少隔一个别的选项（像上面那样把 `--transport` 放中间）。需要多个环境变量时，`--env` 可以重复写。很多本地 server 靠环境变量传密钥，这也是 stdio server 最常见的配置点，配错了往往就是 server 起不来的原因。

如果你手上已经有一段现成的 JSON 配置（比如从某个 server 的文档里抄来的），不用拆成命令行参数，直接用 `claude mcp add-json` 整段塞进去：

```bash
claude mcp add-json weather-api \
  '{"type":"http","url":"https://api.weather.com/mcp","headers":{"Authorization":"Bearer token"}}'
```

配好后，重新进入 Claude Code，在对话里敲 `/mcp` 就能看到这个 server 的连接状态，需要 OAuth 授权的也在这里完成登录。

![`/mcp` 面板查看已连接的 MCP server 状态](../../../assets/img/vibe_coding/tools/claude_code/claude_code_mcp/claude_code_mcp4.png)

还有两条省事的接入路径值得知道。一是**从 Claude Desktop 导入**：如果你在 Claude 桌面端配过 server，直接 `claude mcp add-from-claude-desktop`，它会列出来让你勾选导入（仅 macOS 和 WSL 可用）。二是**复用 claude.ai 的连接器**：如果你用 Claude.ai 账号登录的 Claude Code，你在 claude.ai 上加过的连接器会自动出现在 Claude Code 里，`/mcp` 就能看到，不必重配。注意这条只在你当前用的是 Claude.ai 订阅认证时生效——如果你设了 `ANTHROPIC_API_KEY` 或走第三方中转，这些连接器不会加载，用 `/status` 能确认当前是哪种认证。

## **5. 三种作用域**

和命令、CLAUDE.md 一样，MCP server 也分作用域，决定它在哪些项目里生效、要不要和团队共享。用 `--scope` 指定，共三种：

| 作用域 | 在哪生效 | 是否共享 | 存在哪 |
|---|---|---|---|
| `local`（默认） | 仅当前项目，只对你 | 否 | `~/.claude.json` |
| `project` | 仅当前项目，对全团队 | 是，随仓库提交 | 项目根目录 `.mcp.json` |
| `user` | 你的所有项目 | 否 | `~/.claude.json` |

`local` 是默认值，加 server 时不写 `--scope` 就是它：只在当前项目对你自己生效，适合放个人的、带私密凭证的、还在试验的 server。（顺带一提，老版本里 local 曾叫 project、user 曾叫 global，你在旧资料里看到那两个名字时知道是同一回事即可。）

`project` 用于团队共享：它把配置写进项目根目录的 `.mcp.json`，这个文件提交到 git 后，团队每个人拉下来就都有了。一份典型的 `.mcp.json` 长这样：

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

把它提交上去，整个团队就共享了同一套 MCP 集成，比让每人各自手配高效得多。出于安全，项目级 server 第一次会要你确认信任后才加载——别人提交进仓库的 server，你得过一眼再批准，想重置这些批准选择可以用 `claude mcp reset-project-choices`。

`project` 作用域还支持环境变量展开，让团队既能共享配置、又不必把密钥写死进仓库。`.mcp.json` 里可以用 `${VAR}` 引用环境变量、用 `${VAR:-默认值}` 给个兜底值，`url`、`headers`、`command`、`args`、`env` 都支持：

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": { "Authorization": "Bearer ${API_KEY}" }
    }
  }
}
```

这样仓库里只放占位的变量名，密钥各人在自己机器的环境变量里配，既共享了连接信息又不泄露凭证。

`user` 是跨项目个人级：加了之后在你所有项目里都能用，适合你个人离不开、又不必塞进每个项目的 server。

```bash
claude mcp add --transport http --scope user hubspot https://mcp.hubspot.com/anthropic
```

一句话选型：**只给自己用、含私密凭证的用 `local`（默认）；要团队共享的用 `project`；自己跨项目都要用的用 `user`。** 拿不准先用默认 local，之后要共享或跨项目再调，成本很低。如果同一个 server 在多个作用域都定义了，Claude 按 local → project → user → 插件 → claude.ai 连接器的优先级取最高的那份，不会把字段混着用。

![MCP server 的三种作用域](../../../assets/img/vibe_coding/tools/claude_code/claude_code_mcp/claude_code_mcp5.png)

## **6. 远程 server 的认证**

云端 server 大多需要认证，Claude Code 主要支持两条路。

第一条是**静态令牌**，用前面讲过的 `--header` 写死。最典型的是 GitHub——注意这是新版的正确接法，和早期纯走 OAuth 的写法不同。你先去 GitHub 的 token 设置页生成一个 fine-grained 个人访问令牌（PAT），授权它能访问你要 Claude 操作的仓库，然后把令牌作为请求头带上：

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer YOUR_GITHUB_PAT"
```

第二条是 **OAuth 授权**。很多服务（Sentry、Notion 等）支持 OAuth，加完 server 后在 Claude Code 里敲 `/mcp`，它会引导你在浏览器里完成登录授权。Claude Code 判断一个 server 需要 OAuth 的依据是：server 返回了 `401` 或 `403`，于是它在 `/mcp` 里把这个 server 标记成待授权。令牌会被安全存储、自动刷新，想撤销就在 `/mcp` 菜单里选清除认证。

```bash
# 以 Sentry 为例：先加上，再用 /mcp 走浏览器授权
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

绝大多数服务这两条就够了。少数 server 不支持自动 OAuth 注册，会让你先在它的开发者后台注册一个 OAuth 应用、拿到 client id / secret，再用 `--client-id`、`--client-secret`、`--callback-port` 这几个参数配——碰到再查官方说明即可，日常很少遇到，知道有这条路就行。

## **7. 管理你的 server**

加完之后，几个命令在终端里帮你管理：

```bash
claude mcp list          # 列出所有已配置的 server 及连接状态
claude mcp get github    # 看某个 server 的详细配置
claude mcp remove github # 删掉某个 server
```

在 Claude Code 会话里，则用 `/mcp` 查看实时连接状态、完成 OAuth 授权、手动重连断开的 server。`/mcp` 面板还会在每个 server 旁标出它暴露了多少个工具，方便你确认它真的提供了能力。

server 连上后，它的工具就进入 Claude 的可用工具池，Claude 会在判断需要时自己调用——你不必手动指定，但明确点名（比如让它用 GitHub 那个工具去看 issue）能让它命中更准。这些来自 server 的工具，同样受你的权限设置管控：涉及写操作的，Claude 调用前默认会问你，和它用内置工具时一致。

几个让你少踩坑的运行细节。其一，HTTP / SSE 远程 server 中途断连会自动重连：最多五次，从 1 秒延迟开始翻倍退避，重连期间在 `/mcp` 里显示 pending；本地 stdio server 是本地进程，不会自动重连，需手动处理。其二，如果某个 server 的工具调用经常超时（比如要跑很久的数据库查询），可以在 `.mcp.json` 里那个 server 下加一个 `timeout` 字段，单位毫秒，比如 `"timeout": 600000` 就是十分钟，只对它生效。其三，当一个 server 的工具输出特别大（比如查了一张大表），Claude Code 在超过 1 万 token 时会给提示，默认上限 2.5 万 token，需要更大可以设环境变量 `MAX_MCP_OUTPUT_TOKENS`。

## **8. Tool Search 省下你的上下文**

这是新版一个默认就开、但很多人没意识到的特性，值得单独讲，因为它直接关系到你能放心接多少个 server。

接的 server 越多，它们暴露的工具就越多。早先所有工具的定义会在会话一开始就全部塞进上下文，server 一多，上下文还没开始干活就被工具定义占掉一大块。Tool Search 改变了这一点：会话启动时只加载工具的名字和 server 的简介，具体的工具定义先不加载；等 Claude 判断某个任务真的需要某个工具时，再通过一个搜索动作把它取出来，只有真正用到的工具才进入上下文。

对你来说，用法和以前完全一样，感受不到差别，但代价小了很多——多接几个 server 对上下文窗口的占用变得很轻，你可以更放心地把常用工具都接上。这个能力默认开启，绝大多数人不用动它。只有少数特殊场景（用 Vertex AI、或把 `ANTHROPIC_BASE_URL` 指向了非官方的中转）它会自动关掉，需要时用 `ENABLE_TOOL_SEARCH` 环境变量显式控制。如果你有个别 server 的工具希望每轮都直接可见、不走搜索，可以在它的配置里加 `"alwaysLoad": true`，让它的工具在启动时就全部加载。

![Tool Search 如何省上下文](../../../assets/img/vibe_coding/tools/claude_code/claude_code_mcp/claude_code_mcp6.png)

## **9. 常用 server 实战**

讲再多不如真接一个。下面四个是日常最实用的，接法各代表一类典型场景，看完你就掌握了大部分 server 的套路。

**GitHub（HTTP + PAT）**：让 Claude 直接读 issue、看 PR、提交代码。接法就是第 6 节那条带 PAT 的命令。接上后你可以说审查一下 PR #456 给点改进建议、把刚发现的 bug 建成一个 issue、列出所有指派给我的待办 PR，它会自己去 GitHub 上读写，全程不用你切到浏览器。

**Playwright（stdio，操作浏览器）**：让 Claude 能真正打开浏览器、点击、截图、读页面。这对前端开发特别有用——它能自己打开你做的页面看效果、验证交互。它是本地 stdio server，即加即用、无需授权：

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

**PostgreSQL（stdio，查数据库）**：接上后 Claude 能直接查你的库。用 dbhub 这个通用 server，通过 `--dsn` 传连接串（生产库强烈建议用只读账号）：

```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:pass@prod.db.com:5432/analytics"
```

接上后你可以让它统计这个月的总营收、看看 orders 表的结构、找出 90 天没下单的客户，它自己写 SQL、执行、把结果给你，省去你打开数据库工具的功夫。边开发边核对真实数据时特别顺手。

**Sentry（HTTP + OAuth，看线上报错）**：接法是第 6 节那条 Sentry 命令，加完用 `/mcp` 授权。之后你可以问最近 24 小时最常见的报错是什么、某个错误 ID 的调用栈、是哪次部署引入了这批新错，它会自己去拉报错详情、结合代码帮你定位，不用你在监控面板和编辑器之间反复切。

把接入任何 server 的主线记牢，就三步：**`claude mcp add` 加上 → `claude mcp list` 或 `/mcp` 验证连上 → 用自然语言指挥 Claude 调用。** 区别只在第一步的传输类型和参数。

![接好一个 server 后用自然语言指挥 Claude 调用的实际效果](../../../assets/img/vibe_coding/tools/claude_code/claude_code_mcp/claude_code_mcp7.png)

MCP 真正的威力，在多个 server 配合时才显现。假设你同时接了 GitHub、PostgreSQL 和 Sentry，就能下一个跨系统的指令：看看 Sentry 上登录接口最近的报错，对照数据库里受影响的用户量，定位代码里的问题，修好后提个 PR。Claude 会依次调用 Sentry 拉报错、查数据库估算影响、读改代码、再用 GitHub 提 PR，一条龙完成。这种以前要你在四五个工具之间手动穿梭、反复复制粘贴的协作，现在它替你把整条链路串了起来。接的 server 越多、越互补，它能独立完成的事就越完整。

![多 server 协作的一条龙跨系统流程](../../../assets/img/vibe_coding/tools/claude_code/claude_code_mcp/claude_code_mcp8.png)

去哪找 server？Anthropic 维护了一个连接器目录（`claude.ai/directory`），里面是审核过的常用 server，找到需要的，照它给的 `claude mcp add` 命令配上即可，大多数主流服务都能找到现成官方 server。如果你想接的工具没有现成 server，还能让 Claude 帮你搭一个——官方提供了 `mcp-server-dev` 插件，装上后用它的 build 技能，Claude 会问清你的用途，帮你脚手架出一个远程或本地 server。这属于进阶玩法，普通用户用现成的就够了。

## **10. 用 MCP 的资源和命令**

server 除了提供工具，还能暴露资源和提示，用熟了很顺手。

**资源（用 `@` 引用）**：有些 server 把它管理的数据作为资源暴露出来，你可以在对话里用 `@` 引用，就像引用本地文件一样，把外部数据直接拉进上下文。格式是 `@服务器名:协议://资源路径`，比如 `@github:issue://123` 引用某个 GitHub issue，`@postgres:schema://users` 引用某张表的结构，一条指令里还能同时引用多个。具体能引用什么，取决于那个 server 暴露了哪些资源，打 `@` 时菜单里会连同本地文件一起列出来。

**提示作为命令**：有些 server 预置了一批提示模板，它们会以 `/mcp__服务器名__提示名` 的格式出现在 `/` 命令菜单里，随 server 连接动态出现。比如 `/mcp__github__list_prs` 列出 PR，后面还能跟参数，像 `/mcp__github__pr_review 456`。你在命令篇里见过的那些带双下划线的长命令，就是这么来的。

这两样不是每个 server 都有，但碰到时知道怎么用，能让 MCP 集成发挥得更充分。

## **11. 安全注意事项**

MCP 让 Claude 连上外部系统，能力变强的同时也带来新的安全面，几条底线必须守住。

**只接你信任的 server。** 一个 MCP server 本质是一段会运行的代码（stdio 的更是直接在你机器上跑进程），它能拿到你授予的权限。更要警惕的是，能抓取外部内容的 server 会把你暴露在提示注入风险下——外部页面里如果藏着恶意指令，可能被 Claude 当成你的命令执行。所以别随手从来路不明的地方复制 `claude mcp add` 就跑，优先用官方目录里审核过的、或你清楚来源的。这也是 Claude Code 对项目级 `.mcp.json` 的 server 默认要你确认信任才加载的原因。

**凭证别提交进仓库。** 带密钥、token 的 server，用 `local` 或 `user` 作用域（存在 `~/.claude.json`，不进 git）。如果团队要共享一个需要密钥的 server，用第 5 节讲的环境变量展开：仓库里只放 `${API_KEY}` 这样的占位，密钥各人在本地环境变量里配。

**给有写权限的 server 多留个心眼。** 能改数据、能提交代码、能发消息的 server，赋予它的能力越大，出问题的影响也越大。配合权限设置（`/permissions`）控制好哪些操作要确认，别让 Claude 在你不知情时通过某个 server 做了不可逆的操作。如果你在用组织统一下发的配置，管理员还能在企业级用 `allowedMcpServers` / `deniedMcpServers` 限定大家能连哪些 server。

## **12. 常见问题排查**

**Q：`claude mcp add` 加完了，但 server 连不上？**
先 `claude mcp list` 看状态。远程 HTTP server 多半是 URL 错了或要认证——用 `/mcp` 走一遍 OAuth，或检查 `--header` 里的令牌是否对该端点有效。本地 stdio server，则确认 `--` 后面的启动命令本身能在终端单独跑通。

**Q：项目里别人配的 server 显示待批准？**
项目级（`.mcp.json`）的 server 出于安全，第一次需要你确认信任才加载，在 `claude mcp list` 里显示为 `⏸ Pending approval`。交互式运行 `claude` 进去确认即可；想重置之前的选择用 `claude mcp reset-project-choices`。

**Q：本地 stdio server 一直起不来？**
最常见三个原因：一是 `--` 后面的启动命令有问题，把它单独拷到终端跑一遍看报什么错；二是缺环境变量，很多 server 靠 `--env` 传密钥，漏了就起不来；三是依赖没装好，比如 `npx` 拉的包名写错或网络拉不下来。逐一排掉即可。

**Q：server 连上了，但 Claude 不用它？**
确认你的指令和这个 server 的能力对得上。有时是 Claude 没意识到该用某个工具，明确点出来，比如让它用 GitHub 那个工具去看 issue #42，它就会调用了。

**Q：远程 server 老是断？**
HTTP server 断连会自动重连（最多五次），五次后仍失败就在 `/mcp` 里手动重试；持续失败一般是服务端或网络问题，检查网络和服务状态。

**Q：怎么看自己到底配了哪些 server、配在哪？**
`claude mcp list` 看全部，`claude mcp get <名字>` 看某个的详细配置。project 级的来自项目 `.mcp.json`，local 和 user 级的存在 `~/.claude.json`，从这里能看出某个 server 是哪个作用域。

## **13. 小结**

MCP 把 Claude Code 从只懂你本地代码，扩展成能直接对接外部世界的协作者：GitHub 的 issue、数据库的数据、浏览器的页面、监控平台的报错，连上之后它都能自己读写，不必你再当人肉搬运工。

用好它的关键就一条主线：按传输类型（云端 HTTP、本地 stdio）用 `claude mcp add` 把 server 加上，用 `--scope` 选好作用域，再用 `/mcp` 管理连接和授权。有了默认开启的 Tool Search，你可以放心地把常用工具都接上而不必担心上下文被占满。从你最常复制粘贴的那个工具开始接第一个，你会立刻感到 Claude Code 的能力边界在向外扩张——它不再只是个会写代码的助手，而是一个能调度你整套工具链的伙伴。

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
