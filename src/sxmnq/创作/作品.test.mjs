import assert from 'node:assert/strict';
import { 登记作品, 结算传播, 固定读者快照 } from './作品.ts';
import { 地点场景 } from './场景.ts';
const 记录 = { 名气: 0, 传播结算日: 0, 作品: [] };
assert(登记作品(记录, { 标题: ' 候车室 ', 笔名: '', 类型: '小说', 天数: 1, 日期: '第一日' }));
assert.equal(记录.作品[0].笔名, '匿名'); assert.equal(记录.作品[0].标题, '候车室');
assert.equal(登记作品(记录, { 标题: '候车室', 笔名: '', 类型: '小说', 天数: 1, 日期: '第一日' }), false);
assert.equal(记录.作品[0].期数, 1);
const 快照 = structuredClone(记录);
assert.throws(() => 登记作品(记录, { 标题: '候车室', 笔名: '', 类型: '随笔', 天数: 2, 日期: '第二日' }));
assert.deepEqual(记录, 快照);
登记作品(记录, { 标题: '候车室', 笔名: '', 类型: '小说', 天数: 2, 日期: '第二日' });
assert.equal(记录.作品.length, 1); assert.equal(记录.作品[0].期数, 2);
结算传播(记录, 3); const 名气 = 记录.名气; 结算传播(记录, 3); assert.equal(记录.名气, 名气);
const 停更 = structuredClone(记录); 结算传播(停更, 30); assert.equal(停更.名气, 名气);
const 老存档 = { 名气: 0, 传播结算日: 0, 作品: [] };
assert.equal(地点场景({ id: 'cafe', district: '商业区' }, { 天数: 3, 时段: 0, 创作: 老存档 }).闲谈, '');
const 当日记录 = structuredClone(记录);
固定读者快照(当日记录, 3);
const 当日快照 = structuredClone(当日记录.场景作品);
登记作品(当日记录, { 标题: '新小说', 笔名: '', 类型: '小说', 天数: 3, 日期: '第三日' });
固定读者快照(当日记录, 3);
assert.deepEqual(当日记录.场景作品, 当日快照);
固定读者快照(当日记录, 4); assert.equal(当日记录.场景作品.length, 2);
let 讨论天数 = 0, 推荐数 = 0;
const 地点们 = ['cafe', 'bookstore', 'canteen', 'bar', 'market', 'garden', 'clinic', 'gym'];
for (let 天 = 2; 天 <= 501; 天++) {
  const 创作 = { ...structuredClone(记录), 名气: 100 };
  创作.作品[0].名气 = 80; 创作.作品[0].最近刊登日 = 天 - 1;
  const 未变 = structuredClone(创作); let 本日讨论 = 0;
  for (let 时段 = 0; 时段 < 3; 时段++) for (const id of 地点们) {
    const 地点 = { id, district: '商业区' }, 上 = { 天数: 天, 时段, 天气: '晴', 创作 };
    const 场 = 地点场景(地点, 上);
    assert.deepEqual(场, 地点场景(地点, 上));
    if (场.闲谈) { 本日讨论++; assert(场.闲谈.includes('候车室')); if (场.闲谈.includes('有空可以试试')) 推荐数++; }
    assert(!/作者|你写|天才|神作|崇拜|见面|约见/.test(场.闲谈));
  }
  assert(本日讨论 <= 1); assert.deepEqual(创作, 未变);
  if (本日讨论) 讨论天数++;
}
assert(讨论天数 > 0 && 讨论天数 < 150); assert(推荐数 > 0 && 推荐数 < 讨论天数 / 3);
console.log(`作品登记、匿名、连续刊登、每日传播、停止传播、场景稳定和稀疏闲谈验证通过（500天中${讨论天数}天有闲谈，${推荐数}次推荐）。`);
