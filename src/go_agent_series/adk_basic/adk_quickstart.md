---
title: 11. ADK快速上手
description: "Go语言 AI Agent 开发实战教程：基于 Google ADK 框架从零搭建第一个智能体应用，手把手教你环境配置、模型接入通义千问、Runner 事件流驱动、Function Calling 工具调用与 Launcher 一键启动 Web UI，完整代码可直接运行。"
category:
  - Go Agent
tag:
  - Go Agent
  - 大模型
  - ADK
  - Google ADK
  - AI Agent教程
  - Go语言
  - Function Calling
---

# **ADK快速上手**

前面十篇文章，我们一路从大模型基础聊到 Agent 认知，又在上一篇完成了 ADK 框架的全景扫描——你已经知道 ADK 有 Agent、Runner、Session、Tool、Plugin、Memory 这六大核心组件，也知道了它 Code-First 的设计哲学。但说实话，光看架构图和概念解释，就像看菜谱不动手——再精彩也尝不出味道。

这篇文章，我们就正式动手。目标很明确：从零开始，搭建开发环境，创建你的第一个 ADK Agent，让它真正跑起来——不仅能对话，还能调用工具，最后用 Launcher 一键启动 Web UI。整个过程一步一步来，你只要跟着敲代码，就能在自己的电脑上跑出一个有模有样的 AI Agent。

## **1. 环境准备**

在写代码之前，有几件事情需要先准备好。

### **1.1 Go 版本要求**

ADK Go 使用了 Go 1.23 引入的 `iter.Seq2`（range over function）等新特性，所以你的 Go 版本**必须 >= 1.23**。打开终端确认一下：

```bash
go version
# 输出类似：go version go1.23.0 darwin/arm64
```

如果版本太低，去 [Go 官网](https://go.dev/dl/) 下载最新版本安装即可。

### **1.2 初始化项目**

创建一个干净的项目目录：

```bash
mkdir adk-quickstart && cd adk-quickstart
go mod init adk-quickstart
```

然后安装两个核心依赖——ADK 框架本身和 OpenAI 兼容 SDK（用于对接通义千问）：

```bash
go get google.golang.org/adk
go get github.com/sashabaranov/go-openai
```

ADK 会自动拉取 `google.golang.org/genai` 等传递依赖，不需要你手动安装。

### **1.3 配置通义千问 API Key**

ADK 官方示例默认用 Gemini 模型，但因为 Gemini API 在国内无法直接付费使用，我们整个系列统一使用**通义千问（DashScope）**的 OpenAI 兼容接口。如果你还没有 API Key，去[阿里云百炼平台](https://bailian.console.aliyun.com/)免费申请一个，然后设置环境变量：

```bash
export DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

> 【建议配图1 —— ADK 快速上手环境搭建路线图】
>
> 图片描述：一张从左到右的水平流程图，包含四个步骤节点。第一个节点是蓝色圆角矩形，内部有 Gopher 吉祥物图标，下方标注"Go >= 1.23"；一条蓝色实线箭头连接到第二个绿色节点，内部有文件夹+齿轮图标，标注"go mod init + go get"；箭头继续连接第三个橙色节点，内部有钥匙图标，标注"DASHSCOPE_API_KEY"；最后箭头指向第四个紫色节点，内部有火箭图标，标注"开始编码！"。四个节点大小递增，最后的"开始编码"最大最醒目。节点之间的箭头上方分别标注简短提示："确认版本"、"安装依赖"、"配置密钥"。整体白色背景，步骤清晰，节奏感强。
>
> 整体目的：让读者一眼看清环境搭建的完整步骤和顺序，降低"开始动手"的心理门槛。

### **1.4 项目结构**

我们的 quickstart 项目最终会长这样：

```
adk-quickstart/
├── go.mod
├── go.sum
├── dashscope.go    # 通义千问模型适配器
└── main.go         # Agent 主程序
```

`dashscope.go` 是我们自己写的模型适配器，负责把 ADK 的模型接口桥接到通义千问的 API；`main.go` 是 Agent 的主程序。两个文件，就这么简单。

## **2. 接入通义千问：DashScope 模型适配器**

ADK 的模型层通过 `model.LLM` 接口来抽象，框架自带了 Gemini 的实现（`model/gemini` 包）。但我们要用通义千问，所以得自己实现一个适配器——别担心，这个接口只有两个方法，并没有想象中复杂。

先来看看 `model.LLM` 接口长什么样：

```go
type LLM interface {
    Name() string
    GenerateContent(ctx context.Context, req *LLMRequest, stream bool) iter.Seq2[*LLMResponse, error]
}
```

`Name()` 返回模型名称，`GenerateContent()` 负责调用大模型生成回复。入参是一个 `LLMRequest`（包含对话历史、系统指令、工具声明等），返回值是一个 `iter.Seq2` 事件流——这是 Go 1.23 的新语法，允许你用 `for range` 来遍历结果。

我们要做的事情，本质上就是一个"翻译官"的工作：把 ADK 内部的 `genai.Content` 格式转成 OpenAI 的 `ChatCompletionMessage` 格式，调用通义千问的 API，再把响应转回来。

> 【建议配图2 —— DashScope 模型适配器桥接架构图】
>
> 图片描述：一张左中右三段式的桥接架构图。左侧是一个蓝色区域，标题"ADK 框架内部"，内部有三个堆叠的小矩形分别标注"genai.Content"（对话消息图标）、"genai.Tool"（扳手图标）、"genai.GenerateContentConfig"（齿轮图标），三者汇聚成一条向右的蓝色粗箭头，箭头上标注"LLMRequest"。中间是一个醒目的桥梁形状（拱桥侧视图），桥面上站着一个翻译官/中间人图标（戴耳机的小人），桥体标注"DashScope 适配器"，桥面上方有两条反向的小箭头，上面那条标注"genai → OpenAI 格式转换"，下面那条标注"OpenAI → genai 格式转换"。右侧是一个绿色区域，标题"通义千问 API"，内部有阿里云 logo 和"DashScope"文字，下方标注"OpenAI 兼容协议"。桥的左端连接蓝色区域，右端连接绿色区域。整体白色背景，桥梁是视觉焦点。
>
> 整体目的：让读者直观理解适配器在 ADK 和通义千问之间扮演的"翻译桥梁"角色，以及数据格式转换的双向流程。

下面是完整的 `dashscope.go` 代码。代码有点长，但逻辑清晰——我会在代码后面逐块讲解：

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"iter"
	"os"
	"strings"

	openai "github.com/sashabaranov/go-openai"
	"google.golang.org/genai"

	"google.golang.org/adk/model"
)

// DashScopeModel 实现 model.LLM 接口，通过 OpenAI 兼容协议接入通义千问
type DashScopeModel struct {
	client      *openai.Client
	modelName   string
	toolCallIDs map[string]string // 保存工具调用的 ID 映射（函数名 → tool_call_id）
}

// NewDashScopeModel 创建一个通义千问模型实例
func NewDashScopeModel(modelName string) *DashScopeModel {
	cfg := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
	cfg.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	return &DashScopeModel{
		client:      openai.NewClientWithConfig(cfg),
		modelName:   modelName,
		toolCallIDs: make(map[string]string),
	}
}

func (m *DashScopeModel) Name() string {
	return m.modelName
}

// GenerateContent 调用通义千问生成回复，返回事件流
func (m *DashScopeModel) GenerateContent(ctx context.Context, req *model.LLMRequest, stream bool) iter.Seq2[*model.LLMResponse, error] {
	return func(yield func(*model.LLMResponse, error) bool) {
		// 1. 构造 OpenAI 格式的消息列表
		var messages []openai.ChatCompletionMessage

		// 处理系统指令（Instruction）
		if req.Config != nil && req.Config.SystemInstruction != nil {
			sysText := extractText(req.Config.SystemInstruction)
			if sysText != "" {
				messages = append(messages, openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleSystem,
					Content: sysText,
				})
			}
		}

		// 转换对话历史
		for _, content := range req.Contents {
			msgs := m.contentToMessages(content)
			messages = append(messages, msgs...)
		}

		// 2. 转换工具声明
		var tools []openai.Tool
		if req.Config != nil {
			for _, t := range req.Config.Tools {
				if t == nil {
					continue
				}
				for _, fd := range t.FunctionDeclarations {
					tools = append(tools, openai.Tool{
						Type: openai.ToolTypeFunction,
						Function: &openai.FunctionDefinition{
							Name:        fd.Name,
							Description: fd.Description,
							Parameters:  schemaToMap(fd.Parameters),
						},
					})
				}
			}
		}

		// 3. 调用通义千问 API
		chatReq := openai.ChatCompletionRequest{
			Model:    m.modelName,
			Messages: messages,
		}
		if len(tools) > 0 {
			chatReq.Tools = tools
		}

		resp, err := m.client.CreateChatCompletion(ctx, chatReq)
		if err != nil {
			yield(nil, fmt.Errorf("调用通义千问失败: %w", err))
			return
		}
		if len(resp.Choices) == 0 {
			yield(nil, fmt.Errorf("模型返回空响应"))
			return
		}

		// 4. 转换响应
		choice := resp.Choices[0]
		llmResp := &model.LLMResponse{
			Content:      m.messageToContent(choice.Message),
			TurnComplete: true,
		}

		// 保存工具调用 ID 映射（供下一轮转换 FunctionResponse 时使用）
		m.toolCallIDs = make(map[string]string)
		for _, tc := range choice.Message.ToolCalls {
			m.toolCallIDs[tc.Function.Name] = tc.ID
		}

		// 设置完成原因
		if choice.FinishReason == openai.FinishReasonStop || choice.FinishReason == openai.FinishReasonToolCalls {
			llmResp.FinishReason = genai.FinishReasonStop
		}

		// Token 用量统计
		if resp.Usage.TotalTokens > 0 {
			llmResp.UsageMetadata = &genai.GenerateContentResponseUsageMetadata{
				PromptTokenCount:     int32(resp.Usage.PromptTokens),
				CandidatesTokenCount: int32(resp.Usage.CompletionTokens),
				TotalTokenCount:      int32(resp.Usage.TotalTokens),
			}
		}

		yield(llmResp, nil)
	}
}

// ============ 以下是格式转换的辅助函数 ============

// extractText 从 genai.Content 中提取纯文本
func extractText(c *genai.Content) string {
	var sb strings.Builder
	for _, p := range c.Parts {
		if p.Text != "" {
			sb.WriteString(p.Text)
		}
	}
	return sb.String()
}

// contentToMessages 将 genai.Content 转为 OpenAI 消息格式
func (m *DashScopeModel) contentToMessages(c *genai.Content) []openai.ChatCompletionMessage {
	var msgs []openai.ChatCompletionMessage

	// 优先处理 FunctionResponse（工具执行结果）
	hasFuncResp := false
	for _, p := range c.Parts {
		if p.FunctionResponse != nil {
			hasFuncResp = true
			respBytes, _ := json.Marshal(p.FunctionResponse.Response)
			toolCallID := m.toolCallIDs[p.FunctionResponse.Name]
			if toolCallID == "" {
				toolCallID = "call_" + p.FunctionResponse.Name
			}
			msgs = append(msgs, openai.ChatCompletionMessage{
				Role:       openai.ChatMessageRoleTool,
				Content:    string(respBytes),
				ToolCallID: toolCallID,
			})
		}
	}
	if hasFuncResp {
		return msgs
	}

	// 普通的 user/model 消息
	if c.Role == "user" {
		text := extractText(c)
		if text != "" {
			msgs = append(msgs, openai.ChatCompletionMessage{
				Role:    openai.ChatMessageRoleUser,
				Content: text,
			})
		}
	} else if c.Role == "model" {
		msg := openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleAssistant,
			Content: extractText(c),
		}
		// 处理模型返回的工具调用
		for _, p := range c.Parts {
			if p.FunctionCall != nil {
				argsBytes, _ := json.Marshal(p.FunctionCall.Args)
				toolCallID := p.FunctionCall.ID
				if toolCallID == "" {
					toolCallID = m.toolCallIDs[p.FunctionCall.Name]
				}
				if toolCallID == "" {
					toolCallID = "call_" + p.FunctionCall.Name
				}
				msg.ToolCalls = append(msg.ToolCalls, openai.ToolCall{
					ID:   toolCallID,
					Type: openai.ToolTypeFunction,
					Function: openai.FunctionCall{
						Name:      p.FunctionCall.Name,
						Arguments: string(argsBytes),
					},
				})
			}
		}
		msgs = append(msgs, msg)
	}

	return msgs
}

// messageToContent 将 OpenAI 响应消息转为 genai.Content
func (m *DashScopeModel) messageToContent(msg openai.ChatCompletionMessage) *genai.Content {
	var parts []*genai.Part

	// 文本回复
	if msg.Content != "" {
		parts = append(parts, genai.NewPartFromText(msg.Content))
	}

	// 工具调用（Function Calling）
	for _, tc := range msg.ToolCalls {
		var args map[string]any
		json.Unmarshal([]byte(tc.Function.Arguments), &args)
		part := genai.NewPartFromFunctionCall(tc.Function.Name, args)
		part.FunctionCall.ID = tc.ID // 保留 tool_call_id
		parts = append(parts, part)
	}

	if len(parts) == 0 {
		parts = append(parts, genai.NewPartFromText(""))
	}
	return genai.NewContentFromParts(parts, "model")
}

// schemaToMap 将 genai.Schema 转为 map（OpenAI 的 JSON Schema 格式）
func schemaToMap(s *genai.Schema) map[string]any {
	if s == nil {
		return nil
	}
	result := map[string]any{
		"type": strings.ToLower(string(s.Type)),
	}
	if s.Description != "" {
		result["description"] = s.Description
	}
	if len(s.Properties) > 0 {
		props := make(map[string]any)
		for k, v := range s.Properties {
			props[k] = schemaToMap(v)
		}
		result["properties"] = props
	}
	if len(s.Required) > 0 {
		result["required"] = s.Required
	}
	if s.Items != nil {
		result["items"] = schemaToMap(s.Items)
	}
	if len(s.Enum) > 0 {
		result["enum"] = s.Enum
	}
	return result
}
```

这段代码看起来不短，但核心逻辑其实就做了一件事：**在 ADK 的 `genai` 数据格式和 OpenAI 的 API 格式之间做双向翻译**。

`GenerateContent` 方法是适配器的核心入口。它接收 ADK 传来的 `LLMRequest`，里面有对话历史（`Contents`）、系统指令（`Config.SystemInstruction`）和工具声明（`Config.Tools`）。适配器把这些东西逐一转成 OpenAI 格式，调用通义千问 API，然后把响应转回 `LLMResponse` 交还给 ADK。返回类型是 `iter.Seq2`，这是 ADK 要求的事件流格式——我们这里只 yield 一次（非流式），后续讲流式输出的文章会扩展它。

格式转换中有个小细节值得一提：**tool_call_id 的传递**。OpenAI 协议要求每个工具调用都有一个唯一 ID，模型返回 `tool_calls` 时带着 ID，你把工具执行结果喂回去时也得带上同样的 ID。而 ADK 内部的 `genai.FunctionCall` 虽然也有 `ID` 字段，但在 Runner 内部转发时未必会保留。所以适配器用 `toolCallIDs` 这个 map 在两轮调用之间保存映射关系——第一轮模型返回工具调用时记住 ID，第二轮发送工具结果时取出来用。

## **3. 第一个 Agent：Hello World**

适配器写好了，现在可以创建你的第一个 Agent。在 `main.go` 里写入以下代码：

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

	// 1. 创建通义千问模型
	m := NewDashScopeModel("qwen-plus")

	// 2. 创建 Agent
	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "hello_agent",
		Model:       m,
		Description: "一个友好的问候助手",
		Instruction: "你是秀才AI助手，请用简洁友好的中文回答用户问题。回答控制在100字以内。",
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	// 3. 创建 Session 服务和 Runner
	sessionService := session.InMemoryService()
	r, err := runner.New(runner.Config{
		AppName:        "hello_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})
	if err != nil {
		log.Fatalf("创建 Runner 失败: %v", err)
	}

	// 4. 创建会话
	createResp, err := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "hello_app",
		UserID:  "user1",
	})
	if err != nil {
		log.Fatalf("创建会话失败: %v", err)
	}

	// 5. 发送消息，获取回复
	userMsg := genai.NewContentFromText("你好，请介绍一下你自己", "user")

	for event, err := range r.Run(ctx, "user1", createResp.Session.ID(), userMsg, agent.RunConfig{}) {
		if err != nil {
			log.Printf("事件错误: %v", err)
			continue
		}
		// 只打印最终回复
		if event.IsFinalResponse() && event.Content != nil {
			for _, part := range event.Content.Parts {
				if part.Text != "" {
					fmt.Println("Agent 回复:", part.Text)
				}
			}
		}
	}
}
```

运行结果：
```
Agent 回复: 你好！我是秀才AI助手，很高兴认识你。我可以帮你回答问题、提供信息、进行简单的对话交流。有什么我可以帮到你的吗？😊
```

短短几十行代码，一个能对话的 AI Agent 就跑起来了。我们来拆解一下这几步都在做什么。

第一步，`NewDashScopeModel("qwen-plus")` 创建了通义千问的模型实例——就是上一节我们写的适配器。`qwen-plus` 是通义千问的通用模型，兼顾能力和速度，非常适合日常开发调试。

第二步，`llmagent.New` 创建了一个 LLM Agent。`Config` 里的四个字段都很直白：`Name` 是 Agent 的唯一标识，`Model` 是底层模型，`Description` 告诉系统这个 Agent 干什么（在多 Agent 场景下用于路由），`Instruction` 是系统指令——相当于你给 Agent 的"角色设定"。

第三步是创建基础设施。`session.InMemoryService()` 返回一个基于内存的会话服务——所有对话记录都存在内存里，进程退出就没了，但开发阶段完全够用。`runner.New` 把 Agent 和 Session 服务组装到一起，Runner 就是那个负责"调度一切"的总管。

第四步创建了一个会话。在 ADK 中，每一轮对话都发生在一个 Session 里。Session 保存了完整的消息历史和状态数据，多轮对话全靠它来维护上下文。

第五步是重头戏：`r.Run()` 启动了 Agent 的执行流程。它接收用户消息，驱动 Agent 生成回复，返回一系列事件。我们用 `event.IsFinalResponse()` 来过滤出最终回复——中间可能还有一些内部事件（比如工具调用），我们暂时不关心。

## **4. Runner 与事件流**

上一节我们用了 `r.Run()` 但只取了最终结果，没怎么关注中间过程。现在让我们深入看看 Runner 的事件流到底是怎么回事。

Runner 是 ADK 的中枢调度器，它的 `Run` 方法签名是这样的：

```go
func (r *Runner) Run(ctx context.Context, userID, sessionID string, msg *genai.Content, cfg agent.RunConfig, opts ...RunOption) iter.Seq2[*session.Event, error]
```

返回值 `iter.Seq2[*session.Event, error]` 是一个事件流。每个 `session.Event` 记录了 Agent 执行过程中的一个"动作"——可能是模型生成了一段文字，可能是模型请求调用工具，也可能是工具返回了结果。`Event` 内嵌了 `model.LLMResponse`，所以你可以直接访问 `event.Content`、`event.Partial`、`event.FinishReason` 等字段。

> 【建议配图3 —— Runner 事件流交互时序图】
>
> 图片描述：一张纵向的时序图（UML sequence diagram 风格）。从左到右有四个参与者竖线：用户（人形图标）、Runner（指挥棒图标）、Agent（机器人图标）、Model（大脑图标）。时序从上到下：用户向 Runner 发送"r.Run(msg)"（蓝色实线箭头），Runner 向 Agent 发送"执行请求"（绿色实线箭头），Agent 向 Model 发送"GenerateContent(req)"（橙色实线箭头），Model 返回"LLMResponse"给 Agent（橙色虚线箭头），Agent 产出"Event{Content: 回复}"给 Runner（绿色虚线箭头），Runner 通过"yield(event)"返回给用户（蓝色虚线箭头）。在 Model 返回的地方有一个分支框（alt 框），标注"如果返回 FunctionCall"，框内显示额外的循环：Agent 执行工具 → 获得 FunctionResponse → 再次调用 Model → 最终返回文本。整体白色背景，时间线从上到下清晰流畅。
>
> 整体目的：让读者理解 Runner 如何协调 Agent 和 Model 之间的交互，以及事件流的产生过程。

我们写一个更详细的例子，把事件流的全貌打印出来：

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
		Name:        "chat_agent",
		Model:       m,
		Description: "聊天助手",
		Instruction: "你是一个有趣的聊天助手，回答简洁幽默，控制在50字以内。",
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	sessionService := session.InMemoryService()
	r, err := runner.New(runner.Config{
		AppName:        "chat_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})
	if err != nil {
		log.Fatalf("创建 Runner 失败: %v", err)
	}

	createResp, err := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "chat_app",
		UserID:  "user1",
	})
	if err != nil {
		log.Fatalf("创建会话失败: %v", err)
	}
	sid := createResp.Session.ID()

	// 多轮对话
	questions := []string{
		"Go语言的吉祥物是什么？",
		"它为什么长那样？",
		"帮我用一句话总结Go语言的特点",
	}

	for i, q := range questions {
		fmt.Printf("\n--- 第 %d 轮对话 ---\n", i+1)
		fmt.Printf("用户: %s\n", q)

		userMsg := genai.NewContentFromText(q, "user")

		eventCount := 0
		for event, err := range r.Run(ctx, "user1", sid, userMsg, agent.RunConfig{}) {
			if err != nil {
				log.Printf("错误: %v", err)
				continue
			}
			eventCount++

			if event.IsFinalResponse() && event.Content != nil {
				fmt.Printf("Agent: %s\n", extractText(event.Content))
			}
		}
		fmt.Printf("(本轮共产生 %d 个事件)\n", eventCount)
	}
}
```

运行结果：
```
--- 第 1 轮对话 ---
用户: Go语言的吉祥物是什么？
Agent: Go的吉祥物是一只蓝色的地鼠（Gopher），圆圆的大眼睛，萌得让人想rua。
(本轮共产生 1 个事件)

--- 第 2 轮对话 ---
用户: 它为什么长那样？
Agent: 因为设计师Renee French画的，她老公就是Go的作者之一Rob Pike——"老婆画啥就是啥"。
(本轮共产生 1 个事件)

--- 第 3 轮对话 ---
用户: 帮我用一句话总结Go语言的特点
Agent: 简单到让你怀疑"这就完了？"，快到让你怀疑"编译器是不是偷懒了？"。
(本轮共产生 1 个事件)
```

注意第二轮对话——用户问的是"它为什么长那样？"，Agent 能正确理解"它"指的是上一轮提到的 Gopher。这就是 Session 的功劳：Runner 自动把前面的对话历史带入了新的请求，Agent 天然就有了"上下文记忆"。你不需要自己拼消息列表，也不需要手动管理历史——Runner 和 Session 帮你搞定了。

每一轮纯文本对话只产生 1 个事件，因为模型直接返回了文字回复，不涉及工具调用。当我们在下一节给 Agent 装上工具后，事件数量就会增加——你会看到"模型请求调用工具"和"工具返回结果"这些中间事件。

## **5. 给 Agent 装上工具**

一个只能聊天的 Agent 终究有些单薄。Agent 真正强大的地方在于它能调用工具——查天气、算数学、搜数据库、发邮件……只要你把功能封装成工具，Agent 就能在合适的时机自动调用。

在 ADK 中，创建工具最常用的方式是 `functiontool.New`——你只需要写一个普通的 Go 函数，ADK 自动帮你生成 JSON Schema，大模型就能理解这个工具"接受什么参数、返回什么结果"。

> 【建议配图4 —— ADK Function Calling 完整循环图】
>
> 图片描述：一张环形流程图，但不是简单的圆环，而是像赛道一样的椭圆跑道形状，分为上下两半。上半部分是"模型侧"（蓝色调），下半部分是"工具侧"（绿色调）。从左边12点位置开始，顺时针流转：起点是用户头像+消息气泡"北京天气怎么样？"；→ 蓝色箭头进入上半弧"模型思考"区域（大脑图标），产出"FunctionCall: get_weather({city: '北京'})"（橙色标签）；→ 箭头向下进入下半弧"工具执行"区域（齿轮+闪电图标），显示代码执行的示意"getWeather(ctx, {City: '北京'})"；→ 产出"FunctionResponse: {temp: 28, condition: '晴'}"（绿色标签）；→ 箭头向上回到上半弧"模型总结"区域（大脑图标），产出最终文本回复"北京今天28度，天气晴朗！"（蓝色对话气泡）；→ 箭头回到用户。跑道中间空白区域写着大字"ReAct 循环"。跑道外侧标注"ADK Runner 自动编排"。整体白色背景，跑道形状让流程的循环感很直观。
>
> 整体目的：让读者直观理解 Function Calling 在 ADK 中的完整执行循环——从用户提问到工具调用再到最终回复，以及 Runner 在其中的自动编排角色。

我们来写一个带工具的完整示例。把 `main.go` 替换成以下代码：

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
	"google.golang.org/adk/tool"
	"google.golang.org/adk/tool/functiontool"
)

// ========== 定义工具 ==========

// WeatherInput 工具入参
type WeatherInput struct {
	City string `json:"city" jsonschema:"description=城市名称，如北京、上海、广州"`
}

// WeatherOutput 工具出参
type WeatherOutput struct {
	City        string  `json:"city"`
	Temperature float64 `json:"temperature"`
	Condition   string  `json:"condition"`
	Humidity    int     `json:"humidity"`
}

// getWeather 查询天气的 Go 函数（这里用模拟数据，实际项目中可调用真实天气 API）
func getWeather(ctx tool.Context, input WeatherInput) (WeatherOutput, error) {
	// 模拟不同城市的天气数据
	weatherDB := map[string]WeatherOutput{
		"北京": {City: "北京", Temperature: 28, Condition: "晴朗", Humidity: 45},
		"上海": {City: "上海", Temperature: 32, Condition: "多云", Humidity: 78},
		"广州": {City: "广州", Temperature: 35, Condition: "雷阵雨", Humidity: 85},
	}
	if w, ok := weatherDB[input.City]; ok {
		return w, nil
	}
	return WeatherOutput{
		City: input.City, Temperature: 25, Condition: "数据暂缺", Humidity: 60,
	}, nil
}

// ========== 主程序 ==========

func main() {
	ctx := context.Background()

	// 创建模型
	m := NewDashScopeModel("qwen-plus")

	// 创建天气查询工具
	weatherTool, err := functiontool.New(functiontool.Config{
		Name:        "get_weather",
		Description: "查询指定城市的当前天气信息，包括温度、天气状况和湿度",
	}, getWeather)
	if err != nil {
		log.Fatalf("创建工具失败: %v", err)
	}

	// 创建带工具的 Agent
	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "weather_agent",
		Model:       m,
		Description: "天气查询助手",
		Instruction: "你是一个天气查询助手。当用户询问天气时，使用 get_weather 工具查询，然后用自然、友好的语言告诉用户结果。如果用户问的不是天气相关的问题，礼貌地告诉他你只负责天气查询。",
		Tools:       []tool.Tool{weatherTool},
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	// 创建 Runner
	sessionService := session.InMemoryService()
	r, err := runner.New(runner.Config{
		AppName:        "weather_app",
		Agent:          myAgent,
		SessionService: sessionService,
	})
	if err != nil {
		log.Fatalf("创建 Runner 失败: %v", err)
	}

	createResp, err := sessionService.Create(ctx, &session.CreateRequest{
		AppName: "weather_app",
		UserID:  "user1",
	})
	if err != nil {
		log.Fatalf("创建会话失败: %v", err)
	}
	sid := createResp.Session.ID()

	// 测试对话
	questions := []string{
		"北京今天天气怎么样？",
		"那上海呢？",
		"帮我写首诗吧",
	}

	for _, q := range questions {
		fmt.Printf("\n用户: %s\n", q)

		userMsg := genai.NewContentFromText(q, "user")
		eventCount := 0
		for event, err := range r.Run(ctx, "user1", sid, userMsg, agent.RunConfig{}) {
			if err != nil {
				log.Printf("错误: %v", err)
				continue
			}
			eventCount++

			// 打印每个事件的类型，观察 Function Calling 流程
			if event.Content != nil {
				for _, part := range event.Content.Parts {
					if part.FunctionCall != nil {
						fmt.Printf("  [工具调用] %s(%v)\n", part.FunctionCall.Name, part.FunctionCall.Args)
					}
					if part.FunctionResponse != nil {
						fmt.Printf("  [工具结果] %s -> %v\n", part.FunctionResponse.Name, part.FunctionResponse.Response)
					}
				}
			}

			if event.IsFinalResponse() && event.Content != nil {
				fmt.Printf("Agent: %s\n", extractText(event.Content))
			}
		}
		fmt.Printf("(共 %d 个事件)\n", eventCount)
	}
}
```

运行结果：
```
用户: 北京今天天气怎么样？
  [工具调用] get_weather(map[city:北京])
  [工具结果] get_weather -> map[city:北京 condition:晴朗 humidity:45 temperature:28]
Agent: 北京今天天气不错！气温28°C，天气晴朗，湿度45%，适合出门活动。记得做好防晒哦☀️
(共 3 个事件)

用户: 那上海呢？
  [工具调用] get_weather(map[city:上海])
  [工具结果] get_weather -> map[city:上海 condition:多云 humidity:78 temperature:32]
Agent: 上海今天32°C，多云天气，湿度78%比较闷热。建议带把伞以防万一，出门记得多喝水💧
(共 3 个事件)

用户: 帮我写首诗吧
Agent: 不好意思，我是天气查询专属助手，写诗不是我的强项哦😄 有天气相关的问题随时问我！
(共 1 个事件)
```

对比一下天气查询和非天气问题的事件数量，差异很明显。天气查询产生了 3 个事件：第一个是模型判断需要调用工具并发出 `FunctionCall`，第二个是 ADK 自动执行 `getWeather` 函数并把 `FunctionResponse` 喂回模型，第三个是模型根据工具结果生成最终的自然语言回复。而"帮我写首诗"没有触发工具调用，模型直接回复了，所以只有 1 个事件。

整个过程中，**你没有写任何工具调度逻辑**。你没有写"如果用户问天气就调用工具"这样的 if-else——是大模型自己判断要不要调用工具，ADK 的 Runner 自动执行工具函数并把结果喂回模型。这就是 Agent 和传统程序最大的区别：**控制流从硬编码变成了大模型自主决策**。

还有一个细节：第二轮用户说"那上海呢？"，没有明确说"查天气"，但模型结合上下文理解了用户意图，依然正确调用了 `get_weather` 工具。Session 的上下文记忆加上模型的理解能力，让多轮对话非常自然。

## **6. Launcher：一键启动**

到目前为止，我们都是在代码里手动拼消息、遍历事件。这对理解原理很有帮助，但开发调试的时候未免太麻烦了。ADK 提供了一个叫 **Launcher** 的组件，能帮你一键启动终端交互界面或 Web UI，不用自己写 IO 循环。

Launcher 支持三种运行模式，通过命令行参数来选择：

- `console`：在终端里和 Agent 对话，适合快速调试
- `web`：启动 Web 服务器 + 自带的 Web UI，适合演示和开发
- `run`：执行单条命令，适合脚本调用

> 【建议配图5 —— Launcher 三种运行模式对比图】
>
> 图片描述：一张水平排列的三列对比卡片图。每张卡片是圆角矩形，顶部有彩色标题栏。左侧卡片：标题栏绿色，写着"console 模式"，内部有终端窗口的图标（黑色背景带绿色光标），下方用小字标注"终端交互 · 快速调试"，底部有命令示例 `./app console`。中间卡片：标题栏蓝色，写着"web 模式"，最大最醒目，内部有浏览器窗口图标（地址栏显示 localhost:8080，窗口内有聊天气泡），标注"Web UI · 可视化调试"，底部命令 `./app web --port 8080`。右侧卡片：标题栏灰色，写着"run 模式"，内部有闪电图标，标注"单次执行 · 脚本集成"，底部命令 `./app run --prompt "你好"`。三张卡片下方有一条水平虚线，虚线下居中写着"同一套 Agent 代码，三种运行方式"。整体白色背景，中间的 web 卡片最大，视觉强调它是最常用的模式。
>
> 整体目的：让读者一眼看出三种模式的区别和适用场景，知道该选哪个。

把 `main.go` 改成 Launcher 版本：

```go
package main

import (
	"context"
	"log"
	"os"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/cmd/launcher"
	"google.golang.org/adk/cmd/launcher/full"
	"google.golang.org/adk/tool"
	"google.golang.org/adk/tool/functiontool"
)

// WeatherInput 工具入参
type WeatherInput struct {
	City string `json:"city" jsonschema:"description=城市名称，如北京、上海、广州"`
}

// WeatherOutput 工具出参
type WeatherOutput struct {
	City        string  `json:"city"`
	Temperature float64 `json:"temperature"`
	Condition   string  `json:"condition"`
	Humidity    int     `json:"humidity"`
}

func getWeather(ctx tool.Context, input WeatherInput) (WeatherOutput, error) {
	weatherDB := map[string]WeatherOutput{
		"北京": {City: "北京", Temperature: 28, Condition: "晴朗", Humidity: 45},
		"上海": {City: "上海", Temperature: 32, Condition: "多云", Humidity: 78},
		"广州": {City: "广州", Temperature: 35, Condition: "雷阵雨", Humidity: 85},
	}
	if w, ok := weatherDB[input.City]; ok {
		return w, nil
	}
	return WeatherOutput{
		City: input.City, Temperature: 25, Condition: "数据暂缺", Humidity: 60,
	}, nil
}

func main() {
	ctx := context.Background()

	m := NewDashScopeModel("qwen-plus")

	weatherTool, err := functiontool.New(functiontool.Config{
		Name:        "get_weather",
		Description: "查询指定城市的当前天气信息",
	}, getWeather)
	if err != nil {
		log.Fatalf("创建工具失败: %v", err)
	}

	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "weather_agent",
		Model:       m,
		Description: "天气查询助手",
		Instruction: "你是一个天气查询助手。使用 get_weather 工具查询天气，用友好的语言回复用户。",
		Tools:       []tool.Tool{weatherTool},
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	// 用 Launcher 替代手动管理 Runner
	config := &launcher.Config{
		AgentLoader: agent.NewSingleLoader(myAgent),
	}

	l := full.NewLauncher()
	if err = l.Execute(ctx, config, os.Args[1:]); err != nil {
		log.Fatalf("启动失败: %v\n\n%s", err, l.CommandLineSyntax())
	}
}
```

代码比之前还短了——我们不再手动创建 Session、Runner，也不再自己写消息循环。Launcher 把这些活全包了。`agent.NewSingleLoader(myAgent)` 把 Agent 包装成一个加载器（多 Agent 场景下可以加载多个），`full.NewLauncher()` 创建完整版的 Launcher（包含 Web UI 支持）。

编译并运行：

```bash
go build -o weather-agent .

# Console 模式：终端交互
./weather-agent console

# Web 模式：启动 Web UI（默认端口 8080）
./weather-agent web --port 8080
```

Console 模式下，你会看到一个交互式终端提示符，直接输入问题就能和 Agent 对话：

```
> 北京天气怎么样？
北京今天28°C，晴朗，湿度45%。适合户外活动！
> 上海呢？
上海32°C，多云，湿度78%。有点闷热，注意防暑。
> exit
```

Web 模式下，打开浏览器访问 `http://localhost:8080`，你会看到 ADK 自带的 Web UI——一个干净的聊天界面，左侧可以选择 Agent，右侧是对话区域。在这个界面里你不仅能和 Agent 聊天，还能看到每一步的事件详情（包括工具调用的参数和返回值），非常适合开发调试。

从手写 Runner 到一键 Launcher，代码量减少了一大半，但 Agent 的能力没有任何缩水。Launcher 本质上就是在 Runner 之上封装了一层用户接口——它帮你创建了 Session 服务、Runner，帮你管理了消息的收发和展示。日常开发调试用 Launcher 非常高效，而当你需要更精细的控制（比如自定义事件处理、集成到现有 Web 框架）时，再回到 Runner 的用法即可。

## **7. 小结**

从环境搭建到模型适配，从第一条对话到工具调用，再到 Launcher 一键启动——这一路走下来，你已经用 ADK 框架把一个完整的 Agent 跑通了。回过头看，整个过程的核心其实就三件事：用适配器让 ADK 对接上你的大模型，用 `llmagent.New` 定义 Agent 的角色和能力，用 Runner 或 Launcher 把一切串联起来让它跑起来。ADK 的 Code-First 风格在动手的过程中感受最深——没有配置文件，没有拖拽编排，所有逻辑都是你熟悉的 Go 代码，编译器帮你检查类型，IDE 帮你补全字段，调试的时候直接打断点。这种"一切尽在掌控"的感觉，大概就是 ADK 选择 Code-First 的底气。

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
