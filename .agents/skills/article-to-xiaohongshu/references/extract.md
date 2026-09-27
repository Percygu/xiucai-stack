# 文章抽取（golangstar.cn）

目标：把一篇文章页解析成 `data/content.html`（内页正文）和 `data/meta.json`（标题/作者/标签/导航/完整题库目录）。

站点是 VitePress（vuepress-theme-hope）静态站，公开、无需登录，结构稳定。用 chrome-devtools MCP 打开文章 URL 后，跑下面这段 `evaluate_script`，它一次性返回 `content`（清洗后的正文 HTML）和 `meta`（JSON）。把 `content` 写入 `data/content.html`，`meta` 写入 `data/meta.json`。

```js
() => {
  // ---------- 正文（清洗：去锚点/SVG/学习交流引流块/页脚/评论） ----------
  const src = document.querySelector('.theme-hope-content');
  const clone = src.cloneNode(true);
  clone.querySelectorAll('.header-anchor').forEach(a => { const s = a.querySelector('span'); a.replaceWith(s ? s.textContent : ''); });
  clone.querySelectorAll('figcaption').forEach(f => f.remove());
  clone.querySelectorAll('img').forEach(i => { i.setAttribute('src', i.src); i.removeAttribute('loading'); i.removeAttribute('tabindex'); });
  clone.querySelectorAll('[style]').forEach(e => { if (/user-select/.test(e.getAttribute('style'))) e.removeAttribute('style'); });
  let parts = [];
  for (const el of Array.from(clone.children)) {
    if (el.querySelector && el.querySelector('#学习交流')) break;            // 砍掉末尾"学习交流/公众号"外链块
    if (el.id === 'comment' || el.classList?.contains('vp-page-nav') || el.classList?.contains('vp-page-meta')) continue;
    parts.push(el.outerHTML);
  }
  const content = parts.join('\n');

  // ---------- 顶部导航（带图标；去掉品牌重复、求职训练营、关于作者） ----------
  const navRaw = Array.from(document.querySelectorAll('.vp-navbar a, .navbar a, .VPNavBar a, header nav a'))
    .map(a => a.textContent.trim()).filter(Boolean);
  const brandName = navRaw[0] || '秀才的进阶之路';
  const drop = new Set([brandName, '求职训练营', '关于作者']);
  const activePattern = location.pathname.startsWith('/backend_series/') ? /后端\/AI面试题/ :
    location.pathname.startsWith('/go_agent_series/') ? /Go Agent实战指南/ :
    location.pathname.startsWith('/vibe_coding_series/') ? /Vibe Coding实战指南/ :
    location.pathname.startsWith('/projects/') ? /Agent项目/ : /Go语言进阶之路/;
  const nav = navRaw.filter(t => !drop.has(t) && !/求职训练营|关于作者/.test(t))
    .filter((t, i, a) => a.indexOf(t) === i)
    .map(label => ({ label, on: activePattern.test(label) }));

  // ---------- 左侧完整题库目录（分类组 + 当前展开组的全部题 + 高亮当前篇） ----------
  const sb = document.querySelector('.vp-sidebar, .VPSidebar') || document.querySelector('aside');
  const groups = Array.from(sb.querySelectorAll('.vp-sidebar-heading, p.vp-sidebar-heading'))
    .map(e => e.textContent.trim()).filter(Boolean);
  const links = Array.from(sb.querySelectorAll('a.vp-sidebar-link, a.route-link'))
    .map(a => ({ t: a.textContent.trim(), on: /route-link-active|active/.test(a.className) })).filter(x => x.t);
  // 当前展开组 = 含编号题目的连续链接；其它分类（无编号）作为折叠组标题
  const items = links.map(x => x.t);
  const cur = links.findIndex(x => x.on);
  // catsBefore = 当前组之前的分类标题；currentGroup 取展开组标题（通常是“大模型面试题”）
  const catTitles = links.filter(x => !/^\d+\./.test(x.t)).map(x => x.t);  // 非编号项=分类标题
  const numbered = links.filter(x => /^\d+\./.test(x.t));
  const curIdx = numbered.findIndex(x => x.on);

  // 元信息
  const meta = {
    sourceUrl: location.href,
    title: (document.querySelector('h1')?.textContent || '').replace('​','').trim(),
    author: document.querySelector('.page-author-item')?.textContent.trim() || '秀才',
    date: (document.querySelector('.page-date-info span')?.textContent || '').trim(),
    readMin: (document.querySelector('.page-reading-time-info span')?.textContent.match(/\d+/)||[''])[0],
    tags: Array.from(document.querySelectorAll('.page-tag-item')).map(e => e.textContent.trim()).slice(0, 6),
    brand: { logo: location.origin + '/web_logo2.png', name: brandName },
    nav,
    catsBefore: catTitles.slice(0, catTitles.indexOf(catTitles.find(t=>/大模型/.test(t))) > -1 ? catTitles.findIndex(t=>/大模型/.test(t)) : catTitles.length),
    currentGroup: catTitles.find(t => /大模型/.test(t)) || '大模型面试题',
    items: numbered.map(x => x.t),
    cur: curIdx,
    catsAfter: [],
  };
  return JSON.stringify({ content, meta });
}
```

注意：
- 不同分类页结构基本一致；若某页 `catsBefore/catsAfter` 拆分不准，手工微调 `meta.json` 即可（分类标题就是侧边栏里不带数字编号的那几项）。
- `currentGroup` 默认取含“大模型”的分类；换其它分类时改成对应标题。
- 正文里 `<strong>`（加粗）会渲染成荧光下划线高亮，`<code>` 渲染成橙色药丸——这正是文档卡的高亮效果，保留即可。
- 图片用的是站点绝对地址（golangstar.cn/assets/...），渲染时联网加载，无需下载。

## 抽取失败时的仓库兜底

浏览器脚本可能因为响应式导航、页面缓存或主题 DOM 改动而拿到缺失/过时的栏目名。遇到以下任一情况，不得凭印象补写：

- `nav` 少于 5 项或出现 `Go进阶`、`AI进阶`、`面试题`、`项目实战` 这类简写。
- emoji 丢失。
- 当前栏目没有唯一高亮。
- 左侧目录只拿到少量可视项，没有完整题组。

此时直接读取项目真源：

- 顶部导航：`src/.vuepress/navbar.ts`
- 左侧目录与题组：`src/.vuepress/sidebar.ts`

当前五个栏目必须逐字、按顺序写入 `meta.nav`：

```json
[
  {"label":"Go语言进阶之路","on":false},
  {"label":"🔥后端/AI面试题","on":true},
  {"label":"🤖Go Agent实战指南","on":false},
  {"label":"🔥Vibe Coding实战指南","on":false},
  {"label":"🔥Agent项目","on":false}
]
```

实际制作时仍要读取 `navbar.ts`，并由 `scripts/validate-job.mjs` 校验，避免项目导航以后更新而 skill 没同步。上面的 `on` 示例只适用于大模型面试题；其它系列必须按文章路径高亮对应栏目。
