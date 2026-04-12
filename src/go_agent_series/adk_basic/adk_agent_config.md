---
title: 13. Agent配置详解
description: "Go语言 AI Agent 入门教程：全面解析 Google ADK 框架 llmagent.Config 配置项，涵盖 Instruction 模板变量与动态指令、Description 最佳实践、GenerateContentConfig 参数调优、OutputKey/OutputSchema 输出控制、回调系统与 SubAgents 多智能体协作，附完整可运行 Go 代码示例。"
category:
  - Go Agent
tag:
  - Go Agent
  - 大模型
  - ADK
  - Google ADK
  - AI Agent教程
  - Go语言
  - Agent配置
---

# **Agent配置详解**

上一篇我们把模型层掰开了讲清楚了——`model.LLM` 接口、`LLMRequest/LLMResponse` 数据流、参数调优技巧，这些都是 Agent 的"心脏"部分。但模型只是 Agent 的动力引擎，要让 Agent 真正好用，你还得告诉它"你是谁、你能干什么、你该怎么做"——这些全靠 `llmagent.Config` 来配置。

在快速上手那篇文章里，我们用到的 Config 只有四个字段：Name、Model、Description、Instruction。但 `llmagent.Config` 实际上是一个非常丰富的配置结构体，包含了身份标识、指令系统、输出控制、回调钩子、子 Agent 管理等二十多个字段。很多同学用 ADK 写出来的 Agent "能跑但不太行"，往往就是因为只用了最基础的配置，没有充分利用框架提供的能力。

这篇文章就来把 `llmagent.Config` 的每一个关键字段都讲透。我们会从全景概览开始，然后按功能分组逐个深入，每个知识点都配上完整可运行的代码示例。读完之后，你应该能根据不同的业务场景，写出配置精准、行为可控的 Agent。

## **1. Config 全景：一张地图看清所有字段**

先来看看 `llmagent.Config` 的完整定义。我把所有字段按功能分了组，方便你建立全局认知：

```go
type Config struct {
    // ===== 身份标识 =====
    Name        string        // Agent 的唯一名称（必填）
    Description string        // Agent 的能力描述（多 Agent 场景下用于路由）

    // ===== 模型配置 =====
    Model                 model.LLM                   // 底层语言模型（必填）
    GenerateContentConfig *genai.GenerateContentConfig // 模型生成参数（Temperature等）

    // ===== 指令系统 =====
    Instruction             string              // 静态指令模板，支持 {变量名} 占位符
    InstructionProvider     InstructionProvider  // 动态指令生成函数
    GlobalInstruction       string              // 全局指令模板（传递给子 Agent）
    GlobalInstructionProvider InstructionProvider // 全局动态指令生成函数

    // ===== 工具系统 =====
    Tools    []tool.Tool    // 工具列表
    Toolsets []tool.Toolset // 工具集（可动态加载）

    // ===== 输出控制 =====
    OutputKey    string        // 把 Agent 输出保存到 Session State 的指定 key
    OutputSchema *genai.Schema // 约束 Agent 输出为指定 JSON 结构
    InputSchema  *genai.Schema // 约束 Agent 输入的 JSON 结构

    // ===== 子 Agent 与路由 =====
    SubAgents                []agent.Agent // 子 Agent 列表
    DisallowTransferToParent bool          // 禁止向父 Agent 转移控制权
    DisallowTransferToPeers  bool          // 禁止向同级 Agent 转移控制权

    // ===== 内容控制 =====
    IncludeContents IncludeContents // 控制是否包含历史对话内容

    // ===== 回调钩子 =====
    BeforeAgentCallbacks  []agent.BeforeAgentCallback
    AfterAgentCallbacks   []agent.AfterAgentCallback
    BeforeModelCallbacks  []BeforeModelCallback
    AfterModelCallbacks   []AfterModelCallback
    OnModelErrorCallbacks []OnModelErrorCallback
    BeforeToolCallbacks   []BeforeToolCallback
    AfterToolCallbacks    []AfterToolCallback
    OnToolErrorCallbacks  []OnToolErrorCallback
}
```

字段不少，但别被吓到。实际使用中，大部分场景只需要其中一小部分。接下来我们按功能分组，逐个击破。

> 【建议配图1 —— llmagent.Config 字段分组全景图】
>
> 图片描述：一张以中央辐射式布局的全景图。正中央是一个大的深蓝色圆角矩形，内部有机器人图标和"llmagent.Config"文字，是整张图的视觉焦点。从中央向外辐射出六条不同颜色的连接线，每条线末端连接一个功能分组区域。右上方绿色区域"身份标识"（名片图标），内部小字列出 Name、Description；右侧橙色区域"指令系统"（卷轴图标），内部列出 Instruction、InstructionProvider、GlobalInstruction；右下方紫色区域"输出控制"（漏斗图标），内部列出 OutputKey、OutputSchema；左下方红色区域"回调钩子"（钩子图标），内部列出 BeforeModel、AfterModel、BeforeTool 等；左侧青色区域"子Agent管理"（组织架构图标），内部列出 SubAgents、DisallowTransfer；左上方黄色区域"模型配置"（齿轮图标），内部列出 Model、GenerateContentConfig。每个分组区域大小不等——指令系统和回调钩子的区域最大，表示这是最复杂的两块。六个分组之间用浅灰色虚线弧形连接，暗示它们协同工作。白色背景，整体像一朵花绽放的形状，层次分明。
>
> 整体目的：让读者一眼看清 Config 的全部字段分布和功能分组，建立"先有全景再深入细节"的学习路径。

## **2. 身份标识：Name 与 Description**

### **2.1 Name：Agent 的唯一 ID**

`Name` 是 Agent 在整个应用中的唯一标识符。这个名字不仅仅是给人看的——ADK 框架内部用它来做 Agent 路由、事件归属、日志标记等很多事情。

命名上有几个注意点。首先，名字在同一个 Agent 树中必须唯一。如果你有一个 Root Agent 和几个 Sub Agent，它们的 Name 不能重复，否则框架在路由时会混乱。其次，建议用 snake_case 风格的英文名，比如 `customer_service_agent`、`code_reviewer`，这样在日志和调试信息里辨识度高。避免用中文或特殊字符，虽然框架不会报错，但在 HTTP 接口和日志系统里容易出问题。

```go
// 好的命名
myAgent, _ := llmagent.New(llmagent.Config{
    Name: "order_assistant",  // 清晰、简洁、snake_case
    // ...
})

// 不推荐的命名
myAgent, _ := llmagent.New(llmagent.Config{
    Name: "Agent1",           // 太笼统，无法表达用途
    // ...
})
```

### **2.2 Description：给模型看的"自我介绍"**

`Description` 容易被忽视，但在多 Agent 场景下极其重要。当你有一个 Root Agent 和多个 Sub Agent 时，Root Agent 需要决定"这个用户请求应该交给哪个 Sub Agent 处理"。它做决策的依据，就是每个 Sub Agent 的 Description。

换句话说，Description 不是给人看的注释，而是给大模型看的"能力说明书"。写得好不好，直接影响 Agent 路由的准确率。

一个好的 Description 应该具备三个特质：**说清楚能做什么**、**说清楚适合处理什么类型的请求**、**如果有边界就明确边界**。来看一组对比：

```go
// 差的 Description —— 太笼统，模型无法据此做路由决策
searchAgent, _ := llmagent.New(llmagent.Config{
    Name:        "search_agent",
    Description: "搜索助手",  // 搜什么？怎么搜？模型一脸茫然
    // ...
})

// 好的 Description —— 能力边界清晰，模型可以精准路由
searchAgent, _ := llmagent.New(llmagent.Config{
    Name:        "search_agent",
    Description: "负责在互联网上搜索实时信息，包括新闻、天气、股票行情等。适合处理需要获取最新数据的查询，不适合处理历史知识类问题。",
    // ...
})
```

在单 Agent 场景下，Description 的重要性没那么高——但养成写好 Description 的习惯是值得的，因为你的 Agent 迟早会演进到多 Agent 架构。

## **3. 指令系统：Instruction 的三重境界**

Instruction 是 Agent 配置中最核心的部分，它直接决定了 Agent 的行为方式。ADK 提供了从简单到复杂的三种指令配置方式，分别适用于不同的场景。

### **3.1 第一重：静态字符串**

最基础的用法就是直接写一个字符串，作为 System Prompt 发给模型。这种方式适合行为固定的简单 Agent：

```go
myAgent, _ := llmagent.New(llmagent.Config{
    Name:  "translator",
    Model: NewDashScopeModel("qwen-plus"),
    Instruction: `你是一个专业的中英文翻译助手。
用户输入中文时，翻译成英文；输入英文时，翻译成中文。
翻译要求：
- 保持原文语义，不添加额外解释
- 专业术语保留英文原文并在括号内标注中文
- 输出格式：直接给出翻译结果，不需要前缀`,
})
```

静态字符串的优点是直观简单，缺点是"一刀切"——不管用户是谁、当前状态如何，Agent 收到的指令永远一样。

### **3.2 第二重：模板变量**

真实场景中，我们经常希望指令能"因人而异"。比如客服 Agent 需要知道当前用户的姓名和会员等级，翻译 Agent 需要知道用户偏好的翻译风格。ADK 的 Instruction 字段支持 `{变量名}` 占位符语法，运行时自动从 Session State 中取值替换。

来看一个完整的例子——我们创建一个客服 Agent，它的指令会根据用户的姓名和会员等级动态变化：

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

	// Instruction 中使用 {变量名} 占位符
	myAgent, err := llmagent.New(llmagent.Config{
		Name:  "customer_service",
		Model: m,
		Description: "处理用户的售前售后咨询",
		Instruction: `你是秀才商城的客服助手。
当前用户姓名：{user_name}
当前用户会员等级：{member_level}

请根据用户的会员等级调整服务态度：
- 普通会员：礼貌友好，正常回答
- 黄金会员：更加热情，主动推荐优惠活动
- 钻石会员：尊称"尊敬的钻石会员"，优先处理问题，提供专属福利信息

回答要简洁专业，控制在 150 字以内。`,
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "customer_service_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})

	// 创建会话时设置 State —— 这些值会自动替换 Instruction 中的占位符
	createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "customer_service_app",
		UserID:  "user_001",
		State: map[string]any{
			"user_name":    "张三",
			"member_level": "钻石会员",
		},
	})

	userMsg := genai.NewContentFromText("我昨天买的耳机有点杂音，怎么处理？", "user")

	for event, err := range r.Run(ctx, "user_001", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
		if err != nil {
			log.Printf("错误: %v", err)
			continue
		}
		if event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Println("客服回复:", part.Text)
				}
			}
		}
	}
}
```

运行结果：
```
客服回复: 尊敬的钻石会员张三您好！非常抱歉给您带来不好的购物体验。关于耳机杂音问题，建议您先检查音频接口是否清洁，尝试连接其他设备排除兼容性问题。如仍有杂音，我们将为您优先安排换货，钻石会员享受免运费极速换货服务。请提供您的订单号，我立即为您处理。
```

模板变量的语法很简单：用花括号 `{}` 包裹变量名，变量名必须匹配正则 `^[a-zA-Z_][a-zA-Z0-9_]*$`。ADK 在每次 Agent 执行时，会从当前 Session State 中查找对应的 key，找到就替换，找不到就报错。

如果某个变量是可选的（State 里不一定有），在变量名后面加个 `?` 就行：`{optional_var?}`。这样即使 State 里没有这个 key，ADK 也不会报错，而是把占位符替换为空字符串。

```go
Instruction: `你是一个助手。
当前用户：{user_name}
用户偏好：{preference?}`,  // preference 是可选的，没有也不会报错
```

> 【建议配图2 —— Instruction 模板变量的运行时替换流程】
>
> 图片描述：一张从左到右的三阶段流水线图。第一阶段（左侧）是一个浅蓝色卡片，标题"Instruction 模板"，内容展示一段带高亮占位符的文本：普通文字用黑色，`{user_name}` 和 `{member_level}` 用橙色高亮显示并带有花括号装饰。一条蓝色粗箭头从左指向中间，箭头上方标注"ADK 运行时解析"。第二阶段（中间）是一个绿色卡片，标题"Session State"，内部是两行键值对，用表格样式展示：`user_name → "张三"`、`member_level → "钻石会员"`，每行左侧有钥匙图标，右侧有对应的值。两条虚线箭头分别从两行键值对射出，指向右侧卡片中对应的位置。第三阶段（右侧）是一个紫色卡片，标题"最终 System Prompt"，内容展示替换后的完整文本，之前的占位符位置现在显示为绿色高亮的实际值"张三"和"钻石会员"。白色背景，三个卡片大小依次递增，最终结果最大最醒目。
>
> 整体目的：让读者清晰理解模板变量从定义到替换的完整过程——Instruction 定义占位符，Session State 提供值，ADK 在运行时完成拼装。

### **3.3 第三重：InstructionProvider 动态指令**

模板变量虽然灵活，但本质上还是字符串替换——如果你的指令需要根据复杂条件动态生成（比如根据当前时间调整行为、根据用户历史对话量切换策略），就需要用到 `InstructionProvider`。

`InstructionProvider` 的类型定义非常简单：

```go
type InstructionProvider func(ctx agent.ReadonlyContext) (string, error)
```

它接收一个只读的上下文（可以读 Session State 但不能修改），返回一个完整的指令字符串。这个函数在每次 Agent 被调用时都会执行，所以你可以在里面写任意逻辑。

来看一个实用场景：根据当前时间段切换 Agent 的服务风格——工作时间正式专业，非工作时间轻松活泼：

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
	ctx := context.Background()
	m := NewDashScopeModel("qwen-plus")

	myAgent, err := llmagent.New(llmagent.Config{
		Name:  "smart_assistant",
		Model: m,
		Description: "根据时间段自动切换风格的智能助手",
		// 使用 InstructionProvider 替代静态 Instruction
		InstructionProvider: func(ctx agent.ReadonlyContext) (string, error) {
			hour := time.Now().Hour()

			// 从 Session State 读取用户名（只读访问）
			userName := "用户"
			if state := ctx.State(); state != nil {
				if name, ok := state.Get("user_name"); ok {
					userName = fmt.Sprintf("%v", name)
				}
			}

			var style string
			if hour >= 9 && hour < 18 {
				style = fmt.Sprintf(`你是秀才公司的专业客服助手。
当前为工作时间，请以正式、专业的语气回答%s的问题。
回答要有条理，必要时引用相关规定和流程。`, userName)
			} else {
				style = fmt.Sprintf(`你是秀才公司的智能小秀，下班时间为%s提供轻松友好的服务。
可以用轻松的语气聊天，适当加入一些幽默元素。
如果遇到需要正式处理的问题，建议用户在工作时间（9:00-18:00）联系人工客服。`, userName)
			}

			return style, nil
		},
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "smart_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})

	createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "smart_app",
		UserID:  "user_001",
		State:   map[string]any{"user_name": "李四"},
	})

	userMsg := genai.NewContentFromText("你们的退货政策是什么？", "user")

	for event, err := range r.Run(ctx, "user_001", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
		if err != nil {
			log.Printf("错误: %v", err)
			continue
		}
		if event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Println("助手回复:", part.Text)
				}
			}
		}
	}
}
```

运行结果（假设在工作时间运行）：
```
助手回复: 您好李四，关于我们的退货政策，说明如下：自签收之日起7天内，商品保持原包装且不影响二次销售的情况下，可申请无理由退货。请通过订单页面提交退货申请，审核通过后按指引寄回商品，运费根据退货原因承担。如需进一步协助，请随时告知。
```

有一个重要的细节需要注意：当 `Instruction` 和 `InstructionProvider` 同时设置时，`InstructionProvider` 的优先级更高。但 `InstructionProvider` 返回的字符串不会自动做 `{变量名}` 的模板替换——如果你需要在动态指令中也使用 Session State 的值，得自己在函数里手动读取和拼接，就像上面例子中对 `user_name` 的处理那样。

### **3.4 GlobalInstruction：传递给整棵 Agent 树的指令**

`GlobalInstruction` 和 `GlobalInstructionProvider` 是针对多 Agent 场景设计的。当你在 Root Agent 上设置了 `GlobalInstruction`，这条指令不仅会应用于 Root Agent 自身，还会自动传递给它的所有 Sub Agent。这对于统一全局行为非常有用——比如统一语言风格、统一安全规则等。

```go
rootAgent, _ := llmagent.New(llmagent.Config{
    Name:  "root",
    Model: m,
    // GlobalInstruction 会传递给所有子 Agent
    GlobalInstruction: "所有回答必须使用简体中文。严禁输出任何涉及暴力、色情的内容。",
    Instruction:       "你是一个调度中心，负责把用户的请求分发给合适的专家 Agent。",
    SubAgents:         []agent.Agent{searchAgent, writerAgent},
})
```

这样一来，不管用户的请求被路由到哪个 Sub Agent，安全规则和语言限制都能生效，你不需要在每个 Sub Agent 的 Instruction 里重复写一遍。

## **4. 输出控制：OutputKey 与 OutputSchema**

### **4.1 OutputKey：把回复存进 Session State**

默认情况下，Agent 的回复会通过事件流返回给调用方，但不会自动保存到 Session State 里。如果你希望把某个 Agent 的输出"存下来"，供后续的 Agent 或业务逻辑使用，就需要用到 `OutputKey`。

`OutputKey` 指定了一个 Session State 的 key，Agent 的文本输出会自动保存到这个 key 下面。这个特性在工作流 Agent（Sequential Agent）中特别有用——流水线上的每个 Agent 把自己的输出存到 State 里，下一个 Agent 就能通过模板变量 `{key_name}` 读取到上一步的结果。

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
		Name:      "summarizer",
		Model:     m,
		Instruction: "用一句话总结用户的输入内容。只输出总结，不要其他多余文字。",
		OutputKey: "summary_result", // Agent 的回复会自动保存到 State["summary_result"]
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "summary_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})

	createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "summary_app",
		UserID:  "user_001",
	})

	userMsg := genai.NewContentFromText("今天北京气温骤降到零下5度，交通部门提醒市民注意路面结冰，多条高速公路已实施临时管控措施。", "user")

	for event, err := range r.Run(ctx, "user_001", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
		if err != nil {
			continue
		}
		if event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Println("总结:", part.Text)
				}
			}
			// OutputKey 生效后，event.Actions.StateDelta 中会有对应的 key
			if event.Actions != nil && event.Actions.StateDelta != nil {
				if val, ok := event.Actions.StateDelta["summary_result"]; ok {
					fmt.Println("State 中保存的值:", val)
				}
			}
		}
	}
}
```

运行结果：
```
总结: 北京气温骤降至零下5度，多条高速因路面结冰实施临时管控。
State 中保存的值: 北京气温骤降至零下5度，多条高速因路面结冰实施临时管控。
```

### **4.2 OutputSchema：约束输出为结构化 JSON**

有些场景下，你不希望 Agent 自由发挥地输出文本，而是要求它返回一个严格符合 JSON Schema 的结构化数据。比如你让 Agent 做情感分析，你希望它返回 `{"sentiment": "positive", "confidence": 0.95}` 这样的结构，而不是一段自然语言。

`OutputSchema` 就是用来做这件事的。设置了 `OutputSchema` 后，ADK 会把这个 Schema 传给模型，要求模型的输出严格符合指定的 JSON 结构。需要注意的是，设置了 `OutputSchema` 的 Agent 不能同时使用工具——因为模型的输出被约束为 JSON 格式，无法发起 Function Call。

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
		Name:  "sentiment_analyzer",
		Model: m,
		Instruction: `分析用户输入文本的情感倾向。
返回 JSON 格式，包含 sentiment（positive/negative/neutral）和 confidence（0-1的置信度）。`,
		OutputSchema: &genai.Schema{
			Type: genai.TypeObject,
			Properties: map[string]*genai.Schema{
				"sentiment": {
					Type:        genai.TypeString,
					Description: "情感倾向",
					Enum:        []string{"positive", "negative", "neutral"},
				},
				"confidence": {
					Type:        genai.TypeNumber,
					Description: "置信度，0到1之间的浮点数",
				},
			},
			Required: []string{"sentiment", "confidence"},
		},
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "sentiment_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})

	createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "sentiment_app",
		UserID:  "user_001",
	})

	userMsg := genai.NewContentFromText("这家餐厅的菜太好吃了，服务也非常周到，下次还来！", "user")

	for event, err := range r.Run(ctx, "user_001", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
		if err != nil {
			continue
		}
		if event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Println("分析结果:", part.Text)
				}
			}
		}
	}
}
```

运行结果：
```
分析结果: {"sentiment": "positive", "confidence": 0.96}
```

> 【建议配图3 —— OutputKey 与 OutputSchema 的工作方式对比】
>
> 图片描述：一张左右分栏的对比图。左半部分标题"OutputKey —— 存储文本输出"，背景为浅绿色。顶部是一个机器人图标产出一段自然语言文本（用引号包裹的话语气泡），一条绿色实线箭头向下指向一个数据库圆柱体图标，圆柱体上标注"Session State"，内部高亮显示 `summary_result: "总结文本..."` 这一行键值对。箭头旁标注"自动保存"。右半部分标题"OutputSchema —— 约束 JSON 结构"，背景为浅紫色。顶部是同样的机器人图标，但产出的不是话语气泡，而是一个带花括号的 JSON 代码块 `{"sentiment": "positive", "confidence": 0.96}`。机器人和 JSON 之间有一个漏斗图标，漏斗上标注"Schema 约束"。JSON 代码块下方有一个绿色勾号和"格式校验通过"文字。两个分栏之间用灰色竖线分隔，竖线上方有一个"VS"标记。白色背景。
>
> 整体目的：直观对比 OutputKey（存储自由文本）和 OutputSchema（约束结构化输出）两种输出控制方式的工作原理和使用场景。

## **5. GenerateContentConfig：微调模型行为**

上一篇模型层详解中我们深入讲过 Temperature、TopP 等参数的原理和效果。在 `llmagent.Config` 里，你可以通过 `GenerateContentConfig` 字段在 Agent 级别设置这些参数，不需要修改底层的模型适配器。

这个字段的类型是 `*genai.GenerateContentConfig`，和模型层的 `LLMRequest.Config` 是同一个结构体。Agent 级别设置的参数会在每次调用模型时自动注入到 `LLMRequest` 中。

```go
myAgent, _ := llmagent.New(llmagent.Config{
    Name:  "creative_writer",
    Model: m,
    Instruction: "你是一个创意写作助手，帮助用户写故事和诗歌。风格要有创意、有想象力。",
    GenerateContentConfig: &genai.GenerateContentConfig{
        Temperature:     genai.Ptr(float32(0.9)),  // 高温度 → 更有创意
        TopP:            genai.Ptr(float32(0.95)),  // 较宽的采样范围
        MaxOutputTokens: genai.Ptr(int32(2000)),    // 允许较长的输出
    },
})
```

不同类型的 Agent 适合不同的参数组合。翻译、数据提取这类需要准确性的任务，Temperature 建议设在 0.1-0.3；通用对话和问答可以用 0.5-0.7；创意写作、头脑风暴则可以拉高到 0.8-1.0。一个有趣的实践是：在同一个应用里创建多个 Agent，每个 Agent 用不同的参数配置来处理不同类型的任务——严肃的事情交给低温 Agent，有趣的事情交给高温 Agent。

## **6. 回调系统：在关键节点插入自定义逻辑**

ADK 的回调系统让你可以在 Agent 执行的各个关键节点插入自定义逻辑——日志记录、权限校验、内容审核、性能监控等等。整个回调体系可以分为三层：Agent 级别、Model 级别和 Tool 级别。

### **6.1 回调类型一览**

Agent 级别的回调在整个 Agent 生命周期的首尾触发。`BeforeAgentCallbacks` 在 Agent 开始执行前触发，你可以在这里做初始化、鉴权、日志记录等；`AfterAgentCallbacks` 在 Agent 执行完毕后触发，适合做清理、统计等收尾工作。这两个回调的返回值如果包含 `*genai.Content`，会直接作为 Agent 的输出，跳过后续的模型调用——这就相当于一个"短路"机制，可以用来做缓存命中或快速拒绝。

Model 级别的回调围绕模型调用。`BeforeModelCallbacks` 在调用模型之前触发，你可以在这里修改请求（比如注入额外的系统指令）或直接返回一个缓存结果来跳过模型调用。`AfterModelCallbacks` 在模型返回后触发，可以用来做内容过滤或日志记录。`OnModelErrorCallbacks` 在模型调用出错时触发，是做错误恢复和降级的好地方。

Tool 级别的回调围绕工具执行。`BeforeToolCallbacks` 在工具执行前触发，你可以修改工具参数或拦截不允许的操作。`AfterToolCallbacks` 在工具执行后触发，可以加工工具的返回结果。`OnToolErrorCallbacks` 在工具执行出错时触发。

### **6.2 实战：构建一个带完整监控的 Agent**

下面这个例子展示了如何用回调系统给 Agent 加上 Token 用量监控和内容安全审查：

```go
package main

import (
	"context"
	"fmt"
	"log"
	"strings"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/model"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
	"google.golang.org/adk/tool"
)

func main() {
	ctx := context.Background()
	m := NewDashScopeModel("qwen-plus")

	// 定义一个简单的工具
	greetTool := tool.NewFunction(
		"get_greeting",
		"根据时段返回合适的问候语",
		func(ctx tool.Context, args struct {
			Period string `json:"period" description:"时段：morning/afternoon/evening"`
		}) (map[string]any, error) {
			greetings := map[string]string{
				"morning":   "早上好",
				"afternoon": "下午好",
				"evening":   "晚上好",
			}
			greeting, ok := greetings[args.Period]
			if !ok {
				greeting = "你好"
			}
			return map[string]any{"greeting": greeting}, nil
		},
	)

	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "monitored_agent",
		Model:       m,
		Description: "带完整监控回调的示例 Agent",
		Instruction: "你是一个友好的助手。当需要问候用户时，使用 get_greeting 工具获取合适的问候语。",
		Tools:       []tool.Tool{greetTool},

		// Agent 级别回调
		BeforeAgentCallbacks: []agent.BeforeAgentCallback{
			func(ctx agent.CallbackContext) (*genai.Content, error) {
				log.Printf("[Agent] 开始执行，InvocationID: %s", ctx.InvocationID())
				return nil, nil // 返回 nil 表示继续正常执行
			},
		},
		AfterAgentCallbacks: []agent.AfterAgentCallback{
			func(ctx agent.CallbackContext) (*genai.Content, error) {
				log.Printf("[Agent] 执行完毕")
				return nil, nil
			},
		},

		// Model 级别回调
		BeforeModelCallbacks: []llmagent.BeforeModelCallback{
			func(ctx agent.CallbackContext, req *model.LLMRequest) (*model.LLMResponse, error) {
				log.Printf("[Model] 即将调用模型，消息数: %d", len(req.Contents))
				return nil, nil // 返回 nil 继续调用模型
			},
		},
		AfterModelCallbacks: []llmagent.AfterModelCallback{
			func(ctx agent.CallbackContext, resp *model.LLMResponse, err error) (*model.LLMResponse, error) {
				if err != nil {
					log.Printf("[Model] 模型调用出错: %v", err)
					return nil, nil
				}
				// 记录 Token 用量
				if resp.UsageMetadata != nil {
					log.Printf("[Model] Token 用量 - 输入: %d, 输出: %d, 总计: %d",
						resp.UsageMetadata.PromptTokenCount,
						resp.UsageMetadata.CandidatesTokenCount,
						resp.UsageMetadata.TotalTokenCount,
					)
				}
				// 内容安全审查：检查回复中是否包含敏感词
				if resp.Content != nil {
					for _, part := range resp.Content.Parts {
						if strings.Contains(part.Text, "暴力") || strings.Contains(part.Text, "色情") {
							log.Printf("[Model] 内容审查拦截！")
							// 返回替换后的安全回复
							safeResp := &model.LLMResponse{
								Content:      genai.NewContentFromText("抱歉，我无法回答此类问题。", "model"),
								TurnComplete: true,
							}
							return safeResp, nil
						}
					}
				}
				return nil, nil // 返回 nil 表示使用原始响应
			},
		},

		// Tool 级别回调
		BeforeToolCallbacks: []llmagent.BeforeToolCallback{
			func(ctx tool.Context, t tool.Tool, args map[string]any) (map[string]any, error) {
				log.Printf("[Tool] 即将调用工具: %s, 参数: %v", t.Name(), args)
				return nil, nil // 返回 nil 使用原始参数
			},
		},
		AfterToolCallbacks: []llmagent.AfterToolCallback{
			func(ctx tool.Context, t tool.Tool, args, result map[string]any, err error) (map[string]any, error) {
				log.Printf("[Tool] 工具 %s 执行完毕, 结果: %v", t.Name(), result)
				return nil, nil
			},
		},
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "monitored_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})

	createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "monitored_app",
		UserID:  "user_001",
	})

	userMsg := genai.NewContentFromText("现在是早上，请问候我一下", "user")

	for event, err := range r.Run(ctx, "user_001", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
		if err != nil {
			continue
		}
		if event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Println("回复:", part.Text)
				}
			}
		}
	}
}
```

运行结果：
```
2025/04/11 10:30:01 [Agent] 开始执行，InvocationID: abc123
2025/04/11 10:30:01 [Model] 即将调用模型，消息数: 1
2025/04/11 10:30:02 [Model] Token 用量 - 输入: 156, 输出: 23, 总计: 179
2025/04/11 10:30:02 [Tool] 即将调用工具: get_greeting, 参数: map[period:morning]
2025/04/11 10:30:02 [Tool] 工具 get_greeting 执行完毕, 结果: map[greeting:早上好]
2025/04/11 10:30:02 [Model] 即将调用模型，消息数: 4
2025/04/11 10:30:03 [Model] Token 用量 - 输入: 198, 输出: 35, 总计: 233
2025/04/11 10:30:03 [Agent] 执行完毕
回复: 早上好！新的一天开始了，希望你今天精力充沛、万事顺心！有什么我可以帮你的吗？
```

> 【建议配图4 —— 回调系统在 Agent 执行流程中的触发时机】
>
> 图片描述：一张纵向的流程图，展示一次完整的 Agent 执行过程。最顶部是一个用户图标和"用户消息"标签。往下是一条竖直的蓝色主流程线，沿途经过多个节点。第一个节点是绿色圆角矩形"BeforeAgent"，左侧用虚线箭头标注"可短路返回"。主线继续往下到达一个蓝色大方框"模型调用区域"，这个方框内部包含三个水平排列的节点：左侧黄色"BeforeModel"（标注"可修改请求/缓存命中"），中间蓝色"调用 LLM"（大脑图标），右侧橙色"AfterModel"（标注"内容审核/用量记录"）。如果 AfterModel 检测到问题，一条红色虚线箭头从这里直接指向底部的"输出"。模型调用区域下方有一条分支——如果模型返回 FunctionCall，进入另一个紫色方框"工具调用区域"，内部同样三个节点：左侧"BeforeTool"（标注"参数校验"），中间"执行工具"（扳手图标），右侧"AfterTool"（标注"结果加工"）。工具区域下方有一条回路箭头指回模型调用区域，标注"带工具结果重新调用模型"。最终主线到达另一个绿色节点"AfterAgent"，再往下是终点"输出给用户"。整体白色背景，主流程线粗而醒目，回调节点像是挂在主线上的"钩子"。
>
> 整体目的：清晰展示 Agent 一次完整执行过程中，各类回调的触发顺序和时机，以及每个回调能做什么（修改、拦截、记录）。

回调系统有一个关键的设计原则值得记住：**返回 nil 表示"我不干预"，返回非 nil 表示"用我返回的结果替代原始结果"**。这个约定贯穿了所有回调类型。在 `BeforeModelCallbacks` 中返回一个 `*model.LLMResponse`，就等于告诉框架"不用调模型了，直接用我给的结果"——这是做缓存的绝佳位置。在 `AfterModelCallbacks` 中返回一个新的 `*model.LLMResponse`，就等于替换了模型的原始输出——这是做内容审核和后处理的好地方。

## **7. SubAgents 与 Agent Transfer**

### **7.1 SubAgents：构建 Agent 层级**

`SubAgents` 字段让你可以给一个 Agent 挂载多个子 Agent，形成一棵 Agent 树。设置了 SubAgents 后，ADK 会自动为每个子 Agent 设置 parent 关系，并启用 Agent Transfer 机制——父 Agent 可以根据用户请求的内容，自动把控制权转移给最合适的子 Agent。

这个机制和前面提到的 `agenttool.New()` 方式有本质区别。`agenttool.New()` 是把子 Agent 包装成工具来调用——父 Agent 调用子 Agent 就像调用一个函数，拿到结果后控制权仍在父 Agent 手里。而 `SubAgents` 方式是真正的"控制权转移"——一旦父 Agent 决定把对话交给某个子 Agent，后续的对话就由这个子 Agent 直接处理，直到它主动"转回"给父 Agent 或其他 Agent。

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

	// 子 Agent：技术支持
	techAgent, _ := llmagent.New(llmagent.Config{
		Name:        "tech_support",
		Model:       m,
		Description: "处理技术问题，包括软件故障、硬件问题、网络连接等技术类咨询",
		Instruction: "你是技术支持专家，专门解决用户的技术问题。回答要专业但通俗易懂，必要时给出分步骤的排查方案。",
	})

	// 子 Agent：销售咨询
	salesAgent, _ := llmagent.New(llmagent.Config{
		Name:        "sales_consultant",
		Model:       m,
		Description: "处理产品咨询、价格查询、促销活动、购买建议等销售相关问题",
		Instruction: "你是销售顾问，热情地为用户介绍产品和服务，推荐最适合的方案。回答要有亲和力。",
	})

	// 根 Agent：调度中心
	rootAgent, err := llmagent.New(llmagent.Config{
		Name:  "dispatcher",
		Model: m,
		Description: "客服调度中心",
		Instruction: `你是客服调度中心。分析用户的问题，然后转交给最合适的专家处理：
- 技术问题 → 转交 tech_support
- 产品和销售问题 → 转交 sales_consultant
不要自己回答用户的具体问题，你的职责只是准确路由。`,
		SubAgents: []agent.Agent{techAgent, salesAgent},
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "helpdesk_app",
		Agent:          rootAgent,
		SessionService: sessionService,
	})

	createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "helpdesk_app",
		UserID:  "user_001",
	})

	userMsg := genai.NewContentFromText("我的电脑连不上WiFi了，信号显示正常但就是上不了网", "user")

	for event, err := range r.Run(ctx, "user_001", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
		if err != nil {
			continue
		}
		if event.IsFinalResponse() && event.Content != nil {
			fmt.Printf("[%s] ", event.Author)
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Println(part.Text)
				}
			}
		}
	}
}
```

运行结果：
```
[tech_support] 您好！WiFi信号正常但无法上网，通常是DNS或IP配置问题。请按以下步骤排查：

1. 先尝试重启路由器，等待2分钟后重新连接
2. 如果仍然不行，打开命令提示符（Win+R输入cmd），执行：ipconfig /release 然后 ipconfig /renew
3. 尝试手动设置DNS为 8.8.8.8 和 114.114.114.114
4. 检查是否开启了代理或VPN软件，如有请关闭后重试

如果以上步骤都无法解决，可能是网卡驱动问题，建议更新网卡驱动或联系网络运营商。
```

注意看运行结果中的 `[tech_support]` 标记——这说明 Root Agent 成功地把用户请求路由到了 tech_support 子 Agent，后续的回复是由子 Agent 直接生成的。

### **7.2 Transfer 控制：DisallowTransferToParent 与 DisallowTransferToPeers**

默认情况下，Agent Tree 中的任何 Agent 都可以把控制权转移给父 Agent 或同级的兄弟 Agent。但有时候你需要限制这种自由度。

`DisallowTransferToParent` 设为 `true` 后，子 Agent 就不能把对话"踢回"给父 Agent。这在你希望子 Agent 必须自己处理完问题、不能推脱的场景下很有用。

`DisallowTransferToPeers` 设为 `true` 后，Agent 不能直接把控制权转给同级的兄弟 Agent。这意味着如果用户的问题需要另一个专家处理，必须先转回父 Agent，由父 Agent 重新路由。

```go
// 技术支持 Agent 不能把问题踢回给调度中心，必须自己处理
techAgent, _ := llmagent.New(llmagent.Config{
    Name:                     "tech_support",
    Model:                    m,
    Description:              "处理技术问题",
    Instruction:              "你是技术支持，必须尽力解决用户的技术问题。",
    DisallowTransferToParent: true,  // 不能推给父 Agent
    DisallowTransferToPeers:  true,  // 不能推给兄弟 Agent
})
```

> 【建议配图5 —— SubAgents Agent Tree 与 Transfer 路径】
>
> 图片描述：一张树形层级图。顶部是一个大的蓝色圆角矩形"Root Agent (dispatcher)"，内部有调度台/指挥官图标。从 Root 向下伸出两条蓝色实线，分别连接左下方的绿色矩形"tech_support"（带扳手图标）和右下方的橙色矩形"sales_consultant"（带购物袋图标）。三个 Agent 之间有箭头表示 Transfer 路径：Root 到两个子 Agent 的向下箭头是蓝色实线，标注"transfer_to_agent"；两个子 Agent 到 Root 的向上箭头是绿色虚线，标注"转回父级"。两个子 Agent 之间有一条灰色虚线双向箭头，标注"peer transfer"。在 tech_support 节点旁有一个红色的禁止标志覆盖在向上和横向的箭头上，旁边标注"DisallowTransferToParent: true"和"DisallowTransferToPeers: true"——表示这个 Agent 的向上和横向转移被禁用了。sales_consultant 的箭头则正常显示（无禁止标志）。整体白色背景，树形结构清晰，禁止标志醒目。
>
> 整体目的：让读者直观理解 Agent Tree 中的控制权转移路径，以及 DisallowTransfer 标志如何限制转移方向。

## **8. IncludeContents：控制历史对话的可见性**

`IncludeContents` 是一个容易被忽略但在特定场景下非常关键的配置。它控制了 Agent 在执行时能否看到之前的对话历史。

默认值 `IncludeContentsDefault` 表示 Agent 可以看到完整的历史对话——这对于需要多轮对话上下文的场景是必要的。但如果你的 Agent 是一个"无状态"的处理器，比如一个只负责做文本分类的 Agent，每次调用只需要看当前输入、不需要历史记录，那么设为 `IncludeContentsNone` 可以减少 Token 消耗，同时避免历史对话中的信息干扰当前判断。

```go
// 文本分类 Agent —— 不需要历史对话，每次独立判断
classifierAgent, _ := llmagent.New(llmagent.Config{
    Name:            "classifier",
    Model:           m,
    Instruction:     "对输入文本进行分类，返回类别名称。",
    IncludeContents: llmagent.IncludeContentsNone, // 不包含历史对话
    OutputSchema: &genai.Schema{
        Type: genai.TypeObject,
        Properties: map[string]*genai.Schema{
            "category": {Type: genai.TypeString},
        },
    },
})
```

在多 Agent 的工作流场景中，这个配置特别有用。流水线上的每一步通常只关心上一步的输出（通过 `{output_key}` 模板变量读取），而不需要看整个对话的历史。把中间步骤的 Agent 设为 `IncludeContentsNone`，既节省 Token 又减少噪音。

## **9. 综合实战：配置一个生产级 Agent**

学了这么多配置项，最后我们把它们组合起来，构建一个接近生产级别的 Agent——一个智能翻译助手，它能根据用户的偏好设置动态调整行为，支持结构化输出，并且带有完整的监控回调：

```go
package main

import (
	"context"
	"fmt"
	"log"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/model"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
)

func main() {
	ctx := context.Background()
	m := NewDashScopeModel("qwen-plus")

	translator, err := llmagent.New(llmagent.Config{
		// 身份标识
		Name:        "smart_translator",
		Description: "智能翻译助手，支持中英文互译，可根据用户偏好调整翻译风格",

		// 模型配置
		Model: m,
		GenerateContentConfig: &genai.GenerateContentConfig{
			Temperature: genai.Ptr(float32(0.3)), // 翻译需要准确性，低温度
		},

		// 动态指令：根据用户偏好调整翻译风格
		InstructionProvider: func(ctx agent.ReadonlyContext) (string, error) {
			style := "正式"
			if state := ctx.State(); state != nil {
				if s, ok := state.Get("translation_style"); ok {
					style = fmt.Sprintf("%v", s)
				}
			}

			return fmt.Sprintf(`你是一个专业翻译助手，翻译风格为：%s。
规则：
- 用户输入中文则翻译成英文，输入英文则翻译成中文
- 返回 JSON 格式，包含原文、译文和使用的翻译风格
- 专业术语在译文中保留原文标注`, style), nil
		},

		// 输出约束：必须返回结构化 JSON
		OutputSchema: &genai.Schema{
			Type: genai.TypeObject,
			Properties: map[string]*genai.Schema{
				"source_text": {
					Type:        genai.TypeString,
					Description: "原文",
				},
				"translated_text": {
					Type:        genai.TypeString,
					Description: "译文",
				},
				"style": {
					Type:        genai.TypeString,
					Description: "翻译风格",
				},
			},
			Required: []string{"source_text", "translated_text", "style"},
		},

		// 保存输出到 State，方便后续流程使用
		OutputKey: "last_translation",

		// 监控回调
		AfterModelCallbacks: []llmagent.AfterModelCallback{
			func(ctx agent.CallbackContext, resp *model.LLMResponse, err error) (*model.LLMResponse, error) {
				if resp != nil && resp.UsageMetadata != nil {
					log.Printf("[翻译监控] Token 消耗: %d", resp.UsageMetadata.TotalTokenCount)
				}
				return nil, nil
			},
		},
	})
	if err != nil {
		log.Fatalf("创建翻译 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "translator_app",
		Agent:          translator,
		SessionService: sessionService,
	})

	// 场景1：正式风格翻译
	createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "translator_app",
		UserID:  "user_001",
		State: map[string]any{
			"translation_style": "正式学术",
		},
	})

	userMsg := genai.NewContentFromText("大模型的涌现能力是指模型在达到一定规模后突然表现出的新能力", "user")

	fmt.Println("=== 正式学术风格 ===")
	for event, err := range r.Run(ctx, "user_001", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
		if err != nil {
			continue
		}
		if event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Println(part.Text)
				}
			}
		}
	}

	// 场景2：口语化风格翻译
	createResp2, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "translator_app",
		UserID:  "user_002",
		State: map[string]any{
			"translation_style": "口语化、通俗易懂",
		},
	})

	fmt.Println("\n=== 口语化风格 ===")
	for event, err := range r.Run(ctx, "user_002", createResp2.Session.ID(), userMsg, agent.RunConfig{}) {
		if err != nil {
			continue
		}
		if event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Println(part.Text)
				}
			}
		}
	}
}
```

运行结果：
```
[翻译监控] Token 消耗: 215
=== 正式学术风格 ===
{"source_text":"大模型的涌现能力是指模型在达到一定规模后突然表现出的新能力","translated_text":"Emergent abilities of large language models refer to novel capabilities that suddenly manifest when the model reaches a certain scale.","style":"正式学术"}

[翻译监控] Token 消耗: 208
=== 口语化风格 ===
{"source_text":"大模型的涌现能力是指模型在达到一定规模后突然表现出的新能力","translated_text":"The emergent abilities of large models basically mean that once a model gets big enough, it suddenly picks up new tricks it couldn't do before.","style":"口语化、通俗易懂"}
```

这个例子把我们今天讲的核心配置项串了起来：`InstructionProvider` 实现动态指令、`OutputSchema` 约束结构化输出、`OutputKey` 保存结果到 State、`GenerateContentConfig` 控制模型行为、`AfterModelCallbacks` 做 Token 监控。每个配置项各司其职，组合在一起就是一个行为精准、可观测、可扩展的生产级 Agent。

## **10. 小结**

`llmagent.Config` 是你和 ADK 框架沟通的主要界面——你通过它告诉框架"我要一个什么样的 Agent"。从最基础的 Name 和 Instruction，到模板变量和动态指令的灵活性，再到 OutputSchema 的结构化约束和回调系统的可观测性，这些配置项构成了一个精密但不复杂的控制面板。关键不在于把所有字段都用上，而在于理解每个字段解决什么问题，这样当你遇到具体需求时，能立刻知道该用哪个旋钮来调。

如果说模型层是 Agent 的心脏，那 Config 就是它的神经系统——决定了 Agent 感知什么、思考什么、怎么行动、在哪些关键时刻允许你介入。把 Config 用好了，同样的模型能力可以被塑造成截然不同的 Agent 人格和行为模式，这正是 ADK Code-First 理念的精髓所在。

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
