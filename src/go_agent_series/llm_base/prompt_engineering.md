---
title: 3. Prompt Engineering实战
category:
  - Go Agent
tag:
  - Go Agent
  - 大模型
  - Prompt Engineering
  - CoT
  - Few-shot
---

# **Prompt Engineering实战**

上一篇我们聊了 Token、Temperature、上下文窗口这些核心概念，其中提到过一个观点：Prompt 的质量直接决定了模型回答的质量。这篇文章要展开讲的，就是如何把 Prompt 写好——这门技术叫做 **Prompt Engineering**。

你可能会好奇：跟大模型说句话而已，还需要专门学？答案是肯定的。同样一个任务，一个经过精心设计的 Prompt 和一个随手写的 Prompt，得到的结果可能天差地别。更关键的是，在 Agent 应用中，Prompt 不是写给用户看的——它是写给"大脑"看的指令。Agent 的 System Prompt 决定了它的行为准则，工具描述的 Prompt 决定了它能否正确选择和调用工具，任务规划的 Prompt 决定了它的推理质量。可以说，**Prompt Engineering 是 Agent 开发者最重要的基本功之一**。

## **1. 从一个真实案例说起**

在讲具体技巧之前，先来看一个直观的对比。假设我们要让大模型帮我们做一件很常见的事——判断一段用户评价的情感倾向。

最直觉的做法是直接问：

```go
prompt := "这段评价是正面还是负面的：这家店的菜味道不错，但是等了快一个小时才上菜，服务态度也一般。"
```

模型大概率会给你一段含糊其辞的分析，比如"这段评价既有正面也有负面内容……"，最后也不告诉你到底算正面还是负面。

现在换一种写法：

```go
prompt := `你是一位情感分析专家。请分析以下用户评价的整体情感倾向。

要求：
- 先逐句分析每个观点的情感（正面/负面/中性）
- 然后综合判断整体倾向
- 最后用JSON格式输出结果：{"sentiment": "positive/negative/neutral", "confidence": 0.0-1.0}

用户评价：这家店的菜味道不错，但是等了快一个小时才上菜，服务态度也一般。`
```

这次模型会先分析"味道不错"是正面、"等了一个小时"是负面、"服务态度一般"是负面，最后给出 `{"sentiment": "negative", "confidence": 0.75}` 这样的结构化结果。

两段 Prompt 解决的是同一个问题，但第二段通过设定角色、明确输出要求、引导分析步骤，得到了一个精准且可编程处理的结果。这就是 Prompt Engineering 的价值所在——不是让大模型更聪明，而是让大模型把它的聪明用对地方。

> 【建议配图1 —— Prompt质量与输出质量的因果关系】
>
> 图片描述：白色背景。左右两个对比场景，用一条纵向虚线分隔，顶部分别标注"普通Prompt"（灰色字）和"工程化Prompt"（蓝色字）。**左侧场景**：上方是一个简笔用户头像，下方连一个简陋的短信气泡，内写"这段话是正面还是负面的？"（文字潦草感）。气泡下方一根细灰色箭头指向一个灰色机器人头像，机器人旁边是一个模糊的、带问号的文档图标，表示输出模糊不确定，旁边标注"含糊分析，无结论"，整体灰色调。**右侧场景**：上方同样用户头像，下方连一个精致的多层气泡（像卡片堆叠），最上层标注"角色设定"（紫色小标签），中层标注"分析步骤"（蓝色小标签），底层标注"输出格式"（绿色小标签）。气泡下方一根粗绿色箭头指向一个绿色光圈环绕的机器人头像，机器人旁边是一个清晰的JSON代码块图标，标注"结构化结果，可直接解析"。右下角有一个小型公式框：`好Prompt = 角色 + 步骤 + 格式约束`。
>
> 整体目的：让读者一眼看到Prompt质量对输出结果的直接影响，建立"Prompt需要精心设计"的认知。

## **2. Zero-shot Prompting：直接提问的艺术**

最简单的 Prompt 形式叫 **Zero-shot Prompting**——不给任何示例，直接让模型完成任务。"Zero-shot"的意思就是"零样本"，模型完全依靠自身的预训练知识来理解和执行你的指令。

我们日常和 ChatGPT 聊天时，绝大多数时候用的就是 Zero-shot。比如"帮我翻译这段话"、"解释一下什么是 goroutine"、"写个排序算法"——这些都是 Zero-shot Prompting。

Zero-shot 看似简单，但写好它其实有讲究。核心原则可以归结为四个字：**清晰具体**。模型不是你肚子里的蛔虫，它不知道你心里想要什么格式、什么风格、什么详细程度。你给的信息越模糊，它就越容易"瞎猜"。

来看一个 Go 代码示例，对比两种 Zero-shot Prompt 的效果差异：

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"google.golang.org/genai"
)

func ask(ctx context.Context, client *genai.Client, label, prompt string) {
	contents := []*genai.Content{
		genai.NewContentFromText(prompt, genai.RoleUser),
	}
	config := &genai.GenerateContentConfig{
		Temperature:     genai.Ptr(float32(0.1)),
		MaxOutputTokens: genai.Ptr(int32(300)),
	}

	resp, err := client.Models.GenerateContent(
		ctx, "gemini-2.0-flash", contents, config,
	)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("=== %s ===\n%s\n\n", label, resp.Text())
}

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  os.Getenv("GEMINI_API_KEY"),
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	// 模糊的 Zero-shot
	ask(ctx, client, "模糊Prompt",
		"写个Go函数处理错误。",
	)

	// 清晰的 Zero-shot
	ask(ctx, client, "清晰Prompt",
		`用Go语言编写一个函数 WrapError，功能如下：
- 接收一个 error 和一条描述字符串
- 如果 error 为 nil，直接返回 nil
- 如果 error 不为 nil，用 fmt.Errorf 包装错误并添加描述信息
- 请给出函数签名、实现和一个简单的使用示例`,
	)
}
```

运行结果（示例）：

```
=== 模糊Prompt ===
func handleError(err error) {
    if err != nil {
        log.Fatal(err)
    }
}
（模型可能返回一个过于简单、不知道用在哪里的函数）

=== 清晰Prompt ===
func WrapError(err error, desc string) error {
    if err == nil {
        return nil
    }
    return fmt.Errorf("%s: %w", desc, err)
}

// 使用示例
func ReadConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, WrapError(err, "读取配置文件失败")
    }
    // ...
}
```

差距一目了然。写好 Zero-shot Prompt 的关键在于：明确任务目标（要做什么）、指定输入输出（函数签名、返回格式）、设定约束条件（语言、风格、长度）。当任务比较简单直接时，Zero-shot 是最高效的选择——没必要什么问题都搞一大堆例子。

## **3. Few-shot Prompting：用例子教会模型**

有时候，光靠文字描述很难让模型准确理解你要的是什么——尤其是当你需要特定的输出格式、特殊的分类标准，或者模型对你的任务理解有偏差时。这时候就需要 **Few-shot Prompting** 了。

Few-shot 的核心思路非常朴素：**给模型几个"输入→输出"的例子**，让它从例子中总结出规律，然后按照同样的规律处理新的输入。这就像你教一个新同事做数据标注，与其给他写一页 A4 纸的标注规范，不如直接丢几个标注好的样本让他照着做——后者往往更有效。

Few-shot 之所以管用，和大模型的 **In-Context Learning（上下文学习）** 能力有关。这是 GPT-3 时代被发现的一种"涌现能力"——大模型不需要重新训练，仅通过阅读 Prompt 中的几个示例，就能理解任务模式并泛化到新的输入上。某种意义上说，Few-shot Prompting 就是在"运行时"给模型做了一次临时的微调。

来看一个实际场景。假设我们在开发一个 Agent，需要它把用户的自然语言指令转换成结构化的 JSON 命令：

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"google.golang.org/genai"
)

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  os.Getenv("GEMINI_API_KEY"),
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	// Few-shot Prompt：用3个例子教会模型转换规则
	prompt := `你的任务是将用户的自然语言指令转换为JSON命令格式。

示例1：
用户：帮我查一下北京明天的天气
输出：{"action": "query_weather", "params": {"city": "北京", "date": "tomorrow"}}

示例2：
用户：把这个文件发给张三
输出：{"action": "send_file", "params": {"recipient": "张三", "file": "current"}}

示例3：
用户：创建一个名为weekly-report的定时任务，每周一早上9点执行
输出：{"action": "create_scheduled_task", "params": {"name": "weekly-report", "cron": "0 9 * * 1"}}

现在请转换以下指令：
用户：帮我订一张下周五从上海到深圳的机票`

	contents := []*genai.Content{
		genai.NewContentFromText(prompt, genai.RoleUser),
	}
	config := &genai.GenerateContentConfig{
		Temperature: genai.Ptr(float32(0.0)),
	}

	resp, err := client.Models.GenerateContent(
		ctx, "gemini-2.0-flash", contents, config,
	)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(resp.Text())
}
```

运行结果：

```
{"action": "book_flight", "params": {"from": "上海", "to": "深圳", "date": "next_friday"}}
```

注意，我们在示例中从未出现过"订机票"的场景，但模型通过前三个例子"学会"了转换规律——识别动作意图、提取关键参数、用统一的 JSON 格式输出。这就是 Few-shot 的威力。

> 【建议配图2 —— Few-shot学习过程示意图】
>
> 图片描述：白色背景。采用"教学黑板"的视觉隐喻。画面左侧是一块深色黑板（圆角矩形，深灰背景），黑板上用"粉笔字"风格写着三个示例，每个示例是一对"输入→输出"，用黄色虚线箭头连接。示例1：一个对话气泡图标→一个JSON花括号图标。示例2和示例3格式相同。黑板右上角有一个灯泡图标正在亮起（黄色光芒），旁边标注"总结出规律"。画面右侧是一个蓝色的机器人形象，正在"看"黑板（眼睛朝向黑板方向），机器人头顶有一个思考气泡，内写"输入=自然语言 → 输出=JSON命令"。机器人下方是一个新的输入框"帮我��机票..."，通过绿色粗箭头指向一个绿色光圈中的正确JSON输出。整体构图从左到右表达"示例教学→模型理解→正确泛化"的过程。
>
> 整体目的：帮读者理解Few-shot的工作原理——模型通过阅读少量示例来"学会"任务模式并泛化到新输入。

### **3.1 Few-shot 的最佳实践**

Few-shot 虽然强大，但例子不是随便给的，有几个关键要点会直接影响效果。

**例子数量**方面，通常 3-5 个例子就足够了。太少模型可能抓不住规律，太多会占用宝贵的上下文空间，还可能引入噪声。如果 3 个例子模型就能做对，就没必要加到 10 个。

**例子质量**方面，每个例子应该覆盖不同的情况，而不是同一类输入的简单重复。比如上面订票的例子，三个示例分别覆盖了"查询"、"发送"、"创建"三种不同类型的操作，这样模型才能理解这是一个通用的指令转换任务，而不是只会做某一类操作。

**例子格式**方面，所有示例的格式必须严格一致。如果你的输出有时候是 `{"action": "xxx"}`，有时候是 `{action: xxx}`，模型就会困惑——你到底要哪种格式？格式一致性越高，模型的输出就越稳定。

**例子顺序**也会有影响。一般来说，把最接近目标任务的例子放在最后（离实际问题最近的位置），效果会更好。这是因为大模型对上下文中距离更近的内容有更强的"注意力"。

### **3.2 Zero-shot vs Few-shot：怎么选？**

一个自然的问题是：什么时候用 Zero-shot，什么时候用 Few-shot？

简单来说，如果模型已经"天然"理解你的任务（比如翻译、摘要、写代码），Zero-shot 通常就够了。但如果你需要模型遵循特定的输出格式、执行非标准的分类逻辑，或者发现 Zero-shot 的结果不稳定时，就该上 Few-shot 了。在 Agent 开发中，Few-shot 最常用的场景是 **工具调用的参数格式规范** 和 **意图识别的分类标准**——这两个场景对输出格式的一致性要求非常高，给几个例子能显著提升准确率。

## **4. Chain of Thought：让模型"想清楚再说"**

前面讲的 Zero-shot 和 Few-shot 已经能解决大部分问题了，但遇到需要 **多步推理** 的复杂任务时，模型有时候会"跳步"——直接给一个答案，但答案是错的。

举个例子：你问模型"一个农场有 15 只羊，走了 8 只，又来了 3 只，后来又走了 2 只，现在有多少只？"这种简单算术人类一步步算就行了，但模型有时候会直接蹦出一个错误答案——因为它试图一步到位而没有展开中间推理过程。

**Chain of Thought（CoT，思维链）** 就是为了解决这个问题。核心思想非常简单：**让模型在给出最终答案之前，先把推理过程一步一步写出来**。这个看似不起眼的技巧在 2022 年被 Google 的研究团队提出后，直接把大模型在数学推理、逻辑分析等任务上的准确率提升了一个大台阶。

> 【建议配图3 —— 直接回答 vs CoT推理的对比】
>
> 图片描述：白色背景。上下两个水平流程对比，中间用粗虚线分隔。**上方流程**标题"直接回答（无CoT）"，左侧是一个问题气泡"15只羊，走8只，来3只，走2只，还剩？"，通过一根灰色直线箭头直接连到右侧的红色圆形标注"答：6只 ✗"（错误答案），箭头上方标注"一步跳跃"。整体灰色调暗示不可靠，红色叉号醒目。**下方流程**标题"思维链推理（CoT）"，左侧同样的问题气泡，但后面连接的是一串绿色的"思考步骤"方块，像阶梯一样排列：第一个方块内有计算器图标+"15 - 8 = 7"，第二个方块"7 + 3 = 10"，第三个方块"10 - 2 = 8"，最后一个方块是绿色圆形"答：8只 ✓"。每个方块之间用绿色箭头连接，箭头上标注"逐步推理"。整体绿色调暗示准确可靠。右侧有一个小图例：大脑图标+文字"把思考过程写出来 → 准确率大幅提升"。
>
> 整体目的：直观展示CoT的核心价值——通过展开推理过程来避免"跳步"导致的错误。

### **4.1 基础 CoT：一句话的魔法**

最简单的 CoT 使用方式只需要在 Prompt 末尾加一句话——**"Let's think step by step"（让我们一步一步地思考）**。这就是著名的 **Zero-shot CoT**。别看这句话简单，它的效果已经被大量实验证实了。

原理也不复杂：这句话相当于给模型一个信号——"你不要直接蹦答案，先把思考过程展开"。大模型在"展开"推理过程的同时，相当于给自己创造了更多的"工作空间"（更多的 Token 来存放中间结果），从而降低了推理出错的概率。

来看一段 Go 代码，对比有没有 CoT 的效果：

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"google.golang.org/genai"
)

func generate(ctx context.Context, client *genai.Client, label, prompt string) {
	contents := []*genai.Content{
		genai.NewContentFromText(prompt, genai.RoleUser),
	}
	config := &genai.GenerateContentConfig{
		Temperature: genai.Ptr(float32(0.0)),
	}

	resp, err := client.Models.GenerateContent(
		ctx, "gemini-2.0-flash", contents, config,
	)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("=== %s ===\n%s\n\n", label, resp.Text())
}

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  os.Getenv("GEMINI_API_KEY"),
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	problem := `小明的书架上有3层，第一层放了12本书，第二层放的书是第一层的2倍，
第三层放的书比第一层和第二层加起来少5本。书架上一共有多少本书？`

	// 不用CoT，直接问
	generate(ctx, client, "直接回答", problem+"\n请直接给出答案。")

	// 使用CoT
	generate(ctx, client, "CoT推理", problem+"\n请一步一步地思考，展示你的推理过程。")
}
```

运行结果（示例）：

```
=== 直接回答 ===
书架上一共有55本书。

=== CoT推理 ===
让我一步一步地计算：

第一层：12本书

第二层：是第一层的2倍
12 × 2 = 24本书

第三层：比第一层和第二层加起来少5本
第一层 + 第二层 = 12 + 24 = 36
第三层 = 36 - 5 = 31本书

总共：12 + 24 + 31 = 67本书

书架上一共有67本书。
```

直接回答模式下模型给出了错误的 55，而 CoT 模式下模型逐步计算得到了正确的 67。这个差距在更复杂的推理任务中会更加显著。

### **4.2 Few-shot CoT：用例子教模型怎么"思考"**

如果你想让模型的推理过程更加规范和可控，可以把 Few-shot 和 CoT 结合起来——在示例中不仅给出输入和输出，还给出完整的推理过程。这样模型就会模仿你的推理风格来思考。

这种方式在 Agent 开发中非常实用。比如你要让 Agent 做"该不该调用工具"的决策——这不是一个简单的是否判断，而是需要分析用户意图、对比已有信息和所需信息、评估工具能力之后才能做出的决策。通过 Few-shot CoT，你可以教会 Agent 按照你设定的思考框架来做判断：

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"google.golang.org/genai"
)

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  os.Getenv("GEMINI_API_KEY"),
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	// Few-shot CoT：教Agent做工具调用决策
	prompt := `你是一个AI助手，可以使用以下工具：
- search_web: 搜索互联网获取实时信息
- query_database: 查询内部数据库
- send_email: 发送邮件
- calculate: 执行数学计算

请根据用户的输入，判断是否需要调用工具，以及调用哪个工具。

示例1：
用户：今天上海的股票大盘表现怎么样？
思考：用户问的是"今天"的股票信息，这是实时数据，我的训练数据中不包含今天的信息。我需要使用search_web来获取实时的股票市场数据。
决策：{"need_tool": true, "tool": "search_web", "query": "今天上海股票大盘行情"}

示例2：
用户：Go语言的goroutine和线程有什么区别？
思考：这是一个通用的技术知识问题，我的训练数据中已经包含了这方面的知识，不需要查阅外部资料就能准确回答。
决策：{"need_tool": false, "reason": "已有知识可直接回答"}

示例3：
用户：帮我算一下如果投资10万元，年化收益5.5%，复利计算3年后是多少？
思考：这是一个数学计算问题。虽然我能估算，但复利计算需要精确结果，使用calculate工具更可靠。计算公式是：100000 × (1 + 0.055)^3。
决策：{"need_tool": true, "tool": "calculate", "expression": "100000 * (1 + 0.055) ** 3"}

现在请处理：
用户：帮我查一下我们公司上个月的销售额是多少？`

	contents := []*genai.Content{
		genai.NewContentFromText(prompt, genai.RoleUser),
	}
	config := &genai.GenerateContentConfig{
		Temperature: genai.Ptr(float32(0.0)),
	}

	resp, err := client.Models.GenerateContent(
		ctx, "gemini-2.0-flash", contents, config,
	)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(resp.Text())
}
```

运行结果：

```
思考：用户问的是"我们公司上个月的销售额"，这是公司内部数据，互联网搜索无法获取。我需要使用query_database来查询内部数据库中的销售数据。
决策：{"need_tool": true, "tool": "query_database", "query": "上个月公司销售额"}
```

注意模型不仅选对了工具（query_database 而不是 search_web），还在"思考"步骤中给出了合理的推理——内部数据用数据库查询而非互联网搜索。这种"可解释的决策过程"对于 Agent 的可靠性至关重要，因为你可以通过检查模型的思考过程来判断它的决策是否合理。

> 【建议配图4 —— Agent工具调用决策流程（CoT驱动）】
>
> 图片描述：白色背景。采用自上而下的分层流程设计。**顶层**是一个绿色圆角矩形内含用户头像图标，标注"用户输入"，气泡内写"查一下上月销售额"。向下粗箭头进入**中间层**——一个大的浅蓝色虚线框，标题"Agent思维链推理"，框内是三个并排的判断卡片：左卡片内有地球/搜索图标，标注"search_web"，下方小字"互联网数据"，卡片右上角有红色叉号表示不匹配；中卡片内有数据库圆柱图标，标注"query_database"，下方小字"内部数据"，卡片右上角有绿色大勾号且整个卡片有绿色发光边框表示匹配；右卡片内有计算器图标，标注"calculate"，下方小字"数学计算"，右上角红色叉号。三个卡片上方有一行推理文字："'公司销售额' → 内部数据 → 需要数据库查询"，用虚线箭头依次连接各判断。从匹配的中卡片向下引出粗绿色箭头，进入**底层**：一个绿色圆角矩形，内有齿轮+JSON图标，标注"执行工具调用"，内写`{"tool": "query_database"}`。
>
> 整体目的：展示Agent如何通过CoT推理过程来做出正确的工具选择决策，强调思维链在Agent决策中的实际应用价值。

## **5. Prompt 设计模式**

了解了 Zero-shot、Few-shot 和 CoT 这三种基础技术之后，我们来聊一些在实际开发中非常实用的 **Prompt 设计模式**。这些模式可以单独使用，也可以组合在一起，是 Agent 开发中 System Prompt 设计的基本功。

### **5.1 角色扮演模式（Role Playing）**

这是最常用的 Prompt 设计模式——通过在 System Prompt 中给模型设定一个"角色"，来限定它的回答风格、知识范围和行为方式。

角色扮演不是花哨的噱头，它有非常实在的效果。当你告诉模型"你是一位有 10 年经验的 Go 架构师"时，模型的回答会自然地倾向于更专业的术语、更深入的分析和更有经验的判断。这是因为大模型在预训练时学习了大量不同角色的文本——技术博客、面试问答、教程文章、学术论文——角色设定相当于激活了模型中对应的"知识区域"。

在 Agent 开发中，角色扮演模式几乎是必用的。一个客服 Agent 需要设定为"耐心友善的客服代表"，一个代码审查 Agent 需要设定为"严谨细致的高级工程师"。角色的设定直接影响 Agent 的行为风格和决策倾向。

```go
// Agent角色设定示例
systemPrompt := `你是一位资深的Go语言架构师，在大型互联网公司有10年的后端开发经验。

你的特点：
- 擅长系统设计和性能优化
- 回答技术问题时会考虑生产环境的实际情况
- 会指出方案的优缺点和潜在风险
- 代码风格遵循Go官方规范和最佳实践
- 如果用户的方案存在问题，会直接指出而不是一味附和

你不会做的事：
- 不会推荐你不确定的方案
- 不会忽略错误处理
- 不会给出没有经过思考的"快餐式"回答`
```

这个角色设定有几个值得注意的技巧。首先它不只设定了角色身份，还具体描述了这个角色"会做什么"和"不会做什么"——这种正反双向约束比单纯描述角色更有效。其次它设定了回答风格（考虑生产环境、指出优缺点），这会直接反映在模型的输出中。

### **5.2 结构化输出模式**

在 Agent 应用中，模型的输出经常需要被程序解析和处理——比如工具调用参数需要是合法的 JSON，分类结果需要是预定义的类别之一。这就要求我们通过 Prompt 来严格控制输出格式。

结构化输出模式的关键是 **在 Prompt 中明确定义输出的 Schema**，并在可能的情况下配合模型原生的结构化输出能力。

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"google.golang.org/genai"
)

// CodeReview 代码审查结果的结构体
type CodeReview struct {
	Score    int      `json:"score"`
	Issues   []Issue  `json:"issues"`
	Summary  string   `json:"summary"`
}

type Issue struct {
	Line     int    `json:"line"`
	Severity string `json:"severity"`
	Message  string `json:"message"`
}

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  os.Getenv("GEMINI_API_KEY"),
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	codeToReview := `
func getUser(id string) *User {
    db, _ := sql.Open("mysql", connStr)
    row := db.QueryRow("SELECT * FROM users WHERE id = " + id)
    var user User
    row.Scan(&user.ID, &user.Name, &user.Email)
    return &user
}`

	prompt := fmt.Sprintf(`请对以下Go代码进行审查，找出所有问题。

请严格按照以下JSON格式输出结果，不要输出任何其他内容：
{
  "score": <0-100的整数，代码质量评分>,
  "issues": [
    {
      "line": <问题所在行号>,
      "severity": "<critical/warning/info>",
      "message": "<问题描述>"
    }
  ],
  "summary": "<一句话总结>"
}

待审查的代码：
%s`, codeToReview)

	contents := []*genai.Content{
		genai.NewContentFromText(prompt, genai.RoleUser),
	}
	config := &genai.GenerateContentConfig{
		Temperature: genai.Ptr(float32(0.0)),
	}

	resp, err := client.Models.GenerateContent(
		ctx, "gemini-2.0-flash", contents, config,
	)
	if err != nil {
		log.Fatal(err)
	}

	// 解析JSON结果
	var review CodeReview
	if err := json.Unmarshal([]byte(resp.Text()), &review); err != nil {
		log.Fatalf("JSON解析失败: %v\n原始输出: %s", err, resp.Text())
	}

	fmt.Printf("代码质量评分: %d/100\n", review.Score)
	fmt.Printf("总结: %s\n\n", review.Summary)
	for i, issue := range review.Issues {
		fmt.Printf("问题%d [%s] 第%d行: %s\n", i+1, issue.Severity, issue.Line, issue.Message)
	}
}
```

运行结果：

```
代码质量评分: 15/100
总结: 代码存在SQL注入、资源泄漏、错误未处理等多个严重问题

问题1 [critical] 第3行: 忽略了sql.Open的错误返回值，数据库连接可能失败
问题2 [critical] 第4行: 使用字符串拼接构造SQL语句，存在SQL注入漏洞，应使用参数化查询
问题3 [critical] 第3行: 数据库连接未关闭，会导致连接泄漏
问题4 [warning] 第6行: 忽略了row.Scan的错误返回值
问题5 [warning] 第3行: 每次调用都新建数据库连接，应使用连接池
```

这段代码把模型的非结构化输出转变成了可编程处理的结构化数据。在实际的 Agent 系统中，这种模式无处不在——Agent 的每一次决策（调用什么工具、传什么参数、下一步做什么）都需要以结构化格式输出，才能被程序正确解析和执行。

### **5.3 约束与护栏模式**

在生产环境中部署 Agent，安全性和可控性是头等大事。你不能让 Agent 随心所欲地回答——它不应该泄露系统内部信息，不应该执行危险操作，不应该在不确定时编造答案。**约束与护栏模式**就是通过 Prompt 来给 Agent 画"红线"。

```go
systemPrompt := `你是一家电商平台的智能客服助手。

## 你可以做的事情
- 回答关于订单状态、物流信息、退换货政策的问题
- 帮助用户查询商品信息和库存
- 协助处理简单的售后问题

## 你绝对不能做的事情
- 不能透露任何系统架构、数据库结构或内部接口信息
- 不能修改订单价格或绕过优惠规则
- 不能承诺平台未提供的服务或赔偿
- 不能处理涉及账户安全的操作（改密码、改绑手机），必须引导用户联系人工客服

## 当你不确定时
- 如果用户的问题超出你的能力范围，明确告知并引导转人工客服
- 如果查询结果为空或异常，如实告知用户，不要编造信息
- 如果用户情绪激动，先安抚情绪，再提供解决方案

## 回复规范
- 使用友善、专业的语气
- 回复长度控制在200字以内
- 涉及金额时必须精确到分`
```

这个 Prompt 的结构值得学习——它用"能做什么"和"不能做什么"的正反对比来清晰划定边界，用"不确定时"来覆盖边缘情况，最后用"回复规范"来统一输出风格。在实际 Agent 开发中，你的 System Prompt 越是把边界画清楚，Agent 的行为就越可预测、越安全。

> 【建议配图5 —— Agent安全护栏体系】
>
> 图片描述：白色背景。采用"城堡防御"的视觉隐喻。画面中央是一个蓝色的机器人形象（代表Agent），站在一个圆形平台上。平台周围环绕着三道同心防御圈。**最内圈**是一道绿色虚线，标注"能力边界"，在圈内的几个位置标有绿色勾号图标，旁边分别写"订单查询"、"物流信息"、"售后处理"。**中间圈**是一道橙色实线，标注"行为规范"，线上有几个橙色警告三角图标，旁边写"200字以内"、"金额精确到分"、"友善专业"。**最外圈**是一道红色粗实线（像城墙），标注"安全红线"，墙上有几个红色禁止图标，旁边写"不泄露内部信息"、"不修改价格"、"不编造答案"。城墙外面有几个灰色的箭头试图穿透但被挡住（箭头上标注"注入攻击"、"越权操作"、"信息泄露"），箭头碰到城墙后折断。右下角有一个锁+盾牌组合图标，标注"Prompt即安全策略"。
>
> 整体目的：让读者理解通过Prompt构建的多层安全防护体系——从能力边界到行为规范再到安全红线。

### **5.4 模板变量模式**

在 Agent 系统中，Prompt 往往不是一成不变的——它需要根据上下文动态注入信息。比如当前用户的名字、用户的历史行为、可用工具列表、当前时间等。模板变量模式就是把 Prompt 设计成一个模板，运行时再填入具体的值。

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"google.golang.org/genai"
)

// PromptTemplate 简单的Prompt模板引擎
type PromptTemplate struct {
	template string
}

func NewPromptTemplate(template string) *PromptTemplate {
	return &PromptTemplate{template: template}
}

// Render 渲染模板，替换变量
func (pt *PromptTemplate) Render(vars map[string]string) string {
	result := pt.template
	for key, value := range vars {
		result = strings.ReplaceAll(result, "{{"+key+"}}", value)
	}
	return result
}

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  os.Getenv("GEMINI_API_KEY"),
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	// 定义Agent的System Prompt模板
	agentTemplate := NewPromptTemplate(`你是{{company}}的技术支持助手，当前时间是{{current_time}}。

当前用户信息：
- 用户名：{{username}}
- 会员等级：{{membership}}
- 历史工单数：{{ticket_count}}

你的可用工具：
{{available_tools}}

请根据用户的会员等级调整服务态度：
- 普通会员：标准服务
- 黄金会员：优先处理，语气更加热情
- 钻石会员：VIP服务，可提供专属优惠和加急处理`)

	// 运行时动态注入变量
	systemPrompt := agentTemplate.Render(map[string]string{
		"company":         "GolangStar",
		"current_time":    time.Now().Format("2006-01-02 15:04"),
		"username":        "张三",
		"membership":      "黄金会员",
		"ticket_count":    "3",
		"available_tools": "- search_docs: 搜索帮助文档\n- create_ticket: 创建工单\n- check_status: 查询服务状态",
	})

	config := &genai.GenerateContentConfig{
		SystemInstruction: genai.NewContentFromText(systemPrompt, genai.RoleUser),
		Temperature:       genai.Ptr(float32(0.3)),
	}

	contents := []*genai.Content{
		genai.NewContentFromText("我的订阅快到期了，能帮我看看续费有什么优惠吗？", genai.RoleUser),
	}

	resp, err := client.Models.GenerateContent(
		ctx, "gemini-2.0-flash", contents, config,
	)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(resp.Text())
}
```

运行结果（示例）：

```
张三您好！感谢您一直以来对GolangStar的支持。

作为我们的黄金会员，您续费时可以享受以下专属优惠：
- 年费订阅享8折优惠
- 赠送额外1个月的使用时长

我帮您查一下当前的具体续费方案和到期时间，请稍等。
```

注意模型的回答自动体现了"黄金会员→语气热情、提供优惠"的设定——这正是模板变量模式的价值所在。Agent 的 System Prompt 不再是一个静态的字符串，而是一个能根据上下文动态调整的"活"指令。在 Google ADK 框架中，这种模板变量模式是原生支持的，后续的 ADK 实战中我们会详细讲到。

## **6. 高级技巧：Self-Consistency 与结构化思维**

掌握了前面的基础技术和设计模式之后，再来看两个在 Agent 开发中特别有价值的高级技巧。

### **6.1 Self-Consistency（自一致性）**

Self-Consistency 的原理很直观：**对同一个问题多次采样，然后取多数一致的结果作为最终答案**。这就像是让三个医生分别看同一张 X 光片，如果三个人中有两个说"没问题"，那大概率就是没问题——比只找一个医生看更可靠。

在实际操作中，你对同一个 Prompt 调用多次 API（通常用稍高的 Temperature，比如 0.5-0.7，以获得不同的推理路径），然后比较多次结果，取最一致的答案。

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"google.golang.org/genai"
)

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  os.Getenv("GEMINI_API_KEY"),
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	prompt := `分析以下Go代码是否存在并发安全问题，最后用一个词回答：SAFE 或 UNSAFE。

var counter int

func increment() {
    for i := 0; i < 1000; i++ {
        counter++
    }
}

func main() {
    go increment()
    go increment()
    time.Sleep(time.Second)
    fmt.Println(counter)
}

请先分析，然后在最后一行只输出 SAFE 或 UNSAFE。`

	config := &genai.GenerateContentConfig{
		Temperature: genai.Ptr(float32(0.7)), // 稍高的Temperature以获得多样的推理路径
	}
	contents := []*genai.Content{
		genai.NewContentFromText(prompt, genai.RoleUser),
	}

	// 采样5次
	results := make(map[string]int)
	for i := 0; i < 5; i++ {
		resp, err := client.Models.GenerateContent(
			ctx, "gemini-2.0-flash", contents, config,
		)
		if err != nil {
			log.Printf("第%d次采样失败: %v", i+1, err)
			continue
		}

		text := resp.Text()
		// 提取最后一行的判断结果
		lines := strings.Split(strings.TrimSpace(text), "\n")
		lastLine := strings.TrimSpace(lines[len(lines)-1])

		if strings.Contains(lastLine, "UNSAFE") {
			results["UNSAFE"]++
		} else if strings.Contains(lastLine, "SAFE") {
			results["SAFE"]++
		}
		fmt.Printf("第%d次采样: %s\n", i+1, lastLine)
	}

	// 取多数一致的结果
	fmt.Println("\n--- 投票结果 ---")
	for result, count := range results {
		fmt.Printf("%s: %d票\n", result, count)
	}

	bestResult := ""
	bestCount := 0
	for result, count := range results {
		if count > bestCount {
			bestResult = result
			bestCount = count
		}
	}
	fmt.Printf("最终判定: %s (置信度: %d/%d)\n", bestResult, bestCount, bestCount+results["SAFE"]+results["UNSAFE"]-bestCount)
}
```

运行结果（示例）：

```
第1次采样: UNSAFE
第2次采样: UNSAFE
第3次采样: UNSAFE
第4次采样: UNSAFE
第5次采样: UNSAFE

--- 投票结果 ---
UNSAFE: 5票
最终判定: UNSAFE (置信度: 5/5)
```

Self-Consistency 的代价是多次 API 调用（成本翻倍），但在关键决策场景中（比如 Agent 判断是否执行一个不可逆的操作），这种"多数投票"机制能显著提高可靠性。

### **6.2 结构化思维框架**

在更复杂的 Agent 场景中，我们可以在 Prompt 中预设一个 **结构化的思维框架**，让模型按照固定的步骤来分析问题。这比简单的"step by step"更加可控，因为你定义了每一步具体要做什么。

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"google.golang.org/genai"
)

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  os.Getenv("GEMINI_API_KEY"),
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	// 定义结构化思维框架
	systemPrompt := `你是一位Go语言技术方案评审专家。

当用户提出技术方案时，请严格按照以下框架进行评审：

## 评审框架

**第一步：理解需求**
- 方案要解决什么问题？
- 核心功能是什么？

**第二步：架构分析**
- 整体架构是否合理？
- 技术选型是否恰当？
- 有没有过度设计或设计不足？

**第三步：风险识别**
- 性能瓶颈在哪里？
- 有哪些安全隐患？
- 故障时的影响范围？

**第四步：改进建议**
- 针对发现的问题，给出具体可操作的改进建议
- 建议按优先级排序（P0最高）

请严格按照这四个步骤输出，每个步骤都要有实质内容。`

	userInput := `我打算用Go开发一个实时消息推送服务，架构如下：
- 用户连接：WebSocket长连接，每个连接一个goroutine
- 消息存储：直接存MySQL，每条消息一次INSERT
- 消息推送：从MySQL轮询新消息，有新消息就推送给对应用户
- 部署方案：单机部署，8核16G服务器
- 预期规模：10万在线用户，日消息量500万条`

	config := &genai.GenerateContentConfig{
		SystemInstruction: genai.NewContentFromText(systemPrompt, genai.RoleUser),
		Temperature:       genai.Ptr(float32(0.2)),
	}
	contents := []*genai.Content{
		genai.NewContentFromText(userInput, genai.RoleUser),
	}

	resp, err := client.Models.GenerateContent(
		ctx, "gemini-2.0-flash", contents, config,
	)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(resp.Text())
}
```

这种结构化思维框架在 Agent 开发中有广泛的应用场景——比如让 Agent 按固定流程处理客户投诉（安抚情绪→了解问题→查询信息→给出方案→确认满意度），或者按固定步骤审核数据（格式检查→范围验证→逻辑校验→结果汇总）。框架越清晰，Agent 的行为就越稳定可预测。

> 【建议配图6 —— 结构化思维框架工作流】
>
> 图片描述：白色背景。采用"下楼梯"式的阶梯流程设计，从左上到右下斜向排列。四级阶梯，每一级是一个宽矩形卡片，颜色从浅到深递进（浅蓝→蓝→深蓝→藏蓝），体现分析的逐步深入。**第一级阶梯**标注序号①，卡片内有放大镜+文档图标，标题"理解需求"，副文字"问题是什么？功能是什么？"。**第二级**标注②，卡片内有建筑/积木图标，标题"架构分析"，副文字"选型合理？设计适度？"。**第三级**标注③，卡片内有警告三角+闪电图标，标题"风险识别"，副文字"性能？安全？故障？"，此卡片右上角有一个小红点作为高亮提示。**第四级**标注④，卡片内有扳手+上升箭头图标，标题"改进建议"，副文字"P0→P1→P2 优先级排序"。每两级之间用一根向下的粗箭头连接，箭头上标注"输出作为下一步输入"。整体右侧有一条纵向虚线标注"思维深度递增 ↓"。
>
> 整体目的：展示结构化思维框架如何将一个复杂的分析任务分解为层层递进的步骤，让Agent的推理过程变得有序可控。

## **7. Prompt Engineering 在 Agent 中的实际应用**

前面讲了各种技巧和模式，最后我们来看看这些技术在真实 Agent 系统中是如何组合运用的。一个完整的 Agent 系统通常需要设计多个 Prompt，它们各司其职又相互配合。

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"google.golang.org/genai"
)

// AgentAction 代表Agent的一次决策
type AgentAction struct {
	Thought string `json:"thought"` // 思考过程（CoT）
	Action  string `json:"action"`  // 动作类型：tool_call / direct_reply / clarify
	Tool    string `json:"tool,omitempty"`
	Params  map[string]string `json:"params,omitempty"`
	Reply   string `json:"reply,omitempty"`
}

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  os.Getenv("GEMINI_API_KEY"),
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	// 综合运用多种Prompt技巧的Agent System Prompt
	systemPrompt := `你是一个Go项目开发助手Agent。

## 可用工具
- search_docs: 搜索Go官方文档，参数 {"query": "搜索关键词"}
- run_code: 运行Go代码片段，参数 {"code": "Go代码"}
- search_packages: 搜索Go第三方包，参数 {"keyword": "包名关键词"}

## 决策规则
对于用户的每个输入，你需要用JSON格式输出你的决策。决策前请先思考：

1. 用户想要什么？（理解意图）
2. 我已有的知识能否直接回答？（评估能力）
3. 如果不能，哪个工具可以帮助我？（选择工具）
4. 如果用户的问题模糊不清，我应该追问什么？（澄清需求）

## 输出格式
严格输出以下JSON，不要输出其他内容：
{
  "thought": "你的思考过程",
  "action": "tool_call 或 direct_reply 或 clarify",
  "tool": "工具名（仅action=tool_call时需要）",
  "params": {"参数名": "参数值"},
  "reply": "直接回复内容（仅action=direct_reply或clarify时需要）"
}

## 示例

用户：Go的slice和array有什么区别？
{"thought": "这是Go语言的基础知识问题，我可以直接准确回答，不需要查阅文档。", "action": "direct_reply", "reply": "Array是固定长度的值类型，声明时必须指定长度；Slice是动态长度的引用类型，底层引用一个Array。Slice有len和cap两个属性，可以通过append动态扩容。在实际开发中，绝大多数场景使用Slice而非Array。"}

用户：有没有好用的Go语言ORM库？
{"thought": "用户在寻找Go的ORM库推荐。虽然我知道一些（如GORM、Ent），但为了给出最新最全的推荐，我应该搜索一下当前流行的选择。", "action": "tool_call", "tool": "search_packages", "params": {"keyword": "orm"}}

用户：帮我优化一下性能
{"thought": "用户说要优化性能，但没有说明是优化什么代码、什么场景的性能。我需要更多上下文才能给出有价值的建议。", "action": "clarify", "reply": "我很乐意帮你优化性能！为了给出更有针对性的建议，能告诉我：1. 是哪段代码或哪个服务需要优化？2. 当前遇到的性能问题是什么（响应慢、内存高、CPU占用高）？3. 有没有性能测试数据可以分享？"}`

	config := &genai.GenerateContentConfig{
		SystemInstruction: genai.NewContentFromText(systemPrompt, genai.RoleUser),
		Temperature:       genai.Ptr(float32(0.0)),
	}

	// 模拟用户输入
	userInputs := []string{
		"Go里面怎么做优雅关闭？",
		"帮我找一个处理Excel文件的Go库",
		"我的程序有bug",
	}

	for _, input := range userInputs {
		contents := []*genai.Content{
			genai.NewContentFromText(input, genai.RoleUser),
		}

		resp, err := client.Models.GenerateContent(
			ctx, "gemini-2.0-flash", contents, config,
		)
		if err != nil {
			log.Fatal(err)
		}

		var action AgentAction
		if err := json.Unmarshal([]byte(resp.Text()), &action); err != nil {
			fmt.Printf("用户: %s\n解析失败: %v\n原始输出: %s\n\n", input, err, resp.Text())
			continue
		}

		fmt.Printf("用户: %s\n", input)
		fmt.Printf("思考: %s\n", action.Thought)
		fmt.Printf("决策: %s\n", action.Action)
		if action.Tool != "" {
			fmt.Printf("工具: %s, 参数: %v\n", action.Tool, action.Params)
		}
		if action.Reply != "" {
			fmt.Printf("回复: %s\n", action.Reply)
		}
		fmt.Println()
	}
}
```

运行结果（示例）：

```
用户: Go里面怎么做优雅关闭？
思考: 这是Go语言的常见实践问题，涉及signal处理和context。我可以直接给出准确的回答。
决策: direct_reply
回复: Go中实现优雅关闭通常使用os/signal包监听SIGINT和SIGTERM信号，配合context实现超时控制...

用户: 帮我找一个处理Excel文件的Go库
思考: 用户需要Go语言的Excel处理库。虽然我知道excelize是最流行的，但应该搜索确认是否有更新的选择。
决策: tool_call
工具: search_packages, 参数: map[keyword:excel]

用户: 我的程序有bug
思考: 用户说程序有bug，但没有提供任何代码、错误信息或问题描述。我无法在不了解具体情况的前提下给出帮助，需要追问。
决策: clarify
回复: 我来帮你排查bug！请提供以下信息：1. 出问题的代码片段 2. 报错信息或异常行为描述 3. 你期望的正确行为是什么？
```

这个示例展示了一个完整的 Agent 决策 Prompt 是如何融合多种技术的：角色扮演（Go项目开发助手）、结构化输出（JSON决策格式）、CoT（thought字段）、Few-shot（三个决策示例）、约束与护栏（决策规则和输出格式要求）。在实际的 ADK 框架中，这些 Prompt 设计理念会以更优雅的方式集成——Agent 的 Instruction、工具的 Description、Session 的 State 都是 Prompt Engineering 的不同体现形式。

> 【建议配图7 —— Agent决策Prompt的组成结构】
>
> 图片描述：白色背景。采用"拼图"或"积木搭建"的视觉隐喻。画面中央是一个完整的大号竖向卡片，代表"完整的Agent System Prompt"，卡片用蓝色描边。卡片内部从上到下分为五个色彩不同的区域块，像积木一样叠在一起，每块之间有微妙的拼接缝隙感。**最上方**是紫色块，左侧有面具/剧场图标，标注"角色设定"，右侧小字"Role Playing"。**第二块**是橙色块，左侧有扳手/工具箱图标，标注"工具描述"，右侧小字"Available Tools"。**第三块**是蓝色块，左侧有路标/指南针图标，标注"决策规则 + CoT引导"，右侧小字"Rules + Chain of Thought"。**第四块**是绿色块，左侧有JSON/花括号图标，标注"输出格式约束"，右侧小字"Structured Output"。**最下方**是黄色块，左侧有笔记本/示例图标，标注"Few-shot示例"，右侧小字"In-Context Examples"。卡片左侧有一条纵向的虚线箭头标注"模型阅读顺序 ↓"。卡片右侧有三条弯曲的虚线分别从"角色设定"、"决策规则"和"输出格式"引出到右边的小标签，标签内分别写"限定行为边界"、"引导推理过程"、"确保可解析输出"。
>
> 整体目的：让读者看到一个完整的Agent Prompt是由哪些"积木"组合而成的，理解各部分的作用和组合逻辑。

## **8. 常见误区与避坑指南**

在实际使用 Prompt Engineering 的过程中，有一些常见的坑值得提前规避。

**误区一：Prompt 越长越好。** 很多人以为 Prompt 写得越详细效果越好，恨不得把所有可能的情况都列一遍。但实际上，过长的 Prompt 反而会稀释模型的注意力——关键指令被淹没在大量细节中，模型反而抓不住重点。好的 Prompt 应该精简但完整，把最重要的指令放在开头和结尾（因为模型对这两个位置的注意力最强），中间放必要的补充细节。

**误区二：把所有逻辑都塞在 Prompt 里。** 有人试图通过一个巨大的 Prompt 来处理所有场景——各种条件分支、异常处理、格式转换全写在 Prompt 里。这不仅让 Prompt 难以维护，而且效果也不好。正确的做法是 **Prompt 负责决策，代码负责执行**。让模型判断"应该调用哪个工具"，具体的工具逻辑用 Go 代码实现；让模型生成"结构化的决策 JSON"，具体的分支处理用 Go 的 if-else 来做。

**误区三：忽视 Prompt 的版本管理。** 在生产环境中，Prompt 就是代码的一部分——它直接影响 Agent 的行为。你应该像管理代码一样管理 Prompt：用版本控制、做 A/B 测试、记录变更日志。因为一个字的改动都可能导致 Agent 行为的显著变化，如果没有版本管理，出了问题你都不知道是什么时候、谁的改动导致的。

**误区四：不做输出验证。** 模型的输出不是百分百可靠的。即使你的 Prompt 写得再好，模型偶尔还是会输出不符合格式要求的内容。所以在代码层面，你必须对模型的输出做验证——JSON 解析是否成功？必填字段是否存在？枚举值是否在预期范围内？如果验证失败，要有重试或降级机制。

## **9. 小结**

Prompt Engineering 说到底做的就是一件事：**用精确的语言把你的意图传达给大模型**。Zero-shot 是最直觉的方式，适合模型已经理解的任务；Few-shot 是用例子说话，适合需要规范格式或特殊逻辑的场景；CoT 是让模型"把草稿纸摊开来"，适合需要多步推理的复杂问题。而角色扮演、结构化输出、约束护栏、模板变量这些设计模式，则是在实际工程中把这些基础技术组装成可靠系统的粘合剂。

对于 Agent 开发者来说，Prompt Engineering 的功力会直接体现在 Agent 的表现上——一个 System Prompt 写得好的 Agent，能够更准确地理解用户意图、更合理地选择工具、更稳定地输出结构化结果。这不是一项可以速成的技能，它需要在实际项目中不断打磨和迭代。但好消息是，当你后续学习 ADK 框架时，会发现框架已经帮你封装了很多 Prompt 工程的最佳实践——你需要做的是理解原理，在框架的基础上根据自己的业务场景做精细化调优。

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
