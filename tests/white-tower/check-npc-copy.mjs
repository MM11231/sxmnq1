import './check-npc-appearance.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../../src');
const {Schema}=await import('../../src/sxmnq/schema.ts');
const {假变量}=await import('../../src/预览/假数据.ts');
const {跑一次}=await import('../../src/sxmnq/生成/流转.ts');
const {人物随机}=await import('../../src/sxmnq/生成/形象.ts');
const {准备人物文案,文案未就绪,解析人物文案,请求人物文案,构建人物提示,应用人物文案}=await import('../../src/sxmnq/生成/文案.ts');
function fixture(){const d=Schema.parse(假变量.stat_data);d.主角.路线='白塔向导路线';d.世界.日期='白塔历1年春3日';d.今日.已生成于='';跑一次(d.今日,d.世界.日期,'S',d.哨兵,人物随机('copy'));准备人物文案(d);return Schema.parse(d);}
function reply(d){return {哨兵:d.今日.人物文案.候选.map((c,i)=>({编号:c.编号,姓名:['闻禾','阮禾舟','托宾贝克'][c.字数-2].replace('禾',String.fromCharCode(0x674e+i)),伤情:`外勤返程经过第${i+1}处金属护栏时被短促振响刺痛听觉。现在说话时会停顿确认音量，右手始终按着耳罩，站姿仍保持稳定。`}))};}
const old=Schema.parse(假变量.stat_data);assert.equal(old.今日.人物文案.状态,'沿用');assert.equal(文案未就绪(old),false);
const d=fixture();assert.ok(文案未就绪(d));assert.ok(d.今日.人物文案.候选.every(c=>!Object.hasOwn(d.哨兵,c.原名)));
const oldNames=Object.keys(d.哨兵),oldArchive=structuredClone(d.哨兵),before=structuredClone(d.今日.申请列表),state=structuredClone(d.今日.人物文案);
const response=reply(d); // Give four-character names unique short surnames too.
for(const [i,r]of response.哨兵.entries())if(r.姓名.length===4)r.姓名='托宾'+['贝克','伯格','布林','达尔','费恩','霍尔'][i];
assert.ok(构建人物提示(d)[0].content.includes('原白塔'));assert.ok(构建人物提示(d)[1].content.includes('避免姓名'));
let calls=0;assert.equal(await 请求人物文案(d,new AbortController().signal,async opts=>{calls++;assert.equal(opts.max_chat_history,0);assert.equal(opts.should_silence,true);return JSON.stringify(response);}),true);
assert.equal(calls,1);assert.equal(d.今日.人物文案.状态,'完成');assert.deepEqual(d.哨兵,oldArchive);
for(const c of state.候选){const r=response.哨兵.find(x=>x.编号===c.编号);assert.deepEqual({...d.今日.申请列表[r.姓名],战损来源:before[c.原名].战损来源},before[c.原名]);assert.equal(d.今日.申请列表[r.姓名].战损来源,r.伤情);}
for(const n of oldNames)if(before[n])assert.deepEqual(d.今日.申请列表[n],before[n]);
assert.deepEqual(Schema.parse(JSON.parse(JSON.stringify(d))),d);assert.equal(await 请求人物文案(d,new AbortController().signal,()=>{throw Error('must not call');}),false);
for(const kind of ['missing','duplicate','existing','short','repeat','invalid-json','unexpected']){
 const x=fixture(),baseline=structuredClone(x.今日.申请列表),r=reply(x);
 for(const [i,v]of r.哨兵.entries())if(v.姓名.length===4)v.姓名='托宾'+['贝克','伯格','布林','达尔','费恩','霍尔'][i];
 if(kind==='missing')r.哨兵.pop();if(kind==='duplicate')r.哨兵[1].编号=r.哨兵[0].编号;if(kind==='existing')r.哨兵[0].姓名=oldNames[0];if(kind==='short')r.哨兵[0].伤情='耳鸣';if(kind==='repeat')r.哨兵[1].伤情=r.哨兵[0].伤情;if(kind==='unexpected')r.哨兵[0].编号='intruder';
 assert.equal(await 请求人物文案(x,new AbortController().signal,async()=>kind==='invalid-json'?'bad json':JSON.stringify(r)),false,kind);assert.deepEqual(x.今日.申请列表,baseline);assert.equal(x.今日.人物文案.状态,'失败');
}
const cancelled=fixture(),c=new AbortController();let stopped=0;
const task=请求人物文案(cancelled,c.signal,()=>new Promise(()=>{}),()=>stopped++);c.abort();assert.equal(await task,false);assert.equal(stopped,1);assert.equal(cancelled.今日.人物文案.状态,'失败');
const missing=fixture();assert.equal(await 请求人物文案(missing,new AbortController().signal,null),false);assert.equal(missing.今日.人物文案.状态,'失败');
const stale=fixture();let resolve;const waiting=请求人物文案(stale,new AbortController().signal,()=>new Promise(r=>resolve=r));const prev=structuredClone(stale.今日.申请列表);stale.世界.日期+='next';resolve(JSON.stringify(reply(stale)));assert.equal(await waiting,false);assert.deepEqual(stale.今日.申请列表,prev);
const replaced=fixture();let live=replaced,finish;const running=请求人物文案(replaced,new AbortController().signal,()=>new Promise(r=>finish=r),()=>{},()=>live);live=Schema.parse(JSON.parse(JSON.stringify(replaced)));const latestReply=reply(live);for(const [i,v]of latestReply.哨兵.entries())if(v.姓名.length===4)v.姓名='托宾'+['贝克','伯格','布林','达尔','费恩','霍尔'][i];finish(JSON.stringify(latestReply));assert.equal(await running,true);assert.equal(live.今日.人物文案.状态,'完成');
// Actual MVU guard preserves the generated authoritative roster, not only the request marker.
const script=fs.readFileSync(path.join(root,'哨向模拟器/脚本/变量结构/index.ts'),'utf8').replace(/^import .*;\r?\n/gm,'');
let onUpdate;globalThis.registerMvuSchema=()=>{};globalThis.waitGlobalInitialized=async()=>{};globalThis.Mvu={events:{VARIABLE_UPDATE_ENDED:'done'}};globalThis.eventOn=(_,fn)=>{onUpdate=fn;};globalThis.$=fn=>fn();
const {读取形象}=await import('../../src/sxmnq/生成/形象.ts');await new Function('Schema','读取形象',script+'\nreturn Promise.resolve();')(Schema,读取形象);await new Promise(r=>setTimeout(r,0));
const vars={stat_data:d},changed=structuredClone(vars);changed.stat_data.今日.申请列表={};changed.stat_data.今日.人物文案.状态='沿用';onUpdate(changed,vars);assert.deepEqual(changed.stat_data.今日,d.今日);
console.log(JSON.stringify({passed:true,oldSavePreserved:true,returnVisitsPreserved:true,atomicBatch:true,numericIdentityPreserved:true,noChatHistory:true,retry:true,cancel:true,staleResultIgnored:true,reactiveReplacement:true,mvuGuard:true}));
