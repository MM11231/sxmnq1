import { defineMvuDataStore } from '@util/mvu';
import $ from 'jquery';
import { Schema } from '../../schema';

// 放在 共用/ 而不是 主界面/ 下面: 创建页也要读写变量(开局那三个选择), 让它反过来
// import 主界面是反的。谁用谁 import 这一份就对了 —— pinia 按 store id 去重,
// 三处拿到的本来就是同一个实例。
//
// 这里**故意不写 message_id**。
//
// 界面挂死在第一楼不动, 变量却要跟着剧情往前跑。`mvu.ts` 里有个分支: message_id 省略
// 或写 'latest' 时会被归一成 -1, 也就是「永远指向最新一楼」。这正是我们要的语义 ——
// store 自己每 2 秒跟着最新一楼走, 界面不用管变量在哪层。
//
// 创建页只在末楼 = 0(刚开局)时出现, 那时候最新一楼就是第一楼, 语义正好对上。
const useMvuStore = defineMvuDataStore(Schema, { type: 'message' });
let 已监听 = false;
function 保留已有存档() {
  const 最新 = getChatMessages(-1)[0];
  if (!最新 || 最新.role !== 'assistant' || 最新.message_id === 0) return;
  const 当前 = getVariables({ type: 'message', message_id: 最新.message_id });
  if (当前.stat_data?.主角?.已创建) return;
  for (let 号 = 最新.message_id - 1; 号 >= 0; 号--) {
    const 之前 = getVariables({ type: 'message', message_id: 号 });
    if (!之前.stat_data?.主角?.已创建) continue;
    updateVariablesWith(vars => { vars.stat_data = klona(之前.stat_data); return vars; }, { type: 'message', message_id: 最新.message_id });
    console.warn('[存档] 新回复缺少已创建角色状态，继承上一楼存档', 最新.message_id, 号);
    return;
  }
}
export function useDataStore() {
  保留已有存档();
  if (!已监听) {
    已监听 = true;
    eventOn(tavern_events.MESSAGE_RECEIVED, 保留已有存档);
    eventOn(tavern_events.GENERATION_ENDED, 保留已有存档);
    const 计时 = setInterval(保留已有存档, 1000);
    $(window).on('pagehide', () => clearInterval(计时));
  }
  return useMvuStore();
}
