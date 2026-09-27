#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const normalized = value => String(value || '').replace(/\s+/g, ' ').trim();
export function validateNarrative(job) {
  const errors=[];
  const read=name=>{try{return JSON.parse(fs.readFileSync(path.join(job,'data',name),'utf8'));}catch{errors.push(`缺少或无法解析 data/${name}`);return null;}};
  const source=read('source.json'), plan=read('narrative-plan.json'), visual=read('visual-plan.json'), cards=read('cards.json');
  if(!source||!plan||!visual||!cards)return errors;
  for(const key of ['url','title','capturedAt'])if(!normalized(source[key]))errors.push(`原文快照缺少 ${key}`);
  const sections=source.sections||[], ids=sections.map(s=>s.id), byId=new Map(sections.map(s=>[s.id,s]));
  if(!sections.length||new Set(ids).size!==ids.length)errors.push('原文章节为空或 id 重复');
  for(const s of sections)if(!s.id||!s.heading||!s.paragraphs?.length||s.paragraphs.some(p=>!normalized(p)))errors.push(`原文章节 ${s.id} 缺少正文`);
  for(const key of ['goal','throughline'])if(!normalized(plan[key]))errors.push(`叙事计划缺少 ${key}`);
  if(!plan.pages?.length)errors.push('叙事计划没有页面');
  const pages=plan.pages||[], slugs=pages.map(p=>p.slug);
  if(new Set(slugs).size!==slugs.length)errors.push('叙事页 slug 重复');
  for(const [label,list] of [['视觉策划',visual.cards],['卡片数据',cards.pages]])if(JSON.stringify(list?.map(p=>p.slug))!==JSON.stringify(slugs))errors.push(`${label} 与叙事计划的页面和顺序不一致`);
  let last=-1;
  const covered=new Set();
  pages.forEach((p,i)=>{
    const label=`第 ${i+1} 页 ${p.slug}`;
    for(const key of ['slug','question','answer','fromPrevious','toNext'])if(!normalized(p[key]))errors.push(`${label} 缺少 ${key}`);
    if(!p.sourceIds?.length)errors.push(`${label} 缺少 sourceIds`);
    for(const id of p.sourceIds||[]){if(!byId.has(id))errors.push(`${label} 引用不存在的章节 ${id}`);else covered.add(id);}
    const index=Math.min(...(p.sourceIds||[]).map(id=>ids.indexOf(id)));
    if(!p.recap){if(index<last)errors.push(`${label} 倒置原文章节顺序`);last=Math.max(last,index);}
    if(!p.claims?.length)errors.push(`${label} 没有逐条主张依据`);
    for(const claim of p.claims||[]){
      const section=byId.get(claim.sourceId);
      if(!normalized(claim.text)||!normalized(claim.quote))errors.push(`${label} 存在空主张或引文`);
      if(!p.sourceIds?.includes(claim.sourceId))errors.push(`${label} 的主张不在本页 sourceIds 中`);
      if(!section?.paragraphs.some(par=>normalized(par).includes(normalized(claim.quote))))errors.push(`${label} 的引文不在对应原文段落中：${normalized(claim.quote).slice(0,45)}`);
    }
  });
  for(const id of ids)if(!covered.has(id)&&!plan.omissions?.some(o=>o.sourceId===id&&normalized(o.reason)))errors.push(`原文 ${id} 未覆盖且未说明省略原因`);
  return errors;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(!process.argv[2]){console.error('用法：node validate-narrative.mjs <job>');process.exit(2);}
  const errors=validateNarrative(path.resolve(process.argv[2]));
  if(errors.length){console.error(errors.map(e=>'FAIL '+e).join('\n'));process.exit(1);}
  console.log('PASS 原文引用、叙事字段和页面顺序；仍需人工检查语义支持与连续阅读');
}
