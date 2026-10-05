<template>
  <div ref="根元素" class="诊所 界卡">
    <!-- 占卜。**2026-10-05 从世界页搬过来的** —— 玩家说「把天气和塔罗牌什么的
         移到诊所界面」。想一想也确实该在这儿: 塔罗问的是「我今天这一卦怎么样」,
         那跟精神力、名声、在诊人数一样是**诊所这一摊子**的事, 不是「外面在发生
         什么」。世界页那边只留新闻。

         **抽的时候整个面板让给它。** 与 治疗 接管申请页是同一个做法, 也是这里
         唯一站得住的做法: 这张卡在酒馆里是一个跟内容等高的 iframe, 外面套着聊天
         的滚动条。所以「盖一层 absolute inset:0」盖住的是**整张卡**, 内容在卡片
         坐标系里居中就落到了卡片中段 —— 而玩家是在卡片底部点的那颗按钮, 他眼前
         根本没有那一块; `position: fixed` 同理, iframe 不自己滚, 就没有一个可用
         的「视口」让它去定位。
         与其赌玩家的视口落在卡片的哪一段, 不如把那一屏换成正常流里的内容, 再把
         面板滚进视野 (开卜 里那下 scrollIntoView, block: 'nearest')。 -->
    <div v-if="卜开" class="卜层">
      <p class="卜层__提">{{ 牌上 ? '今日之卦' : '今日还没有卦' }}</p>

      <!-- 点一下翻面。抽之前点它 = 抽: 一个动作, 不该让玩家先按「抽」再按
           「翻」。抽过之后点它就只是翻开合上。 -->
      <div class="卜牌" :class="{ 'is-翻': 翻开了, 'is-逆': 今天那卦?.逆位 }" @click="翻开">
        <div class="卜牌__面 卜牌__背"><span class="卜牌__纹">✦</span></div>
        <div class="卜牌__面 卜牌__正">
          <span class="卜牌__号">{{ 牌上?.号 }}</span>
          <span class="卜牌__名">{{ 牌上?.名 }}</span>
          <span v-if="今天那卦?.逆位" class="卜牌__逆">逆位</span>
        </div>
      </div>

      <p v-if="翻开了 && 今天那卦" class="卜层__解">{{ 今天那卦.解读 }}</p>
      <p v-else-if="!可卜" class="卜层__解 卜层__解--空">
        世界书里还没有今天的日期。等这一楼过去，再回来看这一卦。
      </p>
      <p v-else class="卜层__解 卜层__解--空">点一下牌。</p>

      <button class="卜层__关" @click="卜开 = false">收起</button>
    </div>

    <template v-else>
    <header class="诊所__招牌">
      <span class="诊所__名">{{ 数据.诊所.名称 || '未命名的诊所' }}</span>
      <span class="诊所__星">{{ 数据.诊所.等级 }} 级 · {{ 数据.诊所.$称号 }}</span>
    </header>

    <div class="诊所__行">
      <div class="诊所__槽"><i class="is-名声" :style="{ width: `${数据.诊所.名声}%` }" /></div>
      <span class="诊所__值">名声 {{ 数据.诊所.名声 }}</span>
    </div>

    <div class="诊所__行">
      <div class="诊所__槽"><i class="is-精神" :style="{ width: `${精神比}%` }" /></div>
      <span class="诊所__值">精神力 {{ 数据.主角.精神力 }}/{{ 数据.主角.精神力上限 }}</span>
    </div>

    <div class="诊所__条">
      <span>{{ 数据.主角.姓名 || '向导' }}</span>
      <span class="诊所__钱">{{ 数据.主角.金钱 }} 金</span>
      <span class="诊所__设">床位 {{ 在诊数 }}/{{ 床位 }}</span>
    </div>

    <div class="诊所__条">
      <span>气氛 {{ 数据.诊所.气氛 }}</span>
      <span class="诊所__档">{{ 档 }}</span>
      <span v-if="地点" class="诊所__设 诊所__地">◎ {{ 地点 }}</span>
    </div>

    <!-- 世界那一角。诊所页要的是「丰富」不是「变长」(spec §5.2) —— 所以是往已有的
         `条` 里塞, 不是新开一块。老存档里这些字段全是 prefault 出来的空串, 所以
         每一行都判空; 不判的话底下会挂出一条「· · ·」, 比什么都不显示更难看。 -->
    <div v-if="日时" class="诊所__条">
      <span>{{ 日时 }}</span>
      <span v-if="天候" class="诊所__设">{{ 天候 }}</span>
    </div>

    <!-- 占卜入口。**同一天只有一张牌** —— 牌与解读按 世界.日期 定种现算,
         抽完连解读一起存进 世界.占卜, 所以当天翻几次都是同一卦。 -->
    <div class="诊所__卜">
      <button class="诊所__卜钮" :disabled="!可卜" @click="开卜">
        <span class="诊所__卜题">占卜</span>
        <span class="诊所__卜注">{{ 卜注 }}</span>
      </button>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../共用/数据';
import { 在诊人数 } from '../状态栏/结算';
import { 气氛档, 算床位 } from '../../家园/家具';
// 占卜 (2026-10-05 从 世界/App.vue 搬来)。塔罗问的是「我今天这一卦怎么样」,
// 跟精神力/名声/在诊人数是同一摊子事, 所以归诊所页。
import { 找牌, 今天抽过了, 起一卦 } from '../../占卜/塔罗';
// ref / computed / watchEffect / nextTick 走 unplugin-auto-import, 不手写 import。

const store = useDataStore();
const 数据 = computed(() => store.data);

const 精神比 = computed(
  () => (数据.value.主角.精神力 / Math.max(1, 数据.value.主角.精神力上限)) * 100,
);

const 在诊数 = computed(() => 在诊人数(数据.value.哨兵));

/** 床位不再是变量, 是「摆出来的床有几张」(spec §7.1) */
const 床位 = computed(() => 算床位(数据.value.诊所.家具));

/** 气氛的档位描述 (spec §9.3)。气氛本身由 schema 从家具汇总出来 */
const 档 = computed(() => 气氛档(数据.value.诊所.气氛));

/**
 * 用 `·` 把有值的片段连起来, 空的直接不出现。
 *
 * 不能直接 `a + ' · ' + b`: `世界` 这一整套是 2026-10-05 才加的, 老存档里它们是
 * prefault 出来的空串, 直拼会在界面上渲染出「霜降月第一日 ·  · 」这种东西。
 */
const 串 = (...段: string[]) => 段.map(s => (s ?? '').trim()).filter(Boolean).join(' · ');

/**
 * 世界那一角 (spec §5.2)。
 *
 * `时刻` 优先、`时段` 兜底, 而不是两个都显示: 它们是同一件事的两个精度, 并排写会变成
 * 「07:30 · 清晨」这种同义反复。老存档只有 `时段`, 新存档两个都有 —— 这条兜底是给老存档的。
 */
const 时刻 = computed(() => 数据.value.世界.时刻 || 数据.value.世界.时段);
const 日时 = computed(() => 串(数据.value.世界.日期, 数据.value.世界.星期, 时刻.value));
const 天候 = computed(() => 串(数据.value.世界.季节, 数据.value.世界.天气, 数据.value.世界.温度));
const 地点 = computed(() => 数据.value.世界.地点);

// ── 占卜 ────────────────────────────────────────────────────────────
// 逻辑逐字从 世界/App.vue 搬来, 只有类名换了前缀 (世界__卜* → 诊所__卜*)。

const 根元素 = ref<HTMLElement | null>(null);
const 卜开 = ref(false);
const 翻开了 = ref(false);

/** 今天这一卦。日期对不上就等于没抽过 —— 跨天了自然翻篇, 不需要谁去清理。 */
const 今天那卦 = computed<卦 | null>(() =>
  今天抽过了(数据.value.世界.占卜, 数据.value.世界.日期) ? 数据.value.世界.占卜 : null,
);

/** 牌堆里那一张。牌名认不出时给 undefined —— schema 已经把那种卦清空了, 这里是双保险。 */
const 牌上 = computed(() => (今天那卦.value ? 找牌(今天那卦.value.牌) : undefined));

/**
 * 起不起得了卦。
 *
 * `世界.日期` 空着就不让抽: 「今天」这个概念是那一卦的全部依据, 没有日期时
 * 抽出来的牌第二天还是它, 而且 `已抽于` 存成空串之后 今天抽过了 永远为假 ——
 * 玩家会看到一个「抽了等于没抽」的按钮。
 */
const 可卜 = computed(() => !!数据.value.世界.日期.trim());

const 卜注 = computed(() => {
  if (!可卜.value) return '世界书里还没有今天的日期';
  return 今天那卦.value ? '今日已得' : '看看今天的卦';
});

function 开卜() {
  卜开.value = true;
  // 重开时把翻面重置回牌背。已经抽过的人再进来, 也得自己再点一下才看得到牌 ——
  // 一进来就是正面的话, 那个「翻」的动作就没有了, 而占卜的分量有一半在那一下。
  翻开了.value = false;
  // 面板从一屏缩成一卦, 卡片底下的东西会往上收。`block: 'nearest'` 只在面板
  // 已经跑出视野时才滚, 而且滚最小的一段 —— 它够得着的时候什么都不做, 所以
  // 桌面宽屏上不会有那一下跳动。
  void nextTick(() => 根元素.value?.scrollIntoView({ block: 'nearest' }));
}

function 抽() {
  const 卦 = 起一卦(数据.value.世界.日期, {
    精神力: 数据.value.主角.精神力,
    精神力上限: 数据.value.主角.精神力上限,
    名声: 数据.value.诊所.名声,
    等级: 数据.value.诊所.等级,
    在诊: 在诊数.value,
    // **这里不是照抄。** 世界页原来传的是 `数据.value.诊所.床位`, 而那个字段早就
    // 随「床位改成派生值」一起从 schema 里删掉了 (spec §7.1) —— 也就是说它一直
    // 传的是 undefined, 解读里那句「床位」从来没算对过。诊所页现成有算床位 的
    // computed, 用它。搬功能时顺手把搬来的 bug 修掉, 比原样搬过来更有交代。
    床位: 床位.value,
  });
  if (!卦) {
    toastr.warning('世界书里还没有今天的日期，起不了卦', '占不了');
    return;
  }
  // 整个对象一次写回, 四个字段一起来 —— 分四次写的话中间那几拍 store 会读到
  // 「有牌名但没解读」的半截状态, 界面上会闪一下空牌。
  数据.value.世界.占卜 = 卦;
  翻开了.value = true;
}

function 翻开() {
  // 还没抽就点牌: 那一下就是「抽」。抽过再点只是翻面。
  if (!今天那卦.value) {
    if (可卜.value) 抽();
    return;
  }
  翻开了.value = !翻开了.value;
}
</script>

<style lang="scss" scoped>
/* 外壳(底色/圆角/阴影)在 global.css 的 .界卡 上, 三个块共用。
   这里只管诊所块自己的排版。 */
.诊所 {
  &__招牌 {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 9px;
  }

  &__名 {
    color: #eef3f8;
    font-weight: 600;
    font-size: 1.06em;
    letter-spacing: 0.03em;
  }

  &__星 {
    color: #7fe3ff;
    font-size: 0.82em;
    white-space: nowrap;
  }

  &__行 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }

  &__槽 {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.07);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: 3px;
      transition: width 0.45s ease;

      &.is-名声 {
        background: linear-gradient(90deg, #4a7fa5, #7fe3ff);
      }

      &.is-精神 {
        background: linear-gradient(90deg, #6b5fa8, #b39ddb);
      }
    }
  }

  &__值 {
    color: #7d8896;
    font-size: 0.8em;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__条 {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin: 8px 0 2px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    color: #9aa5b1;
    font-size: 0.85em;
  }

  &__钱 {
    color: #ffd76e;
  }

  &__档 {
    color: #7fd6a0;
  }

  &__设 {
    color: #6f7a87;
    margin-left: auto;
  }

  /* 地点比别的「设」重要一点: 它是这一页唯一告诉玩家「我现在在哪」的字。
     但也不能亮到抢名声/精神力那两条 —— 所以只提一档灰。 */
  &__地 {
    color: #8c98a6;
  }

  /* ── 占卜入口 ──────────────────────────────────────────────────
     紫色系, 跟诊所页的蓝(名声/精神力)拉开 —— 它是这一页唯一的「非数据」
     动作, 长得不一样是对的。 */
  &__卜 {
    margin-top: 14px;
  }

  &__卜钮 {
    width: 100%;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 8px;
    border: 1px solid rgba(198, 168, 255, 0.3);
    background: linear-gradient(180deg, rgba(198, 168, 255, 0.13), rgba(198, 168, 255, 0.05));
    color: #d9c9ff;
    font-family: inherit;
    cursor: pointer;

    &:disabled {
      opacity: 0.45;
      cursor: default;
      border-color: rgba(255, 255, 255, 0.09);
      color: #6f7a87;
    }
  }

  &__卜题 {
    font-size: 0.94em;
    letter-spacing: 0.18em;
  }

  &__卜注 {
    font-size: 0.74em;
    opacity: 0.7;
  }
}

/* ── 占卜 ────────────────────────────────────────────────────────
   下面这一整段 (接管层 + 翻牌) 是 2026-10-05 从 世界/App.vue 整段搬来的,
   只改了外层类名的前缀。留着原来那些注释 —— 每一条都是被真实故障咬出来的。

   翻牌用的是 3D transform 而不是换两张图: 一句 transform 就有真正的翻面,
   而且牌背牌面都留在 DOM 里, 翻到一半也看得见两面的交界。

   `.卜牌__面` 必须 backface-visibility: hidden —— 少了它, 背面那层会透过
   正面显出来, 牌面上就是「愚者」和「✦」叠在一起。 */

/* 占卜接管整个面板时的那一屏。**不是浮层** —— 它就在正常流里, 顶掉诊所
   那几行 (见模板顶上的注释: 卡片是等高的 iframe, 卡片坐标系里没有「视口」
   这个概念, 浮层的内容会落在玩家看不见的地方)。

   底色就用 .界卡 自己的深色, 不再叠一层: 既然那一屏只有牌和解读,
   就没有「别让玩家看见下面」这件事要做。 */
.卜层 {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 10px 0 4px;
  min-height: 320px;
  justify-content: center;

  &__提 {
    margin: 0;
    font-size: 0.78em;
    letter-spacing: 0.24em;
    color: #9aa5b1;
  }

  &__解 {
    margin: 0;
    font-family: Georgia, 'Songti SC', 'SimSun', 'Noto Serif CJK SC', serif;
    font-size: 0.86em;
    line-height: 1.85;
    color: #ded4c4;
    text-align: justify;

    &--空 {
      color: #7b848f;
      text-align: center;
    }
  }

  &__关 {
    padding: 8px 18px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 7px;
    background: transparent;
    color: #9aa5b1;
    font-family: inherit;
    font-size: 0.82em;
    cursor: pointer;
  }
}

.卜牌 {
  position: relative;
  width: 128px;
  height: 208px;
  cursor: pointer;
  perspective: 900px;
  transition: transform 0.25s ease;

  &:active {
    transform: scale(0.98);
  }

  &__面 {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 9px;
    backface-visibility: hidden;
    transition: transform 0.62s cubic-bezier(0.4, 0.1, 0.2, 1);
  }

  &__背 {
    border: 1px solid rgba(198, 168, 255, 0.35);
    background:
      repeating-linear-gradient(45deg, rgba(198, 168, 255, 0.09) 0 5px, transparent 5px 10px),
      linear-gradient(160deg, #1d2333, #131824);
  }

  &__纹 {
    font-size: 1.7em;
    color: rgba(198, 168, 255, 0.6);
  }

  &__正 {
    transform: rotateY(180deg);
    border: 1px solid rgba(214, 190, 140, 0.42);
    background: linear-gradient(165deg, #f0e7d6, #ddd0b6);
    color: #2b2620;
    font-family: Georgia, 'Songti SC', 'SimSun', 'Noto Serif CJK SC', serif;
  }

  &__号 {
    font-size: 0.78em;
    letter-spacing: 0.12em;
    opacity: 0.62;
  }

  &__名 {
    font-size: 1.32em;
    letter-spacing: 0.1em;
  }

  &__逆 {
    margin-top: 2px;
    padding: 1px 7px;
    border: 1px solid rgba(150, 60, 60, 0.4);
    border-radius: 999px;
    font-size: 0.66em;
    letter-spacing: 0.16em;
    color: #8c3b3b;
  }

  /* 翻面。**两个面各写各的终点角, 不能合成一条 `.卜牌__面` 的规则** ——
     正面本来就起始于 180deg (见上面的 `&__正`), 一条通吃的 rotateY(180deg)
     会把它按在 180deg 不动, 于是翻完之后两个面**都**背朝外、都进了
     backface-visibility 的黑洞, 牌整个消失 (解读文字还在, 所以看起来只像
     「牌没画出来」)。正面要转到 360deg, 从 180 一路转过去, 动画是连的。

     逆位时正面再倒过来 180° —— 那是塔罗里「逆位」的字面意思, 比旁边那行
     「逆位」两个字更早被眼睛认出来 (那行也留着, 给不认识塔罗的人看)。

     `perspective` 挂在 .卜牌 上、`backface-visibility` 挂在面上: 反过来放
     的话每个面各自算透视, 翻起来像两张纸片各转各的, 不像一张牌在翻。 */
  &.is-翻 .卜牌__背 {
    transform: rotateY(180deg);
  }

  &.is-翻 .卜牌__正 {
    transform: rotateY(360deg);
  }

  &.is-翻.is-逆 .卜牌__正 {
    transform: rotateY(360deg) rotate(180deg);
  }
}
</style>
