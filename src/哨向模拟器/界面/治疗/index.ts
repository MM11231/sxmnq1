/**
 * 脱机调试入口。
 *
 * 直接打开 `dist/哨向模拟器/界面/治疗/index.html` 就能玩, 不需要酒馆、
 * 不需要 MVU —— 参数从 URL 查询串读, 方便反复试数值。例如:
 *
 *   index.html?污染度=100&哨兵等级=A&主角等级=F&信赖=0&躺椅等级=1
 *
 * 注意这里不能碰 `$` / `_` / 酒馆助手这些全局, 否则在普通浏览器里会直接报错。
 * 真正嵌进卡里时, 状态栏 import 的是 `App.vue`, 不会走到这个文件。
 */
import './global.css';
import App from './App.vue';
import type { 等级, 治疗参数, 治疗结果 } from './game';

const 查询 = new URLSearchParams(location.search);

function 取数(名: string, 兜底: number) {
  const 值 = Number(查询.get(名));
  return 查询.has(名) && Number.isFinite(值) ? 值 : 兜底;
}

function 取等级(名: string, 兜底: 等级): 等级 {
  const 值 = 查询.get(名);
  return 值 && 'FEDCBAS'.includes(值) ? (值 as 等级) : 兜底;
}

const 参数: 治疗参数 = {
  污染度: 取数('污染度', 72),
  哨兵等级: 取等级('哨兵等级', 'C'),
  主角等级: 取等级('主角等级', 'F'),
  信赖: 取数('信赖', 0),
  躺椅等级: 取数('躺椅等级', 1),
};

console.log('调试参数', 参数);

function 挂载() {
  createApp(App, {
    哨兵姓名: 查询.get('姓名') ?? '调试用哨兵',
    参数,
    种子: 取数('种子', 20260928),
    on结算: (结果: 治疗结果) => {
      console.log('结算', 结果);
      alert(
        `评级 ${结果.评级}\n线数 ${结果.线数}\n失误 ${结果.失误次数}\n精神力 −${结果.精神力消耗}` +
          (结果.失误日志.length ? `\n\n${结果.失误日志.join('\n')}` : ''),
      );
    },
    on取消: () => console.log('中断疏导'),
  }).mount('#app');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', 挂载, { once: true });
} else {
  挂载();
}
