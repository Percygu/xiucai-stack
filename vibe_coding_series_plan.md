# Vibe Coding 实战指南 — 内容规划

> 面向零基础小白的 Vibe Coding（氛围编程）系统教程，从"什么是 Vibe Coding"到独立交付完整项目，由浅入深、层层递进。
>
> 核心工具：三大主流 Coding Agent —— Claude Code、Cursor、Codex
>
> 总计：**约 51 篇 + 1篇导读**

---

## 学习路径

```
认知启蒙 → 环境搭建 → Prompt基础 → 工具精通 → 工程实践 → 项目实战 → 进阶心法
  ↑ 是什么/为什么     ↑ 能跑起来       ↑ 用得好        ↑ 做得出来     ↑ 做得好
```

---

## 设计理念

1. **小白友好**：假设读者没有任何 AI 编程经验，每一步都有清晰的操作指引和截图
2. **实战驱动**：70% 的篇幅围绕实际操作，读者跟着教程就能做出东西
3. **图文并茂**：大量配图（操作截图、流程图、对比图），让读者"看一眼就懂"
4. **循序渐进**：前面的文章是后面的基础，知识链路清晰不跳跃
5. **聚焦三大主流 Coding Agent**：全系列围绕 Claude Code、Cursor、Codex 三大主流工具展开，以 Claude Code 为主线，三者都讲深讲透；其他工具（Copilot/Windsurf/v0 等）仅在全景/扫盲篇一笔带过

---

## 整体目录结构

```
vibe_coding_series/                  # 共约 51 篇
├── introduction.md                  # 系列导读（1篇）
├── basics/                          # 一、认知篇（3篇）
├── setup/                           # 二、环境搭建篇（4篇）
├── prompt/                          # 三、Prompt技巧篇（4篇）
├── tools/                           # 四、工具精通篇（26篇）
│   ├── tools_overview.md            #   总览导读
│   ├── claude_code/                 #   Claude Code 深入浅出（9篇）
│   ├── cursor/                      #   Cursor 深入浅出（7篇）
│   ├── codex/                       #   Codex 深入浅出（8篇）
│   └── other_tools.md               #   其他工具生态扫盲
├── engineering/                     # 五、工程实践篇（6篇）
├── projects/                        # 六、项目实战篇（4篇）
└── advanced/                        # 七、进阶心法篇（3篇）
```

---

## 一、认知篇（3篇）

> 目录：`vibe_coding_series/basics/`
>
> 目标：让读者理解 Vibe Coding 是什么、能做什么、适合谁，建立正确的认知框架和学习心态。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `what_is_vibe_coding.md` | 什么是Vibe Coding | Andrej Karpathy 的定义、Vibe Coding 与传统编程的区别、"用自然语言写代码"的本质、适合哪些人（非程序员/初级开发者/资深开发者分别能获得什么）、真实案例展示 |
| 2 | `ai_coding_landscape.md` | AI编程工具全景图 | 当前主流 AI 编程工具分类（终端类/IDE类/插件类/在线平台类）、引出三大主流 Coding Agent 并重点对比 Claude Code vs Cursor vs Codex、怎么选工具（按经验/按预算/按场景）、国内可用性与免费/国产平替方案。其他工具（Copilot/Windsurf 等）仅作生态扫盲一笔带过 |
| 3 | `mindset_and_workflow.md` | 正确的协作心态 | 人与 AI 的分工（人负责"想什么"，AI 负责"怎么做"）、Vibe Coding 的基本工作流（需求→指令→生成→验证→迭代）、常见误区（不是完全放手、不是只会复制粘贴）、学习路线建议 |

---

## 二、环境搭建篇（4篇）

> 目录：`vibe_coding_series/setup/`
>
> 目标：手把手教读者搭建 Vibe Coding 的开发环境，并把三大主流 Coding Agent（Claude Code / Cursor / Codex）各装好一份，确保能跟着后续教程动手操作。
>
> ⚠️ 写每个工具的安装配置前，必须先用 WebSearch/WebFetch 核实该工具官方文档的最新安装方式与界面（迭代极快，凭记忆易错）。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `dev_environment.md` | 开发环境搭建 | 操作系统准备（macOS/Windows/Linux）、终端配置、Node.js 安装、Git 基础配置、VS Code 安装与基础配置、每一步都配截图 |
| 2 | `claude_code_setup.md` | Claude Code安装与配置 | Claude Code 是什么、安装方式（官方 native install / Homebrew）、账号订阅与认证、国内可用性配置（第三方兼容接口/中转 API）、第一次对话体验、基础命令（/help /clear /compact 等）、常见安装问题排查 |
| 3 | `cursor_setup.md` | Cursor安装与配置 | Cursor 下载安装、从 VS Code 迁移设置、登录与模型配置、Ask/Agent/Plan/Edit 四模式与 Tab 补全初体验、Rules 配置入门、常见问题 |
| 4 | `codex_setup.md` | Codex安装与配置 | Codex 是什么、Codex App 桌面端安装、用 ChatGPT 订阅登录认证、国内网络与账号配置、第一次 Local 任务、CLI/IDE/Web/Cloud 四种入口初体验、常见问题排查 |

---

## 三、Prompt 技巧篇（4篇）

> 目录：`vibe_coding_series/prompt/`
>
> 目标：掌握与 AI 编程助手高效沟通的核心技能，从"说不清楚"到"一次说对"。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `prompt_basics.md` | Prompt基础 | 什么是 Prompt、好 Prompt 的四要素（角色/上下文/任务/约束）、用一个简单的网页生成案例演示"模糊指令 vs 精确指令"的巨大差异、Prompt 模板入门 |
| 2 | `requirement_to_prompt.md` | 从需求到Prompt | 怎么把一个模糊的想法变成可执行的 Prompt、需求拆解技巧（大任务拆小任务）、渐进式开发（先骨架后填肉）、实战：从"我想做个待办清单"到完整 Prompt 的演变过程 |
| 3 | `prompt_patterns.md` | 常用Prompt模式 | 代码生成 Prompt 模式、Bug 修复 Prompt 模式、代码重构 Prompt 模式、代码解释 Prompt 模式、测试生成 Prompt 模式、每种模式都配完整示例和效果对比 |
| 4 | `prompt_advanced.md` | Prompt进阶技巧 | 多轮对话的上下文管理、如何纠正 AI 的错误输出、参考代码/参考设计的引入技巧、System Prompt 与项目级配置（CLAUDE.md / .cursorrules）、Prompt 调试和优化方法论 |

---

## 四、工具精通篇（26篇：1篇总览 + 三工具深度 24篇 + 1篇生态扫盲）

> 目录：`vibe_coding_series/tools/`
>
> 目标：深入掌握三大主流 Coding Agent（Claude Code / Cursor / Codex）的高级用法，从"能用"到"用得好"，**一篇讲透一个点**，让小白也能精通。
>
> 结构：根目录放一篇总览导读和一篇生态扫盲，中间分三个子目录，每个工具各成一个"深入浅出"小系列。三个工具都覆盖「快速上手 / 配置文件 / MCP / 命令 / 工作流」通用骨架，差异体现在各自特色能力上。
>
> ⚠️ **【强制】写本篇任意文章前，必须先用 WebSearch/WebFetch 调研对应工具官方文档的最新能力**（`code.claude.com/docs`、`cursor.com/docs`、`developers.openai.com/codex`）。这三个工具迭代极快——功能、模式名、界面几个月就变（如 Cursor 早已从"Tab/Chat/Composer"变为 Ask/Agent/Plan/Edit 四模式、Notepads 被 Memories 取代），凭训练记忆必出错。

### 总览 + 生态扫盲（`tools/` 根目录，2篇）

| 文件名 | 标题 | 内容要点 |
|--------|------|----------|
| `tools_overview.md` | 工具精通篇导读 | 三大 Coding Agent 能力地图与定位对比、各自最适合的场景、这一篇怎么学、三个子系列导航 |
| `other_tools.md` | 其他实用工具（生态扫盲） | 收尾扫盲篇：集中、简要地带读者认识生态里的其他工具，有个全貌即可，不深入展开。包括 GitHub Copilot、Windsurf 简介，v0/bolt.new/Lovable 等在线 AI 编程平台，AI 辅助设计（截图转代码），以及这些工具与三大 Coding Agent 的搭配建议 |

### 4.1 Claude Code 深入浅出（`tools/claude_code/`，9篇）

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `claude_code_quickstart.md` | Claude Code 快速上手核心指南 | 安装与多形态（终端/VS Code/JetBrains/桌面 App/Web）、工作模式（普通/Plan/Auto-accept）、基础对话、常用内置命令（/help /clear /compact /context /init），一篇把"会用"打通 |
| 2 | `claude_code_md.md` | CLAUDE.md 配置与记忆完全指南 | CLAUDE.md 三层（用户/项目/子目录）、写法最佳实践、auto-memory 自动记忆、`#` 快捷记忆、上下文如何被加载 |
| 3 | `claude_code_commands.md` | Slash Commands 完全指南 | 内置命令全解、自定义命令（`.claude/commands/*.md`）、参数与组织、团队共享 |
| 4 | `claude_code_mcp.md` | MCP Server 集成完全指南 | MCP 是什么、stdio/HTTP/SSE 三种传输、常用 server（GitHub/数据库/浏览器）、配置与排错 |
| 5 | `claude_code_subagents.md` | Subagents 子代理工作流完全指南 | 子代理概念与上下文隔离、定义方法、agent teams 多代理并行、后台 agent view 监看 |
| 6 | `claude_code_hooks.md` | Hooks 自动化完全指南 | 生命周期事件（PreToolUse/PostToolUse/UserPromptSubmit 等）、PreToolUse 安全校验、自动格式化/提交检查实战 |
| 7 | `claude_code_skills.md` | Skills 技能封装完全指南 | Skill 是什么、目录结构、配套 scripts、与 Slash 命令的区别、编写可复用工作流 |
| 8 | `claude_code_plugins.md` | Plugins 插件打包与分发完全指南 | 把 skills/subagents/commands/hooks/MCP 打包成插件、`/plugin` 一键安装、团队分发 |
| 9 | `claude_code_workflow.md` | 实战工作流与高效技巧盘点 | Plan 模式、checkpoints 回退、权限管理、上下文压缩、管道/headless（`-p`）、定时任务（Routines/`/schedule`/`/loop`）、高效技巧 |

### 4.2 Cursor 深入浅出（`tools/cursor/`，7篇）

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `cursor_quickstart.md` | Cursor 快速上手核心指南 | 安装、从 VS Code 迁移、Tab 智能补全（Sonic 模型）、界面与基础工作流总览 |
| 2 | `cursor_modes.md` | 四大模式完全指南 | Ask / Agent / Plan / Edit（Cmd+K）四种模式各自用途、切换方式、"Plan→Agent→手动 Edit"推荐工作流 |
| 3 | `cursor_rules.md` | Rules 规则完全指南 | `.cursor/rules/*.mdc`（YAML frontmatter + 作用域）、always-on 规则、Team Rules 团队策略、与 CLAUDE.md 的类比 |
| 4 | `cursor_context_memories.md` | 上下文与记忆完全指南 | @引用（@file/@web/@docs/@code/codebase）、Memories 自动持久记忆（已取代 Notepads）、上下文管理技巧 |
| 5 | `cursor_mcp.md` | MCP 集成与多模型完全指南 | MCP 配置与常用 server、多模型（Sonnet/Opus/GPT/Gemini/Composer/Sonic）选择策略 |
| 6 | `cursor_cloud_agents.md` | 云端代理与 BugBot 完全指南 | Background Agents、Cloud Agents（浏览器/手机/Slack 启动）、BugBot 自动 PR 审查 |
| 7 | `cursor_hooks_workflow.md` | Hooks 自动化与实战工作流 | Cursor Hooks（beta，onPreEdit/onPostEdit 等）、高效实战工作流、与其他工具配合 |

### 4.3 Codex 深入浅出（`tools/codex/`，8篇）

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `codex_quickstart.md` | Codex 快速上手核心指南 | Codex App 快速上手、用 ChatGPT 订阅登录、第一次 Local 任务、Local/Worktree/Cloud 模式、CLI/IDE/Web 四种入口总览与选择 |
| 2 | `codex_agents_md.md` | AGENTS.md 与配置完全指南 | AGENTS.md 写法与作用、`~/.codex/config.toml`、Profiles 配置层切换（`--profile`） |
| 3 | `codex_commands_prompts.md` | 命令与提示词入口完全指南 | Codex App 命令入口、CLI Slash Commands（`/review`、`/permissions` 等）、自定义 Prompt 的旧用法与 Skills 迁移建议 |
| 4 | `codex_skills.md` | Skills 完全指南 | Skill 是什么、存放位置（`.agents/skills/`、`~/.agents/skills/`）、`$skill` 调用、`$skill-installer` 与 `skill-creator` |
| 5 | `codex_mcp.md` | MCP 集成完全指南 | 在 config.toml 配置 MCP server、`codex mcp` 命令管理、会话自动启动 |
| 6 | `codex_cloud_github.md` | 云端任务与 GitHub 自动化完全指南 | Codex App 的 Cloud 模式、云端沙箱、并行任务、GitHub PR/issue 自动化、本地 App vs 云端如何选 |
| 7 | `codex_sandbox_models.md` | 沙箱审批与模型完全指南 | 沙箱/审批模式与安全策略、reasoning effort（xhigh~low）、模型选择与成本权衡 |
| 8 | `codex_workflow.md` | 实战工作流与高效技巧 | Codex App 优先的日常工作流、多步工具链、self-check 自检、App/CLI/IDE/Cloud 跨入口接力、高效技巧盘点 |

> 注：Claude Code 的 Output styles、Agent SDK，以及 Codex 的 computer-use（屏幕操作）等较小众/偏开发者的能力，本篇不单列，必要时在 `workflow` 篇里一笔带过。GitHub Actions / 自动 Code Review（CI 自动化）已归入工程实践篇。

---

## 五、工程实践篇（6篇）

> 目录：`vibe_coding_series/engineering/`
>
> 目标：掌握 Vibe Coding 场景下的工程化最佳实践，从"能跑"到"能用"再到"好维护"。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `project_planning.md` | 项目规划与架构 | AI 时代的项目规划方法（先写 PRD 再写代码）、用 AI 辅助技术选型、项目结构设计、README 驱动开发、模块拆分原则、规划文档模板 |
| 2 | `code_quality.md` | 代码质量保障 | AI 生成代码的常见质量问题、Code Review 要点（安全/性能/可维护性）、用 AI 写测试、ESLint/Prettier 等工具配置、质量门禁概念、如何让 AI 生成更高质量的代码 |
| 3 | `debugging_with_ai.md` | AI辅助调试 | 报错信息的正确喂给 AI 的方法、截图 + 日志 + 上下文的组合技巧、常见 Bug 类型与 AI 调试策略、"AI 写出的 Bug 让 AI 自己修"的方法论、调试案例实战 |
| 4 | `iterative_development.md` | 迭代式开发 | 需求变更时如何与 AI 协作、渐进式重构、功能迭代的最佳实践、上下文管理（长对话 vs 新对话）、项目文档持续维护、从 MVP 到完整产品的演进路径 |
| 5 | `git_for_vibe_coding.md` | Git与版本控制 | 为什么 Vibe Coding 更需要 Git、Git 基础操作速成、分支策略（主分支保护）、用 AI 辅助写 commit message、AI 生成代码后的 review 要点、回退与恢复（AI 写坏了怎么办） |
| 6 | `ci_and_code_review.md` | CI 自动化与自动 Code Review | 把 AI 接入持续集成流水线、用 Claude Code GitHub Actions / GitLab CI 实现自动代码审查与 issue 三连、定时任务（每日 PR 审查/依赖巡检）、自动化的安全与权限边界 |

---

## 六、项目实战篇（4篇）

> 目录：`vibe_coding_series/projects/`
>
> 目标：通过 4 个由简到难的完整项目，综合运用所学知识，体验从 0 到 1 的 Vibe Coding 全流程。

| 序号 | 文件名 | 标题 | 核心技术 |
|------|--------|------|----------|
| 1 | `project_landing_page.md` | 项目一：个人主页 | HTML/CSS/JS 纯前端项目，零代码经验即可完成，重点练习 Prompt 表达和迭代修改 |
| 2 | `project_todo_app.md` | 项目二：待办清单应用 | React + 本地存储，练习组件拆分、状态管理、AI 辅助调试，第一个有交互的应用 |
| 3 | `project_blog.md` | 项目三：个人博客系统 | Next.js + MDX + 部署上线，练习全栈开发流程、AI 辅助技术选型、项目规划驱动开发 |
| 4 | `project_fullstack_app.md` | 项目四：全栈 Web 应用 | React + Node.js + 数据库，完整的前后端项目，用户认证、CRUD、API 设计，综合实战 |

---

## 七、进阶心法篇（3篇）

> 目录：`vibe_coding_series/advanced/`
>
> 目标：分享 Vibe Coding 的高阶经验和思维方式，帮助读者从"会用工具"升级到"驾驭 AI"。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `context_management.md` | 上下文管理 | 为什么上下文是 Vibe Coding 的命脉、Token 与上下文窗口、长项目的上下文策略、CLAUDE.md / Memory / 项目文档的配合使用、上下文丢失的应对方案 |
| 2 | `skill_and_automation.md` | 技能封装与自动化 | 什么是 Skill（可复用的 Prompt+流程）、自定义 Slash Command、Hooks 自动化（代码保存自动格式化/提交自动检查）、打造个人工具链、效率倍增的秘密 |
| 3 | `future_and_philosophy.md` | AI编程的未来 | 从 Copilot 到 Agent 的演进、Vibe Coding 的局限性与边界、AI 不会取代程序员但会改变编程方式、保持学习的心态、给不同背景读者的建议（非程序员/初级/资深） |

---

## Sidebar 配置参考

> 以下为 VuePress Theme Hope 的 sidebar 配置结构，可直接集成到 `sidebar.ts` 中。

```typescript
"/vibe_coding_series/": [
  {
    text: "Vibe Coding实战指南",
    collapsible: true,
    children: [
      "/vibe_coding_series/introduction.md",
      {
        text: "一、认知篇",
        collapsible: true,
        children: [
          "/vibe_coding_series/basics/what_is_vibe_coding.md",
          "/vibe_coding_series/basics/ai_coding_landscape.md",
          "/vibe_coding_series/basics/mindset_and_workflow.md",
        ],
      },
      {
        text: "二、环境搭建",
        collapsible: true,
        children: [
          "/vibe_coding_series/setup/dev_environment.md",
          "/vibe_coding_series/setup/claude_code_setup.md",
          "/vibe_coding_series/setup/cursor_setup.md",
          "/vibe_coding_series/setup/codex_setup.md",
        ],
      },
      {
        text: "三、Prompt技巧",
        collapsible: true,
        children: [
          "/vibe_coding_series/prompt/prompt_basics.md",
          "/vibe_coding_series/prompt/requirement_to_prompt.md",
          "/vibe_coding_series/prompt/prompt_patterns.md",
          "/vibe_coding_series/prompt/prompt_advanced.md",
        ],
      },
      {
        text: "四、工具精通",
        collapsible: true,
        children: [
          "/vibe_coding_series/tools/tools_overview.md",
          {
            text: "Claude Code 深入浅出",
            collapsible: true,
            children: [
              "/vibe_coding_series/tools/claude_code/claude_code_quickstart.md",
              "/vibe_coding_series/tools/claude_code/claude_code_md.md",
              "/vibe_coding_series/tools/claude_code/claude_code_commands.md",
              "/vibe_coding_series/tools/claude_code/claude_code_mcp.md",
              "/vibe_coding_series/tools/claude_code/claude_code_subagents.md",
              "/vibe_coding_series/tools/claude_code/claude_code_hooks.md",
              "/vibe_coding_series/tools/claude_code/claude_code_skills.md",
              "/vibe_coding_series/tools/claude_code/claude_code_plugins.md",
              "/vibe_coding_series/tools/claude_code/claude_code_workflow.md",
            ],
          },
          {
            text: "Cursor 深入浅出",
            collapsible: true,
            children: [
              "/vibe_coding_series/tools/cursor/cursor_quickstart.md",
              "/vibe_coding_series/tools/cursor/cursor_modes.md",
              "/vibe_coding_series/tools/cursor/cursor_rules.md",
              "/vibe_coding_series/tools/cursor/cursor_context_memories.md",
              "/vibe_coding_series/tools/cursor/cursor_mcp.md",
              "/vibe_coding_series/tools/cursor/cursor_cloud_agents.md",
              "/vibe_coding_series/tools/cursor/cursor_hooks_workflow.md",
            ],
          },
          {
            text: "Codex 深入浅出",
            collapsible: true,
            children: [
              "/vibe_coding_series/tools/codex/codex_quickstart.md",
              "/vibe_coding_series/tools/codex/codex_agents_md.md",
              "/vibe_coding_series/tools/codex/codex_commands_prompts.md",
              "/vibe_coding_series/tools/codex/codex_skills.md",
              "/vibe_coding_series/tools/codex/codex_mcp.md",
              "/vibe_coding_series/tools/codex/codex_cloud_github.md",
              "/vibe_coding_series/tools/codex/codex_sandbox_models.md",
              "/vibe_coding_series/tools/codex/codex_workflow.md",
            ],
          },
          "/vibe_coding_series/tools/other_tools.md",
        ],
      },
      {
        text: "五、工程实践",
        collapsible: true,
        children: [
          "/vibe_coding_series/engineering/project_planning.md",
          "/vibe_coding_series/engineering/code_quality.md",
          "/vibe_coding_series/engineering/debugging_with_ai.md",
          "/vibe_coding_series/engineering/iterative_development.md",
          "/vibe_coding_series/engineering/git_for_vibe_coding.md",
          "/vibe_coding_series/engineering/ci_and_code_review.md",
        ],
      },
      {
        text: "六、项目实战",
        collapsible: true,
        children: [
          "/vibe_coding_series/projects/project_landing_page.md",
          "/vibe_coding_series/projects/project_todo_app.md",
          "/vibe_coding_series/projects/project_blog.md",
          "/vibe_coding_series/projects/project_fullstack_app.md",
        ],
      },
      {
        text: "七、进阶心法",
        collapsible: true,
        children: [
          "/vibe_coding_series/advanced/context_management.md",
          "/vibe_coding_series/advanced/skill_and_automation.md",
          "/vibe_coding_series/advanced/future_and_philosophy.md",
        ],
      },
    ],
  },
],
```

---

## Navbar 配置参考

```typescript
{
  text: "🔥Vibe Coding实战指南",
  link: "/vibe_coding_series/introduction.md",
},
```

---

## 写作建议

1. **极致小白友好**：不要假设读者有任何编程基础，每个概念第一次出现时都要解释
2. **截图为王**：操作类内容必须配截图，每一步都能"看着图做"
3. **先跑通再讲原理**：先让读者看到效果（成就感），再解释背后的原理
4. **真实感**：使用真实的 Prompt 和 AI 回复截图，展示真实的对话过程，不要编造
5. **踩坑指南**：主动讲解常见的坑和解决方案，比读者先踩一步
6. **对比教学**：好的做法 vs 坏的做法并排展示，效果差异一目了然
