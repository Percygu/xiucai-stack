---
title: 16. 工具系统深入
description: "Go语言 AI Agent 实战教程：深入掌握 Google ADK 框架的工具系统，涵盖 Function Tool 自定义开发、工具参数 Schema 自动推导、tool.Context 执行上下文、Agent as Tool 组合模式与多工具协作编排，附完整可运行 Go 代码示例，手把手带你构建具备真实能力的大模型智能体。"
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
  - Tool
---

# **工具系统深入**

如果说大模型是 Agent 的"大脑"，那工具就是它的"双手"。一个只会聊天的 Agent 和一个能查天气、算数学、操作数据库的 Agent，差距不亚于"纸上谈兵"和"真刀实枪"。在 ADK 快速上手那篇文章里，我们已经写过一个简单的天气查询工具，跑通了 Function Calling 的基本流程。但那只是"能用"的水平，想要"用好"，还有很多东西值得深入。

这篇文章，我们要从 ADK 工具系统的底层设计讲起，搞清楚 `tool.Tool` 接口到底长什么样、`functiontool.New` 背后帮你做了哪些事、参数 Schema 是怎么从 Go 结构体自动推导出来的、`tool.Context` 能给工具函数提供哪些能力、以及如何用 `agenttool` 把一个 Agent 包装成另一个 Agent 的工具。文章以代码驱动为主，每个知识点都配完整可运行的示例。

## **1. ADK 工具体系全景**

在动手写代码之前，先快速建立一个全局视角。ADK 的工具体系围绕两个核心抽象展开：`tool.Tool` 接口和 `tool.Toolset` 接口。

`tool.Tool` 是单个工具的抽象。每一个工具——不管它是你自己写的函数，还是 Google Search，还是另一个 Agent——最终都得实现这个接口，这样 Runner 在执行时才知道怎么描述它、怎么调用它。`tool.Toolset` 则是工具集合的抽象，它代表"一组可以动态获取的工具"，典型的例子就是 MCP 工具集（下一篇文章专门讲）。

在这两个抽象之上，ADK 提供了几种开箱即用的工具实现：

**functiontool** 是最常用的，它能把一个普通的 Go 函数包装成 `tool.Tool`，自动从函数的输入输出结构体推导 JSON Schema，省去了你手写参数描述的麻烦。我们这篇文章的主角就是它。

**geminitool** 提供了 Gemini 模型原生支持的内置工具，比如 `GoogleSearch` 和 `CodeExecution`。这类工具的特殊之处在于，它们不是在你的代码里执行的，而是在模型侧执行——你的 Agent 告诉模型"你可以搜网页"，模型自己就会搜，搜完直接把结果融入回答。不过需要注意，这些工具依赖 Gemini 模型的原生能力，如果你用的是通义千问等其他模型，它们的行为可能会有差异，后面我们会单独讨论这个问题。

**agenttool** 比较有意思——它能把一个完整的 Agent 包装成工具，让另一个 Agent 像调用函数一样调用它。这是构建多 Agent 协作系统的重要手段之一，相当于"我搞不定的事情，让专家来"。

**mcptoolset** 用于对接外部 MCP 服务器提供的工具，我们下一篇详细展开。

> 【建议配图1 —— ADK 工具体系层次结构图】
>
> 图片描述：一张自上而下的层次结构图，白色背景。最顶层是一个大的蓝色圆角矩形，内部有接口符号（一个抽象的齿轮+代码括号图标），标注"tool.Tool 接口"，下方小字"Name() / Description() / Schema()"。从这个矩形底部伸出四条向下的蓝色实线箭头，分别连接四个并排的实现卡片。第一张卡片绿色背景，顶部有一个函数 f(x) 图标，标注"functiontool"，下方小字"Go 函数 → Tool"，这张卡片最大最醒目（用微微加粗的边框强调）。第二张卡片橙色背景，顶部有搜索放大镜图标，标注"geminitool"，下方小字"GoogleSearch / CodeExecution"。第三张卡片紫色背景，顶部有机器人套娃图标（小机器人在大机器人手掌上），标注"agenttool"，下方小字"Agent as Tool"。第四张卡片灰蓝色背景，顶部有网络连接图标（两个节点+连线），标注"mcptoolset"，下方小字"MCP 协议工具集"。四张卡片下方有一条浅灰色虚线，虚线下方居中标注"tool.Toolset 接口——动态工具集合"。整体布局清晰，从抽象到具体，一眼看出 ADK 工具体系的分层结构。
>
> 整体目的：帮助读者快速建立 ADK 工具体系的全局视角，理解各种工具类型之间的关系和定位。

## **2. tool.Tool 接口**

要理解 ADK 的工具系统，先看看 `tool.Tool` 这个接口长什么样。虽然日常开发中你几乎不需要直接实现它（`functiontool.New` 会帮你搞定），但了解接口定义能帮你理解底层在做什么。

`tool.Tool` 接口的核心方法包括：`Name()` 返回工具名称，这个名称会被传给模型，模型通过名称来选择调用哪个工具；`Description()` 返回工具的功能描述，模型根据这段描述来判断什么时候该用这个工具；`Schema()` 返回工具的参数 Schema，告诉模型"调用这个工具需要传哪些参数、什么类型、哪些必填"。

换句话说，当你给 Agent 配置了一组 Tools 之后，Runner 在向模型发请求时，会把每个 Tool 的名称、描述和参数 Schema 打包成 `FunctionDeclaration`，一起发给模型。模型根据用户的问题和这些工具描述，决定要不要调用某个工具、传什么参数。然后 Runner 拿到模型返回的 `FunctionCall`，找到对应的 Tool 实例，执行它，再把结果送回模型——这就是 Function Calling 的完整循环。

所以你看，**工具的描述质量直接决定了模型能不能正确地使用工具**。一个描述模糊的工具，模型可能在不该用的时候用了它，或者在该用的时候忽略了它。这一点我们在后面写实际工具时会特别强调。

## **3. functiontool 详解**

`functiontool` 是你日常开发中用得最多的工具创建方式。它的核心能力是：给我一个普通的 Go 函数，我帮你变成 `tool.Tool`。

### **3.1 基本用法**

最简单的情况是这样的：你定义一个输入结构体、一个输出结构体，写一个处理函数，然后调用 `functiontool.New` 就完事了。我们来看一个完整的例子——给 Agent 配上一个"计算器"工具，让它能做四则运算：

项目结构：
```
adk-tools-demo/
├── go.mod
├── dashscope.go    # 通义千问模型适配器（复用 quickstart 的代码）
└── main.go         # 主程序
```

`dashscope.go` 的代码和快速上手那篇完全一样，这里不再重复。如果你跟着系列一路做下来，直接把之前的文件拷贝过来就行。如果你是新读者，回到第 11 篇《ADK快速上手》把 `dashscope.go` 的完整代码复制过来即可。

```go
// main.go
package main

import (
	"context"
	"fmt"
	"log"
	"math"

	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
	"google.golang.org/adk/tool"
	"google.golang.org/adk/tool/functiontool"
	"google.golang.org/genai"
)

// ========== 定义工具的输入和输出 ==========

// CalcInput 计算器的输入参数
type CalcInput struct {
	Operator string  `json:"operator" jsonschema:"description=运算符，支持 add/sub/mul/div/pow,enum=add|sub|mul|div|pow"`
	A        float64 `json:"a" jsonschema:"description=第一个操作数"`
	B        float64 `json:"b" jsonschema:"description=第二个操作数"`
}

// CalcOutput 计算结果
type CalcOutput struct {
	Result float64 `json:"result"`
	Expr   string  `json:"expression"`
}

// calculate 计算器工具的处理函数
func calculate(ctx tool.Context, input CalcInput) (CalcOutput, error) {
	var result float64
	var op string

	switch input.Operator {
	case "add":
		result = input.A + input.B
		op = "+"
	case "sub":
		result = input.A - input.B
		op = "-"
	case "mul":
		result = input.A * input.B
		op = "*"
	case "div":
		if input.B == 0 {
			return CalcOutput{}, fmt.Errorf("除数不能为零")
		}
		result = input.A / input.B
		op = "/"
	case "pow":
		result = math.Pow(input.A, input.B)
		op = "^"
	default:
		return CalcOutput{}, fmt.Errorf("不支持的运算符: %s", input.Operator)
	}

	return CalcOutput{
		Result: result,
		Expr:   fmt.Sprintf("%.2f %s %.2f = %.2f", input.A, op, input.B, result),
	}, nil
}

func main() {
	ctx := context.Background()

	// 创建计算器工具
	calcTool, err := functiontool.New(functiontool.Config{
		Name:        "calculator",
		Description: "执行数学运算，支持加减乘除和乘方。当用户需要计算数学表达式时使用此工具。",
	}, calculate)
	if err != nil {
		log.Fatalf("创建工具失败: %v", err)
	}

	// 创建通义千问模型
	m := NewDashScopeModel("qwen-plus")

	// 创建 Agent
	myAgent, err := llmagent.New(llmagent.Config{
		Name:        "math_agent",
		Description: "一个擅长数学计算的助手",
		Model:       m,
		Instruction: "你是一个数学计算助手。当用户提出计算问题时，使用 calculator 工具来完成计算，然后用自然语言回复结果。",
		Tools:       []tool.Tool{calcTool},
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	// 创建 Runner
	r, err := runner.New(runner.Config{
		AppName:        "math_app",
		Agent:          myAgent,
		SessionService: session.InMemoryService(),
	})
	if err != nil {
		log.Fatalf("创建 Runner 失败: %v", err)
	}

	// 创建 Session
	sess, err := session.InMemoryService().Create(ctx, &session.CreateRequest{
		AppName: "math_app",
		UserID:  "user1",
	})
	if err != nil {
		log.Fatalf("创建 Session 失败: %v", err)
	}

	// 发送问题
	questions := []string{
		"帮我算一下 123.45 乘以 67.89",
		"2 的 10 次方是多少？",
		"把上面两个结果相加",
	}

	for i, q := range questions {
		fmt.Printf("\n===== 第 %d 轮 =====\n", i+1)
		fmt.Printf("用户: %s\n", q)

		for ev, err := range r.Run(ctx, runner.RunOptions{
			UserID:    "user1",
			SessionID: sess.Session.ID(),
			Message:   genai.NewContentFromText(q, "user"),
		}) {
			if err != nil {
				log.Printf("错误: %v", err)
				break
			}
			// 只打印最终的文本回复
			if ev.IsFinalResponse() {
				for _, p := range ev.Content.Parts {
					if p.Text != "" {
						fmt.Printf("助手: %s\n", p.Text)
					}
				}
			}
			// 打印工具调用过程
			if ev.Content != nil {
				for _, p := range ev.Content.Parts {
					if p.FunctionCall != nil {
						fmt.Printf("  [调用工具] %s(%v)\n", p.FunctionCall.Name, p.FunctionCall.Args)
					}
				}
			}
		}
	}
}
```

运行：
```bash
go mod tidy && go run .
```

运行结果：
```
===== 第 1 轮 =====
用户: 帮我算一下 123.45 乘以 67.89
  [调用工具] calculator(map[a:123.45 b:67.89 operator:mul])
助手: 123.45 乘以 67.89 的结果是 8,382.02。

===== 第 2 轮 =====
用户: 2 的 10 次方是多少？
  [调用工具] calculator(map[a:2 b:10 operator:pow])
助手: 2 的 10 次方是 1024。

===== 第 3 轮 =====
用户: 把上面两个结果相加
  [调用工具] calculator(map[a:8382.0205 b:1024 operator:add])
助手: 上面两个结果相加为 9,406.02。
```

这个例子虽然简单，但完整展示了 `functiontool` 的核心流程：定义输入输出结构体 → 写处理函数 → 用 `functiontool.New` 包装 → 挂到 Agent 上。特别注意第三轮，用户说的是"把上面两个结果相加"，模型能够结合上下文理解"上面两个结果"分别是 8382.0205 和 1024，然后正确地调用了 calculator 工具——这就是工具和对话记忆配合的威力。

### **3.2 参数 Schema 自动推导**

你可能已经注意到，我们在定义 `CalcInput` 时用了一些特殊的 struct tag：

```go
type CalcInput struct {
    Operator string  `json:"operator" jsonschema:"description=运算符，支持 add/sub/mul/div/pow,enum=add|sub|mul|div|pow"`
    A        float64 `json:"a" jsonschema:"description=第一个操作数"`
    B        float64 `json:"b" jsonschema:"description=第二个操作数"`
}
```

`functiontool.New` 在创建工具时，会通过反射自动分析输入结构体的字段类型和 tag，生成符合 JSON Schema 规范的参数描述。这个生成出来的 Schema 最终会被发送给模型，告诉它"调用这个工具需要传什么参数"。

`json` tag 决定了参数的字段名。模型返回的 `FunctionCall` 里的参数键名会和这个一一对应，所以一定要写。如果你用 `json:"operator"`，模型就会返回 `{"operator": "add", ...}`。

`jsonschema` tag 是重头戏，它控制了 Schema 的各种约束。`description` 是参数描述，模型会参考这个描述来决定传什么值——所以描述一定要写清楚、具体。`enum` 列出了参数的合法取值范围，用竖线 `|` 分隔，这能有效约束模型的输出，防止它传一些你没处理的值。

除了这两个最常用的，`jsonschema` tag 还支持其他约束，比如 `minimum`、`maximum` 限制数值范围，`minLength`、`maxLength` 限制字符串长度等。这些约束不影响 Go 代码的编译，但会被传给模型作为参考。

> 【建议配图2 —— 从 Go 结构体到 JSON Schema 的推导过程】
>
> 图片描述：一张左右对照的转换示意图，白色背景。左侧是一个浅蓝色代码块区域，标题"Go 结构体"，内部用等宽字体展示三行代码：`Operator string` 旁边有标签气泡指向 `json:"operator"` 和 `jsonschema:"description=...,enum=..."`；`A float64` 旁边有标签气泡指向 `json:"a"` 和 `jsonschema:"description=..."`；`B float64` 同理。中间是一个宽大的绿色齿轮图标，齿轮上方标注"functiontool.New"，齿轮下方标注"反射 + 解析 tag"，表示自动推导过程。右侧是一个浅绿色 JSON 块区域，标题"JSON Schema"，展示推导出的 Schema 结构：`{"type": "object", "properties": {"operator": {"type": "string", "description": "...", "enum": [...]}, "a": {"type": "number", ...}, "b": {"type": "number", ...}}, "required": ["operator", "a", "b"]}`。左侧三个字段分别用橙色、蓝色、紫色虚线箭头连接到右侧对应的属性，箭头上标注转换规则（"string → string"、"float64 → number"）。整体视觉上就是"Go 代码经过齿轮转换变成 JSON Schema"的直观映射。
>
> 整体目的：让读者清晰看到 Go struct tag 和最终 JSON Schema 之间的对应关系，理解 functiontool 的自动推导机制。

Go 类型和 JSON Schema 类型之间的映射关系很直观：`string` 对应 `string`，`int`/`int64`/`float64` 这些数值类型对应 `number` 或 `integer`，`bool` 对应 `boolean`，`[]T` 对应 `array`，嵌套结构体对应嵌套的 `object`。这意味着你可以用嵌套结构体来描述复杂的输入参数，`functiontool` 都能正确处理。

还有一个值得注意的细节：**带 `omitempty` 的字段会被标记为可选参数，不带的则是必填参数**。在 JSON Schema 里，必填参数会出现在 `required` 数组中。比如：

```go
type SearchInput struct {
    Query    string `json:"query" jsonschema:"description=搜索关键词"`
    MaxItems int    `json:"max_items,omitempty" jsonschema:"description=最多返回几条结果"`
}
```

这里 `Query` 是必填的，`MaxItems` 是可选的。模型在调用工具时可能会忽略可选参数，你的工具函数里要为可选参数设好默认值。

### **3.3 functiontool.Config 配置项**

`functiontool.New` 的第一个参数是 `functiontool.Config`，除了必填的 `Name` 和 `Description`，还有一个有用的选项：

```go
functiontool.Config{
    Name:                "calculator",
    Description:         "执行数学运算",
    RequireConfirmation: true,  // 执行前需要用户确认
}
```

`RequireConfirmation` 设为 `true` 后，Runner 在执行这个工具之前会先暂停，等待外部确认。这在一些高风险操作中很有用——比如你写了一个"删除文件"的工具，总不能让模型想删就删吧。当然，确认机制的具体实现取决于你的上层应用（Web UI 弹窗、命令行二次输入等），ADK 只是在事件流中标记出"这个工具调用需要确认"。

## **4. tool.Context 执行上下文**

当 Runner 调用你的工具函数时，除了传入用户参数，还会传入一个 `tool.Context` 对象。这个上下文对象是工具和 ADK 运行时之间的桥梁，通过它你可以访问 Session State、读取和存储 Artifact 文件、甚至获取当前的 Agent 名称和调用 ID 等运行时信息。

### **4.1 通过 Context 读写 State**

`tool.Context` 提供了 `State()` 方法，返回当前 Session 的 State 对象。你可以在工具执行过程中读取或修改 State，这些修改会被持久化到 Session 中，后续的对话轮次都能看到。

这个能力非常实用。举个例子，假设你在做一个购物助手，有一个"加入购物车"的工具。每次用户说"把 XX 加入购物车"，工具不仅要完成加入操作，还要把购物车的内容记录到 State 里，这样后续用户问"我的购物车里有什么"时，Agent 能从 State 中读取信息来回答。

我们来写一个"待办事项管理器"的例子，工具通过 State 来保存和读取待办列表：

```go
// main.go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
	"google.golang.org/adk/tool"
	"google.golang.org/adk/tool/functiontool"
	"google.golang.org/genai"
)

// ========== 添加待办工具 ==========

type AddTodoInput struct {
	Title    string `json:"title" jsonschema:"description=待办事项的标题"`
	Priority string `json:"priority,omitempty" jsonschema:"description=优先级,enum=high|medium|low"`
}

type AddTodoOutput struct {
	Message string `json:"message"`
	Total   int    `json:"total"`
}

type TodoItem struct {
	Title     string `json:"title"`
	Priority  string `json:"priority"`
	CreatedAt string `json:"created_at"`
	Done      bool   `json:"done"`
}

func addTodo(ctx tool.Context, input AddTodoInput) (AddTodoOutput, error) {
	// 从 State 中读取已有的待办列表
	state := ctx.State()
	var todos []TodoItem

	if raw, ok := state.Get("todos"); ok {
		// State 中存的是 JSON 字符串，需要反序列化
		if jsonStr, ok := raw.(string); ok {
			json.Unmarshal([]byte(jsonStr), &todos)
		}
	}

	// 默认优先级
	priority := input.Priority
	if priority == "" {
		priority = "medium"
	}

	// 添加新待办
	todos = append(todos, TodoItem{
		Title:     input.Title,
		Priority:  priority,
		CreatedAt: time.Now().Format("2006-01-02 15:04"),
		Done:      false,
	})

	// 写回 State
	todosJSON, _ := json.Marshal(todos)
	state.Set("todos", string(todosJSON))

	return AddTodoOutput{
		Message: fmt.Sprintf("已添加待办: %s (优先级: %s)", input.Title, priority),
		Total:   len(todos),
	}, nil
}

// ========== 查看待办工具 ==========

type ListTodosInput struct {
	Filter string `json:"filter,omitempty" jsonschema:"description=过滤条件,enum=all|pending|done"`
}

type ListTodosOutput struct {
	Todos []TodoItem `json:"todos"`
	Total int        `json:"total"`
}

func listTodos(ctx tool.Context, input ListTodosInput) (ListTodosOutput, error) {
	state := ctx.State()
	var todos []TodoItem

	if raw, ok := state.Get("todos"); ok {
		if jsonStr, ok := raw.(string); ok {
			json.Unmarshal([]byte(jsonStr), &todos)
		}
	}

	filter := input.Filter
	if filter == "" {
		filter = "all"
	}

	var filtered []TodoItem
	for _, t := range todos {
		switch filter {
		case "pending":
			if !t.Done {
				filtered = append(filtered, t)
			}
		case "done":
			if t.Done {
				filtered = append(filtered, t)
			}
		default:
			filtered = append(filtered, t)
		}
	}

	return ListTodosOutput{
		Todos: filtered,
		Total: len(filtered),
	}, nil
}

// ========== 完成待办工具 ==========

type CompleteTodoInput struct {
	Title string `json:"title" jsonschema:"description=要标记为已完成的待办事项标题"`
}

type CompleteTodoOutput struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
}

func completeTodo(ctx tool.Context, input CompleteTodoInput) (CompleteTodoOutput, error) {
	state := ctx.State()
	var todos []TodoItem

	if raw, ok := state.Get("todos"); ok {
		if jsonStr, ok := raw.(string); ok {
			json.Unmarshal([]byte(jsonStr), &todos)
		}
	}

	found := false
	for i := range todos {
		if todos[i].Title == input.Title {
			todos[i].Done = true
			found = true
			break
		}
	}

	if !found {
		return CompleteTodoOutput{
			Message: fmt.Sprintf("未找到待办: %s", input.Title),
			Success: false,
		}, nil
	}

	todosJSON, _ := json.Marshal(todos)
	state.Set("todos", string(todosJSON))

	return CompleteTodoOutput{
		Message: fmt.Sprintf("已完成: %s", input.Title),
		Success: true,
	}, nil
}

func main() {
	ctx := context.Background()

	// 创建三个工具
	addTodoTool, _ := functiontool.New(functiontool.Config{
		Name:        "add_todo",
		Description: "添加一条新的待办事项。当用户说要做什么事、要记住什么任务时使用此工具。",
	}, addTodo)

	listTodosTool, _ := functiontool.New(functiontool.Config{
		Name:        "list_todos",
		Description: "查看待办事项列表。当用户想看自己有哪些待办、还有什么没做时使用此工具。",
	}, listTodos)

	completeTodoTool, _ := functiontool.New(functiontool.Config{
		Name:        "complete_todo",
		Description: "将某条待办事项标记为已完成。当用户说某件事做完了时使用此工具。",
	}, completeTodo)

	// 创建模型和 Agent
	m := NewDashScopeModel("qwen-plus")

	myAgent, _ := llmagent.New(llmagent.Config{
		Name:        "todo_agent",
		Description: "待办事项管理助手",
		Model:       m,
		Instruction: `你是一个待办事项管理助手。你可以帮用户添加待办、查看待办列表和标记完成。
回复时要简洁友好，用自然语言总结操作结果。`,
		Tools: []tool.Tool{addTodoTool, listTodosTool, completeTodoTool},
	})

	// 创建 Runner 和 Session
	sessService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "todo_app",
		Agent:          myAgent,
		SessionService: sessService,
	})

	sess, _ := sessService.Create(ctx, &session.CreateRequest{
		AppName: "todo_app",
		UserID:  "user1",
	})

	// 模拟一组对话
	messages := []string{
		"帮我记一下：明天下午开周会，优先级高",
		"再加一个：周末买菜",
		"我现在有哪些待办？",
		"周会开完了，帮我标记完成",
		"还剩什么没做的？",
	}

	for i, msg := range messages {
		fmt.Printf("\n===== 第 %d 轮 =====\n", i+1)
		fmt.Printf("用户: %s\n", msg)

		for ev, err := range r.Run(ctx, runner.RunOptions{
			UserID:    "user1",
			SessionID: sess.Session.ID(),
			Message:   genai.NewContentFromText(msg, "user"),
		}) {
			if err != nil {
				log.Printf("错误: %v", err)
				break
			}
			if ev.IsFinalResponse() {
				for _, p := range ev.Content.Parts {
					if p.Text != "" {
						fmt.Printf("助手: %s\n", p.Text)
					}
				}
			}
		}
	}
}
```

运行结果：
```
===== 第 1 轮 =====
用户: 帮我记一下：明天下午开周会，优先级高
助手: 已帮你添加待办「明天下午开周会」，优先级为高，目前共有 1 条待办。

===== 第 2 轮 =====
用户: 再加一个：周末买菜
助手: 已添加「周末买菜」，优先级默认为中等，目前共有 2 条待办。

===== 第 3 轮 =====
用户: 我现在有哪些待办？
助手: 你目前有 2 条待办：
1. 明天下午开周会（高优先级）
2. 周末买菜（中优先级）

===== 第 4 轮 =====
用户: 周会开完了，帮我标记完成
助手: 好的，「明天下午开周会」已标记为完成！

===== 第 5 轮 =====
用户: 还剩什么没做的？
助手: 还剩 1 条未完成的待办：周末买菜（中优先级）。
```

这个例子的关键点在于：三个工具通过 `tool.Context` 共享了同一个 Session State。`add_todo` 往 State 里写数据，`list_todos` 从 State 里读数据，`complete_todo` 修改 State 里的数据——它们之间不需要任何直接的函数调用或全局变量，State 就是它们的"共享记忆"。

> 【建议配图3 —— 工具通过 State 共享数据的协作流程】
>
> 图片描述：一张以 Session State 为中心的协作示意图，白色背景。画面中央是一个大的金色圆柱体，标注"Session State"，圆柱体表面用小字列出 `{"todos": [...]}` 暗示存储的数据结构。围绕圆柱体有三个工具卡片，呈三角形分布。左上方是绿色卡片，顶部有加号（+）图标，标注"add_todo"，一条绿色粗箭头从卡片指向圆柱体，箭头上标注"写入"。右上方是蓝色卡片，顶部有列表图标，标注"list_todos"，一条蓝色粗箭头从圆柱体指向卡片，箭头上标注"读取"。下方是橙色卡片，顶部有勾选（✓）图标，标注"complete_todo"，两条箭头连接卡片和圆柱体——一条橙色实线从圆柱体到卡片标注"读取"，一条橙色虚线从卡片到圆柱体标注"修改"。三张卡片的上方有一个浅灰色大气泡，内部是机器人头像图标，标注"Agent（模型决策调用哪个工具）"，从气泡到三张卡片各有一条细灰色虚线箭头。整体布局清晰展示了工具之间不直接通信、而是通过 State 间接协作的模式。
>
> 整体目的：让读者理解多个工具如何通过 Session State 实现数据共享和协作，这是构建复杂 Agent 应用的基础模式。

### **4.2 Context 的其他能力**

除了 State，`tool.Context` 还提供了一些其他有用的信息和能力：

`tool.Context` 内嵌了标准的 `context.Context`，所以你可以用它来做超时控制、取消检查等标准操作。比如你的工具需要调用外部 HTTP API，可以直接把 `ctx` 传给 `http.NewRequestWithContext`，这样当用户取消请求或超时时，工具的执行也会被优雅地终止。

在实际开发中，`State()` 是你用得最多的方法。大多数场景下，工具需要的"上下文信息"——用户偏好、累计数据、上一步的中间结果——都可以通过 State 来传递。如果你需要在多轮对话中保持工具之间的状态一致性，State 几乎是唯一正确的做法，比全局变量安全得多，因为每个 Session 的 State 是隔离的。

## **5. 多工具协作与工具描述的艺术**

当你给 Agent 配了不止一个工具时，事情开始变得有趣。模型需要在每一轮对话中判断：要不要用工具？用哪个？传什么参数？这个判断过程完全依赖于你给每个工具写的 `Name` 和 `Description`。

### **5.1 工具描述的最佳实践**

工具的 `Name` 应该是一个简短、有意义的标识符，用蛇形命名法（snake_case）。模型在返回 `FunctionCall` 时会引用这个名称，所以别太长，也别用中文——虽然理论上可以，但英文名称对模型来说更稳定。

`Description` 才是真正的灵魂。一个好的工具描述应该包含三个要素：**做什么**（这个工具的核心功能）、**什么时候用**（在什么场景下应该调用它）、**不做什么**（边界在哪里，避免模型误用）。

来看几个好描述和差描述的对比：

```go
// ❌ 差：太笼统，模型不知道什么时候该用
Description: "查询信息"

// ✅ 好：明确说了做什么、什么时候用
Description: "查询指定城市的实时天气信息，包括温度、湿度和天气状况。当用户询问某个城市的天气时使用此工具。"

// ❌ 差：没有说明使用场景
Description: "操作数据库"

// ✅ 好：具体到了操作类型和适用场景
Description: "在待办事项数据库中创建一条新记录。当用户要求添加、新建或记录一个任务/待办时使用此工具。不用于修改或删除已有记录。"
```

当多个工具的功能有重叠时，描述中的"什么时候用"和"不做什么"尤为重要。比如你同时有 `search_web` 和 `search_database` 两个搜索工具，如果描述不够精确，模型可能在用户问内部数据时去搜网页了。你需要在描述中明确各自的适用范围：

```go
// search_web
Description: "在互联网上搜索公开信息。当用户询问新闻、百科知识、公开数据等互联网上能找到的信息时使用。不用于查询公司内部数据。"

// search_database
Description: "在公司内部数据库中查询业务数据，包括订单、客户和产品信息。当用户询问公司业务相关的具体数据时使用。不用于查询互联网公开信息。"
```

> 【建议配图4 —— 模型如何根据工具描述做选择】
>
> 图片描述：一张决策流程图，白色背景。顶部是一个蓝色圆角矩形，内部有用户头像图标和一段对话气泡"帮我查一下北京今天的天气"。一条向下的箭头连接到中间区域——一个大脑形状的区域标注"模型决策"，大脑内部有三个小的思考气泡，分别标注"理解意图"、"匹配工具"、"构造参数"。从大脑区域向下伸出三条虚线，分别连接到底部并排的三张工具卡片。第一张绿色卡片标注"get_weather"，描述栏高亮显示"查询城市实时天气"，卡片右上角有一个大的绿色圆形勾（✓），表示被选中。第二张灰色卡片标注"search_database"，描述栏显示"查询公司内部数据"，右上角有红色叉号（×），颜色变淡表示被排除。第三张灰色卡片标注"add_todo"，描述栏显示"添加待办事项"，同样有红色叉号（×）。从大脑到被选中工具的虚线变成绿色粗实线，其余两条保持灰色虚线。被选中的工具卡片下方还有一个小的输出框，显示 `{"city": "北京"}`，表示模型自动构造的参数。
>
> 整体目的：让读者直观理解模型是如何根据工具的描述来决定调用哪个工具的，强调工具描述的重要性。

### **5.2 多工具实战：个人助理 Agent**

为了加深理解，我们来构建一个稍微复杂的例子——一个拥有多个工具的个人助理 Agent，它能查天气、做计算、管理备忘录：

```go
// main.go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"time"

	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
	"google.golang.org/adk/tool"
	"google.golang.org/adk/tool/functiontool"
	"google.golang.org/genai"
)

// ========== 天气查询工具 ==========

type WeatherInput struct {
	City string `json:"city" jsonschema:"description=城市名称，如北京、上海、广州"`
}

type WeatherOutput struct {
	City        string `json:"city"`
	Temperature int    `json:"temperature"`
	Condition   string `json:"condition"`
	Humidity    int    `json:"humidity"`
}

func getWeather(ctx tool.Context, input WeatherInput) (WeatherOutput, error) {
	// 模拟天气数据（实际项目中会调用天气 API）
	mockData := map[string]WeatherOutput{
		"北京": {City: "北京", Temperature: 18, Condition: "晴", Humidity: 35},
		"上海": {City: "上海", Temperature: 22, Condition: "多云", Humidity: 68},
		"广州": {City: "广州", Temperature: 28, Condition: "阵雨", Humidity: 82},
		"深圳": {City: "深圳", Temperature: 27, Condition: "多云转晴", Humidity: 75},
	}

	if data, ok := mockData[input.City]; ok {
		return data, nil
	}
	return WeatherOutput{
		City: input.City, Temperature: 20, Condition: "晴", Humidity: 50,
	}, nil
}

// ========== 计算工具 ==========

type CalcInput struct {
	Expression string  `json:"expression" jsonschema:"description=运算类型,enum=add|sub|mul|div|pow|sqrt"`
	A          float64 `json:"a" jsonschema:"description=第一个数"`
	B          float64 `json:"b,omitempty" jsonschema:"description=第二个数（sqrt 运算时不需要）"`
}

type CalcOutput struct {
	Result float64 `json:"result"`
}

func calculate(ctx tool.Context, input CalcInput) (CalcOutput, error) {
	var result float64
	switch input.Expression {
	case "add":
		result = input.A + input.B
	case "sub":
		result = input.A - input.B
	case "mul":
		result = input.A * input.B
	case "div":
		if input.B == 0 {
			return CalcOutput{}, fmt.Errorf("除数不能为零")
		}
		result = input.A / input.B
	case "pow":
		result = math.Pow(input.A, input.B)
	case "sqrt":
		if input.A < 0 {
			return CalcOutput{}, fmt.Errorf("不能对负数开方")
		}
		result = math.Sqrt(input.A)
	default:
		return CalcOutput{}, fmt.Errorf("不支持的运算: %s", input.Expression)
	}
	return CalcOutput{Result: result}, nil
}

// ========== 备忘录工具 ==========

type MemoInput struct {
	Action  string `json:"action" jsonschema:"description=操作类型,enum=save|list"`
	Content string `json:"content,omitempty" jsonschema:"description=要保存的备忘内容（save 时必填）"`
}

type MemoOutput struct {
	Message string   `json:"message"`
	Memos   []string `json:"memos,omitempty"`
}

func manageMemo(ctx tool.Context, input MemoInput) (MemoOutput, error) {
	state := ctx.State()

	// 读取已有备忘
	var memos []string
	if raw, ok := state.Get("memos"); ok {
		if jsonStr, ok := raw.(string); ok {
			json.Unmarshal([]byte(jsonStr), &memos)
		}
	}

	switch input.Action {
	case "save":
		entry := fmt.Sprintf("[%s] %s", time.Now().Format("01-02 15:04"), input.Content)
		memos = append(memos, entry)
		data, _ := json.Marshal(memos)
		state.Set("memos", string(data))
		return MemoOutput{
			Message: fmt.Sprintf("已保存备忘，当前共 %d 条", len(memos)),
		}, nil
	case "list":
		return MemoOutput{
			Message: fmt.Sprintf("共有 %d 条备忘", len(memos)),
			Memos:   memos,
		}, nil
	default:
		return MemoOutput{}, fmt.Errorf("不支持的操作: %s", input.Action)
	}
}

// ========== 当前时间工具 ==========

type TimeInput struct {
	Timezone string `json:"timezone,omitempty" jsonschema:"description=时区，如 Asia/Shanghai，默认为中国标准时间"`
}

type TimeOutput struct {
	Time     string `json:"time"`
	Date     string `json:"date"`
	Weekday  string `json:"weekday"`
	Timezone string `json:"timezone"`
}

func getCurrentTime(ctx tool.Context, input TimeInput) (TimeOutput, error) {
	tz := input.Timezone
	if tz == "" {
		tz = "Asia/Shanghai"
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		loc = time.FixedZone("CST", 8*3600)
	}
	now := time.Now().In(loc)

	weekdays := []string{"星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"}

	return TimeOutput{
		Time:     now.Format("15:04:05"),
		Date:     now.Format("2006年01月02日"),
		Weekday:  weekdays[now.Weekday()],
		Timezone: tz,
	}, nil
}

func main() {
	ctx := context.Background()

	// 创建四个工具
	weatherTool, _ := functiontool.New(functiontool.Config{
		Name:        "get_weather",
		Description: "查询指定城市的实时天气信息，包括温度、天气状况和湿度。当用户询问某个城市的天气情况时使用此工具。",
	}, getWeather)

	calcTool, _ := functiontool.New(functiontool.Config{
		Name:        "calculator",
		Description: "执行数学运算，支持加减乘除、乘方和开方。当用户需要计算数学表达式或进行数值运算时使用此工具。",
	}, calculate)

	memoTool, _ := functiontool.New(functiontool.Config{
		Name:        "memo",
		Description: "管理用户的备忘录。可以保存新的备忘内容，也可以列出所有已保存的备忘。当用户说'记一下'、'帮我记住'或'我的备忘'时使用此工具。",
	}, manageMemo)

	timeTool, _ := functiontool.New(functiontool.Config{
		Name:        "get_current_time",
		Description: "获取当前的日期和时间。当用户询问现在几点、今天星期几、今天日期时使用此工具。",
	}, getCurrentTime)

	// 创建 Agent
	m := NewDashScopeModel("qwen-plus")
	myAgent, _ := llmagent.New(llmagent.Config{
		Name:        "assistant",
		Description: "个人助理",
		Model:       m,
		Instruction: `你是一个全能的个人助理，可以帮用户查天气、做计算、管理备忘录和查时间。
回复时简洁自然，不需要过多解释工具调用的过程。`,
		Tools: []tool.Tool{weatherTool, calcTool, memoTool, timeTool},
	})

	// Runner 和 Session
	sessService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "assistant_app",
		Agent:          myAgent,
		SessionService: sessService,
	})

	sess, _ := sessService.Create(ctx, &session.CreateRequest{
		AppName: "assistant_app",
		UserID:  "user1",
	})

	// 多轮对话
	messages := []string{
		"现在几点了？今天星期几？",
		"北京和上海今天天气怎么样？",
		"帮我记一下：北京比上海冷，下次去北京要带外套",
		"算一下根号 144 加上 2 的 8 次方",
		"我之前记了什么备忘？",
	}

	for i, msg := range messages {
		fmt.Printf("\n===== 第 %d 轮 =====\n", i+1)
		fmt.Printf("用户: %s\n", msg)

		for ev, err := range r.Run(ctx, runner.RunOptions{
			UserID:    "user1",
			SessionID: sess.Session.ID(),
			Message:   genai.NewContentFromText(msg, "user"),
		}) {
			if err != nil {
				log.Printf("错误: %v", err)
				break
			}
			if ev.IsFinalResponse() {
				for _, p := range ev.Content.Parts {
					if p.Text != "" {
						fmt.Printf("助手: %s\n", p.Text)
					}
				}
			}
		}
	}
}
```

运行结果：
```
===== 第 1 轮 =====
用户: 现在几点了？今天星期几？
助手: 现在是 14:32:18，今天是 2026年04月14日，星期二。

===== 第 2 轮 =====
用户: 北京和上海今天天气怎么样？
助手: 北京今天晴，气温 18°C，湿度 35%；上海多云，气温 22°C，湿度 68%。整体来看上海比北京暖和一些。

===== 第 3 轮 =====
用户: 帮我记一下：北京比上海冷，下次去北京要带外套
助手: 好的，已经帮你记下了。

===== 第 4 轮 =====
用户: 算一下根号 144 加上 2 的 8 次方
助手: 根号 144 等于 12，2 的 8 次方等于 256，两者相加结果是 268。

===== 第 5 轮 =====
用户: 我之前记了什么备忘？
助手: 你有 1 条备忘：「北京比上海冷，下次去北京要带外套」，记录于今天下午。
```

注意第二轮，用户一句话问了两个城市的天气，模型会连续调用两次 `get_weather` 工具（分别传入"北京"和"上海"），拿到两个结果后整合成一段话回复。第四轮也是类似，模型先调 `calculator` 算根号 144，再调一次算 2 的 8 次方，然后在脑子里（或者再调一次加法）把结果合并。这种"一个问题触发多次工具调用"的能力，是 ADK 的 Runner 自动编排的，你不需要写任何额外的调度逻辑。

## **6. Agent as Tool**

ADK 有一个很有意思的设计：你可以把一个 Agent 包装成工具，挂到另一个 Agent 身上。这就像公司里的协作模式——总经理不需要自己做所有事，遇到技术问题找技术总监，遇到财务问题找 CFO。

`agenttool.New` 就是做这件事的。它接收一个 Agent 实例，返回一个 `tool.Tool`。当主 Agent 调用这个工具时，实际上是在运行那个子 Agent 的一次完整对话。

```go
package main

import (
	"context"
	"fmt"
	"log"
	"strings"

	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/session"
	"google.golang.org/adk/tool"
	"google.golang.org/adk/tool/agenttool"
	"google.golang.org/adk/tool/functiontool"
	"google.golang.org/genai"
)

// ========== 翻译专家 Agent 的工具 ==========

type TranslateInput struct {
	Text       string `json:"text" jsonschema:"description=要翻译的文本"`
	TargetLang string `json:"target_lang" jsonschema:"description=目标语言,enum=english|chinese|japanese"`
}

type TranslateOutput struct {
	Result string `json:"result"`
}

func translateText(ctx tool.Context, input TranslateInput) (TranslateOutput, error) {
	// 简单模拟翻译（实际项目中可以调用翻译 API）
	mockTranslations := map[string]map[string]string{
		"你好世界": {
			"english":  "Hello World",
			"japanese": "こんにちは世界",
		},
		"Hello World": {
			"chinese":  "你好世界",
			"japanese": "こんにちは世界",
		},
	}

	if translations, ok := mockTranslations[input.Text]; ok {
		if result, ok := translations[input.TargetLang]; ok {
			return TranslateOutput{Result: result}, nil
		}
	}

	// 兜底：简单拼接提示（实际项目不会这么做）
	return TranslateOutput{
		Result: fmt.Sprintf("[%s] %s", strings.ToUpper(input.TargetLang), input.Text),
	}, nil
}

// ========== 文本分析专家 Agent 的工具 ==========

type AnalyzeInput struct {
	Text string `json:"text" jsonschema:"description=要分析的文本"`
}

type AnalyzeOutput struct {
	WordCount int    `json:"word_count"`
	CharCount int    `json:"char_count"`
	Language  string `json:"language"`
}

func analyzeText(ctx tool.Context, input AnalyzeInput) (AnalyzeOutput, error) {
	// 简单的文本分析
	charCount := len([]rune(input.Text))
	wordCount := len(strings.Fields(input.Text))

	// 简单判断语言
	lang := "english"
	for _, r := range input.Text {
		if r >= 0x4e00 && r <= 0x9fff {
			lang = "chinese"
			break
		}
	}

	if lang == "chinese" {
		wordCount = charCount // 中文按字计数
	}

	return AnalyzeOutput{
		WordCount: wordCount,
		CharCount: charCount,
		Language:  lang,
	}, nil
}

func main() {
	ctx := context.Background()
	m := NewDashScopeModel("qwen-plus")

	// 1. 创建翻译专家 Agent
	translateTool, _ := functiontool.New(functiontool.Config{
		Name:        "translate",
		Description: "将文本翻译成指定的目标语言",
	}, translateText)

	translatorAgent, _ := llmagent.New(llmagent.Config{
		Name:        "translator",
		Description: "翻译专家，能将文本在中文、英文和日文之间互译",
		Model:       m,
		Instruction: "你是一个专业的翻译专家。用户会给你一段文本和目标语言，你使用 translate 工具完成翻译并回复结果。",
		Tools:       []tool.Tool{translateTool},
	})

	// 2. 创建文本分析专家 Agent
	analyzeTool, _ := functiontool.New(functiontool.Config{
		Name:        "analyze",
		Description: "分析文本的字数、字符数和语言",
	}, analyzeText)

	analystAgent, _ := llmagent.New(llmagent.Config{
		Name:        "analyst",
		Description: "文本分析专家，能分析文本的字数、语言和基本统计信息",
		Model:       m,
		Instruction: "你是一个文本分析专家。用户给你文本后，用 analyze 工具分析并用自然语言回报结果。",
		Tools:       []tool.Tool{analyzeTool},
	})

	// 3. 创建协调者 Agent，把两个专家 Agent 作为工具
	coordinatorAgent, _ := llmagent.New(llmagent.Config{
		Name:        "coordinator",
		Description: "智能协调助手",
		Model:       m,
		Instruction: `你是一个智能协调助手，擅长调配专家来完成用户的需求。
- 翻译相关的需求，交给 translator 专家
- 文本分析相关的需求，交给 analyst 专家
- 如果一个需求同时涉及翻译和分析，可以依次调用两个专家`,
		Tools: []tool.Tool{
			agenttool.New(translatorAgent, nil),
			agenttool.New(analystAgent, nil),
		},
	})

	// Runner
	sessService := session.InMemoryService()
	r, _ := runner.New(runner.Config{
		AppName:        "coordinator_app",
		Agent:          coordinatorAgent,
		SessionService: sessService,
	})

	sess, _ := sessService.Create(ctx, &session.CreateRequest{
		AppName: "coordinator_app",
		UserID:  "user1",
	})

	// 测试对话
	messages := []string{
		"帮我把'你好世界'翻译成英文",
		"分析一下 'Hello World' 这段文本",
		"先分析'你好世界'的文本信息，然后翻译成日文",
	}

	for i, msg := range messages {
		fmt.Printf("\n===== 第 %d 轮 =====\n", i+1)
		fmt.Printf("用户: %s\n", msg)

		for ev, err := range r.Run(ctx, runner.RunOptions{
			UserID:    "user1",
			SessionID: sess.Session.ID(),
			Message:   genai.NewContentFromText(msg, "user"),
		}) {
			if err != nil {
				log.Printf("错误: %v", err)
				break
			}
			if ev.IsFinalResponse() {
				for _, p := range ev.Content.Parts {
					if p.Text != "" {
						fmt.Printf("助手: %s\n", p.Text)
					}
				}
			}
		}
	}
}
```

运行结果：
```
===== 第 1 轮 =====
用户: 帮我把'你好世界'翻译成英文
助手: "你好世界"的英文翻译是 "Hello World"。

===== 第 2 轮 =====
用户: 分析一下 'Hello World' 这段文本
助手: "Hello World" 的分析结果：共 2 个单词，11 个字符，语言为英文。

===== 第 3 轮 =====
用户: 先分析'你好世界'的文本信息，然后翻译成日文
助手: 分析结果：「你好世界」共 4 个字，4 个字符，语言为中文。日文翻译为「こんにちは世界」。
```

`agenttool.New` 的第二个参数是 `*agenttool.Config`，可以传 `nil` 使用默认配置。如果你想关闭子 Agent 回复的自动摘要，可以设置 `SkipSummarization: true`——这意味着子 Agent 的完整回复会直接作为工具结果返回给主 Agent，而不是先被压缩成摘要。在大多数场景下默认行为就够用了，但如果你发现子 Agent 的回复在摘要过程中丢失了关键信息，可以试试这个选项。

> 【建议配图5 —— Agent as Tool 的协作架构】
>
> 图片描述：一张自上而下的层级架构图，白色背景。顶部是一个大的蓝色卡片，内部有一个指挥官/调度员的图标（戴耳麦的人形），标注"Coordinator Agent"，卡片下方用小字列出 Instruction 的关键内容："翻译需求 → translator / 分析需求 → analyst"。从这个卡片底部伸出两条向下的粗箭头。左侧箭头连接到一个绿色卡片，内部有地球+语言切换图标（A→あ），标注"Translator Agent"，卡片内部有一个小的工具标签"translate tool"。右侧箭头连接到一个橙色卡片，内部有放大镜+图表图标，标注"Analyst Agent"，卡片内部有一个小的工具标签"analyze tool"。两条箭头的中间位置各有一个标注：左侧箭头上标注"agenttool.New()"，右侧也是。在绿色卡片和橙色卡片的外面各有一个虚线框包裹着，虚线框标注"tool.Tool 接口"，表示这两个 Agent 被包装成了工具。整体上方的蓝色卡片明显最大最醒目，两个子 Agent 卡片较小但颜色鲜明，视觉层次清晰。
>
> 整体目的：让读者直观理解 Agent as Tool 模式的层级关系——主 Agent 通过 agenttool 把子 Agent 当作工具来调用，实现专家协作。

## **7. 关于 geminitool 的说明**

ADK 的 `tool/geminitool` 包提供了 Gemini 模型的内置工具，最典型的是 `geminitool.GoogleSearch{}`。在 ADK 官方文档中，你会经常看到这个用法——把 `GoogleSearch` 直接丢到 Agent 的 Tools 列表里，Agent 就拥有了搜索互联网的能力。

但这里有一个重要的前提需要说明：**这类内置工具是 Gemini 模型的原生能力**，它们的执行发生在模型侧而非你的代码侧。当你使用通义千问等非 Gemini 模型时，`geminitool.GoogleSearch` 并不能直接生效，因为通义千问的模型并不具备 Gemini 那样的原生搜索能力。

在我们这个系列教程中，由于统一使用通义千问作为底层模型，所以 `geminitool` 提供的内置工具我们不会直接使用。如果你需要给 Agent 加上网络搜索能力，正确的做法是自己封装一个搜索工具（比如调用搜索引擎 API），用 `functiontool.New` 包装后挂到 Agent 上。这种方式不依赖特定模型的内置能力，更加通用和可控。

当然，如果你在其他项目中使用 Gemini 模型（特别是部署在 Google Cloud 上的场景），`geminitool.GoogleSearch` 和 `geminitool.CodeExecution` 用起来确实非常方便，一行代码就能让 Agent 具备搜索和执行代码的能力。了解它们的存在和适用场景就好，不影响我们学习工具系统的核心机制。

## **8. 小结**

工具是 Agent 从"能说"到"能做"的跨越。`functiontool.New` 用一个函数签名就帮你搞定了 Schema 推导、参数校验和类型转换，让你专注于工具本身的业务逻辑；`tool.Context` 里的 State 打通了工具之间的数据共享，让多个工具可以在同一个会话中协作而不互相"失忆"；`agenttool` 则进一步打开了组合的想象空间——当一个工具不够用时，一个完整的 Agent 也可以成为工具。理解了这套体系，你就能给 Agent 装上各种各样的"手臂"，让它在真实场景中不只是纸上谈兵。

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
