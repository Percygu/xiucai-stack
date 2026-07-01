# 排版规则与 doocs/md 渲染原理

本 skill 的公众号排版**直接复用开源 doocs/md（md.openwrite.cn）官方渲染内核**，不再手写复刻样式。
渲染器以 vendored 形式放在 `vendor/md-render/`，Python 通过 `wechat_render.py` 用子进程调用它。

## 为什么这么做

公众号草稿 API 的 `content` 只认**写死在标签上的行内 `style`**——会剥掉 `<style>` 和 class，也不支持
CSS 变量。doocs/md 的"好看"= `marked` 解析 + `highlight.js` 高亮 + 一套主题 CSS + `juice` 内联。
这里在本地 headless 跑通同一条链路，产物即公众号可直接用的内联样式 HTML，保真度与官方一致、可随官方升级。

## 渲染管线（vendor/md-render）

```
markdown
  └─(render.mjs: DOM polyfill)→ core.bundle.mjs
        renderCore = doocs initRenderer + renderMarkdown + postProcessHtml
                     + 主题 CSS(variables/base/default/headingStyles/hljs) + processCSS
        → "<style>…</style> + class化HTML"
  └─(render.mjs)→ juice 内联 + flatten 残留 CSS 变量（镜像 doocs web 端 clipboard.ts）
        hsl(var(--foreground))→#3f3f3f；var(--blockquote-background)→#f7f7f7；
        var(--md-primary-color)→主色；top:_em→translateY（公众号 quirk）
        ※ 与官方一致：不 flatten color-mix（新版公众号编辑器可识别）
  └─(wechat_render.py)→ 图片相对路径→绝对路径并收集；剥非 mp.weixin 链接
```

正文预处理（publish.py 拼装前，`wechat_render.strip_web_promo_card`）：剥掉网站文章末尾自带的
**绿色引流卡片** `<div style="background-color: #f0f9eb …border-left:5px solid #67c23a…">…</div>`
（「关注秀才公众号·领取面试题库 PDF·DevSupport AI」）。它是网页页面专用 promo，全站文章签名一致、每篇一处，
用 `<div>`/`</div>` 配平定位整段删除（含其中嵌套 div 与 avatar 图）。公众号自有引流尾巴见 cta_footer.md。

关键约束：**绝不用 BeautifulSoup 整体 round-trip 渲染产物**——doocs 产物含大小写敏感的内联 SVG
（Mac 代码块三色点的 `viewBox`）与 `<br>`/`&nbsp;`，经 HTML 解析器会被破坏（`viewBox`→`viewbox`、
`&nbsp;`→U+00A0）。故 `wechat_render.py` 只用 regex 外科式处理 `<img src>` 与 `<a href>`。

## default 主题观感（用户选定）

| 元素 | 样式 |
|---|---|
| 一级标题 `#` | 居中、加粗、底部蓝色横线（`border-bottom:2px solid 主色`） |
| 二级标题 `##` | **蓝色实心胶囊**（`background:主色;color:#fff`）、居中——文章章节多落在这一档 |
| 三级标题 `###` | 左侧蓝色竖条（`border-left:3px solid 主色`）+ 加粗 |
| 正文 | 16px、两端对齐、`#3f3f3f`、行距 1.75 |
| 行内代码 | 蓝色字 + 浅蓝底（`color-mix` 半透明）、圆角 |
| 代码块 | Mac 风深色卡片（atom-one-dark `#282c34` + 红黄绿三色点 SVG），highlight.js 着色 |
| 引用 | 浅灰底 `#f7f7f7` + 左侧主色竖条 |
| 图片 | 居中、圆角，下方图注由 doocs `legend:'alt'` 自动取 alt 生成 |

主色默认 `#0F4C81`（doocs 经典蓝）。渲染参数见 `wechat_render.py: DEFAULT_OPTS`，
代码主题可切 `github-dark`（更接近纯黑）。**不做标题层级上移**：保持文章原始 `#` 层级。

## 公众号接口约束（来自 wechat_api.py / publisher.py）

- 建草稿强制要 `thumb_media_id`（封面）：默认取正文第一张图作封面；无图则上传占位白图。
- 正文图用 `media/uploadimg` 返回 url；封面用 `material/add_material` 返回 media_id。
- 正文不接受站内/外链（会触发 45166 invalid content），故 `wechat_render.py` 把非 mp.weixin 链接拆成纯文本。
- 建草稿 body 必须 `ensure_ascii=False`；access_token 带缓存（按 appid，提前 5 分钟过期）。

## 重建渲染器

升级 doocs/md 版本、或增删 hljs 代码主题时，跑 `vendor/md-render/build.sh`（需 node/pnpm/git）。
平时无需运行——产物已 vendored。
