#!/usr/bin/env node
// 公众号渲染 CLI（薄包装层）：
//   先同步装好 DOM polyfill（headless node 渲染 doocs 引擎必需，复刻官方 run.mjs），
//   再动态 import 打包好的 core.bundle.mjs 调 renderToWeChatHtml。
// 用法: node render.mjs <markdown文件> [optionsJSON文件]   → stdout 输出公众号内联 HTML
//   不传 markdown 文件时从 stdin 读。
import fs from 'node:fs'

function noop() {}
globalThis.MathJax = {
  texReset() {},
  tex2svg(latex) {
    const svgStyle = {}
    const styleProxy = new Proxy(svgStyle, {
      set(_, prop, value) { svgStyle[prop] = value; return true },
      get(_, prop) {
        if (prop === `setProperty`) return (p, v) => { svgStyle[p] = v }
        if (prop === `display`) return svgStyle[prop] || ``
        return svgStyle[prop]
      },
    })
    return { firstChild: { outerHTML: `<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>${latex.replace(/</g, `&lt;`)}</mi></math>`, style: styleProxy, getAttribute: () => null, removeAttribute: noop } }
  },
}
globalThis.window = {
  MathJax: globalThis.MathJax, addEventListener: noop, removeEventListener: noop,
  dispatchEvent: () => true, getComputedStyle: () => ({ getPropertyValue: () => `` }),
  requestAnimationFrame: cb => setTimeout(cb, 16),
  matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
}
globalThis.document = {
  getElementById: () => null, documentElement: { getAttribute: () => null, style: {} },
  createDocumentFragment: () => ({ appendChild: noop, childNodes: [] }),
  querySelectorAll: () => [], querySelector: () => null,
  createElement: tag => ({ tagName: tag.toUpperCase(), setAttribute: noop, appendChild: noop, innerHTML: ``, style: {} }),
  createTextNode: text => ({ textContent: text, data: text }),
  body: { appendChild: noop }, head: { appendChild: noop },
}

const mdFile = process.argv[2]
const optsFile = process.argv[3]
const markdown = mdFile && mdFile !== `-`
  ? fs.readFileSync(mdFile, `utf-8`)
  : fs.readFileSync(0, `utf-8`)
const opts = optsFile ? JSON.parse(fs.readFileSync(optsFile, `utf-8`)) : {}

const { renderCore } = await import(`./core.bundle.mjs`)
const { default: juice } = await import(`juice`)

// 1) doocs 引擎渲染出 <style>+class化HTML
let { html: full, primaryColor } = renderCore(markdown, opts)

// 1.5) 覆盖代码块字号：doocs default 给的是 90%(≈14.4px)，但代码块里的中文走等宽字体的
//      CJK 回退、视觉偏"墩"显得偏大，故调小到 CODE_FONT_PX，让它和正文/引用观感更协调。
//      注入到主 <style> 末尾、加 !important，juice 会内联到 pre 与其中的 code 上。
const CODE_FONT_PX = 13
full = full.replace(
  `</style>`,
  `\npre.code__pre, pre.code__pre code { font-size: ${CODE_FONT_PX}px !important; }\n</style>`,
)

// 2) 镜像 doocs web 端 clipboard.ts 的"复制到公众号"收尾：
//    juice 内联 + flatten 残留 CSS 变量（公众号草稿 API 无 <style>、不认 CSS 变量）。
//    官方同样不 flatten color-mix（新版公众号编辑器可识别），保持一致。
let out = juice(full, {
  inlinePseudoElements: true,
  preserveImportant: true,
  resolveCSSVariables: false,
})
out = out
  .replace(/([^-])top:(.*?)em/g, `$1transform: translateY($2em)`)
  .replace(/hsl\(var\(--foreground\)\)/g, `#3f3f3f`)
  .replace(/var\(--blockquote-background\)/g, `#f7f7f7`)
  .replace(/var\(--md-primary-color\)/g, primaryColor)
  .replace(/--md-primary-color:.+?;/g, ``)
  .replace(/--md-font-family:.+?;/g, ``)
  .replace(/--md-font-size:.+?;/g, ``)
process.stdout.write(out)