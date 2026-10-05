<template>
  <div ref="根元素" class="世界 界卡">
    <!-- ④ 占卜 (spec §6.1 第 3 项, §7)。**抽的时候整个面板让给它。**
         与 治疗 接管申请页是同一个做法, 也是这里唯一站得住的做法:
         这张卡在酒馆里是一个跟内容等高的 iframe, 外面套着聊天的滚动条。
         所以「盖一层 absolute inset:0」盖住的是**整张卡**(1300px 高), 内容
         在卡片坐标系里居中就落到了卡片中段 —— 而玩家是在卡片底部点的那颗
         按钮, 他眼前根本没有那一块; `position: fixed` 同理, iframe 不自己滚,
         就没有一个可用的「视口」让它去定位。
         与其赌玩家的视口落在卡片的哪一段, 不如把那一屏换成正常流里的内容,
         再把面板滚进视野 (开卜 里那下 scrollIntoView, block: 'nearest')。
         代价是卡片从 1300px 缩到 350px —— 治疗接管申请页时也是这样, 这一路
         在真机上是验过的。 -->
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
    <!-- ① 世界一角。诊所页那一行是「我现在在哪」, 这一块是「外面在发生什么」——
         所以它多出来的只有 `世界主线` 与 `近期事件` 两样, 其余照抄诊所页的写法。 -->
    <div class="世界__角">
      <div class="世界__条">
        <span>{{ 日时 || '——' }}</span>
        <span v-if="天候" class="世界__天候">{{ 天候 }}</span>
      </div>
      <p v-if="主线" class="世界__主线">{{ 主线 }}</p>

      <!-- 平行发生的事。**不要写成主角的功绩簿** —— 它存在的意义就是让玩家看见
           世界不围着主角转 (spec §2.1, 变量更新规则里对 AI 也是这么写的)。 -->
      <ul v-if="事件.length" class="世界__事件">
        <li v-for="(件, 序) in 事件" :key="序">
          <span class="世界__事件名">{{ 件.名称 }}</span>
          <span v-if="件.状态" class="世界__事件态">{{ 件.状态 }}</span>
          <span v-if="件.说明" class="世界__事件说">{{ 件.说明 }}</span>
        </li>
      </ul>
    </div>

    <!-- ② 《白塔日报》。
         整份报纸是**现算**的 (报纸/装配.ts): 定种键是 世界.日期, 所以同一天刷新
         多少次都是同一份, 跨天才换。一份变量都不存, 一个 token 都不花。 -->
    <div class="世界__报">
      <header class="世界__报头">
        <span class="世界__报名">白塔日报</span>
        <span class="世界__报日">{{ 期.日期 || '——' }}</span>
      </header>

      <section v-for="版 in 期.版" :key="版.版面" class="世界__版">
        <h4 class="世界__版名">{{ 版面名[版.版面] }}</h4>
        <article
          v-for="(条, 序) in 版.条"
          :key="序"
          class="世界__闻"
          :class="{ 'is-投稿': 条.来源 === '投稿' }"
        >
          <h5 class="世界__题">
            {{ 条.标题 }}
            <span v-if="条.来源 === '投稿'" class="世界__印">你投的</span>
          </h5>
          <p class="世界__文">{{ 条.正文 }}</p>
          <p v-if="条.署名" class="世界__署">—— {{ 条.署名 }}</p>
        </article>
      </section>

      <!-- 往期。当期的已经嵌在上面各版里了, 这里只收过期的 —— 玩家掏过钱的稿子
           不该登完就消失。默认折着: 它是备查, 不是今天的报纸。 -->
      <details v-if="往期.length" class="世界__往">
        <summary class="世界__往头">往期投稿 · {{ 往期.length }} 则</summary>
        <div class="世界__往体">
          <div v-for="(稿, 序) in 往期" :key="序" class="世界__往条">
            <span class="世界__往日">{{ 稿.日期 }}</span>
            <span class="世界__往名">{{ 稿.标题 }}</span>
          </div>
        </div>
      </details>
    </div>

    <!-- ③ 投稿。**一律花钱, 没有免费版面** (spec §2.3) —— 这是玩家跟这个世界
         唯一一次「花钱买曝光」的交互, 也是名声除了看病之外唯一的来路。 -->
    <div class="世界__投稿">
      <!-- 一期只登一则。「报纸一天就印一次」这件事在界面上也得是真的, 不然玩家
           会以为自己花的钱没生效。 -->
      <p v-if="今投过" class="世界__投过">
        今天的报纸已经印好了。明天再投吧。
      </p>

      <details v-else class="世界__折">
        <summary class="世界__折头">
          <span class="世界__折名">投稿 · 买一块版面</span>
          <span class="世界__折价">最低 {{ 算版面费('广告', 等级) }} 金</span>
        </summary>

        <div class="世界__折体">
          <div class="世界__版们">
            <button
              v-for="项 in 投稿版面次序"
              :key="项"
              class="世界__版钮"
              :class="{ 'is-选': 版面 === 项 }"
              @click="版面 = 项"
            >
              <span>{{ 项 }}</span>
              <span class="世界__版价">{{ 算版面费(项, 等级) }}</span>
            </button>
          </div>

          <p class="世界__提">
            落在<b>{{ 版面名[落在哪版[版面]] }}</b>版 · {{ 版面说明[版面] }}
          </p>

          <input v-model="题" class="世界__入" maxlength="24" placeholder="标题" />
          <textarea
            v-model="文"
            class="世界__入 世界__区"
            rows="3"
            maxlength="180"
            placeholder="写点什么。想登什么就写什么，不必替诊所说话。"
          />
          <input v-model="署" class="世界__入" maxlength="12" placeholder="署名" />

          <div class="世界__交行">
            <button class="世界__交" :disabled="!买得起" @click="提交">
              付 {{ 价 }} 金登报
            </button>
            <span v-if="!买得起" class="世界__拦">
              只有 {{ 数据.主角.金钱 }} 金，还差 {{ 价 - 数据.主角.金钱 }}
            </span>
          </div>
        </div>
      </details>
    </div>

    <!-- ④ 占卜入口。**同一天只有一张牌** —— 牌与解读按 世界.日期 定种现算,
         抽完连解读一起存进 世界.占卜, 所以当天翻几次都是同一卦。 -->
    <div class="世界__卜">
      <button class="世界__卜钮" :disabled="!可卜" @click="开卜">
        <span class="世界__卜题">占卜</span>
        <span class="世界__卜注">{{ 卜注 }}</span>
      </button>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../共用/数据';
import { 出一期, 今天投过 } from '../../报纸/装配';
// 版面名 住在 池子.ts (它描述的是报纸有哪几版), 投稿.ts 只管买版面这件事 ——
// 两边都叫「版面」但一个是报纸的, 一个是价目表的。归错文件的话 ts-loader 的
// transpileOnly 不会报错, 只会在渲染时拿到 undefined, 整个面板变成 <!---->。
import { 版面名 } from '../../报纸/池子';
import {
  投稿版面次序,
  算版面费,
  落在哪版,
  版面说明,
  宣传名声,
  拦下,
  type 投稿版面,
} from '../../报纸/投稿';
import { 加名声 } from '../../等级';
// nextTick / ref / computed 走 unplugin-auto-import, 不手写 import ——
// 与 主界面/App.vue 一致。
import { 找牌, 今天抽过了, 起一卦 } from '../../占卜/塔罗';

const store = useDataStore();
const 数据 = computed(() => store.data);

const 等级 = computed(() => 数据.value.诊所.等级);

/** 用 `·` 把有值的片段连起来, 空的直接不出现。老存档里这一整层都是 prefault 出来的空串。 */
const 串 = (...段: string[]) => 段.map(s => (s ?? '').trim()).filter(Boolean).join(' · ');

const 日时 = computed(() => 串(数据.value.世界.日期, 数据.value.世界.星期, 数据.value.世界.时刻 || 数据.value.世界.时段));
const 天候 = computed(() => 串(数据.value.世界.季节, 数据.value.世界.天气, 数据.value.世界.温度));
const 主线 = computed(() => 数据.value.世界.世界主线);
const 事件 = computed(() => 数据.value.世界.近期事件.filter(件 => 件.名称 || 件.说明));

/**
 * 今天这一期。
 *
 * 三个入参都是响应式的, 所以 AI 改了天气、玩家投了稿, 报纸当场就跟着变 ——
 * 不需要任何「刷新报纸」的动作, 也不需要把报纸本身存进变量。
 */
const 期 = computed(() =>
  出一期(
    {
      日期: 数据.value.世界.日期,
      季节: 数据.value.世界.季节,
      天气: 数据.value.世界.天气,
      温度: 数据.value.世界.温度,
    },
    数据.value.世界.报纸供稿,
    数据.value.世界.报纸投稿,
  ),
);

/** 往期投稿。当期的已经嵌在版面里了, 这里只留过期的, 新的排前面。 */
const 往期 = computed(() =>
  数据.value.世界.报纸投稿.filter(稿 => 稿.日期 !== 数据.value.世界.日期).slice().reverse(),
);

const 今投过 = computed(() => 今天投过(数据.value.世界.报纸投稿, 数据.value.世界.日期));

// ── 投稿表单 ────────────────────────────────────────────────────────

const 版面 = ref<投稿版面>('宣传');
const 题 = ref('');
const 文 = ref('');
const 署 = ref('');

// 署名默认是主角自己的名字。用一个 watch 播种而不是 ref 初值: store 是异步跟着
// 最新一楼走的, 组件挂载那一刻 主角.姓名 很可能还是空的, 写进 ref 初值就再也补不上了。
watchEffect(() => {
  if (!署.value) 署.value = 数据.value.主角.姓名 ?? '';
});

const 价 = computed(() => 算版面费(版面.value, 等级.value));
const 买得起 = computed(() => 数据.value.主角.金钱 >= 价.value);

function 提交() {
  // 判据和按钮的 disabled 是**两回事**: disabled 只管住鼠标, 拦不住
  // 「先点开面板、钱花在别处、再回来提交」。所以这里再算一遍。
  const 因 = 拦下(
    {
      金钱: 数据.value.主角.金钱,
      今天投过: 今投过.value,
      标题: 题.value,
      正文: 文.value,
    },
    版面.value,
    等级.value,
  );
  if (因) {
    toastr.warning(因, '登不了');
    return;
  }

  const 花 = 价.value;
  数据.value.主角.金钱 -= 花;
  // 稿子照原样存进去, 连署名一起 —— 界面上要显示「你投的」和是谁写的。
  数据.value.世界.报纸投稿.push({
    日期: 数据.value.世界.日期,
    版面: 版面.value,
    标题: 题.value.trim(),
    正文: 文.value.trim(),
    署名: 署.value.trim(),
  });

  // 宣传才加名声, 其余版面纯沉浸 (spec §2.3)。进位那一套在 加名声 里, 与治疗共用。
  if (版面.value === '宣传') 加名声(数据.value.诊所, 宣传名声);

  题.value = '';
  文.value = '';
  toastr.success(`《白塔日报》收下了你的稿子 · 花了 ${花} 金`, '已登报');
}

// ── 占卜 ────────────────────────────────────────────────────────────

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
  // 面板从 1300px 缩成 350px, 卡片底下的东西会往上收。`block: 'nearest'` 只
  // 在面板已经跑出视野时才滚, 而且滚最小的一段 —— 它够得着的时候什么都不做,
  // 所以桌面宽屏上不会有那一下跳动。
  void nextTick(() => 根元素.value?.scrollIntoView({ block: 'nearest' }));
}

function 抽() {
  const 卦 = 起一卦(数据.value.世界.日期, {
    精神力: 数据.value.主角.精神力,
    精神力上限: 数据.value.主角.精神力上限,
    名声: 数据.value.诊所.名声,
    等级: 数据.value.诊所.等级,
    在诊: Object.values(数据.value.哨兵).filter(哨 => 哨.状态 === '在诊').length,
    床位: 数据.value.诊所.床位,
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
/* 外壳(底色/圆角/阴影)在 global.css 的 .界卡 上, 其余三个块共用。 */
.世界 {
  &__角 {
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  &__条 {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    color: #9aa5b1;
    font-size: 0.86em;
  }

  &__天候 {
    color: #6f7a87;
    margin-left: auto;
  }

  &__主线 {
    margin: 8px 0 0;
    color: #cfd7e0;
    font-size: 0.9em;
    line-height: 1.6;
  }

  &__事件 {
    margin: 7px 0 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      flex-wrap: wrap;
      gap: 0 8px;
      margin-top: 4px;
      font-size: 0.8em;
      line-height: 1.5;
    }
  }

  &__事件名 {
    flex: none;
    color: #8c98a6;
  }

  &__事件态 {
    flex: none;
    color: #7fd6a0;
  }

  &__事件说 {
    flex: 1 1 100%;
    color: #5f6a77;
  }

  /* ── 报纸 ──────────────────────────────────────────────────────
     这一块**故意不跟着界面的无衬线字体走**: 报纸要看起来像印出来的。
     衬线 + 偏暖的纸色, 跟上下两块灰蓝色的界面拉开距离 —— 玩家一眼就知道
     自己是在「读报」, 而不是在看又一个数据面板。 */
  &__报 {
    margin-top: 12px;
    padding: 12px 13px 4px;
    border-radius: 7px;
    background: rgba(226, 214, 190, 0.045);
    border: 1px solid rgba(226, 214, 190, 0.1);
    font-family: Georgia, 'Songti SC', 'SimSun', 'Noto Serif CJK SC', serif;
  }

  &__报头 {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 7px;
    /* 报头下面那道双线: 一粗一细, 是报纸的样子 */
    border-bottom: 3px double rgba(226, 214, 190, 0.28);
  }

  &__报名 {
    color: #ece3d2;
    font-size: 1.16em;
    font-weight: 700;
    /* 报名字距拉开一点, 像铅字排出来的 */
    letter-spacing: 0.16em;
  }

  &__报日 {
    flex: none;
    color: #8a8172;
    font-size: 0.76em;
  }

  &__版 {
    margin-top: 12px;
  }

  &__版名 {
    margin: 0 0 7px;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(226, 214, 190, 0.16);
    color: #b0a693;
    font-size: 0.78em;
    font-weight: 600;
    letter-spacing: 0.22em;
  }

  /* 报纸里的一则。**故意不叫 `条`** —— 上面世界一角那一行已经叫 `条` 了,
     同名的话那一行的 flex 排版会漏进报纸里 (flex-wrap / gap 都还在),
     叠一层父选择器去盖只是在跟自己的样式打架。两个东西本来就不同名才对。 */
  &__闻 {
    margin-bottom: 11px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__题 {
    margin: 0 0 3px;
    color: #e2d9c8;
    font-size: 0.92em;
    font-weight: 600;
    line-height: 1.45;
  }

  &__文 {
    margin: 0;
    color: #a89f8e;
    font-size: 0.84em;
    line-height: 1.7;
    /* 报纸正文两端对齐, 行尾才不会有豁口 */
    text-align: justify;
  }

  &__署 {
    margin: 3px 0 0;
    color: #7a7264;
    font-size: 0.76em;
    text-align: right;
  }

  /* 玩家自己买的那一则。整块报纸都是灰黄的, 只有它是亮的 ——
     花了钱的东西得一眼看见, 否则玩家会以为钱白花了。 */
  &__闻.is-投稿 {
    margin: 0 -6px 11px;
    padding: 7px 6px 7px 9px;
    border-left: 2px solid rgba(127, 227, 255, 0.45);
    background: rgba(127, 227, 255, 0.05);

    .世界__题 {
      color: #cfeeff;
    }

    .世界__文 {
      color: #9fb3bf;
    }
  }

  &__印 {
    margin-left: 6px;
    padding: 1px 5px;
    border-radius: 3px;
    background: rgba(127, 227, 255, 0.16);
    color: #a8ecff;
    font-family: system-ui, sans-serif;
    font-size: 0.68em;
    font-weight: 400;
    letter-spacing: 0.06em;
    vertical-align: 2px;
    white-space: nowrap;
  }

  /* 往期。压在报纸最底下, 用同色系的线框 —— 它还是报纸的一部分, 不该长得像界面控件。 */
  &__往 {
    margin: 4px 0 10px;
    border-top: 1px solid rgba(226, 214, 190, 0.16);
  }

  &__往头 {
    padding: 7px 0 2px;
    color: #8a8172;
    font-size: 0.76em;
    letter-spacing: 0.1em;
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }
  }

  &__往体 {
    padding-top: 4px;
  }

  &__往条 {
    display: flex;
    gap: 8px;
    padding: 3px 0;
    font-size: 0.78em;
  }

  &__往日 {
    flex: none;
    color: #6b6459;
    font-variant-numeric: tabular-nums;
  }

  &__往名 {
    flex: 1;
    min-width: 0;
    color: #8a8172;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── 投稿 ────────────────────────────────────────────────────── */
  &__投稿 {
    margin-top: 14px;
  }

  &__投过 {
    margin: 0;
    padding: 9px 11px;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.03);
    color: #6f7a87;
    font-size: 0.82em;
  }

  &__折 {
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.025);

    &[open] {
      background: rgba(255, 255, 255, 0.04);
    }
  }

  &__折头 {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 12px;
    color: #b6c0cb;
    font-size: 0.86em;
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }
  }

  &__折名 {
    flex: 1;
    min-width: 0;
  }

  &__折价 {
    flex: none;
    color: #5f6a77;
    font-size: 0.88em;
  }

  &__折体 {
    padding: 0 12px 12px;
  }

  &__版们 {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__版钮 {
    display: flex;
    align-items: baseline;
    gap: 5px;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(255, 255, 255, 0.03);
    color: #8e99a6;
    font-family: inherit;
    font-size: 0.82em;
    cursor: pointer;

    &.is-选 {
      border-color: rgba(127, 227, 255, 0.36);
      background: rgba(127, 227, 255, 0.12);
      color: #a8ecff;
    }
  }

  &__版价 {
    color: #5f6a77;
    font-size: 0.86em;
    font-variant-numeric: tabular-nums;

    .世界__版钮.is-选 & {
      color: #7fb8cc;
    }
  }

  &__提 {
    margin: 9px 0 8px;
    color: #6f7a87;
    font-size: 0.78em;

    b {
      color: #8e99a6;
      font-weight: 600;
    }
  }

  &__入 {
    display: block;
    width: 100%;
    margin-bottom: 7px;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(0, 0, 0, 0.22);
    color: #d8dee6;
    font-family: inherit;
    font-size: 0.84em;
    line-height: 1.6;
    box-sizing: border-box;

    &::placeholder {
      color: #4d5866;
    }

    &:focus {
      outline: none;
      border-color: rgba(127, 227, 255, 0.35);
    }
  }

  &__区 {
    resize: vertical;
    min-height: 62px;
  }

  &__交行 {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 2px;
  }

  &__交 {
    flex: none;
    padding: 9px 14px;
    border-radius: 7px;
    border: 1px solid rgba(127, 227, 255, 0.34);
    background: rgba(127, 227, 255, 0.14);
    color: #a8ecff;
    font-family: inherit;
    font-size: 0.86em;
    cursor: pointer;

    &:disabled {
      opacity: 0.4;
      cursor: default;
      border-color: rgba(255, 255, 255, 0.09);
      background: rgba(255, 255, 255, 0.04);
      color: #6f7a87;
    }
  }

  &__拦 {
    color: #b98a8a;
    font-size: 0.76em;
    line-height: 1.4;
  }
}

/* ── 占卜 ────────────────────────────────────────────────────────
   翻牌用的是 3D transform 而不是换两张图: 一句 transform 就有真正的翻面,
   而且牌背牌面都留在 DOM 里, 翻到一半也看得见两面的交界。

   `.卜牌__面` 必须 backface-visibility: hidden —— 少了它, 背面那层会透过
   正面显出来, 牌面上就是「愚者」和「✦」叠在一起。 */
.世界__卜 {
  margin-top: 14px;
}

.世界__卜钮 {
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

.世界__卜题 {
  font-size: 0.94em;
  letter-spacing: 0.18em;
}

.世界__卜注 {
  font-size: 0.74em;
  opacity: 0.7;
}

/* 占卜接管整个面板时的那一屏。**不是浮层** —— 它就在正常流里, 顶掉
   世界一角/报纸/投稿那三块 (见模板顶上的注释: 卡片是等高的 iframe,
   卡片坐标系里没有「视口」这个概念, 浮层的内容会落在玩家看不见的地方)。

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
