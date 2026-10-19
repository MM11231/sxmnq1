<template>
  <aside class="dossier" role="dialog" aria-modal="true" aria-label="哨兵档案" :style="{ paddingTop: `${props.避让}px` }">
    <header><strong>白塔 · 哨兵档案</strong><button @click="emit('关')">返回主界面</button></header>
    <div class="content">
        <div class="filters"><input v-model="搜索" placeholder="搜索姓名、等级或特征" aria-label="搜索哨兵" /><select v-model="来源" aria-label="筛选哨兵"><option value="全部">全部档案</option><option value="收藏">我的收藏</option><option value="已接诊">已接诊</option></select></div>
        <p class="muted">这里只收录已经接待过的哨兵。待接申请不会提前成为人物档案。</p>
        <div class="sentinels">
          <section class="roster" aria-label="哨兵名单"><div v-for="人 in 筛选名单" :key="人.名" class="roster-row"><button class="favorite" :class="{ saved: 收藏.includes(人.名) }" :aria-label="`${收藏.includes(人.名) ? '取消收藏' : '收藏'}${人.名}`" :aria-pressed="收藏.includes(人.名)" @click="切换收藏(人)">{{ 收藏.includes(人.名) ? '★' : '☆' }}</button><button :class="{ selected: 当前?.名 === 人.名 }" @click="选中 = 人.名"><span><b>{{ 人.名 }}</b><small>{{ 人.来源 }} · {{ 人.档.状态 }}</small></span><em>{{ 人.档.等级 }}级</em></button></div><p v-if="!筛选名单.length" class="muted">{{ 名单.length ? '没有匹配的哨兵。' : '暂无已接待的哨兵，完成接诊后将在这里建档。' }}</p></section>
          <section v-if="当前" class="detail" aria-label="哨兵详情"><small>{{ 当前.来源 }}</small><h2>{{ 当前.名 }} <em>{{ 当前.档.等级 }}级</em></h2><p>{{ 当前.档.年龄 }}岁 · {{ 地域名称(当前.档.地域) || '地域未记录' }} · {{ 当前.档.状态 }}</p><h3>污染度 · {{ 当前.档.污染度 }} / 100</h3><progress class="pollution" :value="当前.档.污染度" max="100" aria-label="污染度" /><template v-if="当前.关系"><h3>与你的关系</h3><p>信赖 {{ 当前.关系.信赖 }} · 好感 {{ 当前.关系.好感 }} · 已治疗 {{ 当前.关系.已治疗 }} 次</p><p class="muted">{{ 人称(当前.关系.$信赖) }} · {{ 人称(当前.关系.$好感) }}</p></template><p v-else class="muted">尚无接诊关系记录。</p><h3>精神体</h3><p>{{ 当前.档.精神体.名称 || '物种尚未记录' }}</p><p class="muted">{{ [当前.档.精神体.纲, 当前.档.精神体.栖息, 当前.档.精神体.体型].filter(Boolean).join(' · ') }}</p><h3>特征</h3><p>{{ 读取形象(当前.名, 当前.档).辨识特征.join(' · ') || '尚未记录' }}</p><h3>白塔人员档案</h3><p v-for="(段,i) in 档案叙述(当前)" :key="i" class="archive-prose">{{ 段 }}</p><h3>相处细节</h3><p v-if="当前.关系 && 当前.关系.信赖 >= 20">{{ 读取形象(当前.名, 当前.档).相处细节 }}</p><p v-else class="muted">信赖达到20后，可以了解更多生活习惯。</p><details v-if="当前.关系 && 当前.关系.信赖 >= 40 && 当前.档.B面"><summary>深入档案</summary><p>{{ 当前.档.B面 }}</p></details><p v-else class="muted">信赖达到40后，逐步了解更深的性格。</p><p class="muted">{{ 当前.档.战损来源 ? `战损：${当前.档.战损来源} · ` : '' }}诊金 {{ 当前.档.诊金 }}</p></section>
        </div>
    </div>
  </aside>
</template>
<script setup lang="ts">
import { useDataStore } from '../共用/数据';
import { 读取形象, 外貌描述, 地域名称 } from '../../生成/形象';
import type { Schema } from '../../schema';
const props = withDefaults(defineProps<{ 避让?: number }>(), { 避让: 0 });
const emit = defineEmits<{ 关: [] }>();
const store = useDataStore();
const 数据 = computed(() => store.data);
function 人称(文: string) { return 文.replaceAll('{{user}}', 数据.value.主角.姓名 || '你'); }
const 搜索 = ref('');
const 来源 = ref('全部');
const 选中 = ref('');
const 收藏 = ref<string[]>(getVariables({ type:'chat' }).白塔收藏 || []);
const 收藏档案 = ref<Record<string, Schema['今日']['申请列表'][string] | Schema['哨兵'][string]>>(getVariables({ type:'chat' }).白塔收藏档案 || {});
function 切换收藏(人: (typeof 名单.value)[number]) {
  if (收藏.value.includes(人.名)) { 收藏.value = 收藏.value.filter(名 => 名 !== 人.名); delete 收藏档案.value[人.名]; }
  else { 收藏.value.push(人.名); 收藏档案.value[人.名] = klona(人.档); }
  updateVariablesWith(vars => { vars.白塔收藏 = klona(收藏.value); vars.白塔收藏档案 = klona(收藏档案.value); return vars; }, { type:'chat' });
}
const 可入档 = (人: Schema['哨兵'][string] | Schema['今日']['申请列表'][string]) => '已治疗' in 人 && 人.已治疗 > 0;
const 名单 = computed(() => [...new Set([...Object.keys(数据.value.哨兵), ...Object.keys(收藏档案.value)])].map(名 => {
  const 关系 = 数据.value.哨兵[名];
  return { 名, 关系, 档: 关系 || 收藏档案.value[名], 来源:关系 ? '已接诊' : '收藏档案' };
}).filter(人=>可入档(人.档)));
function 档案叙述(人: (typeof 名单.value)[number]) {
  const 档=人.档;
  const 形象=读取形象(人.名, 档);
  return [
    `${人.名}，${档.年龄}岁，${档.等级}级哨兵。${档.地域 ? '来自'+地域名称(档.地域)+'。' : '籍贯尚未记录。'}`,
    `初见印象：${外貌描述(形象)}${形象.亚种 === '人类' ? '' : '族型为'+形象.亚种+'。'}`,
    `精神体为${档.精神体.名称 || '尚未确认的物种'}。${[档.精神体.栖息,档.精神体.体型,档.精神体.危险].filter(Boolean).join(' · ')}。这些信息可用于辨认其精神体，并为疏导时的接触提供参考。`,
    `医疗记录：${档.战损来源 || '战损来源尚未记录'}。当前污染度${档.污染度}，${档.污染度 >= 60 ? '需要谨慎安排疏导并关注污染反应。' : 档.污染度 > 0 ? '仍有污染残留，后续接诊时可继续观察恢复情况。' : '当前无污染残留，可在后续值班日安排复查。'}`,
  ];
}
const 筛选名单 = computed(() => 名单.value.filter(人 => (来源.value === '全部' || (来源.value === '收藏' ? 收藏.value.includes(人.名) : 人.来源 === 来源.value)) && `${人.名} ${人.档.等级} ${人.档.特征.join(' ')}`.toLowerCase().includes(搜索.value.trim().toLowerCase())));
const 当前 = computed(() => 筛选名单.value.find(人 => 人.名 === 选中.value) || 筛选名单.value[0]);
</script>
<style scoped>
.dossier{position:absolute;inset:0;z-index:20;background:#171e1d;color:#eee9df;display:flex;flex-direction:column;box-sizing:border-box;text-align:left;font-size:14px}
header,nav{display:flex;align-items:center;gap:12px;padding:12px 16px;flex:none;border-bottom:1px solid #ffffff15}header{justify-content:space-between}button,input,select{font:inherit;color:inherit}button{cursor:pointer;background:#ffffff08;border:1px solid #ffffff20;border-radius:7px;padding:8px 12px}button:hover,button.active,button.selected{border-color:#cfb678;background:#cfb67818}nav button{flex:1}.content{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:16px;max-width:1050px;width:100%;box-sizing:border-box;align-self:center}section{padding:16px;margin-bottom:12px;border:1px solid #ffffff14;border-radius:12px;background:#ffffff03}h2{font-size:24px;margin:8px 0}h3{font-size:15px;color:#dcc595;margin:0 0 12px}p{line-height:1.8;margin:6px 0;overflow-wrap:anywhere}small,.muted{color:#b7c1b9}small{display:block;line-height:1.7}.identity{background:linear-gradient(110deg,#52695035,#c5a67112)}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stats strong{display:block;font-size:21px;margin:8px 0}progress{width:100%;height:8px;accent-color:#bdcaaa}.attribute{display:flex;align-items:center;gap:14px;margin:14px 0}.attribute span{width:32px}.attribute b{width:32px;text-align:right}.attribute progress{flex:1}.accent{color:#e4ca91}li{line-height:1.9}ul{padding-left:20px}.filters{display:flex;gap:10px;margin-bottom:10px}.filters input,.filters select{min-width:0;border:1px solid #ffffff25;background:#202b28;border-radius:7px;padding:10px}.filters input{flex:1}.sentinels{display:grid;grid-template-columns:minmax(180px,0.65fr) minmax(0,1.35fr);gap:16px;margin-top:16px}.roster{padding:8px;align-self:start}.roster button{display:flex;width:100%;align-items:center;justify-content:space-between;text-align:left;gap:10px;margin-bottom:7px}.roster button:last-child{margin-bottom:0}em{font-style:normal;color:#e4ca91;white-space:nowrap}.detail h3{margin-top:20px}.pollution{accent-color:#dc947f}summary{cursor:pointer;color:#bfcfb7;padding:8px 0}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #e4ca91;outline-offset:2px}@media(max-width:600px){.stats{grid-template-columns:repeat(2,1fr)}.content{padding:12px}.sentinels{grid-template-columns:1fr}.roster{max-height:210px;overflow:auto}.filters{flex-wrap:wrap}.filters input{width:100%}header{padding:10px 12px}header button{padding:7px 9px}}

/* 以档案纸页的层次替代成排方框。 */
.dossier{font-size:16px;background:radial-gradient(ellipse at 90% 0,#51624a20,transparent 60%),#171e1d}
header{padding:18px 24px;border-bottom:0;color:#e9dec5}header strong{font-size:18px;letter-spacing:2px}
nav{padding:0 24px;gap:26px;border-bottom:1px solid #b0ab862a}nav button{flex:none;border:0!important;border-radius:0!important;background:none!important;padding:12px 0;font-size:16px;color:#afb8ad;position:relative}nav button.active{color:#edd7a4}nav button.active:after{content:'';height:2px;background:#d8be80;position:absolute;bottom:0;left:0;right:0}
.content{max-width:1100px;padding:24px 32px}.profile{display:grid;grid-template-columns:1fr 1fr;column-gap:40px}.profile>section{border:0;border-radius:0;background:none;padding:22px 0;margin:0;border-top:1px solid #acaf8c30}.profile>.identity,.profile>.stats{grid-column:1/-1}
.profile>.identity{position:relative;border-top:0;padding:14px 0 24px;overflow:hidden}.identity small{letter-spacing:3px;font-size:12px;color:#b9af91}.identity h2{font-size:36px;letter-spacing:4px;font-weight:400;margin:10px 0}.identity p{color:#c1caba}.rank-seal{position:absolute;right:12px;top:-30px;font:150px Georgia,serif;color:#c8b48318;pointer-events:none}
.stats{gap:0;border-top:1px solid #acaf8c30;border-bottom:1px solid #acaf8c30;margin:0 0 12px}.stats section{border:0;background:none;border-radius:0;margin:0;padding:20px 20px 20px 0}.stats small{font-size:14px}.stats strong{font-size:25px;font-weight:400;color:#e9d5a9}.stats progress{max-width:170px;height:5px}.attribute{margin:18px 0}.attribute progress{height:5px}h3{font-size:18px;font-weight:400;letter-spacing:2px}p{line-height:1.9;color:#e4e8df}.muted{font-size:14px;line-height:1.85}.filters input,.filters select{background:#ffffff04;border-color:#8d957d66;border-radius:3px}.sentinels{gap:32px}.roster{border:0;background:none;padding:0}.roster button{border:0;border-bottom:1px solid #a3ab8630;border-radius:0;padding:16px 12px;background:none}.roster button.selected{background:#b5bd8a12;box-shadow:inset 2px 0 #d8be80}.roster b{font-size:19px;font-weight:400}.roster small{font-size:13px}.detail{border:0;border-left:1px solid #a3ab8630;border-radius:0;background:none;padding:12px 0 20px 28px}.detail h2{font-size:29px;font-weight:400}.detail h2 em{font-size:17px;margin-left:12px}.detail h3{font-size:17px}.detail .muted{color:#b8c0ae}
@media(max-width:600px){header{padding:14px 16px;gap:8px}header strong{font-size:16px;letter-spacing:1px}header button{font-size:14px}nav{padding:0 16px;gap:24px}.content{padding:18px 20px}.profile{grid-template-columns:1fr;gap:0}.identity h2{font-size:30px}.rank-seal{font-size:125px}.stats{grid-template-columns:repeat(2,1fr)}.stats section{padding:14px 0}.profile>section{padding:20px 0}.sentinels{gap:20px}.roster{max-height:245px}.roster button{padding:13px 10px}.detail{border-left:0;border-top:1px solid #a3ab8630;padding:20px 0}.filters{gap:8px}.filters input{flex-basis:100%}}
.roster-row{display:flex;align-items:stretch}.roster-row>button:not(.favorite){flex:1;min-width:0}.roster .favorite{width:42px;flex:none;justify-content:center;padding:8px 4px;font-size:25px;color:#949c8c}.roster .favorite.saved{color:#f0cf7e}.roster .favorite:hover{color:#f0cf7e}
.archive-prose{line-height:2.05;margin:16px 0;text-align:justify}.detail{max-width:760px}
</style>
