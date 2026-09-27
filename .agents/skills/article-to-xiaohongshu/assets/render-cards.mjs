// Render a copied job template with mandatory DOM audit. No platform operations.
// node render-cards.mjs [memo|macaron|random] [background|random] [port] [theme|random]
// Set PLAYWRIGHT_MODULE to the absolute workspace dependency module when needed.
import {existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync,renameSync,mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {pathToFileURL} from 'node:url';
const job=import.meta.dirname,skill=process.env.ARTICLE_CARD_SKILL_DIR||join(homedir(),'.codex/skills/article-to-xiaohongshu');
const {captureCard}=await import(pathToFileURL(join(skill,'scripts/capture-card.mjs')));
const {renderInputHash}=await import(pathToFileURL(join(skill,'scripts/quality-evidence.mjs')));
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE)):await import('playwright');
const pick=a=>a[Math.floor(Math.random()*a.length)];
let style=process.argv[2]||'random',background=process.argv[3]||'random',theme=process.argv[5]||'random';
const port=Number(process.argv[4]||8788),pool={sky:'sky',sage:'green',lilac:'purple',peach:'pink',mint:'mint'};
if(style==='random')style=pick(['memo','macaron']);if(theme==='random')theme=pick(Object.keys(pool));
if(!pool[theme]||!['memo','macaron'].includes(style))throw Error('未知主题或封面风格');
if(background==='random')background=pool[theme];
const pages=JSON.parse(readFileSync(join(job,'data/cards.json'),'utf8')).pages;
if(!pages?.length)throw Error('缺少讲解卡');
const shots=[['cover.html?card='+style+'&bg='+background,'00-cover-'+style+'-'+background+'.png'],['inner.html?only=0','01-origin-doc.png'],...pages.map((p,i)=>['explainer.html?theme='+theme+'&only='+i,String(i+2).padStart(2,'0')+'-'+p.slug+'.png'])];
if(shots.some(([,name])=>!/^\d{2}-[a-z0-9-]+\.png$/.test(name)))throw Error('不安全的卡片文件名');
mkdirSync(join(job,'qa'),{recursive:true});mkdirSync(join(job,'output'),{recursive:true});
const chrome=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--no-sandbox','--disable-gpu']});
const records=[],inputHash=renderInputHash(job);
try{
 const old=readdirSync(join(job,'output')).filter(n=>/^\d{2}-.*\.png$/.test(n));
 if(old.length){const backup=mkdtempSync(join(job,'qa','previous-render-'));for(const n of old)renameSync(join(job,'output',n),join(backup,n));console.log('旧图片可恢复：'+backup);}
 const page=await browser.newPage({viewport:{width:1080,height:1440},deviceScaleFactor:1});
 for(const [i,[url,name]] of shots.entries()){
  const record=await captureCard(page,{url:'http://localhost:'+port+'/'+url,output:join(job,'output',name),name,inputHash,teaching:i>=2});
  records.push(record);console.log(name+': '+record.errors.length+' issues');
 }
}finally{await browser.close();writeFileSync(join(job,'qa/render-audit.json'),JSON.stringify(records,null,2));}
if(inputHash!==renderInputHash(job))throw Error('渲染期间输入发生变化，必须重新渲染');
if(records.some(r=>r.errors.length))process.exitCode=1;
console.log('已输出成图审计；仍须逐页审读并运行 validate-job.mjs，渲染完成不等于验收合格。');
