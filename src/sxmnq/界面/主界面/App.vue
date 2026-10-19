<template>
  <div class="界" :class="{ 'is-fullscreen': 全屏 }">
    <header class="界__顶" :style="{ paddingTop: `${顶栏高 + 10}px` }">
      <div class="界__标">
        <span class="界__名">{{ 白塔线 ? '白塔 · 向导生活' : 数据.诊所.名称 || '未命名的诊所' }}</span>
        <button v-if="白塔线" class="界__日 calendar-trigger" :disabled="日程忙 || 生成中 || 忙" :title="数据.世界.日期" aria-label="打开年历" @click="年历开 = true">{{ 今日历.季 }}{{ 今日历.日 }}日 · {{ 是值班日(数据.日程) ? '值班日' : '休息日' }} · {{ 数据.世界.时段 }} ▾</button>
      </div>
      <span v-if="!白塔线" class="界__日">{{ 数据.世界.日期 }} · {{ 数据.世界.时段 }}</span>
      <button v-if="白塔线" class="界__钮 is-历史" @click="打开哨兵档案"><i class="fa-solid fa-user-group" /> 哨兵档案</button>
      <button v-if="白塔线 || !探索页" class="界__钮 is-历史" :disabled="日程忙 || 生成中 || 忙" :class="{ 'is-开': 看地图 }" @click="切换顶页('地图')">
        <i class="fa-solid fa-map-location-dot" /> 地图
      </button>
      <button class="界__钮 is-历史" :class="{ 'is-开': 看历史 }" @click="切换顶页('历史')">
        <i class="fa-solid fa-clock-rotate-left" /> 历史
      </button>
      <button v-if="!探索页" class="界__钮 is-历史" @click="正文设置开 = true">正文设置</button>
      <button class="界__钮 is-历史" @click="切换全屏">{{ 全屏 ? '退出全屏' : '全屏' }}</button>
    </header>

    <!-- 台子上叠着四页: 正文常驻在最底下, 另外三页绝对定位盖在它上面。
         点标签 = 换一整页, 正文被整块盖住 —— 不再是把标签条顶上去、在下面长一块。
         (旧样子: 点「诊所」, 标签条从 y=630 升到 y=442, 卡片在下面长出来, 正文被压掉一半。)

         正文**不用 v-show 藏**: 藏了就是 display:none, 元素一失去布局滚动位置就没了
         —— 玩家看诊回来会发现自己被弹回正文开头。让它一直有布局, 由上面那三页盖住它。

         三个块仍然**都常驻挂载** (v-show 而不是 v-if) —— 见 spec §9.1:
         「盯住日期」挂在 ApplyPanel 里, 改成 v-if 会让它静默死掉, 掷骰和申请列表
         永远不再更新, 而且不报错。 -->
    <p v-if="全屏错误" class="fullscreen-error" role="alert">{{ 全屏错误 }}</p>
    <main class="界__台">
      <!-- 正文区 = 这条消息切出来的所有块。只有一块默认摊开, 其余折成一行。
           为什么要「全都留着、只折起来」而不是「抠出正文、其余丢掉」:
           抠的判据一旦失手, 要么漏标签、要么把剧情整段丢掉, 而且都不报错。
           折起来最坏也只是折错了哪一块 —— 玩家看得见, 点开就有。见 正文适配.ts 的头部注释。 -->
      <div ref="文区" class="界__文">
        <section v-if="正文错误 || 生成中" class="generation-feedback" :class="{ 'is-error': 正文错误 }" :role="正文错误 ? 'alert' : 'status'" aria-live="polite"><strong>{{ 正文错误 ? '正文未能完成' : '正在生成正文' }}</strong><p>{{ 正文错误 || 等待说明 }}</p><div><button @click="关闭正文提示">{{ 生成中 ? '取消生成并关闭' : '关闭提示' }}</button><button v-if="生成中" @click="停止正文">停止生成</button><button v-else :disabled="忙 || 日程忙" @click="重试正文">重试正文</button><button v-if="!生成中" @click="正文设置开 = true">检查正文设置</button></div></section>
        <template v-if="块们.length">
          <template v-for="(块, 序) in 块们" :key="序">
            <!-- 摊开那块渲染的是 `片段` 不是 `内容` —— 双语预设把原文和译文逐行写在同一块里,
                 渲染 `内容` 会把两轨一起糊出来。见 正文适配.ts 的「三个层级」。 -->
            <template v-if="块.正文">
              <template v-for="(片, 内序) in 块.片段" :key="内序">
                <StoryText v-if="片.类 === '文'" :text="片.文" />
                <details v-else class="界__折 is-原文">
                  <summary class="界__折头">
                    <!-- 认不出语种时 片.语言 就是「原文」, 别写成「原文（原文）」。 -->
                    <span class="界__折名">原文{{ 片.语言 === '原文' ? '' : `（${片.语言}）` }}</span>
                    <span class="界__折数">{{ 片.文.length }} 字</span>
                  </summary>
                  <div class="界__折体">{{ 片.文 }}</div>
                </details>
              </template>
              <span v-if="生成中" class="界__笔">▍</span>
            </template>
            <details v-else class="界__折">
              <summary class="界__折头">
                <span class="界__折名">{{ 块.标题 }}</span>
                <span class="界__折数">{{ 块.字数 }} 字</span>
              </summary>
              <div class="界__折体">{{ 块.内容 }}</div>
            </details>
          </template>
        </template>
        <p v-else-if="!正文错误 && !生成中" class="界__空">（这一楼没有正文）</p>
      </div>

      <div v-show="展块 === '诊所'" class="界__页"><ClinicPanel v-if="!白塔线" /></div>
      <div v-show="展块 === '申请' && !生成中" class="界__页" :class="{ 'is-日程': 白塔线 }"><DayPanel v-if="白塔线" :正在显示="展块 === '申请' && !生成中" :浏览地图="浏览白塔" @返回接诊="浏览白塔 = false" @序章="回看序章 = true" :生成中="生成中" @忙="日程忙 = $event" @剧情="开始正文" @请求完成="结束正文" @错误="正文失败" /><ApplyPanel v-else @忙="日程忙 = $event" @剧情="开始正文" @请求完成="结束正文" @错误="正文失败" /></div>
      <div v-show="展块 === '家园'" class="界__页"><HomePanel v-if="!白塔线" @门="展块 = '剧情'" /></div>
      <div v-show="展块 === '世界'" class="界__页"><WorldPanel /></div>
    </main>

    <Teleport to="body"><div v-if="正文设置开" class="reading-mask" @click.self="正文设置开 = false" @keydown.esc.stop="正文设置开 = false"><section class="reading-settings" role="dialog" aria-modal="true" aria-label="正文显示设置"><h3>正文显示设置</h3><p>自动隐藏思维链与变量，保留正文。特殊预设可补充标签名称，用逗号分隔，无需尖括号。</p><label>正文标签<input v-model="正文标签" aria-label="正文标签" /></label><label>隐藏标签<input v-model="隐藏标签" aria-label="隐藏标签" /></label><p>例如正文填 game、story_scene；隐藏填 think_nya~。设置只影响显示，原始聊天记录保留。</p><footer><button @click="保存正文设置">保存</button><button @click="正文设置开 = false">返回</button></footer></section></div></Teleport>
    <nav class="界__签">
      <!-- 四个等宽标签 = 四个页面。点哪个整屏切哪个, 「剧情」就是正文本身。
           永远有一页选中, 所以不存在「怎么回去」这个问题。 -->
      <button class="界__态标" :class="{ 'is-开': 展块 === '剧情' }" @click="展块 = '剧情'">
        <span>剧情</span>
      </button>
      <button v-if="!白塔线" class="界__态标" :class="{ 'is-开': 展块 === '诊所' }" @click="展块 = '诊所'">
        <span>诊所</span>
      </button>
      <button class="界__态标" :class="{ 'is-开': 展块 === '申请' }" :disabled="生成中" :title="生成中 ? '剧情正在生成，请结束后继续值班或探索' : undefined" @click="切换日程">
        <span>{{ 白塔线 ? (是值班日(数据.日程) ? '值班' : '探索') : '申请' }}</span>
        <span v-if="待接数 && (!白塔线 || 是值班日(数据.日程))" class="界__角标">{{ 待接数 }}</span>
      </button>
      <button v-if="!白塔线" class="界__态标" :class="{ 'is-开': 展块 === '家园' }" @click="展块 = '家园'">
        <span>家园</span>
        <span v-if="仓库数" class="界__角标">{{ 仓库数 }}</span>
      </button>
      <!-- 五个标签是 320px 宽的极限了。 @media (max-width: 420px) 那一档又收了一次,
           但**够不够是量出来的, 不是算出来的** —— 见 浏览器验.mjs。 -->
      <button class="界__态标" :class="{ 'is-开': 展块 === '世界' }" @click="展块 = '世界'">
        <span>世界</span>
      </button>
    </nav>

    <footer v-if="!探索页" class="界__底">
      <textarea v-model="输入" class="界__输入" aria-label="对话输入" placeholder="说点什么……" rows="1" :disabled="忙 || 日程忙 || 生成中" @keydown="输入按键" />
      <button class="界__钮 is-发送" :disabled="忙 || 日程忙 || 生成中 || !输入.trim()" @click="发送">发送</button>
      <button class="界__钮 is-重说" :disabled="忙 || 日程忙 || 生成中" @click="重说">重说</button>
    </footer>

    <TowerPanel v-if="看白塔" :避让="顶栏高" @关="关闭顶页" />

    <CalendarPanel v-if="年历开" :day="数据.日程.天数" :offset="数据.日程.历法偏移" @close="年历开 = false" />
    <Prologue v-if="显示序章" :replay="!初次开场" @start="结束序章" />
    <MapPanel @入塔="进入白塔地图" :只读="白塔线" :避让="顶栏高" v-if="看地图" @关="关闭顶页" />

    <aside v-if="看历史" class="史" role="dialog" aria-modal="true" aria-label="历史" :style="{ paddingTop: `${顶栏高}px` }">
      <div class="史__顶">
        <span>历史</span>
        <button class="界__钮 is-历史" @click="关闭顶页">← 返回主界面</button>
      </div>
      <div class="史__体">
        <article v-for="条 in 历史" :key="条.号" class="史__条" :class="`is-${条.角色}`">
          <span class="史__签">{{ 条.角色 === 'user' ? '你' : '旁白' }}</span>
          <p>{{ 条.文 }}</p>
        </article>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { 请求正文 } from '../共用/剧情请求';
import StoryText from '../共用/StoryText.vue';
import { use全屏 } from '../共用/全屏';
const { 全屏, 全屏错误, 切换全屏 } = use全屏();
// import 名必须是 ASCII。Vue 模板编译器认不出非 ASCII 的标签名, 写成 `<治疗面板 />`
// 会被当纯文本渲染、绑定全丢, 而且只有生产构建才发作、构建照报成功。
// ★ 这条注释就是全仓的出处: 入口/App.vue、创建/App.vue、家园/App.vue 都指向这里。
import ClinicPanel from '../诊所/App.vue';
import DayPanel from '../日程/App.vue';
import Prologue from '../日程/Prologue.vue';
import { 序章正文 } from '../日程/序章文案';
import CalendarPanel from '../日程/CalendarPanel.vue';
import { 年历位置 } from '../../养成/年历';
import ApplyPanel from '../申请/App.vue';
import { 是值班日 } from '../../养成/规则';
import HomePanel from '../家园/App.vue';
import WorldPanel from '../世界/App.vue';
// 白塔线那一页。它**不是第六个标签** —— 见下面顶栏那处注释。
import TowerPanel from '../白塔/App.vue';
// 地图那一页。同上, 也开在顶栏。
import MapPanel from '../地图/App.vue';
import { 算仓库 } from '../../家园/家具';
import { useDataStore } from '../共用/数据';
import { use顶栏高 } from '../共用/量顶栏';
import { 切块, 取正文, 读适配 } from '../共用/正文';

const store = useDataStore();
const 数据 = computed(() => store.data);

const 原文 = ref('');
const 当前正文号 = ref<number | null>(null);
const 生成中 = ref(false);
/**
 * 现在开着哪页。**永远有一页** —— '剧情' 就是正文本身, 不是「什么都没开」。
 *
 * 早先这里有个 null 表示全折叠, 靠再点一次同一个标签来收起。那个模型下界面是
 * 「正文 + 底下长出来的一块」: 标签条被顶上去, 正文被压掉一半, 而「怎么回去」
 * 没有任何可见提示。一页一个标签之后这两件事都没了。
 */
const 年历开 = ref(false);
const 今日历 = computed(() => 年历位置(数据.value.日程.天数, 数据.value.日程.历法偏移));
const 白塔线 = computed(() => 数据.value.主角.路线 === '白塔向导路线');
const 展块 = ref<'剧情' | '诊所' | '申请' | '家园' | '世界'>('申请');
const 浏览白塔 = ref(false);
const 回看序章 = ref(false);
const 初次开场 = computed(() => 白塔线.value && !数据.value.日程.序章已读 && 数据.value.日程.天数 === 1 && 数据.value.日程.已接诊 === 0 && 数据.value.日程.活动记录.length === 0 && 数据.value.向导.经验 === 0 && !Object.values(数据.value.哨兵).some(人 => 人.已治疗 > 0));
const 显示序章 = computed(() => 白塔线.value && (初次开场.value || 回看序章.value));
function 结束序章() { const 初次 = 初次开场.value; if (初次) 数据.value.日程.序章已读 = true; 回看序章.value = false; if (初次) { 浏览白塔.value = false; 展块.value = '申请'; } }
function 进入白塔地图() { if (日程忙.value || 生成中.value || 忙.value) return; 关闭顶页(); 浏览白塔.value = 是值班日(数据.value.日程); 展块.value = '申请'; }
const 探索页 = computed(() => 白塔线.value && (!是值班日(数据.value.日程) || 浏览白塔.value) && 展块.value === '申请');
const 看历史 = ref(false);
const 看白塔 = ref(false);
function 打开哨兵档案() { 关闭顶页(); 看白塔.value = true; }
const 看地图 = ref(false);
const 输入 = ref('');
function 关闭顶页() { 看白塔.value = false; 看地图.value = false; 看历史.value = false; }
function 切换顶页(页: '地图' | '历史') {
  const 已开 = 页 === '地图' ? 看地图.value : 看历史.value;
  关闭顶页();
  if (!已开) { if (页 === '地图') 看地图.value = true; else 看历史.value = true; }
}
function 退出按键(event: KeyboardEvent) { if (event.key === 'Escape' && (看白塔.value || 看地图.value || 看历史.value)) { event.preventDefault(); 关闭顶页(); } }
onMounted(() => window.addEventListener('keydown', 退出按键));
onUnmounted(() => window.removeEventListener('keydown', 退出按键));
watch(() => 数据.value.日程.天数, () => { if (!白塔线.value) return; 浏览白塔.value = false; 展块.value = '申请'; 看地图.value = false; 看白塔.value = false; 看历史.value = false; });
const 忙 = ref(false);
const 日程忙 = ref(false);
const 正文错误 = ref('');
const 主动关闭 = ref(false);
const 已存反馈 = getVariables({ type: 'chat' }).白塔正文反馈;
const 当前末条 = getChatMessages(-1)[0];
if (已存反馈?.消息号 === 当前末条?.message_id && 已存反馈?.关闭) 主动关闭.value = true;
if (!主动关闭.value && 已存反馈?.消息号 === 当前末条?.message_id && typeof 已存反馈?.错误 === 'string') 正文错误.value = 已存反馈.错误;
if (!主动关闭.value && !正文错误.value && 当前末条?.role === 'user') 正文错误.value = '上一条请求尚无助手正文。界面已重新载入，无法确认旧请求是否仍在运行；请先确认酒馆已停止，再重试正文。';
if (正文错误.value) 展块.value = '剧情';
watch(正文错误, 错误 => {
  updateVariablesWith(vars => { vars.白塔正文反馈 = { 消息号: getChatMessages(-1)[0]?.message_id, 错误, 关闭:主动关闭.value }; return vars; }, { type: 'chat' });
});
let 空正文提示 = false;
const 等待秒数 = ref(0);
const 无更新秒数 = ref(0);
let 请求开始时间 = 0;
let 最后更新时间 = 0;
let 本次请求 = false;
let 请求起点: { message_id: number; message: string; role: string } | undefined;
let 已见错误提示 = new WeakSet<Element>();
const 等待说明 = computed(() => 无更新秒数.value >= 60
  ? `已 ${无更新秒数.value} 秒没有收到新内容。请求可能仍在等待，或连接暂时无响应；可停止后重试。`
  : 原文.value && !块们.value.some(块 => 块.内容.trim())
    ? `已收到回复内容，但暂未出现可显示的正文，可能正在思考或正文标签尚未闭合。已等待 ${等待秒数.value} 秒。`
    : 块们.value.some(块 => 块.内容.trim())
      ? `正文正在接收，已生成 ${等待秒数.value} 秒。`
      : `等待酒馆回复，已等待 ${等待秒数.value} 秒。`);
function 开始正文() {
  主动关闭.value = false;
  if (!生成中.value) {
    请求开始时间 = 最后更新时间 = Date.now(); 等待秒数.value = 无更新秒数.value = 0;
    请求起点 = getChatMessages(-1)[0];
    已见错误提示 = new WeakSet<Element>(Array.from(window.parent.document.querySelectorAll('.toast-error')));
    正文错误.value = ''; 空正文提示 = false; 原文.value = ''; 上次 = ''; 本次请求 = true;
  }
  生成中.value = true; 展块.value = '剧情';
}
function 正文失败(error: unknown) {
  if (主动关闭.value) { 生成中.value = false; 正文错误.value = ''; return; }
  空正文提示 = false;
  const detail = error instanceof Error ? error.message : String(error);
  正文错误.value = `正文生成失败：${detail.slice(0, 500) || '酒馆未提供具体原因，请检查连接与模型设置。'}`;
  生成中.value = false; 展块.value = '剧情';
  console.warn('[正文] 请求失败', detail);
}
function 结束正文() {
  const 曾生成 = 生成中.value;
  生成中.value = false; 刷新();
  if (曾生成 && 本次请求 && !正文错误.value && !块们.value.some(块 => 块.内容.trim())) {
    空正文提示 = true;
    正文错误.value = 原文.value.trim()
      ? '生成已结束，但没有找到可显示的正文。回复可能只有思考/变量内容，或预设标签未被识别；请检查正文设置。'
      : '生成已结束，但酒馆没有返回正文。请检查连接、模型与预设设置后重试。';
  }
}
function 关闭正文提示() {
  主动关闭.value = true; 空正文提示 = false; 本次请求 = false;
  if (生成中.value) SillyTavern.stopGeneration();
  生成中.value = false; 正文错误.value = '';
  updateVariablesWith(vars=>{vars.白塔正文反馈={消息号:getChatMessages(-1)[0]?.message_id,错误:'',关闭:true};return vars;},{type:'chat'});
  刷新();
}
function 停止正文() {
  空正文提示 = false;
  SillyTavern.stopGeneration();
  生成中.value = false;
  正文错误.value = '已停止本次生成。已经收到的正文保留，可重试正文。';
  刷新();
}
async function 重试正文() {
  if (忙.value || 日程忙.value || 生成中.value) return;
  const 最新 = getChatMessages(-1)[0];
  if (!最新 || 最新.role === 'system') { 正文失败('没有可重试的对话，请先发送内容。'); return; }
  await 跑(最新.role === 'assistant' ? '/regenerate await=true' : '/trigger await=true');
}
function 切换日程() {
  if (生成中.value || 日程忙.value) return;
  浏览白塔.value = false;
  展块.value = '申请';
}
const 文区 = ref<HTMLElement | null>(null);

// 让开酒馆工具栏的活交给公共件了 —— 标题页和创建页也要让, 三页共用一份。
const 顶栏高 = use顶栏高();

// 适配表**开在这里读一次**就够了。正文每 500ms 跟着流式生成重切一遍, 每遍都去读一次
// 全局变量纯属浪费; 反正玩家改了配置也是要刷页面才生效的。
const 适配 = ref(读适配());
const 正文设置开 = ref(false);
const 正文标签 = ref(适配.value.正文容器.join(', '));
const 隐藏标签 = ref(适配.value.噪声标签.join(', '));
function 保存正文设置() {
  const 分割 = (text: string) => text.split(/[,，\n]/).map(tag => tag.trim().replace(/^<\/?|>$/g, '')).filter(Boolean);
  const 新适配 = { ...适配.value, 正文容器: 分割(正文标签.value), 噪声标签: 分割(隐藏标签.value) };
  updateVariablesWith(variables => { variables.正文适配 = klona(新适配); return variables; }, { type: 'global' });
  适配.value = 新适配;
  正文设置开.value = false;
}

const 块们 = computed(() => 切块(白塔线.value && 当前正文号.value === 0 && !生成中.value ? 序章正文 : 原文.value, 适配.value));

// （原来这里有个 `分段()`: 把摊开那块按空行切成 <p>。它并进了 正文适配.ts 的 切片段() ——
//   双语预设要求分段之外再分「中文轨/外语轨」, 两件事得在同一遍里做完, 不然先分段再判外语
//   就要把每段的行重新拼回去, 白白绕一圈。）

// 注意末尾的 `.value()`: lodash 链没它的话返回的是包装对象, 恒为真, 角标会永远显示。
const 待接数 = computed(
  () =>
    _(数据.value.今日.申请列表)
      .entries()
      .filter(([, 项]) => 项.状态 === '待接')
      .value().length,
);

/** 「家园」按钮上的角标 = 仓库里有几件没摆 (spec §6.3/§9) */
const 仓库数 = computed(() => 算仓库(数据.value.诊所.家具).length);

const 历史 = computed(() => {
  try {
    // 适配表读一次就够 —— 下面每条消息都要用它, 每条都去读一遍全局变量纯属浪费。
    const 适配 = 读适配();
    return getChatMessages('0-{{last}}')
      .filter(条 => 条.role !== 'system')
      .map(条 => ({ 号: 条.message_id, 角色: 条.role, 文: 取正文(白塔线.value && 条.role === 'assistant' && 条.message_id === 0 ? 序章正文 : 条.message, 适配) }))
      .filter(条 => 条.文);
  } catch {
    return [];
  }
});

// 界面挂死在第一楼, 剧情却一直在往新楼层长 —— 只能自己盯着最新一楼。
// 500ms 是为了让流式生成看起来像在打字; 再快没必要, 再慢就顿。
let 上次 = '';

function 刷新() {
  const 最新 = getChatMessages(-1)[0];
  // 用户请求和元指令不属于正文，流式阶段只显示当前助手回复。
  const 是旧回复 = 本次请求 && 请求起点?.role === 'assistant' && 最新?.message_id === 请求起点.message_id && 最新?.message === 请求起点.message;
  const 今 = 最新?.role === 'assistant' && !是旧回复 ? 最新.message : '';
  当前正文号.value = 最新?.role === 'assistant' && !是旧回复 ? 最新.message_id : null;
  if (生成中.value) {
    等待秒数.value = Math.floor((Date.now() - 请求开始时间) / 1000);
    无更新秒数.value = Math.floor((Date.now() - 最后更新时间) / 1000);
    const 等待上限 = getPreset('in_use').settings.should_stream && 原文.value.trim() ? 180 : 600;
    if (今 === 上次 && 无更新秒数.value >= 等待上限) {
      try { SillyTavern.stopGeneration(); } catch (error) { console.warn('[正文] 中止请求失败', error); }
      正文失败(`连续 ${等待上限} 秒未收到新内容，已结束等待并尝试中止请求。请检查连接后手动重试。`);
      return;
    }
    for (const toast of Array.from(window.parent.document.querySelectorAll('.toast-error'))) {
      if (已见错误提示.has(toast)) continue;
      已见错误提示.add(toast);
      const 文 = $(toast).find('.toast-message').text() || $(toast).text();
      if (文.trim()) 正文错误.value = `酒馆提示错误：${文.trim().slice(0, 500)}`;
    }
  }
  if (今 === 上次) return;
  最后更新时间 = Date.now();
  上次 = 今;
  原文.value = 今;
  // 部分预设/插件会在结束事件之后才写入回复，恢复时撤销空正文误报。
  if (空正文提示 && 块们.value.some(块 => 块.内容.trim())) { 正文错误.value = ''; 空正文提示 = false; }
  // 顶上压着浮层时别自己滚正文 —— 玩家正在看的是浮层, 底下的正文跟着动只是白费功夫。
  if (!看历史.value && !看白塔.value && !看地图.value) {
    nextTick(() => 文区.value?.scrollTo({ top: 文区.value.scrollHeight }));
  }
}

刷新();
const 计时 = setInterval(刷新, 500);
onUnmounted(() => clearInterval(计时));

// 流式生成时把光标点出来, 生成结束就收掉。
// 光标只在真的在生成时闪。
//
// 光靠 GENERATION_ENDED 收尾不够 —— 那事件在某些路径下不会来(比如别的东西往聊天里
// 直接塞了一条消息), 光标就会一直闪下去, 看起来像卡死了。所以凡是「这一轮结束了」的
// 信号都拿来收一次尾, 多收几次没有副作用。
function 收笔() {
  结束正文();
}

try {
  eventOn(tavern_events.GENERATION_STARTED, (type, option, dry_run) => {
    // 酒馆计算提示词/token 时也会触发开始事件，但不会发送请求。
    if (dry_run || type === 'impersonate' || (type === 'quiet' && !option?.quietToLoud)) return;
    开始正文();
  });
  eventOn(tavern_events.GENERATION_STOPPED, () => { 空正文提示 = false; 生成中.value = false; 正文错误.value = 主动关闭.value ? '' : '酒馆已停止生成。已收到的正文保留，可以重试。'; 刷新(); });
  ['GENERATION_ENDED', 'MESSAGE_RECEIVED', 'MESSAGE_SWIPED'].forEach(名 =>
    eventOn(tavern_events[名], 收笔),
  );
} catch {
  // 不在酒馆里(开发期直接开 index.html)时没有这些事件, 忽略。
}

async function 跑(指令: string) {
  if (忙.value || 日程忙.value) return;
  忙.value = true;
  开始正文();
  try {
    await 请求正文(指令);
  } catch (错) {
    正文失败(错);
    toastr.error(String(错), '操作失败');
  } finally {
    结束正文();
    忙.value = false;
    刷新();
  }
}

// `await=true` 才能等到生成完再继续 —— 否则下一个动作会插到生成中间去。
const 重说 = () => 重试正文();
function 输入按键(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.isComposing && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) { event.preventDefault(); void 发送(); }
}
async function 发送() {
  const 文 = 输入.value.trim();
  if (!文 || 忙.value || 日程忙.value || 生成中.value) return;
  忙.value = true;
  let 已记录 = false;
  try {
    await createChatMessages([{ role: 'user', message: 文 }]);
    已记录 = true; 输入.value = ''; 展块.value = '剧情';
    开始正文();
    await 请求正文('/trigger await=true');
  } catch (错) {
    正文失败(错);
    console.error('[对话] 发送失败', 错);
    toastr.error(已记录 ? '你的话已保存，回复未能生成。' : '发送失败，输入内容已保留。', '对话');
  } finally { 忙.value = false; 结束正文(); }
}
</script>

<style lang="scss" scoped>
.generation-feedback { position: sticky; top: 0; z-index: 2; margin-bottom: 18px; padding: 14px; border: 1px solid #747450; border-radius: 8px; background: #293126; overflow-wrap: anywhere; }
.generation-feedback.is-error { border-color: #b88468; background: #352b24; }
.generation-feedback p { margin: 8px 0 12px; }
.generation-feedback div { display: flex; flex-wrap: wrap; gap: 8px; }
.generation-feedback button { padding: 7px 12px; border: 1px solid #847d5d; border-radius: 4px; color: #e1d2a5; background: #38442b; cursor: pointer; }
.generation-feedback button:disabled { opacity: .5; cursor: default; }
.界__页.is-日程{overflow:hidden;padding:0}.界__底 .界__输入{resize:none;max-height:60px}
.界__输入{flex:1;min-width:0;box-sizing:border-box;resize:vertical;min-height:40px;max-height:110px;padding:10px 12px;background:#1b251d;border:1px solid #747450;color:#ddd1b5;font:14px/1.5 inherit;border-radius:3px}.界__输入:focus{outline:1px solid #c5b57e}.界__输入:disabled{opacity:.5}.界__底 .is-发送,.界__底 .is-重说{flex:none;padding:0 12px;min-height:40px;align-self:flex-end}.界__底 .is-发送{background:#38442b;color:#e1d2a5}.史{box-sizing:border-box}@media(max-width:420px){.界__底{padding:8px!important;gap:6px!important}.界__底 .is-发送,.界__底 .is-重说{padding:0 9px;font-size:12px}}
.界 {
  position: relative;
  display: flex;
  flex-direction: column;
  // 高度由 index.ts/App 设好的 iframe 高度决定。100% 而不是 vh —— vh 在 iframe 里
  // 指的是 iframe 自己的高度, 会绕成一个圈。
  height: 100%;
  background: linear-gradient(178deg, #252b23 0%, #171d1b 100%);
  color: #ddd1b5;
  font-size: 15px;
  line-height: 1.75;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;

  &__顶 {
    flex: none;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
  }

  &__标 {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }

  &__名 {
    color: #e5d8b8;
    font-weight: 600;
    font-size: 0.98em;
    letter-spacing: 0.03em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__日 {
    color: #96967e;
    font-size: 0.76em;
  }

  /* 台子 = 正文 + 盖在它上面的三页。底下那三页是 absolute, 靠它定位 */
  &__台 {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  /* 正文。**常驻有布局**, 不参与 v-show —— 见模板里那段注释:
     藏成 display:none 会丢滚动位置, 看诊回来就被弹回开头 */
  &__文 {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 24px clamp(18px, 4.5%, 48px) 32px;
    background: #171e1d;

    p {
      margin: 0 0 1em;
      // 中英混排时首行不缩进, 靠段间距分节 —— 手机窄屏下缩进太吃宽度。
      color: #eee9df;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  /* 折叠块 —— 预设的思维链、选项、摘要这些。默认收成一行, 点开才看。
     为什么不索性丢掉: 判据失手时"丢掉"是**不报错**的静默失败, 玩家只会觉得剧情凭空少了一截;
     折起来最坏也只是折错了哪一块, 内容一直都在。 */
  &__折 {
    margin: 0 0 1em;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.025);

    &:last-child {
      margin-bottom: 0;
    }

    &[open] {
      background: rgba(255, 255, 255, 0.045);

      /* 展开时把小三角转 90 度 */
      > summary::before {
        transform: rotate(90deg);
      }
    }

    /* 行内的「原文」折叠条 —— 双语预设那条外语轨。
       比整块的折叠**更轻**: 一屏会出现二三十条, 用整块那样的边框和底色会把正文切成碎片。
       所以底色不要、只留一条左边线, 并且上边距收一点, 让它贴住上面那句译文。 */
    &.is-原文 {
      margin: -0.4em 0 1em;
      border: 0;
      border-left: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 0;
      background: none;

      &[open] {
        background: none;
      }

      > .界__折头 {
        padding: 3px 10px;
        font-size: 0.76em;
      }

      > .界__折体 {
        padding: 0 10px 6px 20px;
        font-size: 0.84em;
      }
    }
  }

  &__折头 {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 11px;
    font-size: 0.82em;
    letter-spacing: 0.04em;
    cursor: pointer;
    /* 干掉浏览器默认那个三角: 它的大小和位置各家不一样, 留着跟文字对不齐 */
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    /* 自己画一个, 用 currentColor 所以跟着状态色走 */
    &::before {
      content: '';
      flex: none;
      width: 0;
      height: 0;
      border-left: 4px solid currentColor;
      border-top: 3.5px solid transparent;
      border-bottom: 3.5px solid transparent;
      transition: transform 0.15s ease;
    }
  }

  &__折名 {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: #a6ab91;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__折数 {
    flex: none;
    color: #4d5866;
    font-variant-numeric: tabular-nums;
  }

  &__折体 {
    padding: 0 11px 10px 24px;
    color: #96967e;
    font-size: 0.88em;
    line-height: 1.65;
    /* 折叠块里是原样的文本, 换行得留住 */
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__笔 {
    display: inline-block;
    color: #d7c38d;
    // 动画名用 ASCII。Vue 的 scoped 样式会重写 @keyframes 的名字, 非 ASCII 容易被漏掉,
    // 结果就是引用不到、光标不闪 —— 而且不报错。跟组件标签名那条坑是同一类。
    animation: th-blink 1s steps(2, start) infinite;
  }

  &__空 {
    color: #4d5866;
    font-size: 0.9em;
  }

  /* 盖在正文上的那三页。
     不透明底是**必要**的: 它是「换了一页」, 不是「弹了个窗」, 底下不该透出正文。
     底色跟 .界 那份一样 —— 页只盖住中间这一段, 上下分别是顶栏和标签条,
     两段渐变各自从头开始, 接缝在 #252b23 上, 看不出来。
     每块自带 .界卡 的 margin, 左右留一点免得贴边。 */
  &__页 {
    position: absolute;
    inset: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0 12px 12px;
    background: linear-gradient(178deg, #252b23 0%, #171d1b 100%);

    /* 让每一页成为**尺寸查询容器** —— 家园页那张九宫格要按「这一页有多高」定边长,
       用的就是这里的 cq 单位 (见 九宫格.vue 的 .宫)。
       用 size 而不是 inline-size: 要量的是**高**, inline-size 量不到高。
       contain 不影响这一页自己: 它的尺寸来自 inset: 0, 本来就不看内容。 */
    container-type: size;
  }

  /* 五个等宽标签 = 五个页面。位置固定在底部, 不再被展开的面板顶上去。
     开着的那页靠 is-开 的底色认 —— 互斥的按钮更像标签页, 加箭头反而说不清它管哪一块 */
  &__签 {
    flex: none;
    display: flex;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  &__态标 {
    display: flex;
    align-items: center;
    /* 居中对齐 —— 四个标签里有两个带角标, 左对齐会让「申请」「家园」的文字
       比另外两个偏一截, 一排看过去是歪的 */
    justify-content: center;
    gap: 7px;
    flex: 1;
    min-width: 0;
    min-height: 42px;
    /* 每加一个标签, 每个就窄一档, 而 320px 宽的机器上本来就已经贴着边了:
       三个 → 四个时内边距从 14px 收到 10px, 四个 → 五个时由下面那条
       @media (max-width: 420px) 再收到 5px。**再要加第六个就得先量一遍**,
       照这个收法会先把「申请」的角标挤出去。 */
    padding: 0 10px;
    border: none;
    background: rgba(255, 255, 255, 0.02);
    color: #a6ab91;
    font-family: inherit;
    font-size: 0.86em;
    letter-spacing: 0.06em;
    cursor: pointer;

    i {
      color: #5c6773;
      font-size: 0.9em;
    }

    /* 开着的那一块。`i` 那条规则留着 —— 现在没有箭头图标, 但将来加回来时
       它会自动跟着变色, 不用再改两处 */
    &.is-开 {
      background: rgba(215, 195, 141, 0.08);
      color: #e5d4a3;

      i {
        color: #e5d4a3;
      }
    }
  }

  /* 不再 `margin-left: auto` —— 那是在左对齐的标签里把角标甩到右边的写法。
     现在整行居中, 角标跟着文字走, 由 gap 隔开就对了 */
  &__角标 {
    flex: none;
    padding: 1px 8px;
    border-radius: 999px;
    background: rgba(215, 195, 141, 0.14);
    border: 1px solid rgba(215, 195, 141, 0.3);
    color: #e5d4a3;
    font-size: 0.86em;
    font-variant-numeric: tabular-nums;
  }

  &__底 {
    flex: none;
    display: flex;
    gap: 9px;
    padding: 10px 14px 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
  }

  &__钮 {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 16px;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(255, 255, 255, 0.045);
    color: #b8baa4;
    font-family: inherit;
    font-size: 0.9em;
    cursor: pointer;
    transition: background 0.18s ease, opacity 0.18s ease;

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }

    &:not(:disabled):hover {
      background: rgba(255, 255, 255, 0.09);
    }

    &.is-主 {
      flex: 1;
      background: rgba(215, 195, 141, 0.14);
      border-color: rgba(215, 195, 141, 0.34);
      color: #e5d4a3;

      &:not(:disabled):hover {
        background: rgba(215, 195, 141, 0.24);
      }
    }

    &.is-历史 {
      flex: none;
      min-height: 32px;
      padding: 0 11px;
      font-size: 0.82em;
      color: #a6ab91;

      &.is-开 {
        background: rgba(215, 195, 141, 0.14);
        border-color: rgba(215, 195, 141, 0.3);
        color: #e5d4a3;
      }
    }
  }

  /* 窄屏(320~420px 那段)四个标签会把「申请」的角标挤出去。整条收一档 */
  @media (max-width: 420px) {
    &__态标 {
      padding: 0 5px;
      gap: 4px;
      font-size: 0.78em;
      letter-spacing: 0.02em;
    }

    &__角标 {
      padding: 1px 5px;
    }
  }
}

.史 {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: #171d1b;

  &__顶 {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    color: #e5d8b8;
    font-weight: 600;
  }

  &__体 {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 14px 16px 24px;
  }

  &__条 {
    margin-bottom: 16px;

    p {
      margin: 0;
      color: #b8baa4;
      font-size: 0.94em;
      white-space: pre-wrap;
    }

    &.is-user p {
      color: #a6ab91;
      font-style: italic;
    }
  }

  &__签 {
    display: block;
    margin-bottom: 3px;
    color: #4d5866;
    font-size: 0.76em;
    letter-spacing: 0.1em;
  }
}

@keyframes th-blink {
  50% {
    opacity: 0;
  }
}
.fullscreen-error{flex:none;margin:0;padding:8px 14px;color:#ffd2ab;background:#442d23;font-size:14px}.界.is-fullscreen{border:0;border-radius:0;box-shadow:none;padding:0}.is-fullscreen :deep(.atlas){border:0}
.界__日{font-size:14px!important;line-height:1.6!important}.界__顶 .界__钮{font-size:14px}@media(max-width:600px){.界__顶{gap:7px;padding:10px 12px}.界__标{flex:1 0 100%;width:100%;min-width:0}.界__日{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.界__顶 .界__钮{font-size:13px;padding:7px 9px}}
.calendar-trigger{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:left}.calendar-trigger:disabled{cursor:default;opacity:.6}.calendar-trigger:hover:not(:disabled){color:#d6c38b}
</style>
<style scoped>
.reading-mask{position:fixed;inset:0;z-index:1400;background:#07100dc9;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}.reading-settings{width:480px;max-width:100%;box-sizing:border-box;background:#252e23;color:#ddd1b5;padding:22px;border:1px solid #a09162}.reading-settings h3{margin-top:0;font-size:19px;font-weight:400}.reading-settings p{font-size:12px;line-height:1.8}.reading-settings label{display:block;font-size:13px;margin:12px 0}.reading-settings input{display:block;box-sizing:border-box;width:100%;margin-top:7px;padding:9px;background:#17211a;color:#ddd1b5;border:1px solid #7c795b}.reading-settings footer{display:flex;gap:10px}.reading-settings button{padding:8px 14px;background:#35412d;color:#ddd1b5;border:1px solid #998b60;cursor:pointer}.界__顶{flex-wrap:wrap}
.fullscreen-error{flex:none;margin:0;padding:8px 14px;color:#ffd2ab;background:#442d23;font-size:14px}.界.is-fullscreen{border:0;border-radius:0;box-shadow:none;padding:0}.is-fullscreen :deep(.atlas){border:0}
.界__日{font-size:14px!important;line-height:1.6!important}.界__顶 .界__钮{font-size:14px}@media(max-width:600px){.界__顶{gap:7px;padding:10px 12px}.界__标{flex:1 0 100%;width:100%;min-width:0}.界__日{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.界__顶 .界__钮{font-size:13px;padding:7px 9px}}
</style>
