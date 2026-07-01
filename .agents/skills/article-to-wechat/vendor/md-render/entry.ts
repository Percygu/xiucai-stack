// 自包含渲染入口：复刻 doocs/md 官方 mcp-server 的 buildRenderedOutput + web 端 clipboard.ts
// 的"复制到公众号"收尾（juice 内联 + flatten CSS 变量）。改动仅两处：
//   1) 主题 CSS / hljs 代码主题从本地 theme-css/ 读取（vendored，运行时零网络）；
//   2) 末尾做 juice 内联 + 变量 flatten，产出公众号草稿 API 可直接用的内联样式 HTML。
// esbuild 会把 @md/core(marked/highlight.js/扩展) 与 juice 一并打进单文件。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initRenderer } from '@md/core/renderer'
import { processCSS } from '@md/core/theme/cssProcessor'
import { generateCSSVariables, generateHeadingStyles } from '@md/core/theme/cssVariables'
import { postProcessHtml, renderMarkdown } from '@md/core/utils'

const SANS = `-apple-system-font,BlinkMacSystemFont, Helvetica Neue, PingFang SC, Hiragino Sans GB , Microsoft YaHei UI , Microsoft YaHei ,Arial,sans-serif`

const themeDir = path.join(path.dirname(fileURLToPath(import.meta.url)), `theme-css`)
function loadCSS(f: string): string {
  return fs.readFileSync(path.join(themeDir, f), `utf-8`)
}
const baseCSS = loadCSS(`base.css`)
const themeMap: Record<string, string> = {
  default: loadCSS(`default.css`),
  grace: loadCSS(`grace.css`),
  simple: loadCSS(`simple.css`),
}
const hljsMap: Record<string, string> = {
  'atom-one-dark': loadCSS(`hljs-atom-one-dark.css`),
  'github-dark': loadCSS(`hljs-github-dark.css`),
}

export interface RenderOpts {
  theme?: string
  primaryColor?: string
  fontFamily?: string
  fontSize?: string
  legend?: string
  isMacCodeBlock?: boolean
  isShowLineNumber?: boolean
  isUseIndent?: boolean
  isUseJustify?: boolean
  codeBlockTheme?: string // 'atom-one-dark' | 'github-dark'
}

// 仅做 doocs 渲染，产出 `<style>...</style> + class化HTML`。juice 内联与变量 flatten
// 放在不打包的 wrapper(render.mjs)里做——juice 是含动态 require 的 CJS，不宜进 ESM bundle。
export function renderCore(markdown: string, opts: RenderOpts = {}): { html: string, primaryColor: string } {
  const theme = opts.theme ?? `default`
  const primaryColor = opts.primaryColor ?? `#0F4C81`
  const fontFamily = opts.fontFamily ?? SANS
  const fontSize = opts.fontSize ?? `16px`
  const codeTheme = opts.codeBlockTheme ?? `atom-one-dark`

  const renderer = initRenderer({
    isMacCodeBlock: opts.isMacCodeBlock ?? true,
    isShowLineNumber: opts.isShowLineNumber ?? false,
    citeStatus: false,
    countStatus: false,
    themeMode: `light`,
    legend: (opts.legend ?? `alt`) as any,
  })

  const { html: baseHtml, readingTime } = renderMarkdown(markdown, renderer)
  const processedHtml = postProcessHtml(baseHtml, readingTime, renderer)

  const cssConfig = {
    primaryColor,
    fontFamily,
    fontSize,
    isUseIndent: opts.isUseIndent ?? false,
    isUseJustify: opts.isUseJustify ?? true,
    headingStyles: undefined,
  }
  const variablesCSS = generateCSSVariables(cssConfig as any)
  const headingStylesCSS = generateHeadingStyles(cssConfig as any)
  const themeCSS = themeMap[theme] || themeMap.default
  const hljsCSS = hljsMap[codeTheme] || hljsMap[`atom-one-dark`]

  let merged = [variablesCSS, baseCSS, themeCSS, headingStylesCSS, hljsCSS]
    .filter(Boolean)
    .join(`\n\n`)
  merged = processCSS(merged)

  const full = `<style>\n${merged}\n</style>\n${processedHtml}`
  return { html: full, primaryColor }
}
