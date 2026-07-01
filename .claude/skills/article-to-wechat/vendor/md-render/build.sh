#!/usr/bin/env bash
# 重建 vendored doocs/md 渲染产物（core.bundle.mjs + theme-css + node_modules）。
# 平时无需运行；仅在想升级 doocs/md 版本、或换/补 hljs 代码主题时重跑。
#
# 产物构成：
#   core.bundle.mjs   —— esbuild 把 doocs @md/core(marked+highlight.js+扩展) 与本入口
#                        entry.ts 打成单个 ESM。isomorphic-dompurify 因含 jsdom(运行时
#                        读包内数据文件、用 __dirname)无法打包，故设为 external、留 node_modules。
#   theme-css/        —— doocs 主题 CSS(base/default/grace/simple) + 本地化的 hljs 代码主题。
#   node_modules/     —— 仅 juice(CSS 内联) + isomorphic-dompurify(净化/补全表格结构)。
#   render.mjs/entry.ts —— 运行时入口与打包入口（手写，纳入版本管理，勿删）。
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="${1:-/tmp/md-build}"   # doocs/md 克隆目录，可传参复用

echo "==> 1/4 准备 doocs/md 源码（$WORK）"
if [ ! -d "$WORK/packages/core" ]; then
  git clone --depth 1 https://github.com/doocs/md.git "$WORK"
fi
cd "$WORK"
pnpm install --prod=false

echo "==> 2/4 拷主题 CSS + 本地化 hljs 代码主题"
cp packages/shared/src/configs/theme-css/*.css "$HERE/theme-css/"
HLJS="$(find node_modules/.pnpm -type d -path '*highlight.js/styles' | head -1)"
cp "$HLJS/atom-one-dark.min.css" "$HERE/theme-css/hljs-atom-one-dark.css"
cp "$HLJS/github-dark.min.css"   "$HERE/theme-css/hljs-github-dark.css"

echo "==> 3/4 esbuild 打包 entry.ts → core.bundle.mjs"
cp "$HERE/entry.ts" packages/mcp-server/entry.ts
node_modules/.bin/esbuild packages/mcp-server/entry.ts \
  --bundle --platform=node --format=esm \
  --external:isomorphic-dompurify \
  --outfile="$HERE/core.bundle.mjs" --log-level=warning

echo "==> 4/4 安装运行时依赖(juice + isomorphic-dompurify)"
cd "$HERE"
npm install --omit=dev --no-audit --no-fund

echo "✅ 完成。自测：node render.mjs <某篇.md>"
