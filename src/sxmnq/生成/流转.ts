/**
 * 流转 —— 掷完的人怎么进 申请列表, 以及「一天只掷一次」这件事。
 *
 * ★ 2026-10-06「名单直出」之后, 这个文件**塌成了一件事**:
 *
 *     世界.日期 变了 ──► 掷一批() ──► 今日.申请列表 = 它
 *
 * 改之前这里有**两条路**通向同一个地方 (AI 报到 / AI 回填姓名), 还有一张
 * 「掷好了等人来」的名单 (待登记), 界面上显示成「未到 · 01」。两样都删了。
 *
 * 删得掉的理由是**方向反了过来**: 名单现在是**权威** —— 掷出来的人当场就是
 * 申请人, 正文照名单写, 而不是名单等正文。这同时消灭了甲要修的那个 bug 的
 * **成因**: 只要世界书说清「不要凭空写名单外的人」, 「正文里有人、列表里没有」
 * 就不可能再发生, 因为列表根本不看正文。详见 spec 2026-10-06-名单直出 §1。
 *
 * **这个文件里最要紧的一个词仍然是「幂等」。**
 * 状态栏 iframe 每次渲染消息都会重建, 跑一次() 会被调用很多次。
 * 唯一挡住重复掷骰的是 `今日.已生成于` 这个日期戳。
 */
import type { 等级 } from '../等级';
import { 读取形象 } from './形象';
import { 掷一批, type 申请条目 } from './生成';
import type { 随机源 } from './掷骰';

export type { 申请条目 };

export interface 今日数据 {
  已生成于: string;
  申请列表: Record<string, 申请条目>;
}

export interface 流转结果 {
  掷了: boolean;
  新掷: number;
}

/** 一份最小形状的哨兵表。这个文件只关心「谁出院了」, 别的字段一概不看。 */
export interface 哨兵状态 {
  状态: string;
  已治疗?: number;
}

/**
 * 今天掷过没有。**`当前日期` 为空时一律返回 false。**
 *
 * 那个空判断是必须的: 存档刚开、AI 还没写第一句话的时候 世界.日期 是空串,
 * 而 已生成于 的初始值也是空串 —— 不挡住的话, 开局第一帧就会掷一批,
 * 抢在 AI 写日期之前。等到 AI 真写了日期, 戳对不上, 又掷一批。
 * 玩家会在还没开张的诊所里看到两批病人。
 */
export function 该掷了吗(已生成于: string, 当前日期: string): boolean {
  return 当前日期 !== '' && 已生成于 !== 当前日期;
}

/**
 * 状态栏挂载时、以及 世界.日期 一变时调这个。**就地改 今日。**
 *
 * `哨兵` 是给回头客用的 (见 生成.ts 的 掷一批): 只有 已出院 的人会重新出现在
 * 名单上。它是**掷骰那一刻读一次**的参数, **不是 watch 的源** ——
 * 一天之内 哨兵 怎么变 (有人出院了、有人被收编了) 都不该重掷,
 * 重掷会把玩家已经看过、正在挑的那份名单整个换掉。
 */
export function 跑一次(
  今日: 今日数据,
  当前日期: string,
  诊所等级: 等级,
  哨兵: Record<string, 哨兵状态>,
  随机: 随机源 = Math.random,
): 流转结果 {
  if (!该掷了吗(今日.已生成于, 当前日期)) return { 掷了: false, 新掷: 0 };

  // 昨天的名单一并作废 —— 新的一天, 新的病人。
  今日.申请列表 = 掷一批(
    {
      诊所等级,
      已有姓名: Object.keys(哨兵),
      回头客池: Object.entries(哨兵)
        .filter(([, 人]) => 人.状态 === '已出院')
        .map(([名]) => 名),
    },
    随机,
  );
  // 已有实际接诊档案时：优先续诊，其次每日安排一位熟人复查。
  const 档案 = Object.entries(哨兵).filter(([, person]) => (person.已治疗 ?? 0) > 0);
  const 续诊 = 档案.filter(([, person]) => person.状态 === '在诊');
  const 复查 = 档案.filter(([, person]) => person.状态 !== '在诊');
  const 日期数=当前日期.match(/\d+/g);
  const hash = 日期数 ? Math.floor(Number(日期数.at(-1))/2) : [...当前日期].reduce((n,c)=>n+c.charCodeAt(0),0);
  const 挑选 = [...续诊.slice(hash % Math.max(1,续诊.length)),...续诊.slice(0,hash % Math.max(1,续诊.length))];
  if (复查.length) 挑选.push(复查[hash % 复查.length]);
  const 位 = Object.keys(今日.申请列表);
  const 新名单: Record<string,申请条目> = {};
  for (const [index,[名,person]] of 挑选.slice(0,位.length).entries()) {
    if (!('精神体' in person)) continue;
    const 原 = person as unknown as 申请条目;
    新名单[名] = { ...原, 精神体:{...原.精神体}, 特征:[...原.特征], 形象: {...读取形象(名, 原), 辨识特征: [...读取形象(名, 原).辨识特征]},
      污染度: person.状态 === '在诊' ? 原.污染度 : 10 + Math.floor(随机()*21),
      战损来源: person.状态 === '在诊' ? 原.战损来源 : '定期复查 · 近期外勤后污染回升', 状态:'待接' };
  }
  for (const [名,申请] of Object.entries(今日.申请列表)) { if (Object.keys(新名单).length>=位.length) break; if (!新名单[名]) 新名单[名]=申请; }
  今日.申请列表=新名单;
  // 原有随机回头客也保留身份，不使用新人的资料冒充熟人。
  for (const [名,person] of 档案) {
    const 申请 = 今日.申请列表[名];
    if (!申请 || !('精神体' in person)) continue;
    const 原 = person as unknown as 申请条目;
    Object.assign(申请,{等级:原.等级,年龄:原.年龄,地域:原.地域,精神体:{...原.精神体},特征:[...原.特征],形象: {...读取形象(名, 原), 辨识特征: [...读取形象(名, 原).辨识特征]}, A面:原.A面,B面:原.B面});
  }
  今日.已生成于 = 当前日期;
  return { 掷了: true, 新掷: Object.keys(今日.申请列表).length };
}
