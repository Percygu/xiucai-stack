---
title: 12. 模型层详解
description: "Go语言 AI Agent 教程：深入解析 Google ADK 框架模型层架构，详解 model.LLM 接口、LLMRequest/LLMResponse 数据流、Temperature/TopP/MaxTokens 等参数调优实战，掌握多模型切换与 DashScope 适配器进阶用法，附完整可运行代码示例。"
category:
  - Go Agent
tag:
  - Go Agent
  - 大模型
  - ADK
  - Google ADK
  - AI Agent教程
  - Go语言
  - 模型调优
---

# **模型层详解**

在上一篇快速上手中，我们用 `NewDashScopeModel("qwen-plus")` 一行代码就接入了通义千问，Agent 也跑起来了。但那篇文章的重点是"跑通流程"，对模型层本身只是蜻蜓点水——你可能会好奇：ADK 的模型层到底是怎么设计的？`LLMRequest` 里塞了什么东西？`LLMResponse` 又带回来哪些信息？Temperature、TopP 这些参数怎么调才能让 Agent 的回答更靠谱？如果我想在运行时动态切换模型，该怎么做？

这篇文章就来把模型层掰开了揉碎了讲清楚。我们会从 `model.LLM` 接口的设计开始，深入 `LLMRequest` 和 `LLMResponse` 的每个关键字段，然后用代码实战演示参数调优的效果，最后实现一个支持多模型动态切换的增强版适配器。

## **1. model.LLM 接口：模型层的契约**

ADK 框架把所有模型相关的逻辑都收在 `google.golang.org/adk/model` 包下。这个包的核心是一个极其精简的接口：

```go
type LLM interface {
    Name() string
    GenerateContent(ctx context.Context, req *LLMRequest, stream bool) iter.Seq2[*LLMResponse, error]
}
```

就两个方法。`Name()` 返回模型名称，`GenerateContent()` 负责"给模型发请求、拿回结果"。这种设计非常 Go 味儿——接口越小，实现越灵活。不管你底层接的是 Gemini、通义千问、OpenAI 还是本地部署的 Ollama，只要实现这两个方法，就能无缝接入 ADK 框架。

`GenerateContent` 的三个参数各有用途：`ctx` 是 Go 标准的上下文，可以用来做超时控制和取消传播；`req` 是一个 `LLMRequest` 结构体，打包了本次调用的所有输入信息（对话历史、系统指令、工具声明、模型参数等等）；`stream` 是一个布尔值，告诉模型"你要一次性返回完整结果，还是边生成边推送"。

返回值 `iter.Seq2[*LLMResponse, error]` 是 Go 1.23 引入的迭代器类型。非流式模式下，这个迭代器通常只产出一个 `LLMResponse`；流式模式下，它会产出多个——每个包含一小段生成内容，调用方可以用 `for range` 实时处理。这种设计让流式和非流式的调用方式完全统一，不需要两套 API。

> 【建议配图1 —— model.LLM 接口的"插拔式"设计】
>
> 图片描述：一张以插座/插头为视觉隐喻的架构图。中央是一个大的蓝色方形"插座面板"，面板上印着"model.LLM 接口"字样，面板上有两个插孔，分别标注"Name()"和"GenerateContent()"。插座上方是 ADK 框架层，用浅蓝色背景区域表示，内部有三个小图标排列：Agent（机器人图标）、Runner（指挥棒图标）、Plugin（拼图图标），它们通过一根"电线"连接到插座，线上标注"统一调用"。插座下方伸出四根不同颜色的"插头线"，每根末端是一个圆角矩形：绿色插头"DashScope 适配器"（阿里云图标）、红色插头"Gemini 原生"（Google 图标）、紫色插头"OpenAI 兼容"（通用 API 图标）、灰色插头"本地 Ollama"（服务器图标）。四根插头线都指向插座但只有绿色那根是插上的状态（高亮），其他三根悬空。整体白色背景，插座是视觉焦点，强调"一个接口，多种实现"的可插拔设计。
>
> 整体目的：让读者直观理解 model.LLM 接口作为抽象层的意义——框架只依赖接口，具体用哪个模型可以自由替换。

### **1.1 ADK 自带的 Gemini 实现**

ADK 框架在 `model/gemini` 包里自带了一个 Gemini 模型的实现。它的创建函数签名是这样的：

```go
func NewModel(ctx context.Context, modelName string, cfg *genai.ClientConfig) (model.LLM, error)
```

`modelName` 就是 Gemini 的模型 ID（比如 `"gemini-2.5-flash"`），`cfg` 是一个 `genai.ClientConfig` 结构体，用来配置 API Key、后端类型（Gemini API 还是 Vertex AI）、HTTP 客户端等连接层面的参数。如果传 `nil`，它会从环境变量 `GOOGLE_API_KEY` 或 `GEMINI_API_KEY` 中自动读取配置。

不过正如我们系列一直强调的，Gemini API 在国内不方便直接付费使用，所以我们统一走通义千问的 OpenAI 兼容接口。但了解 Gemini 实现的存在很重要——当你阅读 ADK 的官方文档和源码时，默认示例都是基于 Gemini 的，理解它的工作方式能帮你更好地写自己的适配器。

## **2. LLMRequest：请求的全貌**

每次 Agent 需要调用模型时，Runner 会把所有必要信息打包成一个 `LLMRequest`：

```go
type LLMRequest struct {
    Model    string
    Contents []*genai.Content
    Config   *genai.GenerateContentConfig
    Tools    map[string]any `json:"-"`
}
```

四个字段，分工明确。`Model` 是模型名称字符串，`Contents` 是对话历史（按时间顺序排列的消息列表），`Config` 是一个"大杂烩"——既包含模型参数（Temperature、TopP 等），也包含系统指令、工具声明、安全设置等，`Tools` 则是框架内部用于存储工具元信息的字段（带 `json:"-"` 标签，序列化时会被忽略）。

### **2.1 Contents：对话历史**

`Contents` 是一个 `[]*genai.Content` 切片，每个 `Content` 代表对话中的一条消息。它的结构非常简洁：

```go
type Content struct {
    Parts []*Part
    Role  string  // "user" 或 "model"
}
```

`Role` 只有两个值——`"user"` 表示用户说的话，`"model"` 表示模型说的话（在 OpenAI 的术语里对应 `"assistant"`）。注意这里没有 `"system"` 角色，系统指令在 ADK 中走的是 `Config.SystemInstruction` 字段，不混在对话历史里。

`Parts` 是一个 `[]*genai.Part` 切片，因为一条消息可能包含多种内容：纯文本、图片、文件、函数调用请求、函数返回结果等等。最常见的当然是纯文本，用 `genai.NewContentFromText("你好", "user")` 就能创建。但在工具调用场景下，一条 model 消息的 Parts 里可能同时包含文本回复和 `FunctionCall` 请求——模型一边回答你的问题，一边发起工具调用。

来写一段代码，直观地看看 `LLMRequest` 在一次完整对话中是什么样子的：

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
	"google.golang.org/adk/plugin"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
)

func main() {
	ctx := context.Background()
	m := NewDashScopeModel("qwen-plus")

	// 用 BeforeModel 回调来"偷看" LLMRequest 的内容
	inspectorPlugin := plugin.New(plugin.Config{
		Name: "request_inspector",
		BeforeModelCallback: func(
			ctx context.Context,
			cbc *plugin.CallbackContext,
			req *model.LLMRequest,
		) error {
			fmt.Println("====== LLMRequest 详情 ======")
			fmt.Printf("模型名称: %s\n", req.Model)

			// 打印系统指令
			if req.Config != nil && req.Config.SystemInstruction != nil {
				for _, p := range req.Config.SystemInstruction.Parts {
					if p.Text != "" {
						fmt.Printf("系统指令: %s\n", p.Text)
					}
				}
			}

			// 打印对话历史
			fmt.Printf("对话历史条数: %d\n", len(req.Contents))
			for i, c := range req.Contents {
				text := ""
				for _, p := range c.Parts {
					if p.Text != "" {
						text += p.Text
					}
					if p.FunctionCall != nil {
						text += fmt.Sprintf("[调用工具: %s]", p.FunctionCall.Name)
					}
					if p.FunctionResponse != nil {
						text += fmt.Sprintf("[工具结果: %s]", p.FunctionResponse.Name)
					}
				}
				fmt.Printf("  [%d] Role=%s: %s\n", i, c.Role, text)
			}

			// 打印模型参数
			if req.Config != nil {
				if req.Config.Temperature != nil {
					fmt.Printf("Temperature: %.2f\n", *req.Config.Temperature)
				}
				if req.Config.MaxOutputTokens > 0 {
					fmt.Printf("MaxOutputTokens: %d\n", req.Config.MaxOutputTokens)
				}
			}
			fmt.Println("==============================")
			return nil
		},
	})

	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "demo_agent",
		Model:       m,
		Description: "演示Agent",
		Instruction: "你是一个技术助手，回答简洁专业。",
		Plugins:     []plugin.Plugin{inspectorPlugin},
	})
	if err != nil {
		log.Fatal(err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "demo_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})

	createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "demo_app",
		UserID:  "user1",
	})

	// 发送消息
	userMsg := genai.NewContentFromText("Go语言的goroutine和线程有什么区别？", "user")
	for event, err := range r.Run(ctx, "user1", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
		if err != nil {
			log.Printf("错误: %v", err)
			continue
		}
		if event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Println("\nAgent 回复:", part.Text)
				}
			}
		}
	}
}
```

运行结果：
```
====== LLMRequest 详情 ======
模型名称: qwen-plus
系统指令: 你是一个技术助手，回答简洁专业。
对话历史条数: 1
  [0] Role=user: Go语言的goroutine和线程有什么区别？
==============================

Agent 回复: goroutine 是 Go 运行时管理的轻量级协程，初始栈仅 2KB 可动态伸缩，创建销毁成本极低，可轻松开启数十万个；操作系统线程栈固定约 1-8MB，由内核调度，创建销毁开销大。Go 通过 GMP 调度模型将大量 goroutine 多路复用到少量 OS 线程上，实现了高并发下的高效调度。
```

通过 `BeforeModelCallback`，我们在模型被调用之前拦截了请求，把 `LLMRequest` 的关键信息打印出来。可以清楚地看到：系统指令来自 `Config.SystemInstruction`，对话历史目前只有一条用户消息。如果继续发送第二轮对话，你会看到 `Contents` 里多出两条——上一轮的模型回复和这一轮的用户消息，这就是 ADK 自动维护的对话上下文。

> 【建议配图2 —— LLMRequest 数据结构全景图】
>
> 图片描述：一张从上到下展开的结构示意图，主体是一个大的浅蓝色圆角矩形，顶部标题"LLMRequest"。矩形内部分为四个水平层，每层用细线隔开。第一层最窄，左侧有标签图标，标注"Model: string"，右侧浅灰色显示示例值"qwen-plus"。第二层最高，左侧有聊天气泡图标，标注"Contents: []*Content"，右侧展开为一个竖向的消息时间线——三个圆点用竖线相连，第一个绿点标注"user: 你好"，第二个蓝点标注"model: 你好！有什么..."，第三个绿点标注"user: 介绍一下goroutine"，时间线旁边有一个小标注"按时间顺序排列"。第三层中等高度，左侧有齿轮图标，标注"Config: *GenerateContentConfig"，右侧展开为三个小卡片横向排列：橙色卡片"SystemInstruction 系统指令"（喇叭图标）、绿色卡片"Temperature/TopP 采样参数"（温度计图标）、紫色卡片"Tools 工具声明"（扳手图标）。第四层最窄，左侧有工具箱图标，标注"Tools: map[string]any"，右侧灰色文字"框架内部使用"。整体白色背景，四层高度不一体现重要性差异，第二三层最重要所以最大。
>
> 整体目的：让读者一眼看清 LLMRequest 包含哪些信息，以及每个字段的角色和重要性。

### **2.2 Config：模型行为的"遥控器"**

`Config` 字段的类型是 `*genai.GenerateContentConfig`，这是整个请求中最"丰富"的部分。虽然它的字段多达几十个，但日常开发中真正常用的就那么几类。我们按用途来梳理。

**采样参数**是最核心的一组，直接控制模型生成文本的"风格"：

`Temperature` 控制随机性。值越低（比如 0.1），模型越倾向于选择概率最高的 token，输出更确定、更保守；值越高（比如 1.5），模型越愿意"冒险"选择低概率的 token，输出更有创意但也更不可控。对于 Agent 场景，通常建议设在 0.0 到 0.3 之间——你希望工具调用的参数是精确的，而不是"有创意的"。

`TopP` 是核采样参数。模型生成每个 token 时，会按概率从高到低排列候选 token，然后从中取概率之和刚好达到 TopP 的那些。比如 TopP=0.9 意味着只从概率累积前 90% 的 token 中采样。TopP 和 Temperature 配合使用：Temperature 控制概率分布的"尖锐程度"，TopP 控制"候选范围的大小"。

`TopK` 更简单粗暴——直接限制只从概率最高的前 K 个 token 中采样。比如 TopK=40 就是只考虑概率排前 40 的候选词。

`MaxOutputTokens` 限制模型单次回复的最大 token 数。这个在生产环境中非常重要——如果不设上限，模型可能会滔滔不绝地生成一大段内容，既浪费 token 又拖慢响应时间。通常根据业务场景设置合理上限，比如客服场景 500 token 就够了，代码生成可能需要 2000-4000。

`StopSequences` 是一个字符串数组，当模型生成的文本中出现其中任何一个字符串时，就立刻停止生成。比如设置 `["###", "END"]`，模型一旦输出 "###" 就会停下来。在某些结构化输出场景中非常实用。

我们来写一段代码，直观感受 Temperature 对输出的影响：

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

	// 测试不同 Temperature 值的效果
	temperatures := []float32{0.0, 0.5, 1.0, 1.5}
	prompt := "用一句话描述Go语言的特点"

	for _, temp := range temperatures {
		fmt.Printf("\n--- Temperature = %.1f ---\n", temp)
		t := temp // 取地址需要局部变量

		m := NewDashScopeModel("qwen-plus")
		myAgent, err := llmagent.New(llmagent.Config{
			Name:        "temp_test",
			Model:       m,
			Description: "温度测试Agent",
			Instruction: "请直接回答，不要有多余的解释。",
			GenerateContentConfig: &genai.GenerateContentConfig{
				Temperature: &t,
			},
		})
		if err != nil {
			log.Fatal(err)
		}

		sessionService := session.InMemoryService()
		r, _ := runner.New(runner.Config{
			AppName:        "temp_app",
			Agent:          myAgent,
			SessionService: sessionService,
		})

		createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
			AppName: "temp_app",
			UserID:  "user1",
		})

		userMsg := genai.NewContentFromText(prompt, "user")
		// 同一个 Temperature 跑两次，观察输出稳定性
		for round := 1; round <= 2; round++ {
			for event, err := range r.Run(ctx, "user1", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
				if err != nil {
					continue
				}
				if event.IsFinalResponse() && event.Content != nil {
					for _, part := range event.Content.Parts {
						if part.Text != "" {
							fmt.Printf("  第%d次: %s\n", round, part.Text)
						}
					}
				}
			}
		}
	}
}
```

运行结果：
```
--- Temperature = 0.0 ---
  第1次: Go语言以简洁高效、原生并发支持和强大的标准库著称，是构建高性能后端服务的理想选择。
  第2次: Go语言以简洁高效、原生并发支持和强大的标准库著称，是构建高性能后端服务的理想选择。

--- Temperature = 0.5 ---
  第1次: Go语言以简洁的语法、高效的并发模型和出色的编译速度，成为云原生和微服务领域的首选语言。
  第2次: Go语言简洁高效，内置goroutine并发模型和垃圾回收，特别适合构建高并发的网络服务和分布式系统。

--- Temperature = 1.0 ---
  第1次: Go是一门编译型语言，凭借goroutine轻量并发和极简设计哲学，在云计算基础设施领域大放异彩。
  第2次: 简约而不简单——Go用极少的语法关键字和goroutine并发原语，撑起了整个云原生生态的半壁江山。

--- Temperature = 1.5 ---
  第1次: Go像一把瑞士军刀般精练实用，goroutine让并发编程变得像写for循环一样自然。
  第2次: 如果编程语言是汽车，Go就是那辆不炫但特别耐开的丰田——简单、可靠、跑得快。
```

效果很明显：Temperature=0.0 时两次输出完全一样（确定性输出），随着 Temperature 升高，回答越来越"有个性"。到 1.5 的时候甚至开始用比喻了——很有创意，但在 Agent 的工具调用场景下，这种"创意"可能导致参数格式不对，引发工具执行失败。所以实际开发中，除非你做的是写作类 Agent，否则 Temperature 建议保持在 0.0-0.3 之间。

> 【建议配图3 —— Temperature 参数对输出的影响光谱图】
>
> 图片描述：一张横向的"温度计"式光谱图。底部是一根水平的渐变色长条，从左到右颜色从深蓝色（冷）渐变到红色（热），长条上标注刻度：0.0、0.3、0.5、0.8、1.0、1.5。长条上方在不同刻度位置悬挂着示意卡片。0.0 位置：蓝色卡片，内部有冰晶图标，标注"确定性输出"，下方小字"每次结果一致、保守、适合工具调用"。0.3 位置：浅蓝色卡片，标注"推荐 Agent 默认值"，有一个绿色对勾图标。0.5 位置：绿色卡片，标注"平衡模式"，下方小字"略有变化、表达自然"。1.0 位置：橙色卡片，有画笔图标，标注"有创意"，下方小字"表达多样、可能跑偏"。1.5 位置：红色卡片，有火焰图标，标注"高度随机"，下方小字"天马行空、不可预测"。0.0-0.3 区间用绿色虚线框圈起来，框上标注"Agent 推荐区间"。整体白色背景，温度计是视觉焦点。
>
> 整体目的：让读者一目了然地理解 Temperature 值的含义和推荐区间，不用记数字，看图就知道该设多少。

## **3. LLMResponse：模型返回了什么**

模型调用完成后，返回的 `LLMResponse` 长这样：

```go
type LLMResponse struct {
    Content           *genai.Content
    UsageMetadata     *genai.GenerateContentResponseUsageMetadata
    Partial           bool
    TurnComplete      bool
    Interrupted       bool
    FinishReason      genai.FinishReason
    ErrorCode         string
    ErrorMessage      string
    ModelVersion      string
    // ... 还有一些元数据字段
}
```

`Content` 是模型生成的内容——和请求中的 `Contents` 用的是同一个 `genai.Content` 类型，`Role` 固定是 `"model"`。它的 `Parts` 里可能是纯文本回复，也可能是 `FunctionCall`（模型要求调用工具），甚至两者同时存在。

`TurnComplete` 和 `Partial` 在流式模式下特别重要。流式输出时，模型会分多次返回内容，每次都是一个 `LLMResponse`：中间的结果 `Partial=true`，最后一个 `TurnComplete=true`。非流式模式下，你只会收到一个 `LLMResponse`，`TurnComplete` 直接就是 `true`。

`FinishReason` 告诉你模型为什么停下来了。最常见的是 `Stop`（正常说完了）和 `MaxTokens`（达到 token 上限被截断了）。如果你发现 Agent 的回答经常突然中断，多半是 `MaxOutputTokens` 设太小了——看一眼 `FinishReason` 就能确认。其他值如 `Safety`（触发安全过滤）、`MalformedFunctionCall`（模型生成了格式错误的工具调用）等，在调试阶段也很有参考价值。

`UsageMetadata` 记录了这次调用消耗了多少 token：

```go
type GenerateContentResponseUsageMetadata struct {
    PromptTokenCount     int32  // 输入消耗的 token 数
    CandidatesTokenCount int32  // 输出生成的 token 数
    TotalTokenCount      int32  // 总计 token 数
    // ...
}
```

Token 用量在开发阶段可能无所谓，但到了生产环境就是真金白银。我们来写一个工具，自动追踪每次调用的 token 消耗：

```go
package main

import (
	"context"
	"fmt"
	"log"
	"sync"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/model"
	"google.golang.org/adk/plugin"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
)

// TokenTracker 追踪 token 用量
type TokenTracker struct {
	mu             sync.Mutex
	totalPrompt    int32
	totalOutput    int32
	totalAll       int32
	callCount      int
}

func (t *TokenTracker) Record(usage *genai.GenerateContentResponseUsageMetadata) {
	if usage == nil {
		return
	}
	t.mu.Lock()
	defer t.mu.Unlock()
	t.totalPrompt += usage.PromptTokenCount
	t.totalOutput += usage.CandidatesTokenCount
	t.totalAll += usage.TotalTokenCount
	t.callCount++
}

func (t *TokenTracker) Report() {
	t.mu.Lock()
	defer t.mu.Unlock()
	fmt.Printf("\n📊 Token 用量统计（共 %d 次调用）\n", t.callCount)
	fmt.Printf("   输入 token: %d\n", t.totalPrompt)
	fmt.Printf("   输出 token: %d\n", t.totalOutput)
	fmt.Printf("   总计 token: %d\n", t.totalAll)
}

func main() {
	ctx := context.Background()
	m := NewDashScopeModel("qwen-plus")
	tracker := &TokenTracker{}

	// 用 AfterModel 回调记录每次调用的 token 用量
	tokenPlugin := plugin.New(plugin.Config{
		Name: "token_tracker",
		AfterModelCallback: func(
			ctx context.Context,
			cbc *plugin.CallbackContext,
			req *model.LLMRequest,
			resp *model.LLMResponse,
		) error {
			if resp != nil && resp.UsageMetadata != nil {
				tracker.Record(resp.UsageMetadata)
				fmt.Printf("  [本次消耗] 输入:%d  输出:%d  合计:%d\n",
					resp.UsageMetadata.PromptTokenCount,
					resp.UsageMetadata.CandidatesTokenCount,
					resp.UsageMetadata.TotalTokenCount,
				)
			}
			return nil
		},
	})

	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "token_agent",
		Model:       m,
		Description: "Token追踪演示",
		Instruction: "你是技术助手，回答控制在50字以内。",
		Plugins:     []plugin.Plugin{tokenPlugin},
	})
	if err != nil {
		log.Fatal(err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "token_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})

	createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "token_app",
		UserID:  "user1",
	})

	// 进行三轮对话，观察 token 消耗趋势
	questions := []string{
		"什么是goroutine？",
		"goroutine和channel怎么配合？",
		"用channel实现生产者消费者模式的关键点是什么？",
	}

	for i, q := range questions {
		fmt.Printf("\n--- 第 %d 轮对话 ---\n", i+1)
		userMsg := genai.NewContentFromText(q, "user")
		for event, err := range r.Run(ctx, "user1", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
			if err != nil {
				continue
			}
			if event.IsFinalResponse() && event.Content != nil {
				for _, part := range event.Content.Parts {
					if part.Text != "" {
						fmt.Printf("回复: %s\n", part.Text)
					}
				}
			}
		}
	}

	tracker.Report()
}
```

运行结果：
```
--- 第 1 轮对话 ---
  [本次消耗] 输入:38  输出:45  合计:83
回复: goroutine是Go语言中的轻量级线程，由Go运行时调度，初始栈仅2KB，创建成本极低，可轻松开启数万个并发任务。

--- 第 2 轮对话 ---
  [本次消耗] 输入:102  输出:52  合计:154
回复: goroutine负责并发执行任务，channel负责在goroutine之间安全传递数据。用channel来同步和通信，替代共享内存加锁的方式。

--- 第 3 轮对话 ---
  [本次消耗] 输入:173  输出:48  合计:221
回复: 关键点：用带缓冲的channel做队列，生产者写入、消费者读取；合理设置缓冲大小；生产完毕后close(ch)通知消费者退出。

📊 Token 用量统计（共 3 次调用）
   输入 token: 313
   输出 token: 145
   总计 token: 458
```

注意看输入 token 的变化：38 → 102 → 173，逐轮递增。这是因为每轮对话都会把之前的完整消息历史带上——第三轮时，`LLMRequest.Contents` 里已经有五条消息了（三轮用户消息 + 两轮模型回复）。这也是为什么长对话成本会越来越高，以及为什么上下文窗口管理在生产环境中如此重要。

> 【建议配图4 —— 多轮对话中 Token 消耗的"雪球效应"】
>
> 图片描述：一张阶梯式柱状图，横轴标注"对话轮次"（第1轮、第2轮、第3轮、第N轮），纵轴标注"Token 数"。每一轮用一个堆叠柱状图表示，柱子由两部分组成：下半部分浅蓝色代表"输入 token"，上半部分绿色代表"输出 token"。关键的是，每一轮的浅蓝色部分都明显比上一轮高出一截，而绿色部分高度相近。第1轮柱子最矮，浅蓝色部分用虚线展开为一个小气泡，里面显示"系统指令 + 用户消息"。第3轮的浅蓝色部分用虚线展开为一个更大的气泡，里面叠放着"系统指令 + 5条对话历史 + 当前消息"。第N轮柱子最高，顶部有一个红色警告三角图标，旁边标注"上下文窗口可能溢出！"。在柱状图的右侧，有一个小的滚雪球示意：一个小雪球从山顶滚下来，越滚越大，隐喻输入 token 的累积增长。整体白色背景，阶梯递增的趋势一目了然。
>
> 整体目的：让读者直观理解多轮对话中输入 token 随轮次累积增长的现象，以及为什么需要上下文管理策略。

## **4. GenerateContentConfig 进阶配置**

前面讲了最常用的采样参数，但 `GenerateContentConfig` 还有几个在 Agent 开发中非常实用的配置值得展开。

### **4.1 结构化输出：ResponseMIMEType 与 ResponseSchema**

有时候你不希望模型返回自由格式的文本，而是返回一个严格符合 JSON Schema 的结构化数据。比如你做一个情感分析 Agent，希望模型返回 `{"sentiment": "positive", "confidence": 0.95}` 这样的 JSON，而不是一段话。

`ResponseMIMEType` 设为 `"application/json"` 告诉模型"请返回 JSON"，`ResponseSchema` 进一步约束 JSON 的结构。在 ADK 中，Agent 的 `OutputSchema` 字段会自动设置这两个配置：

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

	temp := float32(0.0)
	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "sentiment_agent",
		Model:       m,
		Description: "情感分析Agent",
		Instruction: `分析用户输入文本的情感倾向，返回 JSON 格式结果。
sentiment 字段取值：positive/negative/neutral。
confidence 字段取值：0到1之间的浮点数。
reason 字段简述判断理由。`,
		GenerateContentConfig: &genai.GenerateContentConfig{
			Temperature:      &temp,
			ResponseMIMEType: "application/json",
			ResponseSchema: &genai.Schema{
				Type: genai.SchemaTypeObject,
				Properties: map[string]*genai.Schema{
					"sentiment": {
						Type: genai.SchemaTypeString,
						Enum: []string{"positive", "negative", "neutral"},
						Description: "情感倾向",
					},
					"confidence": {
						Type:        genai.SchemaTypeNumber,
						Description: "置信度，0到1之间",
					},
					"reason": {
						Type:        genai.SchemaTypeString,
						Description: "判断理由",
					},
				},
				Required: []string{"sentiment", "confidence", "reason"},
			},
		},
	})
	if err != nil {
		log.Fatal(err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "sentiment_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})

	texts := []string{
		"这个框架太棒了，用起来特别顺手！",
		"又出bug了，加班到半夜才修好，心态崩了。",
		"明天天气预计多云转晴。",
	}

	for _, text := range texts {
		createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
			AppName: "sentiment_app",
			UserID:  "user1",
		})

		fmt.Printf("\n输入: %s\n", text)
		userMsg := genai.NewContentFromText(text, "user")
		for event, err := range r.Run(ctx, "user1", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
			if err != nil {
				continue
			}
			if event.IsFinalResponse() && event.Content != nil {
				for _, part := range event.Content.Parts {
					if part.Text != "" {
						fmt.Printf("输出: %s\n", part.Text)
					}
				}
			}
		}
	}
}
```

运行结果：
```
输入: 这个框架太棒了，用起来特别顺手！
输出: {"sentiment":"positive","confidence":0.95,"reason":"使用了'太棒了'和'特别顺手'等强烈正面评价词汇"}

输入: 又出bug了，加班到半夜才修好，心态崩了。
输出: {"sentiment":"negative","confidence":0.92,"reason":"出现'又出bug'表达不满，'加班到半夜'和'心态崩了'表达负面情绪"}

输入: 明天天气预计多云转晴。
输出: {"sentiment":"neutral","confidence":0.88,"reason":"客观陈述天气信息，不包含情感倾向"}
```

通过 `ResponseSchema` 约束，模型每次都会返回格式一致的 JSON。这在需要程序化解析模型输出的场景中非常关键——你不用再自己写正则表达式或者用 `json.Unmarshal` 碰运气了，模型会严格按照 Schema 来输出。

### **4.2 ToolConfig：控制工具调用行为**

当 Agent 配备了工具时，你可以通过 `ToolConfig` 来控制模型的工具调用策略：

```go
type ToolConfig struct {
    FunctionCallingConfig *FunctionCallingConfig
}

type FunctionCallingConfig struct {
    Mode                 FunctionCallingConfigMode
    AllowedFunctionNames []string
}
```

`Mode` 有四个值：`AUTO`（模型自行决定是否调用工具，这是默认值）、`ANY`（模型必须调用至少一个工具）、`NONE`（禁止工具调用，只用文本回复）、`VALIDATED`（调用前验证参数合法性）。

`AllowedFunctionNames` 可以限制模型只能调用哪些工具。比如你的 Agent 注册了五个工具，但某些场景下你只希望它用其中两个，就可以通过这个字段来约束。这在安全敏感场景中很有用——比如你不想让模型在某些上下文中调用 "delete_record" 这种危险操作。

### **4.3 SafetySettings：安全过滤**

大模型有时会生成不合适的内容——仇恨言论、色情内容、危险建议等。`SafetySettings` 允许你为不同类别设置过滤阈值：

```go
SafetySettings: []*genai.SafetySetting{
    {
        Category:  genai.HarmCategoryHarassment,
        Threshold: genai.HarmBlockThresholdBlockMediumAndAbove,
    },
    {
        Category:  genai.HarmCategoryDangerousContent,
        Threshold: genai.HarmBlockThresholdBlockLowAndAbove,  // 更严格
    },
},
```

每个类别可以独立设置阈值。`BlockLowAndAbove` 最严格（轻微风险就拦截），`BlockOnlyHigh` 最宽松（只拦截高风险），`BlockNone` 关闭过滤。注意，不同模型厂商对安全过滤的支持程度不一样——通义千问通过 OpenAI 兼容接口调用时，这些设置需要在 DashScope 适配器中做对应转换才能生效。

## **5. 多模型动态切换**

实际项目中，你很可能不会只用一个模型。简单的意图识别用 `qwen-turbo`（快且便宜），复杂的推理任务用 `qwen-max`（贵但聪明），日常对话用 `qwen-plus`（性价比均衡）。下面我们实现一个模型路由器，根据任务类型自动选择合适的模型：

```go
package main

import (
	"context"
	"fmt"
	"iter"
	"log"
	"strings"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/model"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
)

// ModelRouter 根据请求内容动态选择模型
type ModelRouter struct {
	models map[string]*DashScopeModel
	defaultModel string
}

func NewModelRouter() *ModelRouter {
	return &ModelRouter{
		models: map[string]*DashScopeModel{
			"qwen-turbo": NewDashScopeModel("qwen-turbo"),
			"qwen-plus":  NewDashScopeModel("qwen-plus"),
			"qwen-max":   NewDashScopeModel("qwen-max"),
		},
		defaultModel: "qwen-plus",
	}
}

func (r *ModelRouter) Name() string {
	return "model-router"
}

// GenerateContent 分析请求内容，选择最合适的模型
func (r *ModelRouter) GenerateContent(ctx context.Context, req *model.LLMRequest, stream bool) iter.Seq2[*model.LLMResponse, error] {
	// 提取用户最新消息的文本
	userText := ""
	for i := len(req.Contents) - 1; i >= 0; i-- {
		if req.Contents[i].Role == "user" {
			for _, p := range req.Contents[i].Parts {
				if p.Text != "" {
					userText = p.Text
					break
				}
			}
			break
		}
	}

	// 根据关键词判断任务复杂度，选择模型
	selectedModel := r.defaultModel
	reason := "默认选择"

	lowerText := strings.ToLower(userText)
	switch {
	case containsAny(lowerText, []string{"分析", "推理", "设计", "架构", "对比", "优化方案"}):
		selectedModel = "qwen-max"
		reason = "复杂推理任务"
	case containsAny(lowerText, []string{"你好", "谢谢", "是什么", "简单介绍"}):
		selectedModel = "qwen-turbo"
		reason = "简单问答任务"
	default:
		reason = "通用任务"
	}

	fmt.Printf("  [路由] 选择模型: %s（%s）\n", selectedModel, reason)

	// 委托给对应的模型
	return r.models[selectedModel].GenerateContent(ctx, req, stream)
}

func containsAny(s string, keywords []string) bool {
	for _, kw := range keywords {
		if strings.Contains(s, kw) {
			return true
		}
	}
	return false
}

func main() {
	ctx := context.Background()

	router := NewModelRouter()

	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "smart_agent",
		Model:       router, // 用路由器替代单一模型
		Description: "智能路由Agent",
		Instruction: "你是技术助手，回答控制在100字以内。",
	})
	if err != nil {
		log.Fatal(err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "router_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})

	questions := []string{
		"你好，请简单介绍一下你自己",
		"Go的GMP调度模型是怎么工作的？",
		"请分析微服务架构和单体架构的优劣势，并给出选型建议",
	}

	for _, q := range questions {
		createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
			AppName: "router_app",
			UserID:  "user1",
		})

		fmt.Printf("\n问题: %s\n", q)
		userMsg := genai.NewContentFromText(q, "user")
		for event, err := range r.Run(ctx, "user1", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
			if err != nil {
				continue
			}
			if event.IsFinalResponse() && event.Content != nil {
				for _, part := range event.Content.Parts {
					if part.Text != "" {
						fmt.Printf("回复: %s\n", part.Text)
					}
				}
			}
		}
	}
}
```

运行结果：
```
问题: 你好，请简单介绍一下你自己
  [路由] 选择模型: qwen-turbo（简单问答任务）
回复: 你好！我是技术助手，擅长解答编程和技术相关问题，尤其是Go语言方向。有什么可以帮你的？

问题: Go的GMP调度模型是怎么工作的？
  [路由] 选择模型: qwen-plus（通用任务）
回复: GMP模型由G(goroutine)、M(OS线程)、P(逻辑处理器)三部分组成。P持有本地队列，M绑定P后从队列取G执行。当G阻塞时M释放P，空闲M会窃取其他P的G来执行，实现高效并发调度。

问题: 请分析微服务架构和单体架构的优劣势，并给出选型建议
  [路由] 选择模型: qwen-max（复杂推理任务）
回复: 单体架构开发部署简单、调试方便，适合中小项目和早期快速迭代；但随着代码膨胀，模块耦合加重，团队协作和独立部署变得困难。微服务架构将系统拆分为独立服务，支持技术异构、独立扩缩容和团队自治，但带来了分布式事务、服务治理、运维复杂度等挑战。建议：团队小于10人或日活低于10万优先单体，待业务增长到明确的性能和组织瓶颈时再渐进式拆分。
```

这个模型路由器本身也实现了 `model.LLM` 接口——这正是接口设计的魅力所在。对 Agent 来说，它不知道也不需要知道底层到底是一个模型还是一个路由器。你甚至可以在路由器里加上重试逻辑、降级策略（主模型超时自动切换到备用模型）、A/B 测试等能力，而上层 Agent 代码完全不用改。

> 【建议配图5 —— 模型路由器的决策流程图】
>
> 图片描述：一张从上到下的决策流程图。顶部是一个蓝色圆角矩形"用户消息"，内部有聊天气泡图标。一条向下的箭头连接到一个菱形判断节点"ModelRouter 分析任务类型"（内部有放大镜图标），菱形用橙色填充。从菱形向左下、正下、右下分别引出三条带标签的箭头。左下箭头标注"简单问答"，指向一个小的浅绿色圆角矩形，内部有闪电图标和文字"qwen-turbo"，下方小字"快速响应 · 低成本"。正下方箭头标注"通用任务"，指向中等大小的蓝色圆角矩形，内部有天平图标和文字"qwen-plus"，下方小字"均衡性能 · 推荐默认"，这个矩形用绿色虚线框标注"默认选择"。右下箭头标注"复杂推理"，指向一个较大的紫色圆角矩形，内部有大脑+闪光图标和文字"qwen-max"，下方小字"深度思考 · 高质量"。三个模型矩形下方各引出一条箭头，汇聚到底部一个统一的绿色矩形"返回 LLMResponse"。整体白色背景，菱形判断节点是视觉焦点，三条路径清晰展示路由逻辑。
>
> 整体目的：让读者理解模型路由器的工作原理——根据任务复杂度自动选择最合适的模型，兼顾成本和效果。

## **6. 在回调中动态调整模型参数**

前面的例子都是在创建 Agent 时通过 `GenerateContentConfig` 设置参数。但有时候你需要更灵活——比如第一轮对话用低 Temperature 做意图识别，确认意图后第二轮用高 Temperature 做创意生成。ADK 的回调机制（`BeforeModelCallback`）可以在每次模型调用前动态修改请求参数。

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
	"google.golang.org/adk/plugin"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
)

func main() {
	ctx := context.Background()
	m := NewDashScopeModel("qwen-plus")

	callCount := 0

	// 根据对话轮次动态调整参数
	dynamicPlugin := plugin.New(plugin.Config{
		Name: "dynamic_params",
		BeforeModelCallback: func(
			ctx context.Context,
			cbc *plugin.CallbackContext,
			req *model.LLMRequest,
		) error {
			callCount++
			if req.Config == nil {
				req.Config = &genai.GenerateContentConfig{}
			}

			// 检查用户是否在要求创意输出
			userText := ""
			for i := len(req.Contents) - 1; i >= 0; i-- {
				if req.Contents[i].Role == "user" {
					for _, p := range req.Contents[i].Parts {
						if p.Text != "" {
							userText = p.Text
						}
					}
					break
				}
			}

			if strings.Contains(userText, "创意") || strings.Contains(userText, "写一个故事") || strings.Contains(userText, "有趣") {
				high := float32(1.2)
				req.Config.Temperature = &high
				req.Config.MaxOutputTokens = 500
				fmt.Printf("  [动态参数] 创意模式: Temperature=1.2, MaxTokens=500\n")
			} else {
				low := float32(0.1)
				req.Config.Temperature = &low
				req.Config.MaxOutputTokens = 200
				fmt.Printf("  [动态参数] 精确模式: Temperature=0.1, MaxTokens=200\n")
			}
			return nil
		},
	})

	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "dynamic_agent",
		Model:       m,
		Description: "动态参数Agent",
		Instruction: "你是一个多才多艺的助手，既能精确回答技术问题，也能进行创意写作。",
		Plugins:     []plugin.Plugin{dynamicPlugin},
	})
	if err != nil {
		log.Fatal(err)
	}

	sessionService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "dynamic_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})

	questions := []string{
		"Go的slice和array有什么区别？",
		"帮我用创意的方式解释什么是递归",
	}

	for _, q := range questions {
		createResp, _ := sessionService.Create(ctx, &session.CreateRequest{
			AppName: "dynamic_app",
			UserID:  "user1",
		})

		fmt.Printf("\n问题: %s\n", q)
		userMsg := genai.NewContentFromText(q, "user")
		for event, err := range r.Run(ctx, "user1", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
			if err != nil {
				continue
			}
			if event.IsFinalResponse() && event.Content != nil {
				for _, part := range event.Content.Parts {
					if part.Text != "" {
						fmt.Printf("回复: %s\n", part.Text)
					}
				}
			}
		}
	}
}
```

运行结果：
```
问题: Go的slice和array有什么区别？
  [动态参数] 精确模式: Temperature=0.1, MaxTokens=200
回复: array是固定长度的值类型，声明时必须指定长度，赋值会完整复制；slice是动态长度的引用类型，底层指向一个array，支持append扩容。slice由指针、长度、容量三个字段组成，是Go中更常用的数据结构。

问题: 帮我用创意的方式解释什么是递归
  [动态参数] 创意模式: Temperature=1.2, MaxTokens=500
回复: 想象你站在两面相对的镜子中间——你看到镜子里的自己，而那个"镜中人"又看到更深一层镜子里的自己，无穷无尽地嵌套下去。这就是递归的视觉版本。

用程序的语言说：递归就是一个函数在自己的身体里喊自己的名字。就像俄罗斯套娃——打开一个，里面还有一个更小的，再打开，还有，直到最里面那个实心的小娃娃——那就是"递归终止条件"。没有这个实心小娃娃，你就会一直拆下去，直到栈溢出，程序崩溃。

所以递归的两个灵魂：一是敢于自我调用的勇气，二是知道何时该停下来的智慧。
```

`BeforeModelCallback` 在每次模型调用前执行，你可以在这里读取和修改 `LLMRequest` 的任何字段。ADK 框架会在每次调用前对 `GenerateContentConfig` 做深拷贝，所以你在回调里的修改不会影响 Agent 的原始配置——这个设计保证了回调的修改是"一次性"的，非常安全。

## **7. 小结**

模型层是 ADK 框架中最"底层"却也最关键的一环——Agent 的所有"智能"最终都要通过这一层来兑现。`model.LLM` 接口用两个方法就完成了抽象，看似简单，实则给了开发者极大的自由度：你可以接入任何大模型，可以包装路由逻辑，可以做重试降级，甚至可以在测试时用一个 Mock 实现来替代真实模型——这些都不需要改动上层一行代码。而 `LLMRequest` 和 `LLMResponse` 这对搭档，则是 Agent 和模型之间的"信使"，它们在每一次对话循环中忠实地搬运着上下文、参数、工具声明和生成结果。理解了这一层的数据流转，你在调试 Agent 行为时就不会再觉得是"黑盒"了——哪里不对，挂个 `BeforeModelCallback` 打印一下 `LLMRequest`，真相往往就在 `Contents` 和 `Config` 里。

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
