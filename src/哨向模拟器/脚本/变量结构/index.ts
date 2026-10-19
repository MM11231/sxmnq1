import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
// 变量结构跟着前端一起搬去了 src/sxmnq/ —— 界面要用它来类型化 store, 两边共用同一份,
// 所以只能有一个出处。这里从卡脚本往上三层去取。
import { Schema } from '../../../sxmnq/schema';
import { 读取形象 } from '../../../sxmnq/生成/形象';

$ (async () => {
  await waitGlobalInitialized('Mvu');
  registerMvuSchema(Schema);
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (newVariables, oldVariables) => {
    // 形象属于程序生成的身份资料，模型回复不得改写或清空。
    for (const path of ['哨兵', '今日.申请列表']) {
      const previous = _.get(oldVariables, 'stat_data.' + path, {});
      const next = _.get(newVariables, 'stat_data.' + path, {});
      _.forOwn(previous, (record, name) => {
        if (!next[name] || !record || typeof record.地域 !== 'string' || !Array.isArray(record.特征)) return;
        next[name].形象 = _.cloneDeep(读取形象(name, record));
      });
    }
    if (_.get(oldVariables, 'stat_data.主角.路线') !== '白塔向导路线') return;
    for (const key of ['向导', '日程', '创作', '购物', '今日']) {
      const previous = _.get(oldVariables, 'stat_data.' + key);
      if (previous) _.set(newVariables, 'stat_data.' + key, _.cloneDeep(previous));
    }
    const 生活 = _.get(oldVariables, 'stat_data.世界.生活');
    if (生活) _.set(newVariables, 'stat_data.世界.生活', _.cloneDeep(生活));
    if (_.get(oldVariables, 'stat_data.日程.起始日期')) {
      for (const key of ['日期', '时段', '时刻', '地点', '天气', '季节', '温度', '星期']) _.set(newVariables, 'stat_data.世界.' + key, _.get(oldVariables, 'stat_data.世界.' + key));
    }
  });
});
