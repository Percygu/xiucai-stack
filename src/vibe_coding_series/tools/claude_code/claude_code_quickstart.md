---
title: 1. Claude Code 快速上手核心指南
description: Vibe Coding教程第13篇：Claude Code 快速上手核心指南。讲透它的多种使用形态怎么选、三种工作模式（普通/Plan/自动接受）如何用 Shift+Tab 切换、基础交互的三个快捷前缀（/、!、@），以及 /help /clear /compact /context /init 等必会命令，一篇把"会用"彻底打通。
category:
  - Vibe Coding
tag:
  - Vibe Coding
  - AI编程
  - Claude Code
  - Claude Code教程
---

环境搭建篇里，我们已经把 Claude Code 装好、配好、跑通了第一次对话。这一篇是 Claude Code 深入浅出子系列的开篇，目标是把"会用"这件事彻底打通——不是简单聊几句，而是真正掌握它的几种使用形态、三种工作模式、基础交互方式和必会命令。把这一篇吃透，你就能流畅地驾驭 Claude Code 干日常的活儿了。

下面默认你已经按环境搭建篇装好了 Claude Code（没装的回去看那一篇）。我们直接从"怎么用好它"讲起。

## **1. 多种形态，怎么选**

Claude Code 不只活在终端里，它有好几种形态，适合不同习惯和场景。先认清它们，挑一个最顺手的作为你的主战场。

![Claude Code 的多种形态怎么选](../../../assets/img/vibe_coding/tools/claude_code/claude_code_quickstart/claude_code_quickstart1.png)

最核心、功能最全的是**终端 CLI**，在命令行里敲 `claude` 启动，本系列后面所有高级玩法（命令、MCP、子代理等）都基于它，强烈建议你把它用熟。如果你平时就在 **VS Code** 或 **JetBrains 系**（IntelliJ、PyCharm 等）里写代码，可以装对应的插件，在编辑器里直接用。如果你实在抵触命令行，还有图形界面的**桌面 App** 可以下载安装，以及打开浏览器就能用的 **Web 版**。

它们背后是同一个 Claude Code、同一个账号，能力相通。**本系列以终端 CLI 为主线讲解**，因为它最能体现 Claude Code 的全部威力，你学会了 CLI，其他形态自然也会用。

## **2. 三种工作模式：Shift+Tab 来回切**

这一节是本篇的重点，也是很多新手装好之后没搞明白、白白浪费了 Claude Code 一半本事的地方——**工作模式**。

Claude Code 干活时，"放手程度"是可以调的：是每改一步都要问过你，还是放开手脚自己干，或者先别动手、先把方案讲给你听。这些就是工作模式。最常用的有三种，用一个快捷键 **`Shift + Tab`** 就能循环切换。

![Claude Code 的三种工作模式与 Shift+Tab 切换](../../../assets/img/vibe_coding/tools/claude_code/claude_code_quickstart/claude_code_quickstart2.png)

**普通模式（default）** 是默认的、最稳的模式。AI 每次要改文件、跑命令之前，都会停下来把要做的事展示给你，等你点头才动手。新手就用这个，万一它跑偏了，你随时能拦住。

**自动接受模式（acceptEdits）** 则放开了一档：AI 生成的编辑会自动应用，不再一个个问你。当你已经信任它做的这类活、不想被频繁打断时，切到这个模式效率更高。

**Plan 模式（plan）** 最特别——它**只规划、不动手**。AI 会先研究你的项目、想清楚该怎么做，然后给你一份详细的实施计划，等你看过、确认甚至修改之后，才真正开始干。**面对复杂任务，强烈建议先用 Plan 模式让它出个方案**，方案对了再让它执行，能避免它一头扎错方向、白做一通。

这三种模式怎么切？在 Claude Code 里直接按 **`Shift + Tab`**，它就在这几种模式间循环，界面上会显示当前处于哪种模式。一个典型的高效用法是：**复杂任务先 `Shift+Tab` 切到 Plan 模式看方案，方案满意后再切到自动接受模式放手让它干。**

![Plan 模式给出实施方案、等待确认](../../../assets/img/vibe_coding/tools/claude_code/claude_code_quickstart/claude_code_quickstart3.png)

## **3. 基础交互：三个快捷前缀**

跟 Claude Code 打交道，绝大多数时候就是用大白话跟它对话。但除了直接说话，还有三个以特殊符号开头的"快捷前缀"，用熟了能大幅提速。

![Claude Code 的三个快捷前缀](../../../assets/img/vibe_coding/tools/claude_code/claude_code_quickstart/claude_code_quickstart4.png)

**`/` 斜杠命令**：在输入框开头打一个 `/`，会弹出所有可用命令的列表，用来管理会话、调用功能。下一节专门讲常用的几个。

**`!` Shell 模式**：在开头打一个 `!`，后面跟的内容会作为终端命令**直接执行**，不经过 AI，而且执行结果会自动加进对话上下文里。比如 `!npm test` 直接跑测试、`!git status` 看看改了哪些文件。这个很方便——你不用切出去开另一个终端，命令结果还能被 AI 看到、用作后续判断的依据。

**`@` 引用文件**：打一个 `@` 会触发文件路径自动补全，让你把项目里的某个具体文件引用进来。比如"参考 `@src/utils.js` 的写法，帮我写个类似的函数"，AI 就会去读那个文件作为上下文。这是给 AI"精准投喂"上下文的利器。

另外有两个键也很关键：**`Esc` 打断**——AI 跑偏了或者你想中途改主意，按一下 `Esc` 就能打断它当前的动作，已经做的工作会保留。**双击 `Esc` 回退**——在输入框为空时连按两下 `Esc`，会打开"回退"菜单，让你把代码和对话恢复到之前的某个时间点，相当于一个随时能用的"后悔药"。

## **4. 必会的核心命令**

斜杠命令有很多，但新手日常高频用到的就那么几个。把下面这张速查卡记下来，基本够用了。

![Claude Code 核心命令速查卡](../../../assets/img/vibe_coding/tools/claude_code/claude_code_quickstart/claude_code_quickstart5.png)

逐个说一下用途。**`/help`** 列出所有可用命令，记不清的时候敲它。**`/clear`** 清空当前对话、开始全新任务——前面 Prompt 篇反复强调过，换不相干的新活儿时一定要 `/clear`，别在一个对话里堆太多。**`/compact`** 把长对话压缩成摘要、腾出上下文空间，适合一个大任务聊太久、快"记不住"的时候用。

**`/context`** 是个很实用的命令，它会把当前上下文窗口的占用情况可视化地展示出来——让你直观看到是什么（历史对话、读过的文件、系统提示等）在占地方，帮你判断该不该 `/clear` 或 `/compact` 了。**`/init`** 让 Claude Code 扫描你的整个项目，自动生成一份 `CLAUDE.md` 项目说明文件（下一篇会专门讲它）。**`/model`** 用来切换当前使用的模型，比如简单任务用快一点的模型、复杂任务用最强的模型。

![/context 查看上下文占用](../../../assets/img/vibe_coding/tools/claude_code/claude_code_quickstart/claude_code_quickstart6.png)

## **5. 串起来：一次典型的使用流程**

把上面这些拼到一起，看一次真实的使用流程大概是什么样：

打开终端，`cd` 进你的项目，敲 `claude` 启动。先用一句话让它了解项目（"这个项目是做什么的？"）。接着要做一个稍复杂的功能，你按 `Shift+Tab` 切到 **Plan 模式**，让它先出方案："帮我加一个用户登录功能，先给我一份实施计划。"它列出计划，你看过觉得没问题，再按 `Shift+Tab` 切到**自动接受模式**，说"按这个计划做吧"，然后它就放手开干，你在旁边看着。

中途你想跑下测试，直接 `!npm test`；发现某个文件要参考，用 `@` 把它引用进来；它有个地方理解错了，你按 `Esc` 打断、纠正它。这一轮活儿干完，要换个不相干的任务了，敲 `/clear` 清空，重新开始。聊久了感觉它开始"记不住"，用 `/context` 看看占用、`/compact` 压缩一下。

你看，这一套流程下来，模式、前缀、命令各司其职，配合得很顺。**这些操作用不了几次就会变成肌肉记忆**，到时候你根本不会去想"我该按哪个键"，手就自己动了。

## **6. 小结**

这一篇把 Claude Code 的"会用"彻底打通了：知道了**多种形态怎么选**（以终端 CLI 为主力），掌握了**三种工作模式**（普通、自动接受、Plan，用 `Shift+Tab` 切换，复杂任务先 Plan 后执行），学会了**三个快捷前缀**（`/` 命令、`!` 执行 shell、`@` 引用文件）和 **`Esc` 打断/回退**，记住了**几个核心命令**（`/help`、`/clear`、`/compact`、`/context`、`/init`、`/model`）。

这些是你天天都会用到的基本盘，越用越顺手。从下一篇起，我们会一个个深入 Claude Code 的高级能力，第一个就是它的"记忆中枢"——`CLAUDE.md` 配置与记忆，让 AI 真正记住你的项目和偏好。

<div style="background-color: #f0f9eb; padding: 10px 15px; border-radius: 4px; border-left: 5px solid #67c23a; margin: 20px 0; color:rgb(64, 147, 255);">

<h2><span style="color: #006400;"><strong>关注秀才公众号：</strong></span><span style="color: red;"><strong>IT杨秀才</strong></span><span style="color: #006400;"><strong>，回复：</strong></span><span style="color: red;"><strong>面试</strong></span></h2>

<div style="text-align: center;"><span style="color: #006400; font-size: 28px;"><strong>领取后端/AI面试题库PDF</strong></span></div>

![](/assets/icon/avatar.png)
</div>
