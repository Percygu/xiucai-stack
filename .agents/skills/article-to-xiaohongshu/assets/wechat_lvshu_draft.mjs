#!/usr/bin/env node

console.error([
  'wechat_lvshu_draft.mjs 已停用。',
  '当前 article-to-xiaohongshu skill 只生成图片和文案，并提供发布入口链接，',
  '不再调用公众号 API 自动建草稿，也不读取 wx-creds.env。',
  '请在公众号后台手动上传素材并发布。'
].join('\n'));

process.exit(1);
