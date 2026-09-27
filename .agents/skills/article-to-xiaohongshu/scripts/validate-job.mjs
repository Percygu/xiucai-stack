#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { validateNarrative } from './validate-narrative.mjs';
import { validateVisibleCopy } from './validate-visible-copy.mjs';
import { validateCopy } from './validate-copy.mjs';
import { validateRenderEvidence, validateContentReview } from './quality-evidence.mjs';

if (!process.argv[2]) {
  console.error('用法：node validate-job.mjs <job-dir>');
  process.exit(2);
}
const jobDir = resolve(process.argv[2] || '');
if (!existsSync(jobDir)) { console.error('FAIL job 目录不存在'); process.exit(1); }
const failures = [];
const pending = [];
const fail = message => failures.push(message);
function safe(label,fn,fallback=[]){try{return fn();}catch(error){fail(`${label} 无法校验：${error.message}`);return fallback;}}
failures.push(...safe('原文与叙事',()=>validateNarrative(jobDir)));
failures.push(...safe('可见文案',()=>validateVisibleCopy(jobDir)));
failures.push(...safe('成图证据',()=>validateRenderEvidence(jobDir)));
const copy=safe('正文',()=>validateCopy(jobDir),{errors:[],warnings:[],platforms:[]});
failures.push(...copy.errors);
const review=safe('语义审读',()=>validateContentReview(jobDir,copy.platforms),{errors:[],pending:[]});
failures.push(...review.errors);pending.push(...review.pending);
const readJSON = rel => {
  const path = join(jobDir, rel);
  if (!existsSync(path)) {
    fail(`缺少 ${rel}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${rel} 不是有效 JSON：${error.message}`);
    return null;
  }
};

const expectedNav = [
  'Go语言进阶之路',
  '🔥后端/AI面试题',
  '🤖Go Agent实战指南',
  '🔥Vibe Coding实战指南',
  '🔥Agent项目',
];

const meta = readJSON('data/meta.json');
if (meta) {
  const labels = Array.isArray(meta.nav) ? meta.nav.map(item => item?.label) : [];
  if (JSON.stringify(labels) !== JSON.stringify(expectedNav)) {
    fail(`顶部导航必须逐字匹配：${expectedNav.join(' / ')}`);
  }
  const active = Array.isArray(meta.nav) ? meta.nav.filter(item => item?.on) : [];
  if (active.length !== 1) fail('顶部导航必须且只能有一个高亮栏目');
  const source = String(meta.sourceUrl || meta.url || '');
  const expectedActive = source.includes('/backend_series/') ? '🔥后端/AI面试题' :
    source.includes('/go_agent_series/') ? '🤖Go Agent实战指南' :
    source.includes('/vibe_coding_series/') ? '🔥Vibe Coding实战指南' :
    source.includes('/projects/') ? '🔥Agent项目' :
    source.includes('/go_series/') ? 'Go语言进阶之路' : '';
  if (expectedActive && active[0]?.label !== expectedActive) fail(`当前文章必须高亮「${expectedActive}」`);
  if (!Array.isArray(meta.items) || meta.items.length === 0) fail('meta.items 不能为空');
  if (!Number.isInteger(meta.cur) || meta.cur < 0 || meta.cur >= (meta.items?.length || 0)) {
    fail('meta.cur 必须指向 meta.items 中的当前文章');
  }
}

const plan = readJSON('data/visual-plan.json');
if (plan) {
  const cards = Array.isArray(plan.cards) ? plan.cards : [];
  if (!cards.length) fail('缺少讲解卡，页数应按原文确定，不为凑数扩写');

  const types = [];
  let richCount = 0;
  cards.forEach((card, index) => {
    const label = `visual-plan 第 ${index + 1} 张`;
    for (const key of ['slug', 'coreQuestion', 'visualType', 'mainVisual', 'interviewLine']) {
      if (typeof card?.[key] !== 'string' || !card[key].trim()) fail(`${label} 缺少 ${key}`);
    }
    if (!Array.isArray(card?.explanations) || !card.explanations.length) {
      fail(`${label} 需要有原文依据的解释点`);
    }
    if (typeof card?.richVisual !== 'boolean') fail(`${label} 的 richVisual 必须是布尔值`);
    if (card?.richVisual) richCount += 1;
    const type = String(card?.visualType || '').trim();
    if (/^(grid\d*|list|cards?|answer|text)$/i.test(type)) {
      fail(`${label} 的 visualType「${type}」只是文字容器，不是具体视觉结构`);
    }
    types.push(type);
    if (index > 0 && type && type === types[index - 1]) fail(`${label} 与上一张复用了同一 visualType「${type}」`);
  });

  const counts = new Map();
  types.filter(Boolean).forEach(type => counts.set(type, (counts.get(type) || 0) + 1));
  if (counts.size < Math.min(5,cards.length)) fail(`视觉结构种类不足，当前 ${counts.size} 种`);
  const maxAllowed = Math.max(1, Math.floor(cards.length * 0.35));
  for (const [type, count] of counts) {
    if (count > maxAllowed) fail(`visualType「${type}」出现 ${count} 次，超过 35% 上限 ${maxAllowed} 次`);
  }
  if (cards.length && richCount / cards.length < 0.6) {
    fail(`richVisual 页面至少占 60%，当前 ${richCount}/${cards.length}`);
  }
}

const outputDir = join(jobDir, 'output');
if (!existsSync(outputDir)) {
  fail('缺少 output/');
} else {
  const pngs = readdirSync(outputDir).filter(name => name.toLowerCase().endsWith('.png')).sort();
  if (!pngs.length) fail('output/ 中没有 PNG');
  if (!pngs.some(name => name === '01-origin-doc.png')) fail('缺少 01-origin-doc.png');

  pngs.forEach((name, index) => {
    const match = name.match(/^(\d{2})-/);
    if (!match) {
      fail(`图片缺少两位序号前缀：${name}`);
    } else if (Number(match[1]) !== index) {
      fail(`图片序号不连续：期望 ${String(index).padStart(2, '0')}，实际 ${name}`);
    }

    const buf = readFileSync(join(outputDir, name));
    const pngSignature = buf.length >= 24 && buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (!pngSignature) {
      fail(`${name} 不是有效 PNG`);
      return;
    }
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width !== 1080 || height !== 1440) fail(`${name} 尺寸为 ${width}×${height}，必须是 1080×1440`);
  });

  if (plan?.cards && pngs.length !== plan.cards.length + 2) {
    fail(`图片数量应为封面 + 原文页 + ${plan.cards.length} 张讲解卡，当前共 ${pngs.length} 张`);
  }
  if (Array.isArray(plan?.cards)) {
    const expected=plan.cards.map((card,i)=>`${String(i+2).padStart(2,'0')}-${card.slug}.png`);
    if (JSON.stringify(pngs.slice(2))!==JSON.stringify(expected)) fail('输出图片的文件名或次序与逐页策划不一致');
  }
}

const status=failures.length?'FAIL':pending.length?'REVIEW_REQUIRED':'PASS';
const report={status,deliverable:status==='PASS',checkedAt:new Date().toISOString(),failures,pending,warnings:copy.warnings,
  limits:'自动检查不能证明引文支持结论或叙事连贯；PASS 包含当前产物的审读记录，不是机器对语义正确性的证明。'};
mkdirSync(join(jobDir,'qa'),{recursive:true});
writeFileSync(join(jobDir,'qa/validation-report.json'),JSON.stringify(report,null,2));
console.log(`${status} ${basename(jobDir)}：${status==='PASS'?'自动检查与当前版本逐页/正文审读记录齐全':'禁止交付，请处理报告中的问题'}`);
for(const item of failures.slice(0,25))console.error(`- 不合格：${item}`);
if(failures.length>25)console.error(`另有 ${failures.length-25} 项，详见完整报告`);
for(const item of pending)console.error(`- 待审读：${item}`);
for(const item of copy.warnings)console.log(`- 审读提示：${item}`);
console.log('报告：'+join(jobDir,'qa/validation-report.json'));
process.exitCode=status==='PASS'?0:status==='FAIL'?1:2;
