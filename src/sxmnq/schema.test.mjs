/* eslint-disable */
// 直接跑: node src/sxmnq/schema.test.mjs
//
// 这个测试存在的唯一理由: schema 改动引发的失败是**静默**的。
// ts-loader 是 transpileOnly, 枚举值写错不在构建期报错; MVU 那边 safeParse 失败
// 直接把整份数据丢掉(util/mvu.ts: `if (result.error) return`), 界面上只表现为
// 「所有数字都变成了默认值」—— 看起来像数据没加载, 而不是像代码错了。
//
// 所以每动一次 schema, 就拿真实的预览假数据过一遍 safeParse。
//
import './测试钩子.mjs';

const { Schema } = await import(new URL('./schema.ts', import.meta.url).href);
const { 假变量 } = await import(new URL('../预览/假数据.ts', import.meta.url).href);

let fail = 0;
const 断言 = (条件, 说明) => {
  console.log(`${条件 ? '  ok  ' : ' FAIL '} ${说明}`);
  if (!条件) fail++;
};
const 等于 = (实得, 期望, 说明) => {
  const 好 = JSON.stringify(实得) === JSON.stringify(期望);
  断言(好, 好 ? 说明 : `${说明} —— 期望 ${JSON.stringify(期望)}, 实得 ${JSON.stringify(实得)}`);
};

console.log('--- 假数据能过 schema (不过的话预览里一切数字都是假的) ---');
const 果 = Schema.safeParse(假变量.stat_data);
if (!果.success) {
  console.log(JSON.stringify(果.error.issues, null, 2));
}
断言(果.success, 'safeParse 通过');
if (!果.success) {
  console.log('\n1 项失败');
  process.exit(1);
}
const 数 = 果.data;

console.log('--- 五档 ---');
等于(数.诊所.等级, 'C', '诊所.等级 读到了 C');
等于(数.诊所.$称号, '略有耳闻', '$称号 由 等级 算出 (C → 略有耳闻, 见 spec §3.2 称号表)');
断言(!('星级' in 数.诊所), '星级 字段已删除');
断言(!('诊室等级' in 数.诊所), '诊室等级 字段已删除');
断言(!('躺椅等级' in 数.诊所), '躺椅等级 字段已删除');
断言(!('执业等级' in 数.主角), '执业等级 字段已删除');
等于(数.诊所.床位, 2, '床位 原样读到 2 (假数据给的是 2; schema 的 prefault 是 1)');

console.log('--- 假数据里每个人的等级都是五档之一 ---');
const 五档 = new Set(['D', 'C', 'B', 'A', 'S']);
const 申请等级们 = Object.values(数.今日.申请列表).map(项 => 项.等级);
const 哨兵等级们 = Object.values(数.哨兵).map(项 => 项.等级);
断言([...申请等级们, ...哨兵等级们].every(级 => 五档.has(级)), '申请列表与哨兵里没有 F/E 这种旧档');

console.log('--- 旧档会被拒 ---');
const 坏 = structuredClone(假变量.stat_data);
坏.哨兵.白露.等级 = 'E';
断言(!Schema.safeParse(坏).success, "等级写 'E' 时 safeParse 失败 (这正是那个静默坑)");

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项失败`);
process.exit(fail === 0 ? 0 : 1);
