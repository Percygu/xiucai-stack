#!/usr/bin/env node
// 文章定稿质量校验脚本
// 用法: node scripts/check-article.mjs <文章路径> [更多路径...]
//   不传路径时，默认扫描 src/vibe_coding_series 下所有 .md
//
// 校验项（可量化部分硬校验，引号/字数只做提示）：
//   [硬] frontmatter description：以「Vibe Coding教程第X篇：」开头，长度 80–130 字
//   [硬] 各级标题：无冒号/逗号/顿号/破折号拼接
//   [硬] 图片编号：从 1 连续、无断号无重复
//   [提示] 正文引号清单：列出所有中文引号，供人工逐对核对是否滥用
//   [提示] 正文字数：粗略统计，供对照篇幅要求

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

// 把文件拆成 frontmatter 与正文，并标记代码块行
function parse(content) {
  const lines = content.split('\n');
  let fmStart = -1, fmEnd = -1;
  if (lines[0] === '---') {
    fmStart = 0;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') { fmEnd = i; break; }
    }
  }
  const frontmatter = fmEnd > 0 ? lines.slice(1, fmEnd).join('\n') : '';
  // 标记代码块（``` 围栏）内的行，校验时跳过
  const inCode = new Array(lines.length).fill(false);
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) { fence = !fence; inCode[i] = true; continue; }
    inCode[i] = fence;
  }
  return { lines, frontmatter, fmEnd, inCode };
}

// 统计字符长度：中文按 1，连续英文/数字串按 1，空格忽略
function cjkLen(s) {
  const noSpace = s.replace(/\s+/g, ' ').trim();
  const cjk = (noSpace.match(/[一-鿿]/g) || []).length;
  const words = (noSpace.match(/[A-Za-z0-9+#./-]+/g) || []).length;
  const puncts = (noSpace.match(/[，。、：；！？「」“”（）·…—\-]/g) || []).length;
  return cjk + words + puncts;
}

function checkOne(file) {
  const rel = relative(ROOT, file);
  const content = readFileSync(file, 'utf-8');
  const { lines, frontmatter, fmEnd, inCode } = parse(content);
  const errors = [];
  const notes = [];

  // 1. description
  const m = frontmatter.match(/^description:\s*(.+)$/m);
  if (!m) {
    errors.push('缺少 frontmatter description 字段');
  } else {
    const desc = m[1].trim();
    if (!/^Vibe Coding教程第\d+篇：/.test(desc)) {
      errors.push('description 未以「Vibe Coding教程第X篇：」开头');
    }
    // 按字符数口径（贴近搜索引擎按字符截断：中文/英文字母/标点各计 1）
    const len = desc.length;
    if (len < 80 || len > 130) {
      errors.push(`description 长度 ${len} 字符，超出 80–130 区间（过长会被搜索引擎截断）`);
    } else {
      notes.push(`description 长度 ${len} 字符 ✓`);
    }
  }

  // 2. 标题拼接检查
  const badTitlePunct = /[：:，,、]|——|\s—\s/;
  for (let i = 0; i < lines.length; i++) {
    if (inCode[i]) continue;
    const hm = lines[i].match(/^(#{2,4})\s+(.+?)\s*$/);
    if (!hm) continue;
    // 去掉加粗符号与编号前缀（如 1. / 2.1 / 4.1.1）
    let title = hm[2].replace(/\*\*/g, '').replace(/^\d+(\.\d+)*\.?\s*/, '').trim();
    if (badTitlePunct.test(title)) {
      errors.push(`第 ${i + 1} 行标题含拼接标点，应砍成单个核心短语：${hm[2]}`);
    }
  }

  // 3. 图片编号连续性
  const nums = [];
  for (let i = 0; i < lines.length; i++) {
    if (inCode[i]) continue;
    const line = lines[i];
    let r;
    const reImg = /!\[[^\]]*\]\([^)]*?(\d+)\.(?:png|jpe?g|gif|webp)\)/gi;
    while ((r = reImg.exec(line))) nums.push(+r[1]);
    const rePlace = /【建议配图\s*(\d+)/g;
    while ((r = rePlace.exec(line))) nums.push(+r[1]);
    const reShot = /🔴待截图\s*(\d+)/g;
    while ((r = reShot.exec(line))) nums.push(+r[1]);
  }
  if (nums.length) {
    const uniq = [...new Set(nums)].sort((a, b) => a - b);
    const dup = nums.filter((n, idx) => nums.indexOf(n) !== idx);
    const max = uniq[uniq.length - 1];
    const missing = [];
    for (let n = 1; n <= max; n++) if (!uniq.includes(n)) missing.push(n);
    if (missing.length) errors.push(`图片编号断号，缺少：${missing.join(', ')}（当前最大 ${max}）`);
    if (dup.length) errors.push(`图片编号重复：${[...new Set(dup)].join(', ')}`);
    if (!missing.length && !dup.length) notes.push(`图片编号 1–${max} 连续 ✓`);
  }

  // 4. 引号清单（提示，不计入 errors）
  const quoteLines = [];
  let quoteCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (inCode[i]) continue;
    if (lines[i].startsWith('description:')) continue;
    // 跳过 HTML 标签行（如推广块），其中的引号属 HTML 语法、不是正文引号
    if (/<[a-zA-Z!/][^>]*>/.test(lines[i])) continue;
    // 中文弯引号、直角引号、以及 ASCII 直引号都要检测
    const qs = lines[i].match(/[“”‘’「」『』"]/g);
    if (qs && qs.length) {
      quoteCount += qs.length;
      quoteLines.push(`  第 ${i + 1} 行: ${lines[i].trim()}`);
    }
  }
  if (quoteCount) {
    notes.push(`正文检测到 ${quoteCount} 个引号字符，需逐对人工核对是否滥用（仅"直接引用/术语首现/界面字面量"可保留）：`);
    notes.push(...quoteLines);
  } else {
    notes.push('正文无引号 ✓');
  }

  // 5. 正文字数（提示）
  const bodyLines = lines.slice(fmEnd + 1).filter((_, idx) => !inCode[idx + fmEnd + 1]);
  let body = bodyLines.join('\n')
    .replace(/<[^>]+>/g, '')          // HTML 标签
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 图片
    .replace(/^>.*$/gm, '');          // 引用块（占位标记等）
  const bodyWordCount = (body.match(/[一-鿿]/g) || []).length;
  notes.push(`正文中文字数约 ${bodyWordCount} 字（不含代码/HTML/占位块，仅供对照篇幅要求）`);

  return { rel, errors, notes };
}

const args = process.argv.slice(2);
const files = args.length
  ? args
  : walk(join(ROOT, 'src/vibe_coding_series'));

let failed = 0;
for (const f of files) {
  const { rel, errors, notes } = checkOne(f);
  console.log(`\n━━━ ${rel} ━━━`);
  if (errors.length) {
    failed++;
    for (const e of errors) console.log(`  ❌ ${e}`);
  } else {
    console.log('  ✅ 硬校验全部通过');
  }
  for (const n of notes) console.log(n.startsWith('  ') ? n : `  · ${n}`);
}

console.log(`\n检查完成：${files.length} 篇，${failed} 篇有硬性问题。`);
process.exit(failed ? 1 : 0);
