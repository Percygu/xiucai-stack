import {readFileSync} from 'node:fs';
import {metaWording} from './validate-visible-copy.mjs';
import {sha256} from './quality-evidence.mjs';

// Capture and audit in the same browser state. Set viewport 1080×1440 and DPR 1.
export async function captureCard(page,{url,output,name,inputHash,teaching}){
 await page.goto(url,{waitUntil:'networkidle',timeout:30000});
 await page.waitForFunction(()=>window.__READY__===true);
 await page.evaluate(()=>document.fonts.ready);
 const audit=await page.evaluate(({teaching})=>{
  const root=[...document.querySelectorAll('.card')].find(e=>getComputedStyle(e).display!=='none');
  if(!root)throw Error('找不到可见 .card');
  const errors=[],texts=[],rr=root.getBoundingClientRect();
  if(Math.abs(rr.width-1080)>.5||Math.abs(rr.height-1440)>.5)errors.push({type:'wrong-canvas'});
  for(const el of root.querySelectorAll('*')){
   const own=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());
   const style=getComputedStyle(el);
   if(!own.length||!el.getClientRects().length||style.visibility==='hidden'||style.opacity==='0')continue;
   const r=el.getBoundingClientRect(),font=parseFloat(style.fontSize),text=own.map(n=>n.textContent.trim()).join(' ');
   const role=el.matches('h1,h2,h3,.n strong')?'heading':el.closest('small,.wm,.eyebrow,.chapter-nav,svg,.tag,.chip')?'aux':'core';
   texts.push({text,font,role,x:r.x-rr.x,y:r.y-rr.y,w:r.width,h:r.height});
   const min=role==='heading'?34:role==='core'?28:24;
   if(teaching&&font<min)errors.push({type:'small-text',text,font,min});
   if(r.right>rr.right+.5||r.left<rr.left-.5||r.bottom>rr.bottom+.5||r.top<rr.top-.5)errors.push({type:'outside',text});
   if(el.clientWidth>0&&el.scrollWidth>el.clientWidth+2)errors.push({type:'horizontal-overflow',text});
   // Visible font ink/pseudo-arrows may extend beyond a line box without clipping.
   if(style.overflowY!=='visible'&&el.clientHeight>0&&el.scrollHeight>el.clientHeight+2)errors.push({type:'vertical-overflow',text});
  }
  for(const el of root.querySelectorAll('*')){
   if(!el.getClientRects().length)continue;
   const style=getComputedStyle(el);
   if(['hidden','clip','auto','scroll'].includes(style.overflowY)&&el.clientHeight>0&&el.scrollHeight>el.clientHeight+2)errors.push({type:'clipped-container',text:el.textContent.trim().slice(0,100)});
  }
  for(const node of root.querySelectorAll('.n,.node')){
   const nr=node.getBoundingClientRect();
   for(const el of node.querySelectorAll('strong,h2,p')){
    const tr=el.getBoundingClientRect();
    if(tr.top<nr.top||tr.bottom>nr.bottom)errors.push({type:'node-text-overflow',text:el.textContent});
   }
  }
  return {errors,texts,visibleText:root.innerText};
 },{teaching});
 const hit=teaching&&metaWording(audit.visibleText);
 if(hit)audit.errors.push({type:'introductory-copy',text:hit});
 await page.screenshot({path:output,animations:'disabled'});
 return {name,inputHash,imageHash:sha256(readFileSync(output)),...audit};
}
