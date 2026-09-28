// 把酒馆助手那套全局自己挂上, 好让这个入口能脱机在浏览器里跑。
//
// 平时这些全局是酒馆助手扩展注入到页面上的 —— webpack 那边把它们配成了 external
// (`var Vue`、`var _` 那一套, 见 webpack.config.ts), 静态托管上没有这个扩展。
// 所以预览入口走的是另一条路: 依赖真的打进包里, 再在这里手工挂成全局,
// 业务代码里那些裸 `_` / `z` / `toastr` 才找得到。
//
// **import 顺序有讲究**: ESM 按 import 的先后求值, 这个文件必须赶在业务代码之前跑完,
// 所以它是 src/预览/index.ts 的第一个 import。别挪, 也别把它挪进别的文件里。
import { ref } from 'vue';
import _ from 'lodash';
import { z } from 'zod';

import { 备稿, 假变量, 假聊天 } from './假数据';

const 全局 = globalThis as unknown as Record<string, any>;

// ---------------------------------------------------------------- 库

// 只需要这两个。项目里 `_` 是裸全局(tsconfig 的 types 里有 @types/lodash), `z` 则
// 走 auto-import —— 但 auto-import 注入的是 `import { z } from 'zod'`, 而 webpack
// 把它 external 成了 `var z`。预览里 externals 关掉了, 所以这里得自己补上全局。
全局._ = _;
全局.z = z;

// ---------------------------------------------------------------- toastr

/**
 * 手搓的 toastr。
 *
 * 真 toastr 要 jQuery, 为一个只在开发期看的预览把 jQuery + toastr + toastr 的样式
 * 全拉进包不划算。这里只需要「右下角冒一条、几秒后自己走」, 二十行够了。
 */
function 弹(类名: string, 文: string, 标: string) {
  const 条 = document.createElement('div');
  条.className = `览吐 ${类名}`;
  条.textContent = 标 ? `${标}：${文}` : 文;
  document.body.appendChild(条);
  setTimeout(() => 条.remove(), 3200);
}

全局.toastr = {
  error: (文: string, 标 = '') => 弹('is-错', 文, 标),
  success: (文: string, 标 = '') => 弹('is-成', 文, 标),
  info: (文: string, 标 = '') => 弹('', 文, 标),
  warning: (文: string, 标 = '') => 弹('is-警', 文, 标),
};

// ---------------------------------------------------------------- 楼层

/** 界面在酒馆里挂死在第一楼; 预览里就当作永远是第一楼。 */
全局.getCurrentMessageId = () => 0;

/**
 * 最新楼层号。
 *
 * 它决定标题页点「开始游戏」之后去哪一页 —— 0 表示这局只有开场白、还没推进过, 该去创建
 * 角色; 否则进主界面(规则见 界面/入口/App.vue)。预览条上的「末楼」开关改的就是它。
 */
export const 末楼 = ref(3);
全局.getLastMessageId = () => 末楼.value;

// ---------------------------------------------------------------- 变量

/**
 * 变量。
 *
 * 真酒馆里它是挂在楼层上的 MVU 数据; 这里就是一个普通对象, 而且 `updateVariablesWith`
 * 直接就地改它 —— 所以界面上的操作(接诊、结算)改完能立刻看见, 不是死的。
 */
全局.getVariables = () => 假变量;
全局.updateVariablesWith = (改写: (变量: unknown) => void) => {
  改写(假变量);
};

// ---------------------------------------------------------------- 聊天

/** 假聊天。`getChatMessages` 给的是原始文本, 抠正文是界面自己的事(见 界面/主界面/正文.ts)。 */
const 聊天 = 假聊天.map(条 => ({ ...条 }));

/**
 * 此刻**存在**的楼层。
 *
 * 真酒馆里末楼 0 表示这局只有开场白一楼, 后面那三条还不存在。假聊天却一直摆着四条 ——
 * 不缩的话, 「末楼 0」这个状态下预览看到的是四条消息, 而真环境里只有一条。而创建页
 * 恰恰只在末楼 0 时出现, 开局那一下要验的就是这个落差, 不能糊过去。
 *
 * `slice` 不改数组元素本身(对象还是原来那些), 所以下面就地改 `有[...].message` 改的
 * 仍是 聊天 里的那一条。
 */
function 现有() {
  return 聊天.slice(0, 末楼.value + 1);
}

全局.getChatMessages = (范围: string | number) => {
  const 有 = 现有();
  if (typeof 范围 === 'number') {
    // 负数是从末尾数的深度: -1 就是最新一楼。
    const 位 = 范围 < 0 ? 有.length + 范围 : 范围;
    return 有[位] ? [有[位]] : [];
  }
  const 匹 = 范围.match(/^(-?\d+)\s*-\s*(.+)$/);
  if (!匹) return 有;
  // `'0-{{last}}'` 这种写法里末尾是个宏, 预览里没法展开, 直接当「最后一条」。
  const 止 = 匹[2].includes('{{last') ? 有.length - 1 : Number(匹[2]);
  return 有.slice(Number(匹[1]), 止 + 1);
};

全局.createChatMessages = async (条: { role: string; message: string }[]) => {
  for (const 一 of 条) {
    聊天.push({ message_id: 聊天.length, role: 一.role, message: 一.message });
  }
  // 新楼层一进来, 「末楼」就得跟着走 —— 否则刚发的消息会被上面的 slice 挡在外面,
  // 表现成"指令发出去了但界面没反应"。
  末楼.value = 聊天.length - 1;
};

// ---------------------------------------------------------------- 事件

const 监听表 = new Map<string, Set<(...参: unknown[]) => void>>();

全局.eventOn = (名: string, 回调: (...参: unknown[]) => void) => {
  if (!监听表.has(名)) 监听表.set(名, new Set());
  监听表.get(名)!.add(回调);
  return { stop: () => 监听表.get(名)?.delete(回调) };
};

function 发事件(名: string, ...参: unknown[]) {
  监听表.get(名)?.forEach(回 => 回(...参));
}

// 只列界面真的用到的那些(见 界面/主界面/App.vue 的收笔逻辑), 名字和真的一致。
全局.tavern_events = {
  APP_READY: 'app_ready',
  CHAT_CHANGED: 'chat_id_changed',
  GENERATION_STARTED: 'generation_started',
  GENERATION_STOPPED: 'generation_stopped',
  GENERATION_ENDED: 'generation_ended',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_UPDATED: 'message_updated',
  MESSAGE_SWIPED: 'message_swiped',
};

// ---------------------------------------------------------------- 其它

/**
 * 酒馆助手的错误兜底: 把函数包一层 try/catch。
 *
 * 真货出错时会弹 toast 并返回 undefined。这里照做, 但额外把原始错误打进 console ——
 * 预览里最怕的就是「界面白了但什么也不说」。
 */
全局.errorCatched = (函: (...参: unknown[]) => unknown) => (...参: unknown[]) => {
  try {
    return 函(...参);
  } catch (错) {
    console.error('[预览] 被 errorCatched 拦下的错:', 错);
    全局.toastr.error(String(错), '出错了');
  }
};

/**
 * 「重说 / 继续」在酒馆里是往真 LLM 发指令。预览里没有 LLM, 就换一段写好的备稿塞进最新一楼。
 *
 * 特意让它**有反应**: 点了没动静的话, 分不清是没实现还是坏了 —— 而这两件事在预览里
 * 要看起来完全不一样。
 */
let 稿次 = 0;

全局.triggerSlash = async () => {
  发事件(全局.tavern_events.GENERATION_STARTED);
  await new Promise(完 => setTimeout(完, 450));
  const 有 = 现有();
  有[有.length - 1].message = 备稿[稿次++ % 备稿.length];
  发事件(全局.tavern_events.GENERATION_ENDED);
  return '';
};
