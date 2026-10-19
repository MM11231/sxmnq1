export interface 商品 { id:string; 名称:string; 图标:string; 描述:string; 价格:number; 店铺:string; 类型:'礼物'|'补给'; 恢复:number }
export interface 持有物 extends 商品 { 数量:number }
export interface 购物存档 { 背包:持有物[]; 定制:商品[]; 购物日:number; 逛过:string[]; 赠礼日:number; 已赠礼:string[]; 使用日:number; 已使用:number; 记录:string[] }
export const 店名:Record<string,string>={cafe:'星尘咖啡',bookstore:'白塔书店',market:'综合超市',equipment:'装备工坊',bar:'零度酒吧',canteen:'觉醒者食堂',nightfood:'深夜食堂'};
const rows: [string,string,string,string,number,string,'礼物'|'补给',number][] = [
 ['tea','cafe','🍵','低因花茶',35,'淡淡花香的茶包，适合值班后的安静时刻。','礼物',0],
 ['coffee','cafe','☕','随行咖啡',25,'密封杯里装着温热咖啡，恢复 20 精力。','补给',20],
 ['cookie','cafe','🍪','手作饼干盒',55,'几块不太甜的黄油饼干，纸盒上系着细绳。','礼物',0],
 ['novel','bookstore','📖','口袋短篇集',60,'几篇适合在休息间隙读完的故事。','礼物',0],
 ['bookmark','bookstore','🔖','压花书签',30,'薄纸封住一片小花，夹在书页间不会硌手。','礼物',0],
 ['notebook','bookstore','📓','布面手帐',90,'耐磨封面和空白内页，可以记下随手想到的事。','礼物',0],
 ['patch','market','🩹','舒缓贴',30,'温和的感官舒缓贴，恢复 25 精力。','补给',25],
 ['tonic','market','🧃','恢复补剂',50,'方便携带的营养饮剂，恢复 50 精力。','补给',50],
 ['plant','market','🌱','低敏小盆栽',75,'不带浓烈气味的小盆栽，适合放在窗边。','礼物',0],
 ['flowers','market','💐','当季小花束',45,'用素纸包好的低敏花束，颜色随季节更换。','礼物',0],
 ['gloves','equipment','🧤','轻便训练手套',110,'掌心加了耐磨衬层，适合日常训练。','礼物',0],
 ['charm','equipment','🧿','金属挂饰',80,'小小的几何挂饰，可以挂在装备包的拉链上。','礼物',0],
 ['compass','equipment','🧭','袖珍指南针',150,'有刻度的小型指南针，附一只布袋。','礼物',0],
 ['soda','bar','🍹','无酒精果饮',35,'酸甜清爽的瓶装果饮，恢复 25 精力。','补给',25],
 ['music','bar','🎵','现场录音卡',85,'一张小型演出的录音卡，里面有几首舒缓乐曲。','礼物',0],
 ['coaster','bar','🟤','软木杯垫',40,'印着零度酒吧小标记的圆形软木杯垫。','礼物',0],
 ['meal','canteen','🍱','便携餐盒',30,'荤素搭配的外带餐盒，恢复 30 精力。','补给',30],
 ['fruit','canteen','🍊','水果小袋',20,'几只当季水果，方便与同事分享。','礼物',0],
 ['soup','nightfood','🥣','保温汤盒',35,'一份可以慢慢喝的热汤，恢复 35 精力。','补给',35],
 ['snack','nightfood','🥟','手包点心',45,'装在小盒里的点心，分量刚好够两个人尝尝。','礼物',0],
];
export const 商品表:商品[]=rows.map(([id,店铺,图标,名称,价格,描述,类型,恢复])=>({id,店铺,图标,名称,价格,描述,类型,恢复}));
export function 礼物文本(value:unknown) {
 if(!value || typeof value!=='object')throw Error('礼物格式不正确，请重新生成或手动填写。');
 const v=value as Record<string,unknown>;
 const text=(key:string,max:number)=>typeof v[key]==='string'?v[key].trim().replace(/[\u0000-\u001f]/g,' ').slice(0,max):'';
 const 名称=text('名称',24),描述=text('描述',140),raw=text('图标',24);
 if(!名称||!描述)throw Error('请填写礼物名称和简短描述。');
 const 图标=raw.match(/\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*/u)?.[0] || '🎁';
 return {名称,描述,图标};
}
export function 解析生成礼物(raw:string) {
 if(typeof raw!=='string'||raw.length>12000)throw Error('生成结果过长或为空，请重试。');
 const text=raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 try{return 礼物文本(JSON.parse(text));}catch{throw Error('没有收到有效的礼物资料，可以重试或手动填写。');}
}
