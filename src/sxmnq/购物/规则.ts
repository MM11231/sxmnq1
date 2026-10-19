import { 商品表, 店名, 礼物文本, type 商品, type 购物存档 } from './商品';
interface 状态 { 购物:购物存档; 主角:{金钱:number;精神力:number;精神力上限:number}; 日程:{天数:number;时段:number;考核目标:string;活动记录:string[]}; 世界:{地点:string}; 哨兵:Record<string,{好感:number;信赖:number}> }
function 记(data:状态,text:string){data.购物.记录.unshift(`第${data.日程.天数}天 · ${text}`);data.购物.记录=data.购物.记录.slice(0,12);data.日程.活动记录.push(text);}
export function 商品列表(data:状态,shop:string){return [...商品表,...data.购物.定制].filter(item=>item.店铺===shop);}
export function 购物耗时(data:状态,shop:string){return data.购物.购物日===data.日程.天数&&data.购物.逛过.includes(shop)?0:1;}
export function 购买(data:状态,shop:string,cart:Record<string,number>){
 if(!店名[shop])throw Error('这处地点没有商店。');
 if(data.日程.天数%2===1||data.日程.考核目标)throw Error('请在休息日、考核结束后购物。');
 const rows=Object.entries(cart).filter(([,n])=>n!==0).map(([id,n])=>{const item=商品列表(data,shop).find(item=>item.id===id);if(!item||!Number.isInteger(n)||n<1||n>9)throw Error('购物篮有无效商品或数量。');return {item,n};});
 if(!rows.length)throw Error('先挑选一件商品。');
 const cost=rows.reduce((sum,{item,n})=>sum+item.价格*n,0),time=购物耗时(data,shop);
 if(!Number.isFinite(cost)||cost<=0||data.主角.金钱<cost)throw Error(`金钱不足，需要 ${cost} 金。`);
 if(data.日程.时段+time>3)throw Error('今天没有空余时段了，可以明天值班结束后再来。');
 const count=new Set([...data.购物.背包.map(i=>i.id),...rows.map(r=>r.item.id)]).size;
 if(count>60||rows.some(({item,n})=>(data.购物.背包.find(i=>i.id===item.id)?.数量??0)+n>99))throw Error('背包已满，请先使用或送出物品。');
 data.主角.金钱-=cost;data.日程.时段+=time;
 if(data.购物.购物日!==data.日程.天数){data.购物.购物日=data.日程.天数;data.购物.逛过=[];}
 if(!data.购物.逛过.includes(shop))data.购物.逛过.push(shop);
 for(const {item,n}of rows){const held=data.购物.背包.find(i=>i.id===item.id);if(held)held.数量+=n;else data.购物.背包.push({...item,数量:n});}
 data.世界.地点='白塔·'+店名[shop];
 const text=`在${店名[shop]}购买${rows.map(r=>`${r.item.名称}×${r.n}`).join('、')}，花费 ${cost} 金${time?'，占用 1 时段':'，补买不占时段'}。`;记(data,text);return text;
}
function 减一(data:状态,id:string){const item=data.购物.背包.find(i=>i.id===id)!;item.数量--;data.购物.背包=data.购物.背包.filter(i=>i.数量>0);}
export function 使用(data:状态,id:string){
 if(data.日程.考核目标)throw Error('考核中不能使用补给。');
 const item=data.购物.背包.find(i=>i.id===id&&i.数量>0);if(!item||item.类型!=='补给'||item.恢复<=0)throw Error('请选择背包中的补给。');
 if(data.购物.使用日===data.日程.天数&&data.购物.已使用>=2)throw Error('今天已经使用两份补给了，休息也能恢复精力。');
 const amount=Math.max(0,Math.min(item.恢复,data.主角.精神力上限-data.主角.精神力));if(!amount)throw Error('精力已满，这份补给先留在背包里。');
 if(data.购物.使用日!==data.日程.天数){data.购物.使用日=data.日程.天数;data.购物.已使用=0;}
 data.购物.已使用++;data.主角.精神力+=amount;减一(data,id);const text=`使用${item.名称}，精力 +${amount}。`;记(data,text);return text;
}
export function 赠送(data:状态,id:string,name:string){
 if(data.日程.考核目标)throw Error('请先完成考核。');
 const person=Object.hasOwn(data.哨兵,name)?data.哨兵[name]:undefined,item=data.购物.背包.find(i=>i.id===id&&i.数量>0);
 if(!person||!item)throw Error('请选择已认识的哨兵和持有物品。');
 if(data.购物.赠礼日===data.日程.天数&&data.购物.已赠礼.includes(name))throw Error('今天已经送过这位哨兵礼物了。');
 if(data.购物.赠礼日!==data.日程.天数){data.购物.赠礼日=data.日程.天数;data.购物.已赠礼=[];}
 data.购物.已赠礼.push(name);const affection=Math.min(2,100-person.好感),trust=Math.min(1,100-person.信赖);person.好感+=affection;person.信赖+=trust;减一(data,id);
 const text=`送给${name}一份${item.名称}。对方收下并道谢。好感 +${affection}，信赖 +${trust}。`;记(data,text);return text;
}
export function 保存礼物(data:状态,shop:string,value:unknown):商品{
 if(!店名[shop])throw Error('请从商店进入定制。');if(data.购物.定制.length>=24)throw Error('已保存 24 款定制礼物，请先使用已有设计。');
 const gift:商品={...礼物文本(value),id:'custom-'+crypto.randomUUID(),店铺:shop,价格:80,类型:'礼物',恢复:0};data.购物.定制.push(gift);return gift;
}
