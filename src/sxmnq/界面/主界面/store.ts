import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';

// 这里**故意不写 message_id**。
//
// 界面挂死在第一楼不动, 变量却要跟着剧情往前跑。`mvu.ts` 里有个分支: message_id 省略
// 或写 'latest' 时会被归一成 -1, 也就是「永远指向最新一楼」。这正是我们要的语义 ——
// store 自己每 2 秒跟着最新一楼走, 界面不用管变量在哪层。
export const useDataStore = defineMvuDataStore(Schema, { type: 'message' });
