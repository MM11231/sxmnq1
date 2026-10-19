import { 固定数 } from '../创作/场景';
import { 年历位置, 今日节庆 } from './年历';
import { 执行活动 } from './规则';
import { locations } from '../界面/日程/地图/locations';
import type { Schema } from '../schema';

const 邀约形状 = z.object({
  id:z.string(), 天数:z.number(), 姓名:z.string(), 地点id:z.string(), 地点:z.string(),
  主题:z.string(), 正文:z.string(), 最早时段:z.number(),
  状态:z.enum(['待回应','已接受','已婉拒','已完成','已过期']),
});
export const 社交形状 = z.object({
  检查日:z.coerce.number().prefault(0),
  今日邀约:邀约形状.nullable().prefault(null),
  邀约记录:z.array(z.object({姓名:z.string(),天数:z.number()})).transform(v=>v.slice(-30)).prefault([]),
  偶遇日:z.coerce.number().prefault(0),
  偶遇记录:z.array(z.object({姓名:z.string(),天数:z.number()})).transform(v=>v.slice(-20)).prefault([]),
  待偶遇:z.object({姓名:z.string(),天数:z.number(),地点:z.string(),正文:z.string(),前置行动:z.string()}).nullable().prefault(null),
}).prefault({});
export type 邀约 = z.output<typeof 邀约形状>;
export type 哨兵社交 = z.output<typeof 社交形状>;

const 日常邀约 = [
  {地点id:'garden',主题:'庭园散步',话:'今天休息，有空一起去庭园走走吗？不用赶时间。'},
  {地点id:'bookstore',主题:'书店闲逛',话:'想去书店看看新书。你如果也有空，可以一起逛一会儿。'},
  {地点id:'cafe',主题:'窗边小坐',话:'今天想找个安静的地方坐坐，要不要在咖啡馆碰个面？只坐一会儿也可以。'},
  {地点id:'greenhouse',主题:'温室看花',话:'听说温室换了一批植物，要不要一起去看看？'},
  {地点id:'arena',主题:'场边观赛',话:'今天有一轮公开练习，我打算去场边看看。你有兴趣一起吗？'},
];
function 已接待的人(data:Schema){return Object.entries(data.哨兵).filter(([,人])=>人.已治疗>0&&人.污染度<=65).sort(([a],[b])=>a.localeCompare(b));}
function 记见闻(data:Schema,地点:string,标题:string,正文:string,结果:string){
  data.世界.生活.遭遇记录.push({日期:data.世界.日期,地点,标题,正文,结果});
  data.世界.生活.遭遇记录=data.世界.生活.遭遇记录.slice(-8);
  const 文=`${标题}：${正文}（${结果}）`;
  data.日程.活动记录.push(文);data.日程.偶遇+=(data.日程.偶遇?'\n':'')+文;
  return 文;
}
/** 只在实际进入休息日地图且尚未行动时检查一次，刷新不会重掷。 */
export function 准备今日邀约(data:Schema){
  const 社=data.世界.生活.社交,日=data.日程.天数;
  if(社.今日邀约&&社.今日邀约.天数!==日&&['待回应','已接受'].includes(社.今日邀约.状态))社.今日邀约.状态='已过期';
  if(社.待偶遇?.天数!==日)社.待偶遇=null;
  if(data.主角.路线!=='白塔向导路线'||日%2||社.检查日===日||data.日程.考核目标)return null;
  社.检查日=日;
  if(data.日程.时段!==0||data.世界.生活.探索.待处理||社.待偶遇)return null;
  const 历=年历位置(日,data.日程.历法偏移),节=今日节庆(历);
  const 人选=已接待的人(data).filter(([名,人])=>人.信赖>=20&&!社.邀约记录.some(r=>r.姓名===名&&日-r.天数<6));
  if(!人选.length||固定数(`${日}/邀约出现`) >= (节 ? .75 : .35))return null;
  const [姓名]=人选[Math.floor(固定数(`${日}/邀约人`)*人选.length)];
  const 常=日常邀约[Math.floor(固定数(`${日}/${姓名}/邀约地点`)*日常邀约.length)];
  const 地点id=节?节.地点[Math.floor(固定数(`${日}/${姓名}/节庆地点`)*节.地点.length)]:常.地点id;
  const 地点=locations.find(l=>l.id===地点id)!;
  const 主题=节?.名称??常.主题;
  const 正文=节?`“今天有${节.名称}的活动，要不要一起去${地点.name.replace(/ · [12]F/,'')}看看？如果已经有安排也没关系。”`: `“${常.话}”`;
  社.今日邀约={id:`${日}:${姓名}:${地点id}`,天数:日,姓名,地点id,地点:地点.name,主题,正文,最早时段:节?.id==='stars'?2:0,状态:'待回应'};
  社.邀约记录.push({姓名,天数:日});社.邀约记录=社.邀约记录.slice(-30);
  return 社.今日邀约;
}
export function 回应邀约(data:Schema,接受:boolean){
  const 约=data.世界.生活.社交.今日邀约;
  if(!约||约.状态!=='待回应')throw Error('这份邀请已经回应过了。');
  if(约.天数!==data.日程.天数||data.日程.天数%2){约.状态='已过期';return '邀请已经过期，没有扣除关系值。';}
  if(!data.哨兵[约.姓名]||data.哨兵[约.姓名].已治疗<=0){约.状态='已过期';return '对方的档案暂时不可用，邀请已收起。';}
  约.状态=接受?'已接受':'已婉拒';
  return 接受?`已接受${约.姓名}的邀请。前往${约.地点}，点击“参加活动”赴约；现在不消耗时段。`:'已婉拒邀请。对方表示理解，今天可以自由安排。';
}
export function 当前邀约(data:Schema){const 约=data.世界.生活.社交.今日邀约;return 约?.天数===data.日程.天数&&约.状态==='已接受'?约:null;}
export function 参加邀约(data:Schema,地点id:string){
  const 约=当前邀约(data),社=data.世界.生活.社交;
  if(!约||约.地点id!==地点id)throw Error('这里没有已接受的邀请。');
  if(data.日程.天数%2||data.日程.时段>=3||data.日程.时段<约.最早时段)throw Error(约.最早时段===2?'活动晚上开始，请先安排其他时段。':'当前无法赴约。');
  if(社.待偶遇||data.世界.生活.探索.待处理||data.日程.考核目标)throw Error('请先处理当前事件。');
  const 人=data.哨兵[约.姓名];if(!人||人.已治疗<=0)throw Error('对方的档案暂时不可用。');
  const 原精力=data.主角.精神力;
  执行活动(data.日程,data.向导,data.主角,{名称:`参加活动 · ${约.主题} · ${约.姓名}`,收益:0,消耗:0,恢复:15});
  const 原信赖=人.信赖,原好感=人.好感;人.信赖=Math.min(100,人.信赖+2);人.好感=Math.min(100,人.好感+1);约.状态='已完成';
  data.世界.地点='白塔·'+约.地点.replace(/ · [12]F/,'');
  const 历=年历位置(data.日程.天数,data.日程.历法偏移),节=今日节庆(历);
  data.世界.生活.探索.触发日=data.日程.天数;
  if(节?.名称===约.主题){const 键=`${历.年}:${节.id}`;if(!data.世界.生活.探索.节庆足迹.includes(键))data.世界.生活.探索.节庆足迹.push(键);data.世界.生活.探索.节庆足迹=data.世界.生活.探索.节庆足迹.slice(-24);}
  const 文=记见闻(data,约.地点,'与'+约.姓名+'赴约',`你们一起参加了${约.主题}，聊过几件近事，结束后各自继续今天的安排。`,`信赖 +${人.信赖-原信赖}，好感 +${人.好感-原好感}，占用1个时段，免费`);
  return `${约.地点}\n${文}\n精力 +${data.主角.精神力-原精力}，剩余${3-data.日程.时段}个时段。不预设恋爱关系或亲密接触。`;
}
/** 一项地点行动结算后调用；不在浏览建筑、接受邀请或购物窗口里触发。 */
export function 安排哨兵偶遇(data:Schema,地点:{id:string;name:string;district:string},原时段:number){
  const 社=data.世界.生活.社交,日=data.日程.天数;
  if(日%2||data.日程.考核目标||社.待偶遇||社.偶遇日===日||data.世界.生活.探索.待处理||data.世界.生活.探索.触发日===日)return null;
  if(data.日程.时段!==原时段+1)return null;
  const 种=`${日}/${原时段}/${地点.id}/熟人偶遇`,约=当前邀约(data);
  const 人选=已接待的人(data).filter(([名])=>名!==约?.姓名&&!社.偶遇记录.some(r=>r.姓名===名&&日-r.天数<4));
  if(!人选.length||固定数(种+'/出现')>=.35)return null;
  const [姓名,人]=人选[Math.floor(固定数(种+'/人')*人选.length)];
  const 情景:Record<string,string>={核心区:'正把几张办事材料收进文件袋，抬头时认出了你。',医疗区:'刚办完一项日常检查，在门外整理袖口时看见了你。',训练区:'刚结束一轮练习，拿着水杯在场边休息，恰好与你对上目光。',居住区:'提着日用品从门厅出来，走近后放慢了脚步。',商业区:'正站在一侧看着店里的展示，转身时认出了你。',公共空间:'沿步道慢慢走来，在路口与你遇见。'};
  社.偶遇日=日;data.世界.生活.探索.触发日=日;
  社.待偶遇={姓名,天数:日,地点:地点.name,正文:`完成刚才的行动后，你在${地点.name.replace(/ · [12]F/,'')}遇见了${姓名}。对方${情景[地点.district]??'经过这里，认出你后点了点头。'}你记得曾为这位${人.等级}级哨兵做过疏导。`,前置行动:data.日程.活动记录.at(-1)??''};
  return 社.待偶遇;
}
export function 回应哨兵偶遇(data:Schema,交谈:boolean){
  const 社=data.世界.生活.社交,待=社.待偶遇;if(!待)throw Error('这次相遇已经处理过了。');
  if(待.天数!==data.日程.天数){社.待偶遇=null;return '这次相遇已经过去，没有重复结算。';}
  const 人=data.哨兵[待.姓名];let 增加=0;
  if(交谈&&人?.已治疗>0){const 原=人.信赖;人.信赖=Math.min(100,原+1);增加=人.信赖-原;}
  const 正文=交谈&&人?.已治疗>0?`你与${待.姓名}聊了几句近况。短暂的交谈结束后，你们各自继续原来的安排。`:`你向${待.姓名}点头致意，随后继续自己的安排。`;
  const 文=记见闻(data,待.地点,'偶遇'+待.姓名,正文,`信赖 +${增加}，不额外占用时段`);
  社.偶遇记录.push({姓名:待.姓名,天数:待.天数});社.偶遇记录=社.偶遇记录.slice(-20);社.待偶遇=null;
  return `${待.地点} · ${待.前置行动}\n${文}`;
}
