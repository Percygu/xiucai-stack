---
title: 14. Session会话管理
description: "Go语言 AI Agent 入门教程：深入解析 Google ADK 框架 Session 会话管理机制，涵盖 session.Service 接口设计、InMemoryService 内存存储、Session State 三级作用域（session/user/app）、多轮对话上下文维护、Session 生命周期管理与持久化存储方案，附完整可运行 Go 代码示例。"
category:
  - Go Agent
tag:
  - Go Agent
  - 大模型
  - ADK
  - Google ADK
  - AI Agent教程
  - Go语言
  - Session管理
---

# **Session会话管理**

前面几篇文章，我们把模型层和 Agent 配置都讲透了。模型负责"思考"，Config 负责"身份和行为"，但还有一个核心问题没有解决——Agent 怎么"记住"对话内容？

你跟 Agent 说"帮我查一下北京天气"，它回答了。你接着问"那上海呢？"——这个"那"指的是什么？是天气，不是股票，也不是餐厅推荐。Agent 之所以能理解这种上下文指代，靠的就是 Session。Session 就像 Agent 的"工作台"，上面摆着当前对话的所有信息：你说过什么、它回答过什么、中间调用了哪些工具、产生了哪些状态数据。每次模型被调用时，Runner 都会从 Session 中提取对话历史，打包进 `LLMRequest` 的 `Contents` 字段发给模型。没有 Session，Agent 就是一条金鱼——每一轮对话都是全新的开始。

这篇文章我们就来深入 ADK 的 Session 机制。从 `session.Service` 接口开始，到 Session 的创建、读取、更新、删除的完整生命周期，再到 State 的三级作用域设计，最后用代码实战把这些知识串起来——让你的 Agent 不仅能对话，还能真正"记住"该记住的东西。

## **1. Session 在 ADK 中的位置**

在前面 ADK 概述那篇文章里，我们提到过 ADK 的六大核心组件：Agent、Model、Runner、Session、Tool、Plugin。Session 在其中扮演的角色有点像数据库之于 Web 应用——它本身不做业务逻辑，但所有业务逻辑都离不开它。

当 Runner 执行一次对话时，大致会经历这样一个流程：Runner 先通过 `session.Service` 拿到当前 Session，从中提取对话历史和状态信息，把这些信息连同用户的新消息一起打包成 `LLMRequest`，交给模型生成回复。模型回复后，Runner 再把新的消息对（用户消息 + 模型回复）写回 Session，更新状态。整个过程中，Session 就是那个"数据中转站"——承上启下，贯穿始终。

> 【建议配图1 —— Session 在 ADK 运行流程中的角色】
>
> 图片描述：一张从左到右的水平流程图，展示一次完整的对话执行过程。左侧是一个蓝色用户头像图标，标注"用户消息"，一条蓝色粗箭头指向中间偏左的绿色圆角矩形"Runner"（指挥棒图标）。Runner 下方有一条橙色双向箭头连接到一个大的橙色圆柱体"Session"（数据库圆柱图标），箭头上方标注"① 读取历史"，下方标注"⑤ 写入新消息"。Runner 右侧一条紫色粗箭头指向右侧的紫色圆角矩形"Model"（大脑图标），箭头上方标注"② 打包 LLMRequest"。Model 通过一条紫色虚线箭头回指 Runner，标注"③ 返回 LLMResponse"。Runner 上方有一条灰色细箭头指向一个灰色六边形"Tool"（扳手图标），标注"④ 工具调用（可选）"。Session 圆柱体内部分三层：顶层浅蓝色标注"对话历史 Events"，中层浅绿色标注"状态数据 State"，底层浅灰色标注"元信息 AppName/UserID"。整个图的视觉重心在 Session 圆柱体上，它用最大最醒目的方式呈现，强调 Session 是数据中心。白色背景，步骤编号用圆形徽标标注。
>
> 整体目的：让读者直观理解 Session 在 ADK 运行流程中的位置——它是 Runner 和 Model 之间的数据桥梁，负责存储和提供对话上下文。

理解了 Session 的位置，再来看一个关键概念：Session 的三元组标识。ADK 中的每一个 Session 都由三个维度来唯一定位——`AppName`（应用名称）、`UserID`（用户 ID）、`SessionID`（会话 ID）。这个设计很好理解：同一个应用下有多个用户，同一个用户可以同时开多个会话窗口（想想 ChatGPT 左侧的那些历史对话列表）。三元组保证了不同应用、不同用户、不同会话之间的数据完全隔离。

## **2. session.Service 接口：Session 的管家**

ADK 对 Session 的管理采用了 Go 语言中经典的"接口 + 实现"模式。框架定义了一个 `session.Service` 接口（这里我们用逻辑层面来理解，实际是通过 `Create`、`Get`、`List`、`Delete` 四个方法来操作），然后提供了一个开箱即用的内存实现 `session.InMemoryService()`。如果你的业务需要把 Session 持久化到数据库，只要实现同样的操作方法就行——框架不关心底层存储是内存、Redis 还是 MySQL，它只通过这组标准方法来操作 Session。

这四个核心操作覆盖了 Session 的完整生命周期：

**Create** 用于创建新 Session。你需要指定 `AppName` 和 `UserID`，`SessionID` 可以自己指定也可以让框架自动生成，还可以传入初始状态。创建完成后，你会拿到一个 `Session` 对象，后续所有的对话和状态操作都围绕这个对象展开。

**Get** 用于检索已有的 Session。传入三元组标识就能拿回来。有一个很实用的参数 `NumRecentEvents`，可以限制返回的事件数量——当一个 Session 里积累了上百轮对话时，你可能只关心最近的 10 条，这个参数能帮你节省内存和带宽。

**List** 用于列出某个用户在某个应用下的所有 Session。在构建类似 ChatGPT 那种左侧对话列表的 UI 时，这个方法就是数据来源。

**Delete** 用于删除 Session。对话结束后的资源清理，或者用户主动删除历史记录，都会用到它。

我们先用一段代码，把这四个操作的基本用法跑一遍：

```go
package main

import (
	"context"
	"fmt"
	"log"

	"google.golang.org/adk/session"
)

func main() {
	ctx := context.Background()

	// 创建内存 Session 服务
	service := session.InMemoryService()

	// ===== 1. Create：创建 Session =====
	createResp, err := service.Create(ctx, &session.CreateRequest{
		AppName:   "my_agent_app",
		UserID:    "user_001",
		SessionID: "chat_001", // 可选，不填则自动生成
		State: map[string]any{
			"user_name": "小明",
			"language":  "zh-CN",
		},
	})
	if err != nil {
		log.Fatalf("创建 Session 失败: %v", err)
	}
	fmt.Printf("Session 已创建，ID: %s\n", createResp.Session.ID())

	// ===== 2. Get：检索 Session =====
	getResp, err := service.Get(ctx, &session.GetRequest{
		AppName:         "my_agent_app",
		UserID:          "user_001",
		SessionID:       createResp.Session.ID(),
		NumRecentEvents: 10, // 只取最近 10 条事件
	})
	if err != nil {
		log.Fatalf("获取 Session 失败: %v", err)
	}
	// 从 Session 中读取状态
	state := getResp.Session.State()
	userName, _ := state.Get("user_name")
	fmt.Printf("当前用户: %v\n", userName)

	// ===== 3. 再创建一个 Session，用于演示 List =====
	service.Create(ctx, &session.CreateRequest{
		AppName:   "my_agent_app",
		UserID:    "user_001",
		SessionID: "chat_002",
		State:     map[string]any{"topic": "天气查询"},
	})

	// ===== 4. List：列出用户的所有 Session =====
	listResp, err := service.List(ctx, &session.ListRequest{
		AppName: "my_agent_app",
		UserID:  "user_001",
	})
	if err != nil {
		log.Fatalf("列出 Session 失败: %v", err)
	}
	fmt.Printf("用户 user_001 共有 %d 个 Session:\n", len(listResp.Sessions))
	for _, sess := range listResp.Sessions {
		fmt.Printf("  - Session ID: %s\n", sess.ID())
	}

	// ===== 5. Delete：删除 Session =====
	err = service.Delete(ctx, &session.DeleteRequest{
		AppName:   "my_agent_app",
		UserID:    "user_001",
		SessionID: "chat_002",
	})
	if err != nil {
		log.Fatalf("删除 Session 失败: %v", err)
	}

	// 再次 List，确认删除成功
	listResp2, _ := service.List(ctx, &session.ListRequest{
		AppName: "my_agent_app",
		UserID:  "user_001",
	})
	fmt.Printf("删除后剩余 %d 个 Session\n", len(listResp2.Sessions))
}
```

运行结果：

```
Session 已创建，ID: chat_001
当前用户: 小明
用户 user_001 共有 2 个 Session:
  - Session ID: chat_001
  - Session ID: chat_002
删除后剩余 1 个 Session
```

代码很直白——四个操作就是四组"构造请求 → 调用方法 → 处理响应"的固定模式。需要注意的是，`InMemoryService()` 创建的是一个纯内存实现，进程重启后数据就没了。这在开发调试阶段完全够用，但生产环境下你肯定需要持久化方案——这个我们后面会专门讨论。

> 【建议配图2 —— Session CRUD 操作与生命周期】
>
> 图片描述：一张横向的时间轴式流程图，展示 Session 从"出生"到"销毁"的完整生命周期。时间轴是一条从左到右的灰色水平线，线上有四个关键节点，每个节点是一个彩色圆形徽标。第一个节点是绿色圆圈，内部有"+"图标，下方标注"Create"和一行小字"创建 Session，设置初始 State"。第二个节点是蓝色圆圈，内部有放大镜图标，下方标注"Get"和小字"检索 Session，加载对话历史"。第三个节点是紫色圆圈，内部有列表图标，下方标注"List"和小字"查询用户所有 Session"。第四个节点是红色圆圈，内部有垃圾桶图标，下方标注"Delete"和小字"删除 Session，清理资源"。在 Get 和 List 之间的时间轴上方，用一个大的浅蓝色半透明背景区域罩住，标注"Session 活跃期：对话进行中"，区域内有多个小的对话气泡图标（用户蓝色气泡和 Agent 绿色气泡交替），表示多轮对话在此期间发生。时间轴下方在 Create 节点旁边有一个小的橙色标签"State 初始化"，在活跃期区域下方有一个橙色标签"State 持续更新"。整体白色背景，时间轴从左到右有轻微的渐变色，暗示时间流逝。
>
> 整体目的：让读者一目了然地理解 Session 的完整生命周期——创建、使用（读取+列出）、销毁，以及 State 在整个过程中的变化。

## **3. Session State：三级作用域设计**

Session 不仅存储对话历史，还提供了一个 Key-Value 形式的状态存储——`State`。你可以把它理解为 Session 随身携带的一个小本子，Agent 在对话过程中随时可以往里面写东西、读东西。比如记录用户的偏好设置、保存中间计算结果、传递工具调用的输出等等。

但 ADK 的 State 设计比简单的 Key-Value 存储要巧妙得多。它通过 Key 的前缀来区分三个不同的作用域：

**Session 级别**（无前缀）：这是最常见的作用域。不带任何前缀的 Key（比如 `"user_name"`、`"last_query"`）只属于当前 Session。用户开了一个新的对话窗口，这些数据就看不到了。适合存储当前对话的临时信息，比如用户这轮对话在查什么、对话的主题是什么。

**User 级别**（`user:` 前缀）：带 `user:` 前缀的 Key（比如 `"user:prefs"`、`"user:timezone"`）在同一个用户的所有 Session 之间共享。不管用户开了多少个对话窗口，这些数据都能访问到。适合存储用户的偏好设置、个人信息等跨会话数据。

**App 级别**（`app:` 前缀）：带 `app:` 前缀的 Key（比如 `"app:version"`、`"app:announcement"`）在整个应用的所有用户、所有 Session 之间共享。适合存储全局配置、公告信息、应用级别的统计数据等。

这个设计非常优雅——用一个统一的 `State` 接口，通过前缀约定实现了三级数据隔离，既简单又实用。你不需要维护三套独立的存储系统，所有状态操作都用同样的 `state.Get(key)` 和 `state.Set(key, value)` 方法，只是 Key 的命名不同。

> 【建议配图3 —— Session State 三级作用域示意图】
>
> 图片描述：一张自上而下的三层嵌套结构图，用同心的圆角矩形表示三级作用域的包含关系。最外层是一个大的浅红色背景的圆角矩形，左上角有一个地球图标，标注"App 级别（app: 前缀）"，右侧小字"所有用户共享"，内部底部区域有两个示例标签 `app:version = "2.0"` 和 `app:announcement = "系统维护通知"`。中间层是一个中等大小的浅绿色背景的圆角矩形，嵌套在外层内部偏上的位置，左上角有一个用户头像图标，标注"User 级别（user: 前缀）"，右侧小字"同一用户的所有 Session 共享"，底部有示例标签 `user:timezone = "Asia/Shanghai"` 和 `user:prefs = "dark_mode"`。最内层有两个并排的小的浅蓝色圆角矩形，嵌套在中间层内部，各自左上角有一个对话气泡图标，分别标注"Session A（无前缀）"和"Session B（无前缀）"，各自内部有不同的示例标签：Session A 里是 `topic = "天气查询"` 和 `last_query = "北京天气"`，Session B 里是 `topic = "代码生成"` 和 `last_query = "写一个排序函数"`。两个 Session 之间用一条红色虚线分隔，虚线上方有一个锁图标和小字"数据隔离"。从外层到内层，颜色逐渐加深，表示作用域逐渐收窄。白色背景。
>
> 整体目的：让读者直观理解三级作用域的包含关系和数据隔离机制——App 包含 User，User 包含多个 Session，各级数据互不干扰。

来用代码验证一下三级作用域的行为：

```go
package main

import (
	"context"
	"fmt"
	"log"

	"google.golang.org/adk/session"
)

func main() {
	ctx := context.Background()
	service := session.InMemoryService()

	// 创建 Session A，设置三级作用域的状态
	respA, err := service.Create(ctx, &session.CreateRequest{
		AppName:   "weather_app",
		UserID:    "user_001",
		SessionID: "session_a",
		State: map[string]any{
			"topic":          "天气查询",         // Session 级别（无前缀）
			"user:timezone":  "Asia/Shanghai",   // User 级别
			"app:model_name": "qwen-plus",       // App 级别
		},
	})
	if err != nil {
		log.Fatal(err)
	}

	// 创建 Session B（同一用户）
	respB, err := service.Create(ctx, &session.CreateRequest{
		AppName:   "weather_app",
		UserID:    "user_001",
		SessionID: "session_b",
		State: map[string]any{
			"topic": "代码生成", // Session B 有自己的 topic
		},
	})
	if err != nil {
		log.Fatal(err)
	}

	// 创建 Session C（不同用户）
	respC, err := service.Create(ctx, &session.CreateRequest{
		AppName:   "weather_app",
		UserID:    "user_002",
		SessionID: "session_c",
		State: map[string]any{
			"topic": "翻译助手",
		},
	})
	if err != nil {
		log.Fatal(err)
	}

	// 读取各 Session 的状态
	stateA := respA.Session.State()
	stateB := respB.Session.State()
	stateC := respC.Session.State()

	// Session 级别：各 Session 独立
	topicA, _ := stateA.Get("topic")
	topicB, _ := stateB.Get("topic")
	topicC, _ := stateC.Get("topic")
	fmt.Println("===== Session 级别（各自独立） =====")
	fmt.Printf("Session A topic: %v\n", topicA)
	fmt.Printf("Session B topic: %v\n", topicB)
	fmt.Printf("Session C topic: %v\n", topicC)

	// User 级别：同一用户的 Session 共享
	tzA, _ := stateA.Get("user:timezone")
	tzB, _ := stateB.Get("user:timezone")
	tzC, _ := stateC.Get("user:timezone")
	fmt.Println("\n===== User 级别（同用户共享） =====")
	fmt.Printf("Session A user:timezone: %v\n", tzA)
	fmt.Printf("Session B user:timezone: %v\n", tzB)
	fmt.Printf("Session C user:timezone: %v（不同用户，看不到）\n", tzC)

	// App 级别：所有用户共享
	modelA, _ := stateA.Get("app:model_name")
	modelB, _ := stateB.Get("app:model_name")
	modelC, _ := stateC.Get("app:model_name")
	fmt.Println("\n===== App 级别（全局共享） =====")
	fmt.Printf("Session A app:model_name: %v\n", modelA)
	fmt.Printf("Session B app:model_name: %v\n", modelB)
	fmt.Printf("Session C app:model_name: %v\n", modelC)
}
```

运行结果：

```
===== Session 级别（各自独立） =====
Session A topic: 天气查询
Session B topic: 代码生成
Session C topic: 翻译助手

===== User 级别（同用户共享） =====
Session A user:timezone: Asia/Shanghai
Session B user:timezone: Asia/Shanghai
Session C user:timezone: <nil>（不同用户，看不到）

===== App 级别（全局共享） =====
Session A app:model_name: qwen-plus
Session B app:model_name: qwen-plus
Session C app:model_name: qwen-plus
```

结果清晰地展示了三级作用域的隔离规则：`topic` 是 Session 级别的，三个 Session 各有各的值；`user:timezone` 是 User 级别的，同一用户的 Session A 和 Session B 能共享，但不同用户的 Session C 看不到；`app:model_name` 是 App 级别的，所有 Session 都能看到。

在实际开发中，合理利用这三级作用域能解决很多状态管理的烦恼。比如你做一个客服系统，用 `app:business_hours` 存营业时间（所有用户看到一样的），用 `user:vip_level` 存用户的 VIP 等级（同一用户的所有对话共享），用 `order_id` 存当前对话正在处理的工单号（只在这一次对话中有效）。

## **4. Session 与 Agent 的协作：在对话中使用 State**

前面我们单独操作了 Session，但 Session 的真正威力要在跟 Agent 配合使用时才能体现出来。ADK 提供了一个非常方便的机制——Agent 的 `Instruction` 支持模板变量，而这些变量的值就来自 Session State。

还记得上一篇 Agent 配置详解中提到的 `{变量名}` 占位符吗？当你在 Instruction 中写 `{user_name}`，Runner 在运行时会自动去当前 Session 的 State 里查找 `user_name` 这个 Key，把对应的值填进去。这意味着你不需要在代码里硬编码用户信息，只要在创建 Session 时把用户信息写入 State，Agent 的指令就能动态地个性化。

来看一个完整的例子——一个能根据用户偏好调整回答风格的 Agent：

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

	// 创建 Agent，Instruction 中使用模板变量
	myAgent, err := llmagent.New(llmagent.Config{
		Name:  "personalized_assistant",
		Model: m,
		Description: "一个能根据用户偏好个性化回答的助手",
		Instruction: `你是用户 {user_name} 的私人助手。
用户的偏好语言是 {language}，请用该语言回答。
用户的专业领域是 {expertise}，回答时可以适当使用专业术语。
当前对话主题: {topic}`,
	})
	if err != nil {
		log.Fatal(err)
	}

	// 创建 Session 服务和 Runner
	sessionService := session.InMemoryService()
	r, err := runner.New(runner.Config{
		AppName:        "personalized_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})
	if err != nil {
		log.Fatal(err)
	}

	// 创建 Session，通过 State 注入用户信息
	createResp, err := sessionService.Create(ctx, &session.CreateRequest{
		AppName:   "personalized_app",
		UserID:    "user_001",
		SessionID: "chat_001",
		State: map[string]any{
			"user_name": "小明",
			"language":  "中文",
			"expertise": "后端开发",
			"topic":     "Go语言并发编程",
		},
	})
	if err != nil {
		log.Fatal(err)
	}

	// 发送消息
	userMsg := genai.NewContentFromText("goroutine 和线程有什么区别？", genai.RoleUser)
	for event, err := range r.Run(ctx, "user_001", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
		if err != nil {
			log.Printf("错误: %v", err)
			continue
		}
		if event != nil && event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Printf("Agent: %s\n", part.Text)
				}
			}
		}
	}
}
```

在这段代码中，`Instruction` 里的 `{user_name}`、`{language}`、`{expertise}`、`{topic}` 四个占位符，在 Runner 运行时会被自动替换为 Session State 中对应的值。最终发送给模型的系统指令变成了：

```
你是用户 小明 的私人助手。
用户的偏好语言是 中文，请用该语言回答。
用户的专业领域是 后端开发，回答时可以适当使用专业术语。
当前对话主题: Go语言并发编程
```

这种模式的好处是显而易见的：Agent 的行为逻辑（Instruction 模板）和用户数据（State）彻底分离。同一个 Agent 代码可以服务不同用户，只要 Session State 中的用户信息不同，Agent 的行为就会自动适配。这比在代码里写一堆 `if user == "小明" then ...` 的硬编码方式要优雅得多。

## **5. 在工具调用中读写 State**

除了通过 Instruction 模板变量来"读" State，Agent 还可以在工具调用的过程中"写" State。这个能力在实际业务中非常有用——工具执行完后，把结果或中间数据存到 State 里，后续的对话或其他工具就能直接使用，不需要重新计算。

ADK 的工具函数可以通过 `tool.Context` 参数来访问当前 Session 的 State。来看一个实际场景：一个天气查询 Agent，第一次查询后把城市和温度存到 State，后续提问时 Agent 可以直接引用这些信息。

```go
package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
	"google.golang.org/adk/tool"
)

// 天气查询工具：查完天气后把结果写入 State
func weatherTool(ctx context.Context, tCtx *tool.Context, args struct {
	City string `json:"city" description:"要查询天气的城市名称"`
}) (map[string]any, error) {
	// 模拟天气查询
	temp := 15 + rand.Intn(20)
	weather := map[string]any{
		"city":        args.City,
		"temperature": fmt.Sprintf("%d°C", temp),
		"condition":   "晴",
	}

	// 将查询结果写入 Session State，供后续对话使用
	tCtx.State.Set("last_city", args.City)
	tCtx.State.Set("last_temperature", fmt.Sprintf("%d°C", temp))
	tCtx.State.Set("query_count", getQueryCount(tCtx) + 1)

	return weather, nil
}

// 从 State 中读取查询计数
func getQueryCount(tCtx *tool.Context) int {
	count, ok := tCtx.State.Get("query_count")
	if !ok {
		return 0
	}
	// State 中的值是 any 类型，需要类型断言
	if c, ok := count.(int); ok {
		return c
	}
	return 0
}

func main() {
	ctx := context.Background()
	m := NewDashScopeModel("qwen-plus")

	weatherFunc := tool.NewFunction(
		"get_weather",
		"查询指定城市的天气信息",
		weatherTool,
	)

	myAgent, err := llmagent.New(llmagent.Config{
		Name:  "weather_agent",
		Model: m,
		Description: "天气查询助手",
		Instruction: `你是一个天气查询助手。用户问天气时，调用 get_weather 工具查询。
如果用户问"那XXX呢？"之类的后续问题，也调用工具查询新城市的天气。
上次查询的城市: {last_city}
上次查询的温度: {last_temperature}
本次会话已查询次数: {query_count}`,
		Tools: []tool.Tool{weatherFunc},
	})
	if err != nil {
		log.Fatal(err)
	}

	sessionService := session.InMemoryService()
	r, err := runner.New(runner.Config{
		AppName:        "weather_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})
	if err != nil {
		log.Fatal(err)
	}

	// 创建 Session，初始化状态
	createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName:   "weather_app",
		UserID:    "user_001",
		SessionID: "chat_001",
		State: map[string]any{
			"last_city":        "暂无",
			"last_temperature": "暂无",
			"query_count":      0,
		},
	})

	// 第一轮对话：查询北京天气
	fmt.Println("===== 第一轮：查询北京天气 =====")
	msg1 := genai.NewContentFromText("北京今天天气怎么样？", genai.RoleUser)
	for event, err := range r.Run(ctx, "user_001", createResp.Session.ID(), msg1, agent.RunConfig{}) {
		if err != nil {
			continue
		}
		if event != nil && event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Printf("Agent: %s\n", part.Text)
				}
			}
		}
	}

	// 第二轮对话：查询上海天气（注意 State 中的 last_city 已经被更新）
	fmt.Println("\n===== 第二轮：查询上海天气 =====")
	msg2 := genai.NewContentFromText("那上海呢？", genai.RoleUser)
	for event, err := range r.Run(ctx, "user_001", createResp.Session.ID(), msg2, agent.RunConfig{}) {
		if err != nil {
			continue
		}
		if event != nil && event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Printf("Agent: %s\n", part.Text)
				}
			}
		}
	}
}
```

这段代码里有几个值得注意的地方。首先，工具函数通过 `tCtx.State.Set()` 往 Session State 里写入数据，这些数据在工具执行完毕后立刻生效，后续的对话轮次中 Agent 就能通过 Instruction 模板变量读到更新后的值。其次，`query_count` 展示了一个简单的跨轮次计数器——每次查询天气都加一，Agent 的 Instruction 中就能感知到"这个用户已经查了多少次"。这种模式在实际业务中非常常见，比如记录用户的操作步骤、追踪工单处理进度、累积统计信息等。

> 【建议配图4 —— 工具调用中的 State 读写流程】
>
> 图片描述：一张垂直排列的序列图，展示两轮对话中 State 的变化过程。顶部有三个竖直的生命线，从左到右分别是：蓝色用户图标"User"、绿色机器人图标"Agent + Runner"、橙色扳手图标"weather_tool"。第一轮对话（用浅蓝色背景块标注"第一轮"）：用户发送蓝色箭头"北京今天天气？"到 Agent，Agent 发送绿色箭头"调用 get_weather(city=北京)"到 Tool，Tool 内部有一个小的黄色便签纸图标，上面写着"State.Set: last_city=北京, query_count=1"，然后 Tool 返回橙色虚线箭头"温度 25°C，晴"到 Agent，Agent 返回绿色虚线箭头"北京今天 25°C，晴"到用户。两轮之间有一条水平虚线分隔。第二轮对话（浅绿色背景块标注"第二轮"）：Agent 生命线旁有一个小标签显示"Instruction 注入: last_city=北京"，用户发送"那上海呢？"，Agent 调用"get_weather(city=上海)"，Tool 更新便签"State.Set: last_city=上海, query_count=2"，返回结果。右侧有一个竖直的橙色时间轴，标注 State 的变化快照：初始→第一轮后→第二轮后，每个快照列出 last_city 和 query_count 的值。白色背景。
>
> 整体目的：让读者理解工具调用中 State 读写的时序关系——工具写入的 State 在下一轮对话时立即可用于 Instruction 模板变量。

## **6. Session 的持久化：从内存到数据库**

`session.InMemoryService()` 在开发阶段方便快捷，但它有一个明显的局限——进程重启后所有数据都会丢失。在生产环境中，你通常需要把 Session 持久化到数据库里，这样用户关闭浏览器再打开，之前的对话历史还在。

ADK 的设计对此是开放的：`session.Service` 本质上是一组操作方法，框架并不限制底层存储实现。你可以把 Session 存到 Redis（适合对延迟敏感的场景）、MySQL/PostgreSQL（适合需要事务保证的场景）、甚至 MongoDB（适合灵活的 Schema）。

实现一个自定义的持久化 Session 服务并不复杂，核心思路就是把内存操作替换为数据库操作。下面我们用一个基于本地文件的实现来演示这个思路——它虽然不适合生产环境，但足够说明持久化的核心模式：

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"google.golang.org/adk/session"
)

// FileSessionService 基于本地文件的 Session 持久化服务
type FileSessionService struct {
	baseDir string
	inner   session.Service // 内嵌 InMemoryService 处理内存操作
}

// NewFileSessionService 创建文件持久化服务
func NewFileSessionService(baseDir string) (*FileSessionService, error) {
	if err := os.MkdirAll(baseDir, 0755); err != nil {
		return nil, fmt.Errorf("创建目录失败: %w", err)
	}
	return &FileSessionService{
		baseDir: baseDir,
		inner:   session.InMemoryService(),
	}, nil
}

// sessionFilePath 生成 Session 的文件路径
func (f *FileSessionService) sessionFilePath(appName, userID, sessionID string) string {
	return filepath.Join(f.baseDir, fmt.Sprintf("%s_%s_%s.json", appName, userID, sessionID))
}

// sessionData 用于序列化的 Session 数据
type sessionData struct {
	AppName   string         `json:"app_name"`
	UserID    string         `json:"user_id"`
	SessionID string         `json:"session_id"`
	State     map[string]any `json:"state"`
}

// Create 创建 Session 并持久化到文件
func (f *FileSessionService) Create(ctx context.Context, req *session.CreateRequest) (*session.CreateResponse, error) {
	// 先用内存服务创建
	resp, err := f.inner.Create(ctx, req)
	if err != nil {
		return nil, err
	}

	// 持久化到文件
	data := sessionData{
		AppName:   req.AppName,
		UserID:    req.UserID,
		SessionID: resp.Session.ID(),
		State:     req.State,
	}
	filePath := f.sessionFilePath(req.AppName, req.UserID, resp.Session.ID())
	bytes, _ := json.MarshalIndent(data, "", "  ")
	if err := os.WriteFile(filePath, bytes, 0644); err != nil {
		return nil, fmt.Errorf("持久化失败: %w", err)
	}

	fmt.Printf("[FileSessionService] Session 已保存到 %s\n", filePath)
	return resp, nil
}

// Get 检索 Session（优先从内存读，未命中则从文件恢复）
func (f *FileSessionService) Get(ctx context.Context, req *session.GetRequest) (*session.GetResponse, error) {
	// 先尝试从内存读
	resp, err := f.inner.Get(ctx, req)
	if err == nil {
		return resp, nil
	}

	// 内存未命中，尝试从文件恢复
	filePath := f.sessionFilePath(req.AppName, req.UserID, req.SessionID)
	bytes, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("Session 不存在: %s", req.SessionID)
	}

	var data sessionData
	if err := json.Unmarshal(bytes, &data); err != nil {
		return nil, fmt.Errorf("反序列化失败: %w", err)
	}

	// 恢复到内存
	createResp, err := f.inner.Create(ctx, &session.CreateRequest{
		AppName:   data.AppName,
		UserID:    data.UserID,
		SessionID: data.SessionID,
		State:     data.State,
	})
	if err != nil {
		return nil, err
	}

	fmt.Printf("[FileSessionService] Session 已从文件恢复: %s\n", filePath)
	return &session.GetResponse{Session: createResp.Session}, nil
}

// List 和 Delete 委托给内存服务（生产环境需要同步操作文件）
func (f *FileSessionService) List(ctx context.Context, req *session.ListRequest) (*session.ListResponse, error) {
	return f.inner.List(ctx, req)
}

func (f *FileSessionService) Delete(ctx context.Context, req *session.DeleteRequest) error {
	// 删除文件
	filePath := f.sessionFilePath(req.AppName, req.UserID, req.SessionID)
	os.Remove(filePath)
	// 删除内存
	return f.inner.Delete(ctx, req)
}

func main() {
	ctx := context.Background()

	// 创建文件持久化服务
	service, err := NewFileSessionService("/tmp/adk_sessions")
	if err != nil {
		log.Fatal(err)
	}

	// 创建 Session
	createResp, err := service.Create(ctx, &session.CreateRequest{
		AppName:   "my_app",
		UserID:    "user_001",
		SessionID: "persistent_chat",
		State: map[string]any{
			"user_name":       "小明",
			"user:vip_level":  "gold",
			"app:system_ver":  "1.0",
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("创建成功: %s\n\n", createResp.Session.ID())

	// 模拟"进程重启"：清空内存服务，再从文件恢复
	service.inner = session.InMemoryService() // 重置内存
	fmt.Println("模拟进程重启，内存已清空...")

	// 从文件恢复 Session
	getResp, err := service.Get(ctx, &session.GetRequest{
		AppName:   "my_app",
		UserID:    "user_001",
		SessionID: "persistent_chat",
	})
	if err != nil {
		log.Fatal(err)
	}

	// 验证数据恢复
	state := getResp.Session.State()
	userName, _ := state.Get("user_name")
	fmt.Printf("恢复后的用户名: %v\n", userName)
}
```

运行结果：

```
[FileSessionService] Session 已保存到 /tmp/adk_sessions/my_app_user_001_persistent_chat.json
创建成功: persistent_chat

模拟进程重启，内存已清空...
[FileSessionService] Session 已从文件恢复: /tmp/adk_sessions/my_app_user_001_persistent_chat.json
恢复后的用户名: 小明
```

这个示例展示了持久化的核心模式——在写操作时同时写入内存和持久存储，在读操作时优先读内存、未命中则从持久存储恢复。这个模式在替换为 Redis 或数据库时同样适用，只是把文件读写换成数据库查询而已。

在实际的生产系统中，你还需要考虑一些额外的问题：并发安全（多个请求同时操作同一个 Session 时的锁机制）、事件持久化（不仅存 State，还要存完整的对话历史）、过期清理（长时间不活跃的 Session 自动清理以节省存储空间）。这些细节我们会在后面的部署工程化章节中深入讨论。

> 【建议配图5 —— InMemory vs 持久化存储对比】
>
> 图片描述：一张左右对比布局的架构图。左半边标题"InMemoryService（开发环境）"，浅蓝色背景。中央是一个内存条形状的图标（绿色芯片条），上方一个 Runner 方框通过双向箭头连接内存条，内存条下方有一个闪电图标和标注"极速读写"，再下方有一个红色警告三角图标和标注"进程重启即丢失"。右半边标题"持久化 Service（生产环境）"，浅绿色背景。中央是一个两层结构：上层是同样的内存条图标标注"内存缓存层"，下层是三个并排的存储图标——Redis 的菱形 logo 标注"Redis"、数据库圆柱标注"MySQL/PG"、文档图标标注"MongoDB"。上层和下层之间有双向箭头，标注"读：缓存优先 → 缺失则回源"和"写：双写保证一致性"。上方同样有 Runner 方框连接。两半之间用一条竖直虚线分隔，虚线上方有一个绿色对勾标注"接口相同，无缝切换"。整体白色背景。
>
> 整体目的：让读者理解 InMemoryService 和持久化方案的本质区别，以及为什么"接口不变、实现可换"的设计对生产部署很重要。

## **7. Runner 的 AutoCreateSession**

在前面的例子中，我们都是先手动调用 `service.Create()` 创建 Session，再把 `SessionID` 传给 `r.Run()`。这在需要精确控制 Session 创建过程（比如注入初始 State）的场景下是合理的。但有时候你只是想快速跑一个简单的对话，不想操心 Session 的创建——这时候 Runner 的 `AutoCreateSession` 配置就派上用场了。

当你在 `runner.Config` 中设置 `AutoCreateSession: true`，Runner 在运行时如果发现指定的 SessionID 不存在，会自动创建一个新的 Session，而不是报错退出。这在快速原型开发或者无状态的 API 场景下非常方便：

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

	myAgent, _ := llmagent.New(llmagent.Config{
		Name:        "simple_bot",
		Model:       m,
		Description: "简单对话机器人",
		Instruction: "你是一个友好的助手，用简洁的中文回答问题。",
	})

	sessionService := session.InMemoryService()

	// 开启 AutoCreateSession
	r, err := runner.New(runner.Config{
		AppName:           "auto_session_demo",
		Agent:             myAgent,
		SessionService:    sessionService,
		AutoCreateSession: true, // 关键配置
	})
	if err != nil {
		log.Fatal(err)
	}

	// 不需要手动创建 Session，直接 Run
	// Runner 发现 "auto_chat_001" 不存在，会自动创建
	userMsg := genai.NewContentFromText("你好，1+1等于几？", genai.RoleUser)
	for event, err := range r.Run(ctx, "user_001", "auto_chat_001", userMsg, agent.RunConfig{}) {
		if err != nil {
			log.Printf("错误: %v", err)
			continue
		}
		if event != nil && event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Printf("Agent: %s\n", part.Text)
				}
			}
		}
	}

	// 验证 Session 确实被自动创建了
	listResp, _ := sessionService.List(ctx, &session.ListRequest{
		AppName: "auto_session_demo",
		UserID:  "user_001",
	})
	fmt.Printf("\n自动创建的 Session 数量: %d\n", len(listResp.Sessions))
	for _, sess := range listResp.Sessions {
		fmt.Printf("  Session ID: %s\n", sess.ID())
	}
}
```

`AutoCreateSession` 虽然方便，但要注意它创建的 Session 没有初始 State。如果你的 Agent 的 Instruction 模板依赖 State 中的变量，自动创建的 Session 里这些变量的值就是空的。所以这个配置更适合那些不依赖初始状态的简单场景。如果你的业务需要在创建 Session 时注入特定的用户信息或配置，还是老老实实手动创建比较靠谱。

## **8. 实战：多轮对话的上下文管理**

最后我们来做一个更完整的实战练习，把前面学到的知识串在一起。我们要实现一个"记事本 Agent"——它能帮用户记住事情、查询之前记过的内容，所有记录都存在 Session State 中。这个例子综合展示了 Session 的创建、State 的读写、工具调用中的状态管理，以及多轮对话的上下文维护。

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
)

// 添加笔记工具
func addNoteTool(ctx context.Context, tCtx *tool.Context, args struct {
	Title   string `json:"title" description:"笔记标题"`
	Content string `json:"content" description:"笔记内容"`
}) (map[string]any, error) {
	// 从 State 中读取现有笔记列表
	var notes []map[string]string
	if existing, ok := tCtx.State.Get("notes"); ok {
		if data, err := json.Marshal(existing); err == nil {
			json.Unmarshal(data, &notes)
		}
	}

	// 添加新笔记
	newNote := map[string]string{
		"title":      args.Title,
		"content":    args.Content,
		"created_at": time.Now().Format("2006-01-02 15:04:05"),
	}
	notes = append(notes, newNote)

	// 写回 State
	tCtx.State.Set("notes", notes)
	tCtx.State.Set("note_count", len(notes))
	tCtx.State.Set("last_note_title", args.Title)

	return map[string]any{
		"status":  "success",
		"message": fmt.Sprintf("笔记'%s'已保存，当前共 %d 条笔记", args.Title, len(notes)),
	}, nil
}

// 查询笔记工具
func searchNoteTool(ctx context.Context, tCtx *tool.Context, args struct {
	Keyword string `json:"keyword" description:"搜索关键词"`
}) (map[string]any, error) {
	var notes []map[string]string
	if existing, ok := tCtx.State.Get("notes"); ok {
		if data, err := json.Marshal(existing); err == nil {
			json.Unmarshal(data, &notes)
		}
	}

	// 搜索匹配的笔记
	var results []map[string]string
	for _, note := range notes {
		if strings.Contains(note["title"], args.Keyword) ||
			strings.Contains(note["content"], args.Keyword) {
			results = append(results, note)
		}
	}

	if len(results) == 0 {
		return map[string]any{
			"status":  "not_found",
			"message": fmt.Sprintf("没有找到包含'%s'的笔记", args.Keyword),
		}, nil
	}

	return map[string]any{
		"status":  "found",
		"count":   len(results),
		"results": results,
	}, nil
}

func main() {
	ctx := context.Background()
	m := NewDashScopeModel("qwen-plus")

	addNote := tool.NewFunction("add_note", "添加一条新笔记", addNoteTool)
	searchNote := tool.NewFunction("search_note", "搜索笔记", searchNoteTool)

	myAgent, err := llmagent.New(llmagent.Config{
		Name:  "notebook_agent",
		Model: m,
		Description: "个人记事本助手",
		Instruction: `你是 {user_name} 的个人记事本助手。
你可以帮用户添加笔记和搜索笔记。
当前笔记数量: {note_count}
最近一条笔记: {last_note_title}

使用规则：
- 用户说"记一下"、"帮我记住"等意图时，调用 add_note 工具
- 用户说"找一下"、"之前记过什么"等意图时，调用 search_note 工具
- 回复时要确认操作结果，并简要概括`,
		Tools: []tool.Tool{addNote, searchNote},
	})
	if err != nil {
		log.Fatal(err)
	}

	sessionService := session.InMemoryService()
	r, err := runner.New(runner.Config{
		AppName:        "notebook_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})
	if err != nil {
		log.Fatal(err)
	}

	// 创建 Session，初始化用户信息
	createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName:   "notebook_app",
		UserID:    "user_001",
		SessionID: "notebook_session",
		State: map[string]any{
			"user_name":       "小明",
			"note_count":      0,
			"last_note_title": "暂无",
			"notes":           []map[string]string{},
		},
	})

	// 模拟三轮对话
	messages := []string{
		"帮我记一下：明天下午3点开项目评审会",
		"再记一条：周五前提交季度报告给张总",
		"找一下跟会议相关的笔记",
	}

	for i, msg := range messages {
		fmt.Printf("\n===== 第 %d 轮对话 =====\n", i+1)
		fmt.Printf("用户: %s\n", msg)

		userMsg := genai.NewContentFromText(msg, genai.RoleUser)
		for event, err := range r.Run(ctx, "user_001", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
			if err != nil {
				continue
			}
			if event != nil && event.IsFinalResponse() && event.Content != nil {
				for _, part := range event.Content.Parts {
					if part.Text != "" {
						fmt.Printf("Agent: %s\n", part.Text)
					}
				}
			}
		}
	}
}
```

这个记事本 Agent 的核心在于：笔记数据完全存储在 Session State 中，工具负责读写 State，Agent 的 Instruction 通过模板变量实时感知 State 的变化。三轮对话之后，Session State 里会积累两条笔记和相应的元信息，第三轮的搜索操作也是从 State 中完成的。整个过程中，开发者不需要维护任何外部数据库——对于小规模的临时数据，Session State 就是一个开箱即用的轻量存储。

当然，如果笔记数据量大了，你应该把笔记存到真正的数据库里，Session State 中只保留少量元信息（笔记数量、最近操作等）。State 的定位始终是"轻量状态"而非"海量数据存储"。

## **9. 小结**

Session 是那种"不起眼但少了它什么都干不了"的基础设施。它的 API 只有创建、读取、列出、删除四个操作，State 的用法也就是 `Get` 和 `Set`——但正是这种简单性让它成为了 ADK 中最稳定、最不容易用错的组件。三级作用域的前缀约定（无前缀 = Session 级、`user:` = 用户级、`app:` = 应用级）用一个扁平的 Key-Value 结构实现了三层数据隔离，不需要额外的抽象层，这很符合 Go 社区"少即是多"的设计哲学。

理解了 Session，你就掌握了 Agent 的"记忆中枢"。模型负责思考、工具负责行动、Session 负责记忆——三者各司其职，共同构成一个完整的 Agent 运行时。在后续的文章中，当我们讲到 Runner 的运行机制时，你会看到 Session 是如何被 Runner 在每个执行阶段自动管理的——创建、读取、更新、清理，Runner 把这些细节都封装好了，让你可以把精力集中在业务逻辑上。

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
