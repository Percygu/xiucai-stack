---
title: 4. Go语言调用大模型API实战
category:
  - Go Agent
tag:
  - Go Agent
  - 大模型
  - API调用
  - 流式输出
  - Function Calling
  - go-openai
---

# **Go语言调用大模型API实战**

前面三篇文章，我们从大模型的发展脉络聊到核心概念，再到 Prompt Engineering 的各种技巧。理论储备已经够了，是时候动手写代码了。这篇文章的目标很明确：**用 Go 语言真正调通大模型 API**，从最简单的单轮对话开始，一路打通多轮对话、流式输出、Function Calling，最后还会聊聊生产环境中绑不开的错误处理和超时控制。

写完这篇里的每个代码示例，你就拥有了用 Go 和大模型"对话"的全部基础能力——后面学 Agent 框架的时候，你会发现框架帮你封装的，就是这些东西。

> 【建议配图1 —— 本文知识点全景路线图】
>
> 图片描述：白色背景。一条从左到右的水平主轴线，轴线上依次排列5个里程碑节点，每个节点是一个彩色圆形图标。第1个节点（蓝色，齿轮图标）标注"环境搭建"；第2个节点（绿色，对话气泡图标）标注"单轮对话"；第3个节点（紫色，循环箭头图标）标注"多轮对话"；第4个节点（橙色，水流波纹图标）标注"流式输出"；第5个节点（红色，扳手+闪电图标）标注"Function Calling"。轴线下方有一条灰色虚线平行延伸，上面标注"错误处理 & 超时控制"，表示贯穿始终。每个节点之间用渐变色粗箭头连接，表示递进关系。最右侧有一个奖杯小图标，标注"具备完整API调用能力"。
>
> 整体目的：让读者在开始阅读前就对全文的知识结构有清晰预期，知道自己将从哪里走到哪里。

## **1. 环境准备与第一次调用**

### **1.1 选择 SDK 和模型服务**

Go 语言调用大模型 API，我们使用 `github.com/sashabaranov/go-openai` 这个 SDK。它虽然名字里带着 OpenAI，但实际上支持所有兼容 OpenAI 接口协议的模型服务——包括我们要用的**通义千问（DashScope）**。

通义千问是阿里云推出的大模型服务，提供了和 OpenAI 完全兼容的 API 接口，国内开发者申请和使用都非常方便，不需要科学上网，也不需要境外信用卡。我们整个系列的代码示例都会基于通义千问来演示。

先来安装依赖：

```bash
go get github.com/sashabaranov/go-openai
```

然后你需要去 [阿里云百炼平台](https://bailian.console.aliyun.com/) 申请一个 API Key。注册账号后，在"API Key管理"页面创建一个新的 Key，然后把它设置成环境变量：

```bash
export DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

### **1.2 Hello, 大模型**

一切就绪，来写第一段代码。最简单的场景——发一条消息给大模型，拿到回复：

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func main() {
	// 创建客户端，指向 DashScope 的 OpenAI 兼容接口
	cfg := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
	cfg.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	client := openai.NewClientWithConfig(cfg)

	// 发起一次 Chat Completion 请求
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "qwen-plus",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "用一句话介绍一下Go语言的特点。",
				},
			},
		},
	)
	if err != nil {
		log.Fatalf("API调用失败: %v", err)
	}

	fmt.Println(resp.Choices[0].Message.Content)
}
```

运行结果：

```
Go语言是一种由Google开发的静态类型、编译型编程语言，以简洁的语法、高效的并发支持（goroutine）、快速的编译速度和强大的标准库著称。
```

这段代码做了三件事：第一，用 `openai.DefaultConfig` 创建配置，把 `BaseURL` 指向 DashScope 的兼容接口地址；第二，构造一个 `ChatCompletionRequest`，指定模型是 `qwen-plus`，消息列表里放一条 User 消息；第三，调用 `CreateChatCompletion` 发送请求，从返回结果的 `Choices[0].Message.Content` 里拿到模型的回复。

这个调用模式你需要牢牢记住，因为后面所有的代码都是在它的基础上扩展的。

> 【建议配图2 —— API调用流程解剖图】
>
> 图片描述：白色背景。整体是一个从左到右的三列布局。**左列"你的Go程序"**：一个蓝色圆角矩形卡片，内部从上到下排列三个小方块——顶部是钥匙图标旁标注"API Key"，中间是齿轮图标旁标注"BaseURL 配置"，底部是文档图标旁标注"Request 构造"。三个方块之间用细箭头串联。**中间"网络传输"**：左列卡片右侧伸出一根粗蓝色箭头，箭头上方标注"HTTPS POST"，箭头中段有一个小云朵图标。蓝色箭头指向右列。右列下方有一根粗绿色箭头反向指回左列，箭头上方标注"JSON Response"。**右列"DashScope 服务"**：一个绿色圆角矩形卡片，顶部有阿里云标志性的云图标，内部从上到下：机器人大脑图标旁标注"qwen-plus 模型"，下方一个小齿轮标注"推理计算"，再下方一个文档图标标注"生成回复"。左列底部用虚线框标注代码关键行 `client.CreateChatCompletion(...)`，右列底部标注 `resp.Choices[0].Message.Content`。
>
> 整体目的：帮读者在脑中建立一个完整的API调用心智模型——请求从哪里发出、经过什么、到达哪里、结果怎么回来。

## **2. System Prompt 与角色设定**

上一段代码里我们只发了一条 User 消息，但实际开发中，你几乎总会用到 **System Prompt**。System Prompt 是发给模型的第一条消息，用来设定模型的行为准则、角色身份和回答风格。上一篇 Prompt Engineering 里讲的角色扮演技巧，在代码层面就是通过 System Prompt 来实现的。

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func main() {
	cfg := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
	cfg.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	client := openai.NewClientWithConfig(cfg)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "qwen-plus",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "你是一位资深的Go语言专家，回答问题时要简洁专业，用代码示例说明问题。如果问题不是关于Go语言的，礼貌拒绝。",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Go的slice和array有什么区别？",
				},
			},
		},
	)
	if err != nil {
		log.Fatalf("API调用失败: %v", err)
	}

	fmt.Println(resp.Choices[0].Message.Content)
}
```

运行结果：

```
Go中array是固定长度的值类型，而slice是动态长度的引用类型，底层引用一个array。核心区别：

var a [3]int    // array，长度是类型的一部分，[3]int 和 [4]int 是不同类型
s := []int{1,2} // slice，长度可变，可通过 append 扩容

slice本质是一个包含指针、长度、容量的结构体，多个slice可以共享底层array。
```

注意 Messages 数组里消息的顺序：System 消息永远排在最前面，然后是 User 消息。这个顺序不是随便排的——大模型在处理请求时，会把 System 消息当作"宪法级"的行为准则，优先级高于后续所有的对话内容。

在实际的 Agent 开发中，System Prompt 承担着极其重要的角色。它定义了 Agent "是谁"、"能做什么"、"不能做什么"。一个写得好的 System Prompt，能让你的 Agent 行为稳定、边界清晰；写得差的话，Agent 就会像个没受过训练的实习生，时而靠谱时而离谱。

## **3. 多轮对话：让模型记住上下文**

到目前为止我们做的都是单轮对话——问一句答一句，每次请求之间没有关联。但真实的聊天场景几乎都是多轮的：用户会追问、会引用前面说过的内容、会基于上一轮的回答继续深入。

关于多轮对话，有一个非常重要的事实你需要知道：**大模型本身是无状态的**。它不会"记住"你上一次请求里说了什么。每一次 API 调用，对模型来说都是一个全新的开始。那所谓的"多轮对话"是怎么实现的呢？答案很简单——**每次请求时，把之前所有的对话历史全部带上**。

> 【建议配图3 —— 多轮对话的"无状态"真相】
>
> 图片描述：白色背景。分上下两个区域，用一条水平虚线分隔，上方标注"你以为的多轮对话"（灰色字），下方标注"实际发生的事情"（蓝色字）。**上方区域**：左侧一个用户头像，右侧一个机器人头像，中间是三组来回对话气泡（第1轮：用户"Go是什么？" → 机器人回答；第2轮：用户"它有什么优点？" → 机器人回答；第3轮：用户"和Rust比呢？" → 机器人回答），整体像一个持续的聊天界面。机器人头像旁有一个大脑图标发光，暗示"机器人记住了之前的对话"。**下方区域**：三个独立的请求卡片横排排列。第1个卡片内只有1条消息（蓝色小条）；第2个卡片内有3条消息（2蓝1绿，绿色表示上一轮的回复也被带上了）；第3个卡片内有5条消息（3蓝2绿）。每个卡片上方都有一个独立的箭头指向机器人图标，卡片递增的消息数量用不同深浅表达"历史越来越长"。第3个卡片旁有一个小感叹号标注"每次都要把完整历史发过去"。
>
> 整体目的：打破读者对"模型有记忆"的错觉，建立正确的心智模型——多轮对话靠的是客户端维护完整的消息历史。

来看代码实现：

```go
package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

func main() {
	cfg := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
	cfg.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	client := openai.NewClientWithConfig(cfg)

	// 用一个 slice 维护完整的对话历史
	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: "你是一位友好的Go语言助手，回答简洁明了。",
		},
	}

	scanner := bufio.NewScanner(os.Stdin)
	fmt.Println("开始对话（输入 quit 退出）：")

	for {
		fmt.Print("\n你: ")
		if !scanner.Scan() {
			break
		}
		input := strings.TrimSpace(scanner.Text())
		if input == "quit" {
			fmt.Println("再见！")
			break
		}

		// 把用户的新消息追加到历史中
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleUser,
			Content: input,
		})

		resp, err := client.CreateChatCompletion(
			context.Background(),
			openai.ChatCompletionRequest{
				Model:    "qwen-plus",
				Messages: messages, // 每次都带上完整历史
			},
		)
		if err != nil {
			log.Printf("API调用失败: %v", err)
			continue
		}

		reply := resp.Choices[0].Message.Content
		fmt.Printf("助手: %s\n", reply)

		// 把模型的回复也追加到历史中，这样下一轮对话就有了完整的上下文
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleAssistant,
			Content: reply,
		})
	}
}
```

运行结果：

```
开始对话（输入 quit 退出）：

你: Go语言是哪一年发布的？
助手: Go语言于2009年11月正式开源发布，由Google的Robert Griesemer、Rob Pike和Ken Thompson设计。

你: 它最初是为了解决什么问题？
助手: Go最初是为了解决Google内部大规模软件开发中的痛点：C++编译太慢、Java过于复杂、Python性能不足。Google需要一门编译快、语法简洁、原生支持并发的语言来应对大规模分布式系统的开发需求。

你: 那现在主要用在哪些场景？
助手: Go目前主要用于：云原生基础设施（Docker、Kubernetes都是Go写的）、微服务后端、网络编程和API服务、DevOps工具链（Terraform、Prometheus等）、以及高并发的中间件系统。

你: quit
再见！
```

这段代码的核心逻辑就在那个 `messages` 切片上。每一轮对话，我们做两件事：先把用户的新消息 `append` 进去，发给模型；拿到回复后，再把模型的回复也 `append` 进去。这样下一轮请求时，`messages` 里就包含了完整的对话历史，模型看到这些历史，自然就能理解上下文、正确回答追问。

这里有一个需要留意的问题：随着对话轮数增加，`messages` 会越来越长，带来两个后果——一是 Token 消耗持续增长（别忘了每次请求的输入 Token 都是要计费的），二是可能超出模型的上下文窗口限制。在生产环境中，你通常需要实现一个消息裁剪策略，比如只保留最近 N 轮对话，或者在历史过长时做摘要压缩。这部分我们在后面讲 Agent 的记忆机制时会深入探讨。

## **4. 流式输出：告别"等等等"的痛苦**

到目前为止我们用的都是普通的 `CreateChatCompletion`——发送请求，然后干等着，直到模型把整个回复全部生成完才一次性返回。如果模型回复比较长，这个等待时间可能有好几秒甚至更久，用户体验非常差。

你有没有注意到，ChatGPT 的回复是一个字一个字"打"出来的？这就是**流式输出（Streaming）**的效果。模型不再等所有内容都生成完才返回，而是生成一个 Token 就立刻推送一个 Token，客户端收到后立刻显示。虽然总耗时可能差不多，但用户看到第一个字的时间（首 Token 延迟）大大缩短了，体验上完全不同。

> 【建议配图4 —— 普通模式 vs 流式模式时序对比】
>
> 图片描述：白色背景。上下两个时序图，用水平虚线分隔。**上方"普通模式"**：左侧一个用户图标发出一根蓝色粗箭头标注"发送请求"指向右侧服务器图标。服务器图标下方是一个长条时间轴，标注"模型思考并生成完整回复..."（灰色阴影填充的等待区间，内有沙漏图标），等待结束后一根绿色粗箭头整体返回一大块文字给用户。用户下方的时间轴上，在等待区间标注"用户只能看到加载中..."（灰色，带旋转loading图标），收到完整回复后瞬间变成一大段绿色文字。**下方"流式模式"**：同样用户发出请求箭头。服务器侧是一连串短小的绿色箭头（像水滴一样），每个小箭头携带几个字，标注"Token1"、"Token2"、"Token3"...连续不断地流向用户。用户侧的时间轴上，文字从左到右逐渐"生长"出来，像打字机效果。两个模式的首字可见时间用红色竖线标注，普通模式的红线在最右端，流式模式的红线在很靠左的位置，两条红线之间用双向箭头标注"节省的等待时间"。
>
> 整体目的：让读者直观理解流式输出的本质——不是更快，而是更早开始响应，大幅改善用户感知。

来看 Go 里怎么实现流式输出：

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func main() {
	cfg := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
	cfg.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	client := openai.NewClientWithConfig(cfg)

	// 用 CreateChatCompletionStream 替代 CreateChatCompletion
	stream, err := client.CreateChatCompletionStream(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "qwen-plus",
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleSystem, Content: "你是一位Go语言专家，回答详细且有条理。"},
				{Role: openai.ChatMessageRoleUser, Content: "请介绍一下Go语言的goroutine调度模型。"},
			},
		},
	)
	if err != nil {
		log.Fatalf("创建流失败: %v", err)
	}
	defer stream.Close()

	fmt.Print("助手: ")
	for {
		response, err := stream.Recv()
		if errors.Is(err, io.EOF) {
			// 流结束
			fmt.Println()
			break
		}
		if err != nil {
			log.Fatalf("接收流数据出错: %v", err)
		}
		// 每收到一个 Token 就立刻打印
		fmt.Print(response.Choices[0].Delta.Content)
	}
}
```

运行结果（逐字输出效果）：

```
助手: Go语言的goroutine调度采用GMP模型。G代表goroutine，是Go的轻量级协程；M代表Machine，即操作系统线程；P代表Processor，是逻辑处理器，负责管理G的队列...（逐字打印，像打字机一样）
```

和普通模式相比，代码的变化点有三个。首先是调用方法从 `CreateChatCompletion` 换成了 `CreateChatCompletionStream`，返回的不再是一个完整的 Response，而是一个 `stream` 对象。然后是用一个 `for` 循环反复调用 `stream.Recv()` 来接收数据，每次接收到的是一小段增量内容（Delta），而不是完整的消息。最后是通过判断 `io.EOF` 来知道流什么时候结束，并且别忘了用 `defer stream.Close()` 关闭流。

还有一个细节值得注意：普通模式下回复内容在 `response.Choices[0].Message.Content` 里，而流式模式下是在 `response.Choices[0].Delta.Content` 里。`Message` 是完整消息，`Delta` 是增量片段——这个命名差异体现了两种模式的本质区别。

### **4.1 流式输出 + 多轮对话的结合**

实际项目中，流式输出和多轮对话几乎总是同时出现的。要把它们结合起来，唯一需要额外做的事就是：在流式接收的过程中，手动把所有 Delta 拼接成完整的回复，然后追加到消息历史里。

```go
package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

func main() {
	cfg := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
	cfg.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	client := openai.NewClientWithConfig(cfg)

	messages := []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleSystem, Content: "你是一位友好的Go语言助手，回答简洁明了。"},
	}

	scanner := bufio.NewScanner(os.Stdin)
	fmt.Println("开始对话 - 流式模式（输入 quit 退出）：")

	for {
		fmt.Print("\n你: ")
		if !scanner.Scan() {
			break
		}
		input := strings.TrimSpace(scanner.Text())
		if input == "quit" {
			break
		}

		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleUser,
			Content: input,
		})

		stream, err := client.CreateChatCompletionStream(
			context.Background(),
			openai.ChatCompletionRequest{
				Model:    "qwen-plus",
				Messages: messages,
			},
		)
		if err != nil {
			log.Printf("创建流失败: %v", err)
			continue
		}

		fmt.Print("助手: ")
		var fullReply strings.Builder

		for {
			response, err := stream.Recv()
			if errors.Is(err, io.EOF) {
				break
			}
			if err != nil {
				log.Printf("流数据出错: %v", err)
				break
			}
			chunk := response.Choices[0].Delta.Content
			fmt.Print(chunk)
			fullReply.WriteString(chunk) // 拼接完整回复
		}
		stream.Close()
		fmt.Println()

		// 把完整的回复追加到历史
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleAssistant,
			Content: fullReply.String(),
		})
	}
}
```

这里用了 `strings.Builder` 来高效拼接流式片段。每收到一个 Delta 就同时做两件事：`fmt.Print` 让用户实时看到输出，`fullReply.WriteString` 把片段攒起来。等流结束后，`fullReply.String()` 就是完整的回复内容，追加到 `messages` 历史里供下一轮使用。

## **5. 模型参数调优**

调用 API 时除了 `Model` 和 `Messages` 这两个必填项，还有一些可选参数能显著影响模型的输出行为。上一篇核心概念里我们已经从理论上认识了 Temperature 和 Top-P，现在来看看它们在代码中怎么用，以及不同参数组合对实际输出的影响。

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func ask(client *openai.Client, label string, temp float32, maxTokens int) {
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:       "qwen-plus",
			Temperature: temp,
			MaxTokens:   maxTokens,
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleUser, Content: "用Go写一个生成随机密码的函数。"},
			},
		},
	)
	if err != nil {
		log.Printf("[%s] 调用失败: %v", label, err)
		return
	}
	fmt.Printf("=== %s (Temperature=%.1f, MaxTokens=%d) ===\n%s\n\n",
		label, temp, maxTokens, resp.Choices[0].Message.Content)
}

func main() {
	cfg := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
	cfg.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	client := openai.NewClientWithConfig(cfg)

	// 低温度：输出确定性高，适合代码生成、结构化任务
	ask(client, "精确模式", 0.1, 500)

	// 高温度：输出多样性强，适合创意写作、头脑风暴
	ask(client, "创意模式", 0.9, 500)

	// 控制输出长度
	ask(client, "简洁模式", 0.3, 100)
}
```

运行结果（示例）：

```
=== 精确模式 (Temperature=0.1, MaxTokens=500) ===
func GeneratePassword(length int) string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    b := make([]byte, length)
    for i := range b {
        b[i] = charset[rand.Intn(len(charset))]
    }
    return string(b)
}

=== 创意模式 (Temperature=0.9, MaxTokens=500) ===
（输出更长的版本，可能包含额外的解释、多种实现方案、或更富创意的字符集选择）

=== 简洁模式 (Temperature=0.3, MaxTokens=100) ===
（输出更短，可能只有核心函数代码，没有解释说明）
```

实际开发中选参数有一条经验法则：**需要准确性的任务（代码生成、数据提取、分类判断），Temperature 设低，0.0-0.3 之间；需要创造性的任务（文案写作、头脑风暴、角色扮演），Temperature 设高，0.7-1.0 之间**。MaxTokens 则根据你期望的回复长度来设，设小了模型会在中间截断，设大了会浪费钱——但不设的话模型会自己决定什么时候停，通常也不会太离谱。

## **6. Function Calling：让大模型调用你的代码**

前面五个章节，模型只能"说话"——你问它问题，它用自然语言回答你。但如果你想让模型帮你查天气、查数据库、调接口呢？**Function Calling（函数调用）** 就是干这个的。

Function Calling 的核心思想是：你告诉模型"你有哪些函数可以用"，模型在需要的时候会告诉你"我想调用某个函数，参数是这些"，然后你在自己的程序里执行这个函数，把结果再喂回给模型。注意，**模型并不会真的执行你的函数**——它只是决定"要调哪个函数、传什么参数"，真正的执行权在你手里。

这个机制是 Agent 最核心的能力基础。后面学 Agent 的时候你会发现，Agent 之所以能"做事"而不只是"说话"，就是因为它能通过 Function Calling 来调用外部工具。

> 【建议配图5 —— Function Calling 交互流程】
>
> 图片描述：白色背景。整体是一个纵向的三方交互序列图，三个参与方从左到右依次是：蓝色用户头像（标注"用户"）、紫色机器人头像（标注"大模型"）、绿色齿轮箱图标（标注"你的Go程序"）。交互序列如下：**第1步**，用户向大模型发送一条消息气泡"北京今天天气怎么样？"（蓝色箭头）。**第2步**，大模型分析后，向Go程序发送一个橙色虚线箭头（不是直接执行），箭头上附带一个JSON代码块样式的小卡片：`{"function": "get_weather", "args": {"city": "北京"}}`，旁边有一个灯泡图标标注"我需要调用这个函数"。**第3步**，Go程序内部有一个小型流程：齿轮转动 → 调用真实天气API → 获得数据。然后Go程序向大模型返回一个绿色箭头，附带结果：`{"temp": "22°C", "weather": "晴"}`。**第4步**，大模型收到数据后，向用户返回一条自然语言气泡"北京今天天气晴朗，气温22°C，适合外出。"（绿色箭头）。右侧有一个纵向大括号，框住第2-3步，标注"这就是 Function Calling"。
>
> 整体目的：让读者清晰理解Function Calling的本质——模型负责"决策"，程序负责"执行"，最终合作完成任务。

来看一个完整的示例。我们定义一个"获取天气"的函数，让模型在需要时调用它：

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	openai "github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
)

// 模拟一个天气查询函数（实际项目中会调用真实的天气API）
func getWeather(city string) string {
	// 这里用硬编码数据模拟，实际开发中替换为真实API调用
	weatherData := map[string]string{
		"北京": `{"city":"北京","temp":"22°C","weather":"晴","wind":"北风3级"}`,
		"上海": `{"city":"上海","temp":"26°C","weather":"多云","wind":"东南风2级"}`,
		"深圳": `{"city":"深圳","temp":"30°C","weather":"雷阵雨","wind":"南风4级"}`,
	}
	if data, ok := weatherData[city]; ok {
		return data
	}
	return fmt.Sprintf(`{"city":"%s","error":"暂无该城市的天气数据"}`, city)
}

func main() {
	cfg := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
	cfg.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	client := openai.NewClientWithConfig(cfg)

	// 第一步：定义工具（告诉模型有哪些函数可以用）
	tools := []openai.Tool{
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "get_weather",
				Description: "获取指定城市的当前天气信息",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"city": {
							Type:        jsonschema.String,
							Description: "城市名称，例如：北京、上海、深圳",
						},
					},
					Required: []string{"city"},
				},
			},
		},
	}

	// 第二步：发送用户消息，附带工具定义
	messages := []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleUser, Content: "深圳今天天气怎么样？需要带伞吗？"},
	}

	fmt.Println(">>> 第一次请求：发送用户问题")
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:    "qwen-plus",
			Messages: messages,
			Tools:    tools,
		},
	)
	if err != nil {
		log.Fatalf("API调用失败: %v", err)
	}

	assistantMsg := resp.Choices[0].Message

	// 第三步：检查模型是否要求调用函数
	if len(assistantMsg.ToolCalls) > 0 {
		toolCall := assistantMsg.ToolCalls[0]
		fmt.Printf(">>> 模型请求调用函数: %s\n", toolCall.Function.Name)
		fmt.Printf(">>> 参数: %s\n", toolCall.Function.Arguments)

		// 解析参数
		var args struct {
			City string `json:"city"`
		}
		json.Unmarshal([]byte(toolCall.Function.Arguments), &args)

		// 第四步：执行函数，获取结果
		result := getWeather(args.City)
		fmt.Printf(">>> 函数执行结果: %s\n", result)

		// 第五步：把模型的请求和函数结果都追加到消息历史
		messages = append(messages, assistantMsg)
		messages = append(messages, openai.ChatCompletionMessage{
			Role:       openai.ChatMessageRoleTool,
			Content:    result,
			ToolCallID: toolCall.ID,
		})

		// 第六步：再次请求模型，让它基于函数结果生成最终回复
		fmt.Println(">>> 第二次请求：带上函数执行结果")
		finalResp, err := client.CreateChatCompletion(
			context.Background(),
			openai.ChatCompletionRequest{
				Model:    "qwen-plus",
				Messages: messages,
				Tools:    tools,
			},
		)
		if err != nil {
			log.Fatalf("API调用失败: %v", err)
		}

		fmt.Printf("\n助手: %s\n", finalResp.Choices[0].Message.Content)
	} else {
		// 模型没有调用函数，直接回复
		fmt.Printf("\n助手: %s\n", assistantMsg.Content)
	}
}
```

运行结果：

```
>>> 第一次请求：发送用户问题
>>> 模型请求调用函数: get_weather
>>> 参数: {"city":"深圳"}
>>> 函数执行结果: {"city":"深圳","temp":"30°C","weather":"雷阵雨","wind":"南风4级"}
>>> 第二次请求：带上函数执行结果

助手: 深圳今天气温30°C，有雷阵雨，南风4级。建议你带把伞出门，雷阵雨说来就来，别被淋成落汤鸡。
```

这段代码展示了 Function Calling 的完整交互流程，值得仔细品味。

整个过程涉及**两次** API 调用。第一次调用时，我们在请求里附带了 `Tools` 列表，模型分析用户问题后，发现需要查天气才能回答，于是返回一个 `ToolCalls`——里面包含了要调用的函数名 `get_weather` 和参数 `{"city":"深圳"}`。注意，模型返回的只是"我想调用这个函数"的意图，函数并没有被执行。

然后是我们的程序接管——解析参数，调用真正的 `getWeather` 函数，拿到天气数据。接下来的关键步骤是构造第二次请求：把模型的 ToolCalls 消息和函数执行结果（以 `Tool` 角色的消息形式，带上 `ToolCallID` 对应关系）一起追加到消息历史里，再次请求模型。模型这次拿到了天气数据，就能用自然语言组织一个完整的、对用户友好的回答了。

Function Calling 的几个要点你需要记住：工具的 `Description` 写得越清晰，模型越能准确判断什么时候该调用它；参数的 `Description` 决定了模型能否正确填写参数值；`ToolCallID` 是将函数结果与对应的调用请求关联起来的关键，不能弄丢。

## **7. 错误处理与超时控制**

开发环境里调 API，一切看起来都很美好。但一旦上了生产环境，你会发现网络不稳定、服务偶尔抽风、Token 额度用完了、请求超时了……各种意外层出不穷。健壮的错误处理不是锦上添花，是生存的基本功。

### **7.1 常见错误类型**

调用大模型 API 最常遇到的错误大致分为三类。第一类是**认证错误**——API Key 无效或过期，返回 HTTP 401。第二类是**频率限制**——请求太频繁被限流，返回 HTTP 429，通常附带一个 `Retry-After` 头告诉你过多久可以重试。第三类是**服务端错误**——模型服务本身出了问题，返回 HTTP 500 或 503，这种一般等一会儿就恢复了。

### **7.2 带超时和重试的健壮调用**

下面这段代码演示了生产级别的 API 调用应该怎么写：

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

// ChatClient 封装了带重试和超时机制的大模型调用
type ChatClient struct {
	client     *openai.Client
	maxRetries int
	timeout    time.Duration
}

func NewChatClient() *ChatClient {
	cfg := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
	cfg.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"

	// 设置底层 HTTP 客户端的超时
	cfg.HTTPClient = &http.Client{Timeout: 30 * time.Second}

	return &ChatClient{
		client:     openai.NewClientWithConfig(cfg),
		maxRetries: 3,
		timeout:    25 * time.Second,
	}
}

func (c *ChatClient) Chat(messages []openai.ChatCompletionMessage) (string, error) {
	var lastErr error

	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		if attempt > 0 {
			// 指数退避：第1次等1秒，第2次等2秒，第3次等4秒
			backoff := time.Duration(math.Pow(2, float64(attempt-1))) * time.Second
			fmt.Printf("第 %d 次重试，等待 %v...\n", attempt, backoff)
			time.Sleep(backoff)
		}

		// 用 context 控制单次请求的超时
		ctx, cancel := context.WithTimeout(context.Background(), c.timeout)

		resp, err := c.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
			Model:    "qwen-plus",
			Messages: messages,
		})
		cancel()

		if err == nil {
			return resp.Choices[0].Message.Content, nil
		}

		lastErr = err

		// 判断错误类型，决定是否值得重试
		var apiErr *openai.APIError
		if errors.As(err, &apiErr) {
			switch apiErr.HTTPStatusCode {
			case 401:
				// 认证错误，重试也没用，直接返回
				return "", fmt.Errorf("API Key 无效或已过期: %w", err)
			case 429:
				// 频率限制，值得重试
				fmt.Println("触发频率限制，稍后重试...")
				continue
			case 500, 502, 503:
				// 服务端临时错误，值得重试
				fmt.Printf("服务端错误 (%d)，稍后重试...\n", apiErr.HTTPStatusCode)
				continue
			default:
				return "", fmt.Errorf("API错误 (HTTP %d): %w", apiErr.HTTPStatusCode, err)
			}
		}

		// 上下文超时，值得重试
		if errors.Is(err, context.DeadlineExceeded) {
			fmt.Println("请求超时，稍后重试...")
			continue
		}

		// 其他未知错误，不重试
		return "", fmt.Errorf("未知错误: %w", err)
	}

	return "", fmt.Errorf("重试 %d 次后仍失败: %w", c.maxRetries, lastErr)
}

func main() {
	client := NewChatClient()

	reply, err := client.Chat([]openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleUser, Content: "用一句话解释什么是goroutine。"},
	})
	if err != nil {
		log.Fatalf("调用失败: %v", err)
	}

	fmt.Printf("助手: %s\n", reply)
}
```

运行结果：

```
助手: Goroutine是Go语言中的轻量级协程，由Go运行时调度，比操作系统线程更轻量（初始栈仅几KB），可以轻松创建数十万个并发执行单元。
```

这段代码有几个关键设计值得说道。

超时控制做了两层：外层通过 `http.Client{Timeout: 30s}` 限制了整个 HTTP 连接的超时，内层通过 `context.WithTimeout` 控制每次调用的超时，内层设成 25 秒略小于外层，确保是 context 先超时而不是 HTTP 连接先断。这样我们能通过 `context.DeadlineExceeded` 精准捕获超时事件。

重试策略用了**指数退避（Exponential Backoff）**——每次重试的等待时间是上一次的两倍。这比固定间隔重试好得多，因为如果服务端正在扛压力，所有客户端同时重试只会让情况更糟，指数退避能自然地把重试请求分散开来。

错误分类决定重试策略：401 认证错误不重试（重试也没用），429 限流和 5xx 服务端错误值得重试（是暂时性的），其他未知错误保守地不重试（避免无意义的等待）。

> 【建议配图6 —— 错误处理与重试决策流程】
>
> 图片描述：白色背景。整体是一个从上到下的决策流程图。顶部是一个蓝色圆角矩形标注"发起API调用"，下方一个菱形判断节点"调用是否成功？"。**成功分支**（绿色箭头向右）：指向一个绿色圆角矩形，内有对勾图标，标注"返回结果"。**失败分支**（红色箭头向下）：先到一个橙色矩形"解析错误类型"，然后分出三个分支。**左分支**：红色叉号图标，标注"401 认证错误"，箭头指向一个红色矩形"立即返回错误"，旁标注"重试无意义"。**中间分支**：黄色时钟图标，标注"429 / 5xx / 超时"，箭头向下指向一个黄色菱形"重试次数 < 上限？"。是→进入"指数退避等待"（内有1s→2s→4s的递增时间轴图标），然后箭头回到最顶部的"发起API调用"，形成循环。否→指向红色矩形"返回最后一个错误"。**右分支**：灰色问号图标，标注"其他未知错误"，箭头指向灰色矩形"返回错误"。
>
> 整体目的：让读者在脑中建立一个清晰的错误处理决策树，知道遇到不同类型的错误该怎么处理。

### **7.3 Token 用量追踪**

在生产环境中，追踪每次调用的 Token 用量也很重要——它直接关系到你的成本。API 的返回结果里包含了详细的用量信息：

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func main() {
	cfg := openai.DefaultConfig(os.Getenv("DASHSCOPE_API_KEY"))
	cfg.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	client := openai.NewClientWithConfig(cfg)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "qwen-plus",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "你是一位Go语言专家。",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "解释一下Go的interface底层实现原理。",
				},
			},
		},
	)
	if err != nil {
		log.Fatalf("API调用失败: %v", err)
	}

	fmt.Println(resp.Choices[0].Message.Content)
	fmt.Println("\n--- Token 用量统计 ---")
	fmt.Printf("输入 Token: %d\n", resp.Usage.PromptTokens)
	fmt.Printf("输出 Token: %d\n", resp.Usage.CompletionTokens)
	fmt.Printf("总计 Token: %d\n", resp.Usage.TotalTokens)
}
```

运行结果：

```
Go的interface底层由两种结构实现：iface（包含方法的接口）和eface（空接口）。iface包含两个指针，一个指向itab（存储类型信息和方法表），一个指向实际数据。eface更简单，只有类型指针和数据指针...

--- Token 用量统计 ---
输入 Token: 28
输出 Token: 156
总计 Token: 184
```

`resp.Usage` 里的三个字段含义明确：`PromptTokens` 是你发给模型的（包含 System Prompt、对话历史、用户消息等所有输入），`CompletionTokens` 是模型生成的回复消耗的，`TotalTokens` 是两者之和。在生产环境中，你可以把这些数据上报到监控系统，按天或按用户维度聚合，就能精确掌控成本了。

## **8. 小结**

从第一个 "Hello, 大模型" 到带重试的生产级调用，这篇文章走过的路其实是每个 Agent 开发者都会经历的"新手村"。你现在手里已经握着五把钥匙：单轮对话让你能和模型说上话，System Prompt 让你能定义模型的行为边界，多轮对话让模型能理解上下文，流式输出让用户体验从"干等"变成"实时"，Function Calling 则打开了一扇大门——模型不再只是一个"只会说话的家伙"，它开始能调用你的代码、操作你的系统、帮你做真正的事情了。

如果说前三篇文章是在帮你"认识"大模型，这篇文章是在帮你"驾驭"它。而接下来的 Agent 篇章，就是教你怎么把这些驾驶技能组合起来，造出一辆真正能上路的车。

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
