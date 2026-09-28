/**
 * 精神疏导小游戏的纯逻辑层。
 *
 * 这一层刻意不依赖 lodash / jQuery / 酒馆助手 —— 全部是纯函数,
 * 因此可以在控制台里手算验证数值, 也能被 game.test.mjs 直接跑。
 */

import { 等级序, 等级值, type 等级 } from '../../等级';

// 再导出: 原来 等级 就住在这个文件里, 外面(状态栏等)是 `from '../治疗/game'` 拿的。
// 保留这一行, 那些 import 一个字都不用改。
export type { 等级 };

export type 评级 = 'S' | 'A' | 'B' | 'C';
export type 命中 = '成功' | '失误' | '无';

export interface 丝线 {
  /** 归一化坐标, 0~1, 与画布尺寸无关 */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface 治疗参数 {
  污染度: number;
  哨兵等级: 等级;
  主角等级: 等级;
  /** 哨兵对该向导的信赖, 0~100 */
  信赖: number;
  /** 诊所躺椅等级, 1~5 */
  躺椅等级: number;
}

/** 一次失误。`条` 是当时正在理的那根丝线是第几条, 结算时要写成「第 3 条时手重了」 */
export interface 失误 {
  条: number;
  短句: string;
}

export interface 治疗结果 {
  线数: number;
  已完成: number;
  失误次数: number;
  失误日志: 失误[];
  评级: 评级;
  精神力消耗: number;
}

/** 手指点在线附近多少像素内算「点到了这条线」 */
export const 触屏容差 = 30;

/** 清掉一条之后, 下一条亮起来之前的停顿. 不是计时压力, 只是给个节奏 */
export const 换线停顿 = 380;

function 钳(值: number, 下限: number, 上限: number) {
  return Math.min(上限, Math.max(下限, 值));
}

/** mulberry32: 小巧的可重现随机数, 方便用同一个种子复现同一局 */
export function 造随机数(种子: number) {
  let a = 种子 >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 线数 = 污染度 ÷ 8 + (哨兵等级 − 用户等级) × 2   (§6.2, 钳制 [5, 25])
 * 再减去信赖带来的减免, 最多 3 条                        (§7.2)
 *
 * 除法取整用向下取整 —— 文档 §6.2 的表就是这么算的:
 * 污染 60 → 7 (60÷8=7.5)、污染 100 → 12 (100÷8=12.5)。四舍五入会算成 8 和 13。
 *
 * 另外文档写的是先钳制到 [5,25] 再减免, 这里把最终下限放到了 3 ——
 * 否则基础线数已经是 5 的时候, 信赖完全不起作用。
 */
export function 算线数({ 污染度, 哨兵等级, 主角等级, 信赖 }: 治疗参数): number {
  const 基础 = 钳(Math.floor(污染度 / 8 + (等级值[哨兵等级] - 等级值[主角等级]) * 2), 5, 25);
  const 减免 = 信赖 >= 80 ? 3 : 信赖 >= 60 ? 2 : 信赖 >= 40 ? 1 : 0;
  return 钳(基础 - 减免, 3, 25);
}

/** 躺椅等级越高, 起始舒适度越好, 每场前 N 次失误不计精神力 (§7.2) */
export function 算躺椅免费次数(躺椅等级: number): number {
  return 钳(Math.round(躺椅等级), 1, 5) - 1;
}

/** 精神力消耗 = 线数 + 失误次数 (§6.3), 其中躺椅覆盖掉前几次失误 */
export function 算精神力消耗(线数: number, 失误次数: number, 躺椅等级: number): number {
  return 线数 + Math.max(0, 失误次数 - 算躺椅免费次数(躺椅等级));
}

/** 评级只看手法, 不看躺椅打折 —— 打折的是精神力, 不是评价 (§6.5) */
export function 算评级(线数: number, 失误次数: number): 评级 {
  if (失误次数 === 0) return 'S';
  const 失误率 = 失误次数 / Math.max(1, 线数);
  if (失误率 <= 0.15) return 'A';
  if (失误率 <= 0.35) return 'B';
  return 'C';
}

/**
 * 撒一把互相交叠的丝线。
 *
 * 坐标存成归一化的 0~1, 但角度是按真实宽高算的 ——
 * 这样手机竖屏和横屏下线的斜度都正常, 而且改窗口尺寸不用重算。
 */
export function 生成丝线(条数: number, 宽: number, 高: number, 种子: number): 丝线[] {
  const 随机 = 造随机数(种子);
  const 对角 = Math.hypot(宽 || 1, 高 || 1);
  const 结果: 丝线[] = [];

  for (let i = 0; i < 条数; i++) {
    let 线: 丝线 | null = null;

    // 偶尔会撒出贴边的短线, 重撒几次; 实在不行也要一条, 免得卡住
    for (let 尝试 = 0; 尝试 < 8; 尝试++) {
      const 中心x = 0.18 + 随机() * 0.64;
      const 中心y = 0.18 + 随机() * 0.64;
      const 角度 = 随机() * Math.PI * 2;
      const 半长 = ((0.5 + 随机() * 0.5) * 对角) / 2;

      const 候选: 丝线 = {
        x1: 钳(中心x - (Math.cos(角度) * 半长) / (宽 || 1), 0, 1),
        y1: 钳(中心y - (Math.sin(角度) * 半长) / (高 || 1), 0, 1),
        x2: 钳(中心x + (Math.cos(角度) * 半长) / (宽 || 1), 0, 1),
        y2: 钳(中心y + (Math.sin(角度) * 半长) / (高 || 1), 0, 1),
      };

      const 实际长 = Math.hypot((候选.x2 - 候选.x1) * 宽, (候选.y2 - 候选.y1) * 高);
      if (实际长 >= 对角 * 0.25 || 尝试 === 7) {
        线 = 候选;
        break;
      }
    }

    if (线) 结果.push(线);
  }

  return 结果;
}

/** 点到线段的距离 */
export function 点到丝线距离(px: number, py: number, 线: 丝线): number {
  const dx = 线.x2 - 线.x1;
  const dy = 线.y2 - 线.y1;
  const 长平方 = dx * dx + dy * dy;
  const t = 长平方 === 0 ? 0 : 钳(((px - 线.x1) * dx + (py - 线.y1) * dy) / 长平方, 0, 1);
  return Math.hypot(px - (线.x1 + t * dx), py - (线.y1 + t * dy));
}

/** 点在哪条线附近; 没有就返回 -1. 用来决定失误时闪哪一条. 同 命中判定, 丝线必须是像素坐标 */
export function 最近丝线(丝线们: 丝线[], px: number, py: number): number {
  let 最好 = -1;
  let 最近 = 触屏容差;
  for (let i = 0; i < 丝线们.length; i++) {
    const 距离 = 点到丝线距离(px, py, 丝线们[i]);
    if (距离 <= 最近) {
      最近 = 距离;
      最好 = i;
    }
  }
  return 最好;
}

/**
 * 命中判定 —— 一律在真实像素坐标里算, 调用方负责把归一化坐标乘上宽高。
 *
 * 判定顺序刻意偏向玩家: 只要点在亮着的那条附近就算成功, 哪怕同时还有
 * 别的线离得更近。乱线交叠时手指本来就点不准, 因为「点歪了」扣精神力
 * 会让人觉得被坑; 失误应该来自**看错了那条**, 不是来自手抖。
 */
export function 命中判定(丝线们: 丝线[], 亮着的: number, px: number, py: number): 命中 {
  if (亮着的 < 0 || 亮着的 >= 丝线们.length) return '无';

  if (点到丝线距离(px, py, 丝线们[亮着的]) <= 触屏容差) return '成功';

  for (let i = 0; i < 丝线们.length; i++) {
    if (i === 亮着的) continue;
    if (点到丝线距离(px, py, 丝线们[i]) <= 触屏容差) return '失误';
  }

  return '无';
}

/** 失误当场浮现的短句. 本地词库随机抽, 零延迟, 不调 LLM (§6.4) */
const 失误短句库 = [
  '他闷哼了一声',
  '他攥紧了床单',
  '他把脸别过去',
  '「……轻点。」',
  '他的呼吸乱了一拍',
  '他的指尖蜷了一下',
  '他咬住了下唇',
  '他倒吸了一口气',
  '他肩膀绷紧了一瞬',
  '喉咙里滚出一声压抑的气音',
];

export function 抽失误短句(随机 = Math.random): string {
  return 失误短句库[Math.floor(随机() * 失误短句库.length)] ?? 失误短句库[0];
}

/** 失误日志在变量里按条号存成对象, 这里做一次转换 */
export function 失误日志转记录(日志: 失误[]): Record<string, string> {
  return Object.fromEntries(日志.map(({ 条, 短句 }) => [String(条), 短句]));
}

export function 汇总(参数: 治疗参数, 线数: number, 已完成: number, 失误日志: 失误[]): 治疗结果 {
  return {
    线数,
    已完成,
    失误次数: 失误日志.length,
    失误日志,
    评级: 算评级(线数, 失误日志.length),
    精神力消耗: 算精神力消耗(线数, 失误日志.length, 参数.躺椅等级),
  };
}
