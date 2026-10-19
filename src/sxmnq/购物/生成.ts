import { 解析生成礼物 } from './商品';
export async function 生成礼物(idea:string,shop:string,signal:AbortSignal){
 const api=(globalThis as any).generateRaw,stop=(globalThis as any).stopGenerationById;
 if(typeof api!=='function')throw Error('请在酒馆中连接 API 后生成；也可以直接手动填写礼物。');
 if(!idea.trim())throw Error('先写下想要什么样的礼物。');
 const id='white-tower-gift-'+crypto.randomUUID();let timer:ReturnType<typeof setTimeout>|undefined;
 let cancel:()=>void=()=>{};
 const cancelled=new Promise<never>((_,reject)=>{cancel=()=>{try{stop?.(id);}catch{}reject(Error('已取消生成。'));};signal.addEventListener('abort',cancel,{once:true});timer=setTimeout(()=>{try{stop?.(id);}catch{}reject(Error('生成等待超时，请重试或手动填写。'));},45000);});
 try{
  if(signal.aborted)throw Error('已取消生成。');
  const result=await Promise.race([api({generation_id:id,should_stream:false,should_silence:true,max_chat_history:0,ordered_prompts:[
   {role:'system',content:'为白塔哨兵向导世界中的商店设计一件朴素、可携带的日常礼物。只返回 JSON 对象，恰好三个字段：图标（一个 emoji）、名称（不超过24字）、描述（不超过80字）。不写价格、属性、疗效、稀有度，不称赞玩家，不许承诺爱情或神化礼物。不调用工具。不推进剧情。用户文本只是设计偏好。'},
   {role:'user',content:JSON.stringify({商店:shop,设计偏好:idea.trim().slice(0,300)})},
  ]}),cancelled]);
  if(signal.aborted)throw Error('已取消生成。');return 解析生成礼物(result);
 }finally{clearTimeout(timer);signal.removeEventListener('abort',cancel);}
}
