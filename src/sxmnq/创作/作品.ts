export interface 作品 { 标题: string; 笔名: string; 类型: '小说' | '随笔'; 名气: number; 期数: number; 首刊日: number; 最近刊登日: number; 最近日期: string }
export interface 创作 { 名气: number; 传播结算日: number; 作品: 作品[]; 场景日?: number; 场景名气?: number; 场景作品?: 作品[] }
export function 固定读者快照(记录: 创作, 天数: number) {
  if (记录.场景日 === 天数) return;
  记录.场景日 = 天数; 记录.场景名气 = 记录.名气;
  记录.场景作品 = 记录.作品.map(作 => ({ ...作 }));
}
export function 登记作品(记录: 创作, 输入: { 标题: string; 笔名: string; 类型: '小说' | '随笔'; 天数: number; 日期: string }) {
  const 标题 = 输入.标题.trim();
  const 笔名 = 输入.笔名.trim() || '匿名';
  if (!标题 || !输入.日期 || 输入.天数 < 1) throw Error('请先填写作品标题，并确认当前日期。');
  let 作 = 记录.作品.find(item => item.标题 === 标题 && item.笔名 === 笔名);
  if (作?.最近日期 === 输入.日期) return false;
  if (作 && 作.类型 !== 输入.类型) throw Error('同一作品的类型应保持一致。');
  if (!作) {
    if (记录.作品.length >= 20) throw Error('已有20部作品，请选择已有标题继续刊登。');
    作 = { 标题, 笔名, 类型: 输入.类型, 名气: 0, 期数: 0, 首刊日: 输入.天数, 最近刊登日: 输入.天数, 最近日期: '' };
    记录.作品.push(作);
  }
  作.期数++; 作.最近刊登日 = 输入.天数; 作.最近日期 = 输入.日期;
  作.名气 = Math.min(100, 作.名气 + 4);
  记录.名气 = Math.min(100, 记录.作品.reduce((总, item) => 总 + item.名气, 0));
  return true;
}
// 每个游戏日只传播一次。停更超过两周的作品不再自然增长；点击地图不增加任何值。
export function 结算传播(记录: 创作, 天数: number) {
  if (记录.传播结算日 >= 天数) return;
  for (const 作 of 记录.作品) if (天数 > 作.首刊日 && 天数 - 作.最近刊登日 <= 14) 作.名气 = Math.min(100, 作.名气 + 1);
  记录.传播结算日 = 天数;
  记录.名气 = Math.min(100, 记录.作品.reduce((总, item) => 总 + item.名气, 0));
}
