<template>
  <div class="申请块 界卡" :class="{ 'is-紧凑': 紧凑 }">
    <h4 v-if="!紧凑" class="申请块__日">{{ 数据.世界.日期 }} · {{ 数据.世界.时段 }}</h4>

    <section v-if="病例未就绪" class="npc-writing" :aria-busy="文案忙" aria-live="polite">
      <small>白塔 · 今日接诊</small><h3>{{ 文案忙 ? '正在整理今日病例' : '今日病例尚未就绪' }}</h3>
      <p>{{ 文案忙 ? `正在为 ${数据.今日.人物文案.候选.length} 位新哨兵填写姓名与伤情，请稍候。` : 数据.今日.人物文案.错误 || '首次接诊前，将通过酒馆 API 完成新哨兵资料。' }}</p>
      <div><button v-if="文案忙" @click="取消病例生成">取消生成</button><button v-else @click="生成今日病例">{{ 数据.今日.人物文案.状态 === '失败' ? '重试生成病例' : '生成今日病例' }}</button></div>
    </section>

    <template v-if="!病例未就绪">

    <p v-if="!待接.length" class="申请块__空">
      今天没有新的申请。{{ 已接.length ? '' : '去休息，或者等明天。' }}
    </p>

    <div v-if="紧凑 && 待接.length" class="申请块__翻页"><button :disabled="页 === 0" aria-label="上一位哨兵" @click="页--">← 上一位</button><div class="roster-position"><span>待接 <b>{{ 页 + 1 }}</b> / {{ 待接.length }}</span><button v-if="可对话" class="roster-completed" :disabled="处理中 || !!诊疗" :aria-label="可重试 ? '重试本次对话' : '查看治疗后对话选择'" @click="选择开 = true">{{ 可重试 ? '重试 ↗' : '对话 ↗' }}</button><button v-else-if="已接.length" class="roster-completed" @click="记录开 = true">已接 {{ 已接.length }} ↗</button></div><button :disabled="页 >= 待接.length - 1" aria-label="下一位哨兵" @click="页++">下一位 →</button></div>
    <article v-for="申 in 展示申请" :key="申.姓名" class="申请">
      <div class="申请__首">
        <button class="申请__名 sentinel-name" :aria-label="`查看${申.姓名}的基础档案`" :disabled="处理中 || !!诊疗" @click="档案姓名 = 申.姓名">{{ 申.姓名 }}<small aria-hidden="true">档案 ↗</small></button>
        <span class="申请__级">{{ 申.等级 }}级</span>
        <span v-if="申.信赖" class="申请__熟">信赖 {{ 申.信赖 }}</span>
        <span v-if="!紧凑" class="申请__污">污染 {{ 申.污染度 }}</span>
      </div>
      <p v-if="!紧凑" class="申请__源">{{ 申.战损来源 }}</p>
      <template v-else><dl class="clinical-facts"><div><dt>污染度</dt><dd>{{ 申.污染度 }}<small> / 100</small></dd></div><div><dt>精神丝线</dt><dd>约 {{ 申.线数 }}<small> 条</small></dd></div><div><dt>预计疏导</dt><dd>{{ 申.预计次数 }}<small> 趟</small></dd></div></dl><div class="clinical-source"><span>战损来源</span><p :title="申.战损来源">{{ 申.战损来源 || '尚未记录' }}</p></div></template>
      <div class="申请__底">
        <span v-if="!紧凑" class="申请__计"><template v-if="!白塔线">诊金 {{ 申.诊金 }} · </template> 约 {{ 申.线数 }} 条丝线 · 还要 {{ 申.预计次数 }} 趟</span>
        <span v-if="!床位够吗(申.姓名)" class="申请__满">没床了</span>
        <button class="申请__钮 is-拒" :disabled="处理中" @click="婉拒(申.姓名)">婉拒</button>
        <button class="申请__钮 is-接" :disabled="!床位够吗(申.姓名) || (白塔线 && !是值班日(数据.日程)) || 处理中" @click="接诊(申)">接诊</button>
      </div>
    </article>

    <div v-if="已接.length && !紧凑" class="申请块__已接">
      <span class="申请块__已接标">今日已接</span>
      <span v-for="名 in 已接" :key="名" class="申请块__徽">{{ 名 }}</span>
    </div>
    <div v-if="紧凑 && 已接.length && !待接.length" class="completed-summary"><span>今日已接 {{ 已接.length }} 位</span><button @click="记录开 = true">查看记录 ↗</button></div>
    <div v-if="叙事状态 && (!紧凑 || !待接.length)" class="申请块__叙事" role="status"><span>{{ 叙事状态 }}</span><template v-if="可对话"><button :disabled="处理中 || !!诊疗" @click="生成治疗剧情">{{ 可重试 ? '重试本次对话' : '与这位哨兵对话' }}</button><button :disabled="处理中 || !!诊疗" @click="跳过对话">暂不对话</button></template></div>
    <SentinelProfile v-if="档案人物" :name="档案姓名" :person="档案人物" :treated="数据.哨兵[档案姓名]?.已治疗 ?? 0" @close="档案姓名 = ''" />
    <StoryChoice v-if="选择开" title="治疗完成" :text="叙事状态" :busy="处理中" @story="生成治疗剧情" @skip="跳过对话" />
    </template>

    <!-- 治疗浮层挂在三个块**之外**(Teleport 到 body)。
         它原来是块内的一个 position:fixed 元素 —— 拆成三块之后,
         治疗进行中点一下别的块就能让浮层消失, 而治疗状态还在 (spec §9.1.1)。 -->
    <Teleport to="body">
      <div v-if="紧凑 && 记录开" class="clinical-backdrop" @click.self="记录开 = false" @keydown.esc.stop.prevent="记录开 = false"><section ref="记录窗口" class="clinical-dialog" role="dialog" aria-modal="true" aria-label="今日接诊记录" tabindex="-1" @keydown.tab="记录焦点"><header><h3>今日接诊记录</h3><button aria-label="关闭接诊记录" @click="记录开 = false">× 返回</button></header><ul><li v-for="名 in 已接" :key="名">{{ 名 }}</li></ul></section></div>
      <div v-if="诊疗" class="申请块__罩">
        <TreatmentPanel :哨兵姓名="诊疗.姓名" :参数="诊疗.参数" @结算="结束" @取消="诊疗 = null" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { 请求正文 } from '../共用/剧情请求';
import { 准备人物文案, 文案未就绪, 请求人物文案 } from '../../生成/文案';
// import 名必须是 ASCII。写成 `<治疗面板 />` 会被当纯文本渲染、绑定全丢,
// 于是 `结束` 成了没人用的函数, 被 tree-shaking 删掉, 连带整个 结算.ts 都不进包
// —— 而且只有生产构建才会这样, dev 模式不做 tree-shaking, 一点征兆都没有。
import TreatmentPanel from '../治疗/App.vue';
import StoryChoice from '../共用/StoryChoice.vue';
import SentinelProfile from './SentinelProfile.vue';
import { 是值班日, 登记治疗 } from '../../养成/规则';
import {
  算单次清除量,
  算预计次数,
  算线数,
  type 等级,
  type 治疗参数,
  type 治疗结果,
} from '../治疗/game';
import { 应用结算, 构建元指令, 能接诊吗, type 结算上下文 } from '../状态栏/结算';
import { 算床位 } from '../../家园/家具';
// 用 共用/数据 那一份(读最新一楼), **不要**在本地另起一个 store —— 界面只在第 0 楼
// 挂载, 钉死楼层的 store 会读到开局冻结状态, 与同一屏顶部的角标对不上。详见原注释。
import { useDataStore } from '../共用/数据';
import { 盯住日期 } from '../共用/掷骰接线';

interface 申请项 {
  姓名: string;
  等级: 等级;
  污染度: number;
  战损来源: string;
  诊金: number;
  信赖: number;
  线数: number;
  /** 按评级 A 估的还要几趟 (spec §5.2) —— 接诊**之前**就得看得见 */
  预计次数: number;
}

const props = withDefaults(defineProps<{ 紧凑?: boolean }>(), { 紧凑: false });
const emit = defineEmits<{ 忙: [boolean]; 剧情: []; 请求完成: []; 错误: [string] }>();
const 页 = ref(0);
const 档案姓名 = ref('');
const 记录开 = ref(false);
const 记录窗口 = ref<HTMLElement>();
let 记录前焦点: HTMLElement | null = null;
watch(记录开, async open => {
  if (open) { 记录前焦点 = document.activeElement as HTMLElement; await nextTick(); 记录窗口.value?.focus(); }
  else if (记录前焦点?.isConnected) 记录前焦点.focus();
});
function 记录焦点(event: KeyboardEvent) {
  event.preventDefault();
  记录窗口.value?.querySelector<HTMLButtonElement>('button')?.focus();
}
const 叙事状态 = ref('');
const 可重试 = ref(false);
const 可对话 = ref(false);
const 选择开 = ref(false);
let 本次提示 = '';
let 本次消息号 = -1;
const 处理中 = ref(false);
const store = useDataStore();
const 数据 = computed(() => store.data);
const 档案人物 = computed(() => 档案姓名.value ? (数据.value.今日.申请列表[档案姓名.value] ?? 数据.value.哨兵[档案姓名.value]) : undefined);

/** 床位是派生值: 摆出来的床有几张 (spec §7.1) */
const 白塔线 = computed(() => 数据.value.主角.路线 === '白塔向导路线');
const 当前等级 = computed(() => 白塔线.value ? 数据.value.向导.等级 : 数据.value.诊所.等级);
const 文案忙 = ref(false);
const 病例未就绪 = computed(() => 文案未就绪(数据.value));
let 病例请求: AbortController | undefined;
async function 生成今日病例() {
  if (文案忙.value || !病例未就绪.value || !是值班日(数据.value.日程)) return;
  // Reloaded requests have no local controller; explicitly abandon their saved lease before retry.
  if (数据.value.今日.人物文案.状态 === '生成中') 数据.value.今日.人物文案.状态 = '失败';
  const controller = new AbortController();病例请求 = controller;文案忙.value = true;
  try { await 请求人物文案(数据.value, controller.signal, undefined, undefined, () => 数据.value); }
  finally { if (病例请求 === controller) { 病例请求 = undefined; 文案忙.value = false; } }
}
function 取消病例生成() { 病例请求?.abort(); }
onMounted(() => window.addEventListener('pagehide', 取消病例生成));
onUnmounted(() => { 取消病例生成(); window.removeEventListener('pagehide', 取消病例生成); });
const 床位 = computed(() => 算床位(数据.value.诊所.家具));

/** 床位满时按钮置灰 + 一句「没床了」(spec §5.2)。已经在诊的那个人不受限 —— 那是复诊 */
function 床位够吗(姓名: string): boolean {
  if (白塔线.value) return true;
  return 能接诊吗(数据.value.哨兵, 床位.value, 姓名);
}

/**
 * 掷骰的唯一入口。它常驻挂载(在「申请」折叠区里用 v-show, 不销毁),
 * 所以放在这里就够 —— 不需要在 主界面/App.vue 那个 500ms 轮询里再做一次。
 *
 * ⚠ **这一块永远不能用 `v-if`。** 用了就是把这条 watch 一起销毁:
 * 掷骰和申请列表会静默死掉, 不报错, 只是永远不再出现新申请 (spec §9.1)。
 */
盯住日期({
  今日: () => 数据.value.今日,
  日期: () => 数据.value.世界.日期,
  等级: () => 当前等级.value,
  // 只有 已出院 的人会重新出现在名单上 (回头客, 见 生成.ts 的 掷一批)。
  // 它一天只在这里被读一次 —— 不是响应式的源, 别指望它触发重掷。
  哨兵: () => 数据.value.哨兵,
  生成后: () => 准备人物文案(数据.value),
});

watch([() => 数据.value.世界.日期, () => 白塔线.value], 取消病例生成);
watch([() => 数据.value.今日.人物文案.状态, () => 数据.value.日程.序章已读, () => 数据.value.日程.天数, () => 白塔线.value, () => 文案忙.value], () => {
  if (!白塔线.value || !是值班日(数据.value.日程) || (!数据.value.日程.序章已读 && 数据.value.日程.天数 === 1)) return;
  if (数据.value.今日.人物文案.状态 === '待生成') void 生成今日病例();
  else if (数据.value.今日.人物文案.状态 === '生成中' && !文案忙.value) Object.assign(数据.value.今日.人物文案, {状态:'失败',请求:'',开始:0,错误:'上次病例生成已中断，请点击重试。'});
}, {immediate:true});

function 算预计线数(姓名: string, 等级: 等级, 污染度: number) {
  return 算线数({
    污染度,
    哨兵等级: 等级,
    主角等级: 当前等级.value,
    信赖: 数据.value.哨兵[姓名]?.信赖 ?? 0,
    第几次: 1,
    预计次数: 1,
  });
}

const 待接 = computed<申请项[]>(() =>
  _(数据.value.今日.申请列表)
    .entries()
    .filter(([, 项]) => 项.状态 === '待接')
    .map(([姓名, 项]) => ({
      姓名,
      等级: 项.等级,
      污染度: 项.污染度,
      战损来源: 项.战损来源,
      诊金: 项.诊金,
      信赖: 数据.value.哨兵[姓名]?.信赖 ?? 0,
      线数: 算预计线数(姓名, 项.等级, 项.污染度),
      // 以**申请列表里写的**污染度为准, 而不是 哨兵 里存的旧值 ——
      // 回头客重新出现在申请列表时, 只有申请列表是他此刻最新的状态 (同 应用结算)。
      预计次数: 算预计次数(项.污染度, 算单次清除量(当前等级.value)),
    }))
    .value(),
);

const 已接 = computed(() =>
  _(数据.value.今日.申请列表)
    .entries()
    .filter(([, 项]) => 项.状态 === '已接')
    .map(([姓名]) => 姓名)
    .value(),
);
const 展示申请 = computed(() => props.紧凑 ? 待接.value.slice(页.value, 页.value + 1) : 待接.value);
watch(() => 待接.value.length, length => { 页.value = Math.min(页.value, Math.max(0, length - 1)); });

const 诊疗 = ref<{ 姓名: string; 参数: 治疗参数 } | null>(null);
watch([诊疗, 处理中, 选择开, 档案姓名, 文案忙], () => emit('忙', !!诊疗.value || 处理中.value || 选择开.value || !!档案姓名.value || 文案忙.value), {immediate:true});
watch(() => 数据.value.世界.日期, () => {
  档案姓名.value = '';
  if (!处理中.value) { 可对话.value = false; 可重试.value = false; 叙事状态.value = ''; }
});

function 接诊(申: 申请项) {
  if (病例未就绪.value) return;
  if (处理中.value || (白塔线.value && (!是值班日(数据.value.日程) || 数据.value.日程.考核目标))) return;
  if (数据.value.主角.精神力 <= 0) { toastr.warning('精力不足，请结束值班休息。'); return; }
  const 等级 = 当前等级.value;
  诊疗.value = {
    姓名: 申.姓名,
    参数: {
      污染度: 申.污染度,
      哨兵等级: 申.等级,
      主角等级: 等级,
      信赖: 申.信赖,
      第几次: (数据.value.哨兵[申.姓名]?.已治疗 ?? 0) + 1,
      预计次数: 算预计次数(申.污染度, 算单次清除量(等级)),
    },
  };
}

function 婉拒(姓名: string) {
  if (病例未就绪.value) return;
  const 项 = 数据.value.今日.申请列表[姓名];
  if (项) 项.状态 = '已婉拒';
}

async function 结束(果: 治疗结果) {
  const 患 = 诊疗.value;
  if (!患 || 处理中.value || (白塔线.value && !是值班日(数据.value.日程))) return;
  处理中.value = true;

  const 申 = 数据.value.今日.申请列表[患.姓名];
  const 旧 = 数据.value.哨兵[患.姓名];

  // 首次接诊时 应用结算 会照 患者 就地建档, 所以这里必须把**整份档案**带上。
  // 少一个字段, schema 的 prefault 就会把它悄悄填成空串 —— 界面上表现为
  // 「这个病人没有精神体」, 而哪里都不报错。
  //
  // 以申请列表那一份为准(它是这个人此刻最新的状态), 没有才退回已有的哨兵记录。
  const 档 = 申 ?? 旧;

  // 先把结算时的状态拍下来 —— 元指令描述的是这一场**开始时**的处境,
  // 而应用结算会就地改掉精神力、名声这些东西。
  const 上: 结算上下文 = {
    路线: 数据.value.主角.路线,
    世界: { 日期: 数据.value.世界.日期, 时段: 数据.value.世界.时段 },
    主角: {
      姓名: 数据.value.主角.姓名,
      精神力: 数据.value.主角.精神力,
      精神力上限: 数据.value.主角.精神力上限,
    },
    诊所: {
      名称: 数据.value.诊所.名称,
      等级: 当前等级.value,
      $称号: 数据.value.诊所.$称号,
      名声: 数据.value.诊所.名声,
      床位: 床位.value,
    },
    // ★ 真的接上了 —— 装修好的诊所, 结算文案会不一样 (spec §7.3)
    气氛: 白塔线.value ? 0 : 数据.value.诊所.气氛,
    患者: {
      姓名: 患.姓名,
      等级: 患.参数.哨兵等级,
      污染度: 患.参数.污染度,
      战损来源: 档?.战损来源 ?? '',
      年龄: 档?.年龄 ?? 25,
      地域: 档?.地域 ?? '',
      精神体: 档?.精神体 ?? { 纲: '', 方向: '', 栖息: '', 体型: '', 危险: '' },
      特征: 档?.特征 ?? [],
      形象: 档?.形象,
      A面: 档?.A面 ?? '',
      B面: 档?.B面 ?? '',
      信赖: 旧?.信赖 ?? 0,
      好感: 旧?.好感 ?? 0,
      基础诊金: 申?.诊金 ?? 0,
      $信赖: 旧?.$信赖 ?? '',
      $好感: 旧?.$好感 ?? '',
    },
  };

  const 收益 = 应用结算(store.data, 上, 果);
  const 经验 = 白塔线.value ? 登记治疗(store.data.日程, store.data.向导, 果.评级) : 0;
  诊疗.value = null;

  本次提示 = 构建元指令(上, 果) + '\n【治疗后对话】玩家主动选择与这位哨兵交流。治疗已完成，请将治疗信息作为背景，描写治疗后的短暂对话，为玩家留下回应空间。不要再次结算治疗或擅自推进日期。' + (白塔线.value ? '\n【日程】本日为值班日。本次治疗已经结算，向导经验增加' + 经验 + '。请停留在当前日期，不要重复修改已结算数字。' : '');
  本次消息号 = -1;
  可重试.value = false;
  可对话.value = true;
  选择开.value = true;
  叙事状态.value = `${患.姓名}的治疗已结算。可以与这位哨兵对话，也可以暂不对话、继续接诊。`;
  处理中.value = false;
  console.info('[治疗] 结果已结算，等待玩家选择是否对话', 患.姓名);

  toastr.success(白塔线.value ? `评级 ${果.评级}　向导经验 +${经验}` : `评级 ${果.评级}　诊金 +${收益.诊金}　名声 +${收益.名声}`, '疏导结束');
}
async function 生成治疗剧情() {
  if (处理中.value || 诊疗.value || !可对话.value) return;
  处理中.value = true;
  选择开.value = false;
  try { await 请求治疗剧情(); } finally { 处理中.value = false; }
}
function 跳过对话() {
  if (处理中.value || 诊疗.value) return;
  可对话.value = false;
  选择开.value = false;
  可重试.value = false;
  叙事状态.value = '治疗结果已保存，可以继续接诊。';
}
async function 请求治疗剧情() {
  叙事状态.value = '治疗已结算，正在请求本次对话……'; 可重试.value = false;
  try {
    // 等待 MVU 写回，再把完整变量带到新楼层，避免最新楼层丢失刚结算的结果。
    await nextTick();
    if (本次消息号 < 0) {
      await createChatMessages([{ role: 'user', message: 本次提示, data: { ...klona(getVariables({ type: 'message', message_id: 'latest' })), stat_data: klona(store.data) } }]);
      本次消息号 = getLastMessageId();
    }
    const 最新 = getChatMessages(-1)[0];
    if (最新?.message_id !== 本次消息号 && !(最新?.role === 'assistant' && 最新.message_id === 本次消息号 + 1)) {
      throw Error('已有后续对话，请使用主界面的重说继续；本次治疗不会再次结算。');
    }
    emit('剧情');
    await 请求正文(最新?.role === 'assistant' ? '/regenerate await=true' : '/trigger await=true');
    可对话.value = false;
    叙事状态.value = '本次治疗对话已生成，可继续接诊。';
    emit('请求完成');
  } catch (error) {
    console.error('[向导] 剧情生成失败，治疗结果已保存', error);
    叙事状态.value = '治疗结果已保存，对话请求未完成；可重试本次对话或继续游戏。';
    可重试.value = true;
    emit('错误', error instanceof Error ? error.message : String(error));
    toastr.warning('治疗已保存，剧情未能生成。');
  }
}
</script>

<style lang="scss" scoped>
.申请块__翻页{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0;color:#bdb894;font-size:12px}.申请块__翻页 button,.申请块__叙事 button{background:#303b2a;color:#ddd1b5;border:1px solid #787551;padding:6px 9px;cursor:pointer;font-family:inherit}.申请块__翻页 button:disabled{opacity:.35;cursor:default}.申请块__叙事{font-size:11px;color:#bdb894;line-height:1.6;margin-top:10px}.申请块__叙事 button{margin-top:6px}.申请块.is-紧凑{padding:8px;box-sizing:border-box}.is-紧凑 .申请__源{line-height:1.6;color:#b4b5a1}.is-紧凑 .申请块__已接{margin-top:8px}.is-紧凑 .申请__底{flex-wrap:wrap}.is-紧凑 .申请__计{flex-basis:100%;margin-bottom:5px}
.申请块 {
  &__日 {
    margin: 0 0 7px;
    color: #96967e;
    font-size: 0.8em;
    font-weight: 500;
    letter-spacing: 0.08em;
  }

  &__空 {
    margin: 0 0 6px;
    color: #55606d;
    font-size: 0.85em;
  }

  &__已接 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding-top: 9px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  &__已接标 {
    color: #96967e;
    font-size: 0.78em;
  }

  &__徽 {
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(215, 195, 141, 0.1);
    border: 1px solid rgba(215, 195, 141, 0.22);
    color: #e5d4a3;
    font-size: 0.78em;
  }

  /* 治疗浮层。Teleport 到 body, 所以 fixed 是相对视口的 —— 盖住整个界面 */
  &__罩 {
    position: fixed;
    inset: 0;
    z-index: 9999;
  }
}

.申请 {
  padding: 9px 11px;
  margin-bottom: 7px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.055);

  &__首 {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 9px;
  }

  &__名 {
    color: #e5d8b8;
    font-weight: 600;
  }

  &__级 {
    color: #b2bc8b;
    font-size: 0.85em;
  }

  &__熟 {
    padding: 1px 7px;
    border-radius: 999px;
    background: rgba(255, 215, 110, 0.1);
    border: 1px solid rgba(255, 215, 110, 0.24);
    color: #ffd76e;
    font-size: 0.76em;
  }

  &__污 {
    margin-left: auto;
    color: #7d8896;
    font-size: 0.85em;
    font-variant-numeric: tabular-nums;
  }

  &__源 {
    margin: 4px 0 7px;
    color: #77828f;
    font-size: 0.84em;
  }

  &__底 {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  &__计 {
    flex: 1;
    color: #96967e;
    font-size: 0.8em;
    min-width: 0;
  }

  /* 床位满了。接诊按钮置灰时在旁边说明原因 ——
     只置灰不说话, 玩家会以为是坏了 (spec §5.2) */
  &__满 {
    margin-left: auto;
    font-size: 11px;
    opacity: 0.6;
  }

  &__钮 {
    flex: none;
    min-height: 30px;
    padding: 0 13px;
    border-radius: 7px;
    border: 1px solid transparent;
    font-family: inherit;
    font-size: 0.84em;
    cursor: pointer;
    transition: background 0.18s ease;

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    &.is-接 {
      background: rgba(215, 195, 141, 0.15);
      border-color: rgba(215, 195, 141, 0.36);
      color: #e5d4a3;

      /* 置灰的按钮别再亮起来 —— 否则「没床了」的按钮看着像能点 */
      &:not(:disabled):hover {
        background: rgba(215, 195, 141, 0.25);
      }
    }

    &.is-拒 {
      background: rgba(255, 255, 255, 0.045);
      border-color: rgba(255, 255, 255, 0.08);
      color: #77828f;

      &:not(:disabled):hover {
        background: rgba(255, 255, 255, 0.08);
      }
    }
  }
}

@media (max-width: 480px) {
  .申请__钮 {
    min-height: 34px;
    padding: 0 15px;
  }
}
.申请块.is-紧凑{font-size:16px;padding:14px}.申请块.is-紧凑 .申请__名{font-size:21px}.申请块.is-紧凑 .申请__级,.申请块.is-紧凑 .申请__熟,.申请块.is-紧凑 .申请__污,.申请块.is-紧凑 .申请__计,.申请块.is-紧凑 .申请__钮,.申请块.is-紧凑 .申请块__翻页,.申请块.is-紧凑 .申请块__叙事{font-size:15px;line-height:1.8}.申请块.is-紧凑 .申请__计{margin-bottom:8px}


.申请块.is-紧凑{display:flex;flex-direction:column;height:100%;min-height:0;margin:0;padding:12px;overflow:hidden;border-radius:5px;box-shadow:none;background:linear-gradient(155deg,#2a3528,#1c261f);font-size:14px}.is-紧凑 .申请块__翻页{flex:none;font-size:13px;line-height:1.4;margin:0 0 12px;gap:8px}.is-紧凑 .申请块__翻页 b{font-weight:400;color:#e1c994}.is-紧凑 .申请块__翻页 button{padding:6px 9px;min-height:34px;font-size:12px;border-radius:4px}.is-紧凑 .申请{flex:1;min-height:0;display:flex;flex-direction:column;margin:0;padding:14px;border-color:#7e81523d;background:#18241d99;border-radius:5px}.is-紧凑 .申请__首{flex:none;gap:6px 10px;padding-bottom:12px;border-bottom:1px solid #6b735141}.is-紧凑 .申请__名{font-size:24px;font-weight:400;letter-spacing:2px}.is-紧凑 .申请__级{margin-left:auto;font-size:14px;line-height:1.4;color:#d6c695}.is-紧凑 .申请__熟{font-size:12px;line-height:1.4;color:#c0ca9d;border-color:#9baa6352;background:#90a56914}.clinical-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;flex:none;margin:15px 0}.clinical-facts>div{padding-right:8px;border-right:1px solid #67704a55}.clinical-facts>div:last-child{border:0}.clinical-facts dt{font-size:12px;color:#a7b09a;margin-bottom:5px}.clinical-facts dd{margin:0;font-size:23px;color:#d8cba5;font-variant-numeric:tabular-nums}.clinical-facts small{font-size:11px;color:#97a68f}.clinical-source{flex:1;min-height:0;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:6px;padding:12px 0}.clinical-source>span{font-size:11px;color:#9da78f;letter-spacing:1px}.clinical-source p{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;margin:0;font-size:14px;line-height:1.65;color:#bcc5af}.clinical-source button,.completed-summary button{font-family:inherit;font-size:12px;color:#caba8d;background:none;border:0;padding:2px 0;cursor:pointer;min-height:26px}.is-紧凑 .申请__底{flex:none;justify-content:flex-end;flex-wrap:nowrap;gap:10px;border-top:1px solid #67704a55;padding-top:12px}.is-紧凑 .申请__钮{font-size:14px;min-height:38px;padding:5px 22px;line-height:1.4;border-radius:4px}.is-紧凑 .申请__钮.is-接{background:#9ba97522;border-color:#a4ab7566;color:#e7dcc0}.completed-summary{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:#a8b197;padding-top:8px}.is-紧凑 .申请块__叙事{flex:none;font-size:12px;line-height:1.5;margin-top:6px}.is-紧凑 .申请块__叙事>span{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}.is-紧凑 .申请块__叙事 button{font-size:12px;line-height:1.4;min-height:32px;padding:5px 8px;margin-right:6px}.is-紧凑 .申请块__空{margin:auto 0;font-size:14px;color:#aeb89f}.clinical-dialog{box-sizing:border-box;max-width:calc(100% - 32px);width:460px;max-height:calc(100% - 32px);overflow:auto;background:#252e23;color:#ddd1b5;border:1px solid #a09162;border-radius:6px;padding:18px;font:14px/1.7 'Songti SC','SimSun',serif}.clinical-dialog::backdrop{background:#060b09c9}.clinical-dialog header{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #67704a66;padding-bottom:10px}.clinical-dialog h3{font-size:19px;font-weight:400;margin:0}.clinical-dialog button{font:inherit;font-size:13px;color:#ddd1b5;border:1px solid #7d7e54;background:#303b2a;padding:6px 9px;cursor:pointer}.clinical-dialog dl{display:grid;grid-template-columns:1fr 1fr;gap:12px}.clinical-dialog dt{font-size:12px;color:#abb398}.clinical-dialog dd{margin:2px 0;font-size:17px}.clinical-dialog h4{font-weight:400;margin:16px 0 8px;font-size:13px;color:#bfba95}.clinical-dialog p{white-space:pre-wrap;overflow-wrap:anywhere}.clinical-dialog li{padding:4px 0}
@media(max-width:540px){.申请块.is-紧凑{padding:9px}.is-紧凑 .申请块__翻页{margin-bottom:8px;font-size:12px}.is-紧凑 .申请块__翻页 button{font-size:11px;min-height:32px;padding:5px 7px}.is-紧凑 .申请{padding:11px}.is-紧凑 .申请__首{padding-bottom:8px;gap:6px}.is-紧凑 .申请__名{font-size:22px;letter-spacing:1px}.is-紧凑 .申请__级{font-size:13px}.clinical-facts{margin:12px 0;gap:7px}.clinical-facts dt{font-size:11px}.clinical-facts dd{font-size:21px}.clinical-facts small{font-size:10px}.clinical-source{padding:8px 0;gap:4px}.clinical-source p{font-size:13px;line-height:1.6}.is-紧凑 .申请__底{padding-top:9px}.is-紧凑 .申请__钮{flex:1;min-height:36px;padding:5px 12px;font-size:13px}.completed-summary{font-size:11px;padding-top:5px}}
@media(max-height:650px){.is-紧凑 .申请块__翻页{margin-bottom:5px}.is-紧凑 .申请{padding:8px 11px}.is-紧凑 .申请__首{padding-bottom:5px}.is-紧凑 .申请__名{font-size:20px}.clinical-facts{margin:8px 0}.clinical-facts dt{margin-bottom:2px}.clinical-facts dd{font-size:19px}.clinical-source{padding:4px 0;gap:2px}.clinical-source p{-webkit-line-clamp:1}.is-紧凑 .申请__底{padding-top:6px}.clinical-source button{min-height:23px}}


.roster-position{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}.is-紧凑 .申请块__翻页 .roster-completed{font-size:11px;border:0;background:none;padding:0;min-height:24px;color:#b5c0a2}.roster-completed:hover{text-decoration:underline}.申请块.is-紧凑 .申请__钮{font-size:14px;line-height:1.4}.申请块.is-紧凑 .申请块__翻页{font-size:13px;line-height:1.4}.申请块.is-紧凑 .申请__级,.申请块.is-紧凑 .申请__熟{font-size:13px;line-height:1.4}.申请块.is-紧凑 .申请__名{font-size:24px;line-height:1.3}.申请块.is-紧凑 .申请块__叙事{font-size:12px;line-height:1.5}
@media(max-height:700px){.is-紧凑 .申请块__翻页{margin-bottom:5px}.is-紧凑 .申请{padding:8px 11px}.is-紧凑 .申请__首{padding-bottom:6px}.is-紧凑 .申请__名{font-size:21px}.clinical-facts{margin:9px 0}.clinical-facts dt{margin-bottom:2px}.clinical-facts dd{font-size:20px}.clinical-source{padding:3px 0;min-height:24px}.clinical-source>span,.clinical-source p{display:none}.clinical-source button{min-height:24px;padding:0}.is-紧凑 .申请__底{padding-top:6px}.is-紧凑 .申请__钮{min-height:34px}.is-紧凑 .申请块__叙事{font-size:11px;line-height:1.4}}
@media(max-height:700px){.申请块.is-紧凑{padding:6px}.申请块.is-紧凑 .申请{padding:7px 10px}.申请块.is-紧凑 .申请__名{font-size:21px}.clinical-facts{margin:5px 0}.clinical-facts dd{font-size:19px;line-height:1.25}.clinical-source{position:static;min-height:20px;padding:3px 0;gap:0}.clinical-source p{display:-webkit-box;-webkit-line-clamp:1;font-size:12px;line-height:1.5}.申请块.is-紧凑 .申请__底{padding-left:0;margin-top:auto}.申请块.is-紧凑 .申请__钮{font-size:13px;min-height:34px;padding:5px 9px}.申请块.is-紧凑 .申请块__翻页{font-size:12px;margin-bottom:4px}}
.clinical-backdrop{position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;background:#060b09c9;overscroll-behavior:contain}.clinical-backdrop .clinical-dialog{position:relative;inset:auto;margin:0;max-width:100%;width:460px;max-height:100%;padding:18px;box-sizing:border-box;outline:none;box-shadow:0 15px 55px #0009}.clinical-dialog ul{padding-left:22px;margin:14px 0 0}
@media(max-height:700px){.clinical-source{min-height:18px;padding:1px 0}}
</style>

<style scoped>
.npc-writing{display:flex;flex:1;min-height:0;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;color:#c9cbb5;box-sizing:border-box}
.npc-writing small{font-size:11px;color:#a8ae92;letter-spacing:3px}.npc-writing h3{margin:0;color:#e3d3a5;font-size:21px;font-weight:400}
.npc-writing p{max-width:360px;font-size:14px;line-height:1.85;margin:0;overflow-wrap:anywhere}.npc-writing button{margin-top:8px;border:1px solid #a99d6c;background:#435137;color:#efdfb4;padding:10px 18px;cursor:pointer;font:inherit}
@media(max-height:700px){.npc-writing{padding:14px;gap:8px}.npc-writing h3{font-size:19px}.npc-writing p{font-size:13px}.npc-writing button{padding:8px 14px}}
</style>

<style scoped>
.申请__首 .sentinel-name{display:inline-flex;align-items:baseline;gap:10px;font-family:inherit;font-size:inherit;line-height:inherit;color:#e5d8b8;border:0;border-bottom:1px dotted #abac7870;background:none;padding:0 0 2px;min-height:0;cursor:pointer;text-align:left}.申请__首 .sentinel-name small{font-size:11px;font-weight:400;letter-spacing:0;color:#adb899}.申请__首 .sentinel-name:hover{color:#fff0bf;border-color:#d3c28c}.申请__首 .sentinel-name:focus-visible{outline:2px solid #cdbb7d;outline-offset:4px}.is-紧凑 .申请__首 .sentinel-name{font-size:24px;min-height:0}@media(max-width:480px){.is-紧凑 .申请__首 .sentinel-name{font-size:21px;gap:8px}}
</style>
