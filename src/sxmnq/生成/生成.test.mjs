/* eslint-disable */
// 直接跑: node src/sxmnq/生成/生成.test.mjs
import '../测试钩子.mjs';

const G = await import(new URL('./生成.ts', import.meta.url).href);
const Z = await import(new URL('./闸门.ts', import.meta.url).href);
const P = await import(new URL('./池子.ts', import.meta.url).href);

let fail = 0;
const 断言 = (条件, 说明) => {
  console.log(`${条件 ? '  ok  ' : ' FAIL '} ${说明}`);
  if (!条件) fail++;
};
const 等于 = (实得, 期望, 说明) => {
  const 好 = JSON.stringify(实得) === JSON.stringify(期望);
  断言(好, 好 ? 说明 : `${说明} —— 期望 ${JSON.stringify(期望)}, 实得 ${JSON.stringify(实得)}`);
};
const 线性同余 = (种子) => {
  let s = 种子 >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
};
const 序列 = (...值们) => { let i = 0; return () => 值们[i++ % 值们.length]; };

console.log('--- 掷一个: 十项全都填上了, 没有 undefined ---');
const 甲 = G.掷一个('C', 线性同余(1));
for (const 键 of ['等级', '污染度', '年龄', '地域', '精神体', '特征', 'A面', 'B面', '战损来源', '诊金', '姓名', '字数', '中式']) {
  断言(甲[键] !== undefined && 甲[键] !== null, `字段「${键}」有值`);
}
等于(甲.姓名, '', '姓名 留给 AI, 掷完是空的');
等于(甲.战损来源, '', '战损来源 留给 AI, 掷完是空的');

console.log('--- 等级与污染度必须自洽 (闸门管着) ---');
let 自洽 = true;
for (let 种子 = 1; 种子 <= 400; 种子++) {
  const 乙 = G.掷一个('B', 线性同余(种子));
  if (!Z.可来等级('B').includes(乙.等级)) {
    断言(false, `种子 ${种子}: 掷出 ${乙.等级} 级, 但 B 级诊所收不到`);
    自洽 = false;
    break;
  }
  const [低, 高] = Z.污染度区间[乙.等级];
  if (乙.污染度 < 低 || 乙.污染度 > 高) {
    断言(false, `种子 ${种子}: ${乙.等级} 级污染度 ${乙.污染度} 不在 [${低}, ${高}]`);
    自洽 = false;
    break;
  }
  if (乙.诊金 !== Z.算基础诊金(乙.等级, 乙.污染度)) {
    断言(false, `种子 ${种子}: 诊金 ${乙.诊金} ≠ 算基础诊金(${乙.等级}, ${乙.污染度})`);
    自洽 = false;
    break;
  }
}
断言(自洽, '400 个种子: 等级在池内、污染度在区间内、诊金与两者对得上');

console.log('--- 精神体四属性跟着纲走 ---');
let 随纲 = true;
for (let 种子 = 1; 种子 <= 200; 种子++) {
  const 丙 = G.掷一个('A', 线性同余(种子 + 500));
  const 纲 = 丙.精神体.纲;
  if (
    丙.精神体.方向 !== P.纲方向[纲] ||
    !(丙.精神体.栖息 in P.栖息权重[纲]) ||
    !(丙.精神体.体型 in P.体型权重[纲]) ||
    !(丙.精神体.危险 in P.危险权重[纲])
  ) {
    断言(false, `种子 ${种子}: ${纲} 的四属性不自洽 ${JSON.stringify(丙.精神体)}`);
    随纲 = false;
    break;
  }
}
断言(随纲, '200 个种子: 方向/栖息/体型/危险 都出自所选纲那一行');

console.log('--- 四条地域都掷得到 ---');
const 地域计数 = {};
for (let i = 0; i < 2000; i++) {
  const 地 = G.掷一个('S', 线性同余(i + 1)).地域;
  地域计数[地] = (地域计数[地] ?? 0) + 1;
}
等于(Object.keys(地域计数).length, 4, `四条地域都出现了 (${Object.values(地域计数).join(' / ')})`);

console.log('--- 掷一批: 3~6 个人, 互不相同 ---');
let 批量好 = true;
for (let 种子 = 1; 种子 <= 200; 种子++) {
  const 批 = G.掷一批('C', 线性同余(种子));
  if (批.length < G.每日人数下限 || 批.length > G.每日人数上限) {
    断言(false, `种子 ${种子}: 掷出 ${批.length} 人, 不在 3~6`);
    批量好 = false;
    break;
  }
  if (批.some(人 => !Z.可来等级('C').includes(人.等级))) {
    断言(false, `种子 ${种子}: 批里混进了 C 级诊所收不到的等级`);
    批量好 = false;
    break;
  }
}
断言(批量好, '200 个种子: 每批 3~6 人, 每个人的等级都在池内');

console.log('--- 掷一批 是独立的 (不能两个人一模一样) ---');
const 大 = G.掷一批('S', 线性同余(42));
等于(大.length, new Set(大.map(人 => JSON.stringify(人))).size, '同一批里没有两条完全相同的档案');
断言(大.length >= 3, `掷出 ${大.length} 人`);

console.log('--- 掷一个 是可复现的: 同一个种子出同一个人 ---');
等于(G.掷一个('B', 序列(0.1, 0.2, 0.3, 0.4, 0.5)), G.掷一个('B', 序列(0.1, 0.2, 0.3, 0.4, 0.5)), '同样的随机流 → 同样的档案');

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项失败`);
process.exit(fail === 0 ? 0 : 1);
