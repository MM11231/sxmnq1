<template>
  <!-- 地图那一页。盖满整屏, 由主界面顶栏那个按钮开关(和「白塔」「历史」同一个套路)。

       这张图不是新画的 —— 它照着**老卡里那张图**搬过来的(结构、摆位、每一格的
       说明文字都是)。老卡那张藏在 `regex_scripts[4]` 里, 数据是 `MAP_DATA`;
       搬来的过程见 `src/sxmnq/地图/数据.ts` 顶上那段。

       画法是**平面图**, 不是九宫格: 每块地方按手摆的坐标画在纸上, 中间用走廊连起来,
       底下铺一层交叉格纹。九宫格只能表达九个位置, 而世界书说的是方位(北翼/西翼/
       东翼/南翼/中庭), 六个设施硬塞进去出来的是一张表格, 不是一张图。
       坐标在 `地图/平面图.ts`。

       和老卡那张的三处不一样, 都是**故意**的:
         1. 换成深色底。老卡是白卡片 + 琥珀金, 玩家要深色。
         2. 当前所在从蓝改成青(玩家点名要青)。老卡那个蓝 `#aab996` 和「可进去」
            的提示色太近, 在一屏深色格子里几乎分不出来。
         3. 多了一个 `@` 移步 —— 老卡只**读** `世界.地点` 不让玩家改。见下面
            `移步中` 那段注释。 -->
  <aside class="图" role="dialog" aria-modal="true" aria-label="地图" :style="{ paddingTop: `${props.避让}px` }">
    <div class="图__顶">
      <!-- 返回键**常驻占位**、只在有上一层的才可见。不这么做的话面包屑会左右横跳,
           玩家每钻一层就得重新找字。 -->
      <button class="图__回 is-见" @click="退回">{{ 栈.length > 1 ? '← 返回上层' : '← 返回' }}</button>
      <span class="图__径">{{ 栈.map(屏 => 屏.名).join(' › ') }}</span>
      <button
        v-if="能移步 && !props.只读"
        class="图__步"
        :class="{ 'is-开': 移步中 }"
        :aria-pressed="移步中"
        @click="移步中 = !移步中"
      >
        @ 移步
      </button>
      <button class="图__闭" @click="emit('关')">返回主界面</button>
    </div>

    <div class="图__体" :class="{ 'is-移步': 移步中, 'is-世界': 栈.length === 1 }">
      <!-- 移步模式开着的时候, 顶上挂一条横幅。不挂的话玩家会以为地图卡住了 ——
           因为这时候点房间不再弹说明、也不再往下钻, 屏幕上一点反馈都没有。 -->
      <p v-if="移步中" class="图__提">点一个地方, 把「@」挪过去。</p>

      <!-- 钻进某个设施之后: 先摆一句这个设施自己的话, 再单列排开它有哪些房间。
           摆设自己那句话是必须的 —— 设施全是「可钻」的, 点下去就钻走了, 说明条根本
           没机会弹; 不在这儿摆出来的话它永远到不了玩家眼前(老卡就是这样, 它的 desc
           只对不可钻的格子生效)。 -->
      <WorldAtlas v-if="栈.length === 1" :当前位置="我格?.id ?? ''" @选择="世界选点" />
      <template v-else-if="当前屏.间">
        <p v-if="当前屏.说" class="图__区说">{{ 当前屏.说 }}</p>
        <!-- 房间一行一间, 说明直接摆在名字旁边, 不藏进点击里 —— 就一句话, 挡在弹窗
             后面是白让玩家多按一下。 -->
        <div class="图__间列">
          <div v-for="间 in 当前屏.间" :key="间.id" class="图__间">
            <span class="图__间名">{{ 间.名 }}</span>
            <span class="图__间说">{{ 间.说 }}</span>
          </div>
        </div>
      </template>

      <!-- 平面图。宽高比来自图纸, 所以任何宽度下都是同一个形状, 只会整体缩放。
           窄屏时纸有 min-width, 由 .图__体 横向滚 —— 见那处注释。 -->
      <div v-else-if="当前平面" class="图__纸" :style="{ aspectRatio: String(当前平面.比) }">
        <!-- 图纸上下的区域标, 像参考图的「城外 / 城内」。 -->
        <span v-if="当前平面.外标" class="图__区标 is-外">{{ 当前平面.外标 }}</span>
        <span v-if="当前平面.内标" class="图__区标 is-内">{{ 当前平面.内标 }}</span>

        <!-- 底纹上的花和水池。纯装饰, 不接事件。 -->
        <i
          v-for="(饰, 序) in 当前平面.饰"
          :key="`饰${序}`"
          class="图__饰"
          :class="`is-${饰.样}`"
          :style="{ left: `${饰.x}%`, top: `${饰.y}%` }"
        />

        <!-- 走廊。**画在房间前面**, 房间压着它 —— 两头各插进房间 2%, 接缝就看不出来了
             (`平面图.ts` 里那处注释)。 -->
        <i v-for="(廊, 序) in 当前平面.廊" :key="`廊${序}`" class="图__廊" :style="画(廊)" />

        <!-- 「@」是**兄弟节点**不是子节点。放进 button 里的话就是按钮套按钮, HTML 不允许,
             各家浏览器的处理还不一样 —— 而这里的失败长这样: 点「@」把外层那间也一起点了,
             于是你既进了移步模式、又钻进了白塔。所以它单独一颗, 绝对定位到那间的角上。 -->
        <button
          v-for="格 in 有格的"
          :key="格.id"
          class="图__房"
          :class="[`is-${格.id}`, 房样(格), { 'is-我': 就是这(格), 'is-钻': 格.可钻 }]"
          :style="画(位(格))"
          :aria-current="就是这(格) ? 'true' : undefined"
          @click="点格(格)"
        >
          <span class="图__房名">{{ 格.名 }}</span>
          <span v-if="格.副" class="图__房副">{{ 格.副 }}</span>
        </button>

        <!-- 你在这间。点它就进移步模式 —— 玩家要挪窝的时候, 第一反应是点自己脚下,
             不是去顶栏找那个开关。 -->
        <button
          v-if="我格 && !props.只读"
          class="图__我"
          :class="{ 'is-选': 移步中 }"
          :style="我标位"
          :aria-label="`移步, 现在在${我格.名}`"
          @click="移步中 = !移步中"
        >@</button>
      </div>

      <!-- 图例只对平面图那两层成立: 「你在这」要认得出你在哪, 「点得进去」要有能钻的。
           房间明细层两样都不成立, 挂着就是一块说不到任何东西的说明。 -->
      <p v-if="当前平面 && 栈.length > 1" class="图__例">
        <span><i class="图__标 is-我" />你在这</span>
        <span><i class="图__标 is-钻" />点得进去</span>
      </p>
    </div>

    <!-- 说明。老卡用 `UI.showModal('区域情报: ' + name, desc)`, 这里做成贴着底的一条 ——
         盖住整屏的弹窗会把地图本身挡掉, 而看说明的时候你多半正想对着地图看它在哪。 -->
    <div v-if="说明" class="图__情报">
      <div class="图__情报头">
        <span class="图__情报名">{{ 说明.名 }}</span>
        <button class="图__情报闭" aria-label="关上" @click="说明 = null">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>
      <p class="图__情报文">{{ 说明.说 }}</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { 世界地图, 白塔地图, 房间明细, type 格 as 格型 } from '../../地图/数据';
import { 世界图, 塔内图, type 块, type 平面 } from '../../地图/平面图';
import { 是不是这格 } from '../../地图/认出';
import { useDataStore } from '../共用/数据';
import WorldAtlas from './WorldAtlas.vue';

const props = withDefaults(defineProps<{ 只读?: boolean; 避让?: number }>(), { 只读: false, 避让: 0 });
const emit = defineEmits<{ 关: []; 入塔: [] }>();

/**
 * 存档。
 *
 * **`computed` 这一层不能省**, 也别照 白塔/App.vue 那样直接 `useDataStore().data`。
 * 两个理由, 第二个是会静默出错的那个:
 *
 *   1. `defineMvuDataStore` 类型上写着 `{ data: Ref<...> }`, 但 pinia 的 store 是
 *      `reactive` 对象 —— 取 `.data` 时 vue 已经把 ref 拆掉了, 拿到的是里面那个对象。
 *      直接接住它再写 `.value`, 运行时 `数据.value` 是 `undefined`, 一读就抛
 *      「Cannot read properties of undefined」。类型层面看不出来。
 *   2. store 每 2 秒轮询一次酒馆变量, 发现对不上就 `data.value = 新对象` —— **换的是
 *      对象本身**。直接接住旧对象的话, 它从此就是个死的快照: 这一页要**写**变量,
 *      写进死快照里不会有人收, 而且不报错。走 `computed(() => store.data)` 才每次都
 *      拿到当前那个。
 */
const store = useDataStore();
const 数据 = computed(() => store.data);

/** 一屏。平面图和房间明细是两个形状, 用 `格` / `间` 哪个在来分。 */
type 屏 =
  | { 名: string; 格: ReadonlyArray<格型 | null>; 纸: 平面; 说?: undefined; 间?: undefined }
  | { 名: string; 间: ReadonlyArray<{ id: string; 名: string; 说: string }>; 说?: string; 格?: undefined; 纸?: undefined };

/** 面包屑 = 这个栈的名字摞起来。栈底永远是世界地图。 */
const 栈 = ref<屏[]>([{ ...世界地图, 纸: 世界图 }]);
const 当前屏 = computed(() => 栈.value[栈.value.length - 1]);
/** 房间明细是单列排的, 平面图那块是另一套画法。 */
const 单列 = computed(() => !!当前屏.value.间);
/** 房间明细没有 `键`, 认不出「你在这」, 也就不该给移步。 */
const 能移步 = computed(() => !单列.value);
/** 这一屏的图纸。跟屏一起走 —— 换屏的时候不会有人忘了换纸。 */
const 当前平面 = computed(() => 当前屏.value.纸);

/** 这一屏上真正有内容的格子(去掉空槽)。九宫格那边靠空槽看方位, 平面图不需要。 */
const 有格的 = computed(() => (当前屏.value.格 ?? []).filter((格): 格 is 格型 => !!格));

const 说明 = ref<{ 名: string; 说: string } | null>(null);
const 移步中 = ref(false);

/** 存档里现在写着你在哪, 比如「白塔·任务大厅」。 */
const 我在 = computed(() => String(数据.value.世界.地点 ?? ''));

/** 这一格是不是你脚下那格。判据在 地图/认出.ts —— 它有测试, 这边只用。 */
function 就是这(格: 格型) {
  return 是不是这格(格, 我在.value);
}

/** 你脚下那格自己。平面图上一次只画一个「@」, 所以取第一个就够。 */
const 我格 = computed(() => 有格的.value.find(格 => 就是这(格)) ?? null);

/** 「@」贴在那一间的右上角 —— 飘到外面就指不清是哪一间了。 */
const 我标位 = computed(() => {
  const 格 = 我格.value;
  const 纸 = 当前平面.value;
  if (!格 || !纸) return {};
  const b = 纸.位[格.id];
  return { left: `${b.x + b.w}%`, top: `${b.y}%`, transform: 'translate(-100%, 14%)' };
});

/** 百分比位置 → 内联样式。图纸上每一块地方都走这一个函数。 */
const 画 = (b: 块 | { x: number; y: number; w: number; h: number }) => ({
  left: `${b.x}%`,
  top: `${b.y}%`,
  width: `${b.w}%`,
  height: `${b.h}%`,
});

/**
 * 这一格用哪种填充纹理。
 *
 * 坐标表里没有这一格就是 undefined —— 那种情况下这间房根本画不出来, 而且**不报错**。
 * 所以 `平面图.test.mjs` 拿断言把「图上每一格都有坐标」钉住了, 这里不再兜。
 */
function 位(格: 格型): 块 {
  return 当前平面.value!.位[格.id];
}

function 房样(格: 格型) {
  return `is-样-${位(格).样 ?? '木'}`;
}

function 点格(格: 格型) {
  if (移步中.value) {
    移步到(格);
    return;
  }

  // 有下层的先钻石层。**说明不丢** —— 钻进去以后按「← 返回上层」, 回来还在这一屏。
  if (格.可钻) {
    if (格.id === 'tower') {
      if (props.只读) { emit('入塔'); return; }
      栈.value.push({ ...白塔地图, 纸: 塔内图 });
      说明.value = null;
      return;
    }
    const 间 = 房间明细[格.id];
    if (间) {
      // 把设施自己那句 `说` 一起带进下一屏 —— 就是上面模板里那个 `.图__区说`。
      栈.value.push({ 名: 格.名, 说: 格.说, 间 });
      说明.value = null;
      return;
    }
  }

  if (格.说) 说明.value = { 名: 格.名, 说: 格.说 };
}
function 世界选点(id: string) { const 格 = 有格的.value.find(格 => 格.id === id); if (格) 点格(格); }

/**
 * 把玩家挪到某格 —— **会写进存档的 `世界.地点`**。
 *
 * 老卡那张图只读不写: 地图永远照 AI 说的画, 玩家在图上动弹不得。这一版让玩家能改,
 * 而且改的是**同一个变量 AI 在读的那个** —— 所以下次 AI 生成时会看见你在哪, 而不是
 * 你看着地图上的一个假位置。
 *
 * 写 `格.写 ?? 格.名` 而不是一律写 `格.名`: 高亮是拿存档去 `includes` 每一格的
 * `键`, 而「维护站」这格的 `键` 是「抑制器」—— 直接写「维护站」进去, 下一次刷新
 * 这格就不亮了, 而且不报错, 看起来只是「高亮时灵时不灵」。见 数据.ts 的 `写`。
 */
function 移步到(格: 格型) {
  if (props.只读) return;
  数据.value.世界.地点 = 格.写 ?? 格.名;
  移步中.value = false;
}

// 换屏时把说明收掉。不收的话, 退回来底下还挂着刚才那格(或它下层某间)的说明,
// 和眼前这屏对不上, 看起来像是「这一层的某个房间」。
function 退回() {
  if (栈.value.length > 1) 栈.value.pop();
  else emit('关');
  说明.value = null;
}
</script>

<style scoped>
/* 铺满整屏、盖住导航和底栏。数值照 主界面/App.vue 里 `.史` 那一套抄的 ——
   同一个层级的东西不一致的话, 两个浮层叠起来会有一层莫名其妙地压不住另一层。 */
.图 {
  box-sizing: border-box;
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: #141c18;
  color: #e5d8b8;
}

.图__顶 {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.图__回 {
  flex: none;
  padding: 4px 8px;
  border: 1px solid rgba(203, 183, 128, 0.25);
  border-radius: 5px;
  background: rgba(203, 183, 128, 0.08);
  color: #cbb780;
  font-size: 0.82em;
  cursor: pointer;
  /* 藏起来用 opacity + 不可点, 不用 v-if —— 见模板顶上那段注释。 */
  opacity: 0;
  pointer-events: none;

  &.is-见 {
    opacity: 1;
    pointer-events: auto;
  }
}

.图__径 {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #b8baa4;
  font-size: 0.82em;
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.图__步 {
  flex: none;
  padding: 4px 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 5px;
  background: none;
  color: #a6ab91;
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 0.82em;
  cursor: pointer;

  &.is-开 {
    border-color: rgba(203, 183, 128, 0.45);
    background: rgba(203, 183, 128, 0.12);
    color: #cbb780;
  }
}

.图__闭 {
  flex: none;
  padding: 4px 6px;
  border: 0;
  background: none;
  color: #a6ab91;
  font-size: 1em;
  cursor: pointer;
}

/* 图纸外面这层管滚动。窄屏时纸有 min-width, 横着滚, 而不是把房间名压成一列 ——
   参考图是横的, 竖过来这张图就不成图了。 */
.图__体 {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 12px;
}

.图__体.is-世界 { display: flex; flex-direction: column; overflow: hidden; }
.图__体.is-世界 > .world-atlas { flex: 1; min-height: 0; }

.图__提 {
  margin: 0 0 10px;
  padding: 6px 10px;
  border-left: 2px solid #cbb780;
  background: rgba(203, 183, 128, 0.07);
  color: #cbb780;
  font-size: 0.84em;
}

/* ---------------------------------------------------------------- 平面图 */

/* 纸。底是交叉格纹 —— 参考图里房间外面那一片。
   `container-type: inline-size` 让底下那些 cqw 字号跟着**纸的宽度**缩放: 纸宽
   560px 时房间名 10px, 纸宽 900px 时 15px。用 vw 是不行的 —— 这张图不一定占满
   视口, 而且酒馆里它还被塞在 iframe 里。 */
.图__纸 {
  position: relative;
  width: 100%;
  min-width: 560px;
  margin: 0 auto;
  /* 本仓没有全局 box-sizing 复位 (量出来通配就是 content-box)。不写这一行的话,
     那 2px 边框会额外撑出 4px, `.图__体` 就永远挂着一条 4px 的横向滚动条 ——
     宽屏下也是, 看起来只是「底下这条灰杠哪来的」。 */
  box-sizing: border-box;
  container-type: inline-size;
  border: 2px solid #26200f;
  background-color: #0e0d0a;
  background-image:
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 13px),
    repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 13px);
}

/* 区域标。参考图上「城外 / 城内」那种小字, 摆在纸的上下留白里。 */
.图__区标 {
  position: absolute;
  left: 50%;
  color: #6b5b3e;
  font-size: clamp(9px, 1.2cqw, 12px);
  letter-spacing: 0.4em;
  transform: translateX(-50%);
  pointer-events: none;

  &.is-外 { top: 0.8%; }
  &.is-内 { bottom: 0.8%; }
}

/* 底纹上的花和水池。 */
.图__饰 {
  position: absolute;
  font-style: normal;
  line-height: 1;
  transform: translate(-50%, -50%);
  pointer-events: none;

  &.is-花 {
    width: clamp(4px, 0.55cqw, 7px);
    height: clamp(4px, 0.55cqw, 7px);
    border-radius: 50%;
    background: #b8557a;
    box-shadow: 0 0 0 2px rgba(184, 85, 122, 0.18);
  }

  /* 水池。参考图里那口湯殿也是深色带纹的一小块。 */
  &.is-水 {
    width: clamp(16px, 2.6cqw, 34px);
    height: clamp(10px, 1.6cqw, 21px);
    border: 1px solid rgba(56, 130, 160, 0.5);
    background: repeating-linear-gradient(
      135deg,
      rgba(56, 130, 160, 0.3) 0 2px,
      rgba(20, 50, 70, 0.5) 2px 5px
    );
  }

  /* 树 —— 就当是那几片林子。 */
  &.is-木 {
    width: clamp(5px, 0.7cqw, 9px);
    height: clamp(5px, 0.7cqw, 9px);
    border-radius: 2px;
    background: #2f5137;
  }
}

/* 走廊。铺和房间一样的板条纹理, 深一档。 */
.图__廊 {
  position: absolute;
  border-top: 1px solid #1c160c;
  border-bottom: 1px solid #05040200;
  background-color: #0b0906;
  background-image: repeating-linear-gradient(
    0deg,
    rgba(140, 110, 70, 0.32) 0 2px,
    rgba(0, 0, 0, 0.3) 2px 4px
  );
  pointer-events: none;
}

/* 一间房。四边有厚边(像参考图那圈墙), 里面按 `样` 铺一种纹理。 */
.图__房 {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
  padding: 3px;
  border: 2px solid #3b2f1c;
  border-radius: 1px;
  color: #cbd5e1;
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, filter 0.2s;

  /* 木: 深色板条。 */
  &.is-样-木 {
    background-color: #1b1409;
    background-image: repeating-linear-gradient(
      0deg,
      rgba(214, 178, 118, 0.13) 0 1px,
      transparent 1px 8px
    );
  }

  /* 石: 灰砖, 横缝密、竖缝疏。 */
  &.is-样-石 {
    border-color: #3a3a36;
    background-color: #15171a;
    background-image:
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.075) 0 1px, transparent 1px 9px),
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 15px);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
    filter: brightness(1.35);
  }

  &:active {
    filter: brightness(0.9);
  }

  /* 深渊 —— 全图唯一「别靠近」的地方。世界书写它是封锁/污染, 得看得出来。
     颜色写在下面的 `.图__房名` 那几条上, 不写在这儿 —— 写在这儿只有边框生效,
     文字那半是**死的**(子元素自己写着 color, 继承会被它盖掉)。 */
  &.is-abyss {
    border-color: rgba(180, 60, 60, 0.55);
  }

  /* 白塔 —— 这张图的中心, 也是这局游戏的主场。 */
  &.is-tower {
    border-color: rgba(200, 150, 60, 0.6);
  }

  /* 你脚下这一间。**青色**, 玩家点名要的 —— 参考图里也是把当前所在那间染成青的。
     老卡用的是蓝 #aab996, 和「点得进去」那类提示色在一屏深色格子里几乎分不出来。

     这里只画框; 房名转青在下面 `.图__房名` 那一串里, 而且排在最后 —— 站在白塔里
     的话 is-tower 和 is-我 同时成立, 得让青色赢。 */
  &.is-我 {
    border-color: rgba(203, 183, 128, 0.75);
    box-shadow: inset 0 0 0 1px rgba(203, 183, 128, 0.25), 0 0 10px rgba(203, 183, 128, 0.18);
  }

  /* 移步模式下能去的每一间描一圈虚线。
     用 outline 而不是 border-color: outline 不参与 border 的层叠, 所以不管特异度
     怎么排都偷不走 `.is-我` 那圈青框 —— 而青框正是「你在这」唯一的信号。 */
  .图__体.is-移步 & {
    outline: 1px dashed rgba(203, 183, 128, 0.38);
    outline-offset: 1px;
  }

  /* 参考图上每间房的角上有两个「门」的小方块。点得进去的才有。 */
  &.is-钻::before,
  &.is-钻::after {
    content: '';
    position: absolute;
    width: clamp(3px, 0.42cqw, 5px);
    height: clamp(3px, 0.42cqw, 5px);
    background: rgba(214, 178, 118, 0.45);
  }

  &.is-钻::before { top: 2px; left: 2px; }
  &.is-钻::after { right: 2px; bottom: 2px; }
}

/* 房名和房副的颜色都在这儿定, 不靠继承 —— 它们各自写着 color, 继承进来的看不见。
   顺序就是优先级: 白塔金 → 深渊红 → **你在这青色**(最高, 站在白塔里时得让青赢)。 */
.图__房名 {
  color: #cbd5e1;
  font-size: clamp(10px, 1.7cqw, 16px);
  font-weight: 600;
  line-height: 1.2;
}

.图__房.is-tower .图__房名 { color: #fcd34d; }
.图__房.is-abyss .图__房名 { color: #fca5a5; }
.图__房.is-我 .图__房名 { color: #67e8f9; }

.图__房副 {
  color: #7c8899;
  font-size: clamp(8px, 1.15cqw, 11px);
  line-height: 1.2;
}

/* 「@」。贴在你那一间的右上角。 */
.图__我 {
  position: absolute;
  padding: 0 clamp(4px, 0.5cqw, 7px);
  border: 1px solid rgba(203, 183, 128, 0.5);
  border-radius: 3px;
  background: rgba(203, 183, 128, 0.16);
  color: #cbb780;
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: clamp(9px, 1.15cqw, 13px);
  font-weight: 700;
  line-height: 1.6;
  cursor: pointer;

  &.is-选 {
    animation: 图闪 1.1s ease-in-out infinite;
  }
}

@keyframes 图闪 {
  50% { opacity: 0.25; }
}

.图__例 {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 12px 0 0;
  color: #64748b;
  font-size: 0.7em;
}

.图__标 {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 4px;
  border-radius: 50%;
  vertical-align: middle;

  &.is-我 { background: #cbb780; }
  &.is-钻 { background: #8a6d3b; }
}

/* ---------------------------------------------------------------- 房间明细 */

/* 钻进设施之后顶上那句 —— 这个设施自己的说明, 来自上一层那格。 */
.图__区说 {
  margin: 0 0 10px;
  padding: 7px 10px;
  border-left: 2px solid rgba(200, 150, 60, 0.4);
  background: rgba(200, 150, 60, 0.05);
  color: #cbd5e1;
  font-size: 0.84em;
  line-height: 1.6;
}

.图__间列 {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 房间一行。名字在左、说明在右地排 —— 竖着摞的话一间就占三行, 五间要滚两屏,
   而这一屏的全部意义就是「一眼看完这栋楼有几间、分别干嘛」。 */
.图__间 {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 5px;
  background-color: #101418;
  background-image: repeating-linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.02) 0 1px,
    transparent 1px 5px
  );
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
}

.图__间名 {
  flex: none;
  color: #cbd5e1;
  font-size: 0.84em;
  font-weight: 600;
}

.图__间说 {
  flex: 1;
  min-width: 0;
  color: #64748b;
  font-size: 0.76em;
  line-height: 1.5;
}

/* ---------------------------------------------------------------- 说明条 */

.图__情报 {
  flex: none;
  padding: 10px 14px 14px;
  border-top: 1px solid rgba(203, 183, 128, 0.2);
  background: #0d1218;
}

.图__情报头 {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.图__情报名 {
  color: #67e8f9;
  font-size: 0.9em;
  font-weight: 600;
}

.图__情报闭 {
  padding: 0 4px;
  border: 0;
  background: none;
  color: #a6ab91;
  cursor: pointer;
}

.图__情报文 {
  margin: 6px 0 0;
  color: #b8baa4;
  font-size: 0.86em;
  line-height: 1.6;
}
</style>
