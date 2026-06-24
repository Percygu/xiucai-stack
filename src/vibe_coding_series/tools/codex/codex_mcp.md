---
title: 5. MCP 集成完全指南
description: Vibe Coding教程第33篇：Codex MCP 集成完全指南。讲透在 config.toml 配置 server、用 codex mcp 命令管理、stdio 与 HTTP 两种传输、会话自动启动与常用 server 接入。
category:
  - Vibe Coding
tag:
  - Vibe Coding
  - AI编程
  - Codex
  - AI编程工具
---

和 Claude Code、Cursor 一样，Codex 也能通过 MCP 连上外部工具和数据源——让它直接读 GitHub 的 issue、查你的数据库、操作浏览器，而不必你来回复制粘贴。MCP 是什么、为什么值得用，本系列在 Claude Code 的 MCP 篇里已经讲透，那套概念和判断标准在 Codex 这边完全通用。

这一篇只讲 Codex 这边怎么配：用什么命令加 server、配置写在哪、两种传输怎么选，以及连上之后怎么用。

## **1. MCP 在 Codex 里的位置**

回顾一句：当你发现自己反复从某个工具复制内容粘进对话时，就该把那个工具接进来。接上之后，Codex 不再依赖你粘的片段，而是直接读写那个系统本身——GitHub、数据库、浏览器、监控平台都可以。因为 MCP 是开放标准，同一个 server 既能接进 Claude Code、Cursor，也能接进 Codex，你不必为每个工具学一套对接方式。

Codex 的 MCP 配置和它的其他设置放在一起，都在 `config.toml` 里（全局 `~/.codex/config.toml`，或受信任项目的 `.codex/config.toml`）。CLI 和 IDE 扩展两种形态都支持 MCP，连上的 server 在它们之间通用。

> 【建议配图1 —— Codex 通过 MCP 连接外部工具】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的中心辐射图。正中央放 Codex（黑色花瓣图标 + 终端窗口轮廓），从它向四周伸出带双向箭头的连接线，每条线中段标「MCP」，末端连一个外部工具的官方品牌图标并标注：GitHub（黑色猫头）、PostgreSQL（蓝色大象/圆柱）、浏览器（Chrome 彩色圆环）、Sentry（紫色标志）。每个外部图标用各自品牌色，中央 Codex 最醒目。底部小字「连上后 Codex 直接读写这些系统，不必你复制粘贴」。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者看懂 Codex 也能通过 MCP 连上各种外部工具，概念和其他工具完全通用。

## **2. 两种传输类型**

Codex 支持两种 MCP 传输，配置略有不同，先分清。

**stdio（本地）**：server 作为一个本地子进程跑在你机器上，Codex 启动它、通过标准输入输出和它通信。适合本地安装的工具、自定义脚本。配置时要给出启动这个进程的命令。

**Streamable HTTP（远程）**：连接一个跑在远端、通过 HTTP 访问的 server，支持 OAuth 和 bearer token 认证。适合云端托管的 MCP 服务。

判断很简单：让你在本地跑一条命令（`npx`、`python` 之类）把 server 启动起来的，就是 stdio；给你一个 URL 的，就是 Streamable HTTP。本地工具走 stdio，云端服务走 HTTP。

> 【建议配图2 —— Codex MCP 的两种传输】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的左右两栏对比图。左栏「stdio（本地）」配蓝色：画一台笔记本+终端/进程图标，标「server 作为本地子进程，Codex 启动并通信」，底部小字「本地工具、自定义脚本」，示例 `codex mcp add ... -- npx ...`。右栏「Streamable HTTP（远程）」配绿色：画一朵云+地球图标，标「连远端 HTTP server，支持 OAuth/token」，底部小字「云端托管服务」。两栏用浅色竖线分隔。配色语义：蓝=本地、绿=远程。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者分清 Codex MCP 的两种传输——本地 stdio 和远程 Streamable HTTP，知道自己的场景该用哪种。

## **3. 用 codex mcp 命令添加**

加 server 最方便的方式是 `codex mcp` 命令。加一个本地 stdio server，在 `--` 后写出启动命令，需要的环境变量用 `--env` 传：

```bash
codex mcp add github --env GITHUB_TOKEN=你的令牌 -- npx -y @modelcontextprotocol/server-github
```

这里 `--` 把 Codex 自己的选项和后面真正启动 server 的命令分开，`--` 之后的内容原样传给 server——这个用法和 Claude Code 的 `claude mcp add` 几乎一致。

加完之后，几个命令管理已配置的 server：

```bash
codex mcp list          # 列出已配置的 server
codex mcp login         # 给需要认证的远程 server 登录授权
codex mcp --help        # 看全部 MCP 子命令
```

> 🔴待截图3 —— codex mcp list 查看已配置的 server
>
> 截图位置：终端里运行 `codex mcp list`
> 截图内容：列出的已配置 MCP server 及其状态
> 标注要求：用红框框出某个 server 的状态
> 建议保存为：../../../assets/img/vibe_coding/tools/codex/codex_mcp/codex_mcp3.png

## **4. 在 config.toml 里直接配**

命令之外，你也可以直接编辑 `config.toml`。MCP server 配在 `[mcp_servers]` 表下，每个 server 一个条目。一个本地 server 大致这样：

```toml
[mcp_servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_TOKEN = "你的令牌" }
```

配多个 server 就并列写多个 `[mcp_servers.xxx]` 块。下面同时配一个本地 stdio 的浏览器自动化和一个远程 HTTP 的服务：

```toml
[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp@latest"]

[mcp_servers.remote_api]
url = "https://mcp.example.com/mcp"
bearer_token = "你的令牌"
```

本地 server 用 `command`/`args`/`env`，远程 HTTP server 给 `url`、需要认证再加 token。放在全局 `~/.codex/config.toml` 对所有项目生效；放在项目的 `.codex/config.toml` 只对该项目生效（出于安全，项目级配置只在受信任的项目里加载）。配好后，Codex 会话启动时自动把这些 server 拉起来连上，你不必每次手动启动——这点和命令加的 server 一样。

直接编辑文件适合你想把多个 server 一次配齐、或想把配置纳入版本管理时；`codex mcp add` 适合快速加一个。两种方式效果一样，按习惯选。

> 【建议配图4 —— 两种配置 MCP 的方式】
>
> **生图提示词（可直接发给 ChatGPT / 文生图工具）：**
> 画一张干净白底、现代扁平风格的对比图。左半「命令方式」配蓝色：画一个终端，里面 `codex mcp add github -- npx ...`，标「快速加一个 server」。右半「文件方式」配绿色：画一个 `config.toml` 文件，里面 `[mcp_servers.github]` 配置块，标「直接编辑、适合批量配齐、纳入版本管理」。中间画一个等号或双向箭头，标「两种方式效果一样」。底部小字「配好后会话启动自动连上」。配色语义：蓝=命令、绿=文件。图片右下角放置引流信息：公众号：IT杨秀才 ｜ https://golangstar.cn（小字、浅灰、不抢主体）。
>
> 整体目的：让读者知道 Codex 配 MCP 有命令和直接编辑文件两种方式，效果一致、按习惯选。

## **5. 常用 server 与安全**

常用的 server 和其他工具那边一致：GitHub 让它读写 issue 和 PR、按 issue 改代码；数据库 server 让它直接查你的库、边开发边核对数据；浏览器自动化让它打开页面看效果；监控类让它拉线上报错帮你定位。连上后，这些 server 提供的工具就进入 Codex 的可用工具池，它干活时按需自动调用，你也能明确点名让它用某个工具。

把接入一个 server 的完整流程走一遍，以 GitHub 为例，这套流程对任何 server 都通用。第一步加上它：`codex mcp add github --env GITHUB_TOKEN=令牌 -- npx -y @modelcontextprotocol/server-github`。第二步验证：`codex mcp list` 看到它已连上，远程需认证的还要 `codex mcp login` 走一遍授权。第三步用起来：直接对 Codex 说「看看 GitHub 上指派给我的 open PR」，它就调用这个 server 自己去读。记住这条主线——加上、验证、用自然语言指挥——任何 server 都是这三步，区别只在第一步的传输和参数。和 Claude Code 的 `claude mcp add` 几乎是同一套动作。

几条安全底线和别处一样必须守：只接你信任的 server，别随手从来路不明处复制配置就跑，尤其能抓取外部内容的 server 有提示注入风险；带密钥的 server，凭证别提交进公开仓库——项目级 `.codex/config.toml` 出于安全也只在受信任项目里加载；给有写权限的 server 多留心，配合 Codex 的审批策略控制好哪些操作要先经你同意。这些在 Claude Code 的 MCP 篇里都展开讲过，思路完全通用。

## **6. 常见问题**

**Q：codex mcp add 加完了连不上？**
先 `codex mcp list` 看状态。本地 stdio server 确认 `--` 后的启动命令能单独跑通、环境变量填了；远程 HTTP server 检查 URL 和认证，用 `codex mcp login` 走授权。

**Q：配置写在哪生效？**
全局写 `~/.codex/config.toml`，项目级写 `.codex/config.toml`（受信任项目才加载）。MCP server 配在 `[mcp_servers]` 表下，会话启动自动连。

**Q：我在 Claude Code 用的 server，Codex 能用吗？**
能。MCP 是开放标准，同一个 server 接法虽因工具而异，但 server 本身通用。把对应的 `command`、`args`、`env` 按 Codex 的格式写进 `config.toml` 即可。

**Q：server 连上了 Codex 不用它？**
确认指令和 server 能力对得上，必要时明确点名让它用某个工具。

## **7. 小结**

Codex 接 MCP，让它从只懂你本地代码，扩展成能直接对接 GitHub、数据库、浏览器、监控平台的协作者。配置上记住主线：用 `codex mcp add`（在 `--` 后写启动命令）或直接在 `config.toml` 的 `[mcp_servers]` 里写，按 stdio（本地）或 Streamable HTTP（远程）选传输，配好会话自动连上，再用 `codex mcp list` / `login` 管理。

这套和 Claude Code、Cursor 的 MCP 是同一个开放标准、同一套思路，区别只在配置文件的格式和命令名。从你最常复制粘贴的那个工具开始接第一个，Codex 的能力边界就向外扩了一圈。

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
