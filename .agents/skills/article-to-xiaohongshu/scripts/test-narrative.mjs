import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateNarrative} from './validate-narrative.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'narrative-validation-'));
fs.mkdirSync(path.join(dir,'data'));
const base={
 'source.json':{url:'https://example.test/article',title:'检索后生成',capturedAt:'2026-09-27',sections:[{id:'s1',heading:'检索',paragraphs:['先查询文档，再对候选排序。']},{id:'s2',heading:'生成',paragraphs:['用检索到的文档组装输入并生成答案。']}]},
 'narrative-plan.json':{goal:'说明检索与生成的联系',throughline:'检索为生成提供文档',pages:[{slug:'retrieve',sourceIds:['s1'],question:'怎样找文档',answer:'查询后排序',fromPrevious:'从总问题进入检索',toNext:'将文档交给生成',claims:[{text:'查询后排序',sourceId:'s1',quote:'先查询文档，再对候选排序。'}]},{slug:'generate',sourceIds:['s2'],question:'怎样使用文档',answer:'组装输入生成',fromPrevious:'使用上页文档',toNext:'回到总问题',claims:[{text:'文档组成输入',sourceId:'s2',quote:'用检索到的文档组装输入并生成答案。'}]}]},
 'visual-plan.json':{cards:[{slug:'retrieve'},{slug:'generate'}]},
 'cards.json':{pages:[{slug:'retrieve'},{slug:'generate'}]}
};
function run(change){const data=structuredClone(base);change?.(data);for(const [name,v] of Object.entries(data))fs.writeFileSync(path.join(dir,'data',name),JSON.stringify(v));return validateNarrative(dir);}
assert.deepEqual(run(),[]);
assert(run(d=>d['narrative-plan.json'].pages[0].claims[0].quote='吞吐量提高十倍').some(e=>e.includes('引文不在')));
assert(run(d=>d['narrative-plan.json'].pages[0].sourceIds=['invented']).some(e=>e.includes('不存在的章节')));
assert(run(d=>delete d['narrative-plan.json'].pages[1].fromPrevious).some(e=>e.includes('fromPrevious')));
assert(run(d=>d['cards.json'].pages.reverse()).some(e=>e.includes('顺序不一致')));
assert(run(d=>{d['narrative-plan.json'].pages.reverse();d['visual-plan.json'].cards.reverse();d['cards.json'].pages.reverse();}).some(e=>e.includes('倒置')));
console.log('PASS 6 tests: valid plan, fabricated quote, missing source, missing transition, page mismatch, reversed argument');
