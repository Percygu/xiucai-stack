import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateVisibleCopy} from './validate-visible-copy.mjs';

const job=mkdtempSync(join(tmpdir(),'social-visible-copy-'));
const put=(name,data)=>writeFileSync(join(job,name),JSON.stringify(data));
mkdirSync(join(job,'data'));mkdirSync(join(job,'qa'));
try{
 const good={pages:[{title:'KV Cache 减少重复计算',html:'<p>接下来，把 KV Cache 按块分配和管理。</p>'}]};
 put('data/cards.json',good);
 put('data/source.json',{quote:'上一页与下一页是原文中的分页示例。'});
 assert.deepEqual(validateVisibleCopy(job),[],'direct explanation passes; source remains untouched');
 put('data/cards.json',{pages:[{html:'<strong>本页</strong><span>结论</span><p>缓存占用显存。</p>'}]});
 assert.equal(validateVisibleCopy(job).length,1,'split HTML label must be rejected');
 put('data/cards.json',{pages:[{subtitle:'&#19979;一页继续介绍缓存。'}]});
 assert.equal(validateVisibleCopy(job).length,1,'encoded visible wording must be rejected');
 put('data/cards.json',good);
 put('qa/render-audit.json',[{name:'07-kv-reuse.png',visibleText:'KV Cache\n本页结论\n缓存占用显存。'}]);
 assert.equal(validateVisibleCopy(job).length,1,'template-injected text must be rejected even with clean source data');
 put('qa/render-audit.json',[{name:'07-kv-reuse.png',visibleText:'KV Cache 复用历史计算。接下来按块管理缓存。'}]);
 assert.deepEqual(validateVisibleCopy(job),[],'rendered substantive transition passes');
 console.log('PASS 5 visible-copy tests: direct content, HTML labels, entities, template injection, rendered transitions');
}finally{rmSync(job,{recursive:true});}
