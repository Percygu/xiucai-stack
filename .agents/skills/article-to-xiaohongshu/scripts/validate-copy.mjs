import {existsSync,readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {metaWording} from './validate-visible-copy.mjs';

export function copySections(raw){
 const heads=[...raw.matchAll(/^(小红书|抖音|小绿书)正文[：:]\s*$/gm)];
 return heads.map((m,i)=>({platform:m[1],text:raw.slice(m.index+m[0].length,heads[i+1]?.index??raw.length).split(/\n(?:小红书\/抖音候选标签|标签)[：:]/)[0].trim()}));
}
export function validateCopy(job){
 const errors=[],warnings=[];
 const file=join(job,'copy.md');
 if(!existsSync(file))return {errors:['缺少 copy.md，不能跳过正文校验'],warnings,platforms:[]};
 const raw=readFileSync(file,'utf8'),sections=copySections(raw),platforms=sections.map(s=>s.platform);
 if(!sections.length)errors.push('copy.md 没有可识别的平台正文段');
 if(new Set(platforms).size!==platforms.length)errors.push('copy.md 有重复的平台正文段');
 const titles=[...raw.split(/^(?:小红书|抖音|小绿书)正文[：:]/m)[0].matchAll(/^\d+\.\s*(.+)$/gm)].map(m=>m[1].trim());
 if(!titles.length||titles.some(t=>!t.startsWith('面试官：')||[...t].length>20))errors.push('文案标题缺失或未满足“面试官：+精简题、20字以内”');
 for(const {platform,text} of sections){
  const body=platform==='小绿书'?text.split(/^(?:学习网站|Agent项目)[：:]\s*$/m)[0].trim():text;
  if(!body)errors.push(`${platform}正文为空`);
  const hit=metaWording(body);if(hit)errors.push(`${platform}正文出现介绍性话术「${hit}」`);
  if(/["“”‘’「」『』]/.test(body))errors.push(`${platform}正文含引号，需改写普通概念强调`);
  if(/\n\s*\n/.test(body))errors.push(`${platform}正文必须使用单换行`);
  if(/https?:\/\/|golangstar\.cn|私信领取|加群/.test(body))errors.push(`${platform}正文含外部引流`);
  if(platform==='小绿书'&&/(?:^|\s)#[\p{L}\p{N}_]+/u.test(body))errors.push('小绿书正文不可带话题标签');
  if(platform==='抖音'&&/\p{Extended_Pictographic}/u.test(body))errors.push('抖音正文不可带 emoji');
  const lines=body.split('\n').filter(x=>x.trim()),lists=lines.filter(x=>/^\s*(?:[-*•]|\d+[.、)]|[▶✅🌿])/u.test(x));
  if(platform!=='抖音'&&lines.length>=4&&lists.length/lines.length>0.5)warnings.push(`${platform}列点超过半数，审读时须确认是真正步骤或并列方案，而非模板化罗列`);
 }
 if(platforms.includes('小绿书')){
  try{
   execFileSync('python3',[join(dirname(fileURLToPath(import.meta.url)),'validate-wechat-content.py'),job],{encoding:'utf8',stdio:'pipe'});
  }catch(e){errors.push(`小绿书最终 HTML：${String(e.stderr||e.message).trim()}`);}
 }
 return {errors,warnings,platforms};
}
