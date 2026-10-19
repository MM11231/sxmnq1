<template>
  <div class="界">
    <header class="界__顶" :style="{ paddingTop: `${顶栏高 + 10}px` }">
      <div class="界__标">
        <span class="界__名">{{ 名 }}</span>
        <span class="界__日">{{ 日 }}</span>
      </div>
      <!-- 浮层开在**顶栏**, 不是第六个标签。
           下面那条标签栏五个已经是 320px 宽的极限了(见那处注释), 再挤一个进去会先把
           「申请」的角标顶出去。顶栏这个位置本来就有一个「历史」在用同一套开关,
           横着再加按钮，标签栏一个字都不用动。 -->
      <button
        v-for="层 in 层们"
        :key="层.键"
        class="界__钮 is-历史"
        :class="{ 'is-开': 开的浮层 === 层.键 }"
        @click="开的浮层 = 开的浮层 === 层.键 ? null : 层.键"
      >
        <i :class="层.图" /> {{ 层.名 }}
      </button>
      <button class="界__钮 is-历史" :class="{ 'is-开': 看历史 }" @click="看历史 = !看历史">
        <i class="fa-solid fa-clock-rotate-left" /> 历史
      </button>
    </header>

    <!-- 台子上叠着几页: 正文常驻在最底下, 有面板的那几页绝对定位盖在它上面。
         点标签 = 换一整页, 正文被整块盖住 —— 不再是把标签条顶上去、在下面长一块。

         正文**不用 v-show 藏**: 藏了就是 display:none, 元素一失去布局滚动位置就没了
         —— 玩家看诊回来会发现自己被弹回正文开头。让它一直有布局, 由上面那几页盖住它。

         有面板的几页仍然**都常驻挂载** (v-show 而不是 v-if) —— 见 spec §9.1:
         「盯住日期」挂在 ApplyPanel 里, 改成 v-if 会让它静默死掉, 掷骰和申请列表
         永远不再更新, 而且不报错。 -->
    <main class="界__台">
      <!-- 正文区 = 这条消息切出来的所有块。只有一块默认摊开, 其余折成一行。
           为什么要「全都留着、只折起来」而不是「抠出正文、其余丢掉」:
           抠的判据一旦失手, 要么漏标签、要么把剧情整段丢掉, 而且都不报错。
           折起来最坏也只是折错了哪一块 —— 玩家看得见, 点开就有。见 正文适配.ts 的头部注释。 -->
      <div ref="文区" class="界__文">
        <template v-if="块们.length">
          <template v-for="(块, 序) in 块们" :key="序">
            <!-- 摊开那块渲染的是 `片段` 不是 `内容` —— 双语预设把原文和译文逐行写在同一块里,
                 渲染 `内容` 会把两轨一起糊出来。见 正文适配.ts 的「三个层级」。 -->
            <template v-if="块.正文">
              <template v-for="(片, 内序) in 块.片段" :key="内序">
                <p v-if="片.类 === '文'">{{ 片.文 }}</p>
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
        <p v-else class="界__空">{{ 生成中 ? '正在写……' : '（这一楼没有正文）' }}</p>
      </div>

      <!-- 没有 `件` 的那一页(「剧情」)在这儿**什么都不铺** —— 它要的就是底下那份正文,
           给它盖一层带底色的空板子会把正文整块挡死, 而且不报错。 -->
      <template v-for="页 in 页表" :key="页.键">
        <div
          v-if="页.件"
          v-show="展块 === 页.键"
          class="界__页"
          :class="{ 'is-填': 页.填 }"
        >
          <component :is="页.件" @门="展块 = 首页键" />
        </div>
      </template>
    </main>

    <nav class="界__签">
      <!-- 一页一个等宽标签。点哪个整屏切哪个, 「剧情」就是正文本身。
           永远有一页选中, 所以不存在「怎么回去」这个问题。 -->
      <button
        v-for="页 in 页表"
        :key="页.键"
        class="界__态标"
        :class="{ 'is-开': 展块 === 页.键 }"
        @click="展块 = 页.键"
      >
        <span>{{ 页.名 }}</span>
        <span v-if="页.角标" class="界__角标">{{ 页.角标 }}</span>
      </button>
    </nav>

    <footer class="界__底">
      <button class="界__钮 is-主" :disabled="忙" @click="重说">
        <i class="fa-solid fa-rotate" /> 重说
      </button>
      <button class="界__钮" :disabled="忙" @click="继续">
        <i class="fa-solid fa-forward" /> 继续
      </button>
    </footer>

    <!-- 盖在最上面的浮层。v-if 和 v-for 不能落在同一个元素上, 所以拿 template 包一层。 -->
    <template v-for="层 in 层们" :key="层.键">
      <component :is="层.件" v-if="开的浮层 === 层.键" @关="开的浮层 = null" />
    </template>

    <aside v-if="看历史" class="史">
      <div class="史__顶">
        <span>历史</span>
        <button class="界__钮 is-历史" @click="看历史 = false"><i class="fa-solid fa-xmark" /></button>
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
// ★ 这个文件里 import 的名字必须都是 ASCII。Vue 模板编译器认不出非 ASCII 的标签名,
//   写成 `<治疗面板 />` 会被当纯文本渲染、绑定全丢, 而且只有生产构建才发作、构建照报成功。
//   (非 ASCII 的**文件名**没事 —— 见 入口/App.vue 里那份 import 名与标签名的对照。)
import { use顶栏高 } from './量顶栏';
import { 切块, 取正文, 读适配, 读最新原文 } from './正文';
import type { 页, 浮层 } from './壳型';

/**
 * 这层壳**自己不认任何一条路线**, 也不碰变量 —— 它只认「有几页、几层浮盖」。
 * 页面叫什么、角标上写几、标题栏写什么, 全由外面那层给(见 主界面/App.vue 与
 * 主界面2/App.vue)。这样加一条路线只是多写一个外面那层, 壳一个字都不用动,
 * 也就不会出现「改了壳、另一条路线跟着变」这种事。
 */
const 参 = defineProps<{
  名: string;
  日: string;
  页表: 页[];
  浮层表?: 浮层[];
}>();

const 层们 = computed(() => 参.浮层表 ?? []);
/** 第一页 = 「首页」。面板里点「门」时回到的正是它。 */
const 首页键 = computed(() => 参.页表[0]?.键 ?? '');

const 原文 = ref('');
const 生成中 = ref(false);
/**
 * 现在开着哪页。**永远有一页** —— 首页('剧情')就是正文本身, 不是「什么都没开」。
 *
 * 早先这里有个 null 表示全折叠, 靠再点一次同一个标签来收起。那个模型下界面是
 * 「正文 + 底下长出来的一块」: 标签条被顶上去, 正文被压掉一半, 而「怎么回去」
 * 没有任何可见提示。一页一个标签之后这两件事都没了。
 */
const 展块 = ref(首页键.value);
const 看历史 = ref(false);
/**
 * 现在盖着哪一层浮盖。`null` = 没盖。
 *
 * 原来每个浮层各有一个布尔(看白塔/看地图), 加一层就得多加一个、还得记得在别处
 * 一起判(比如下面 刷新() 里那段)。一个变量存「盖着谁」, 加层不用改别处。
 */
const 开的浮层 = ref<string | null>(null);
const 忙 = ref(false);
const 文区 = ref<HTMLElement | null>(null);

// 让开酒馆工具栏的活交给公共件了 —— 标题页和创建页也要让, 三页共用一份。
const 顶栏高 = use顶栏高();

// 适配表**开在这里读一次**就够了。正文每 500ms 跟着流式生成重切一遍, 每遍都去读一次
// 全局变量纯属浪费; 反正玩家改了配置也是要刷页面才生效的。
const 适配 = 读适配();

const 块们 = computed(() => 切块(原文.value, 适配));

// （原来这里有个 `分段()`: 把摊开那块按空行切成 <p>。它并进了 正文适配.ts 的 切片段() ——
//   双语预设要求分段之外再分「中文轨/外语轨」, 两件事得在同一遍里做完, 不然先分段再判外语
//   就要把每段的行重新拼回去, 白白绕一圈。）

const 历史 = computed(() => {
  try {
    // 适配表读一次就够 —— 下面每条消息都要用它, 每条都去读一遍全局变量纯属浪费。
    const 适配表 = 读适配();
    return getChatMessages('0-{{last}}')
      .filter(条 => 条.role !== 'system')
      .map(条 => ({ 号: 条.message_id, 角色: 条.role, 文: 取正文(条.message, 适配表) }))
      .filter(条 => 条.文);
  } catch {
    return [];
  }
});

// 界面挂死在第一楼, 剧情却一直在往新楼层长 —— 只能自己盯着最新一楼。
// 500ms 是为了让流式生成看起来像在打字; 再快没必要, 再慢就顿。
let 上次 = '';

function 刷新() {
  const 今 = 读最新原文();
  if (今 === 上次) return;
  上次 = 今;
  原文.value = 今;
  // 顶上压着浮层时别自己滚正文 —— 玩家正在看的是浮层, 底下的正文跟着动只是白费功夫。
  if (!看历史.value && !开的浮层.value) {
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
  生成中.value = false;
  刷新();
}

try {
  eventOn(tavern_events.GENERATION_STARTED, () => (生成中.value = true));
  ['GENERATION_ENDED', 'GENERATION_STOPPED', 'MESSAGE_RECEIVED', 'MESSAGE_SWIPED'].forEach(名 =>
    eventOn(tavern_events[名], 收笔),
  );
} catch {
  // 不在酒馆里(开发期直接开 index.html)时没有这些事件, 忽略。
}

async function 跑(指令: string) {
  if (忙.value) return;
  忙.value = true;
  生成中.value = true;
  try {
    await triggerSlash(指令);
  } catch (错) {
    toastr.error(String(错), '操作失败');
  } finally {
    生成中.value = false;
    忙.value = false;
    刷新();
  }
}

// `await=true` 才能等到生成完再继续 —— 否则下一个动作会插到生成中间去。
const 重说 = () => 跑('/regenerate await=true');
const 继续 = () => 跑('/continue await=true');
</script>

<style lang="scss" scoped>
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

  /* 台子 = 正文 + 盖在它上面的那几页。底下那几页是 absolute, 靠它定位 */
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
    padding: 18px 16px 24px;

    p {
      margin: 0 0 1em;
      // 中英混排时首行不缩进, 靠段间距分节 —— 手机窄屏下缩进太吃宽度。
      color: #c8c7af;

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

  /* 盖在正文上的那几页。
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

    /* 「填」的那一页自己铺满整块 —— 壳不给留白, 也不替它滚。
       地图那种整屏的平面图套着 12px 的边距和一层滚动条会露边、还会多出一条没用的滚动。 */
    &.is-填 {
      padding: 0;
      overflow: hidden;
    }
  }

  /* 一页一个等宽标签。位置固定在底部, 不再被展开的面板顶上去。
     开着的那页靠 is-开 的底色认 —— 互斥的按钮更像标签页, 加箭头反而说不清它管哪一块 */
  &__签 {
    flex: none;
    display: flex;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  &__态标 {
    display: flex;
    align-items: center;
    /* 居中对齐 —— 带角标的标签左对齐会让自己的文字比别的偏一截, 一排看过去是歪的 */
    justify-content: center;
    gap: 7px;
    flex: 1;
    min-width: 0;
    min-height: 42px;
    /* 每加一个标签, 每个就窄一档, 而 320px 宽的机器上本来就已经贴着边了:
       三个 → 四个时内边距从 14px 收到 10px, 四个 → 五个时由下面那条
       @media (max-width: 420px) 再收到 5px。**再要加标签就得先量一遍**,
       照这个收法会先把角标挤出去。 */
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

  /* 窄屏(320~420px 那段)标签会把角标挤出去。整条收一档 */
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
</style>
