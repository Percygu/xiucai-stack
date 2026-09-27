// Isolated synthetic fixtures test gating behaviour, not semantic quality.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {deflateSync} from 'node:zlib';
import {renderInputHash,artifactHash,sha256} from './quality-evidence.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'social-quality-gate-'));
const validator=path.join(import.meta.dirname,'validate-job.mjs');
const crc=b=>{let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
const chunk=(type,data)=>{const t=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([t,data])),data.length+8);return out;};
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(1080,0);ihdr.writeUInt32BE(1440,4);ihdr[8]=8;ihdr[9]=0;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.alloc((1080+1)*1440))),chunk('IEND',Buffer.alloc(0))]);
let count=0;
function fixture(){
 const job=fs.mkdtempSync(path.join(root,'case-'));
 for(const dir of ['data','qa','output'])fs.mkdirSync(path.join(job,dir));
 const put=(n,v)=>fs.writeFileSync(path.join(job,n),typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v));
 const get=n=>JSON.parse(fs.readFileSync(path.join(job,n),'utf8'));
 const slugs=['goal','retrieve','rank','generate','answer'];
 const paragraph='检索文档，排序后组装输入，再生成回答。';
 put('data/source.json',{url:'https://example.test/article',title:'检索后生成',capturedAt:'2026-09-27',sections:[{id:'s1',heading:'流程',paragraphs:[paragraph]}]});
 put('data/narrative-plan.json',{goal:'减少等待',throughline:'从检索到生成',pages:slugs.map(slug=>({slug,sourceIds:['s1'],question:'文档如何成为回答依据？',answer:paragraph,fromPrevious:'使用检索结果',toNext:'将文档组装进输入',claims:[{text:paragraph,sourceId:'s1',quote:paragraph}]}))});
 put('data/visual-plan.json',{cards:slugs.map(slug=>({slug,coreQuestion:'怎样使用文档？',visualType:slug+'-diagram',richVisual:true,mainVisual:'文档进入生成的流向',explanations:[paragraph],interviewLine:paragraph}))});
 put('data/cards.json',{pages:slugs.map(slug=>({slug,title:'文档进入生成',html:'<p>'+paragraph+'</p>'}))});
 put('data/meta.json',{nav:['Go语言进阶之路','🔥后端/AI面试题','🤖Go Agent实战指南','🔥Vibe Coding实战指南','🔥Agent项目'].map((label,i)=>({label,on:i===1})),items:['检索后生成'],cur:0,url:'https://example.test/backend_series/article'});
 put('copy.md','标题（3 选 1）：\n1. 面试官：文档如何用于生成\n\n小红书正文：\n'+paragraph);
 put('qa/narrative-review.md','测试夹具的审读证据；不是实际文章的语义验收。');
 const files=['00-cover-mint.png','01-origin-doc.png',...slugs.map((slug,i)=>String(i+2).padStart(2,'0')+'-'+slug+'.png')];
 for(const file of files)put('output/'+file,png);
 put('qa/render-audit.json',files.map(name=>({name,inputHash:renderInputHash(job),imageHash:sha256(png),visibleText:paragraph,errors:[],texts:[{text:paragraph,font:32,role:'core',x:60,y:400,w:800,h:50}]})));
 const record={version:1,reviewer:'Synthetic test fixture only',reviewedAt:'2026-09-27T00:00:00Z',artifactHash:artifactHash(job),pages:slugs.map(slug=>({slug,evidence:'夹具已声明的流程关系',checks:Object.fromEntries(['source','coherence','clarity','directContent','readability'].map(k=>[k,'pass']))})),copy:[{platform:'小红书',evidence:'测试段落来自 s1',checks:Object.fromEntries(['source','directContent','coherence','listing'].map(k=>[k,'pass']))}],overall:{evidence:'这是隔离的结构测试，不是生产内容',checks:Object.fromEntries(['originalOrder','goalClosure','fullSize','mobileSize'].map(k=>[k,'pass']))}};
 put('qa/content-review.json',record);
 return {job,put,get,record};
}
function test(label,change,status,fragment){
 const f=fixture();change?.(f);
 const result=spawnSync(process.execPath,[validator,f.job],{encoding:'utf8'});
 assert.equal(result.status,status,label+'\n'+result.stdout+result.stderr);
 const report=f.get('qa/validation-report.json');
 assert.equal(report.deliverable,status===0,label);
 if(fragment)assert(JSON.stringify(report).includes(fragment),label+': missing '+fragment);
 console.log('PASS '+label);count++;
}
try{
 test('complete current fixture passes',null,0);
 test('card introduction is rejected',f=>{const c=f.get('data/cards.json');c.pages[0].html='<b>本页结论</b>';f.put('data/cards.json',c);},1,'本页结论');
 test('article-summary body is rejected',f=>f.put('copy.md','1. 面试官：文档如何用于生成\n\n小红书正文：\n这篇文章介绍了检索和生成。'),1,'介绍性话术');
 test('fabricated quote is rejected',f=>{const p=f.get('data/narrative-plan.json');p.pages[0].claims[0].quote='性能提高十倍';f.put('data/narrative-plan.json',p);},1,'引文不在');
 test('missing render evidence is rejected',f=>fs.unlinkSync(path.join(f.job,'qa/render-audit.json')),1,'缺少 qa/render-audit');
 test('small text cannot hide behind empty errors',f=>{const a=f.get('qa/render-audit.json');a[2].texts[0].font=20;f.put('qa/render-audit.json',a);},1,'字号不合格');
 test('layout error is rejected',f=>{const a=f.get('qa/render-audit.json');a[2].errors=[{type:'outside'}];f.put('qa/render-audit.json',a);},1,'布局审计不合格');
 test('missing render page is rejected',f=>{const a=f.get('qa/render-audit.json');a.pop();f.put('qa/render-audit.json',a);},1,'逐一覆盖');
 test('changed PNG invalidates evidence',f=>fs.appendFileSync(path.join(f.job,'output/02-goal.png'),'changed'),1,'图片与审计记录不一致');
 test('changed render input invalidates evidence',f=>f.put('changed.css','body{color:red}'),1,'渲染输入已变化');
 test('missing semantic review blocks delivery',f=>fs.unlinkSync(path.join(f.job,'qa/content-review.json')),2,'缺少 qa/content-review');
 test('changed body invalidates old review',f=>fs.appendFileSync(path.join(f.job,'copy.md'),'\n文档组成输入。'),2,'审读记录与当前产物不匹配');
 test('unreviewed page blocks delivery',f=>{f.record.pages.pop();f.put('qa/content-review.json',f.record);},2,'全部讲解卡');
 test('explicit semantic failure blocks delivery',f=>{f.record.pages[0].checks.source='fail';f.put('qa/content-review.json',f.record);},1,'source 审读不合格');
 test('missing body review blocks delivery',f=>{f.record.copy=[];f.put('qa/content-review.json',f.record);},2,'所有实际交付的平台');
 test('missing body is rejected',f=>fs.unlinkSync(path.join(f.job,'copy.md')),1,'缺少 copy.md');
 test('malformed JSON produces a failure report',f=>f.put('data/cards.json','{'),1,'无法校验');
 test('stale WeChat HTML is rejected',f=>{
  f.put('copy.md','1. 面试官：文档如何用于生成\n\n小绿书正文：\n检索结果用于生成。');
  f.put('wechat-content.html','旧正文\n'+fs.readFileSync(path.join(import.meta.dirname,'../assets/wechat-project-footer.html'),'utf8'));
 },1,'与 copy.md 正文不一致');
 test('wrong project link is rejected',f=>{
  f.put('copy.md','1. 面试官：文档如何用于生成\n\n小绿书正文：\n检索结果用于生成。');
  f.put('wechat-content.html','检索结果用于生成。\n'+fs.readFileSync(path.join(import.meta.dirname,'../assets/wechat-project-footer.html'),'utf8').replace('2247494548','999'));
 },1,'项目名称、链接或顺序不正确');
 test('learning link before projects passes without external-link false positive',f=>{
  const footer=fs.readFileSync(path.join(import.meta.dirname,'../assets/wechat-project-footer.html'),'utf8');
  f.put('copy.md','1. 面试官：文档如何用于生成\n\n小绿书正文：\n检索结果用于生成。\n学习网站：\n[秀才的进阶之路](https://mp.weixin.qq.com/s/FV93xYRR9R2BCWwKHC1A8A)\nAgent项目：\n项目链接');
  f.put('wechat-content.html','检索结果用于生成。\n'+footer);
  f.record.copy[0].platform='小绿书';
  f.record.artifactHash=artifactHash(f.job);f.put('qa/content-review.json',f.record);
 },0);
 test('missing learning link is rejected',f=>{
  f.put('copy.md','1. 面试官：文档如何用于生成\n\n小绿书正文：\n检索结果用于生成。');
  const footer=fs.readFileSync(path.join(import.meta.dirname,'../assets/wechat-project-footer.html'),'utf8').split('\n').filter(line=>!line.includes('https://mp.weixin.qq.com/s/FV93xYRR9R2BCWwKHC1A8A')).join('\n');
  f.put('wechat-content.html','检索结果用于生成。\n'+footer);
 },1,'三条真实超链接');
 test('outdated learning article is rejected',f=>{
  f.put('copy.md','1. 面试官：文档如何用于生成\n\n小绿书正文：\n检索结果用于生成。');
  const footer=fs.readFileSync(path.join(import.meta.dirname,'../assets/wechat-project-footer.html'),'utf8').replace('https://mp.weixin.qq.com/s/FV93xYRR9R2BCWwKHC1A8A','https://mp.weixin.qq.com/s/dRcsdEvVdFTKSuNDYrvCzg');
  f.put('wechat-content.html','检索结果用于生成。\n'+footer);
 },1,'学习网站名称、链接或顺序不正确');
 console.log('PASS '+count+' end-to-end quality gate tests');
}finally{fs.rmSync(root,{recursive:true});}
