import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
// 变量结构跟着前端一起搬去了 src/sxmnq/ —— 界面要用它来类型化 store, 两边共用同一份,
// 所以只能有一个出处。这里从卡脚本往上三层去取。
import { Schema } from '../../../sxmnq/schema';

$(() => {
  registerMvuSchema(Schema);
});
