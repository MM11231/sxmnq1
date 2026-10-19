export type District = '核心区' | '医疗区' | '训练区' | '居住区' | '商业区' | '公共空间';
export interface MapLocation {
  id: string;
  name: string;
  district: District;
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: 'tower' | 'garden' | 'arena';
  source: number | '扩展';
  description: string;
  access: string;
  actions: string[];
}

// 原设定中的楼层、店铺在地图上展开为可点选单元，不代表独立建筑。
export const locations: MapLocation[] = [
  { id: 'mission', name: '任务大厅', district: '核心区', x: 610, y: 475, w: 170, h: 117, kind: 'tower', source: 22, description: '核心建筑一层中庭。三层挑高穹顶下，任务光屏按危险等级排列；两翼设组队隔间，深处为赏金结算窗口。', access: '全天开放；接单须满足等级与组队要求', actions: ['浏览任务光屏', '前往组队协商区', '提交任务报告', '在情报角打听消息'] },
  { id: 'registry', name: '登记与评定处', district: '核心区', x: 520, y: 340, w: 125, h: 70, source: '扩展', description: '核心建筑的办事附楼。登记觉醒者身份，办理评级复核、住宅申请与离塔手续。', access: '工作日 09:00—17:00；离塔仍须获批', actions: ['咨询等级复核', '申请住宅升级', '查询办事进度'] },
  { id: 'archive', name: '任务档案馆', district: '核心区', x: 745, y: 340, w: 125, h: 70, source: '扩展', description: '与任务数据库相连的阅档设施。公开区域保管已脱敏的巡逻路线与任务复盘，机密库另行授权。', access: '公开阅档区 09:00—20:00；机密档案需授权', actions: ['查阅公开复盘', '研究污染记录', '预约阅档席位'] },
  { id: 'clinic', name: '治疗中心', district: '医疗区', x: 540, y: 110, w: 175, h: 130, source: 24, description: '北翼独立医疗建筑，覆盖 S 级屏蔽罩。一楼分诊，二楼常规诊室，三楼深度疏导，四楼急救隔离，地下为向导素储存区。', access: '按分诊与授权进入；急救隔离区限制通行', actions: ['登记污染初筛', '预约常规疏导', '查询值班安排', '递交疏导报告'] },
  { id: 'inhibitor', name: '抑制器维护站', district: '医疗区', x: 770, y: 130, w: 125, h: 100, source: 27, description: '治疗中心东侧的两层附楼。定期检测、功率校准与部件更换在一层进行；二层为限制进入的研发区。', access: '日常维护需登记；紧急维修窗口全天值班', actions: ['预约设备检测', '前往紧急维修窗口', '咨询外出型抑制器'] },
  { id: 'greenhouse', name: '低敏植物温室', district: '医疗区', x: 320, y: 125, w: 95, h: 80, kind: 'garden', source: '扩展', description: '培育宿舍区低敏植物的玻璃温室。温和植被与低声环境为接诊后的觉醒者提供休憩空间。', access: '10:00—18:00；培育区需工作人员陪同', actions: ['认养一株植物', '参加园艺照护', '坐在温室外休息'] },
  { id: 'gym', name: '室内体能馆', district: '训练区', x: 110, y: 350, w: 130, h: 90, source: 25, description: '配备觉醒者专用高阻力器械，内墙嵌冲击吸收层；训练馆与室外对抗场共同组成西翼训练区。', access: '全天开放；遵守训练场登记制度', actions: ['进行体能训练', '寻找陪练', '查看本周训练安排'] },
  { id: 'mental', name: '精神力训练室', district: '训练区', x: 280, y: 350, w: 135, h: 90, source: 25, description: '六间独立密闭训练舱，可模拟不同强度的哨兵精神波动，用于练习屏障构建与精神触丝操控。', access: '登记预约；遵循教练与设施安全要求', actions: ['预约训练舱', '练习精神屏障', '进行触丝精度训练'] },
  { id: 'arena', name: '室外实战场', district: '训练区', x: 115, y: 505, w: 270, h: 130, kind: 'arena', source: 25, description: '三块标准对抗场，周边设精神力屏障和二百人看台。高等级对练常吸引观众围坐。', access: '06:00—22:00；刷卡预约', actions: ['预约对抗场', '观摩公开对练', '参加哨向配合训练'] },
  { id: 'simulation', name: '模拟污染区入口', district: '训练区', x: 105, y: 675, w: 135, h: 60, source: 25, description: '训练场地下一层入口。人工低浓度污染用于耐受训练与实战疏导，入口设防护装备检查台。', access: '需签署风险告知书并佩戴应急抑制器', actions: ['查询开放安排', '登记受监督训练', '检查防护装备'] },
  { id: 'assessment', name: '考核专用场', district: '训练区', x: 290, y: 675, w: 125, h: 60, source: 25, description: '专用监测场地，全方位记录精神力与体征。半年度考核期间启用，平时上锁。', access: '仅考核或授权时开放', actions: ['查看考核公告', '咨询考核流程'] },
  { id: 'workshop', name: '训练器械维修库', district: '训练区', x: 110, y: 125, w: 170, h: 90, source: '扩展', description: '西翼保障附楼。收集损坏的训练器材，维修冲击吸收板与监测组件；入口旁有故障报修终端。', access: '报修台 08:00—18:00；库房不对外开放', actions: ['提交器械故障', '领取训练护具', '咨询装备保养'] },
  { id: 'dorm1', name: '1号新人公寓', district: '居住区', x: 995, y: 365, w: 125, h: 85, source: 97, description: 'D 至 C 级觉醒者的标准单人间。窗户密密排列，底层设公共洗衣房，楼道里仍带着新人的热闹。', access: '住户与登记访客；室外精神体限中型犬大小', actions: ['拜访登记住户', '查看楼内公告', '使用公共洗衣房'] },
  { id: 'dorm2', name: '2号新人公寓', district: '居住区', x: 1180, y: 365, w: 120, h: 85, source: 97, description: '新人标准公寓，与 4 号楼之间设共享厨房连廊。夜勤归来的人常在附近寻找简餐。', access: '住户与登记访客', actions: ['拜访登记住户', '领取洗衣物', '前往共享厨房'] },
  { id: 'dorm3', name: '3号标准宿舍', district: '居住区', x: 995, y: 505, w: 125, h: 85, source: 97, description: 'B 级觉醒者的四十五平方米套间，带客厅与简易厨房，可申请加固空间安置精神体。', access: '住户与登记访客', actions: ['拜访登记住户', '咨询空间加固', '查看生活公告'] },
  { id: 'dorm4', name: '4号标准宿舍', district: '居住区', x: 1180, y: 555, w: 120, h: 85, source: 97, description: '常规任务中坚力量的居所，灰蓝外墙和宽阔楼间距让这里显得安静。', access: '住户与登记访客', actions: ['拜访登记住户', '前往共享厨房', '使用公共洗衣房'] },
  { id: 'dorm5', name: '5号高级套房', district: '居住区', x: 995, y: 630, w: 125, h: 80, source: 97, description: 'A 级觉醒者专属双室套房，内置精神力屏蔽层与私人阳台。银灰曲面外墙夜间透出浅淡光纹。', access: '住户及获准访客', actions: ['提交访客登记', '咨询居住申请'] },
  { id: 'villa', name: '6号特勤庭院', district: '居住区', x: 1180, y: 110, w: 120, h: 130, kind: 'garden', source: 97, description: 'S 级或特殊贡献者的独栋别墅庭院，掩映在树影中，因住户常驻外地而经常空置。', access: '仅住户及获准访客', actions: ['提交访客申请', '从外围石径散步'] },
  { id: 'dorm7', name: '7号向导专属楼', district: '居住区', x: 995, y: 110, w: 130, h: 130, kind: 'tower', source: 98, description: '三重缓冲层包裹的向导居所。二层有六间冥想隔间和四台恢复舱，三层设互助办公区，楼顶露台种着白茶花与薰衣草。', access: '向导 ID 通行；哨兵未经许可不得入内', actions: ['预约冥想室', '查询恢复舱排号', '阅读互助留言板', '在楼顶露台休息'] },
  { id: 'kitchen', name: '共享厨房', district: '居住区', x: 1180, y: 475, w: 120, h: 28, source: 97, description: '2 号楼与 4 号楼之间的连廊餐厅，全天供应简餐。自助厨房需自备食材，偶尔因一道好菜聚起一桌邻居。', access: '24 小时供应简餐', actions: ['做一份夜宵', '准备自带食材', '与邻居拼桌'] },
  { id: 'parcel', name: '快递收发站', district: '居住区', x: 1180, y: 680, w: 135, h: 46, source: 97, description: '宿舍区入口的收发小站，包裹堆满货架，精神体也偶尔被主人派来帮忙。', access: '居民凭身份登记领取', actions: ['领取包裹', '寄送物品', '查询遗失包裹'] },
  { id: 'cafe', name: '星尘咖啡 · 2F', district: '商业区', x: 530, y: 840, w: 140, h: 80, source: 26, description: '商业综合体二层咖啡馆，落地窗俯瞰中庭，老板会把精神体造型拉进拿铁奶泡里。', access: '商业区营业时段 08:00—23:00', actions: ['点一杯精神体拉花拿铁', '与搭档喝下午茶', '坐在落地窗边'] },
  { id: 'bookstore', name: '白塔书店 · 2F', district: '商业区', x: 735, y: 840, w: 150, h: 80, source: 26, description: '兼营实体书与电子阅读器，设精神力理论和污染研究专区，角落沙发上常有人看书或补觉。', access: '08:00—23:00', actions: ['翻阅精神力理论', '购买阅读器', '寻找污染研究资料'] },
  { id: 'market', name: '综合超市 · 1F', district: '商业区', x: 520, y: 970, w: 150, h: 80, source: 26, description: '日用品和食品齐全，觉醒者专区供应压缩口粮、恢复补剂与感官舒缓贴。', access: '08:00—23:00；支持薪资账户付款', actions: ['补充出勤口粮', '购买日用品', '挑选舒缓贴'] },
  { id: 'canteen', name: '觉醒者食堂 · 1F', district: '商业区', x: 735, y: 970, w: 160, h: 80, source: 26, description: '三百人主餐厅，普通区与高蛋白特供区分列，午间排队的人常延伸到中庭。', access: '商业区营业时段内供应；按餐厅安排用餐', actions: ['领取高蛋白餐', '与同事拼桌', '吃一顿热饭'] },
  { id: 'equipment', name: '装备工坊 · 2F', district: '商业区', x: 520, y: 1090, w: 100, h: 65, source: 26, description: '修补战斗服、定做护具与校准精神力导体；大型订单需提前一周，加急收费翻倍。', access: '08:00—23:00；大型订单需预约', actions: ['修补战斗服', '预约护具定制', '咨询导体校准'] },
  { id: 'bar', name: '零度酒吧 · 2F', district: '商业区', x: 650, y: 1090, w: 100, h: 65, source: 26, description: '低酒精与无酒精特调，周五偶有小型演出。这里是结束夜勤后缓慢放松的角落。', access: '营业延长至 02:00', actions: ['点一杯无酒精特调', '听一场小型演出', '与熟人聊聊近况'] },
  { id: 'nightfood', name: '深夜食堂 · 1F', district: '商业区', x: 780, y: 1090, w: 110, h: 65, source: 26, description: '商业综合体角落的夜间窗口，退役 C 级向导经营，只做粥、面与小菜，从不追问来客的往事。', access: '22:00—02:00', actions: ['吃一碗热汤面', '喝一碗粥', '在柜台边稍作休息'] },
  { id: 'garden', name: '低敏静息庭园', district: '公共空间', x: 1000, y: 835, w: 290, h: 160, kind: 'garden', source: '扩展', description: '沿用宿舍区低敏植物体系的缓冲绿地。浅水池、廊架与长椅之间留出精神体活动的小路。', access: '公共步道开放；禁止攻击性精神力', actions: ['在池边坐坐', '遛一遛精神体', '与搭档沿廊架散步'] },
  { id: 'memorial', name: '归来纪念庭', district: '公共空间', x: 105, y: 930, w: 155, h: 130, kind: 'garden', source: '扩展', description: '西南侧安静的小庭院，记录在污染治理中失去的同伴。纪念墙前可放置花束与匿名留言。', access: '公共庭院；请保持安静', actions: ['献上一束花', '阅读纪念墙', '留下匿名留言'] },
  { id: 'dispatch', name: '外勤接驳站', district: '公共空间', x: 310, y: 960, w: 115, h: 80, source: '扩展', description: '南门旁的交通保障小站，接送获准出勤的队伍。区域路线须依任务调度确认，不提供自由离塔权限。', access: '持有效任务或离塔许可乘车', actions: ['查询外勤班次', '核对出勤名单', '等待任务接驳'] },
  { id: 'gate', name: '白塔南门', district: '公共空间', x: 622, y: 1228, w: 146, h: 34, source: '扩展', description: '通向四大特区交通网络的检查口。出塔人员需核验身份、许可与抑制器状态，城外深渊并非可自由游玩的安全区域。', access: '离塔需获批并佩戴抑制器', actions: ['查询通行流程', '提交许可核验', '查看特区交通信息'] },
];

export const districts: District[] = ['核心区', '医疗区', '训练区', '居住区', '商业区', '公共空间'];
export const districtColors: Record<District, string> = {
  核心区: '#d1b878', 医疗区: '#99bbb1', 训练区: '#bc9880', 居住区: '#a9b4c5', 商业区: '#c3a1ae', 公共空间: '#a7b58a',
};
