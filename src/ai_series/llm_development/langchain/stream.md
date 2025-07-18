---
title: 流式传输
tags:
  - AI
  - AI应用开发
  - llm
  - 大模型
  - 大模型应用开发
  - LangChain
  - Callbacks
  - 回调
---

# 流式传输

流式传输在基于大语言模型（LLMs）的应用中起着至关重要的作用，它能够显著提升应用在终端用户侧的响应速度，增强用户体验。

在LangChain框架中，诸如大语言模型、解析器、提示、检索器和代理等核心组件，均实现了LangChain的Runnable接口。该接口提供了两种实现内容流式传输的方法：
- 同步的 `stream` 和异步的 `astream`：这是默认的流式传输实现方式，其功能是将链的最终结果以流式方式输出。
- 异步的 `astream_events` 和 `astream_log`：它们提供了一种从链中流式传输中间步骤和最终输出的机制。

下面我们将详细探讨这两种方法，并介绍如何在实际应用中使用它们。

## 使用流式传输
所有实现了 `Runnable` 接口的对象，都具备同步方法 `stream` 和异步方法 `astream`。这两个方法的主要作用是将最终输出分块进行流式输出，一旦有可用的输出块，便会立即进行传输。

然而，要实现流式处理，程序中的每个步骤都必须具备处理输入流的能力，即能够一次处理一个输入块，并生成相应的输出块。流式处理的复杂度因任务而异，简单的任务可能只是逐个输出大语言模型生成的令牌，而复杂的任务则可能需要在JSON结果完全生成之前就进行部分流式处理。

对于想要深入研究流式处理的开发者来说，大语言模型作为大语言模型应用中的核心组件，是一个理想的切入点。

## LLMs and Chat Models
LLMS及其Chat Models，是基于大语言模型的应用中的主要性能瓶颈。LLMS对查询的完整响应往往需要数秒时间，这远远超过了约200 - 300毫秒的响应阈值，而该阈值是决定应用在用户感知中是否具有快速响应性的关键指标。

为了提高应用的响应性，一种有效的策略是显示中间进度，即逐个流式输出模型生成的令牌。以下是一个示例代码：

```python
%pip install -qU langchain-openai
# 此处以Anthropic为例，也可根据需求选择其他聊天模型
from langchain_openai import ChatOpenAI
model = ChatOpenAI()
chunks = []
async for chunk in model.astream("hello. tell me something about yourself"):
    chunks.append(chunk)
    print(chunk.content, end="|", flush=True)
```

输出结果如下：
```
|Hello|!| I| am| an| AI| digital| assistant| designed| to| provide| information| and| assistance| to| users|.| I| am| constantly| learning| and| evolving| to| better| help| with| a| wide| range| of| tasks| and| questions|.| How| can| I| assist| you| today|?||
```

我们可以进一步查看其中一个输出块：
```python
chunks[1]
```

输出为：
```
AIMessageChunk(content='Hello')
```

这里我们得到了一个 `AIMessageChunk` 对象，它代表了 `AIMessage` 的一部分。这些消息块在设计上是可累加的，通过将它们相加，我们可以获取到目前为止模型的响应状态。

```python
chunks[0] + chunks[1] + chunks[2] + chunks[3] + chunks[4]
```

输出结果为：
```
AIMessageChunk(content='Hello! I am')
```

## 链
在实际的大语言模型应用中，通常不仅仅是简单地调用语言模型。我们可以使用 `LangChain 表达式语言`（`LCEL`）构建一个简单的链，将提示、模型和解析器相结合，以验证流式处理是否能够正常工作。

这里我们使用 `StrOutputParser` 来解析模型的输出。该解析器的功能是从 `AIMessageChunk` 中提取 `content` 字段，从而获取模型返回的令牌。

需要注意的是，`LCEL` 是一种通过串联不同的LangChain原始组件来指定“程序”的声明式方式。使用 `LCEL` 创建的链会自动实现 `stream` 和 `astream` 方法，从而实现最终输出的流式处理。实际上，使用 `LCEL` 创建的链实现了整个标准的 `Runnable` 接口。

以下是示例代码：
```python
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
prompt = ChatPromptTemplate.from_template("告诉我一个关于{topic}的笑话")
parser = StrOutputParser()
chain = prompt | model | parser
async for chunk in chain.astream({"topic": "鹦鹉"}):
    print(chunk, end="|", flush=True)
```

输出结果为：
```
|为|什|么|鹦|鹉|不|会|搞|笑|？
|因|为|它|们|只|会|模|仿|，|不|会|创|作|！|哈|哈|哈|！||
```

值得一提的是，其实并不一定要使用 `LangChain 表达式语言` 来使用LangChain。也可以采用标准的命令式编程方法，对每个组件单独调用 `invoke`、`batch` 或 `stream` 方法，将结果赋值给变量，然后根据需要在下游进行使用。如果场景适合这种方法，那么也是完全可行的。

## 处理输入流
在实际应用中，有时我们需要在生成过程中对JSON进行流式传输。然而，如果依赖 `json.loads` 来解析部分JSON，由于部分JSON并非有效的JSON格式，解析操作将会失败。这可能会让开发者认为无法对JSON进行流式传输，但实际上，存在一种解决方案，即解析器需要能够操作输入流，并尝试将部分JSON自动补全为有效状态。

以下是一个示例代码，展示了如何实现这一点：
```python
from langchain_core.output_parsers import JsonOutputParser
chain = (
    model | JsonOutputParser()
)  # 由于Langchain旧版本存在bug，JsonOutputParser无法从某些模型流式传输结果
async for text in chain.astream(
    'output a list of the countries france, spain and japan and their populations in JSON format. Use a dict with an outer key of "countries" which contains a list of countries. Each country should have the key `name` and `population`'
):
    print(text, flush=True)
```

输出结果如下：
```
{}
{'countries': []}
{'countries': [{}]}
{'countries': [{'name': ''}]}
{'countries': [{'name': 'France'}]}
{'countries': [{'name': 'France', 'population': 670}]}
{'countries': [{'name': 'France', 'population': 670760}]}
{'countries': [{'name': 'France', 'population': 67076000}]}
{'countries': [{'name': 'France', 'population': 67076000}, {}]}
{'countries': [{'name': 'France', 'population': 67076000}, {'name': ''}]}
{'countries': [{'name': 'France', 'population': 67076000}, {'name': 'Spain'}]}
{'countries': [{'name': 'France', 'population': 67076000}, {'name': 'Spain', 'population': 467}]}
{'countries': [{'name': 'France', 'population': 67076000}, {'name': 'Spain', 'population': 467043}]}
{'countries': [{'name': 'France', 'population': 67076000}, {'name': 'Spain', 'population': 46704314}]}
{'countries': [{'name': 'France', 'population': 67076000}, {'name': 'Spain', 'population': 46704314}, {}]}
{'countries': [{'name': 'France', 'population': 67076000}, {'name': 'Spain', 'population': 46704314}, {'name': ''}]}
{'countries': [{'name': 'France', 'population': 67076000}, {'name': 'Spain', 'population': 46704314}, {'name': 'Japan'}]}
{'countries': [{'name': 'France', 'population': 67076000}, {'name': 'Spain', 'population': 46704314}, {'name': 'Japan', 'population': 126}]}
{'countries': [{'name': 'France', 'population': 67076000}, {'name': 'Spain', 'population': 46704314}, {'name': 'Japan', 'population': 126476}]}
{'countries': [{'name': 'France', 'population': 67076000}, {'name': 'Spain', 'population': 46704314}, {'name': 'Japan', 'population': 126476458}]}
```

现在，我们尝试对上述流式传输进行“破坏”操作。我们在原示例的基础上，在末尾添加一个提取函数，用于从最终生成的JSON中提取国家名称。

需要注意的是，链中任何依赖最终输入而不是输入流的步骤，都可能会破坏 `stream` 或 `astream` 的流式传输功能。不过，后续我们将介绍 `astream_events` API，它可以从中间步骤流式传输结果，即使链中包含只操作最终输入的步骤，该API也能正常工作。

以下是示例代码：
```python
from langchain_core.output_parsers import (
    JsonOutputParser,
)
# 一个处理最终输入，而不是输入流的函数
def _extract_country_names(inputs):
    """一个不处理输入流，会破坏流式传输的函数。"""
    if not isinstance(inputs, dict):
        return ""
    if "countries" not in inputs:
        return ""
    countries = inputs["countries"]
    if not isinstance(countries, list):
        return ""
    country_names = [
        country.get("name") for country in countries if isinstance(country, dict)
    ]
    return country_names
chain = model | JsonOutputParser() | _extract_country_names
async for text in chain.astream(
    'output a list of the countries france, spain and japan and their populations in JSON format. Use a dict with an outer key of "countries" which contains a list of countries. Each country should have the key `name` and `population`'
):
    print(text, end="|", flush=True)
```

输出结果为：
```
[None, '', 'France', 'France', 'France', 'France', 'France', None, 'France', '', 'France', 'Spain', 'France', 'Spain', 'France', 'Spain', 'France', 'Spain', 'France', 'Spain', None, 'France', 'Spain', '', 'France', 'Spain', 'Japan', 'France', 'Spain', 'Japan', 'France', 'Spain', 'Japan', 'France', 'Spain', 'Japan']|
```

## 生成器函数
为了解决上述流式传输被破坏的问题，我们可以使用一个生成器函数来修复流式传输。生成器函数（使用 `yield` 的函数）允许我们编写能够操作输入流的代码。

以下是示例代码：
```python
from langchain_core.output_parsers import JsonOutputParser
async def _extract_country_names_streaming(input_stream):
    """一个处理输入流的函数。"""
    country_names_so_far = set()
    async for input in input_stream:
        if not isinstance(input, dict):
            continue
        if "countries" not in input:
            continue
        countries = input["countries"]
        if not isinstance(countries, list):
            continue
        for country in countries:
            name = country.get("name")
            if not name:
                continue
            if name not in country_names_so_far:
                yield name
                country_names_so_far.add(name)
chain = model | JsonOutputParser() | _extract_country_names_streaming
async for text in chain.astream(
    'output a list of the countries france, spain and japan and their populations in JSON format. Use a dict with an outer key of "countries" which contains a list of countries. Each country should have the key `name` and `population`'
):
    print(text, end="|", flush=True)
```

输出结果为：
```
France|Spain|Japan|
```

需要注意的是，由于上述代码依赖于JSON自动补全，所以可能会看到部分国家的名称（如 `Sp` 和 `Spain`），这并非我们期望的提取结果。我们主要关注的是流式传输的概念，而不是链的最终结果。

## 非流式组件
部分内置组件，如检索器，并不提供 `streaming` 功能。那么，如果我们尝试对这些组件进行 `stream` 操作，会发生什么呢？

以下是示例代码：
```python
from langchain_community.vectorstores import FAISS
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import OpenAIEmbeddings
template = """根据以下上下文回答问题：
{context}
问题：{question}"""
prompt = ChatPromptTemplate.from_template(template)
vectorstore = FAISS.from_texts(
    ["harrison worked at kensho", "harrison likes spicy food"],
    embedding=OpenAIEmbeddings(),
)
retriever = vectorstore.as_retriever()
chunks = [chunk for chunk in retriever.stream("harrison在哪里工作？")]
chunks
```

输出结果为：
```
[[Document(page_content='harrison worked at kensho'),
  Document(page_content='harrison likes spicy food')]]
```

可以看到，流式操作仅返回了该组件的最终结果。这是正常现象，并非所有组件都需要实现流式操作。在某些情况下，流式操作可能是不必要的、困难的，或者根本不适用。

值得注意的是，使用非流式组件构建的LCEL链，在很多情况下仍然可以实现流式处理，流式输出会在链中的最后一个非流式步骤之后开始。

以下是示例代码：
```python
retrieval_chain = (
    {
        "context": retriever.with_config(run_name="Docs"),
        "question": RunnablePassthrough(),
    }
    | prompt
    | model
    | StrOutputParser()
)
for chunk in retrieval_chain.stream(
    "Where did harrison work?  Write 3 made up sentences about this place."
):
    print(chunk, end="|", flush=True)
```

输出结果为：
```
|H|arrison| worked| at| Kens|ho|,| a| trendy| fusion| restaurant| known| for| its| unique| dishes| blending| Asian| and| Latin| flavors|.| The| restaurant|'s| cozy| atmosphere| and| dim| lighting| made| it| a| popular| spot| for| date| nights|.| Harrison|'s| coworkers| at| Kens|ho| were| like| family| to| him|,| always| joking| around| and| supporting| each| other| during| busy| shifts|.||
```

现在，我们已经了解了 `stream` 和 `astream` 的工作原理，接下来让我们深入探索事件流的世界。

## 使用流事件
事件流是一个处于测试阶段的API，根据用户反馈，该API可能会在未来进行调整。

需要注意的是，该功能从langchain-core 0.1.14版本开始引入。

以下是验证版本的代码：
```python
import langchain_core
langchain_core.__version__
```

输出结果为：
```
'0.1.33'
```

为了确保 `astream_events` API能够正常工作，需要遵循以下几点：
- 尽量使用 `async` （例如异步工具等）。
- 如果使用自定义函数或可运行对象，请传递回调。
- 如果不使用LCEL而使用可运行对象，请确保对大语言模型调用 `.astream()`，而不是 `.ainvoke()`，以强制大语言模型进行流式处理令牌。
- 如果遇到任何意外问题，请及时反馈给我们。

### 事件参考
以下是一个表格，列出了各种Runnable对象可能发出的一些事件。

需要注意的是，当流式处理正确实现时，Runnable的输入将在输入流完全消费后才可知。这意味着 `inputs` 通常只包含 `end` 事件，而不包含 `start` 事件。

| 事件 | 名称 | 块 | 输入 | 输出 |
| --- | --- | --- | --- | --- |
| on_chat_model_start | [模型名称] |  | {"messages": [[SystemMessage, HumanMessage]]} |  |
| on_chat_model_stream | [模型名称] | AIMessageChunk(content="hello") |  |  |
| on_chat_model_end | [模型名称] |  | {"messages": [[SystemMessage, HumanMessage]]} | {"generations": [...], "llm_output": None, ...} |
| on_llm_start | [模型名称] |  | {'input': 'hello'} |  |
| on_llm_stream | [模型名称] | 'Hello' |  |  |
| on_llm_end | [模型名称] |  | 'Hello human!' |  |
| on_chain_start | format_docs |  |  |  |
| on_chain_stream | format_docs | "hello world!, goodbye world!" |  |  |
| on_chain_end | format_docs |  | [Document(...)] | "hello world!, goodbye world!" |
| on_tool_start | some_tool |  | {"x": 1, "y": "2"} |  |
| on_tool_stream | some_tool | {"x": 1, "y": "2"} |  |  |
| on_tool_end | some_tool |  |  | {"x": 1, "y": "2"} |
| on_retriever_start | [检索器名称] |  | {"query": "hello"} |  |
| on_retriever_chunk | [检索器名称] | {documents: [...]} |  |  |
| on_retriever_end | [检索器名称] |  | {"query": "hello"} | {documents: [...]} |
| on_prompt_start | [模板名称] |  | {"question": "hello"} |  |
| on_prompt_end | [模板名称] |  | {"question": "hello"} | ChatPromptValue(messages: [SystemMessage, ...]) |

### 聊天模型
首先，我们来观察聊天模型产生的事件。

以下是示例代码：
```python
events = []
async for event in model.astream_events("hello", version="v1"):
    events.append(event)
```

需要注意的是，API中的 `version="v1"` 参数是为了应对该API处于测试阶段可能进行的改动。该参数的作用是尽量减少对代码的破坏性更改，虽然现在可能会带来一些小问题，但这是为了后续的稳定性考虑。

接下来，我们查看开始事件和结束事件的示例：
```python
events[:3]
```

输出结果为：
```
[{'event': 'on_chat_model_start',
  'run_id': '05d7a7b9-0046-44b5-b325-7e145d61c7ec',
  'name': 'ChatOpenAI',
  'tags': [],
  'metadata': {},
  'data': {'input': 'hello'}}, 
 {'event': 'on_chat_model_stream',
  'run_id': '05d7a7b9-0046-44b5-b325-7e145d61c7ec',
  'tags': [],
  'metadata': {},
  'name': 'ChatOpenAI',
  'data': {'chunk': AIMessageChunk(content='')}}}, 
 {'event': 'on_chat_model_stream',
  'run_id': '05d7a7b9-0046-44b5-b325-7e145d61c7ec',
  'tags': [],
  'metadata': {},
  'name': 'ChatOpenAI',
  'data': {'chunk': AIMessageChunk(content='Hello')}}]
```

### 链
我们再次回顾解析流式JSON的示例链，深入探索流式事件API。

以下是示例代码：
```python
chain = (
    model | JsonOutputParser()
)  # 由于Langchain旧版本存在bug，JsonOutputParser无法从某些模型流式传输结果
events = [
    event
    async for event in chain.astream_events(
        'output a list of the countries france, spain and japan and their populations in JSON format. Use a dict with an outer key of "countries" which contains a list of countries. Each country should have the key `name` and `population`',
        version="v1",
    )
]
```

如果查看最初的几个事件，会发现有3个不同的开始事件，而不是2个。这三个开始事件分别对应链（模型 + 解析器）、模型和解析器。

以下是查看最初几个事件的代码：
```python
events[:3]
```

输出结果为：
```
[{'event': 'on_chain_start',
  'run_id': 'd079d884-af8c-41a5-89be-df182f5d7a68',
  'name': 'RunnableSequence',
  'tags': [],
  'metadata': {},
  'data': {'input': '输出包含法国、西班牙和日本及其人口的国家列表，以 JSON 格式。使用一个外键为 "countries" 的字典，其中包含一个国家列表。每个国家应具有键 `name` 和 `population`'}}, 
 {'event': 'on_chat_model_start',
  'name': 'ChatOpenAI',
  'run_id': 'd77fc4ef-3645-4f4b-a0f9-774c4498c1f6',
  'tags': ['seq:step:1'],
  'metadata': {},
  'data': {'input': {'messages': [[HumanMessage(content='输出包含法国、西班牙和日本及其人口的国家列表，以 JSON 格式。使用一个外键为 "countries" 的字典，其中包含一个国家列表。每个国家应具有键 `name` 和 `population`')]]}}}, 
 {'event': 'on_chat_model_stream',
  'name': 'ChatOpenAI',
  'run_id': 'd77fc4ef-3645-4f4b-a0f9-774c4498c1f6',
  'tags': ['seq:step:1'],
  'metadata': {},
  'data': {'chunk': AIMessageChunk(content='')}}}]}
```

也可以尝试猜测查看最后三个事件和中间事件会得到什么结果。

接下来，我们使用该API从模型和解析器中获取流式事件，同时忽略开始事件、结束事件和链的事件。

以下是示例代码：
```python
num_events = 0
async for event in chain.astream_events(
    'output a list of the countries france, spain and japan and their populations in JSON format. Use a dict with an outer key of "countries" which contains a list of countries. Each country should have the key `name` and `population`',
    version="v1",
):
    kind = event["event"]
    if kind == "on_chat_model_stream":
        print(
            f"Chat model chunk: {repr(event['data']['chunk'].content)}",
            flush=True,
        )
    if kind == "on_parser_stream":
        print(f"Parser chunk: {event['data']['chunk']}", flush=True)
    num_events += 1
    if num_events > 30:
        # 截断输出
        print("...")
        break
```

输出结果为：
```
Chat model chunk: ''
Chat model chunk: '{
'
Parser chunk: {}
Chat model chunk: ' '
Chat model chunk: '  "'
Chat model chunk: 'countries'
Chat model chunk: '":'
Chat model chunk: '  [
'
Parser chunk: {'countries': []}
Chat model chunk: '   '
Chat model chunk: '  {
'
Parser chunk: {'countries': [{}]}
Chat model chunk: '     '
Chat model chunk: '  "'
Chat model chunk: 'name'
Chat model chunk: '":'
Chat model chunk: '  "'
Parser chunk: {'countries': [{'name': ''}]}
Chat model chunk: 'France'
Parser chunk: {'countries': [{'name': 'France'}]}
Chat model chunk: '",
'
Chat model chunk: '     '
Chat model chunk: '  "'
...
```

由于模型和解析器都支持流式传输，我们可以观察到来自这两个组件的真实流式事件，这是非常有趣的现象。

### 过滤事件
由于该API会产生大量事件，因此能够对事件进行过滤是非常有用的。可以根据组件的 `name`、`tags` 或 `type` 进行过滤。

#### 按名字过滤
以下是按名字过滤事件的示例代码：
```python
chain = model.with_config({"run_name": "model"}) | JsonOutputParser().with_config(
    {"run_name": "my_parser"}
)
max_events = 0
async for event in chain.astream_events(
    'output a list of the countries france, spain and japan and their populations in JSON format. Use a dict with an outer key of "countries" which contains a list of countries. Each country should have the key `name` and `population`',
    version="v1",
    include_names=["my_parser"],
):
    print(event)
    max_events += 1
    if max_events > 10:
        # 截断输出
        print("...")
        break
```

#### 按类型过滤
以下是按类型过滤事件的示例代码：
```python
chain = model.with_config({"run_name": "model"}) | JsonOutputParser().with_config(
    {"run_name": "my_parser"}
)
max_events = 0
async for event in chain.astream_events(
    'output a list of the countries france, spain and japan and their populations in JSON format. Use a dict with an outer key of "countries" which contains a list of countries. Each country should have the key `name` and `population`',
    version="v1",
    include_types=["chat_model"],
):
    print(event)
    max_events += 1
    if max_events > 10:
        # 截断输出
        print("...")
        break
```

#### 按标签过滤
需要注意的是，标签会继承给给定可运行组件的子组件。如果使用标签进行过滤，请确保符合预期。

以下是按标签过滤事件的示例代码：
```python
chain = (model | JsonOutputParser()).with_config({"tags": ["my_chain"]})
max_events = 0
async for event in chain.astream_events(
    'output a list of the countries france, spain and japan and their populations in JSON format. Use a dict with an outer key of "countries" which contains a list of countries. Each country should have the key `name` and `population`',
    version="v1",
    include_tags=["my_chain"],
):
    print(event)
    max_events += 1
    if max_events > 10:
        # 截断输出
        print("...")
        break
```

### 非流式组件
我们之前提到过，有些组件由于不处理输入流，可能会导致流式传输效果不佳。当使用 `astream` 时，这些组件可能会中断最终输出的流式处理。然而，`astream_events` 仍然可以从支持流式处理的中间步骤中产生流式事件。

以下是一个示例代码，展示了这种情况：
```python
# 一个不支持流式传输的函数。
# 它处理最终输入，而不是输入流。
def _extract_country_names(inputs):
    """一个不处理输入流，会破坏流式传输的函数。"""
    if not isinstance(inputs, dict):
        return ""
    if "countries" not in inputs:
        return ""
    countries = inputs["countries"]
    if not isinstance(countries, list):
        return ""
    country_names = [
        country.get("name") for country in countries if isinstance(country, dict)
    ]
    return country_names
chain = (
    model | JsonOutputParser() | _extract_country_names
)  # 这个解析器目前只支持OpenAI
```

不出所料，由于 `_extract_country_names` 不处理流，`astream` API无法正常工作。

以下是测试 `astream` API的代码：
```python
async for chunk in chain.astream(
    'output a list of the countries france, spain and japan and their populations in JSON format. Use a dict with an outer key of "countries" which contains a list of countries. Each country should have the key `name` and `population`'
):
    print(chunk, flush=True)
```

现在，我们验证使用 `astream_events` 时，模型和解析器是否仍然能够产生流式输出。

以下是示例代码：
```python
num_events = 0
async for event in chain.astream_events(
    'output a list of the countries france, spain and japan and their populations in JSON format. Use a dict with an outer key of "countries" which contains a list of countries. Each country should have the key `name` and `population`',
    version="v1",
):
    kind = event["event"]
    if kind == "on_chat_model_stream":
        print(
            f"Chat model chunk: {repr(event['data']['chunk'].content)}",
            flush=True,
        )
    if kind == "on_parser_stream":
        print(f"Parser chunk: {event['data']['chunk']}", flush=True)
    num_events += 1
    if num_events > 30:
        # 截断输出
        print("...")
        break
```

### 验证回调
需要注意的是，如果在工具中使用可运行的Runnable，必须确保将回调传递给Runnable，否则将不会生成任何流事件。

当使用RunnableLambda或@chain装饰器时，回调会自动在幕后传播。

以下是一个示例代码，展示了不传递回调的情况：
```python
from langchain_core.runnables import RunnableLambda
from langchain_core.tools import tool
def reverse_word(word: str):
    return word[::-1]
reverse_word = RunnableLambda(reverse_word)
@tool
def bad_tool(word: str):
    """一个不传递回调的自定义工具。"""
    return reverse_word.invoke(word)
async for event in bad_tool.astream_events("hello", version="v1"):
    print(event)
```

以下是正确传递回调的重新实现：
```python
@tool
def correct_tool(word: str, callbacks):
    """一个正确传递回调的工具。"""
    return reverse_word.invoke(word, {"callbacks": callbacks})
async for event in correct_tool.astream_events("hello", version="v1"):
    print(event)
```

如果在Runnable Lambda或@chain中调用Runnable，回调会自动为您传递。

以下是示例代码：
```python
from langchain_core.runnables import RunnableLambda
async def reverse_and_double(word: str):
    return await reverse_word.ainvoke(word) * 2
reverse_and_double = RunnableLambda(reverse_and_double)
await reverse_and_double.ainvoke("1234")
async for event in reverse_and_double.astream_events("1234", version="v1"):
    print(event)
```

### 使用@chain装饰器
以下是使用@chain装饰器的示例代码：
```python
from langchain_core.runnables import chain
@chain
async def reverse_and_double(word: str):
    return await reverse_word.ainvoke(word) * 2
await reverse_and_double.ainvoke("1234")
async for event in reverse_and_double.astream_events("1234", version="v1"):
    print(event)
```