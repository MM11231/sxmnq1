export const 四季 = ['春', '夏', '秋', '冬'] as const;
export type 季节 = typeof 四季[number];
export interface 历日 { 年: number; 季: 季节; 日: number; 序: number; 总日: number }
export interface 节庆 { id: string; 名称: string; 季: 季节; 起: number; 止: number; 地点: string[]; 简介: string; 场景: string }
export const 节庆表: readonly 节庆[] = [
  {id:'flower',名称:'花朝节',季:'春',起:6,止:7,地点:['greenhouse','garden','market'],简介:'温室花展与自愿赠花，保留两天轻松的春日相聚。',场景:'入口摆出了花朝花展的手写牌，来客停下来辨认花名。'},
  {id:'springwater',名称:'春泉祭',季:'春',起:16,止:17,地点:['mission','garden','canteen'],简介:'喷泉净水展示与春日汤品，仪式简短，随时可以离场。',场景:'春泉祭的净水展台旁，工作人员正展示一瓶澄清的水样。'},
  {id:'tower',名称:'建塔日',季:'春',起:26,止:27,地点:['archive','mission','registry'],简介:'旧档案展与退役人员返塔交流，庆典不改变治疗排班。',场景:'建塔纪念展摆着旧照片，几位返塔的退役人员低声交谈。'},
  {id:'arrival',名称:'新星入塔',季:'夏',起:4,止:5,地点:['registry','dorm1','parcel'],简介:'新人报到与地图导览压缩为两天，后续适应融入普通日常。',场景:'报到处摆着新人的行李和导览图，有人正核对宿舍方向。'},
  {id:'glow',名称:'森海荧光节',季:'夏',起:14,止:15,地点:['greenhouse','garden','bookstore'],简介:'荧光植物小展与草木识别，控制灯光和人流。',场景:'遮光展棚中亮着细小的蓝绿色荧光，入口提醒来客放轻声音。'},
  {id:'stars',名称:'夏夜星芒',季:'夏',起:26,止:27,地点:['garden','dorm7','cafe'],简介:'白天布置星图，晚上相约观星；阴雨天改为室内星图分享。',场景:'夏夜星芒的星图已经展开，值班人员在旁边确认晚间天气。'},
  {id:'companions',名称:'伴生竞技日',季:'秋',起:4,止:5,地点:['gym','arena','mental'],简介:'把竞技周缩为两天趣味赛，观赛与辅助计时均可自愿参与。',场景:'伴生趣味赛的软障碍摆在场边，参赛者正与精神体热身。'},
  {id:'harvest',名称:'秋狩献礼',季:'秋',起:14,止:15,地点:['mission','equipment','dispatch'],简介:'外勤成果小展与材料交流，不强制参与拍卖或消费。',场景:'回收材料标上了产地，工作人员正在整理外勤成果展。'},
  {id:'leaves',名称:'落叶祭',季:'秋',起:26,止:27,地点:['memorial','garden'],简介:'献花与匿名留言，以安静陪伴为主，治疗与休息照常轮替。',场景:'纪念墙前放着白花和空白留言卡，经过的人可以安静停留。'},
  {id:'snow',名称:'初雪日',季:'冬',起:4,止:5,地点:['garden','dorm2','nightfood'],简介:'暖饮与冬衣互助；以入冬为主题，不强制天气变成下雪。',场景:'入冬互助桌摆好了保暖物资，热饮旁的小牌写着“初雪日”。'},
  {id:'ice',名称:'破冰节',季:'冬',起:14,止:15,地点:['arena','garden','canteen'],简介:'小型冰雕展示与热饮桌；暖天可在冷藏展柜旁观看。',场景:'破冰节的冰雕展柜亮着冷光，旁边的热饮桌冒着白气。'},
  {id:'longnight',名称:'长夜安眠',季:'冬',起:29,止:30,地点:['canteen','market','nightfood'],简介:'两天年末暖食与留言交换，冬30日结束后进入新年春1日。',场景:'年末的暖灯已经亮起，小摊放着便签和可以带走的热食。'},
];
export function 年历位置(天数: number, 偏移 = 0): 历日 {
  const 总日 = Math.max(0, Math.floor(天数) - 1 + Math.trunc(偏移));
  const 序 = 总日 % 120;
  return { 年: Math.floor(总日 / 120) + 1, 季: 四季[Math.floor(序 / 30)], 日: 序 % 30 + 1, 序, 总日 };
}
export function 格式日期(历: 历日) { return `白塔历${历.年}年${历.季}${历.日}日`; }
export function 今日节庆(历: 历日) { return 节庆表.find(节 => 节.季 === 历.季 && 历.日 >= 节.起 && 历.日 <= 节.止); }
export function 下一节庆(历: 历日) {
  return 节庆表.map(节 => ({ 节, 还有: (四季.indexOf(节.季) * 30 + 节.起 - 1 - 历.序 + 120) % 120 || 120 })).sort((a,b)=>a.还有-b.还有)[0];
}
function 中文数(文: string) {
  const 数:Record<string,number>={一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
  if (/^\d+$/.test(文)) return Number(文);
  if (文.includes('十')) { const [前,后]=文.split('十');return (数[前]||1)*10+(数[后]||0); }
  return 数[文] || 1;
}
/** 旧公历三个月折成一季30天，仅用于一次迁移。此后不使用真实日期计算游戏时间。 */
export function 旧日期位置(日期: string, 季节提示 = ''): number {
  const 新 = 日期.match(/白塔历(\d+)年([春夏秋冬])(\d+)日/);
  if (新) return (Math.max(1,+新[1])-1)*120+四季.indexOf(新[2] as 季节)*30+Math.min(30,Math.max(1,+新[3]))-1;
  const 数字 = 日期.match(/(?:\d{4}\D+)?(\d{1,2})[月/-](\d{1,2})/);
  const 中文 = 日期.match(/([一二三四五六七八九十]+)月([一二三四五六七八九十]+)/);
  const 月 = 数字 ? +数字[1] : 中文 ? 中文数(中文[1]) : 0;
  const 日 = 数字 ? +数字[2] : 中文 ? 中文数(中文[2]) : 1;
  if (月>=1&&月<=12) {
    const 序月=(月+9)%12;
    return Math.floor(序月/3)*30+(序月%3)*10+Math.min(9,Math.floor((Math.max(1,日)-1)/3));
  }
  const 季 = 四季.find(季=>季节提示.includes(季)) ?? '春';
  return 四季.indexOf(季)*30;
}
export function 转换旧年历(data: {日程:{天数:number;历法版本:number;历法偏移:number;起始日期:string};世界:{日期:string;季节:string;生活:{更新日:number};报纸供稿?:{日期:string}[];报纸投稿?:{日期:string}[]};今日:{已生成于:string}}) {
  if (data.日程.历法版本 === 1) return false;
  const 旧 = data.世界.日期;
  const 今天序 = 旧日期位置(旧 || data.日程.起始日期,data.世界.季节);
  const 第几年 = Math.floor((data.日程.天数-1)/120);
  data.日程.历法偏移 = (旧.includes('白塔历') ? 今天序 : 第几年*120+今天序) - (data.日程.天数-1);
  const 新 = 格式日期(年历位置(data.日程.天数,data.日程.历法偏移));
  // 日期改名不代表过了一天，保留已经掷好的候诊名单与今天的报纸。
  if (data.今日.已生成于 === 旧) data.今日.已生成于 = 新;
  for(const list of [data.世界.报纸供稿,data.世界.报纸投稿])for(const 稿 of list ?? [])if(稿.日期===旧)稿.日期=新;
  data.日程.历法版本=1;data.世界.生活.更新日=0;data.世界.日期=新;
  return true;
}
export function 节庆场景(地点id: string, 历?: 历日, 时段 = 0) {
  if(!历)return '';
  const 节=今日节庆(历);
  if(!节?.地点.includes(地点id))return '';
  return `【${节.名称} · ${历.季}${节.起}—${节.止}日】${节.场景}${节.id==='stars'&&时段<2?'晚间活动尚未开始。':''}`;
}
