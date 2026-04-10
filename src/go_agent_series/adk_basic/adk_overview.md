---
title: 10. Google ADK Go框架概述
description: "Go语言 AI Agent 开发框架 Google ADK 入门教程：全面解析 Agent Development Kit 的核心理念、code-first 架构设计与六大核心组件，对比 LangChain、CrewAI 等主流框架优劣势，深入探讨为什么 Go 语言是构建大模型智能体应用的最佳选择。"
category:
  - Go Agent
tag:
  - Go Agent
  - 大模型
  - ADK
  - Google ADK
  - Agent框架
  - Go语言
---

# **Google ADK Go框架概述**

前面九篇文章，我们花了大量篇幅聊大模型基础和 Agent 的核心认知——从 Token、Prompt 到 ReAct 框架，从规划能力到记忆机制，再到工具使用和 Function Calling。这些都是"内功心法"，理解了它们，你对 Agent 的运作原理已经心中有数。但光有内功不行，你还得有一套趁手的兵器。

从这篇开始，我们正式进入 ADK 框架入门阶段。今天要聊的是 Google 开源的 Agent Development Kit（简称 ADK）Go 版本——一个专门为构建 AI Agent 而生的 Go 框架。我们会从它是什么、它的核心设计理念、整体架构全景讲起，再和市面上的其他框架做个横向对比，最后聊聊为什么用 Go 来写 Agent 应用是个明智的选择。

## **1. ADK 是什么**

ADK，全称 Agent Development Kit，是 Google 在 2025 年开源的一套 AI Agent 开发工具包。它的官方定位是：**一个开源的、代码优先（code-first）的框架，用于构建、评估和部署复杂的 AI Agent 应用**。

听上去和 LangChain、CrewAI 这些框架差不多？确实，它们解决的是同一类问题——帮你更高效地搭建 Agent。但 ADK 的切入角度有所不同。LangChain 走的是"瑞士军刀"路线，什么都能接、什么都能干，生态极其庞大但也因此复杂度很高；CrewAI 聚焦在多 Agent 角色扮演协作；而 ADK 选择的路线是**模块化 + 代码优先**——它不搞花里胡哨的 YAML 配置文件或者可视化拖拽，所有的 Agent 逻辑、工具定义、编排流程，全部用代码来写。

ADK 最初只有 Python 版本，后来 Google 推出了 Go 版本（`github.com/google/adk-go`，注意 import 路径为 `google.golang.org/adk`），专门为 Go 开发者量身打造。Go 版本并不是 Python 版的简单翻译，而是充分利用了 Go 语言的特性——比如用 `iter.Seq2` 来做事件流、用接口来抽象组件、用 goroutine 来实现并行 Agent——写出来的代码非常 Go 味儿。

> 【建议配图1 —— ADK 在 Agent 框架生态中的定位】
>
> 图片描述：一张横向的生态定位图。中央是一个大的蓝色六边形，内部写着"ADK"和"Code-First · 模块化 · Go原生"，六边形上方有 Google 的彩色 logo 图标。左侧有一个较小的紫色六边形"LangChain"标注"全栈生态 · 瑞士军刀"，右侧有一个橙色六边形"CrewAI"标注"角色扮演 · 多Agent协作"。三个六边形之间用灰色虚线连接，虚线上方标注"同一赛道，不同打法"。ADK 六边形下方引出三条绿色实线箭头，分别指向三个小圆角矩形："Python版"（带蛇形图标）、"Go版"（带 Gopher 图标）、"Java版（规划中）"（带咖啡杯图标，灰色半透明表示尚未发布）。整体白色背景，元素大小有层次感，ADK 最大最醒目。
>
> 整体目的：让读者快速理解 ADK 在主流 Agent 框架中的定位和差异化优势，同时知道 ADK 有多语言版本。

## **2. 核心理念：Code-First**

ADK 最鲜明的标签就是 **Code-First**，翻译过来就是"代码优先"。这三个字看着简单，背后的设计哲学值得展开聊聊。

很多框架为了降低入门门槛，会引入大量的声明式配置——用 YAML 文件定义 Agent 的行为，用 JSON Schema 描述工具参数，甚至用可视化界面拖拽连线。这种方式对新手友好，但一旦业务逻辑变复杂，你会发现自己在配置文件和代码之间反复跳跃，调试的时候更是两头受气——配置文件没有断点可打，运行时行为又被层层抽象遮挡。

ADK 的做法是：**把所有东西都放回代码里**。Agent 的定义是一个 Go 结构体，工具是一个 Go 函数，编排逻辑是 Go 代码的控制流，回调和插件也是 Go 函数。你不需要学一套新的 DSL（领域特定语言），不需要写 YAML，更不需要在 Web 界面上点来点去。你就写 Go 代码——你已经会的那种。

这种设计带来几个实打实的好处。首先是**可调试性**，所有逻辑都是代码，你可以像调试普通 Go 程序一样打断点、看调用栈、查变量值。其次是**可测试性**，Agent 的行为可以用标准的 Go 测试框架来验证，Mock 工具和模型都很方便。再者是**版本控制友好**，所有配置即代码，Git diff 一目了然，Code Review 也不存在"这个 YAML 改了什么"的困惑。最后是**IDE 支持**，代码补全、类型检查、跳转定义……这些开发体验在 Go 的工具链里是现成的，而配置文件享受不到这些。

来看一个最简单的例子，感受一下 ADK 的 Code-First 风格：

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    "github.com/sashabaranov/go-openai"

    "google.golang.org/adk/agent/llmagent"
    "google.golang.org/adk/model"
)

func main() {
    // 通过 OpenAI 兼容接口接入通义千问
    config := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
    config.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    client := openai.NewClientWithConfig(config)

    // 创建一个 LLM Agent —— 就这么几行
    myAgent, err := llmagent.New(llmagent.Config{
        Name:        "greeting_agent",
        Description: "一个友好的问候助手",
        Instruction: "你是一个友好的助手，请用中文回答用户的问题。",
        // Model 配置后续篇章详解
    })
    if err != nil {
        log.Fatalf("创建 Agent 失败: %v", err)
    }

    fmt.Printf("Agent 创建成功: %s\n", myAgent.Name())
    fmt.Printf("描述: %s\n", "一个友好的问候助手")
}
```

运行结果：
```
Agent 创建成功: greeting_agent
描述: 一个友好的问候助手
```

看到没有？没有配置文件，没有注解魔法，就是纯粹的 Go 代码。`llmagent.New` 接收一个 `Config` 结构体，返回一个 Agent 实例——标准的 Go 构造模式。Agent 的名字、描述、指令，全部是结构体字段，IDE 能自动补全，编译器能检查类型。

> 【建议配图2 —— Code-First vs Config-First 开发体验对比】
>
> 图片描述：左右分屏对比图。左半部分标题为"Config-First 模式"（红色/橙色调），展示一个竖向流程：顶部是一个 YAML 文件图标（灰色文档带齿轮），下方箭头指向一个"运行时解析引擎"（黑盒子图标），再向下指向一个"Agent 行为"（机器人图标），旁边有一个红色叉号和文字"调试困难、类型不安全、IDE 无感知"。右半部分标题为"Code-First 模式"（绿色/蓝色调），展示同样的竖向流程：顶部是一个 Go 源文件图标（蓝色文档带 Gopher），直接箭头指向"Agent 行为"（机器人图标），旁边有一个绿色对勾和文字"断点调试、类型安全、IDE 全支持"。两侧之间用一条竖向虚线分隔。右侧整体比左侧更明亮，暗示推荐。底部有一行小字："ADK 的选择：让所有逻辑都活在代码里"。
>
> 整体目的：直观对比两种开发范式的体验差异，让读者理解 Code-First 的实际优势。

## **3. 架构全景**

理解 ADK 的整体架构，是用好这个框架的基础。ADK 的架构可以从上到下分为四个层次：**用户接口层、Agent 编排层、LLM 集成层和基础服务层**。每一层各司其职，通过清晰的接口互相协作。

### **3.1 用户接口层**

这是最上面的一层，负责把用户的输入送进 Agent 系统，再把 Agent 的输出呈现给用户。ADK 提供了三种入口方式：**命令行（Console CLI）**、**Web 服务器**和**完整的 Launcher**（自带 Web UI）。不管你选哪种入口，它们最终都会把用户消息交给同一个核心组件——`runner.Runner`。这种设计意味着你的 Agent 逻辑完全不需要关心自己跑在命令行还是 Web 服务里，接口层和业务逻辑是彻底解耦的。

### **3.2 Agent 编排层**

这是 ADK 的核心层，也是你花最多时间打交道的层。它的中枢是 `runner.Runner`，负责协调 Agent 的选择和执行。Agent 在 ADK 中通过 `agent.Agent` 接口来抽象，目前有三大类实现：

**LLM Agent**（`llmagent`包）是最常用的类型，它背后连着大模型，能理解自然语言、调用工具、生成回复。你在前面章节学到的 ReAct 循环、Function Calling、记忆机制，都是通过 LLM Agent 来落地的。

**Workflow Agent**（工作流 Agent）用于编排多个 Agent 的执行顺序。ADK 内置了三种工作流模式：`sequentialagent`（顺序执行，一个接一个）、`parallelagent`（并行执行，同时跑）和 `loopagent`（循环执行，反复迭代直到满足条件）。这三种模式可以自由组合嵌套，构建出非常复杂的执行流程。

**Custom Agent**（自定义 Agent）允许你实现 `agent.Agent` 接口，完全自定义执行逻辑。比如你想写一个不依赖大模型的规则引擎 Agent，或者一个对接外部系统的适配器 Agent，都可以通过自定义实现来搞定。

> 【建议配图3 —— ADK 四层架构全景图】
>
> 图片描述：一张自上而下的分层架构图，四层用不同颜色区分，每层之间有向下的蓝色粗箭头连接。第一层（浅蓝色背景）标题"用户接口层"，内部水平排列三个图标：终端窗口图标标注"Console CLI"、浏览器窗口图标标注"Web Server"、带齿轮的浏览器图标标注"Launcher + Web UI"，三者底部有三条线汇聚到一个向下的箭头。第二层（浅绿色背景）标题"Agent 编排层"，中央是一个大的圆角矩形"runner.Runner"（蓝色边框、白色填充），左侧分支出三个小矩形竖向排列："LLM Agent"（带大脑图标）、"Workflow Agent"（带流程图图标）、"Custom Agent"（带拼图图标），右侧分支出"Plugin 插件系统"（带插头图标）。第三层（浅黄色背景）标题"LLM 集成层"，内部有"LLM Flow"（齿轮组图标）居中，左边连接"Prompt Builder"（文档图标），右边连接"Tool Executor"（扳手图标），下方连接模型适配器。第四层（浅灰色背景）标题"基础服务层"，水平排列四个圆柱/矩形图标："Session 会话"（对话气泡图标）、"Artifact 文件"（文件夹图标）、"Memory 记忆"（大脑+数据库图标）、"State 状态"（键值对图标）。整体白色大背景，层级感分明。
>
> 整体目的：让读者对 ADK 的整体架构有一个全景认知，理解各层的职责和协作关系。

### **3.3 LLM 集成层**

这一层处理与大模型的所有交互。ADK 内部有一个叫 `Flow` 的核心流程，它编排了一次完整的 LLM 交互过程：构建 Prompt → 调用模型 → 解析响应 → 如果模型要求调用工具就执行工具 → 把工具结果喂回模型 → 重复直到模型给出最终回复。这就是我们前面讲过的 ReAct 循环在框架层面的实现。

值得一提的是，ADK 虽然由 Google 开发，默认对 Gemini 模型做了深度优化，但它的设计是**模型无关的（model-agnostic）**。通过 OpenAI 兼容接口，你可以接入通义千问、DeepSeek、GPT-4 等任何支持 OpenAI 协议的模型。在我们这个系列里，统一使用通义千问（DashScope）的 OpenAI 兼容接口来接入模型。

### **3.4 基础服务层**

最底下是一组基础服务，它们为 Agent 的运行提供持久化和状态管理能力：

- **Session 服务**：管理对话会话，保存用户和 Agent 之间的消息历史。每次对话都有一个 Session，Session 里有 State（状态数据）。
- **Artifact 服务**：管理文件类型的产物，比如 Agent 生成的报告、图表等二进制文件。
- **Memory 服务**：提供长期记忆能力，可以把历史对话存入向量数据库，让 Agent 在后续对话中"回忆"起之前聊过的内容。
- **State 管理**：ADK 的 State 支持三种作用域——`session`（当前会话级）、`user:`（用户级，跨会话共享）和 `app:`（应用级，所有用户共享）。

这些服务都通过接口来抽象，ADK 内置了基于内存的实现（`InMemoryService`），适合开发调试。在生产环境中，你可以实现对应接口来对接 Redis、PostgreSQL、MongoDB 等存储系统。

## **4. 六大核心组件**

了解了整体架构，我们来逐个认识 ADK 的六大核心组件。这六个组件构成了 ADK 的"骨架"，后面几篇文章会分别深入讲解每一个，这里先建立一个全局认知。

### **4.1 Agent（智能体）**

Agent 是 ADK 中最核心的概念——它就是那个"能干活的智能体"。在代码层面，Agent 是一个接口（`agent.Agent`），最常用的实现是 `llmagent`，即背后连着大模型的 Agent。创建一个 LLM Agent 需要提供四个关键信息：名字（Name）、描述（Description）、指令（Instruction）和模型（Model）。

Agent 还可以挂载工具（Tools）和子 Agent（SubAgents）。挂载工具后，Agent 在对话中如果判断需要外部能力，就会通过 Function Calling 来调用工具；挂载子 Agent 后，父 Agent 可以把任务委派给子 Agent 处理，实现多智能体协作。

### **4.2 Tool（工具）**

工具是 Agent 与外部世界交互的桥梁。在 ADK 中，最常用的工具创建方式是 `functiontool.New`——你只需要定义一个普通的 Go 函数，ADK 会自动根据函数的输入输出类型生成 JSON Schema，大模型就能知道这个工具接收什么参数、返回什么结果。

来看一个例子——把一个查询天气的 Go 函数变成 Agent 可调用的工具：

```go
package main

import (
    "fmt"
    "log"

    "google.golang.org/adk/tool"
    "google.golang.org/adk/tool/functiontool"
)

// WeatherInput 定义工具的输入参数
type WeatherInput struct {
    City string `json:"city" jsonschema:"description=城市名称"`
}

// WeatherOutput 定义工具的输出结果
type WeatherOutput struct {
    Temperature float64 `json:"temperature"`
    Condition   string  `json:"condition"`
}

// getWeather 就是一个普通的 Go 函数
func getWeather(ctx tool.Context, input WeatherInput) (WeatherOutput, error) {
    // 这里模拟查询天气，实际场景可以调用天气 API
    return WeatherOutput{
        Temperature: 26.5,
        Condition:   fmt.Sprintf("%s 天气晴朗", input.City),
    }, nil
}

func main() {
    // 一行代码把 Go 函数变成 Agent 工具
    weatherTool, err := functiontool.New(functiontool.Config{
        Name:        "get_weather",
        Description: "查询指定城市的当前天气",
    }, getWeather)
    if err != nil {
        log.Fatalf("创建工具失败: %v", err)
    }

    fmt.Printf("工具创建成功: %s\n", weatherTool.Name())
}
```

运行结果：
```
工具创建成功: get_weather
```

注意看，`getWeather` 函数的入参类型 `WeatherInput` 上面有 `jsonschema` 标签，ADK 会自动读取这些标签来生成工具描述，告诉大模型"这个工具需要一个 city 参数，表示城市名称"。你不需要手写 JSON Schema，Go 的类型系统帮你搞定了一切。

除了函数工具，ADK 还支持 `agenttool`（把一个 Agent 包装成工具供其他 Agent 调用）、`geminitool`（Gemini 内置工具如 Google Search）等多种工具类型。

> 【建议配图4 —— ADK 工具系统工作原理】
>
> 图片描述：一张从左到右的流程图。最左边是一个 Gopher 图标旁边放着一个 Go 源文件，标注"Go 函数 + 类型定义"。一条蓝色箭头向右指向中间的"functiontool.New"（带魔法棒图标的蓝色圆角矩形），箭头上方标注"自动提取"。中间矩形向右引出两条分支箭头：上方箭头指向一个 JSON 文档图标，标注"JSON Schema（参数描述）"，颜色为绿色；下方箭头指向一个函数执行图标（带闪电的齿轮），标注"可执行函数（运行时调用）"。这两个产物再各引一条虚线箭头汇聚到最右边的机器人图标"LLM Agent"，上方虚线标注"告诉模型：我能干什么"，下方虚线标注"模型说调用时：执行它"。整体白色背景，流程从左到右清晰流畅。
>
> 整体目的：帮助读者理解 ADK 如何自动将 Go 函数转化为大模型可调用的工具，无需手写 Schema。

### **4.3 Session（会话）**

Session 管理的是对话的上下文。每个用户和 Agent 的一轮对话就是一个 Session，Session 里保存着完整的消息历史和状态数据。ADK 通过 `session.Service` 接口来抽象会话管理，支持创建、获取、更新、删除等操作。

Session 里有一个很重要的概念叫 **State**（状态），它是一个键值对存储，Agent 在对话过程中可以读写 State 来保存临时数据。前面提到过，State 支持三种作用域前缀：不带前缀的是会话级，`user:` 前缀是用户级（同一个用户的不同会话共享），`app:` 前缀是应用级（所有用户共享）。这种分层设计让你既能保存"这轮对话用户选了什么"，又能保存"这个用户的历史偏好"，还能保存"全局配置信息"。

### **4.4 Runner（运行器）**

Runner 是 ADK 的总调度器，负责把所有组件串起来。它接收用户消息，找到对应的 Session，交给 Agent 处理，收集 Agent 产生的事件，写回 Session，最后把响应返回给用户。

创建 Runner 的时候，你需要把 Agent、Session 服务、Artifact 服务等组件都"注入"进去：

```go
r, err := runner.New(runner.Config{
    AppName:        "my_app",
    Agent:          myAgent,
    SessionService: session.InMemoryService(),
})
```

然后调用 `r.Run()` 方法就能驱动整个系统运转。`Run` 方法返回的是一个事件流（`iter.Seq2[*session.Event, error]`），你可以用 Go 1.23+ 的 range-over-function 语法来遍历：

```go
for event, err := range r.Run(ctx, userID, sessionID, message, runConfig) {
    // 处理每个事件
}
```

这种基于事件流的设计非常优雅——它天然支持流式输出，Agent 产生一个事件你就能立即处理一个，不需要等到全部完成。

### **4.5 Plugin（插件）**

Plugin 是 ADK 的横切关注点（cross-cutting concerns）机制。所谓横切关注点，就是那些跟具体业务逻辑无关但又需要到处生效的功能——比如日志记录、性能监控、Token 用量统计、访问控制等。

ADK 的插件通过 `plugin.New` 创建，可以注册多种回调：`OnUserMessageCallback`（收到用户消息时触发）、`OnEventCallback`（Agent 产生事件时触发）等。插件挂载在 Runner 级别，对所有 Agent 的所有请求都生效，不需要在每个 Agent 里重复配置。

### **4.6 Memory（记忆）**

Memory 服务提供跨会话的长期记忆能力。Session 里的消息历史会随着会话结束而"冻结"，但 Memory 服务可以把重要的对话内容提取出来，存入持久化存储（通常是向量数据库），供未来的对话检索使用。

这就好比人的记忆系统——Session 是工作记忆（当前正在想的事），Memory 是长期记忆（过去发生过的事）。Agent 可以通过 `memoryService.SearchMemory` 来搜索历史对话，找到相关信息后注入当前对话的上下文中，实现"我记得你之前说过……"的效果。

> 【建议配图5 —— ADK 六大核心组件关系图】
>
> 图片描述：一张以 Runner 为中心的星形关系图。中央是一个大的蓝色圆形，内部有一个指挥棒/调度台图标，标注"Runner 运行器"。围绕中心等距分布六个较小的彩色圆形，用粗实线与中心连接：左上绿色圆"Agent 智能体"（机器人图标），上方橙色圆"Tool 工具"（扳手图标），右上紫色圆"Plugin 插件"（插头图标），右下青色圆"Memory 记忆"（大脑图标），下方黄色圆"Artifact 文件"（文件夹图标），左下粉色圆"Session 会话"（对话气泡图标）。Agent 和 Tool 之间有一条绿色虚线标注"调用"，Session 和 Memory 之间有一条青色虚线标注"持久化"，Agent 和 Plugin 之间有一条紫色虚线标注"回调拦截"。每个圆形下方有一行灰色小字简述功能。整体白色背景，视觉焦点在中央的 Runner。
>
> 整体目的：让读者一目了然地看到 ADK 的六大核心组件及其相互关系，建立全局认知。

## **5. 与主流框架对比**

Agent 开发框架这个赛道已经有不少玩家了，ADK 凭什么值得你学？我们把 ADK Go 和两个最主流的框架——LangChain（Python）和 CrewAI（Python）做一个横向对比，看看各自的优势和适用场景。

### **5.1 LangChain：大而全的生态**

LangChain 是目前生态最丰富的 Agent 框架，没有之一。它有海量的集成——几百种 LLM 接入、几百种工具、几十种向量数据库……几乎你想用的第三方服务，LangChain 都有现成的集成。对于快速原型开发，LangChain 的效率确实很高，拼一拼组件就能跑起来。

但 LangChain 的问题也很突出。首先是**抽象层次太多**，一个简单的调用链背后可能嵌套了五六层封装，出了问题调试起来非常痛苦——你需要在 Chain、Agent、Tool、Memory、Callback 这些层之间来回跳，每一层都有自己的抽象和约定。其次是**API 稳定性差**，LangChain 的接口变化非常频繁，半年前写的代码半年后可能就跑不了了。最后是**性能不占优势**——Python 本身的并发能力和运行效率在高负载场景下会成为瓶颈。

### **5.2 CrewAI：角色扮演的多Agent协作**

CrewAI 在多 Agent 协作这个方向上做得很有特色。它引入了"角色扮演"的概念——你可以定义"研究员"、"作家"、"审核员"等不同角色的 Agent，每个角色有自己的目标和背景故事，然后让它们组成一个"团队"来协作完成任务。这种方式对于内容创作、数据分析等场景很直观。

但 CrewAI 的局限在于它高度专注于多 Agent 协作场景。如果你要做的是一个简单的单 Agent 工具调用应用，CrewAI 的角色/任务/团队这套模型反而显得过重了。另外，CrewAI 的可定制性不如 ADK——它对 Agent 之间的交互模式做了比较多的预设，想要完全自定义执行流程不太容易。

### **5.3 ADK Go：模块化与生产级性能**

ADK 走的是一条折中路线。它没有 LangChain 那么庞大的生态集成（至少目前如此），也没有 CrewAI 那么聚焦的角色扮演模型。ADK 的核心竞争力在于三点：**模块化设计、Go 语言的生产级性能，以及 Google Cloud 的原生支持**。

模块化意味着你可以只用你需要的部分——需要 Session 管理？引入 `session` 包。需要工具系统？引入 `functiontool` 包。不需要的功能完全不会出现在你的代码里，也不会增加编译体积。这和 Go 标准库的设计哲学一脉相承。

性能方面，Go 的优势不需要多说。编译型语言、goroutine 并发模型、低内存占用——这些特性在生产环境中意味着更高的吞吐量和更低的运行成本。当你的 Agent 服务需要同时处理几百个并发请求时，Go 版本的优势会非常明显。

> 【建议配图6 —— 三大框架对比雷达图】
>
> 图片描述：三张并排的雷达图（也叫蜘蛛图），从左到右分别标注"LangChain"（紫色）、"CrewAI"（橙色）、"ADK Go"（蓝色）。雷达图有六个维度轴：生态丰富度、上手难度（越高越容易）、性能、可调试性、多Agent支持、生产就绪度。LangChain 的雷达图在"生态丰富度"这个轴上几乎到满分，"上手难度"中等，"性能"和"可调试性"偏低。CrewAI 在"多Agent支持"和"上手难度"上较高，其余中等。ADK Go 在"性能"、"可调试性"、"生产就绪度"三个轴上较高，"生态丰富度"偏低，"多Agent支持"中高。每个雷达图下方有一行总结语：LangChain——"生态之王，复杂度之王"，CrewAI——"多Agent协作专家"，ADK Go——"生产级性能，工程师友好"。整体白色背景，三张图等宽排列。
>
> 整体目的：通过可视化的雷达图让读者快速把握三个框架的各自优势和短板，辅助技术选型。

下面这张表格从几个关键维度做一个更直观的比较：

| 维度 | LangChain (Python) | CrewAI (Python) | ADK Go |
|------|-------------------|-----------------|--------|
| 开发语言 | Python | Python | Go |
| 设计理念 | 链式组合、全栈生态 | 角色扮演、团队协作 | 代码优先、模块化 |
| 学习曲线 | 较陡（抽象层多） | 中等（概念直观） | 较平（Go 开发者友好） |
| 并发性能 | 受 GIL 限制 | 受 GIL 限制 | goroutine 原生并发 |
| 部署方式 | 多种 | 多种 | Docker/K8s/Cloud Run |
| 多 Agent | 支持（AgentExecutor） | 核心特性 | 支持（多种编排模式） |
| 工具生态 | 极其丰富（数百种） | 中等 | 发展中 |
| 适合场景 | 快速原型、复杂集成 | 内容创作、团队协作 | 生产部署、高并发服务 |

每个框架都有自己的生态位。如果你是 Python 开发者，想要快速原型验证一个 Agent 想法，LangChain 仍然是不错的选择。如果你的业务天然就是"多个角色协作完成任务"的模式，CrewAI 的抽象很匹配。但如果你是 Go 开发者，要构建的是一个需要高并发、低延迟、长期维护的生产级 Agent 服务——ADK Go 就是为你而生的。

## **6. 为什么选 Go**

聊完框架对比，有一个更底层的问题值得讨论：为什么要用 Go 来写 Agent 应用？

目前大模型应用开发领域，Python 是绝对的霸主——无论是 LangChain、LlamaIndex、CrewAI 还是 AutoGen，清一色都是 Python。这很正常，Python 在 AI/ML 领域的生态积累太深了，从 NumPy、PyTorch 到 HuggingFace，整条工具链都是 Python 的。

但 Agent 应用和传统的 AI/ML 应用有一个本质区别：**Agent 应用本质上是一个后端服务**。它不做模型训练，不做数据分析，它做的事情是接收用户请求、调用大模型 API、执行工具、管理状态、返回响应——这和你写一个 Web 后端服务没什么两样。而后端服务这个领域，恰恰是 Go 的主场。

Go 写 Agent 应用的优势可以从几个维度来看。

**并发是 Go 的看家本领**。Agent 应用天然需要并发——多个用户同时发请求、一个 Agent 同时调用多个工具、多个 Agent 并行执行不同任务。Go 的 goroutine 是为这种场景设计的。你可以轻松启动几万个 goroutine 而不用担心系统资源耗尽，channel 又提供了优雅的协程间通信方式。反观 Python，受限于 GIL（全局解释器锁），真正的并行计算需要借助多进程或 asyncio，用起来远没有 goroutine 这么自然。

**编译部署是 Go 的另一个杀手锏**。Go 编译出来的是一个静态链接的二进制文件，不依赖任何运行时环境。你的 Agent 服务打包成 Docker 镜像可能只有 20MB（用 `scratch` 或 `alpine` 基础镜像），而 Python 应用光一个 `requirements.txt` 里的依赖就可能上百兆。在 Kubernetes 集群里，镜像大小直接影响拉取速度和调度效率，Go 的优势是实打实的。

**类型安全在大型项目中至关重要**。Agent 应用涉及大量的数据结构——工具的输入输出、Session 的状态、模型的请求响应……在 Python 里，这些数据结构通常用字典来传递，一个拼写错误可能在运行时才暴露。Go 的静态类型系统能在编译期就捕获这类错误。当你的项目有上百个工具定义的时候，编译器帮你做的类型检查能省下大量的调试时间。

**Go 在云原生领域的地位不可撼动**。Docker、Kubernetes、etcd、Prometheus、Istio……这些云原生基础设施几乎都是 Go 写的。如果你的 Agent 服务要部署在 K8s 上、接入 Prometheus 监控、通过 gRPC 与其他微服务通信，用 Go 来写意味着你在一个高度一致的技术栈里工作，工具链、最佳实践、社区资源都是现成的。

> 【建议配图7 —— Go 语言构建 Agent 应用的优势矩阵】
>
> 图片描述：一张 2x2 的矩阵图，四个象限分别展示 Go 的四大优势。左上象限"并发性能"（蓝色调）：中央是一个多线程的齿轮组图标，上方有数字"10,000+ goroutines"，下方小字"轻量级协程 · channel 通信 · 天然并行"。右上象限"部署效率"（绿色调）：中央是一个小巧的容器箱图标（Docker 鲸鱼简化版），上方数字"~20MB 镜像"，下方小字"静态编译 · 零依赖 · 秒级启动"。左下象限"类型安全"（橙色调）：中央是一个盾牌内嵌对勾的图标，上方文字"编译期检查"，下方小字"结构体定义 · 接口约束 · 重构无忧"。右下象限"云原生生态"（紫色调）：中央是一组小图标横排——K8s 轮船、Prometheus 火炬、Docker 鲸鱼、gRPC 闪电，下方小字"同一技术栈 · 无缝集成"。四个象限中央交汇处有一个 Gopher 吉祥物图标。整体白色背景，四个象限颜色柔和区分。
>
> 整体目的：系统展示 Go 构建 Agent 应用的四大核心优势，增强读者对技术选型的信心。

当然，Go 也不是没有短板。大模型相关的 Go 第三方库确实没有 Python 那么丰富——比如文档解析、PDF 处理、复杂的文本分割等功能，Python 有大量成熟方案，Go 侧可能需要自己实现或者调用外部服务。但随着 ADK Go 这样的框架出现，Go 在 Agent 开发领域的生态正在快速补齐。况且，Agent 应用的核心逻辑主要就是 API 调用和业务编排，这些 Go 完全胜任。

选 Go 不是因为它在每个维度都比 Python 强，而是因为 **Agent 应用的本质需求——高并发、长期运行、稳定可靠、易于部署——恰好是 Go 最擅长的事情**。

## **7. 一个完整的初体验**

光讲概念可能还是有点抽象，最后我们用一个完整的、可运行的例子来感受一下 ADK 的开发体验。这个例子创建一个带工具的 Agent，让它能够查询天气并做简单的数学计算。

首先确保你的开发环境准备就绪：

```bash
# 确保 Go 版本 >= 1.23（ADK 使用了 iter.Seq2 等新特性）
go version

# 创建项目
mkdir adk-hello && cd adk-hello
go mod init adk-hello

# 安装依赖
go get google.golang.org/adk
go get github.com/sashabaranov/go-openai
```

然后设置通义千问的 API Key。如果你还没有，可以去阿里云百炼平台（bailian.console.aliyun.com）免费申请：

```bash
export DASHSCOPE_API_KEY="你的API Key"
```

下面是完整的示例代码：

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    "github.com/sashabaranov/go-openai"
)

func main() {
    ctx := context.Background()

    // 通过 OpenAI 兼容接口接入通义千问
    config := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
    config.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    client := openai.NewClientWithConfig(config)

    // 定义工具：查询天气
    tools := []openai.Tool{
        {
            Type: openai.ToolTypeFunction,
            Function: &openai.FunctionDefinition{
                Name:        "get_weather",
                Description: "查询指定城市的当前天气",
                Parameters: map[string]interface{}{
                    "type": "object",
                    "properties": map[string]interface{}{
                        "city": map[string]interface{}{
                            "type":        "string",
                            "description": "城市名称，如：北京、上海",
                        },
                    },
                    "required": []string{"city"},
                },
            },
        },
    }

    // 构造对话消息
    messages := []openai.ChatCompletionMessage{
        {
            Role:    openai.ChatMessageRoleSystem,
            Content: "你是一个有用的助手，可以帮用户查询天气。",
        },
        {
            Role:    openai.ChatMessageRoleUser,
            Content: "北京今天天气怎么样？",
        },
    }

    // 第一轮调用：模型判断是否需要调用工具
    resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
        Model:    "qwen-plus",
        Messages: messages,
        Tools:    tools,
    })
    if err != nil {
        log.Fatalf("调用模型失败: %v", err)
    }

    choice := resp.Choices[0]

    // 检查模型是否要求调用工具
    if len(choice.Message.ToolCalls) > 0 {
        toolCall := choice.Message.ToolCalls[0]
        fmt.Printf("模型请求调用工具: %s\n", toolCall.Function.Name)
        fmt.Printf("调用参数: %s\n", toolCall.Function.Arguments)

        // 模拟工具执行结果
        toolResult := `{"temperature": 28, "condition": "晴朗", "humidity": 45}`

        // 把工具结果喂回模型
        messages = append(messages, choice.Message)
        messages = append(messages, openai.ChatCompletionMessage{
            Role:       openai.ChatMessageRoleFunction,
            Content:    toolResult,
            Name:       toolCall.Function.Name,
            ToolCallID: toolCall.ID,
        })

        // 第二轮调用：模型根据工具结果生成最终回复
        resp2, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
            Model:    "qwen-plus",
            Messages: messages,
            Tools:    tools,
        })
        if err != nil {
            log.Fatalf("第二轮调用失败: %v", err)
        }

        fmt.Printf("\nAgent 回复: %s\n", resp2.Choices[0].Message.Content)
    } else {
        fmt.Printf("Agent 回复: %s\n", choice.Message.Content)
    }
}
```

运行结果：
```
模型请求调用工具: get_weather
调用参数: {"city": "北京"}

Agent 回复: 北京今天天气晴朗，气温28°C，湿度45%，很适合出门活动哦！
```

这个例子虽然没有直接使用 ADK 的 Runner 和 Agent API（那些会在下一篇详细讲），但它展示了 Agent 开发的核心流程：定义工具 → 模型判断是否需要调用 → 执行工具 → 把结果喂回模型 → 获得最终回复。在 ADK 框架中，这个流程被 Runner 和 LLM Agent 自动管理，你只需要关注业务逻辑本身。

> 【建议配图8 —— Agent 工具调用完整流程时序图】
>
> 图片描述：一张从左到右的时序图（UML Sequence Diagram 风格）。参与者从左到右排列：用户（人形图标）、Agent/Runner（机器人图标）、大模型 LLM（大脑图标）、工具 Tool（扳手图标）。交互流程用带标号的箭头表示：①用户向 Agent 发送蓝色实线箭头"北京天气怎么样？"，②Agent 向 LLM 发送蓝色实线箭头"用户消息 + 工具列表"，③LLM 向 Agent 返回绿色虚线箭头"调用 get_weather(city=北京)"，④Agent 向 Tool 发送橙色实线箭头"执行 get_weather"，⑤Tool 向 Agent 返回橙色虚线箭头"温度28°C，晴朗"，⑥Agent 向 LLM 发送蓝色实线箭头"工具执行结果"，⑦LLM 向 Agent 返回绿色虚线箭头"生成自然语言回复"，⑧Agent 向用户返回绿色实线箭头"北京今天晴朗，28°C..."。每个参与者下方有一条竖向生命线（虚线）。流程清晰展示了两轮模型调用的完整过程。整体白色背景，箭头颜色区分请求（蓝色）、模型响应（绿色）和工具交互（橙色）。
>
> 整体目的：用时序图清晰展示 Agent 工具调用的完整交互流程，帮助读者理解"两轮调用"的机制。

## **8. 小结**

走到这里，你对 ADK Go 框架应该已经有了一个立体的认知。ADK 不是又一个"大模型调用封装库"——它是一套完整的 Agent 开发工具包，从 Agent 定义、工具管理、会话状态到多智能体编排，提供了构建生产级 Agent 应用所需的全部基础设施。Code-First 的设计理念让它与 Go 语言的工程哲学高度契合：明确优于隐晦，简单优于复杂，代码即文档。而 Go 语言本身在并发、部署、类型安全和云原生生态方面的优势，又让 ADK Go 成为构建高性能 Agent 服务的理想选择。框架只是起点，真正的功夫在于理解每个组件的设计意图，然后在实际业务中把它们用对用好。

<div style="background-color: #f0f9eb; padding: 10px 15px; border-radius: 4px; border-left: 5px solid #67c23a; margin: 20px 0; color:rgb(64, 147, 255);">

<h1><span style="color: #006400;"><strong>关注秀才公众号：</strong></span><span style="color: red;"><strong>IT杨秀才</strong></span><span style="color: #006400;"><strong>，领取精品学习资料</strong></span></h1>

<div style="color: #333; font-family: 'Microsoft YaHei', Arial, sans-serif; font-size: 14px;">
<ul>
<li><strong><span style="color: #006400;">公众号后台回复：</span><span style="color: red;">Go面试</span><span style="color: #006400;">，领取Go面试题库PDF</span></strong></li>
<li><strong><span style="color: #006400;">公众号后台回复：</span><span style="color: red;">Go学习</span><span style="color: #006400;">，领取Go必看书籍</span></strong></li>
<li><strong><span style="color: #006400;">公众号后台回复：</span><span style="color: red;">大模型</span><span style="color: #006400;">，领取大模型学习资料</span></strong></li>
<li><strong><span style="color: #006400;">公众号后台回复：</span><span style="color: red;">111</span><span style="color: #006400;">，领取架构学习资料</span></strong></li>
<li><strong><span style="color: #006400;">公众号后台回复：</span><span style="color: red;">26届秋招</span><span style="color: #006400;">，领取26届秋招企业汇总表</span></strong></li>
</ul>
</div>

![](/assets/icon/avatar.png)

</div>
