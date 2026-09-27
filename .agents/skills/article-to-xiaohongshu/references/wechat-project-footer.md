# 小绿书：学习网站与项目文章结尾

只适用于公众号小绿书正文，不修改小红书、抖音或通用卡片的外链规则，也不改变 skill 默认只交付素材的权限边界。

在本篇正文的自然收尾后，先放学习网站，再放 Agent 项目。按以下五行排列，单换行、不插空白段落；不把网站入口放进技术正文开头：

```text
学习网站：
秀才的进阶之路
Agent项目：
AI模拟面试官
DevSupport智能客服系统
```

三个名称都是可点击的公众号文章链接，不是普通文字、裸 URL 或 `#话题`。学习网站通过用户指定的介绍文章作为入口；名称和顺序固定，项目一名中的“模拟”不能删除。目标：

- [秀才的进阶之路](https://mp.weixin.qq.com/s/FV93xYRR9R2BCWwKHC1A8A)
- [AI模拟面试官](https://mp.weixin.qq.com/s?__biz=Mzk0MTYxNDgyNA==&mid=2247494548&idx=1&sn=86554b8c20d457c28811ca153f76e049&scene=142#wechat_redirect)
- [DevSupport智能客服系统](https://mp.weixin.qq.com/s?__biz=Mzk0MTYxNDgyNA==&mid=2247494916&idx=2&sn=bdcd1be97223e7017e312f61fbc8bd51&scene=142#wechat_redirect)

学习入口使用用户于 2026-09-27 最后指定的 `FV93xYRR9R2BCWwKHC1A8A` 文章，取代此前的官网直链及旧介绍文章。不要退回 `https://golangstar.cn/` 裸地址或旧文章 `dRcsdEvVdFTKSuNDYrvCzg`。两个项目链接固定 `__biz`、`mid`、`idx`、`sn`，不要混淆 DevSupport 的 `idx=2`，不要固化临时 `poc_token`。这不放宽小红书、抖音或通用图片的外链规则。

## 产物与验证

可复用的原生 HTML 片段在 `assets/wechat-project-footer.html`：三条链接均使用 `normal_text_link mp_article_text_link` 和 `data-itemshowtype="0"`。`copy.md` 小绿书段可以用 Markdown 展示链接，但另交付 `wechat-content.html`，链接必须具有真实 `href`，不能只粘贴 Markdown 或裸 URL。本地 HTML 合格不等于平台已保存；授权更新草稿后仍须回读验证，不得把失败的超链接降级成纯文字后宣称完成。

```bash
python3 <skill>/scripts/build-wechat-content.py <job>/copy.md --output <job>/wechat-content.html
```

脚本只读文案、生成并校验内容，不访问网络，不上传或发布。它不会读取 `小红书/抖音候选标签` 附到小绿书；兼容原来只放项目、或学习网站只有空标题的尾巴，重复运行不会重复追加。HTML 属性引号、URL 的 `#wechat_redirect` 不算正文乱用引号或话题。

结尾检查：三条真实 `<a href>`，学习网站在两个项目之前；名称、顺序和文章标识匹配，学习网站与 Agent 项目标题均只出现一次，正文无 `#话题` 行。生成的提交稿沿用 2048 UTF-8 字节的本地预算；这不是已经证实的微信硬限制，不能据此拒绝平台正常扩展链接后的回读内容。缺链、错链、错序或重复尾巴均不合格；超出本地预算时精简正文，不删除链接。

## 用户明确要求更新已有草稿时

只更新用户指定的已有草稿，不新建、不公开发布。先读取当前内容并保存快照，基于当前稿局部替换指定内容，提交前再次检查没有并发手动修改。失败或结果不明确时先回读，不能重复提交碰运气。

本入口的短链接在 `draft/update` 成功后，会被 `draft/get` 展开为文章标识 `__biz=Mzk0MTYxNDgyNA==`、`mid=2247494997`、`idx=1`、`sn=291a6d209a8fa9e107ba7ff1840ed2b5`。这是已由同一次请求和回读核对的映射；只接受这个等价地址，不接受任意公众号链接。`scene` 和 `#wechat_redirect` 不改变文章身份。

```bash
python3 <skill>/scripts/validate-wechat-readback.py <request.json> <draft.after.json> --before <draft.before.json> --report <verification.json>
```

该脚本只读本地接口证据，检查正文、三条原生链接、展开后的文章身份、图片及提交字段，另核对未修改的作者和原文地址。接口成功码不替代回读校验。能打开后台时，再从草稿箱重新进入并检查实际链接；旧编辑标签页、未登录或空白预览不能作为视觉验收证据，无法查看时明确区分“接口回读通过”与“界面已核验”。
