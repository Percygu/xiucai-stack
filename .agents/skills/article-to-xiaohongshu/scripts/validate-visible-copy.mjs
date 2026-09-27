import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

// Only inspect reader-facing fields and rendered text, not source quotations or plans.
const fields=new Set(['title','titleHTML','subtitle','subtitleHTML','eyebrow','html','body','bodyHTML','noteHTML','quoteHTML','paragraphs','paragraphsHTML','key','value','valueHTML','label','text','footer','caption']);
export function metaWording(value){
 const text=String(value).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<!--[^]*?-->/g,'').replace(/<[^>]*>/g,'')
  .replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>{const cp=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return cp<=0x10ffff?String.fromCodePoint(cp):'';})
  .replace(/&nbsp;|\s+/g,'');
 return text.match(/本页(?:结论|小结|总结)|[上下]一?页|(?:本页|这一页|这页|本图|这张图|这组图|图里|图中)(?:介绍|讲解|讲了|展示|讲什么)|(?:这篇(?:文章)?|本文|本篇)(?:介绍|讲解|讲了|展示|整理|做成|做了|拆解|带你)|(?:最后|文末|末页)(?:还)?附(?:上|了)?参考(?:答案|回答)|顺着这组图|(?:部分|机制|内容)讲完|接下来介绍(?:本页|这页|这张图)/)?.[0]||'';
}
export function validateVisibleCopy(job){
 const errors=[];
 function inspect(text,label){const hit=metaWording(text);if(hit)errors.push(`${label} 出现页面导读「${hit}」，应直接讲内容`);}
 function walk(value,label,selected=false){
  if(typeof value==='string'){if(selected)inspect(value,label);return;}
  if(Array.isArray(value)){value.forEach((v,i)=>walk(v,`${label}[${i}]`,selected));return;}
  if(value&&typeof value==='object')for(const [key,v] of Object.entries(value))walk(v,`${label}.${key}`,fields.has(key));
 }
 const cards=join(job,'data/cards.json');
 if(existsSync(cards))walk(JSON.parse(readFileSync(cards,'utf8')),'cards');
 const audit=join(job,'qa/render-audit.json');
 if(existsSync(audit)){
  for(const page of JSON.parse(readFileSync(audit,'utf8'))){
   if(/^0[01]-/.test(page.name))continue; // cover/source retain their separate rules
   if(page.visibleText)inspect(page.visibleText,`成图 ${page.name}`);
   else for(const item of page.texts||[])inspect(item.text,`成图 ${page.name}`);
  }
 }
 return errors;
}
