import {createHash} from 'node:crypto';
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const sha256=value=>createHash('sha256').update(value).digest('hex');
function paths(job){
 const result=[];
 const walk=(rel)=>{for(const e of readdirSync(join(job,rel),{withFileTypes:true})){
  const file=rel?`${rel}/${e.name}`:e.name;
  if(e.isDirectory()&&rel)walk(file);
  else if(e.isFile()&&(/\.(?:html|css|js|mjs|json|png|svg|woff2?|ttf)$/i.test(file)))result.push(file);
 }};
 // Root templates/scripts and local data are render inputs. QA/review/copy are not.
 walk('');if(existsSync(join(job,'data')))walk('data');
 return result.filter(p=>!['review.html','wechat-content.html'].includes(p)).sort();
}
function hashFiles(job,files){return sha256(files.map(p=>`${p}\0${sha256(readFileSync(join(job,p)))}`).join('\n'));}
export function renderInputHash(job){return hashFiles(job,paths(job));}
export function artifactHash(job){
 const files=[...paths(job),...['copy.md','wechat-content.html','qa/render-audit.json','qa/narrative-review.md'].filter(p=>existsSync(join(job,p)))];
 if(existsSync(join(job,'output')))files.push(...readdirSync(join(job,'output')).filter(p=>p.endsWith('.png')).map(p=>'output/'+p));
 return hashFiles(job,[...new Set(files)].sort());
}
export function validateRenderEvidence(job){
 const errors=[],auditFile=join(job,'qa/render-audit.json');
 if(!existsSync(auditFile))return ['缺少 qa/render-audit.json：必须检查实际成图，不能只验证 cards.json'];
 const audit=JSON.parse(readFileSync(auditFile,'utf8'));
 if(!Array.isArray(audit)||!audit.length)return ['成图审计为空或格式错误'];
 const files=existsSync(join(job,'output'))?readdirSync(join(job,'output')).filter(n=>n.endsWith('.png')).sort():[];
 if(JSON.stringify(audit.map(x=>x.name).sort())!==JSON.stringify(files))errors.push('成图审计必须逐一覆盖全部输出图片，不能缺页、重页或沿用旧页');
 const current=renderInputHash(job);
 for(const page of audit){
  const label=`成图 ${page.name}`;
  if(!files.includes(page.name))continue;
  if(page.inputHash!==current)errors.push(`${label} 的渲染输入已变化或缺少指纹，须重新渲染`);
  if(page.imageHash!==sha256(readFileSync(join(job,'output',page.name))))errors.push(`${label} 图片与审计记录不一致`);
  if(!page.visibleText?.trim()||!Array.isArray(page.texts)||!page.texts.length)errors.push(`${label} 缺少实际可见文本或字号记录`);
  if(!Array.isArray(page.errors)||page.errors.length)errors.push(`${label} 布局审计不合格：${JSON.stringify(page.errors)}`);
  if(Number(page.name.slice(0,2))<2)continue;
  for(const t of page.texts||[]){
   const min=t.role==='heading'?34:t.role==='core'?28:24;
   if(!['heading','core','aux'].includes(t.role)||!Number.isFinite(t.font)||t.font<min)errors.push(`${label} 文字角色/字号不合格：${t.text}`);
   if(![t.x,t.y,t.w,t.h].every(Number.isFinite)||t.x<-.5||t.y<-.5||t.x+t.w>1080.5||t.y+t.h>1440.5)errors.push(`${label} 可见文字超出画布：${t.text}`);
  }
 }
 return errors;
}

export function validateContentReview(job,platforms){
 const errors=[],pending=[],file=join(job,'qa/content-review.json');
 if(!existsSync(file))return {errors,pending:['缺少 qa/content-review.json：尚未记录逐页与正文的语义审读']};
 const review=JSON.parse(readFileSync(file,'utf8'));
 if(review.artifactHash!==artifactHash(job))return {errors,pending:['审读记录与当前产物不匹配：内容、图片或校验依据已变化，必须重新审读']};
 if(review.version!==1||!review.reviewer?.trim()||!Number.isFinite(Date.parse(review.reviewedAt)))pending.push('审读记录缺少版本、审读者或时间');
 if(!existsSync(join(job,'qa/narrative-review.md'))||statSync(join(job,'qa/narrative-review.md')).size===0)pending.push('缺少具体的 qa/narrative-review.md 审读依据');
 const cards=JSON.parse(readFileSync(join(job,'data/cards.json'),'utf8')).pages;
 const required=cards.map(p=>p.slug);
 if(JSON.stringify(review.pages?.map(p=>p.slug))!==JSON.stringify(required))pending.push('语义审读必须按顺序覆盖全部讲解卡');
 function check(item,keys,label){
  if(!item?.evidence?.trim())pending.push(`${label} 缺少具体审读依据`);
  for(const key of keys){
   if(item?.checks?.[key]==='fail')errors.push(`${label} ${key} 审读不合格：${item.evidence||''}`);
   else if(item?.checks?.[key]!=='pass')pending.push(`${label} ${key} 尚未审读`);
  }
 }
 for(const p of review.pages||[])check(p,['source','coherence','clarity','directContent','readability'],p.slug);
 if(JSON.stringify((review.copy||[]).map(c=>c.platform).sort())!==JSON.stringify([...platforms].sort()))pending.push('正文审读必须覆盖所有实际交付的平台');
 for(const c of review.copy||[])check(c,['source','directContent','coherence','listing'],`${c.platform}正文`);
 check(review.overall,['originalOrder','goalClosure','fullSize','mobileSize'],'整组');
 return {errors,pending};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.argv[2]){console.error('用法：node quality-evidence.mjs <job>（只计算指纹，不批准审读）');process.exit(2);}
 const job=resolve(process.argv[2]);
 console.log(JSON.stringify({artifactHash:artifactHash(job),renderInputHash:renderInputHash(job)},null,2));
}
