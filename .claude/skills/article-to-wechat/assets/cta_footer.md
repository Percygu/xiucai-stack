<!-- 引流尾巴模板（每篇文章末尾自动拼接，与正文套用同一套 doocs/md 排版）。
     按系列分段，用 <!-- series: KEY --> 标记一段的开始，直到下一个标记或文件结尾。
     发布时 publish.py 按系列 KEY 选对应段落（KEY 可由文章路径自动推断，也可 --series 指定）。
     占位符 {} 或 {index} → 发布时填入 --series-index 的"第 N 篇"。
     标题层级与正文一致：用 ## 做小标题（doocs default 渲染成蓝色胶囊、加粗），与文章正文章节同款，
     别用 # —— # 是 doocs 的一级标题（居中+底线），会和正文章节风格不一致。 -->

<!-- series: vibe-coding -->
## 学习交流
> 这是Vibe Coding系列的第{}篇文章。秀才后面会在公众号持续分享**Vibe Coding干货**，包括Claude Code、Cursor、Codex的深度使用教程。欢迎点赞，关注加转发，分享给更多的人看到。同时，秀才的学习网站：https://golangstar.cn/，持续更新Vibe Coding实战指南、后端进阶之路、AI Agent进阶教程、面试真题等优质内容，欢迎大家上我的网站学习，网站学习更高效哦！

**AI Agent项目**   
>[AI模拟面试官](https://mp.weixin.qq.com/s/PL2LaBiIWa1pUKbzLoiGNA)  
[API开放平台智能客服系统](https://mp.weixin.qq.com/s/sIK4Wzo-Vx9wx-7izgSRdg)

**Vibe Coding系列**  
> [越来越火的 Vibe Coding 究竟是什么？](https://mp.weixin.qq.com/s/ytyFvQq0V7xBfZd58Spgnw)  
[Claude Code 快速上手核心指南！看这篇就够了](https://mp.weixin.qq.com/s/FqlaUk7ib8HFP9KYIyTNiw) 
[Claude Code的CLAUDE.md 配置应该怎么写？](https://mp.weixin.qq.com/s/qQfr7m1bp7E-jx4g8FsVIw)   
[Claude Code的斜杠命令有哪些实用技巧](https://mp.weixin.qq.com/s/A3Gui9nLoerHtEnrc3_XYw)   
[Claude Code怎样接MCP Server](https://mp.weixin.qq.com/s/rrosNUOJx5QjKSoL_-g7eA) 

**后端面试题系列** 
> [【2025最新版】Go面试真题大合集（含答案）](https://mp.weixin.qq.com/s/jRhy_WL7buzxfKQmsj4YAw)       
[【2025最新】Mysql面试真题（图文并茂版）](https://mp.weixin.qq.com/s/GdkLM8Cz_NUnPZic_uesAg)       
[【2026最新】Redis面试真题（图文并茂版）](https://mp.weixin.qq.com/s/5rZwVp4t7sbrpy6HHIePvw)      
[【2026最新】消息队列面试真题（图文并茂版）](https://mp.weixin.qq.com/s/4GF982nZoAHcBOessAm6XQ)    

**大模型面试题系列** 

>[字节大模型一面：在构建一个复杂的 Agent 时，你认为最主要的挑战是什么？](https://mp.weixin.qq.com/s/w5X9b1wijBe5if3m0SeqtQ)  
[京东大模型二面：你知道哪些方法可以提高RAG的检索正确率？](https://mp.weixin.qq.com/s/137GPnPRdr0yQ-GPH1ngKA)    
[美团大模型二面：Memory是Agent的一个关键模块，请问如何为Agent设计短期记忆和长期记忆系统？可以借助哪些外部工具或技术？](https://mp.weixin.qq.com/s/8QzPoQ-CHtZQXR9fQMYN0Q)   
[快手大模型二面：假如说要设计一个多轮对话Agent，你会怎么设计？](https://mp.weixin.qq.com/s/b5KFkvOkxDiCEiGIirdRUA)  
[京东大模型二面：请详细解释 ReAct 框架，它是如何将思维链和行动结合起来，以完成复杂任务的？](https://mp.weixin.qq.com/s/tqg7qgaB9kOF2Ur_zqD0hg)  
[小米大模型二面：RAG 检索不到问题时如何定位问题？排查思路是什么？](https://mp.weixin.qq.com/s/-Vz4x-Okq5zAyO7sgD6W7Q)      
[京东大模型二面：RAG系统中如何进行query改写，以及如何基于检索结果构建有效prompt？](https://mp.weixin.qq.com/s/2TLlGVyJ6WvtXWNElHkJAg)  

**LangChain实战系列**
>[大模型初体验：DeepSeek本地部署](https://mp.weixin.qq.com/s/NkbTbuscswtEhKFHTH8aTw)  
[LangChain+DeepSeek小白入门大模型应用开发(1)](https://mp.weixin.qq.com/s/N3d8qb30jkUz2pTo8BGXkg)  
[大模型应用开发入门系列(1)：Hello LangChain](https://mp.weixin.qq.com/s/VvsuOIuBYbu3WtdtXzf4Lg)   
[LangChain框架入门系列(2)：Model I/O](https://mp.weixin.qq.com/s/QoqLmuhqA0l8agiPrxf67g)   
[LangChain框架入门系列(3):数据连接](https://mp.weixin.qq.com/s/ySAC7EzuJ53lmlfU7Ti-FQ)   
[LangChain框架入门系列(4)：链](https://mp.weixin.qq.com/s/zFONnsmVQs7ZLtT-VMwhnw)   
[LangChain框架入门系列(5)：Memory](https://mp.weixin.qq.com/s/DPokjOYGNr24MtUuJunqcA)  
[LangChain框架入门系列(6)：RAG](https://mp.weixin.qq.com/s/JB1gFhDzqP4IhhgsRdV5EA)  
[LangChain框架入门系列(7)：Agent](https://mp.weixin.qq.com/s/4As-oqHiyeWZCTNkGYp79A)  
[LangChain框架入门系列(8)：Callbacks](https://mp.weixin.qq.com/s/2yXD72KkjPI8rcAM-fdsrw)


<!-- series: llm-interview -->
## 学习交流
> 如果您觉得文章有帮助，点个关注哦。秀才后面会在公众号分享**大模型应用开发面试真题**。同时，秀才也会将这些大模型面试题整理到了我的学习网站：[**https://golangstar.cn**](https://golangstar.cn)，欢迎大家上我的网站学习，网站学习更高效哦！

> **往期推荐**    
[字节大模型一面：在构建一个复杂的 Agent 时，你认为最主要的挑战是什么？](https://mp.weixin.qq.com/s/w5X9b1wijBe5if3m0SeqtQ)  
[京东大模型二面：你知道哪些方法可以提高RAG的检索正确率？](https://mp.weixin.qq.com/s/137GPnPRdr0yQ-GPH1ngKA)    
[美团大模型二面：Memory是Agent的一个关键模块，请问如何为Agent设计短期记忆和长期记忆系统？可以借助哪些外部工具或技术？](https://mp.weixin.qq.com/s/8QzPoQ-CHtZQXR9fQMYN0Q)   
[快手大模型二面：假如说要设计一个多轮对话Agent，你会怎么设计？](https://mp.weixin.qq.com/s/b5KFkvOkxDiCEiGIirdRUA)  
[京东大模型二面：请详细解释 ReAct 框架，它是如何将思维链和行动结合起来，以完成复杂任务的？](https://mp.weixin.qq.com/s/tqg7qgaB9kOF2Ur_zqD0hg)  
[小米大模型二面：RAG 检索不到问题时如何定位问题？排查思路是什么？](https://mp.weixin.qq.com/s/-Vz4x-Okq5zAyO7sgD6W7Q)      
[京东大模型二面：RAG系统中如何进行query改写，以及如何基于检索结果构建有效prompt？](https://mp.weixin.qq.com/s/2TLlGVyJ6WvtXWNElHkJAg)  

>[大模型初体验：DeepSeek本地部署](https://mp.weixin.qq.com/s/NkbTbuscswtEhKFHTH8aTw)  
[LangChain+DeepSeek小白入门大模型应用开发(1)](https://mp.weixin.qq.com/s/N3d8qb30jkUz2pTo8BGXkg)  
[大模型应用开发入门系列(1)：Hello LangChain](https://mp.weixin.qq.com/s/VvsuOIuBYbu3WtdtXzf4Lg)   
[LangChain框架入门系列(2)：Model I/O](https://mp.weixin.qq.com/s/QoqLmuhqA0l8agiPrxf67g)   
[LangChain框架入门系列(3):数据连接](https://mp.weixin.qq.com/s/ySAC7EzuJ53lmlfU7Ti-FQ)   
[LangChain框架入门系列(4)：链](https://mp.weixin.qq.com/s/zFONnsmVQs7ZLtT-VMwhnw)   
[LangChain框架入门系列(5)：Memory](https://mp.weixin.qq.com/s/DPokjOYGNr24MtUuJunqcA)  
[LangChain框架入门系列(6)：RAG](https://mp.weixin.qq.com/s/JB1gFhDzqP4IhhgsRdV5EA)  
[LangChain框架入门系列(7)：Agent](https://mp.weixin.qq.com/s/4As-oqHiyeWZCTNkGYp79A)  
[LangChain框架入门系列(8)：Callbacks](https://mp.weixin.qq.com/s/2yXD72KkjPI8rcAM-fdsrw)

