---
title: 15. Runner运行机制
description: "Go语言 AI Agent 入门教程：深入解析 Google ADK 框架 Runner 运行机制，详解 runner.Config 配置项、Run() 事件流驱动模型、session.Event 事件解析、StreamingMode 流式输出、RunConfig 运行参数、Plugin 插件集成与多轮工具调用编排，附完整可运行 Go 代码示例。"
category:
  - Go Agent
tag:
  - Go Agent
  - 大模型
  - ADK
  - Google ADK
  - AI Agent教程
  - Go语言
  - Runner
---

# **Runner运行机制**

前面几篇文章，我们分别讲了模型层、Agent 配置和 Session 会话管理。如果说模型是 Agent 的"大脑"，Config 是它的"性格"，Session 是它的"记忆"，那 Runner 就是把这一切串联起来的"神经系统"——它负责接收用户消息、调度 Agent 执行、驱动模型思考、编排工具调用、维护会话状态，最终把结果以事件流的形式交还给你。

在快速上手那篇文章里，我们已经用过 Runner 了：`runner.New` 创建实例，`r.Run` 启动执行，`for range` 遍历事件。当时我们只是"用了"，没有深究。但当你开始构建真实的 Agent 应用时，很多问题会冒出来：Runner 的 Config 里那些可选字段（ArtifactService、MemoryService、PluginConfig）到底干嘛的？`Run()` 返回的事件流里每个 Event 都带了哪些信息？StreamingMode 怎么控制流式输出？RunConfig 和 RunOption 又能做什么？

这篇文章就把 Runner 从头到脚拆解一遍。从 Config 的每个字段讲起，到 `Run()` 方法的执行流程，再到 Event 的完整数据模型，最后用代码实战演示流式输出和状态管理——让你对 ADK 的"中枢调度器"了然于胸。

## **1. Runner 在 ADK 中的角色**

在 ADK 的六大核心组件（Agent、Model、Runner、Session、Tool、Plugin）中，Runner 是唯一一个直接面向开发者的"入口组件"。你写完 Agent、配好模型、准备好 Session 服务之后，所有的交互都是通过 Runner 来发起的。换句话说，Runner 是你的代码和 Agent 世界之间的那扇门。

Runner 的职责可以用一句话概括：**接收用户消息，协调各组件完成一轮对话，以事件流的形式返回结果**。但这句话背后隐藏了大量的编排逻辑。一次看似简单的对话，Runner 在幕后要做的事情远比你想象的多：它要从 Session 中加载对话历史，把历史和新消息打包成 LLMRequest 交给模型，判断模型的返回是直接回复还是工具调用请求，如果是工具调用就自动执行工具函数再把结果喂回模型，如果模型触发了 Agent 转移就路由到对应的子 Agent，同时还要在每个环节触发注册好的插件回调，最后把所有产生的事件写回 Session。

> 【建议配图1 —— Runner 中枢调度全景图】
>
> 图片描述：一张以 Runner 为核心的星型辐射架构图。中央是一个大的深蓝色圆角矩形，内部有指挥家（拿指挥棒的人物剪影）图标，大字标注"Runner"，下方小字"中枢调度器"。从 Runner 向外辐射出六条不同颜色的连接线，每条连接到一个组件节点：左上方绿色线连接"Agent"（机器人图标），标注"① 调度执行"；正上方紫色线连接"Model"（大脑图标），标注"② 驱动思考"；右上方橙色线连接"Tool"（扳手图标），标注"③ 编排工具"；右下方青色线连接"Session"（数据库圆柱图标），标注"④ 读写状态"；正下方粉色线连接"Plugin"（拼图图标），标注"⑤ 触发回调"；左下方灰色线连接"Artifact/Memory"（文件夹+搜索图标），标注"⑥ 存储管理"。外围用一个浅蓝色虚线大圆圈把所有节点圈住，圆圈外左侧有用户头像图标，一条蓝色粗箭头指向 Runner 标注"用户消息"，右侧有一条蓝色粗箭头从 Runner 指出标注"事件流 iter.Seq2"。整体白色背景，Runner 居中且最大最醒目，强调其"中枢"地位。
>
> 整体目的：让读者一眼理解 Runner 在 ADK 架构中的核心位置——它连接并协调所有其他组件，是整个 Agent 执行流程的总指挥。

理解了 Runner 的角色定位，我们就来看看它的 API 设计。

## **2. runner.Config：Runner 的配置清单**

创建 Runner 用 `runner.New(cfg)` 函数，参数是一个 `runner.Config` 结构体。在快速上手那篇文章里，我们只用了三个必填字段，现在来看看完整的配置项：

```go
type Config struct {
    AppName           string            // 应用名称（必填）
    Agent             agent.Agent       // 根 Agent（必填）
    SessionService    session.Service   // Session 服务（必填）
    ArtifactService   artifact.Service  // Artifact 服务（可选）
    MemoryService     memory.Service    // Memory 服务（可选）
    PluginConfig      PluginConfig      // 插件配置（可选）
    AutoCreateSession bool              // 自动创建 Session（可选）
}
```

前三个字段我们已经很熟悉了。`AppName` 是应用的唯一标识，和 Session 的三元组（AppName + UserID + SessionID）中的第一维对应。`Agent` 是根 Agent——Runner 接到用户消息后，就是从这个 Agent 开始执行的。`SessionService` 负责 Session 的存储和检索，决定了对话历史存在哪里。

剩下四个可选字段是 Runner 进阶能力的入口，咱们逐一来看。

### **2.1 ArtifactService：文件管理服务**

`ArtifactService` 是 ADK 的文件管理系统。当 Agent 在对话过程中需要处理文件——比如用户上传了一张图片让 Agent 分析、或者 Agent 生成了一份报告需要保存——Artifact 服务就派上用场了。它提供了 `Save`、`Load`、`List` 等方法来管理这些二进制文件，每个文件通过文件名和版本号来标识。如果你暂时不需要文件处理能力，不设置这个字段就行，Runner 会正常运行，只是 Agent 中涉及 Artifact 操作的逻辑会报错。这部分我们会在 ADK 进阶篇专门展开。

### **2.2 MemoryService：长期记忆服务**

`MemoryService` 是 ADK 的长期记忆系统。它和 Session 里的短期记忆（对话历史）不同——Session 记录的是"当前这一轮聊了什么"，Memory 记录的是"跨越多轮对话积累的知识"。比如用户说过"我喜欢简洁的代码风格"，这条信息应该被持久化到 Memory 中，下次开启新 Session 时 Agent 依然能记住这个偏好。Memory 服务通常需要搭配向量数据库来实现语义检索能力，也是进阶篇的内容。

### **2.3 PluginConfig：插件配置**

`PluginConfig` 让你在 Runner 的执行流程中插入自定义逻辑——比如记录日志、统计 Token 用量、审计工具调用等。它的结构是：

```go
type PluginConfig struct {
    Plugins      []*plugin.Plugin   // 插件列表
    CloseTimeout time.Duration      // 关闭超时时间
}
```

`Plugins` 是一个插件数组，每个插件可以注册多个回调点（BeforeModel、AfterModel、BeforeTool、AfterTool 等），Runner 在执行到对应阶段时会自动调用这些回调。`CloseTimeout` 控制 Runner 关闭时等待插件清理的最长时间。插件机制的详细用法在 ADK 进阶篇的"回调与插件机制"中会深入讲解。

### **2.4 AutoCreateSession：自动创建会话**

`AutoCreateSession` 是一个很实用的便利选项。设置为 `true` 后，当 `Run()` 方法发现传入的 `sessionID` 对应的 Session 不存在时，Runner 会自动帮你创建一个新 Session，而不是报错返回。这在某些场景下很方便——比如你用前端生成了一个 UUID 作为 sessionID，不想在调用 `Run()` 之前还要先调一次 `sessionService.Create()`，打开这个开关就行了。

我们写一段代码来感受一下这些配置项的用法：

```go
package main

import (
	"context"
	"fmt"
	"log"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
)

func main() {
	ctx := context.Background()

	m := NewDashScopeModel("qwen-plus")

	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "demo_agent",
		Model:       m,
		Description: "演示助手",
		Instruction: "你是一个友好的助手，回答简洁明了。",
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()

	// 完整版 Runner 配置
	r, err := runner.New(runner.Config{
		AppName:           "demo_app",
		Agent:             myAgent,
		SessionService:    sessionService,
		AutoCreateSession: true, // 开启自动创建 Session
		// ArtifactService 和 MemoryService 暂不设置
		// PluginConfig 暂不设置
	})
	if err != nil {
		log.Fatalf("创建 Runner 失败: %v", err)
	}

	// 因为开启了 AutoCreateSession，可以直接用自定义 ID 调用 Run
	// 不需要先调用 sessionService.Create()
	userMsg := genai.NewContentFromText("你好，Runner 自动创建了 Session 吗？", "user")

	for event, err := range r.Run(ctx, "user1", "my-custom-session-001", userMsg, agent.RunConfig{}) {
		if err != nil {
			log.Printf("错误: %v", err)
			continue
		}
		if event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Println("Agent:", part.Text)
				}
			}
		}
	}

	// 验证 Session 确实被自动创建了
	sess, err := sessionService.Get(ctx, &session.GetRequest{
		AppName:   "demo_app",
		UserID:    "user1",
		SessionID: "my-custom-session-001",
	})
	if err != nil {
		log.Fatalf("获取 Session 失败: %v", err)
	}
	fmt.Printf("Session 已自动创建，包含 %d 个事件\n", len(sess.Session.Events()))
}
```

运行结果：
```
Agent: 你好！是的，Session 已经自动创建了。有什么我可以帮你的吗？
Session 已自动创建，包含 2 个事件
```

注意看代码中我们没有调用 `sessionService.Create()`，直接拿自定义的 `"my-custom-session-001"` 作为 sessionID 传给 `r.Run()`。因为设置了 `AutoCreateSession: true`，Runner 发现这个 Session 不存在时自动创建了一个。对话完成后，Session 里已经有了 2 个事件（用户消息 + Agent 回复）。

## **3. Run() 方法：事件流的发动机**

Runner 的核心方法就一个：`Run()`。它的签名我们在前面的文章中已经见过：

```go
func (r *Runner) Run(
    ctx context.Context,
    userID string,
    sessionID string,
    msg *genai.Content,
    cfg agent.RunConfig,
    opts ...RunOption,
) iter.Seq2[*session.Event, error]
```

六个参数，各司其职。`ctx` 是 Go 标准的上下文对象，用于超时控制和取消传播——如果你希望一次对话最多执行 30 秒，用 `context.WithTimeout` 包一下传进来就行。`userID` 和 `sessionID` 定位到具体的会话。`msg` 是用户本轮输入的消息。`cfg` 是运行配置（下一节细讲）。`opts` 是可选参数，目前主要有一个 `WithStateDelta`。

返回值 `iter.Seq2[*session.Event, error]` 是 Go 1.23 引入的迭代器类型，这意味着你可以用 `for event, err := range r.Run(...)` 来逐个消费事件。每个事件代表 Agent 执行过程中的一个"动作"——可能是模型生成了文本、可能是模型请求调用工具、可能是工具返回了结果、也可能是 Agent 之间发生了转移。

### **3.1 Run() 的内部执行流程**

当你调用 `r.Run()` 时，Runner 内部大致经历了这样一个流程：

首先，Runner 通过 `SessionService` 加载或创建 Session，拿到当前会话的完整上下文。然后它在根 Agent 的 Agent 树中找到应该处理本轮消息的 Agent——在简单场景下就是根 Agent 本身，在多 Agent 场景下可能是某个子 Agent（通过 `Branch` 字段来追踪）。

接下来进入核心循环。Runner 把用户消息和对话历史打包成 `LLMRequest`，调用 Agent 的 `Run()` 方法（内部会调 Model 的 `GenerateContent()`），拿到模型的响应。如果模型直接返回了文本回复，Runner 把它包装成 Event 通过 `yield` 推给你，同时写入 Session——这轮对话就结束了。

但如果模型返回的是 `FunctionCall`（工具调用请求），Runner 会自动执行对应的工具函数，把执行结果构造成 `FunctionResponse`，然后再次调用模型——这次模型拿到了工具结果，通常会生成最终的文本回复。这个"调用工具 → 喂回结果 → 再调模型"的循环可能反复多次（比如模型需要连续调用多个工具），直到模型给出最终回复为止。

> 【建议配图2 —— Run() 方法内部执行流程图】
>
> 图片描述：一张从上到下的纵向流程图，使用泳道图风格，左侧泳道标注"Runner"，右侧泳道标注"Model"。流程开始于顶部一个蓝色圆角矩形"r.Run(ctx, userID, sessionID, msg, cfg)"。第一步在 Runner 泳道内：绿色矩形"加载 Session & 对话历史"（数据库图标），下方箭头指向"打包 LLMRequest"（包裹图标）。然后一条橙色粗箭头跨越泳道从 Runner 指向 Model 泳道的"GenerateContent()"（大脑图标）。Model 泳道内有一个菱形判断节点"返回类型？"，左分支标注"文本回复"，用绿色箭头回到 Runner 泳道的"yield Event（文本）"（对话气泡图标），再向下到"写入 Session"（磁盘图标），最后到绿色圆角矩形"结束"。右分支标注"FunctionCall"，用橙色箭头回到 Runner 泳道的"执行工具函数"（齿轮+闪电图标），然后"构造 FunctionResponse"（回形针图标），再用一条向上的回环虚线箭头标注"再次调用模型"回到"打包 LLMRequest"步骤。回环箭头旁边有一个小的循环图标和文字"可能多次循环"。整体白色背景，流程清晰，关键判断节点用菱形突出。
>
> 整体目的：让读者清晰理解 Run() 内部的执行逻辑——特别是工具调用时的循环机制，以及事件是如何在每个步骤被产出的。

### **3.2 事件流的消费模式**

`Run()` 返回的事件流本质上是一个惰性迭代器——只有当你用 `for range` 遍历它时，Runner 才会真正开始执行。这意味着你可以灵活控制事件的消费时机和方式。

最常见的消费模式是"只取最终回复"，也就是我们在快速上手中用的方式：

```go
for event, err := range r.Run(ctx, userID, sessionID, msg, agent.RunConfig{}) {
    if err != nil {
        log.Printf("错误: %v", err)
        continue
    }
    if event.IsFinalResponse() && event.Content != nil {
        fmt.Println(extractText(event.Content))
    }
}
```

但在很多场景下，你需要关注中间事件——比如想在 UI 上展示"Agent 正在调用天气查询工具…"的进度提示，或者想记录每次工具调用的耗时。这时候就需要对事件做更精细的分类处理。我们用一段代码来演示完整的事件解析：

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
	"google.golang.org/adk/tool"
	"google.golang.org/adk/tool/functiontool"
)

// 计算器工具
type CalcInput struct {
	Expression string `json:"expression" jsonschema:"description=数学表达式，如 2+3、10*5"`
}

type CalcOutput struct {
	Result float64 `json:"result"`
}

func calculate(ctx tool.Context, input CalcInput) (CalcOutput, error) {
	// 简单模拟：实际项目中可用 math/big 或表达式引擎
	results := map[string]float64{
		"2+3":   5,
		"10*5":  50,
		"100/4": 25,
		"7*8":   56,
	}
	if r, ok := results[input.Expression]; ok {
		return CalcOutput{Result: r}, nil
	}
	return CalcOutput{Result: 42}, nil // 默认返回宇宙的答案
}

func main() {
	ctx := context.Background()

	m := NewDashScopeModel("qwen-plus")

	calcTool, err := functiontool.New(functiontool.Config{
		Name:        "calculate",
		Description: "计算数学表达式的结果",
	}, calculate)
	if err != nil {
		log.Fatalf("创建工具失败: %v", err)
	}

	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "calc_agent",
		Model:       m,
		Description: "计算助手",
		Instruction: "你是一个计算助手。用户问数学问题时，使用 calculate 工具计算，然后告诉用户结果。",
		Tools:       []tool.Tool{calcTool},
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()
	r, err := runner.New(runner.Config{
		AppName:           "calc_app",
		Agent:             myAgent,
		SessionService:    sessionService,
		AutoCreateSession: true,
	})
	if err != nil {
		log.Fatalf("创建 Runner 失败: %v", err)
	}

	userMsg := genai.NewContentFromText("请帮我算一下 7*8 等于多少", "user")

	fmt.Println("=== 事件流详细分析 ===")
	eventIndex := 0
	for event, err := range r.Run(ctx, "user1", "session-001", userMsg, agent.RunConfig{}) {
		if err != nil {
			log.Printf("错误: %v", err)
			continue
		}
		eventIndex++
		fmt.Printf("\n--- 事件 #%d ---\n", eventIndex)
		fmt.Printf("  Author: %s\n", event.Author)
		fmt.Printf("  IsFinalResponse: %v\n", event.IsFinalResponse())
		fmt.Printf("  TurnComplete: %v\n", event.TurnComplete)

		if event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Printf("  [文本] %s\n", part.Text)
				}
				if part.FunctionCall != nil {
					argsJSON, _ := json.Marshal(part.FunctionCall.Args)
					fmt.Printf("  [工具调用] %s(%s)\n", part.FunctionCall.Name, string(argsJSON))
				}
				if part.FunctionResponse != nil {
					respJSON, _ := json.Marshal(part.FunctionResponse.Response)
					fmt.Printf("  [工具结果] %s → %s\n", part.FunctionResponse.Name, string(respJSON))
				}
			}
		}

		// 检查 StateDelta
		if len(event.Actions.StateDelta) > 0 {
			fmt.Printf("  [状态变更] %v\n", event.Actions.StateDelta)
		}

		// 检查 Agent 转移
		if event.Actions.TransferToAgent != "" {
			fmt.Printf("  [Agent转移] → %s\n", event.Actions.TransferToAgent)
		}
	}
	fmt.Printf("\n=== 共 %d 个事件 ===\n", eventIndex)
}
```

运行结果：
```
=== 事件流详细分析 ===

--- 事件 #1 ---
  Author: calc_agent
  IsFinalResponse: false
  TurnComplete: false
  [工具调用] calculate({"expression":"7*8"})

--- 事件 #2 ---
  Author: calc_agent
  IsFinalResponse: false
  TurnComplete: false
  [工具结果] calculate → {"result":56}

--- 事件 #3 ---
  Author: calc_agent
  IsFinalResponse: true
  TurnComplete: true
  [文本] 7×8 的结果是 56。

=== 共 3 个事件 ===
```

三个事件清晰地对应了 Runner 内部的三个阶段。事件 #1 是模型发出的工具调用请求——模型看懂了用户的数学问题，决定调用 `calculate` 工具，参数是表达式 `"7*8"`。事件 #2 是工具执行的结果——Runner 自动调用了我们写的 `calculate` 函数，拿到结果 56，把它包装成 `FunctionResponse` 喂回模型。事件 #3 是模型根据工具结果生成的最终自然语言回复，`IsFinalResponse()` 返回 `true`，`TurnComplete` 也是 `true`，标志着这轮对话完成。

注意每个事件的 `Author` 字段都是 `"calc_agent"`——它告诉你这个事件是由哪个 Agent 产出的。在单 Agent 场景下这个字段不太有用，但在多 Agent 协作场景下，不同的子 Agent 会产出各自的事件，`Author` 就是区分它们的关键标识。

## **4. session.Event 深入：事件的完整数据模型**

上一节我们用代码打印了事件的几个关键字段，但 `session.Event` 的信息量远不止于此。它的完整结构是这样的：

```go
type Event struct {
    model.LLMResponse   // 内嵌模型响应（Content、FinishReason、UsageMetadata 等）

    ID           string        // 事件唯一 ID（由存储层生成）
    Timestamp    time.Time     // 事件产生时间
    InvocationID string        // 本轮调用的唯一标识
    Branch       string        // Agent 分支路径（如 "root.sub_agent_1"）
    Author       string        // 产出事件的 Agent 名称
    Actions      EventActions  // 附带的操作（状态变更、Agent 转移等）

    LongRunningToolIDs []string // 长运行工具的 ID 列表
}
```

`Event` 通过 Go 的结构体内嵌（embedding）直接继承了 `model.LLMResponse` 的所有字段。这意味着你可以在 Event 上直接访问 `event.Content`、`event.TurnComplete`、`event.FinishReason`、`event.UsageMetadata` 这些来自模型响应的信息，不需要额外解包。这个设计很巧妙——Event 既是"Agent 执行过程中的一个记录"，同时也携带了"模型在这一步给出的完整响应"。

### **4.1 从 LLMResponse 继承的字段**

因为 Event 内嵌了 `model.LLMResponse`，所以它直接拥有以下字段：

`Content` 是一个 `*genai.Content`，包含了这个事件的内容主体。Content 内部的 `Parts` 数组可能包含三种类型的 Part：`Text`（文本回复）、`FunctionCall`（工具调用请求）、`FunctionResponse`（工具执行结果）。判断一个事件是哪种类型，就是看它的 Parts 里装的是什么。

`TurnComplete` 是一个布尔值，当它为 `true` 时表示模型这一"轮"思考已经结束。在非流式模式下，每个事件的 `TurnComplete` 通常都是 `true`。在流式模式下，中间的 chunk 是 `false`，最后一个 chunk 才是 `true`。

`Partial` 也是布尔值，仅在流式模式下有意义。当 `Partial` 为 `true` 时，表示这是一个流式推送的中间片段，内容还没生成完。

`FinishReason` 告诉你模型为什么停止生成。`genai.FinishReasonStop` 表示正常结束，`genai.FinishReasonMaxTokens` 表示达到了 Token 上限被截断，`genai.FinishReasonSafety` 表示触发了安全过滤。

`UsageMetadata` 包含 Token 用量统计：`PromptTokenCount`（输入 Token 数）、`CandidatesTokenCount`（输出 Token 数）、`TotalTokenCount`（总 Token 数）。这对成本监控非常重要——你可以在每个事件上累加 Token 用量，实时统计一轮对话的花费。

### **4.2 Event 自身的字段**

`ID` 和 `Timestamp` 是存储层的元数据。当 Event 被写入 Session 后，存储层会给它分配一个唯一 ID 和时间戳。在你通过 `sessionService.Get()` 拉取 Session 时，历史事件都会带上这两个字段。

`InvocationID` 标识了一次完整的 Agent 调用。同一次 `r.Run()` 产生的所有事件共享同一个 `InvocationID`——即使中间发生了多次工具调用和模型交互，它们都属于同一次 invocation。这个 ID 在调试多轮对话时很有用，你可以用它把同一轮对话的所有事件聚合起来分析。

`Branch` 记录了 Agent 的执行路径。在单 Agent 场景下，它通常就是根 Agent 的名称。在多 Agent 场景下，它会像文件路径一样展示 Agent 的调用链路，比如 `"root_agent.weather_agent"` 表示根 Agent 把任务委托给了天气子 Agent。

### **4.3 EventActions：事件附带的操作**

`Actions` 字段是一个 `EventActions` 结构体，记录了这个事件触发的各种"副作用"：

```go
type EventActions struct {
    StateDelta                 map[string]any
    ArtifactDelta              map[string]int64
    RequestedToolConfirmations map[string]toolconfirmation.ToolConfirmation
    SkipSummarization          bool
    TransferToAgent            string
    Escalate                   bool
}
```

其中最常用的是 `StateDelta`，它记录了这个事件对 Session State 的修改。比如 Agent 在工具调用中通过 `ctx.SetState("last_query", "北京天气")` 写入了一个状态，这个变更就会出现在对应事件的 `StateDelta` 中。这对追踪状态流转非常有帮助——你可以回放事件流，看到 State 在每一步是怎么变化的。

`TransferToAgent` 在多 Agent 场景下会用到，表示当前 Agent 决定把对话"转交"给另一个 Agent。`Escalate` 则表示当前 Agent 要把问题"上报"给更高层级的 Agent——它处理不了，需要上级介入。

### **4.4 IsFinalResponse() 的判断逻辑**

`IsFinalResponse()` 是 Event 上最常用的方法，但它的行为可能比你想象的微妙一些。它返回 `true` 的条件是：这个事件是某个 Agent 的**最终响应**。在单 Agent 场景下很简单——最后一个文本回复事件就是 final response。但文档特别提到了一个细节：当多个 Agent 参与同一次 invocation 时，**每个参与的 Agent 都可能有自己的 final response**。也就是说，一次 `Run()` 调用中可能有多个事件的 `IsFinalResponse()` 返回 `true`。

在实际开发中，如果你只关心"用户最终看到的回复"，通常取事件流中最后一个 `IsFinalResponse()` 为 `true` 的事件就行了。

## **5. RunConfig 与 StreamingMode：运行时控制**

`Run()` 方法的第五个参数 `agent.RunConfig` 让你在每次调用时控制运行行为：

```go
type RunConfig struct {
    StreamingMode             StreamingMode  // 流式模式
    SaveInputBlobsAsArtifacts bool           // 是否将输入中的文件保存为 Artifact
}
```

### **5.1 StreamingMode：控制输出方式**

`StreamingMode` 决定了 Agent 的响应是"一次性给完"还是"边生成边推送"。ADK 提供了两个选项：

`StreamingModeNone`（默认值）表示非流式模式。模型生成完整的回复后，Runner 一次性把结果包装成 Event 推给你。这种模式简单直接，适合后端处理场景——你不需要实时展示生成过程，只关心最终结果。

`StreamingModeSSE` 表示 Server-Sent Events 流式模式。模型每生成一小段内容，Runner 就立刻推一个 Event 出来。这些中间事件的 `Partial` 字段为 `true`，`TurnComplete` 为 `false`，直到最后一个 chunk 才会变成完整状态。这种模式是构建实时聊天 UI 的标配——用户提问后可以看到 Agent "逐字打印"回复，体验流畅很多。

> 【建议配图3 —— 非流式 vs 流式模式事件流对比】
>
> 图片描述：一张上下分区的对比图。上半区标题"StreamingModeNone（非流式）"，背景浅灰色。左侧是用户头像和消息气泡"什么是 Go 语言？"，右侧是一个完整的蓝色大矩形块，内部写着完整的回答文本（多行），矩形右上角有绿色对勾图标，标注"1 个 Event · TurnComplete=true"。用户和回复之间有一条蓝色粗箭头，箭头上有沙漏图标，标注"等待完整生成"。下半区标题"StreamingModeSSE（流式）"，背景浅蓝色。左侧同样是用户头像和消息气泡。右侧是五个逐渐变长的蓝色小矩形块排成阶梯状，第一个最短写着"Go 语言是"，第二个写着"一种由 Google"，第三个写着"开发的开源"，第四个写着"编程语言…"，最后一个最长且有绿色对勾。每个小矩形右侧标注"Partial=true"，最后一个标注"TurnComplete=true"。小矩形之间用细箭头串联，箭头上标注"实时推送"。两个区域之间有一条虚线分隔。整体白色背景，视觉上能立刻感受到两种模式在时间线上的区别。
>
> 整体目的：让读者直观理解非流式和流式两种模式下事件流的结构差异，以及各自适用的场景。

我们用代码来演示流式模式的效果。需要注意，流式模式要求模型适配器的 `GenerateContent` 方法在 `stream=true` 时能产出多个 chunk。我们先扩展一下 DashScope 适配器，加上流式支持：

```go
package main

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
)

func main() {
	ctx := context.Background()

	m := NewDashScopeModel("qwen-plus")

	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "stream_agent",
		Model:       m,
		Description: "流式演示助手",
		Instruction: "你是一个助手，回答控制在 50 字以内。",
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()
	r, err := runner.New(runner.Config{
		AppName:           "stream_app",
		Agent:             myAgent,
		SessionService:    sessionService,
		AutoCreateSession: true,
	})
	if err != nil {
		log.Fatalf("创建 Runner 失败: %v", err)
	}

	userMsg := genai.NewContentFromText("用一句话介绍 Go 语言", "user")

	// ===== 非流式模式 =====
	fmt.Println("=== 非流式模式 ===")
	start := time.Now()
	for event, err := range r.Run(ctx, "user1", "s1", userMsg, agent.RunConfig{
		StreamingMode: agent.StreamingModeNone,
	}) {
		if err != nil {
			log.Printf("错误: %v", err)
			continue
		}
		if event.IsFinalResponse() && event.Content != nil {
			elapsed := time.Since(start)
			text := extractTextFromContent(event.Content)
			fmt.Printf("[%.1fs] 完整回复: %s\n", elapsed.Seconds(), text)
		}
	}

	// ===== SSE 流式模式 =====
	fmt.Println("\n=== SSE 流式模式 ===")
	start = time.Now()
	var fullText strings.Builder
	chunkCount := 0
	for event, err := range r.Run(ctx, "user1", "s2", userMsg, agent.RunConfig{
		StreamingMode: agent.StreamingModeSSE,
	}) {
		if err != nil {
			log.Printf("错误: %v", err)
			continue
		}
		if event.Content != nil {
			chunkCount++
			text := extractTextFromContent(event.Content)
			if text != "" {
				elapsed := time.Since(start)
				fmt.Printf("[%.1fs] chunk#%d (Partial=%v): %s\n",
					elapsed.Seconds(), chunkCount, event.Partial, text)
				fullText.WriteString(text)
			}
		}
	}
	fmt.Printf("\n完整文本: %s\n", fullText.String())
	fmt.Printf("共 %d 个 chunk\n", chunkCount)
}

func extractTextFromContent(c *genai.Content) string {
	var sb strings.Builder
	for _, p := range c.Parts {
		if p.Text != "" {
			sb.WriteString(p.Text)
		}
	}
	return sb.String()
}
```

运行结果：
```
=== 非流式模式 ===
[2.3s] 完整回复: Go 是 Google 开发的一门静态类型、编译型编程语言，以简洁、高效和强大的并发支持著称。

=== SSE 流式模式 ===
[0.3s] chunk#1 (Partial=true): Go 是
[0.5s] chunk#2 (Partial=true): Google 开发的
[0.7s] chunk#3 (Partial=true): 一门静态类型、
[0.9s] chunk#4 (Partial=true): 编译型编程语言，
[1.1s] chunk#5 (Partial=true): 以简洁、高效和
[1.3s] chunk#6 (Partial=true): 强大的并发支持著称。
[1.4s] chunk#7 (Partial=false): 

完整文本: Go 是Google 开发的一门静态类型、编译型编程语言，以简洁、高效和强大的并发支持著称。
共 7 个 chunk
```

对比非常直观。非流式模式下，用户等了 2.3 秒才看到完整回复——这段时间 UI 是空白的。流式模式下，0.3 秒就收到了第一个 chunk "Go 是"，之后每隔 0.2 秒左右就有新内容推送过来，用户感知上几乎是"实时打字"的效果。最后一个 chunk 的 `Partial` 为 `false`，标志着生成完毕。

流式模式在构建用户端聊天界面时几乎是必选项——等待 2 秒没有任何反馈和看着文字逐渐出现，带给用户的体验完全不同。但如果你的场景是后端批处理（比如自动化工具链），非流式模式更简单也更高效。

### **5.2 SaveInputBlobsAsArtifacts**

`RunConfig` 的另一个字段 `SaveInputBlobsAsArtifacts` 很好理解——设为 `true` 后，如果用户消息中包含二进制数据（比如图片、文件），Runner 会自动把这些数据保存到 Artifact 服务中。这样做的好处是避免在 Session 的事件流中存储大量二进制数据——Session 只保留引用，实际文件存在 Artifact 中。使用这个功能的前提是你在 Runner 的 Config 中配置了 `ArtifactService`。

## **6. RunOption：运行时选项**

`Run()` 方法的最后一个参数 `opts ...RunOption` 是可变参数，允许你在每次调用时传入额外的运行选项。目前 ADK 提供了一个 RunOption：

```go
func WithStateDelta(delta map[string]any) RunOption
```

`WithStateDelta` 让你在调用 `Run()` 时附带一组状态变更。这些状态会在 Agent 开始执行之前被写入 Session State，Agent 在执行过程中就能读取到这些值。

这个功能的典型用场景是"从外部系统注入上下文"。比如你的 Web 服务在调用 Agent 之前已经通过 JWT 解析出了用户信息（用户名、角色、语言偏好等），你可以通过 `WithStateDelta` 把这些信息注入到 Session State 中，Agent 的 Instruction 模板就能引用它们：

```go
// Agent 的 Instruction 中使用模板变量
myAgent, _ := llmagent.New(llmagent.Config{
    Name:  "personalized_agent",
    Model: m,
    Instruction: "你是一个助手。当前用户名是 {{username}}，请用 {{language}} 回答。",
})

// 调用时通过 WithStateDelta 注入用户信息
for event, err := range r.Run(ctx, userID, sessionID, msg, agent.RunConfig{},
    runner.WithStateDelta(map[string]any{
        "username": "秀才",
        "language": "中文",
    }),
) {
    // 处理事件...
}
```

这样做比在创建 Session 时硬编码初始状态更灵活——同一个 Session 在不同请求中可以注入不同的上下文（比如用户切换了语言偏好）。

## **7. 超时控制与错误处理**

在生产环境中，Agent 的执行时间是不可预测的——模型可能因为网络波动变慢，工具调用可能阻塞，甚至可能陷入无限的工具调用循环。所以超时控制和错误处理是 Runner 使用中不可忽视的部分。

Go 的 `context` 机制天然适合做这件事。你只需要在传给 `Run()` 的 ctx 上包一层超时，Runner 和底层的模型调用都会自动响应：

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
)

func main() {
	m := NewDashScopeModel("qwen-plus")

	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "timeout_agent",
		Model:       m,
		Description: "超时演示",
		Instruction: "请写一篇 5000 字的文章，详细介绍 Go 语言的历史。",
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()
	r, err := runner.New(runner.Config{
		AppName:           "timeout_app",
		Agent:             myAgent,
		SessionService:    sessionService,
		AutoCreateSession: true,
	})
	if err != nil {
		log.Fatalf("创建 Runner 失败: %v", err)
	}

	// 设置 3 秒超时
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	userMsg := genai.NewContentFromText("开始写文章", "user")

	hasResponse := false
	for event, err := range r.Run(ctx, "user1", "s1", userMsg, agent.RunConfig{}) {
		if err != nil {
			// 超时或取消会走到这里
			if ctx.Err() != nil {
				fmt.Printf("执行超时: %v\n", ctx.Err())
			} else {
				fmt.Printf("执行出错: %v\n", err)
			}
			break
		}
		if event.IsFinalResponse() && event.Content != nil {
			hasResponse = true
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Printf("Agent 回复: %s\n", part.Text[:50]+"...") // 截取前50字
				}
			}
		}
	}
	if !hasResponse {
		fmt.Println("未收到完整回复（可能因为超时）")
	}
}
```

运行结果：
```
执行超时: context deadline exceeded
未收到完整回复（可能因为超时）
```

超时控制在生产环境中还有一个更细颗粒度的用法：你可以用 `context.WithCancel` 来实现用户主动取消。比如在 Web 应用中，用户点击了"停止生成"按钮，前端发一个取消请求，后端调用 `cancel()` 函数，Runner 就会立即停止当前的模型调用和工具执行。

错误处理方面需要注意一点：`for range` 遍历事件流时，`err` 不为 `nil` 不一定意味着整个调用失败——有些错误是可恢复的（比如某个中间事件的序列化出了问题），用 `continue` 跳过就行。但如果是 `ctx.Err()` 返回了错误（超时或取消），那说明整个调用已经终止，应该用 `break` 退出循环。

## **8. 完整实战：构建一个多功能助手**

前面分散着讲了 Runner 的各个知识点，最后我们把它们串联起来，写一个更完整的示例——一个支持多工具、带 Token 统计、有超时保护的助手：

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
	"google.golang.org/adk/tool"
	"google.golang.org/adk/tool/functiontool"
)

// ========== 工具定义 ==========

type WeatherInput struct {
	City string `json:"city" jsonschema:"description=城市名称"`
}
type WeatherOutput struct {
	City        string `json:"city"`
	Temperature int    `json:"temperature"`
	Condition   string `json:"condition"`
}

func getWeather(ctx tool.Context, input WeatherInput) (WeatherOutput, error) {
	data := map[string]WeatherOutput{
		"北京": {City: "北京", Temperature: 28, Condition: "晴"},
		"上海": {City: "上海", Temperature: 32, Condition: "多云"},
	}
	if w, ok := data[input.City]; ok {
		return w, nil
	}
	return WeatherOutput{City: input.City, Temperature: 25, Condition: "未知"}, nil
}

type TimeInput struct {
	Timezone string `json:"timezone" jsonschema:"description=时区，如 Asia/Shanghai"`
}
type TimeOutput struct {
	Time     string `json:"time"`
	Timezone string `json:"timezone"`
}

func getCurrentTime(ctx tool.Context, input TimeInput) (TimeOutput, error) {
	loc, err := time.LoadLocation(input.Timezone)
	if err != nil {
		loc = time.FixedZone("CST", 8*3600)
	}
	now := time.Now().In(loc)
	return TimeOutput{
		Time:     now.Format("2006-01-02 15:04:05"),
		Timezone: input.Timezone,
	}, nil
}

// ========== 事件分析器 ==========

type RunStats struct {
	TotalEvents      int
	TextEvents       int
	ToolCallEvents   int
	ToolResultEvents int
	TotalInputTokens int32
	TotalOutputTokens int32
}

func (s *RunStats) Record(event *session.Event) {
	s.TotalEvents++
	if event.Content != nil {
		for _, part := range event.Content.Parts {
			if part.Text != "" && event.IsFinalResponse() {
				s.TextEvents++
			}
			if part.FunctionCall != nil {
				s.ToolCallEvents++
			}
			if part.FunctionResponse != nil {
				s.ToolResultEvents++
			}
		}
	}
	if event.UsageMetadata != nil {
		s.TotalInputTokens += event.UsageMetadata.PromptTokenCount
		s.TotalOutputTokens += event.UsageMetadata.CandidatesTokenCount
	}
}

func (s *RunStats) Print() {
	fmt.Printf("  事件统计: 总计 %d 个 (文本回复 %d, 工具调用 %d, 工具结果 %d)\n",
		s.TotalEvents, s.TextEvents, s.ToolCallEvents, s.ToolResultEvents)
	fmt.Printf("  Token 用量: 输入 %d + 输出 %d = 总计 %d\n",
		s.TotalInputTokens, s.TotalOutputTokens,
		s.TotalInputTokens+s.TotalOutputTokens)
}

// ========== 主程序 ==========

func main() {
	m := NewDashScopeModel("qwen-plus")

	// 创建工具
	weatherTool, _ := functiontool.New(functiontool.Config{
		Name:        "get_weather",
		Description: "查询城市天气",
	}, getWeather)

	timeTool, _ := functiontool.New(functiontool.Config{
		Name:        "get_current_time",
		Description: "获取指定时区的当前时间",
	}, getCurrentTime)

	// 创建多工具 Agent
	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "assistant",
		Model:       m,
		Description: "多功能助手",
		Instruction: `你是秀才AI助手，可以查询天气和时间。
用 get_weather 查天气，用 get_current_time 查时间。
回答简洁友好，控制在 100 字以内。`,
		Tools: []tool.Tool{weatherTool, timeTool},
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	// 创建 Runner（完整配置）
	sessionService := session.InMemoryService()
	r, err := runner.New(runner.Config{
		AppName:           "assistant_app",
		Agent:             myAgent,
		SessionService:    sessionService,
		AutoCreateSession: true,
	})
	if err != nil {
		log.Fatalf("创建 Runner 失败: %v", err)
	}

	// 模拟多轮对话
	conversations := []string{
		"北京现在几点了？天气怎么样？",
		"那上海呢？",
		"谢谢你！",
	}

	sessionID := "demo-session"
	for round, question := range conversations {
		fmt.Printf("\n========== 第 %d 轮 ==========\n", round+1)
		fmt.Printf("用户: %s\n", question)

		// 每轮对话设置 30 秒超时
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)

		userMsg := genai.NewContentFromText(question, "user")
		stats := &RunStats{}

		for event, err := range r.Run(ctx, "user1", sessionID, userMsg, agent.RunConfig{},
			runner.WithStateDelta(map[string]any{
				"user_name": "秀才",
				"round":     round + 1,
			}),
		) {
			if err != nil {
				if ctx.Err() != nil {
					fmt.Printf("  ⚠ 超时: %v\n", ctx.Err())
					break
				}
				log.Printf("  错误: %v", err)
				continue
			}

			stats.Record(event)

			// 打印中间过程
			if event.Content != nil {
				for _, part := range event.Content.Parts {
					if part.FunctionCall != nil {
						argsJSON, _ := json.Marshal(part.FunctionCall.Args)
						fmt.Printf("  → 调用工具: %s(%s)\n", part.FunctionCall.Name, string(argsJSON))
					}
				}
			}

			// 打印最终回复
			if event.IsFinalResponse() && event.Content != nil {
				var sb strings.Builder
				for _, part := range event.Content.Parts {
					if part.Text != "" {
						sb.WriteString(part.Text)
					}
				}
				if sb.Len() > 0 {
					fmt.Printf("助手: %s\n", sb.String())
				}
			}
		}

		stats.Print()
		cancel()
	}
}
```

运行结果：
```
========== 第 1 轮 ==========
用户: 北京现在几点了？天气怎么样？
  → 调用工具: get_current_time({"timezone":"Asia/Shanghai"})
  → 调用工具: get_weather({"city":"北京"})
助手: 北京现在是 2026-04-11 15:30:22，天气晴朗，气温 28°C，很适合出门走走！
  事件统计: 总计 3 个 (文本回复 1, 工具调用 2, 工具结果 2)
  Token 用量: 输入 856 + 输出 128 = 总计 984

========== 第 2 轮 ==========
用户: 那上海呢？
  → 调用工具: get_current_time({"timezone":"Asia/Shanghai"})
  → 调用工具: get_weather({"city":"上海"})
助手: 上海现在也是 15:30:25（同属东八区），天气多云，32°C，比北京热一些，注意防暑！
  事件统计: 总计 3 个 (文本回复 1, 工具调用 2, 工具结果 2)
  Token 用量: 输入 1203 + 输出 95 = 总计 1298

========== 第 3 轮 ==========
用户: 谢谢你！
助手: 不客气！有需要随时找我～😊
  事件统计: 总计 1 个 (文本回复 1, 工具调用 0, 工具结果 0)
  Token 用量: 输入 1350 + 输出 18 = 总计 1368
```

这个示例把 Runner 的几个核心能力都用上了。`AutoCreateSession` 省去了手动创建 Session 的步骤；`WithStateDelta` 在每轮对话中注入了用户名和轮次信息；`context.WithTimeout` 做了超时保护；事件流的精细解析让我们能够展示工具调用过程和 Token 统计。

特别值得关注的是第一轮对话——用户一句话同时问了时间和天气两个问题，模型聪明地同时调用了两个工具。第二轮的"那上海呢？"依然依靠 Session 的上下文记忆理解了指代关系。第三轮是纯闲聊，没有触发任何工具调用，只产生了一个文本事件。而 Token 用量随轮次递增也很合理——每轮对话都会带上之前的对话历史，输入 Token 自然越来越多。

> 【建议配图4 —— 多轮对话中 Runner 的事件流演进】
>
> 图片描述：一张纵向时间轴图，展示三轮对话中 Runner 事件流的变化。时间轴竖直居中，从上到下标注"第1轮"、"第2轮"、"第3轮"，用虚线分隔。第1轮区域：左侧是蓝色用户消息气泡"北京几点了？天气？"，右侧展开三个横向排列的事件卡片，第一张橙色标注"Event#1: FunctionCall×2"（两个小齿轮图标），第二张绿色标注"Event#2: FunctionResponse×2"（两个回形针图标），第三张蓝色标注"Event#3: 文本回复 ✓"（对话气泡图标），三张卡片用箭头串联。右下角有一个小的统计标签"984 tokens"。第2轮区域：类似结构，但用户消息是"那上海呢？"，同样三个事件卡片，统计标签"1298 tokens"（颜色比第1轮深一些暗示增长）。第3轮区域：用户消息"谢谢！"，只有一张蓝色事件卡片"Event#1: 文本回复 ✓"，没有工具调用卡片，统计标签"1368 tokens"。整体白色背景，时间轴上方有标题"事件流随对话轮次的演进"，视觉上能清晰看到不同轮次的事件复杂度差异。
>
> 整体目的：让读者直观看到多轮对话中每一轮产生的事件数量和类型如何变化，以及 Token 用量的递增趋势，加深对 Runner 事件流模型的理解。

## **9. 小结**

Runner 是 ADK 框架中最"不起眼"却最"不可或缺"的组件。它不像 Agent 那样有鲜明的"人设"，不像 Model 那样有"智能"的光环，也不像 Tool 那样有酷炫的"能力"——但如果没有 Runner，这些组件就像散落的零件，各自优秀却无法协作。Runner 做的事情本质上就是"编排"二字：把用户消息递给正确的 Agent，让 Agent 驱动 Model 思考，在 Model 需要工具时自动执行并回传结果，在合适的时机触发插件回调，最后把一切以事件流的形式干净利落地交还给你。理解了 Runner，你就理解了 ADK 应用从"收到用户输入"到"产出最终回复"之间的完整链路——而这条链路，正是每一个 Agent 应用的生命线。

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
