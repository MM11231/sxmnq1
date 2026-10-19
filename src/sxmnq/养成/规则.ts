export const 属性名 = ['力量', '精神', '学识', '魅力'] as const;
export type 属性 = (typeof 属性名)[number];
export type 等级 = 'D' | 'C' | 'B' | 'A' | 'S';
export interface 成长 { 等级: 等级; 经验: number; 力量: number; 精神: number; 学识: number; 魅力: number; 已通关: boolean }
export interface 日程 { 天数: number; 时段: number; 起始日期: string; 已接诊: number; 本日经验: number; 活动记录: string[]; 上日结算: string; 考核目标: string; 考核阶段: number; 偶遇: string }
export interface 活动 { 名称: string; 属性?: 属性; 收益: number; 消耗: number; 恢复?: number; 费用?: number }
export const 时段名 = ['上午', '下午', '晚上', '夜深'] as const;
export const 晋升表 = { D: { 目标: 'C', 门槛: 20, 考核: '中度污染疏导' }, C: { 目标: 'B', 门槛: 40, 考核: '抗干扰疏导' }, B: { 目标: 'A', 门槛: 65, 考核: '高危深度疏导' }, A: { 目标: 'S', 门槛: 85, 考核: '深渊救援' } } as const;
export function 是值班日(日: 日程) { return 日.天数 % 2 === 1; }
export function 晋升缺口(成长: 成长): string[] {
  if (成长.等级 === 'S') return [];
  const 门槛 = 晋升表[成长.等级].门槛;
  return [...(成长.经验 < 100 ? [`经验还差 ${100 - 成长.经验}`] : []), ...属性名.filter(名 => 成长[名] < 门槛).map(名 => `${名}还差 ${门槛 - 成长[名]}`)];
}
export function 活动列表(地点: { id: string; district: string }): 活动[] {
  const 休息: 活动 = { 名称: '坐下休息', 收益: 0, 消耗: 0, 恢复: 30 };
  const 消费: Record<string, 活动> = {
    cafe: { 名称:'喝咖啡与交流',属性:'魅力',收益:4,消耗:0,费用:20 },
    canteen: { 名称:'吃一顿热饭',收益:0,消耗:0,恢复:40,费用:10 },
    nightfood: { 名称:'吃一碗热汤面',收益:0,消耗:0,恢复:40,费用:15 },
    bookstore: { 名称:'购买学习资料并阅读',属性:'学识',收益:5,消耗:0,费用:30 },
    market: { 名称:'购买并使用恢复补剂',收益:0,消耗:0,恢复:60,费用:40 },
    equipment: { 名称:'维护训练装备',属性:'力量',收益:5,消耗:0,费用:60 },
    bar: { 名称:'喝特调与交流',属性:'魅力',收益:4,消耗:0,费用:25 },
    inhibitor: { 名称:'预约精神屏障指导',属性:'精神',收益:5,消耗:0,费用:40 },
  };
  if (消费[地点.id]) return [消费[地点.id], { 名称:'免费走访交流',属性:'魅力',收益:2,消耗:0 },休息];
  if (['gym','arena','simulation','assessment'].includes(地点.id)) return [{名称:'体能训练',属性:'力量',收益:3,消耗:0},休息];
  if (['mental','dorm7','greenhouse','garden'].includes(地点.id)) return [{名称:'冥想练习',属性:'精神',收益:3,消耗:0},休息];
  if (['archive','clinic'].includes(地点.id)) return [{名称:'学习与查阅',属性:'学识',收益:3,消耗:0},休息];
  return [{名称:'交流与走访',属性:'魅力',收益:3,消耗:0},休息];
}
export function 执行活动(日: 日程, 成长: 成长, 主角: { 精神力: number; 精神力上限: number; 金钱?: number }, 活: 活动) {
  if (是值班日(日)) throw Error('今天值班，请明天再探索。');
  if (日.时段 >= 3) throw Error('今天的活动已经结束，请休息到明天。');
  if (日.考核目标) throw Error('请先完成或取消正在进行的考核。');
  const 费用 = 活.费用 ?? 0;
  if ((主角.金钱 ?? 0) < 费用) throw Error(`金钱不足，需要 ${费用} 金，当前 ${主角.金钱 ?? 0} 金。可选择免费活动。`);
  if (费用) 主角.金钱 = (主角.金钱 ?? 0) - 费用;
  主角.精神力 = Math.min(主角.精神力上限, 主角.精神力 + (活.恢复 ?? 0));
  if (活.属性) 成长[活.属性] = Math.min(100, 成长[活.属性] + 活.收益);
  日.活动记录.push(`${时段名[日.时段]} · ${活.名称}${活.属性 ? `：${活.属性} +${活.收益}` : `：治疗精力 +${活.恢复 ?? 0}`}${费用 ? ` · 花费 ${费用} 金` : ' · 免费'}`);
  日.时段++;
}
export function 治疗经验(评级: string) { return ({ S: 20, A: 16, B: 12, C: 8 } as Record<string, number>)[评级] ?? 8; }
export function 登记治疗(日: 日程, 成长: 成长, 评级: string) {
  if (!是值班日(日)) throw Error('休息日不能治疗。');
  const 增加 = Math.min(100 - 成长.经验, 治疗经验(评级));
  成长.经验 += 增加;
  日.已接诊++;
  日.本日经验 += 增加;
  日.活动记录.push(`治疗评分 ${评级} · 经验 +${增加}`);
  return 增加;
}
export function 日历日期(起始: string, 天数: number) {
  const m = 起始.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return 天数 === 1 && 起始 ? 起始 : `游戏第${天数}天`;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 天数 - 1));
  return `${date.getUTCFullYear()}年${String(date.getUTCMonth() + 1).padStart(2, '0')}月${String(date.getUTCDate()).padStart(2, '0')}日`;
}
export function 结束一天(日: 日程, 主角: { 精神力: number; 精神力上限: number }) {
  if (日.考核目标) throw Error('考核尚未结束。');
  日.上日结算 = `第${日.天数}天 · ${是值班日(日) ? '值班日' : '休息日'}\n${日.活动记录.join('\n') || '今天提前休息。'}`;
  日.天数++; 日.时段 = 0; 日.已接诊 = 0; 日.本日经验 = 0; 日.活动记录 = []; 日.偶遇 = '';
  主角.精神力 = 主角.精神力上限;
}
export function 开始考核(日: 日程, 成长: 成长) {
  if (是值班日(日) || 日.时段 !== 0) throw Error('考核需要在休息日上午开始，占用上午与下午。');
  if (日.考核目标) throw Error('已经有考核正在进行。');
  if (成长.等级 === 'S' || 晋升缺口(成长).length) throw Error('晋升条件尚未满足。');
  日.考核目标 = 晋升表[成长.等级].目标; 日.考核阶段 = 0;
}
export function 结算考核(日: 日程, 成长: 成长, 评级: string) {
  const 目标 = 日.考核目标;
  if (!目标 || 成长.等级 === 'S' || 目标 !== 晋升表[成长.等级].目标) throw Error('无有效晋升考核。');
  const 成功 = 评级 === 'S' || 评级 === 'A';
  if (目标 === 'S' && 成功 && 日.考核阶段 === 0) { 日.考核阶段 = 1; return '救援第一阶段完成，请继续疏导第二名队员。'; }
  if (成功) { 成长.等级 = 目标 as 等级; 成长.经验 = 0; 成长.已通关 = 目标 === 'S'; }
  日.时段 = 2; 日.活动记录.push(`${目标}级考核：${成功 ? '通过' : '未通过，可重新准备'}`); 日.考核目标 = ''; 日.考核阶段 = 0;
  return 成功 ? `晋升${目标}级${目标 === 'S' ? '，已通关！之后可以继续自由游玩。' : '！'}` : '考核未通过，经验与属性保留。';
}
