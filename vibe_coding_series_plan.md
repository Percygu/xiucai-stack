# Vibe Coding 实战指南 — 内容规划

> 面向零基础小白的 Vibe Coding（氛围编程）系统教程，从"什么是 Vibe Coding"到独立交付完整项目，由浅入深、层层递进。
>
> 核心工具：Claude Code（终端 AI 编程助手）
>
> 总计：**25篇 + 1篇导读**

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
5. **工具中立但有主张**：以 Claude Code 为主线，同时介绍 Cursor、Copilot 等工具，帮读者选择最适合自己的

---

## 整体目录结构

```
vibe_coding_series/                  # 共 25 篇
├── introduction.md                  # 系列导读（1篇）
├── basics/                          # 一、认知篇（3篇）
├── setup/                           # 二、环境搭建篇（3篇）
├── prompt/                          # 三、Prompt技巧篇（4篇）
├── tools/                           # 四、工具精通篇（4篇）
├── engineering/                     # 五、工程实践篇（4篇）
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
| 2 | `ai_coding_landscape.md` | AI编程工具全景图 | 当前主流 AI 编程工具分类（IDE类/终端类/对话类）、Claude Code vs Cursor vs Copilot vs Windsurf 对比、怎么选工具（按场景/按预算/按经验水平）、免费方案推荐 |
| 3 | `mindset_and_workflow.md` | 正确的协作心态 | 人与 AI 的分工（人负责"想什么"，AI 负责"怎么做"）、Vibe Coding 的基本工作流（需求→指令→生成→验证→迭代）、常见误区（不是完全放手、不是只会复制粘贴）、学习路线建议 |

---

## 二、环境搭建篇（3篇）

> 目录：`vibe_coding_series/setup/`
>
> 目标：手把手教读者搭建 Vibe Coding 的开发环境，确保能跟着后续教程动手操作。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `dev_environment.md` | 开发环境搭建 | 操作系统准备（macOS/Windows/Linux）、终端配置、Node.js 安装、Git 基础配置、VS Code 安装与基础配置、每一步都配截图 |
| 2 | `claude_code_setup.md` | Claude Code安装与配置 | Claude Code 是什么、安装方式（npm全局安装）、账号注册与认证、第一次对话体验、基础命令介绍（/help /clear /compact 等）、常见安装问题排查 |
| 3 | `cursor_setup.md` | Cursor安装与配置 | Cursor 下载安装、从 VS Code 迁移设置、AI 功能配置（模型选择、快捷键）、Composer/Chat/Tab 三大功能初体验、Cursor Rules 配置入门 |

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

## 四、工具精通篇（4篇）

> 目录：`vibe_coding_series/tools/`
>
> 目标：深入掌握核心 AI 编程工具的高级用法，从"能用"到"用得好"。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `claude_code_mastery.md` | Claude Code深度使用 | 工作模式详解（交互模式/单次模式/管道模式）、Slash 命令全解析、CLAUDE.md 配置最佳实践、MCP Server 集成、子代理（subagent）使用、Hooks 自动化、实用技巧与快捷键 |
| 2 | `cursor_mastery.md` | Cursor深度使用 | Composer 多文件编辑、Chat 代码问答、Tab 智能补全、Agent 模式详解、.cursorrules 高级配置、@引用（@file @web @doc）技巧、多模型切换策略 |
| 3 | `git_for_vibe_coding.md` | Git与版本控制 | 为什么 Vibe Coding 更需要 Git、Git 基础操作速成、分支策略（主分支保护）、用 AI 辅助写 commit message、AI 生成代码后的 review 要点、回退与恢复（AI 写坏了怎么办） |
| 4 | `other_tools.md` | 其他实用工具 | GitHub Copilot 使用技巧、Windsurf 简介、v0/bolt.new 等在线 AI 编程平台、AI 辅助设计（截图转代码）、AI 辅助文档编写、工具组合搭配建议 |

---

## 五、工程实践篇（4篇）

> 目录：`vibe_coding_series/engineering/`
>
> 目标：掌握 Vibe Coding 场景下的工程化最佳实践，从"能跑"到"能用"再到"好维护"。

| 序号 | 文件名 | 标题 | 内容要点 |
|------|--------|------|----------|
| 1 | `project_planning.md` | 项目规划与架构 | AI 时代的项目规划方法（先写 PRD 再写代码）、用 AI 辅助技术选型、项目结构设计、README 驱动开发、模块拆分原则、规划文档模板 |
| 2 | `code_quality.md` | 代码质量保障 | AI 生成代码的常见质量问题、Code Review 要点（安全/性能/可维护性）、用 AI 写测试、ESLint/Prettier 等工具配置、质量门禁概念、如何让 AI 生成更高质量的代码 |
| 3 | `debugging_with_ai.md` | AI辅助调试 | 报错信息的正确喂给 AI 的方法、截图 + 日志 + 上下文的组合技巧、常见 Bug 类型与 AI 调试策略、"AI 写出的 Bug 让 AI 自己修"的方法论、调试案例实战 |
| 4 | `iterative_development.md` | 迭代式开发 | 需求变更时如何与 AI 协作、渐进式重构、功能迭代的最佳实践、上下文管理（长对话 vs 新对话）、项目文档持续维护、从 MVP 到完整产品的演进路径 |

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
          "/vibe_coding_series/tools/claude_code_mastery.md",
          "/vibe_coding_series/tools/cursor_mastery.md",
          "/vibe_coding_series/tools/git_for_vibe_coding.md",
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
