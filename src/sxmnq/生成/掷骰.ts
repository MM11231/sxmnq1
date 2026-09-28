/**
 * 掷骰 —— 把 池子.ts 里的表变成「掷一个具体的人」。
 *
 * **每个函数都收一个 随机源, 默认 Math.random。** 多这个参数就是为了能测:
 * 传一串写死的数进去, 结果就是确定的, 于是「同一个种子出同一个人」这句话
 * 才验得了。生产代码一个字都不用改 —— 不传就是 Math.random。
 *
 * 这一层不认识等级也不认识污染度 —— 那些是闸门(闸门.ts)的事,
 * 因为它们的取值范围取决于**玩家诊所的等级**, 而这里是纯粹的人物属性。
 */
import {
  个人特征池, 地域池, 地域纲系数, 危险权重, 体型权重, 性格A面, 性格B面,
  栖息权重, 年龄上限, 年龄下限, 纲方向, 纲权重,
} from './池子';

export type 随机源 = () => number;

/** 按权重抽一个键。权重不必归一 —— 内部自己求和 */
export function 加权抽(池: Record<string, number>, 随机: 随机源 = Math.random): string {
  let 总 = 0;
  for (const k in 池) 总 += 池[k];
  let r = 随机() * 总;
  for (const k in 池) {
    r -= 池[k];
    if (r < 0) return k;
  }
  // 浮点误差导致 r 掉不进去时的兜底
  return Object.keys(池)[0];
}

/** 等概率抽一个 */
export function 均匀抽<T>(表: readonly T[], 随机: 随机源 = Math.random): T {
  return 表[Math.floor(随机() * 表.length)];
}

/** 闭区间整数 —— 上下限都取得到 */
export function 掷区间(下限: number, 上限: number, 随机: 随机源 = Math.random): number {
  return 下限 + Math.floor(随机() * (上限 - 下限 + 1));
}

/**
 * 纲的权重池, 已乘上地域系数。**不归一** —— 归一在这里没有意义,
 * 加权抽自己会求和。导出它是为了让它可测: 系数有没有乘上去, 看这个函数就够了。
 */
export function 算纲池(地域: string): Record<string, number> {
  const 地域键 = 取地域键(地域);
  const 系数 = 地域纲系数[地域键] ?? {};
  const 池: Record<string, number> = {};
  for (const 纲 in 纲权重) 池[纲] = 纲权重[纲] * (系数[纲] ?? 1);
  return 池;
}

/** 从 地域池 那条带描述的长串里认出是哪个地域。认不出返回空串, 系数就当全 1 */
function 取地域键(地域: string): string {
  for (const 键 of Object.keys(地域纲系数)) {
    if (地域.includes(键)) return 键;
  }
  return '';
}

export function 掷地域(随机: 随机源 = Math.random): string {
  return 均匀抽(地域池, 随机);
}

export interface 精神体 {
  /** 纲。AI 要在这个方向里自己推一个具体物种 */
  纲: string;
  /** 交给 AI 的选种范围提示 */
  方向: string;
  栖息: string;
  体型: string;
  危险: string;
}

/**
 * 掷精神体。**先掷纲, 后三样都从纲对应的那一行里抽** ——
 * 这个联动是白塔那套的灵魂: 掷到鸟纲就不可能得到「穴居」占 30% 的结果。
 */
export function 掷精神体(地域: string, 随机: 随机源 = Math.random): 精神体 {
  const 纲 = 加权抽(算纲池(地域), 随机);
  return {
    纲,
    方向: 纲方向[纲],
    栖息: 加权抽(栖息权重[纲], 随机),
    体型: 加权抽(体型权重[纲], 随机),
    危险: 加权抽(危险权重[纲], 随机),
  };
}

const 特征池名 = Object.keys(个人特征池) as (keyof typeof 个人特征池)[];

/**
 * 掷 1~2 个人特征, **必须来自不同的池** ——
 * 「泪痣 + 雀斑」是两张脸挤在一起, 「泪痣 + 药味」才是一个人。
 * 白塔原文是把四个池洗牌后取前 N 个, 这里换成 Fisher-Yates —— 顺手, 且可测。
 */
export function 掷个人特征(随机: 随机源 = Math.random): string[] {
  const 池们 = [...特征池名];
  for (let i = 池们.length - 1; i > 0; i--) {
    const j = Math.floor(随机() * (i + 1));
    [池们[i], 池们[j]] = [池们[j], 池们[i]];
  }
  const 个数 = 掷区间(1, 2, 随机);
  return 池们.slice(0, 个数).map(名 => 均匀抽(个人特征池[名], 随机));
}

export function 掷性格(随机: 随机源 = Math.random): { A面: string; B面: string } {
  return { A面: 均匀抽(性格A面, 随机), B面: 均匀抽(性格B面, 随机) };
}

export function 掷年龄(随机: 随机源 = Math.random): number {
  return 掷区间(年龄下限, 年龄上限, 随机);
}

export interface 命名要求 {
  /** 名字要几个字, 2~4 */
  字数: number;
  /** 中式姓名还是西式音译名。**4 字时恒为 false** —— 白塔原文: 4 字强制西式 */
  中式: boolean;
}

/**
 * 名字的字数与中外, 由代码掷; 具体叫什么, 由 AI 写 (spec §8.2)。
 *
 * 4 字以上强制西式音译, 是因为四字中式会滑向复姓与化用名 ——
 * 那正是白塔的命名法则要躲开的东西。
 */
export function 掷命名要求(随机: 随机源 = Math.random): 命名要求 {
  const 字数 = 掷区间(2, 4, 随机);
  return { 字数, 中式: 字数 < 4 && 随机() < 0.5 };
}
