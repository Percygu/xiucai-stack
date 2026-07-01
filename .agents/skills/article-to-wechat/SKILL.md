---
name: article-to-wechat
description: |
  把本网站项目（golangstar.cn / 秀才的进阶之路）里现成的 markdown 文章发布到微信公众号草稿箱。
  用开源 doocs/md(md.openwrite.cn)官方渲染内核排版(default 主题：居中标题、蓝色胶囊二级标题、
  Mac 深色代码块、蓝色行内代码)，图片自动上传素材库、末尾自动拼接引流尾巴，最后建草稿停在发布键前。
  触发：把某篇文章发公众号、发到公众号、转公众号、推公众号草稿、把 src/xxx.md 发公众号。
  仅用于发布本项目已有文章，不重写内容、不另造配图。与小绿书/小红书图文(article-to-xiaohongshu)区分开。
---

# 网站文章 → 微信公众号

把项目里一篇现成的 `.md` 文章，原样转成公众号排版并推到草稿箱。**只做结构与排版转换，不改一个字、不换一张图。**

## 何时用

用户说"把 `src/.../xxx.md` 发公众号""这篇转公众号""推公众号草稿"等。给定**一篇**文章，发**一篇**。

## 执行流程

### Step 1: 确认文章与标题

- 文章路径：用户给的 `.md`（本项目 `src/` 下）。
- 公众号标题：公众号标题通常是**另起的吸睛标题**，和 frontmatter 里的 `title` 不同。
  **主动问用户要这次的公众号标题**；用户没给就默认用 frontmatter title（已自动去掉前导序号）。
- 系列：默认按文章路径自动推断（`vibe_coding*`→vibe-coding，`llm_interview`→llm-interview），
  决定用哪套引流尾巴；推断不出或要改用 `--series KEY`。新增系列在 publish.py 的 `SERIES_BY_PATH` 加映射、并在 cta_footer.md 加对应段。
- 系列序号：引流尾巴里的"第 N 篇"由 `--series-index N` 填入。
- 开头头图：自动插 `assets/images/header-banner.png`（每篇同一张）；该图不存在则跳过头部。
- **摘要（必做）**：公众号摘要由你**根据文章内容手写**——一句吸引力强、概括卖点的话，**≤120 字**，
  通过 `--digest "…"` 传入。**不要**让它回退去截取正文开头（那不符合要求，只是没传时的兜底）。

### Step 2: 先 dry-run 看排版

```bash
cd {skill_dir}/toolkit
python3 publish.py <文章.md> --title "公众号标题" --digest "手写摘要≤120字" --series-index N --dry-run
```

生成 `/tmp/wx_preview.html`（手机宽度预览）。**强烈建议用浏览器截图给用户确认排版**，确认后再正式发。

### Step 3: 正式推草稿

去掉 `--dry-run` 重跑（`--digest` 照带）。脚本会：上传正文图片→取首图作封面→建草稿。
完成后告诉用户：草稿已建，去公众号后台「草稿箱」预览，**确认无误后由用户手动群发**（本 skill 不自动群发）。

## 排版规则（doocs/md 官方内核，default 主题；细节见 references/conversion-rules.md）

- 删除头部 frontmatter，从中取标题并去掉前导序号（"4. xxx" → "xxx"）。
- **剥掉网站正文末尾的绿色引流卡片**（`<div ...#f0f9eb...>`「关注公众号·领取面试题库」）——那是网页专用 promo，
  公众号不需要（公众号自有引流尾巴 cta_footer.md）。由 `wechat_render.strip_web_promo_card` 按 div 配平整段删。
- **不做标题层级上移**：保持文章原始层级，由 doocs 主题决定观感——
  `#` → 一级标题（居中加粗 + 蓝色底边线）、`##` → 蓝色胶囊二级、`###` → 蓝竖条三级。
  文章正文章节一般从 `##` 开始 → 蓝胶囊；引流尾巴(cta_footer.md)的小标题也统一用 `##`，与正文同款。
- 标题里的 `**加粗**` 无需处理：doocs 已正确着色（胶囊内继承白字、其余主题蓝）。
- 正文 16px、两端对齐、蓝色行内代码、Mac 风深色代码块（atom-one-dark + 三色点 SVG，公众号可存活）。
- 图片解析为本地绝对路径后上传微信素材库、替换链接，图注由 doocs 的 legend(取 alt)自动生成。
- 开头拼 `assets/header.md`（网站头图 + 引导链接），末尾拼 `assets/cta_footer.md` 对应系列的引流尾巴（`{}`/`{index}` 占位符填"第 N 篇"）。
- 头部引导链接固定样式：**右对齐 + 深蓝 `#003a8c` + 14px**，在 header.md 里用内联 HTML（`<p style="text-align:right…"><a style="color:#003a8c;font-size:14px">`）写死，
  以压过 doocs 默认（16px、经典蓝、左对齐）。改样式直接改 header.md 那行的内联 style。
- 封面（thumb，公众号强制）默认取首图——通常就是开头那张头图；可用 `--cover` 指定。

## 关键文件

- `toolkit/publish.py` — 编排：拼头部→正文→按系列拼尾巴→渲染→传图→建草稿。CLI 入口。
- `toolkit/wechat_render.py` — Python↔Node 桥接：调 doocs/md 渲染器，并做图片路径解析、剥非公众号链接。
- `vendor/md-render/` — vendored doocs/md 渲染器（自包含）：
  - `render.mjs` — Node CLI 入口（DOM polyfill + juice 内联 + flatten CSS 变量，镜像 doocs 官方"复制到公众号"）。
  - `core.bundle.mjs` — esbuild 打包的 doocs @md/core 渲染内核（marked+highlight.js+主题）。
  - `theme-css/` — doocs 主题 CSS + 本地 hljs 代码主题。`node_modules/` — juice + isomorphic-dompurify。
  - `entry.ts` / `build.sh` — 打包入口与重建脚本（升级 doocs 版本时用）。
- `toolkit/wechat_api.py` / `publisher.py` — 微信接口（token/传图/传封面/建草稿），自包含。
- `assets/header.md` / `assets/images/header-banner.png` / `assets/cta_footer.md` — 头部、头图、引流尾巴（用户维护）。
- 凭据：项目内 `config.yaml` 优先，回退全局 `~/.Codex/skills/wewrite/config.yaml` 的 appid/secret。

## 注意

- 只发草稿，绝不自动群发；群发由用户在后台手动点。
- 内容零改动；如需改文案，那是写作的事，不在本 skill。
- 依赖：Python `requests pyyaml`（见 toolkit/requirements.txt）+ **Node.js**（渲染器需要，`node -v` 应可用）。
