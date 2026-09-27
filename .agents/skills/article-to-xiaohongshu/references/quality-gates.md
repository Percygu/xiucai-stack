# 质量门禁

先按 `source-narrative.md` 完成原文快照、逐页来源和叙事计划，再做视觉策划。内容溯源与逻辑连读是前置门槛；只有漂亮排版而没有原文依据，同样不合格。

## 1. 视觉策划表

写讲解卡 HTML 之前，先生成 `data/visual-plan.json`：

```json
{
  "cards": [
    {
      "slug": "positioning",
      "coreQuestion": "三个框架各自解决什么主问题",
      "visualType": "positioning-duel",
      "richVisual": true,
      "mainVisual": "三方定位图，用控制平面/数据平面两条轴表示差异",
      "explanations": ["核心抽象", "适用场景", "选择代价"],
      "interviewLine": "先按主要复杂度选主框架，再说明组合方式"
    }
  ]
}
```

字段要求：

- `slug`：对应输出文件语义名，不能是 `card-1` 这类无意义编号。
- `coreQuestion`：这一页唯一要讲透的问题。
- `visualType`：具体的视觉骨架，如 `layer-stack`、`state-flow`、`retrieval-pipeline`、`comparison-matrix`、`decision-tree`、`system-map`、`code-anatomy`。不能用笼统的 `grid`、`list`、`cards` 冒充不同版式。
- `richVisual`：主信息是否由关系、路径、层级、状态、选择或对照来表达。纯文字框、纯列表、纯答案段落必须填 `false`。
- `mainVisual`：一句话说明图怎么承载信息；不能只写“放几个卡片”。
- `explanations`：讲清本页所需的原文解释点，不固定三条，不为凑数添内容。
- `interviewLine`：沿用字段名，存放本页有原文依据的结论，不强制改成面试口吻或避坑句。

整套硬门槛：

- 讲解卡数量由原文与可读性决定，通常 8–15 张；短文可更少，不以页数为由补写内容。
- 至少 5 个不同 `visualType`；同一类型不超过总数的 35%；相邻两张不能相同。
- `richVisual: true` 的页面不少于 60%。文字网格、列表、答案段落合计不得成为主体。
- 换色、换描边、改变圆角、三个框变四个框、左右镜像，不属于新视觉类型。

## 2. 官网导航一致性

原文引流卡必须使用当前项目 `src/.vuepress/navbar.ts` 的原文，不得缩写、改写或凭印象重命名。当前保留的五个栏目依次为：

1. `Go语言进阶之路`
2. `🔥后端/AI面试题`
3. `🤖Go Agent实战指南`
4. `🔥Vibe Coding实战指南`
5. `🔥Agent项目`

只允许去掉 `关于作者` 和其它非栏目入口。当前文章所属栏目必须且只能有一个 `on: true`；大模型面试题应高亮 `🔥后端/AI面试题`，其它系列按文章路径高亮对应栏目。如果线上 DOM 抽取结果和仓库配置冲突，先判断线上是否为旧缓存；制作当前项目素材时，以仓库配置为准，并在浏览器里核对页面实际显示。

## 3. 自动检查

在渲染完成后运行：

```bash
node <skill>/scripts/validate-job.mjs <job-dir>
```

脚本检查：

- `source.json` 的原文段落、叙事计划引文真实存在、原文章节次序、页面衔接字段及三份页面计划顺序一致。
- `data/meta.json` 的五个导航标签、顺序和唯一高亮项。
- `data/visual-plan.json` 的字段完整度、视觉类型数量、重复比例与 `richVisual` 占比。
- `data/cards.json` 中面向读者的文字，以及必须提供的 `qa/render-audit.json` 中实际可见文字，不得出现“本页结论/上一页/下一页”等页面自述。原文快照、引文和内部策划不受此词项扫描；机器扫描不代替语义审读。
- `copy.md` 必须存在，按其中实际提供的平台校验正文：介绍性话术、标题长度、引号、换行和平台格式。大量列点产生审读提示，不能用任意比例直接断定内容不合格，是否必要由逐段审读判断。
- 提供小绿书正文时必须校验最终 `wechat-content.html`：正文与文案一致，学习网站和两个项目的三条链接正确且按顺序放在正文末尾，无重复、无话题且不超字节限制；不允许只验证生成前的 Markdown。
- 成图审计覆盖全部 PNG，有实际可见文字、字号与边界记录，错误列表为空；图片哈希和输入指纹匹配。改了模板、文案数据或图片后，旧成图审计失效。
- `output/` 是否从 `00` 连续编号，是否包含 `01-origin-doc.png`。
- 所有 PNG 是否为 1080×1440。

总校验有三个状态：`FAIL`（退出码 1，不合格）、`REVIEW_REQUIRED`（退出码 2，待审读）、`PASS`（退出码 0，可交付）。任何非 PASS 都停止交付。每次写入 `qa/validation-report.json`，列出具体失败项、待审读项和提示，不沿用上次结果。

自动检查通过不代表引用能支持对应结论，更不代表故事连贯；还要按下面的审读机制逐页对照。PASS 的准确含义是“自动检查通过、当前版本的审读记录完整且通过”，不是机器证明内容正确。

## 4. 肉眼验收

自动检查通过后，还要逐张完成两轮肉眼检查：

1. 查看 1080×1440 原图，检查主图关系是否清楚、中文是否完整、有没有内容被遮挡。
   逐项核对图上的标题、图解、解释、结尾与模板标签：只讲内容，不出现页面导读；结论不带“本页结论”标签，衔接不提“上一页/下一页”。
2. 等比缩到约 360×480，检查正文无需放大即可辨认。

最后把整套缩略图放在一起看：如果第一眼仍像同一个「标题 + 圆角文字框 + 总结条」模板反复复制，即使自动检查通过，也必须退回重做。

图片与正文分别验收，不能以其中一项合格代替另一项：图片逐页核对原文依据、论证衔接及实际可见文字；正文逐段核对技术内容、条件与自然承接，删除“这篇文章介绍了/图里讲了什么/最后附参考答案”等导读，不把文字压缩成目录或名词清单。小绿书还要核对最终 `wechat-content.html` 的可见正文，而不只查看 `copy.md`。词项扫描只拦截已知表述，人工仍须判断语义上的介绍性话术。

### 审读证据与版本绑定

执行者实际审读后，将具体来源核对、页面衔接、图片原尺寸/手机尺寸检查写入 `qa/narrative-review.md`，再记录 `qa/content-review.json`：

```json
{
  "version": 1,
  "reviewer": "实际执行审读的人或 agent，不冒充用户批准",
  "reviewedAt": "ISO 8601 时间",
  "artifactHash": "当前产物指纹",
  "pages": [{
    "slug": "与 cards.json 一致",
    "checks": {"source":"pass", "coherence":"pass", "clarity":"pass", "directContent":"pass", "readability":"pass"},
    "evidence": "具体到本页的原文依据、承接关系和视觉检查结果"
  }],
  "copy": [{
    "platform": "实际提供的平台，如小绿书",
    "checks": {"source":"pass", "directContent":"pass", "coherence":"pass", "listing":"pass"},
    "evidence": "正文对应哪些原文内容，是否直接讲知识，列点是否确有必要"
  }],
  "overall": {
    "checks": {"originalOrder":"pass", "goalClosure":"pass", "fullSize":"pass", "mobileSize":"pass"},
    "evidence": "整组顺序、首尾目标与全尺寸/手机尺寸的实际审读结果"
  }
}
```

`pages` 必须按顺序覆盖所有讲解卡，`copy` 覆盖所有交付平台。未完成的项写 `pending`，不合格写 `fail`，只有真正检查通过的项写 `pass`；示例不是可直接盖章的合格模板。禁止根据页数批量补 pass，或把关键词扫描说成语义验收。

记录审读说明后运行 `node <skill>/scripts/quality-evidence.mjs <job>` 取得指纹；该命令只计算指纹，不批准任何检查。正文、原文映射、图片、渲染输入或审读说明一旦变更，旧 `artifactHash` 就会失效，必须复核变更及其影响后再记录。缺少审读、漏页、失败项、版本不符均不能交付。

### 渲染证据

`qa/render-audit.json` 为逐图数组，每项含 `name`、`inputHash`、`imageHash`、`visibleText`、`errors[]` 和 `texts[{text,font,role,x,y,w,h}]`；文字角色为 `heading` / `core` / `aux`。字体角色按实际用途判断，不得把正文标为辅助字绕过字号要求。默认渲染器调用 `capture-card.mjs` 从实际 DOM 采集并在同一状态截图；自定义渲染器遵守相同结构，不能手写干净审计或只给已有图片补哈希。

修正闭环：自动检查 → 实际逐页/正文审读 → 记录当前版本 → 总校验；失败则修改相关内容、必要时重渲染、复核受影响项，再跑总校验。校验不会上传、建草稿或发布。

### 回归测试

修改校验脚本后运行 `test-quality-gate.mjs`、`test-visible-copy.mjs`、`test-narrative.mjs` 和 `test_wechat_content.py`。涉及浏览器采集时还运行 `test-capture.mjs`（与渲染器一样通过 `PLAYWRIGHT_MODULE` 指定依赖）。测试使用隔离夹具验证违规内容、漏页、小字/溢出、过期证据、正文及项目链接能否阻止交付；测试通过不能代替实际文章验收。

## 5. 小绿书结尾检查

生成小绿书文案时，还要运行 `scripts/build-wechat-content.py <job>/copy.md --output <job>/wechat-content.html`。检查末尾学习网站和两个 Agent 项目的三条超链接、名称、顺序、唯一性与原生公众号文章标识，无话题结尾。学习入口使用最新指定文章 `FV93xYRR9R2BCWwKHC1A8A`，不回退到官网裸地址或旧文章。本地提交稿沿用 2048 UTF-8 字节预算；平台展开短链接后可能更长，回读不能据此误判失败。规则、等价文章标识和链接唯一来源见 `wechat-project-footer.md`。

如果用户另行明确授权修改已有草稿，先读当前草稿，保留手动改动，只局部替换目标内容。运行 `validate-wechat-readback.py`，确认三条原生链接、正文与图片字段；学习短链接只接受已核对的对应文章展开地址。不能只看接口成功码、标题和图片数量。实际界面检查单独记录，未登录或空白页不算通过；不重复建稿，不公开发布。这条检查不自动授予平台操作权限。
