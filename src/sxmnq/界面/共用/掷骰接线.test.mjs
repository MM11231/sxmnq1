/* eslint-disable */
// 直接跑: node src/sxmnq/界面/共用/掷骰接线.test.mjs
//
// 这个测试守的是一个**真踩过的死循环**, 不是理论风险:
//
//   watch 的源里带了 今日.登场, 而回调 (跑一次 → 处理登场) 每次都会把 登场
//   赋成一个**新数组**。源要是「一个返回新数组的 getter」, Vue 用 Object.is 比
//   容器 —— 新数组永远"变了", 于是每一轮 flush 都再叫一次回调, 回调再写一次,
//   flushJobs 就自己递归下去。渲染线程被占死, **一行日志都不打**。
//
// 症状和判据: 点进主界面整个页面卡住, 控制台空白。
//
// 为什么要一个 node 测试而不是只在浏览器里看: 那个循环是同步的, 表现是「卡住」
// 不是「报错」, 在浏览器里既没栈也没日志, 只能靠 Debugger.pause 去抓。
// 这里用真实的 vue, 几毫秒就能判。
import '../../测试钩子.mjs';

const { ref, watch, nextTick } = await import('vue');
const { 盯的源 } = await import(new URL('./掷骰接线.ts', import.meta.url).href);

let fail = 0;
const 断言 = (条件, 说明) => {
  console.log(`${条件 ? '  ok  ' : ' FAIL '} ${说明}`);
  if (!条件) fail++;
};

/** 最小的接线源。数据得是响应式的, watch 才追得到。 */
const 造源 = () => {
  const 数据 = ref({
    日期: '霜降月第一日',
    等级: 'C',
    今日: { 已生成于: '霜降月第一日', 待登记: [], 登场: [] },
  });
  return {
    数据,
    源: {
      日期: () => 数据.value.日期,
      等级: () => 数据.value.等级,
      今日: () => 数据.value.今日,
    },
  };
};

console.log('--- ★ 回调自己写的字段不能被源盯上 (否则 flushJobs 自我递归, 整页卡死) ---');
{
  const { 数据, 源 } = 造源();
  let 跑了几次 = 0;

  watch(
    盯的源(源),
    () => {
      跑了几次++;
      // 复刻 跑一次 里真正会发生的那次写: 处理登场 每次都把 登场 赋成新数组。
      //
      // 那个 `<= 20` 是**测试自己的刹车**, 不是生产逻辑 —— 真死循环时它是同步的,
      // 不加刹车 `await nextTick()` 永远不返回, 测试会挂住而不是失败。
      // 刹住之后循环会退出, 下面那条断言就能报出真实次数。
      if (跑了几次 <= 20) 数据.value.今日.登场 = [];
    },
    { immediate: true },
  );

  await nextTick();
  await nextTick();

  // 固定版实测 1 次: immediate 那一次。回调再写 登场 = [] 时内容没变
  // (本来就是空), 逐项 Object.is 判为没变, 就不叫了。放宽到 <= 2 只是留一点余量。
  断言(跑了几次 <= 2, `回调跑完就停住了 (实跑 ${跑了几次} 次; 20 次说明源在自我激荡)`);
}

console.log('--- 但源必须真的会变: 登场 里多一条报到要叫得醒 ---');
{
  const { 数据, 源 } = 造源();
  let 跑了几次 = 0;
  watch(盯的源(源), () => { 跑了几次++; }, { immediate: true });
  await nextTick();

  const 之前 = 跑了几次;
  数据.value.今日.登场.push({ 姓名: '沈砚', 战损来源: '', 自创: false });
  await nextTick();
  await nextTick();

  断言(跑了几次 === 之前 + 1, `登场 多了一条 → 回调恰好再跑一次 (实得 ${跑了几次 - 之前})`);

  const 又之前 = 跑了几次;
  数据.value.今日.登场 = [];
  await nextTick();
  await nextTick();
  断言(跑了几次 === 又之前 + 1, `登场 被清空 → 也要叫醒一次 (实得 ${跑了几次 - 又之前})`);
}

console.log('--- 日期/等级 变了同样要叫醒 ---');
{
  const { 数据, 源 } = 造源();
  let 跑了几次 = 0;
  watch(盯的源(源), () => { 跑了几次++; }, { immediate: true });
  await nextTick();

  const 之前 = 跑了几次;
  数据.value.日期 = '霜降月第二日';
  await nextTick();
  await nextTick();
  断言(跑了几次 === 之前 + 1, '日期一变就叫醒 (这条是改动前就有的行为, 别修回归了)');

  const 又之前 = 跑了几次;
  数据.value.等级 = 'B';
  await nextTick();
  await nextTick();
  断言(跑了几次 === 又之前 + 1, '等级一变也叫醒');
}

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项失败`);
process.exit(fail === 0 ? 0 : 1);
