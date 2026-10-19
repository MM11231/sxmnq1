<template>
  <section class="day-panel" :class="{ 'map-day': !值班 || props.浏览地图 }">
    <header v-if="值班 && !props.浏览地图" class="day-header"><span>精力 {{ 数据.主角.精神力 }}/{{ 数据.主角.精神力上限 }} · 金钱 {{ 数据.主角.金钱 }}</span><div class="profile-actions"><button :disabled="忙" @click="商业窗口 = 'bag'">背包</button><button @click="弹窗 = '个人资料'">向导资料</button><button @click="弹窗 = '晋升条件'">晋升条件</button></div></header>
    <div v-else-if="值班" class="browse-bar"><span>白塔导览 · 今日值班，仅供浏览</span><button @click="emit('返回接诊')">返回接诊</button></div>
    <div v-else class="exploration-bar"><span class="energy">精力 {{ 数据.主角.精神力 }}/{{ 数据.主角.精神力上限 }} · 金钱 {{ 数据.主角.金钱 }}</span><div class="time-slots" aria-label="今日活动进度"><span v-for="(名, 序) in ['上午', '下午', '晚上']" :key="名" :class="{ done: 序 < 数据.日程.时段, current: 序 === 数据.日程.时段 }">{{ 名 }}</span></div><div class="profile-actions"><button :disabled="忙" @click="商业窗口 = 'bag'">背包</button><button @click="弹窗 = '个人资料'">向导资料</button><button @click="弹窗 = '晋升条件'">晋升条件</button></div><button :disabled="忙 || !!数据.日程.考核目标" @click="结算开 = true">结束今日</button></div>
    <div v-if="值班 && !props.浏览地图" class="day-goal"><span>{{ 数据.向导.等级 }}级向导 · 经验 {{ 数据.向导.经验 }}/100<template v-if="数据.向导.已通关"> · 已通关</template></span></div>
    <div v-if="值班 && !props.浏览地图" class="stats"><div v-for="属性 in 属性名" :key="属性"><span>{{ 属性 }}</span><b>{{ 数据.向导[属性] }}</b><div class="stat-track"><i :style="{ width: `${数据.向导[属性]}%` }" /></div></div></div>
    <div v-if="值班 && !props.浏览地图" class="day-tools"><span>值班津贴 80 金 · 每次接诊另加 20 金</span><button v-if="数据.日程.上日结算" @click="弹窗 = '上一日结算'">上一日结算</button><button v-if="数据.日程.偶遇" @click="弹窗 = '今日相遇'">今日相遇</button></div>
    <!-- 保持申请组件常驻，保留日期监听与病人生成；休息日隐藏并在组件入口阻止接诊。 -->
    <div v-show="值班 && !props.浏览地图" class="day-stage"><ApplyPanel :紧凑="true" @忙="治疗忙 = $event" @剧情="emit('剧情')" @请求完成="emit('请求完成')" @错误="emit('错误', $event)" /></div>
    <div v-show="!值班 || props.浏览地图" class="day-stage is-exploration"><MapAtlas ref="地图元素" :invitation="已接受邀约" :compact="true" :activity-mode="true" :read-only="值班" :disabled="值班 || 忙 || 数据.日程.时段 >= 3" :connected="true" :current-location-id="当前位置" :scene-context="场景上下文" :season="数据.世界.季节" @action="地图活动" @shop="!值班 && !忙 && (商业窗口 = $event)" /></div>
    <CommercePanel v-if="商业窗口" :data="数据" :shop="商业窗口 === 'bag' ? '' : 商业窗口" :blocked="治疗忙 || 叙事忙 || !!props.生成中 || !!数据.日程.考核目标" @close="商业窗口 = ''" />
    <article v-if="反馈" class="feedback" role="status">{{ 反馈 }}</article>
    <SentinelEvent v-if="待邀约" :invitation="待邀约" :identity="人物简介(待邀约.姓名)" @choose="选择邀约" />
    <SentinelEvent v-else-if="待偶遇" :encounter="待偶遇" :identity="人物简介(待偶遇.姓名)" @choose="选择偶遇" />
    <ExploreEvent v-if="数据.世界.生活.探索.待处理" :pending="数据.世界.生活.探索.待处理" @choose="回应事件" />
    <StoryChoice v-if="行动选择开" title="行动完成" :text="行动摘要" :busy="叙事忙" :end-of-day="数据.日程.时段 >= 3" :skip-label="数据.日程.时段 >= 3 ? '查看今日结算' : '继续探索'" @story="写行动" @skip="跳过行动剧情" />
    <div v-if="值班 && !props.浏览地图" class="day-ending"><span>已完成 {{ 数据.日程.已接诊 }} 次治疗 · 今日经验 +{{ 数据.日程.本日经验 }}</span><button :disabled="忙 || !!数据.日程.考核目标" @click="结算开 = true">结束值班 → 明天休息</button></div>
    <Teleport to="body"><div v-if="结算开 || 弹窗" class="day-backdrop" @click.self="关闭弹窗" @keydown.esc.stop="关闭弹窗"><section ref="弹窗元素" class="day-dialog" role="dialog" aria-modal="true" :aria-label="结算开 ? '今日结算' : 弹窗" tabindex="-1" @keydown.tab="约束焦点"><header><h3>{{ 结算开 ? '今日结算' : 弹窗 }}</h3><button :disabled="忙" aria-label="关闭弹窗" @click="关闭弹窗">× 返回</button></header><div class="dialog-body">
      <template v-if="结算开"><p v-for="(记录, i) in 数据.日程.活动记录" :key="i">{{ 记录 }}</p><p v-if="!数据.日程.活动记录.length">今天提前休息，没有进行活动。</p><p>睡眠恢复全部精力。明天自动进入{{ 值班 ? '地图探索' : '治疗值班' }}。</p><p v-if="值班 && !props.浏览地图">治疗结果已保存，对话由你自行选择。结束值班只结算今天。</p></template>
      <template v-else-if="弹窗 === '个人资料'">
        <div class="profile-identity"><small>白塔人员档案</small><h2>{{ 数据.主角.姓名 || '未命名向导' }}</h2><span>{{ 数据.主角.身份 }} · {{ 数据.向导.等级 }}级</span><p>{{ 数据.世界.地点 || '白塔' }}</p></div>
        <dl class="profile-summary"><div><dt>治疗精力</dt><dd>{{ 数据.主角.精神力 }} / {{ 数据.主角.精神力上限 }}</dd></div><div><dt>持有金钱</dt><dd>{{ 数据.主角.金钱 }} 金</dd></div><div><dt>向导经验</dt><dd>{{ 数据.向导.经验 }} / 100</dd></div><div><dt>今日接诊</dt><dd>{{ 数据.日程.已接诊 }} 次</dd></div></dl>
        <h4 class="section-label">能力属性</h4><div class="profile-attributes"><div v-for="属性 in 属性名" :key="属性"><span>{{ 属性 }}</span><progress :value="数据.向导[属性]" max="100" :aria-label="属性" /><b>{{ 数据.向导[属性] }}</b></div></div>
        <div class="profile-schedule"><span>今日安排</span><b>第{{ 数据.日程.天数 }}天 · {{ 值班 ? '治疗值班' : '休息探索' }} · {{ 数据.世界.时段 }}</b></div><p class="profile-note">精神力用于治疗。探索占用活动时段；睡眠、休息和餐食可恢复治疗精力。</p>
        <div class="profile-history"><button @click="弹窗 = ''; emit('序章')">回看序章</button><button v-if="数据.日程.上日结算" @click="弹窗 = '上一日结算'">上一日结算</button><button v-if="数据.日程.偶遇" @click="弹窗 = '今日相遇'">今日相遇</button></div>
      </template>
      <template v-else-if="弹窗 === '晋升条件'">
        <template v-if="晋升"><div class="promotion-heading"><span>{{ 数据.向导.等级 }}级 → {{ 晋升.目标 }}级</span><b>{{ 缺口.length ? '准备中' : '数值已达标' }}</b></div>
          <table class="promotion-table"><caption>晋升所需经验与属性</caption><thead><tr><th scope="col">指标</th><th scope="col">当前</th><th scope="col">要求</th><th scope="col">状态</th></tr></thead><tbody><tr v-for="项 in 晋升指标" :key="项.名称"><th scope="row">{{ 项.名称 }}</th><td>{{ 项.当前 }}</td><td>{{ 项.要求 }}</td><td :class="{ met: 项.当前 >= 项.要求 }">{{ 项.当前 >= 项.要求 ? '已达标' : `差 ${项.要求 - 项.当前}` }}</td></tr></tbody></table>
          <div class="exam-requirements"><h4>{{ 晋升.考核 }}</h4><p>休息日上午开始，占用上午和下午。</p><p>至少保留 40 精力，治疗评分 A 或 S 为通过。</p><p v-if="晋升.目标 === 'S'">深渊救援需要依次完成两名队员的疏导。</p></div><p class="exam-readiness">{{ 缺口.length ? '完成治疗积累经验，休息日探索提升属性。' : 值班 ? '条件已达标，可在明天休息日上午参加考核。' : 数据.日程.时段 !== 0 ? '考核需要完整的上午，请在下个休息日上午参加。' : 数据.主角.精神力 < 40 ? '精力不足 40，充分恢复后再参加。' : '准备就绪，可以参加考核。' }}</p>
          <button class="exam-start" :disabled="忙 || 值班 || 数据.日程.时段 !== 0 || !!缺口.length || 数据.主角.精神力 < 40" @click="考核">参加{{ 晋升.目标 }}级考核</button>
        </template><div v-else class="promotion-finished"><h2>S级向导</h2><p>已达到最高等级，完成白塔向导之路。</p><p>可以继续治疗、探索和发展关系。</p></div>
      </template>
      <pre v-else-if="弹窗 === '上一日结算'">{{ 数据.日程.上日结算 }}</pre>
      <template v-else><h3>{{ 数据.日程.偶遇 }}</h3><p>今日见闻已经保存。可以请旁白展开记录中的片段。</p><button :disabled="忙" @click="写偶遇">让旁白描写这次相遇</button></template>
      </div><footer v-if="结算开"><button :disabled="忙" @click="过夜">确认睡眠，进入明天</button><button :disabled="忙" @click="关闭弹窗">继续今天</button></footer></section></div></Teleport>
    <Teleport to="body"><div v-if="数据.日程.考核目标" class="exam-screen"><header><h2>{{ 数据.日程.考核目标 === 'S' ? '深渊救援 · S级晋升' : `${数据.日程.考核目标}级晋升考核` }}</h2><p>{{ 数据.日程.考核阶段 === 1 ? '第一名队员已稳定，继续救援第二名队员。' : '梳理精神丝线，治疗评分达到 A 或 S 即可通过。' }}</p></header><TreatmentPanel :key="`${数据.日程.考核目标}-${数据.日程.考核阶段}`" :哨兵姓名="数据.日程.考核目标 === 'S' ? `受困小队队员${数据.日程.考核阶段 + 1}` : '考核病例'" :参数="考核参数" @结算="考核结算" @取消="取消考核" /></div></Teleport>
  </section>
</template>

<script setup lang="ts">
import { 请求正文 } from '../共用/剧情请求';
import { computed, ref, watch, watchEffect, nextTick } from 'vue';
import ApplyPanel from '../申请/App.vue';
import StoryChoice from '../共用/StoryChoice.vue';
import TreatmentPanel from '../治疗/App.vue';
import MapAtlas from './地图/InteractiveMap.vue';
import CommercePanel from './CommercePanel.vue';
import { locations, type MapLocation } from './地图/locations';
import { useDataStore } from '../共用/数据';
import { 掷一个 } from '../../生成/生成';
import { 更新城市 } from '../../养成/城市生活';
import { 年历位置, 格式日期, 转换旧年历, 今日节庆 } from '../../养成/年历';
import { 安排探索事件, 处理探索事件 } from '../../养成/探索事件';
import ExploreEvent from './ExploreEvent.vue';
import SentinelEvent from './SentinelEvent.vue';
import { 准备今日邀约, 回应邀约, 当前邀约, 参加邀约, 安排哨兵偶遇, 回应哨兵偶遇 } from '../../养成/哨兵社交';
import { 属性名, 时段名, 晋升表, 晋升缺口, 是值班日, 活动列表, 执行活动, 结束一天, 开始考核, 结算考核 } from '../../养成/规则';
import type { 治疗结果, 治疗参数 } from '../治疗/game';
import { 结算传播, 固定读者快照 } from '../../创作/作品';
import { 地点场景 } from '../../创作/场景';
const props = withDefaults(defineProps<{ 生成中?: boolean; 浏览地图?: boolean; 正在显示?: boolean }>(), { 生成中: false, 正在显示: true });
const emit = defineEmits<{ 返回接诊: []; 序章: []; 忙: [boolean]; 剧情: []; 请求完成: []; 错误: [string] }>();
const store = useDataStore();
const 数据 = computed(() => store.data);
const 场景上下文 = computed(() => ({ 天数: 数据.value.日程.天数, 时段: 数据.value.日程.时段, 天气: 数据.value.世界.天气, 历日: 年历位置(数据.value.日程.天数, 数据.value.日程.历法偏移), 创作: 数据.value.创作 }));
const 商业窗口 = ref('');
const 地图元素 = ref<InstanceType<typeof MapAtlas>>();
const 已接受邀约 = computed(() => 当前邀约(数据.value));
const 待邀约 = computed(() => { const 约 = 数据.value.世界.生活.社交.今日邀约; return props.正在显示 && 数据.value.日程.天数 % 2 === 0 && 约?.天数 === 数据.value.日程.天数 && 约.状态 === '待回应' ? 约 : null; });
const 待偶遇 = computed(() => props.正在显示 ? 数据.value.世界.生活.社交.待偶遇 : null);
function 人物简介(名: string) { const 人 = 数据.value.哨兵[名]; return 人 ? 人.等级 + '级哨兵 · 精神体 ' + (人.精神体.名称 || '尚未记录') : '曾接待过的哨兵'; }
const 治疗忙 = ref(false);
const 叙事忙 = ref(false);
const 行动选择开 = ref(false);
const 行动摘要 = ref('');
let 行动提示 = '';
let 行动消息号 = -1;
const 忙 = computed(() => !!待邀约.value || !!待偶遇.value || !!数据.value.世界.生活.探索.待处理 || !!商业窗口.value || 治疗忙.value || 叙事忙.value || 行动选择开.value || props.生成中 || !!数据.value.日程.考核目标);
watch(忙, value => emit('忙', value), { immediate: true });
const 值班 = computed(() => 是值班日(数据.value.日程));
const 缺口 = computed(() => 晋升缺口(数据.value.向导));
const 晋升 = computed(() => 数据.value.向导.等级 === 'S' ? undefined : 晋升表[数据.value.向导.等级]);
const 晋升指标 = computed(() => [
  { 名称: '经验', 当前: 数据.value.向导.经验, 要求: 100 },
  ...属性名.map(名称 => ({ 名称, 当前: 数据.value.向导[名称], 要求: 晋升.value?.门槛 ?? 100 })),
]);
const 结算开 = ref(false);
const 弹窗 = ref('');
const 弹窗元素 = ref<HTMLElement>();
let 原焦点: HTMLElement | null = null;
watch(() => 结算开.value || !!弹窗.value, async 开 => {
  if (开) { 原焦点 = document.activeElement as HTMLElement; await nextTick(); 弹窗元素.value?.focus(); }
  else 原焦点?.focus();
});
function 关闭弹窗() { if (!忙.value) { 结算开.value = false; 弹窗.value = ''; } }
function 约束焦点(event: KeyboardEvent) {
  const 按钮 = Array.from(弹窗元素.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
  const 首 = 按钮[0], 末 = 按钮.at(-1);
  if (!首) { event.preventDefault(); return; }
  if (event.shiftKey && (document.activeElement === 首 || document.activeElement === 弹窗元素.value)) { event.preventDefault(); 末?.focus(); }
  else if (!event.shiftKey && (document.activeElement === 末 || document.activeElement === 弹窗元素.value)) { event.preventDefault(); 首.focus(); }
}
const 反馈 = ref('');
const 当前位置 = computed(() => locations.find(location => 数据.value.世界.地点.includes(location.name.replace(/ · [12]F/, '')))?.id ?? '');
// 日期与时段由前端日程确定，AI 不能用一句“第二天”切换玩法。
watchEffect(() => {
  const data = 数据.value;
  固定读者快照(data.创作, data.日程.天数);
  if (!data.日程.起始日期) data.日程.起始日期 = data.世界.日期 || '2026年01月01日';
  转换旧年历(data);
  更新城市(data.世界, data.日程.起始日期, data.日程.天数, data.日程.历法偏移);
  data.世界.日期 = 格式日期(年历位置(data.日程.天数, data.日程.历法偏移));
  data.世界.时段 = 时段名[data.日程.时段];
  data.世界.时刻 = ['09:00', '14:00', '19:00', '22:00'][data.日程.时段];
});
watchEffect(() => {
  if (!props.正在显示 || props.生成中 || 治疗忙.value || 叙事忙.value || 行动选择开.value || 商业窗口.value || 结算开.value || 弹窗.value) return;
  准备今日邀约(数据.value);
});
async function 选择邀约(接受: boolean) {
  try { const 提示 = 回应邀约(数据.value, 接受); 反馈.value = 数据.value.世界.生活.社交.今日邀约?.状态 === '已过期' ? 提示 : ''; if (接受 && 已接受邀约.value) { await nextTick(); 地图元素.value?.前往地点(已接受邀约.value.地点id); } }
  catch (error) { 反馈.value = String(error); }
}
function 结算社交行动(结果: string) {
  行动摘要.value = 结果 + '\n是否开启这次行动的剧情？';
  行动提示 = '【地图社交】' + 数据.value.世界.日期 + '。白塔历每季30天、每年四季。' + 结果 + '\n人物沿用已接诊档案。选择、时段、关系和精力已由前端结算，不重复奖励，不推进时间，不预设恋爱或亲密接触，不夸大患者对向导的依赖，不替玩家决定下一步。';
  行动消息号 = -1; 行动选择开.value = true;
}
function 选择偶遇(交谈: boolean) {
  if (!数据.value.世界.生活.社交.待偶遇) return;
  try { 结算社交行动(回应哨兵偶遇(数据.value, 交谈)); } catch (error) { 反馈.value = String(error); }
}
function 过夜() {
  if (忙.value) return;
  try {
    if (数据.value.日程.考核目标) throw Error('考核尚未结束。');
    if (是值班日(数据.value.日程)) {
      const 津贴 = 80 + 数据.value.日程.已接诊 * 20;
      数据.value.主角.金钱 += 津贴;
      数据.value.日程.活动记录.push(`值班津贴 +${津贴} 金`);
    }
    结束一天(数据.value.日程, 数据.value.主角);
    结算传播(数据.value.创作, 数据.value.日程.天数);
    if (值班.value) 数据.value.世界.地点 = '白塔·治疗中心';
    结算开.value = false; 反馈.value = ''; console.info('[向导] 日程进入第', 数据.value.日程.天数, '天');
  } catch (error) { 反馈.value = String(error); }
}
function 地图活动(payload: { location: MapLocation; action: string }) {
  if (忙.value || 值班.value) return;
  if (payload.action === '参加活动') {
    try { 结算社交行动(参加邀约(数据.value, payload.location.id)); 反馈.value = '赴约完成，活动和关系已保存。'; } catch (error) { 反馈.value = String(error); }
    return;
  }
  const 活 = 活动列表(payload.location).find(item => item.名称 === payload.action);
  if (!活) return;
  // 受限区提供门外/公共区活动，未取得许可不会移动到内部。
  const restricted = ['villa', 'dorm5', 'assessment', 'simulation', 'gate'].includes(payload.location.id);
  if (restricted) { 反馈.value = `${payload.location.name}需要相应许可，请在开放训练场或公共区域活动。`; return; }
  try {
    const 原时段 = 数据.value.日程.时段;
    const 活动时段 = 时段名[原时段];
    const 活动场景 = 地点场景(payload.location, 场景上下文.value);
    const 旧精力 = 数据.value.主角.精神力;
    const 旧金钱 = 数据.value.主角.金钱;
    const 旧属性 = 活.属性 ? 数据.value.向导[活.属性] : 0;
    执行活动(数据.value.日程, 数据.value.向导, 数据.value.主角, 活);
    数据.value.世界.地点 = '白塔·' + payload.location.name.replace(/ · [12]F/, '');
    反馈.value = 活.属性 ? `${活.名称}完成，${活.属性} +${活.收益}${活.费用 ? `，花费 ${活.费用} 金` : '，免费'}。` : '休息完成，精力恢复。';
    数据.value.日程.偶遇 = '';
    const 节 = 今日节庆(年历位置(数据.value.日程.天数, 数据.value.日程.历法偏移));
    const 节庆优先 = 节?.地点.includes(payload.location.id) && !(节.id === 'stars' && 原时段 < 2) && !数据.value.世界.生活.探索.节庆足迹.includes(年历位置(数据.value.日程.天数, 数据.value.日程.历法偏移).年 + ':' + 节.id);
    if (节庆优先) 安排探索事件(数据.value, payload.location, 原时段);
    if (!数据.value.世界.生活.探索.待处理) 安排哨兵偶遇(数据.value, payload.location, 原时段);
    if (!数据.value.世界.生活.社交.待偶遇) 安排探索事件(数据.value, payload.location, 原时段);
    行动摘要.value = `${payload.location.name} · ${活动时段}\n${活.名称}已完成。${活.属性 ? `${活.属性} +${数据.value.向导[活.属性] - 旧属性}，` : ''}${活.费用 ? `金钱 −${活.费用}，` : '免费，'}治疗精力 ${数据.value.主角.精神力 - 旧精力 >= 0 ? '+' : ''}${数据.value.主角.精神力 - 旧精力}；剩余 ${3 - 数据.value.日程.时段} 个活动时段。${数据.value.日程.偶遇 ? `\n${数据.value.日程.偶遇}` : ''}\n是否开启这次行动的剧情？`;
    行动提示 = `【地图行动】${数据.value.世界.日期} ${活动时段}，在${payload.location.name}完成${活.名称}。现场：${活动场景.描写}${活动场景.闲谈 ? '\n短暂闲谈：' + 活动场景.闲谈 : ''}\n${行动摘要.value}\n行动、属性、金钱、治疗精力、偶遇信赖和遭遇奖励已由前端结算。只描写这次行动${数据.value.日程.偶遇 ? '和记录中的偶遇' : '，不要强行安排待诊病例登场'}，不要再次修改已结算数值，不推进日期、时段，不替玩家决定下一步。`;
    行动消息号 = -1;
    行动选择开.value = !数据.value.世界.生活.探索.待处理 && !数据.value.世界.生活.社交.待偶遇;
  } catch (error) { 反馈.value = String(error); }
}
function 回应事件(选择: string) {
  if (!数据.value.世界.生活.探索.待处理) return;
  try {
    const 结果 = 处理探索事件(数据.value, 选择);
    行动摘要.value = 结果 + '\n是否开启这次行动的剧情？';
    行动提示 = '【地图行动】' + 数据.value.世界.日期 + '。白塔历每季30天、每年四季。' + 结果 + '\n今日见闻：' + 数据.value.日程.偶遇 + '\n行动和奖励已经由前端结算。只描写记录中的行动与回应，不补发奖励、不推进日期或时段，不替玩家决定下一步。没有姓名的见闻无需强行安排哨兵登场。';
    行动消息号 = -1; 行动选择开.value = true;
  } catch (error) { 反馈.value = String(error); }
}
function 跳过行动剧情() {
  if (叙事忙.value) return;
  行动选择开.value = false;
  if (数据.value.日程.时段 >= 3) 结算开.value = true;
}
async function 写行动() {
  if (叙事忙.value || props.生成中 || !行动提示) return;
  叙事忙.value = true; 行动选择开.value = false;
  try {
    await nextTick();
    if (行动消息号 < 0) {
      await createChatMessages([{ role: 'user', message: `<地图行动指令>${行动提示}</地图行动指令>`, data: { ...klona(getVariables({ type: 'message', message_id: 'latest' })), stat_data: klona(store.data) } }]);
      行动消息号 = getLastMessageId();
    }
    const 最新 = getChatMessages(-1)[0];
    if (最新?.message_id !== 行动消息号 && !(最新?.role === 'assistant' && 最新.message_id === 行动消息号 + 1)) throw Error('已有后续对话，请在主界面继续。');
    emit('剧情');
    await 请求正文(最新?.role === 'assistant' ? '/regenerate await=true' : '/trigger await=true');
    emit('请求完成');
  } catch (error) {
    console.error('[向导] 行动剧情请求失败，结算已保留', error);
    行动摘要.value = '行动结果已保存，对话请求未完成。可以重试开启剧情，或继续探索。';
    emit('错误', error instanceof Error ? error.message : String(error));
  } finally { 叙事忙.value = false; }
}
async function 写偶遇() {
  if (忙.value || !数据.value.日程.偶遇) return;
  叙事忙.value = true;
  try {
    await createChatMessages([{ role: 'user', message: `【地图见闻】${数据.value.世界.日期}，白塔历每季30天、每年四季。${数据.value.日程.偶遇}。只展开记录中的见闻；有姓名的人物沿用对应档案，没有姓名的事件无需强行安排哨兵登场。活动、奖励与信赖已经结算，不要额外增加数值或推进日期、时段，不替玩家决定下一步。` }]);
    emit('剧情');
    await 请求正文('/trigger await=true');
    emit('请求完成');
  } catch (error) { console.error('[向导] 偶遇叙事失败', error); 反馈.value = '相遇记录已保存，暂时未能生成剧情。'; emit('错误', error instanceof Error ? error.message : String(error)); }
  finally { 叙事忙.value = false; }
}
function 考核() { try { if (数据.value.主角.精神力 < 40) throw Error('考核前至少需要40精力，请先充分休息。'); 开始考核(数据.value.日程, 数据.value.向导); 弹窗.value = ''; } catch (error) { 反馈.value = String(error); } }
const 考核参数 = computed<治疗参数>(() => ({ 污染度: ({ C: 40, B: 60, A: 75, S: 85 } as Record<string, number>)[数据.value.日程.考核目标] ?? 40, 哨兵等级: (数据.value.日程.考核目标 || 'C') as 治疗参数['哨兵等级'], 主角等级: 数据.value.向导.等级, 信赖: Math.min(100, 数据.value.向导.精神), 第几次: 数据.value.日程.考核阶段 + 1, 预计次数: 数据.value.日程.考核目标 === 'S' ? 2 : 1 }));
let 考核结算中 = false;
async function 考核结算(result: 治疗结果) {
  if (!数据.value.日程.考核目标 || 考核结算中) return;
  考核结算中 = true;
  数据.value.主角.精神力 = Math.max(0, 数据.value.主角.精神力 - result.精神力消耗);
  反馈.value = 结算考核(数据.value.日程, 数据.value.向导, result.评级);
  await nextTick(); 考核结算中 = false;
}
function 取消考核() {
  数据.value.日程.活动记录.push('中断晋升考核，保留经验与属性。');
  数据.value.日程.考核目标 = ''; 数据.value.日程.考核阶段 = 0; 数据.value.日程.时段 = 2;
}
</script>

<style scoped>
.day-panel.map-day{padding:0}.map-day .is-exploration{overflow:hidden}.exploration-bar{display:flex;align-items:center;gap:8px;padding:7px 10px;flex:none;font-size:11px;border-bottom:1px solid #555e47;background:#222d23}.exploration-bar .energy{white-space:nowrap;color:#d7d8bb}.time-slots{display:flex;gap:3px;margin-right:auto}.time-slots span{padding:3px 5px;color:#9aa58f;border:1px solid transparent;white-space:nowrap}.time-slots .current{border-color:#bda66f;color:#f0d599;border-radius:3px}.time-slots .done{color:#8c9885;text-decoration:line-through}.exploration-bar button{padding:5px 7px!important;font-size:11px!important;white-space:nowrap}@media(max-width:420px){.exploration-bar{gap:4px;padding:6px}.time-slots span{padding:3px}.exploration-bar .energy{font-size:10px}}
.day-panel{height:100%;box-sizing:border-box;display:flex;flex-direction:column;min-height:0;overflow:hidden}.day-panel .day-header{padding-bottom:5px;gap:5px}.day-panel .day-header h2{font-size:18px;margin:4px 0}.day-panel .day-goal{margin:7px 0;gap:12px;font-size:12px}.day-panel .stats{gap:6px}.day-panel .stats>div{padding:6px 8px}.day-panel .stats b{font-size:15px}.day-panel .stat-track{margin-top:5px}.day-tools{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:7px 0;flex:none}.day-tools button{padding:4px 7px!important;font-size:11px!important}.day-tools span{font-size:10px;color:#aeb298}.day-stage{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain}.day-panel .day-ending{margin-top:7px;padding-top:7px;flex:none;gap:6px}.day-panel .feedback{flex:none;padding:5px 8px;margin:5px 0;font-size:11px;line-height:1.4}.day-header,.day-goal,.stats{flex:none}.day-backdrop{position:fixed;inset:0;z-index:1100;background:#060b09c9;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;overscroll-behavior:contain}.day-dialog{display:flex;flex-direction:column;max-height:100%;width:480px;max-width:100%;color:#ddd1b5;background:#252e23;border:1px solid #a09162;box-shadow:0 15px 55px #0009;padding:18px;box-sizing:border-box;font-family:'Songti SC','SimSun',serif;outline:none}.day-dialog header{display:flex;justify-content:space-between;gap:12px;align-items:center;flex:none;border-bottom:1px solid #62684e;padding-bottom:10px}.day-dialog h3{margin:0;font-size:18px;font-weight:400}.dialog-body{overflow:auto;min-height:0;font-size:13px;line-height:1.8;padding:8px 0;overscroll-behavior:contain}.day-dialog pre{white-space:pre-wrap;font:inherit}.day-dialog button{padding:9px 12px;background:#333e2b;border:1px solid #998b60;color:#e4d5ae;font-family:inherit;font-size:12px;cursor:pointer}.day-dialog button:disabled{opacity:.4}.day-dialog footer{display:flex;gap:8px;flex-wrap:wrap;flex:none;padding-top:10px;border-top:1px solid #62684e}@media(max-width:540px){.day-panel .day-header h2{font-size:16px}.day-panel .day-header small{display:none}.day-panel .day-ending{font-size:10px}.day-panel .day-ending button{padding:7px;font-size:11px}.day-dialog{padding:14px}.day-tools span{flex-basis:100%}}
.day-panel{color:#ddd1b5;padding:16px;font-family:'Songti SC','SimSun',serif}.day-header{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;border-bottom:1px solid #7e7452;padding-bottom:14px}.day-header small{font-size:9px;letter-spacing:2px;color:#a89d7a}.day-header h2{font-size:23px;font-weight:400;letter-spacing:2px;margin:8px 0}.day-header>span{font-size:12px;color:#bbbba1}.day-goal{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;margin:17px 0;color:#d1bd86}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stats>div{border:1px solid #6c6e50;padding:10px;background:#293324}.stats b{float:right;font-size:18px;font-weight:400}.stats span{font-size:12px}.stat-track{height:3px;background:#111b14;margin-top:12px}.stat-track i{display:block;background:#b6a675;height:100%}.growth{margin:16px 0;border:1px solid #5c654a;padding:12px;background:#252e23}.growth summary{cursor:pointer;color:#d0bf90;font-size:13px}.growth p,.day-hint{font-size:12px;color:#b2b69b;line-height:1.8}.day-panel button{padding:9px 13px;background:#333e2b;border:1px solid #998b60;color:#e4d5ae;font:12px inherit;cursor:pointer}.day-panel button:disabled{opacity:.4;cursor:default}.day-ending{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:18px;padding-top:16px;border-top:1px solid #6c6e50;font-size:12px}.settlement,.encounter,.feedback{border:1px solid #a09162;background:#2c3627;padding:15px;margin:16px 0;font-size:12px;line-height:1.8}.settlement h3,.encounter h3{font-weight:400;color:#dfc893}.settlement button{margin:5px}.day-panel pre{white-space:pre-wrap;font:12px inherit;color:#bbbda3}.exam-screen{position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;background:#17211a;color:#dfd1ad;overflow:auto}.exam-screen>header{padding:12px 20px;flex:none}.exam-screen h2{font-size:19px;font-weight:400}.exam-screen p{font-size:12px}.exam-screen :deep(.疏导){flex:1;min-height:300px}@media(max-width:540px){.day-panel{padding:10px}.stats{gap:5px}.stats>div{padding:8px}.day-header h2{font-size:20px}.day-goal{gap:10px}}
.day-panel .day-header>span,.day-panel .day-goal,.day-panel .stats span{font-size:16px}.day-panel .stats b{font-size:21px}.day-panel .day-tools button{font-size:15px!important;padding:8px 11px!important}.day-panel .day-tools span,.day-panel .day-ending,.day-panel .feedback{font-size:15px}.day-panel .day-ending button{font-size:15px}.dialog-body,.day-dialog pre,.exam-screen p{font-size:16px;line-height:1.9}.day-dialog button{font-size:15px}.exploration-bar{font-size:14px}.exploration-bar button{font-size:14px!important}.exploration-bar .energy{font-size:14px}@media(max-width:420px){.exploration-bar{font-size:12px;gap:4px}.exploration-bar button{font-size:12px!important;padding:5px!important}.exploration-bar .energy{font-size:12px}.day-panel .stats span{font-size:14px}.day-panel .day-tools span{flex-basis:auto}}
.exploration-bar{flex-wrap:wrap}.exploration-bar .energy{margin-right:auto}.time-slots{margin-right:0}@media(max-width:420px){.exploration-bar .energy{flex-basis:100%}.time-slots{margin-right:auto}}


.day-panel{padding:clamp(8px,1.3%,16px);gap:0}.day-panel .day-header{gap:8px;padding-bottom:8px;flex-wrap:wrap}.profile-actions{display:flex;align-items:center;gap:6px;flex:none}.day-panel .profile-actions button{font-size:14px;padding:7px 11px;white-space:nowrap;border-radius:4px}.day-panel .day-header>span{font-size:14px;margin-right:auto}.day-panel .day-goal{margin:9px 0;font-size:14px}.day-panel .stats>div{background:transparent;border-color:#6c6e505c;padding:6px 9px}.day-panel .stats span{font-size:14px}.day-panel .stats b{font-size:18px}.day-panel .stat-track{margin-top:4px}.day-panel .day-tools{padding:8px 0;gap:7px;justify-content:flex-end}.day-panel .day-tools span{margin-right:auto;font-size:12px;flex-basis:auto}.day-panel .day-tools button{font-size:12px!important;padding:4px 7px!important}.day-stage{min-height:0}.day-panel:not(.map-day) .day-stage{overflow:hidden;display:flex;flex-direction:column}.day-panel .day-ending{padding-top:8px;margin-top:8px;font-size:13px}.day-panel .day-ending button{padding:8px 10px;font-size:14px;border-radius:4px}.day-dialog{width:540px;border-radius:7px;padding:20px}.dialog-body{font-size:14px;line-height:1.6}.profile-identity{position:relative;padding:12px 0;border-bottom:1px solid #67704f80}.profile-identity small{font-size:11px;letter-spacing:2px;color:#a8ac91}.profile-identity h2{margin:7px 0;font-size:28px;font-weight:400;letter-spacing:2px}.profile-identity>span{color:#dac48d}.profile-identity p{margin:7px 0 0;font-size:13px;color:#b4bda6}.profile-summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.profile-summary div{padding:10px 12px;border:1px solid #6970506b;background:#1c271f}.profile-summary dt{font-size:12px;color:#abb397}.profile-summary dd{margin:5px 0 0;font-size:20px;font-variant-numeric:tabular-nums;color:#e1d0a5}.section-label{margin:16px 0 8px;font-size:13px;font-weight:400;color:#c6bf9a}.profile-attributes{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}.profile-attributes>div{display:flex;align-items:center;gap:9px}.profile-attributes span{font-size:13px}.profile-attributes progress{width:0;flex:1;height:5px;accent-color:#bdad77}.profile-attributes b{font-size:14px;min-width:22px;font-weight:400;text-align:right}.profile-schedule{display:flex;justify-content:space-between;gap:10px;border-top:1px solid #67704f80;padding-top:14px;margin-top:18px;font-size:13px}.profile-schedule span{color:#abb397}.profile-schedule b{font-weight:400}.profile-note{font-size:12px;color:#aab19a;line-height:1.6;margin:12px 0 0}.promotion-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:15px 0}.promotion-heading>span{font-size:23px;letter-spacing:2px}.promotion-heading b{font-weight:400;font-size:12px;color:#cfbc87;border:1px solid #7f805b;padding:4px 8px;border-radius:3px}.promotion-table{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}.promotion-table caption{text-align:left;font-size:12px;color:#a6af95;margin-bottom:10px}.promotion-table th,.promotion-table td{padding:9px 10px;text-align:center;border-bottom:1px solid #68704e66}.promotion-table th:first-child{text-align:left}.promotion-table th{font-weight:400}.promotion-table thead{font-size:12px;color:#a7b096;background:#1c271f}.promotion-table td:last-child{color:#cfb790}.promotion-table td.met{color:#adcca1}.exam-requirements{margin-top:16px;padding:12px 14px;background:#1c271f;border-left:2px solid #b9a678}.exam-requirements h4{margin:0 0 7px;font-weight:400;font-size:15px;color:#dfcea2}.exam-requirements p{margin:4px 0;font-size:13px;color:#b9c0aa}.exam-readiness{font-size:12px;color:#b6bea7;line-height:1.6}.day-dialog .exam-start{width:100%;font-size:14px;border-radius:4px}.promotion-finished{text-align:center;padding:30px 0}.promotion-finished h2{font-size:28px;font-weight:400;color:#e2c993}.exploration-bar .profile-actions{margin-left:auto}.exploration-bar .profile-actions button{font-size:13px!important}
@media(max-width:540px){.day-panel .day-header>span{font-size:13px;flex-basis:100%}.day-panel .profile-actions{width:100%}.day-panel .profile-actions button{flex:1;min-height:36px;padding:5px 8px}.day-panel .day-goal{margin:6px 0;font-size:13px}.day-panel .stats{gap:5px}.day-panel .stats>div{padding:4px 6px}.day-panel .stats b{font-size:17px}.day-panel .stats span{font-size:13px}.day-panel .day-tools{padding:6px 0}.day-panel .day-tools span{font-size:11px}.day-panel .day-ending{gap:5px;font-size:12px;margin-top:5px;padding-top:6px}.day-panel .day-ending span{flex-basis:100%}.day-panel .day-ending button{width:100%;min-height:36px;padding:6px;font-size:13px}.day-dialog{padding:14px}.profile-summary{gap:8px;margin:12px 0}.profile-summary div{padding:8px 10px}.profile-summary dd{font-size:18px}.profile-identity h2{font-size:24px}.profile-schedule{flex-wrap:wrap}.promotion-table th,.promotion-table td{padding:7px 5px}.promotion-heading>span{font-size:20px}.exploration-bar .profile-actions{width:auto;flex:1}.exploration-bar .profile-actions button{padding:5px!important;font-size:12px!important}}
@media(max-height:650px){.day-panel .day-tools{padding:4px 0}.day-panel .day-goal{margin:4px 0}.day-panel .stats>div{padding:3px 6px}.day-panel .day-header{padding-bottom:5px}.profile-identity{padding:7px 0}.profile-summary{margin:10px 0}.profile-summary div{padding:6px 9px}.profile-schedule{margin-top:10px;padding-top:9px}.profile-note{margin-top:7px}.promotion-table th,.promotion-table td{padding-top:6px;padding-bottom:6px}.exam-requirements{margin-top:10px;padding:9px 11px}.promotion-heading{margin:8px 0}}


.profile-history{display:flex;gap:8px;margin-top:10px}.profile-history:empty{display:none}
.promotion-table th,.promotion-table td{color:#ddd1b5}.promotion-table thead th{color:#a7b096}.promotion-table td:last-child{color:#cfb790}.promotion-table td.met{color:#adcca1}
@media(max-width:540px){.day-panel .day-header{flex-wrap:nowrap}.day-panel .day-header>span{flex:1;flex-basis:auto;min-width:0;line-height:1.7;font-size:12px}.day-panel .profile-actions{width:auto;gap:5px}.day-panel .profile-actions button{flex:none;padding:6px 8px;font-size:13px}}
@media(max-height:700px){.day-panel:not(.map-day) .stats,.day-panel:not(.map-day) .day-tools{display:none}.day-panel .day-header{padding-bottom:6px}.day-panel .day-goal{margin:7px 0}.day-panel .day-ending{margin-top:6px;padding-top:6px}.day-panel .day-ending span{flex-basis:auto}.day-panel .day-ending button{width:auto}.day-panel .day-ending{font-size:11px;flex-wrap:nowrap}.day-panel .day-ending button{font-size:12px;padding:6px 7px}}
.browse-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;color:#bfc5a8;font-size:12px;flex:none}.browse-bar button{font:inherit;padding:7px 12px;background:#465438;color:#eddbab;border:1px solid #9b9166;cursor:pointer}
</style>
