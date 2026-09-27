import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {captureCard} from './capture-card.mjs';
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE)):await import('playwright');
const dir=mkdtempSync(join(tmpdir(),'social-browser-audit-'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox','--disable-gpu']});
try{
 const page=await browser.newPage({viewport:{width:1080,height:1440},deviceScaleFactor:1});
 for(const [i,font,text,position,expected] of [[0,32,'缓存复用历史计算。','',''],[1,20,'缓存复用历史计算。','','small-text'],[2,32,'本页结论','','introductory-copy'],[3,32,'超出画布','position:absolute;top:1430px','outside'],[4,32,'行框外的字形仍完整可见','line-height:1',''],[5,32,'文字被容器裁切','height:10px;overflow:hidden','vertical-overflow']]){
  const html=`<style>*{box-sizing:border-box}body{margin:0}.card{width:1080px;height:1440px;padding:60px}p{font-size:${font}px;${position}}</style><section class="card"><p>${text}</p></section><script>window.__READY__=true</script>`;
  const result=await captureCard(page,{url:'data:text/html;charset=utf-8,'+encodeURIComponent(html),output:join(dir,i+'.png'),name:i+'.png',inputHash:'test',teaching:true});
  if(expected)assert(result.errors.some(e=>e.type===expected),JSON.stringify(result));else assert.deepEqual(result.errors,[]);
  assert.equal(result.imageHash.length,64);assert(result.visibleText.includes(text));
 }
 console.log('PASS 6 actual-browser audit tests: good, small text, template label, overflow, visible ink, clipped text');
}finally{await browser.close();rmSync(dir,{recursive:true});}
