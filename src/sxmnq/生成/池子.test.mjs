/* eslint-disable */
// 直接跑: node src/sxmnq/生成/池子.test.mjs
//
// 这个文件全是手抄的白塔数据表。手抄的错法只有一种: 漏了一行。
// 漏一行的后果不是崩, 是**某个纲永远抽不到某个栖息** —— 静默的、看不出来的。
// 所以这里测的是**条数与行键** —— 表与表之间对不对得上。具体权重值不测:
// 数值抄错了只会让某个纲略多一点, 看不出来也不致命; 漏一行才是真会卡死的。
import '../测试钩子.mjs';

const P = await import(new URL('./池子.ts', import.meta.url).href);

let fail = 0;
const 断言 = (条件, 说明) => {
  console.log(`${条件 ? '  ok  ' : ' FAIL '} ${说明}`);
  if (!条件) fail++;
};

console.log('--- 表本身的形状 ---');
断言(P.地域池.length === 4, `地域池 4 条 (实得 ${P.地域池.length})`);
断言(P.性格A面.length === 13, `性格A面 13 条 (实得 ${P.性格A面.length})`);
断言(P.性格B面.length === 11, `性格B面 11 条 (实得 ${P.性格B面.length})`);
断言(Object.keys(P.个人特征池).length === 4, '个人特征 4 个池');
断言(P.个人特征池.脸.length === 9, `特征·脸 9 条 (实得 ${P.个人特征池.脸.length})`);
断言(P.个人特征池.身.length === 4, `特征·身 4 条 (实得 ${P.个人特征池.身.length})`);
断言(P.个人特征池.饰.length === 8, `特征·饰 8 条 (实得 ${P.个人特征池.饰.length})`);
断言(P.个人特征池.感.length === 7, `特征·感 7 条 (实得 ${P.个人特征池.感.length})`);

console.log('--- 四张以「纲」为键的表必须行键完全一致 ---');
// 这是最要命的一处: 纲权重里加了第八个纲, 另外三张表没跟上,
// 于是那个纲掷到之后栖息/体型/危险 全是 undefined。
const 纲们 = Object.keys(P.纲权重).sort();
断言(纲们.length === 7, `7 个纲 (实得 ${纲们.length})`);
for (const 表名 of ['纲方向', '栖息权重', '体型权重', '危险权重']) {
  const 行键 = Object.keys(P[表名]).sort();
  断言(
    JSON.stringify(行键) === JSON.stringify(纲们),
    `${表名} 的行键与 纲权重 一致`,
  );
}

console.log('--- 纲方向 / 栖息 / 体型 / 危险 每行都不为空且权重为正数 ---');
for (const 纲 of 纲们) {
  断言(!!P.纲方向[纲], `纲方向.${纲} 有内容`);
  for (const 表名 of ['栖息权重', '体型权重', '危险权重']) {
    const 行 = P[表名][纲];
    const 项 = Object.entries(行);
    断言(
      项.length > 0 && 项.every(([, w]) => typeof w === 'number' && w >= 0),
      `${表名}.${纲} 有 ${项.length} 项且权重非负`,
    );
    // 全 0 的一行是 dead row: weightedPick 会退回第一个键, 看起来像能用
    断言(项.some(([, w]) => w > 0), `${表名}.${纲} 不是全 0`);
  }
}

console.log('--- 地域纲系数 只写这 4 个地域、且系数都是正数 ---');
const 地域键 = P.地域池.map(s => s.slice(0, 4));
断言(
  JSON.stringify(Object.keys(P.地域纲系数).sort()) === JSON.stringify([...地域键].sort()),
  `地域纲系数 的键就是地域池那四个 (${Object.keys(P.地域纲系数).join('/')})`,
);
for (const [地, 表] of Object.entries(P.地域纲系数)) {
  for (const [纲, 系数] of Object.entries(表)) {
    断言(纲们.includes(纲), `${地} 的系数键「${纲}」是个真纲`);
    断言(系数 > 0, `${地}.${纲} = ${系数} > 0`);
  }
}

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项失败`);
process.exit(fail === 0 ? 0 : 1);
