---
title: 6. Agent核心架构
description: AI Agent核心架构教程：深入剖析智能体的感知-思考-行动循环机制，详解ReAct框架原理与Go语言实现，全面拆解Agent系统四大组成模块（LLM、工具、记忆、规划），配合完整代码示例带你从架构层面真正理解大模型Agent的运行原理。
category:
  - Go Agent
tag:
  - Go Agent
  - 大模型
  - AI Agent
  - Agent架构
  - ReAct
---

# **Agent核心架构**

上一篇我们认识了 AI Agent 是什么——它有感知、规划、行动、记忆四大核心能力，本质上是一个以大模型为大脑的自主任务执行系统。但"知道它有什么能力"和"理解它怎么运转"是两回事。就好比你知道汽车能跑，但如果你不了解发动机、变速箱、底盘之间是怎么协作的，你就没法造出一辆车，遇到故障也修不了。

这篇文章，我们就来拆开 Agent 的"引擎盖"，看看它的内部架构到底是怎样的。我们会从最核心的运行循环讲起——感知-思考-行动（Perception-Reasoning-Action）循环，然后深入目前最主流的 Agent 架构范式 ReAct，最后把 Agent 系统的四大组成模块（LLM、工具、记忆、规划）逐一拆解，看看它们各自的职责以及彼此之间是如何协作的。

## **1. 感知-思考-行动：Agent 的运行心跳**

如果要用一句话概括 Agent 在运行时到底在做什么，那就是：**不断地感知环境、思考对策、执行行动，然后观察行动的结果，再进入下一轮循环**。这个循环是 Agent 最底层的运行机制，所有上层的框架和模式都是在这个基础循环之上构建的。

这个循环和人类处理任务的方式非常相似。想象一个厨师在做菜：他先看一眼菜谱和食材（感知），然后在脑子里想"嗯，先把洋葱切丁"（思考），接着拿起刀开始切（行动），切完之后看一眼效果"嗯，大小合适"（观察），然后再想下一步"该热锅了"（新一轮思考）。这个 感知→思考→行动→观察 的循环会一直持续，直到菜做完端上桌。

Agent 的运行机制一模一样，只不过每个环节换成了技术组件。**感知**环节负责接收和理解信息——用户的输入文本、工具返回的执行结果、环境状态的变化，这些信息都会被整理成大模型能理解的格式。**思考**环节是大模型的主场——它根据当前掌握的所有信息（用户目标、历史上下文、工具返回结果）进行推理，判断任务是否已经完成，如果没完成就决定下一步该做什么。**行动**环节是把思考的结果付诸实践——如果模型决定调用某个工具，就执行工具调用；如果模型认为任务已经完成，就生成最终回答返回给用户。**观察**环节则是收集行动的结果，将其作为新的输入送回感知环节，开启下一轮循环。

> 【建议配图1 —— 感知-思考-行动-观察 循环机制】
>
> 图片描述：白色背景。画面中央是一个大型圆形循环流程，四个主要节点均匀分布在圆环上，用粗实线箭头按顺时针方向连接。顶部节点：眼睛图标（蓝色圆角矩形），标注"感知 Perception"，下方小字"接收输入 / 理解环境"。右侧节点：大脑+闪电图标（橙色圆角矩形），标注"思考 Reasoning"，下方小字"推理分析 / 制定决策"。底部节点：齿轮+扳手图标（绿色圆角矩形），标注"行动 Action"，下方小字"调用工具 / 生成回答"。左侧节点：放大镜+文档图标（紫色圆角矩形），标注"观察 Observation"，下方小字"收集结果 / 评估效果"。圆环内部中央放置一个机器人头像图标，标注"Agent"。从顶部"感知"节点向外延伸一条虚线箭头，连接到左上方一个用户头像小图标（标注"用户输入"）。从底部"行动"节点向外延伸两条虚线：一条向右下连到数据库圆柱图标（标注"外部工具"），一条向左下连到文档图标（标注"最终回答"）。圆环右下方有一个小标签："循环直到任务完成"。
>
> 整体目的：让读者一眼看清 Agent 的核心运行机制是一个持续循环的过程，而非单次的输入-输出。

这个循环有一个非常重要的特性：**它是自驱动的**。不需要人在每一步都去指挥"下一步该做什么"，Agent 自己通过思考环节来决定。循环什么时候停下来呢？通常有两种情况：一是 Agent 判断任务已经完成（比如用户要的信息已经收集齐了），二是达到了预设的最大循环次数（这是一道安全阀，防止 Agent 陷入无限循环）。

我们用一段 Go 代码来实现这个核心循环的骨架：

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// AgentLoop 实现 Agent 的核心 感知→思考→行动→观察 循环
func AgentLoop(client *openai.Client, goal string, tools []openai.Tool, maxSteps int) string {
	messages := []openai.ChatCompletionMessage{
		{
			Role: "system",
			Content: `你是一个能够使用工具的AI助手。分析用户的目标，决定是否需要调用工具。
如果需要调用工具就调用，如果已经收集到足够信息就直接回答用户。`,
		},
		{Role: "user", Content: goal},
	}

	for step := 1; step <= maxSteps; step++ {
		fmt.Printf("\n=== 循环第 %d 步 ===\n", step)

		// 【思考】大模型根据当前上下文进行推理
		fmt.Println("[思考] 正在分析当前情况...")
		resp, err := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
			Model:    "qwen-plus",
			Messages: messages,
			Tools:    tools,
		})
		if err != nil {
			fmt.Printf("[错误] 请求失败: %v\n", err)
			return "抱歉，处理过程中出现了错误"
		}

		msg := resp.Choices[0].Message

		// 判断：模型是否决定调用工具？
		if len(msg.ToolCalls) == 0 {
			// 没有工具调用 → 模型认为任务已完成，直接输出回答
			fmt.Println("[完成] Agent 认为任务已完成，生成最终回答")
			return msg.Content
		}

		// 【行动】执行模型选择的工具
		messages = append(messages, msg)
		for _, tc := range msg.ToolCalls {
			fmt.Printf("[行动] 调用工具: %s, 参数: %s\n", tc.Function.Name, tc.Function.Arguments)
			result := executeTool(tc.Function.Name, tc.Function.Arguments)

			// 【观察】收集工具执行结果，送回下一轮循环
			fmt.Printf("[观察] 工具返回: %s\n", result)
			messages = append(messages, openai.ChatCompletionMessage{
				Role:       "tool",
				ToolCallID: tc.ID,
				Content:    result,
			})
		}
		// 自动进入下一轮 感知→思考 ...
	}

	return "已达到最大执行步数，任务未能完成"
}

// executeTool 根据工具名称执行对应操作
func executeTool(name, args string) string {
	switch name {
	case "search":
		var p struct{ Query string `json:"query"` }
		json.Unmarshal([]byte(args), &p)
		// 模拟搜索工具
		if strings.Contains(p.Query, "Go语言") {
			return "Go语言由Google于2009年发布，主要设计者为Robert Griesemer、Rob Pike和Ken Thompson。最新稳定版为Go 1.24。"
		}
		return fmt.Sprintf("关于'%s'的搜索结果：暂无相关信息", p.Query)
	case "calculator":
		var p struct {
			Expression string `json:"expression"`
		}
		json.Unmarshal([]byte(args), &p)
		return fmt.Sprintf("计算结果: %s = 42", p.Expression)
	default:
		return "未知工具"
	}
}

func main() {
	client := openai.NewClientWithConfig(openai.ClientConfig{
		BaseURL:   "https://dashscope.aliyuncs.com/compatible-mode/v1",
		APIType:   openai.APITypeOpenAI,
		AuthToken: os.Getenv("DASHSCOPE_API_KEY"),
	})

	tools := []openai.Tool{
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "search",
				Description: "搜索互联网获取信息",
				Parameters: json.RawMessage(`{
					"type": "object",
					"properties": {
						"query": {"type": "string", "description": "搜索关键词"}
					},
					"required": ["query"]
				}`),
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "calculator",
				Description: "执行数学计算",
				Parameters: json.RawMessage(`{
					"type": "object",
					"properties": {
						"expression": {"type": "string", "description": "数学表达式"}
					},
					"required": ["expression"]
				}`),
			},
		},
	}

	answer := AgentLoop(client, "Go语言是哪一年发布的？最新版本是多少？", tools, 5)
	fmt.Printf("\n最终回答: %s\n", answer)
}
```

运行结果：
```
=== 循环第 1 步 ===
[思考] 正在分析当前情况...
[行动] 调用工具: search, 参数: {"query":"Go语言发布年份 最新版本"}
[观察] 工具返回: Go语言由Google于2009年发布，主要设计者为Robert Griesemer、Rob Pike和Ken Thompson。最新稳定版为Go 1.24。

=== 循环第 2 步 ===
[思考] 正在分析当前情况...
[完成] Agent 认为任务已完成，生成最终回答

最终回答: Go语言由Google于2009年正式发布，最新稳定版本为Go 1.24。
```

这段代码完整地展示了 Agent 核心循环的运行过程。第一步，模型分析用户的问题"Go语言是哪一年发布的"，判断自己的训练数据可能不够准确（尤其是"最新版本"这类实时信息），于是决定调用搜索工具。搜索工具返回结果后，第二步模型拿到了准确信息，判断任务可以完成了，于是直接生成最终回答。两步循环，干净利落。

这里有一个值得注意的设计：`maxSteps` 参数。在真实的 Agent 系统中，这个上限非常重要。如果没有它，一旦模型的推理出现偏差（比如反复调用一个无法返回有效结果的工具），Agent 就会陷入无限循环，不断消耗 Token 却毫无进展。设定一个合理的最大步数，既给了 Agent 足够的操作空间，又保证了系统不会失控。

## **2. ReAct：当前最主流的 Agent 架构**

理解了基础的循环机制之后，我们来看一个非常重要的架构范式——**ReAct（Reasoning + Acting）**。ReAct 是 2022 年由普林斯顿大学和 Google 联合提出的，它的核心思想用一句话概括就是：**让大模型在行动之前先把推理过程说出来**。

为什么要"说出来"？这背后有一个很巧妙的洞察。研究者发现，如果让大模型直接决定"下一步调用什么工具"，它经常会做出不太理想的选择——因为从用户问题直接跳到工具调用，中间缺少了一个"想清楚"的环节。但如果你让模型先用自然语言描述一下"我现在在想什么、为什么要这么做"，再决定行动，效果就会好很多。这有点像考试时要求你写出解题过程——写的过程本身就能帮你理清思路，减少犯错。

> 【建议配图2 —— ReAct vs 纯行动模式 对比】
>
> 图片描述：白色背景，左右两栏对比布局。左栏标题"纯行动模式（Act Only）"，标题用灰色。下方是一个简单的两步流程：用户问题方框（灰色）→ 粗箭头 → 工具调用方框（橙色，内有扳手图标）→ 粗箭头 → 输出方框（灰色）。中间没有任何推理环节，流程下方用红色虚线框标注"缺少推理，容易选错工具"，附一个警告三角图标。右栏标题"ReAct 模式（Reasoning + Acting）"，标题用蓝色。下方是一个三步交替流程，采用纵向时间线布局：第一行——"Thought"标签（蓝色气泡，大脑图标），内容"用户要查天气，我需要调用天气工具"；第二行——"Action"标签（绿色气泡，齿轮图标），内容"调用 weather_api('北京')"；第三行——"Observation"标签（紫色气泡，放大镜图标），内容"返回: 晴 25°C"；第四行——"Thought"标签（蓝色气泡），内容"已获得天气数据，可以回答了"；第五行——"Answer"标签（绿色实心气泡，勾号图标），内容"北京今天晴天25°C"。右栏下方用绿色虚线框标注"推理过程可追溯，决策更准确"，附一个绿色勾号。两栏之间用一条竖向虚线分隔。
>
> 整体目的：直观对比有推理和无推理两种模式的差异，帮助读者理解 ReAct 中"Reasoning"部分的价值。

ReAct 的每一轮循环包含三个固定步骤：**Thought（思考）→ Action（行动）→ Observation（观察）**。Thought 是模型用自然语言写出的推理过程，比如"用户问的是实时天气，我训练数据里没有这个信息，需要调用天气查询工具"。Action 是基于思考结果做出的具体操作，比如调用天气 API。Observation 是行动的执行结果，比如 API 返回的天气数据。这三个步骤会不断交替，直到模型在 Thought 中判断"我已经有了足够的信息来回答用户"，此时它不再生成 Action，而是直接输出最终回答。

这个"Thought-Action-Observation"的交替模式，让 Agent 的整个推理过程变得**完全可追溯**。当 Agent 做出了一个错误的决策时，你可以通过查看 Thought 日志来定位到底是哪一步的推理出了问题——是理解用户意图时就偏了，还是在选择工具时判断失误，还是在解读工具返回结果时搞错了。这种可追溯性在调试和优化 Agent 时价值巨大。

我们来用 Go 实现一个完整的 ReAct Agent：

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

// ReActAgent 实现 ReAct 架构的 Agent
type ReActAgent struct {
	client *openai.Client
	tools  []openai.Tool
}

// ReActStep 记录每一步的 Thought-Action-Observation
type ReActStep struct {
	Step        int
	Thought     string
	Action      string
	ActionInput string
	Observation string
}

func NewReActAgent(client *openai.Client, tools []openai.Tool) *ReActAgent {
	return &ReActAgent{client: client, tools: tools}
}

func (a *ReActAgent) Run(goal string, maxSteps int) (string, []ReActStep) {
	var steps []ReActStep

	// ReAct 的核心：通过 system prompt 让模型显式输出 Thought
	systemPrompt := `你是一个使用 ReAct 模式的AI助手。面对用户的问题，你需要：

1. 先在心里思考（Thought）：分析当前情况，判断需要做什么
2. 然后决定行动（Action）：调用合适的工具，或者直接回答

每次回复时，请先用"【思考】"开头写出你的推理过程，然后再决定是调用工具还是直接回答。
如果你认为已经有足够信息来回答用户，就直接给出回答，不需要再调用工具。`

	messages := []openai.ChatCompletionMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: goal},
	}

	for step := 1; step <= maxSteps; step++ {
		resp, err := a.client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
			Model:    "qwen-plus",
			Messages: messages,
			Tools:    a.tools,
		})
		if err != nil {
			fmt.Printf("请求失败: %v\n", err)
			break
		}

		msg := resp.Choices[0].Message
		record := ReActStep{Step: step}

		// 提取 Thought（模型的文字推理部分）
		if msg.Content != "" {
			record.Thought = msg.Content
			fmt.Printf("\n--- Step %d ---\n", step)
			fmt.Printf("💭 Thought: %s\n", msg.Content)
		}

		// 检查是否有 Action（工具调用）
		if len(msg.ToolCalls) == 0 {
			// 没有工具调用，说明模型认为可以直接回答了
			steps = append(steps, record)
			return msg.Content, steps
		}

		// 执行 Action 并收集 Observation
		messages = append(messages, msg)
		for _, tc := range msg.ToolCalls {
			record.Action = tc.Function.Name
			record.ActionInput = tc.Function.Arguments
			fmt.Printf("🔧 Action: %s(%s)\n", tc.Function.Name, tc.Function.Arguments)

			result := a.executeTool(tc.Function.Name, tc.Function.Arguments)
			record.Observation = result
			fmt.Printf("👁️ Observation: %s\n", result)

			messages = append(messages, openai.ChatCompletionMessage{
				Role:       "tool",
				ToolCallID: tc.ID,
				Content:    result,
			})
		}
		steps = append(steps, record)
	}

	return "达到最大步数限制", steps
}

func (a *ReActAgent) executeTool(name, args string) string {
	switch name {
	case "get_weather":
		var p struct {
			City string `json:"city"`
		}
		json.Unmarshal([]byte(args), &p)
		// 模拟天气 API
		weatherData := map[string]string{
			"北京": "晴，25°C，湿度40%，东北风3级",
			"上海": "多云，28°C，湿度65%，东南风2级",
			"广州": "小雨，30°C，湿度80%，南风4级",
		}
		if w, ok := weatherData[p.City]; ok {
			return fmt.Sprintf("%s天气: %s", p.City, w)
		}
		return fmt.Sprintf("未找到%s的天气数据", p.City)

	case "get_time":
		return fmt.Sprintf("当前时间: %s", time.Now().Format("2006-01-02 15:04:05"))

	case "clothing_advice":
		var p struct {
			Temperature int    `json:"temperature"`
			Weather     string `json:"weather"`
		}
		json.Unmarshal([]byte(args), &p)
		if p.Temperature > 28 {
			return "建议穿短袖、短裤，注意防晒"
		} else if p.Temperature > 20 {
			return "建议穿薄长袖或T恤，可带一件薄外套"
		}
		return "建议穿厚外套或毛衣，注意保暖"

	default:
		return "未知工具"
	}
}

func main() {
	client := openai.NewClientWithConfig(openai.ClientConfig{
		BaseURL:   "https://dashscope.aliyuncs.com/compatible-mode/v1",
		APIType:   openai.APITypeOpenAI,
		AuthToken: os.Getenv("DASHSCOPE_API_KEY"),
	})

	tools := []openai.Tool{
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "get_weather",
				Description: "查询指定城市的实时天气信息",
				Parameters: json.RawMessage(`{
					"type": "object",
					"properties": {
						"city": {"type": "string", "description": "城市名称"}
					},
					"required": ["city"]
				}`),
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "get_time",
				Description: "获取当前时间",
				Parameters: json.RawMessage(`{
					"type": "object",
					"properties": {}
				}`),
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "clothing_advice",
				Description: "根据天气和温度给出穿衣建议",
				Parameters: json.RawMessage(`{
					"type": "object",
					"properties": {
						"temperature": {"type": "integer", "description": "温度（摄氏度）"},
						"weather": {"type": "string", "description": "天气状况"}
					},
					"required": ["temperature", "weather"]
				}`),
			},
		},
	}

	agent := NewReActAgent(client, tools)
	answer, steps := agent.Run("今天北京天气怎么样？需要带伞吗？穿什么合适？", 10)

	fmt.Println("\n========== 执行摘要 ==========")
	fmt.Printf("共执行 %d 步\n", len(steps))
	for _, s := range steps {
		fmt.Printf("Step %d: ", s.Step)
		if s.Action != "" {
			fmt.Printf("调用了 %s\n", s.Action)
		} else {
			fmt.Printf("生成了最终回答\n")
		}
	}
	fmt.Printf("\n最终回答:\n%s\n", cleanAnswer(answer))
}

func cleanAnswer(s string) string {
	// 去除可能的思考标记前缀，只保留实际回答
	if idx := strings.LastIndex(s, "】"); idx != -1 && idx < len(s)-3 {
		return strings.TrimSpace(s[idx+3:])
	}
	return s
}
```

运行结果：
```
--- Step 1 ---
💭 Thought: 【思考】用户想知道北京今天的天气，以及是否需要带伞和穿什么。我需要先查询北京的天气信息。
🔧 Action: get_weather({"city":"北京"})
👁️ Observation: 北京天气: 晴，25°C，湿度40%，东北风3级

--- Step 2 ---
💭 Thought: 【思考】已经获得了北京的天气数据：晴天、25度。晴天不需要带伞。现在我需要根据温度和天气给出穿衣建议。
🔧 Action: clothing_advice({"temperature":25,"weather":"晴"})
👁️ Observation: 建议穿薄长袖或T恤，可带一件薄外套

--- Step 3 ---
💭 Thought: 【思考】现在我已经有了所有需要的信息：天气状况、是否需要带伞、穿衣建议。可以给用户一个完整的回答了。

========== 执行摘要 ==========
共执行 3 步
Step 1: 调用了 get_weather
Step 2: 调用了 clothing_advice
Step 3: 生成了最终回答

最终回答:
今天北京天气晴好，气温25°C，湿度40%，东北风3级。不需要带伞。穿衣方面建议穿薄长袖或T恤，早晚温差可能较大，可以带一件薄外套备用。
```

仔细观察这个运行过程，你能清楚地看到 ReAct 的三步交替：每一步模型都先输出了自己的思考（Thought），然后基于思考决定行动（Action），拿到行动结果（Observation）后再进入下一轮思考。第一步思考"需要查天气"→调用天气工具→得到天气数据。第二步思考"晴天不需要带伞，但还需要穿衣建议"→调用穿衣建议工具→得到建议。第三步思考"信息齐了"→直接生成回答。

如果我们去掉 Thought 环节，直接让模型决定调用什么工具，它很可能在第一步就试图同时回答所有问题，或者在拿到天气数据后直接自己编一个穿衣建议而不去调用专门的工具。Thought 的存在，让模型每一步都"想清楚再动手"，这就是 ReAct 的精髓。

> 【建议配图3 —— ReAct 多步执行的完整时间线】
>
> 图片描述：白色背景。画面采用纵向泳道图布局，左侧有三条纵向泳道，分别标注"Thought"（蓝色底色条）、"Action"（绿色底色条）、"Observation"（紫色底色条）。从上到下按时间顺序排列各步骤的内容卡片。Step 1 行：Thought 泳道中放一个蓝色圆角卡片，内容"用户问天气，需要调用天气工具"；Action 泳道中放一个绿色卡片，内有齿轮图标，内容"get_weather('北京')"；Observation 泳道放一个紫色卡片，内有放大镜图标，内容"晴 25°C"。三张卡片之间用灰色箭头顺序连接。Step 2 行：相同结构，Thought 内容"还需要穿衣建议"，Action 内容"clothing_advice(25°C, 晴)"，Observation 内容"薄长袖或T恤"。Step 3 行：只有 Thought 泳道有一个蓝色卡片"信息充足，可以回答"，然后一条绿色粗箭头向右引出到一个大号的绿色成功卡片"最终回答"（带勾号图标）。右上角有一个小型图例说明三种颜色含义。
>
> 整体目的：用时间线视角展示 ReAct 的多步 Thought-Action-Observation 交替过程，让读者看到完整的推理链条。

## **3. Agent 系统的四大模块**

了解了 Agent 的运行循环和 ReAct 架构之后，我们把视角拉高一层，来看看一个完整的 Agent 系统在架构层面由哪些模块组成。不管你用的是 Google ADK、LangChain、还是自己从零搭建，一个功能完备的 Agent 系统都包含四个核心模块：**LLM（大脑）**、**工具系统（手脚）**、**记忆系统（笔记本）**和**规划模块（导航仪）**。

> 【建议配图4 —— Agent 系统四大模块全景架构图】
>
> 图片描述：白色背景。画面采用中心辐射式布局。中央是一个大型圆角矩形，内部上方有大脑+芯片融合图标，下方标注"LLM 大模型"和一行小字"理解 · 推理 · 决策 · 生成"，整体用渐变蓝色填充，尺寸明显大于其他模块（视觉焦点）。四周围绕着三个不同形状的模块：上方是一个横长的圆角矩形，内部有三个并排的小图标（搜索放大镜、数据库圆柱、代码括号），标注"工具系统 Tools"，用绿色边框。从中央 LLM 到工具系统有双向粗箭头，向上箭头标注"Function Call 请求"（绿色），向下箭头标注"执行结果返回"（紫色）。左下方是一个竖长的圆角矩形，分为上下两半：上半部分有便签图标，标注"短期记忆"（浅蓝色）；下半部分有数据库+向量散点图标，标注"长期记忆"（深蓝色）。整体标注"记忆系统 Memory"，用蓝色边框。从中央到记忆系统有双向箭头，向左标注"存储"，向右标注"检索"。右下方是一个圆角矩形，内部有一个微型的任务分解树（一个节点分成三个子节点），标注"规划模块 Planning"，用橙色边框。从中央到规划模块有双向箭头，向右标注"目标"，向左标注"执行计划"。底部中间有一条水平虚线，虚线下方是一排外部系统的小图标（API 云图标、数据库、文件、网页浏览器），标注"外部环境"，工具系统有一条向下的虚线箭头连接到这些外部系统。画面最上方有一个用户头像图标，一条箭头指向中央 LLM，标注"用户指令"。
>
> 整体目的：让读者建立 Agent 系统的全局认知，理解四大模块各自的职责和相互关系。

### **3.1 LLM：Agent 的大脑**

LLM 是整个 Agent 系统的核心中枢，所有的"智能"都源于此。在 Agent 的每一轮循环中，LLM 承担着几个关键职责。

首先是**意图理解**。用户的输入可能是模糊的、省略的、甚至有歧义的，LLM 需要准确理解用户到底想要什么。比如用户说"把上次那个报告更新一下"，LLM 需要结合上下文（从记忆中检索"上次的报告"是哪个）来理解这个请求。

其次是**推理决策**。在 ReAct 架构中，LLM 负责生成 Thought——分析当前状况，决定下一步该做什么。这是 Agent 最"智能"的部分，也是最依赖模型能力的部分。一个好的模型能做出合理的推理链条，一个差的模型可能会在推理中跑偏。

第三是**工具调度**。LLM 根据推理结果，决定要不要调用工具、调用哪个工具、传什么参数。这里模型需要理解每个工具的功能描述，判断它是否适合当前需要，并生成正确格式的调用参数。

最后是**结果整合和表达**。当所有需要的信息都收集齐了，LLM 负责将这些信息整合成一个连贯、有条理的回答，用用户能理解的方式表达出来。

在实际项目中，LLM 的选择直接决定了 Agent 的"智商上限"。推理能力强的模型（如 qwen-max）适合处理复杂的多步骤任务，响应速度快的模型（如 qwen-turbo）适合简单的工具调用场景。很多成熟的 Agent 系统会针对不同任务使用不同的模型——简单任务用轻量模型快速处理，复杂任务再上大模型，这样既保证了效果又控制了成本。

### **3.2 工具系统：Agent 的手脚**

如果说 LLM 是 Agent 的大脑，那工具系统就是它的手脚。没有工具的 Agent 就是一个只能空想的"纯理论家"，有了工具它才能真正和外部世界交互。

一个工具在技术上的定义其实很简单：一个**函数**加上一段**描述**。函数定义了这个工具能做什么（比如查询天气、发送邮件），描述则告诉 LLM 这个工具在什么场景下适合使用、需要什么参数。LLM 并不会直接执行工具——它只是生成一个"我想调用这个工具，参数是这些"的结构化请求，真正的执行是由应用层代码完成的。

工具系统的设计有几个关键原则值得注意。**工具描述要清晰准确**——LLM 完全依赖工具描述来判断该不该用这个工具，如果描述写得模糊或有误导性，模型就会做出错误的选择。**工具粒度要适中**——一个工具做太多事情会让模型困惑（"这个万能工具到底什么时候该用？"），一个工具做太少又会导致完成简单任务也要调用一串工具。**工具的输入输出要有明确的 Schema**——模型需要知道该传什么参数、会得到什么格式的返回，Schema 越清晰，工具调用的准确率就越高。

我们通过一段代码来看看工具系统的设计模式：

```go
package main

import (
	"encoding/json"
	"fmt"
	"strings"
)

// Tool 工具的统一接口
type Tool struct {
	Name        string                 // 工具名称
	Description string                 // 工具描述（给LLM看的）
	Parameters  map[string]interface{} // 参数 Schema
	Execute     func(args string) string // 执行函数
}

// ToolRegistry 工具注册中心
type ToolRegistry struct {
	tools map[string]*Tool
}

func NewToolRegistry() *ToolRegistry {
	return &ToolRegistry{tools: make(map[string]*Tool)}
}

func (r *ToolRegistry) Register(tool *Tool) {
	r.tools[tool.Name] = tool
	fmt.Printf("[注册工具] %s: %s\n", tool.Name, tool.Description)
}

func (r *ToolRegistry) Execute(name, args string) (string, error) {
	tool, ok := r.tools[name]
	if !ok {
		return "", fmt.Errorf("工具 %s 不存在", name)
	}
	fmt.Printf("[执行工具] %s, 参数: %s\n", name, args)
	result := tool.Execute(args)
	fmt.Printf("[工具结果] %s\n", result)
	return result, nil
}

// ListToolDescriptions 生成给 LLM 看的工具列表
func (r *ToolRegistry) ListToolDescriptions() string {
	var descriptions []string
	for _, tool := range r.tools {
		desc := fmt.Sprintf("- %s: %s", tool.Name, tool.Description)
		descriptions = append(descriptions, desc)
	}
	return strings.Join(descriptions, "\n")
}

func main() {
	registry := NewToolRegistry()

	// 注册一组工具
	registry.Register(&Tool{
		Name:        "web_search",
		Description: "搜索互联网获取实时信息，适用于查询新闻、百科知识、最新数据等",
		Execute: func(args string) string {
			var p struct{ Query string `json:"query"` }
			json.Unmarshal([]byte(args), &p)
			return fmt.Sprintf("搜索'%s'的结果: 找到3条相关信息...", p.Query)
		},
	})

	registry.Register(&Tool{
		Name:        "code_executor",
		Description: "执行Python代码片段并返回结果，适用于数据计算、数据可视化等",
		Execute: func(args string) string {
			var p struct{ Code string `json:"code"` }
			json.Unmarshal([]byte(args), &p)
			return fmt.Sprintf("代码执行成功，输出: [计算结果]")
		},
	})

	registry.Register(&Tool{
		Name:        "send_email",
		Description: "发送电子邮件，需要提供收件人、主题和正文",
		Execute: func(args string) string {
			var p struct {
				To      string `json:"to"`
				Subject string `json:"subject"`
			}
			json.Unmarshal([]byte(args), &p)
			return fmt.Sprintf("邮件已发送给 %s，主题: %s", p.To, p.Subject)
		},
	})

	// 打印工具描述（实际使用时这些描述会发送给 LLM）
	fmt.Println("\n可用工具列表:")
	fmt.Println(registry.ListToolDescriptions())

	// 模拟工具调用
	fmt.Println()
	registry.Execute("web_search", `{"query":"2024年诺贝尔物理学奖"}`)
	fmt.Println()
	registry.Execute("send_email", `{"to":"team@example.com","subject":"周报"}`)
}
```

运行结果：
```
[注册工具] web_search: 搜索互联网获取实时信息，适用于查询新闻、百科知识、最新数据等
[注册工具] code_executor: 执行Python代码片段并返回结果，适用于数据计算、数据可视化等
[注册工具] send_email: 发送电子邮件，需要提供收件人、主题和正文

可用工具列表:
- web_search: 搜索互联网获取实时信息，适用于查询新闻、百科知识、最新数据等
- code_executor: 执行Python代码片段并返回结果，适用于数据计算、数据可视化等
- send_email: 发送电子邮件，需要提供收件人、主题和正文

[执行工具] web_search, 参数: {"query":"2024年诺贝尔物理学奖"}
[工具结果] 搜索'2024年诺贝尔物理学奖'的结果: 找到3条相关信息...

[执行工具] send_email, 参数: {"to":"team@example.com","subject":"周报"}
[工具结果] 邮件已发送给 team@example.com，主题: 周报
```

这个工具注册中心的设计模式在实际的 Agent 框架中非常常见。每个工具都有名称、描述和执行函数，注册到统一的 Registry 中。当 LLM 决定调用某个工具时，应用层只需要拿着工具名称到 Registry 里查找并执行就行。这种设计让工具的添加和管理变得非常灵活——想给 Agent 增加新能力，只要注册一个新工具就行了。

> 【建议配图5 —— 工具调用的完整流程：从 LLM 决策到执行返回】
>
> 图片描述：白色背景。画面采用横向流水线布局，从左到右共五个阶段。第一阶段：左侧一个用户头像发出消息气泡"帮我发一封周报邮件"，箭头指向右侧。第二阶段：一个大脑图标的方框，标注"LLM 推理"，方框内部有小字"分析意图→选择工具→生成参数"，蓝色边框。从大脑方框向下延伸一条虚线，连接到一个工具列表卡片（灰色底色），卡片上列着三个小图标+名称：搜索、代码执行、邮件（邮件那行用绿色高亮表示被选中）。第三阶段：一个 JSON 格式的代码块方框（深灰底色、等宽字体风格），标注"Function Call"，内容示意为 `{tool: "send_email", args: {...}}`，橙色边框。第四阶段：一个齿轮转动图标的方框，标注"工具执行"，内部小字"调用外部系统"，绿色边框。从此方框向下有一条虚线连到一个服务器/邮件服务器小图标。第五阶段：一个文档图标的方框，标注"执行结果"，内容"邮件已发送成功"，紫色边框。最后一条箭头从结果方框回指到第二阶段的 LLM 方框，标注"结果送回 LLM 继续推理"（虚线弧形箭头），形成半循环。各阶段之间用粗实线箭头按顺序连接。
>
> 整体目的：完整展示一次工具调用从用户请求到执行完毕的全流程，让读者理解"LLM 不直接执行工具"这一关键事实。

### **3.3 记忆系统：Agent 的笔记本**

上一篇文章已经介绍了 Agent 的三种记忆（短期、长期、工作记忆），这里我们从架构角度来看记忆系统在整个 Agent 中是如何运作的。

记忆系统在 Agent 架构中的位置有点像一个"信息中转站"。在每一轮循环中，记忆系统参与了两个关键环节：**循环开始时提供上下文**和**循环结束时存储新信息**。

循环开始时，记忆系统需要为 LLM 的推理提供足够的背景信息。这包括：把短期记忆（对话历史）整理成消息列表、从长期记忆中检索与当前问题相关的历史知识、从工作记忆中恢复之前执行到一半的任务状态。所有这些信息汇总后，作为 LLM 的输入上下文。

循环结束时，记忆系统需要把这一轮产生的新信息持久化：用户的新消息和 Agent 的回复添加到短期记忆、从对话中提取的重要信息（如用户偏好）保存到长期记忆、任务的中间状态更新到工作记忆。

我们来看一个结合了记忆系统的 Agent 实现：

```go
package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"sync"

	openai "github.com/sashabaranov/go-openai"
)

// MemorySystem 完整的记忆系统
type MemorySystem struct {
	shortTerm    []openai.ChatCompletionMessage // 短期记忆：对话历史
	longTerm     map[string]string              // 长期记忆：持久化知识
	workingState map[string]string              // 工作记忆：任务中间状态
	mu           sync.RWMutex
}

func NewMemorySystem() *MemorySystem {
	return &MemorySystem{
		shortTerm:    []openai.ChatCompletionMessage{},
		longTerm:     make(map[string]string),
		workingState: make(map[string]string),
	}
}

// BuildContext 构建 LLM 推理所需的完整上下文
func (m *MemorySystem) BuildContext(currentQuery string) []openai.ChatCompletionMessage {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var messages []openai.ChatCompletionMessage

	// 1. 系统提示词（融入长期记忆中的用户画像）
	systemPrompt := "你是一个智能助手。"
	if len(m.longTerm) > 0 {
		systemPrompt += "\n\n你已经了解的用户信息："
		for k, v := range m.longTerm {
			systemPrompt += fmt.Sprintf("\n- %s: %s", k, v)
		}
	}

	// 2. 融入工作记忆中的任务状态
	if len(m.workingState) > 0 {
		systemPrompt += "\n\n当前任务状态："
		for k, v := range m.workingState {
			systemPrompt += fmt.Sprintf("\n- %s: %s", k, v)
		}
	}

	messages = append(messages, openai.ChatCompletionMessage{
		Role:    "system",
		Content: systemPrompt,
	})

	// 3. 附加短期记忆（历史对话，保留最近的几轮）
	maxHistory := 10
	start := 0
	if len(m.shortTerm) > maxHistory {
		start = len(m.shortTerm) - maxHistory
	}
	messages = append(messages, m.shortTerm[start:]...)

	// 4. 当前用户输入
	messages = append(messages, openai.ChatCompletionMessage{
		Role:    "user",
		Content: currentQuery,
	})

	return messages
}

// AfterInteraction 交互后更新记忆
func (m *MemorySystem) AfterInteraction(userMsg, assistantMsg string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// 更新短期记忆
	m.shortTerm = append(m.shortTerm,
		openai.ChatCompletionMessage{Role: "user", Content: userMsg},
		openai.ChatCompletionMessage{Role: "assistant", Content: assistantMsg},
	)

	// 从对话中提取信息存入长期记忆（简化版，实际应用中应由 LLM 来提取）
	lower := strings.ToLower(userMsg)
	if strings.Contains(lower, "我叫") || strings.Contains(lower, "我是") {
		if strings.Contains(userMsg, "后端") || strings.Contains(userMsg, "Go") {
			m.longTerm["技术方向"] = "Go后端开发"
		}
	}
	if strings.Contains(lower, "项目") && strings.Contains(lower, "在做") {
		m.longTerm["当前项目"] = userMsg
	}
}

// SetWorkingState 设置工作记忆
func (m *MemorySystem) SetWorkingState(key, value string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.workingState[key] = value
}

// Status 返回记忆系统的状态概览
func (m *MemorySystem) Status() string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var parts []string
	parts = append(parts, fmt.Sprintf("短期记忆: %d 条消息", len(m.shortTerm)))
	parts = append(parts, fmt.Sprintf("长期记忆: %d 条", len(m.longTerm)))
	for k, v := range m.longTerm {
		parts = append(parts, fmt.Sprintf("  · %s = %s", k, v))
	}
	parts = append(parts, fmt.Sprintf("工作记忆: %d 条", len(m.workingState)))
	for k, v := range m.workingState {
		parts = append(parts, fmt.Sprintf("  · %s = %s", k, v))
	}
	return strings.Join(parts, "\n")
}

func main() {
	client := openai.NewClientWithConfig(openai.ClientConfig{
		BaseURL:   "https://dashscope.aliyuncs.com/compatible-mode/v1",
		APIType:   openai.APITypeOpenAI,
		AuthToken: os.Getenv("DASHSCOPE_API_KEY"),
	})

	memory := NewMemorySystem()

	// 模拟多轮对话，观察记忆系统的变化
	conversations := []string{
		"你好，我是一名Go后端开发工程师",
		"我最近在做一个微服务项目，用的是gRPC框架",
		"帮我解释一下context包在并发中的作用",
	}

	for i, userMsg := range conversations {
		fmt.Printf("\n====== 第 %d 轮 ======\n", i+1)
		fmt.Printf("用户: %s\n", userMsg)

		// 设置工作记忆（模拟任务状态跟踪）
		memory.SetWorkingState("当前对话轮次", fmt.Sprintf("第%d轮", i+1))

		// 从记忆系统构建完整上下文
		messages := memory.BuildContext(userMsg)

		// 调用 LLM
		resp, err := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
			Model:    "qwen-plus",
			Messages: messages,
		})
		if err != nil {
			fmt.Printf("请求失败: %v\n", err)
			continue
		}

		reply := resp.Choices[0].Message.Content
		fmt.Printf("Agent: %s\n", reply[:min(len(reply), 200)]) // 截取前200字符展示

		// 交互后更新记忆
		memory.AfterInteraction(userMsg, reply)
	}

	// 展示最终的记忆状态
	fmt.Printf("\n====== 记忆系统状态 ======\n%s\n", memory.Status())
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
```

运行结果：
```
====== 第 1 轮 ======
用户: 你好，我是一名Go后端开发工程师
Agent: 你好！很高兴认识你。Go语言在后端开发领域确实非常出色，特别是在高并发、微服务架构方面有着天然的优势。有什么我可以帮你的吗？

====== 第 2 轮 ======
用户: 我最近在做一个微服务项目，用的是gRPC框架
Agent: gRPC + Go 是微服务领域非常经典的技术组合。gRPC基于HTTP/2和Protocol Buffers，在性能和类型安全方面都有很大优势。你的项目进展如何？遇到什么具体问题了吗？

====== 第 3 轮 ======
用户: 帮我解释一下context包在并发中的作用
Agent: context包是Go并发编程中非常核心的工具，主要解决三个问题：超时控制、取消信号传播和请求级别的数据传递。在你的gRPC微服务项目中，context更是无处不在...

====== 记忆系统状态 ======
短期记忆: 6 条消息
长期记忆: 2 条
  · 技术方向 = Go后端开发
  · 当前项目 = 我最近在做一个微服务项目，用的是gRPC框架
工作记忆: 1 条
  · 当前对话轮次 = 第3轮
```

注意看第三轮对话中 Agent 的回答——它不仅解释了 context 包的通用作用，还主动关联到了用户"正在做的 gRPC 微服务项目"。这是因为记忆系统在第二轮对话后就把"当前项目是 gRPC 微服务"这个信息存入了长期记忆，第三轮构建上下文时这个信息被融入了系统提示词，LLM 自然就会结合用户的项目背景来回答。这就是记忆系统的价值——**让 Agent 的每一次回答都基于对用户的完整理解，而不是孤立地处理单个问题**。

### **3.4 规划模块：Agent 的导航仪**

规划模块是四大模块中最"高级"的一个——前面三个模块（LLM、工具、记忆）提供了基础能力，而规划模块让 Agent 能够处理真正复杂的任务。

为什么需要规划？因为很多真实世界的任务不是"调一个工具就能搞定"的。比如用户说"帮我做一个竞品分析报告"，这个任务涉及信息搜集、数据整理、对比分析、报告生成等多个阶段，每个阶段可能又需要调用不同的工具、处理不同的数据。如果没有规划，Agent 只能走一步看一步，很容易在中途迷失方向或者遗漏重要步骤。有了规划，Agent 就能在开始执行之前先制定一个全局计划，然后按照计划有条不紊地推进。

目前 Agent 的规划策略主要有三种主流思路。

**第一种是 ReAct 式的"边走边想"**。这就是我们前面讲的 ReAct 架构，它没有一个独立的"制定计划"环节，而是每一步都重新思考下一步该做什么。这种方式灵活性最高——每一步都能根据最新情况调整方向，但缺点是缺乏全局视野，容易"只见树木不见森林"。

**第二种是 Plan-and-Execute（先规划后执行）**。这种方式在任务开始时先让 LLM 制定一个完整的执行计划（分解为多个子任务），然后逐一执行这些子任务。好处是有全局视野，不会遗漏步骤；缺点是计划制定后比较"死板"，如果执行过程中情况发生变化，需要额外的机制来更新计划。

**第三种是两者结合——动态规划**。先制定一个初步计划，但在执行每一步后都会评估是否需要调整计划。这种方式综合了前两者的优点，但实现复杂度也最高。

> 【建议配图6 —— 三种规划策略的对比】
>
> 图片描述：白色背景。画面分为三行，每行展示一种规划策略。第一行标题"ReAct: 边走边想"（蓝色），右侧是一条蜿蜒的路径线，路径上有四个脚印图标依次排列，每个脚印上方有一个小思考气泡图标。路径没有预设终点的标记，给人"走到哪算哪"的感觉。最右侧标注优缺点：绿色文字"灵活应变"，红色文字"缺乏全局视野"。第二行标题"Plan-and-Execute: 先规划后执行"（橙色），右侧是先有一个地图/蓝图图标（标注"制定计划"），然后一条直线箭头连接到一系列整齐排列的方块（①→②→③→④），方块依次亮绿色（已完成）和灰色（待执行）。最右侧标注：绿色"全局有序"，红色"计划僵化"。第三行标题"动态规划: 先规划 + 边执行边调整"（紫色），右侧是一个地图图标连接到方块序列，但方块②和③之间有一个弯曲的反馈箭头回到地图图标（标注"重新评估"），表示计划可以中途调整。方块序列中③号方块有一个小编辑/铅笔图标叠加（表示计划被修改过）。最右侧标注：绿色"灵活且有序"，红色"实现复杂"。三行之间有浅灰色分隔线。左下角有一个小的总结标签："复杂度 ↑ | 适用场景由简到繁"。
>
> 整体目的：让读者快速对比三种规划策略的特点和适用场景，在后续实战中能做出合理选择。

我们来实现一个 Plan-and-Execute 策略的简化版本：

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

// Plan 执行计划
type Plan struct {
	Goal  string   // 总目标
	Steps []string // 分解后的步骤
}

// PlanAndExecuteAgent 先规划后执行的 Agent
type PlanAndExecuteAgent struct {
	client *openai.Client
}

func NewPlanAndExecuteAgent(client *openai.Client) *PlanAndExecuteAgent {
	return &PlanAndExecuteAgent{client: client}
}

// MakePlan 让 LLM 制定执行计划
func (a *PlanAndExecuteAgent) MakePlan(goal string) (*Plan, error) {
	resp, err := a.client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
		Model: "qwen-plus",
		Messages: []openai.ChatCompletionMessage{
			{
				Role: "system",
				Content: `你是一个任务规划专家。用户会给你一个目标，你需要将其分解为3-5个可执行的步骤。
请严格按照JSON格式返回，不要包含其他内容：
{"steps": ["步骤1", "步骤2", "步骤3"]}`,
			},
			{Role: "user", Content: goal},
		},
	})
	if err != nil {
		return nil, err
	}

	var result struct {
		Steps []string `json:"steps"`
	}
	content := resp.Choices[0].Message.Content
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		// 尝试提取 JSON 部分
		return &Plan{
			Goal:  goal,
			Steps: []string{"分析需求", "执行任务", "输出结果"},
		}, nil
	}

	return &Plan{Goal: goal, Steps: result.Steps}, nil
}

// ExecuteStep 执行计划中的单个步骤
func (a *PlanAndExecuteAgent) ExecuteStep(step string, previousResults []string) (string, error) {
	contextInfo := ""
	if len(previousResults) > 0 {
		contextInfo = "\n\n前面步骤的执行结果：\n"
		for i, r := range previousResults {
			contextInfo += fmt.Sprintf("步骤%d结果: %s\n", i+1, r)
		}
	}

	resp, err := a.client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
		Model: "qwen-plus",
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    "system",
				Content: "你是一个任务执行助手。请执行用户指定的步骤并给出简洁的结果。" + contextInfo,
			},
			{Role: "user", Content: fmt.Sprintf("请执行这个步骤: %s", step)},
		},
	})
	if err != nil {
		return "", err
	}
	return resp.Choices[0].Message.Content, nil
}

// Run 完整的规划-执行流程
func (a *PlanAndExecuteAgent) Run(goal string) {
	fmt.Printf("🎯 目标: %s\n", goal)
	fmt.Println("\n📋 正在制定执行计划...")

	// 阶段一：制定计划
	plan, err := a.MakePlan(goal)
	if err != nil {
		fmt.Printf("规划失败: %v\n", err)
		return
	}

	fmt.Printf("✅ 计划制定完成，共 %d 个步骤:\n", len(plan.Steps))
	for i, step := range plan.Steps {
		fmt.Printf("   %d. %s\n", i+1, step)
	}

	// 阶段二：逐步执行
	var results []string
	for i, step := range plan.Steps {
		fmt.Printf("\n🔄 执行步骤 %d/%d: %s\n", i+1, len(plan.Steps), step)

		result, err := a.ExecuteStep(step, results)
		if err != nil {
			fmt.Printf("❌ 步骤执行失败: %v\n", err)
			continue
		}
		results = append(results, result)

		// 只展示结果的前150个字符
		display := result
		if len(display) > 150 {
			display = display[:150] + "..."
		}
		fmt.Printf("   结果: %s\n", display)
	}

	fmt.Println("\n✅ 所有步骤执行完成！")
}

func main() {
	client := openai.NewClientWithConfig(openai.ClientConfig{
		BaseURL:   "https://dashscope.aliyuncs.com/compatible-mode/v1",
		APIType:   openai.APITypeOpenAI,
		AuthToken: os.Getenv("DASHSCOPE_API_KEY"),
	})

	agent := NewPlanAndExecuteAgent(client)
	agent.Run("帮我分析Go语言和Rust语言在Web后端开发领域的优劣势对比")
}
```

运行结果：
```
🎯 目标: 帮我分析Go语言和Rust语言在Web后端开发领域的优劣势对比

📋 正在制定执行计划...
✅ 计划制定完成，共 4 个步骤:
   1. 梳理Go语言在Web后端开发中的核心优势和不足
   2. 梳理Rust语言在Web后端开发中的核心优势和不足
   3. 从性能、开发效率、生态、学习曲线等维度进行对比分析
   4. 给出不同场景下的技术选型建议

🔄 执行步骤 1/4: 梳理Go语言在Web后端开发中的核心优势和不足
   结果: Go语言的核心优势：语法简洁易学，编译速度快，原生支持高并发（goroutine+channel），标准库丰富（net/http开箱即用），部署简单（编译成单一二进制文件）。不足之处...

🔄 执行步骤 2/4: 梳理Rust语言在Web后端开发中的核心优势和不足
   结果: Rust的核心优势：内存安全（所有权系统，无GC），极致性能（接近C/C++），类型系统强大，并发安全（编译期保证）。不足：学习曲线陡峭（所有权和生命周期概念），编译速度慢...

🔄 执行步骤 3/4: 从性能、开发效率、生态、学习曲线等维度进行对比分析
   结果: 性能方面：Rust略优于Go，尤其在CPU密集型场景下。开发效率：Go明显优于Rust，同等复杂度的项目Go开发周期通常更短。生态：Go在Web后端生态更成熟（Gin、Echo、gR...

🔄 执行步骤 4/4: 给出不同场景下的技术选型建议
   结果: 建议：追求快速迭代和团队协作效率选Go，追求极致性能和内存安全选Rust。中小型Web服务和微服务推荐Go，高性能基础设施（数据库、代理、消息中间件）推荐Rust...

✅ 所有步骤执行完成！
```

Plan-and-Execute 模式的特点在这个例子中体现得很清楚：Agent 先制定了一个包含 4 个步骤的完整计划，然后严格按照计划逐步执行。每一步的执行结果会传递给后续步骤作为参考（通过 `previousResults` 参数），这保证了步骤之间的连贯性——第三步的对比分析是基于前两步的梳理结果来做的，而不是凭空编造。

## **4. 四大模块的协作全景**

讲完了四个独立模块，最后我们把视角拉到最高，看看它们在一次完整的 Agent 任务中是如何协同工作的。

假设用户对 Agent 说了一句"帮我查查最近的 Go 1.24 有什么新特性，整理成中文摘要"。以下是 Agent 内部的完整运行过程：

首先，**记忆系统**出场。它把用户的这句话和之前的对话历史（短期记忆）、用户的技术偏好（长期记忆里记着"这个用户是 Go 开发者"）一起整理好，构建出完整的上下文。

接着，**LLM** 拿到这个上下文开始推理。它的 Thought 可能是："用户想了解 Go 1.24 的新特性，这是实时信息，我需要先搜索一下。"于是它生成了一个 Function Call 请求：调用 `web_search` 工具，参数是 "Go 1.24 release notes"。

然后，**工具系统**登场。它接收到 LLM 的调用请求，执行 `web_search` 工具，拿到了一堆搜索结果。

结果返回给 **LLM**，它进行第二轮推理："搜索结果拿到了，但内容是英文的，用户要的是中文摘要。我已经有了足够的信息，可以直接整理了。"于是它不再调用工具，而是直接生成了一份中文摘要作为最终回答。

最后，**记忆系统**再次出场，把这次的对话（用户的问题和 Agent 的回答）存入短期记忆，同时可能在长期记忆中更新一条"用户关注 Go 新版本动态"的标签。

在这个过程中，如果任务更复杂（比如"帮我对比 Go 1.24 和 Go 1.23 的性能差异"），**规划模块**也会参与进来，把大任务拆解成"搜索 1.24 特性→搜索 1.23 特性→对比分析→生成报告"这样的执行计划。

> 【建议配图7 —— 四大模块协作的完整时序图】
>
> 图片描述：白色背景。画面采用 UML 时序图风格的纵向布局，顶部横排五个参与者：最左侧"用户"（人形图标），然后依次是"记忆系统"（笔记本图标，蓝色底色条）、"LLM"（大脑图标，橙色底色条）、"规划模块"（地图图标，紫色底色条）、"工具系统"（齿轮图标，绿色底色条）。每个参与者下方有一条纵向虚线（生命线）。从上到下，按时间顺序画出交互消息箭头：①用户→记忆系统：实线箭头"用户输入"（蓝色）。②记忆系统→LLM：实线箭头"完整上下文（对话历史+用户画像）"。③LLM→规划模块：虚线箭头"复杂任务？制定计划"（仅复杂任务时触发，箭头用虚线表示可选）。④规划模块→LLM：虚线回复箭头"执行计划"。⑤LLM 内部：一个自指的弧形箭头，标注"Thought: 推理决策"。⑥LLM→工具系统：实线箭头"Function Call 请求"（绿色）。⑦工具系统→LLM：实线回复箭头"执行结果"（紫色）。⑧重复⑤-⑦的循环（用一个竖长的矩形框框住，标注"循环直到完成"）。⑨LLM→记忆系统：实线箭头"存储新信息"。⑩LLM→用户：实线箭头"最终回答"（绿色粗箭头）。整体布局清晰，消息箭头按时间从上到下排列，颜色编码与参与者一致。
>
> 整体目的：用时序图清晰展示一次完整的 Agent 任务中四大模块之间的协作关系和信息流动顺序。

四个模块各司其职又紧密配合：LLM 是指挥中心，工具系统是执行部门，记忆系统是档案室，规划模块是参谋部。它们之间的分工明确，但接口统一——这也是为什么像 ADK 这样的框架能把它们优雅地组装在一起的原因。

## **5. 小结**

一个 Agent 系统从外面看只是"你给它一个目标，它帮你完成"，但打开引擎盖，里面是一个精密运转的循环机器。感知-思考-行动-观察的循环是这台机器的心跳，ReAct 则让每次心跳都变得可解释、可追溯——模型不再是一个沉默的黑盒，而是会把自己的推理过程摊开在桌面上，你能看到它在想什么、为什么这么做。

四大模块——LLM 提供智能、工具提供能力、记忆提供上下文、规划提供策略——就像一个人的大脑、手脚、记忆和规划能力，缺少任何一个，Agent 都不完整。但更重要的是理解它们之间的协作方式：不是各模块独立运行然后汇总结果，而是在每一轮循环中深度交织、动态配合。理解了这个架构，你就能看懂几乎所有 Agent 框架的设计逻辑——因为不管框架怎么包装，底层都是这一套东西。

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
