<template>
  <div class="界">
    <header class="界__顶" :style="{ paddingTop: `${顶栏高 + 10}px` }">
      <div class="界__标">
        <span class="界__名">{{ 数据.诊所.名称 || '未命名的诊所' }}</span>
        <span class="界__日">{{ 数据.世界.日期 }} · {{ 数据.世界.时段 }}</span>
      </div>
      <button class="界__钮 is-历史" :class="{ 'is-开': 看历史 }" @click="看历史 = !看历史">
        <i class="fa-solid fa-clock-rotate-left" /> 历史
      </button>
    </header>

    <!-- 台子上叠着四页: 正文常驻在最底下, 另外三页绝对定位盖在它上面。
         点标签 = 换一整页, 正文被整块盖住 —— 不再是把标签条顶上去、在下面长一块。
         (旧样子: 点「诊所」, 标签条从 y=630 升到 y=442, 卡片在下面长出来, 正文被压掉一半。)

         正文**不用 v-show 藏**: 藏了就是 display:none, 元素一失去布局滚动位置就没了
         —— 玩家看诊回来会发现自己被弹回正文开头。让它一直有布局, 由上面那三页盖住它。

         三个块仍然**都常驻挂载** (v-show 而不是 v-if) —— 见 spec §9.1:
         「盯住日期」挂在 ApplyPanel 里, 改成 v-if 会让它静默死掉, 掷骰和申请列表
         永远不再更新, 而且不报错。 -->
    <main class="界__台">
      <div ref="文区" class="界__文">
        <template v-if="正文">
          <p v-for="(段, 序) in 段落" :key="序">{{ 段 }}</p>
          <span v-if="生成中" class="界__笔">▍</span>
        </template>
        <p v-else class="界__空">{{ 生成中 ? '正在写……' : '（这一楼没有正文）' }}</p>
      </div>

      <div v-show="展块 === '诊所'" class="界__页"><ClinicPanel /></div>
      <div v-show="展块 === '申请'" class="界__页"><ApplyPanel /></div>
      <div v-show="展块 === '家园'" class="界__页"><HomePanel @门="展块 = '剧情'" /></div>
    </main>

    <nav class="界__签">
      <!-- 四个等宽标签 = 四个页面。点哪个整屏切哪个, 「剧情」就是正文本身。
           永远有一页选中, 所以不存在「怎么回去」这个问题。 -->
      <button class="界__态标" :class="{ 'is-开': 展块 === '剧情' }" @click="展块 = '剧情'">
        <span>剧情</span>
      </button>
      <button class="界__态标" :class="{ 'is-开': 展块 === '诊所' }" @click="展块 = '诊所'">
        <span>诊所</span>
      </button>
      <button class="界__态标" :class="{ 'is-开': 展块 === '申请' }" @click="展块 = '申请'">
        <span>申请</span>
        <span v-if="待接数" class="界__角标">{{ 待接数 }}</span>
      </button>
      <button class="界__态标" :class="{ 'is-开': 展块 === '家园' }" @click="展块 = '家园'">
        <span>家园</span>
        <span v-if="仓库数" class="界__角标">{{ 仓库数 }}</span>
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
// import 名必须是 ASCII。Vue 模板编译器认不出非 ASCII 的标签名, 写成 `<治疗面板 />`
// 会被当纯文本渲染、绑定全丢, 而且只有生产构建才发作、构建照报成功。
// ★ 这条注释就是全仓的出处: 入口/App.vue、创建/App.vue、家园/App.vue 都指向这里。
import ClinicPanel from '../诊所/App.vue';
import ApplyPanel from '../申请/App.vue';
import HomePanel from '../家园/App.vue';
import { 算仓库 } from '../../家园/家具';
import { useDataStore } from '../共用/数据';
import { use顶栏高 } from '../共用/量顶栏';
import { 取正文, 读最新原文 } from './正文';

const store = useDataStore();
const 数据 = computed(() => store.data);

const 原文 = ref('');
const 生成中 = ref(false);
/**
 * 现在开着哪页。**永远有一页** —— '剧情' 就是正文本身, 不是「什么都没开」。
 *
 * 早先这里有个 null 表示全折叠, 靠再点一次同一个标签来收起。那个模型下界面是
 * 「正文 + 底下长出来的一块」: 标签条被顶上去, 正文被压掉一半, 而「怎么回去」
 * 没有任何可见提示。一页一个标签之后这两件事都没了。
 */
const 展块 = ref<'剧情' | '诊所' | '申请' | '家园'>('剧情');
const 看历史 = ref(false);
const 忙 = ref(false);
const 文区 = ref<HTMLElement | null>(null);

// 让开酒馆工具栏的活交给公共件了 —— 标题页和创建页也要让, 三页共用一份。
const 顶栏高 = use顶栏高();

const 正文 = computed(() => 取正文(原文.value));

// 空行分段。AI 有时用单换行断句, 所以不把每行都当一段。
const 段落 = computed(() =>
  正文.value
    .split(/\n\s*\n/)
    .map(段 => 段.trim())
    .filter(Boolean),
);

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
    return getChatMessages('0-{{last}}')
      .filter(条 => 条.role !== 'system')
      .map(条 => ({ 号: 条.message_id, 角色: 条.role, 文: 取正文(条.message) }))
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
  if (!看历史.value) {
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
  background: linear-gradient(178deg, #10151c 0%, #0b0f14 100%);
  color: #d8dee6;
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
    color: #eef3f8;
    font-weight: 600;
    font-size: 0.98em;
    letter-spacing: 0.03em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__日 {
    color: #6f7a87;
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
    padding: 18px 16px 24px;

    p {
      margin: 0 0 1em;
      // 中英混排时首行不缩进, 靠段间距分节 —— 手机窄屏下缩进太吃宽度。
      color: #cfd7e0;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  &__笔 {
    display: inline-block;
    color: #7fe3ff;
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
     两段渐变各自从头开始, 接缝在 #10151c 上, 看不出来。
     每块自带 .界卡 的 margin, 左右留一点免得贴边。 */
  &__页 {
    position: absolute;
    inset: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0 12px 12px;
    background: linear-gradient(178deg, #10151c 0%, #0b0f14 100%);
  }

  /* 四个等宽标签 = 四个页面。位置固定在底部, 不再被展开的面板顶上去。
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
    /* 标签从三个变四个, 每个窄了 1/4。14px 的左右内边距在 320px 宽的机器上
       正好把带角标的那个挤出去, 所以收到 10px */
    padding: 0 10px;
    border: none;
    background: rgba(255, 255, 255, 0.02);
    color: #8e99a6;
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
      background: rgba(127, 227, 255, 0.08);
      color: #a8ecff;

      i {
        color: #a8ecff;
      }
    }
  }

  /* 不再 `margin-left: auto` —— 那是在左对齐的标签里把角标甩到右边的写法。
     现在整行居中, 角标跟着文字走, 由 gap 隔开就对了 */
  &__角标 {
    flex: none;
    padding: 1px 8px;
    border-radius: 999px;
    background: rgba(127, 227, 255, 0.14);
    border: 1px solid rgba(127, 227, 255, 0.3);
    color: #a8ecff;
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
    color: #b6c0cb;
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
      background: rgba(127, 227, 255, 0.14);
      border-color: rgba(127, 227, 255, 0.34);
      color: #a8ecff;

      &:not(:disabled):hover {
        background: rgba(127, 227, 255, 0.24);
      }
    }

    &.is-历史 {
      flex: none;
      min-height: 32px;
      padding: 0 11px;
      font-size: 0.82em;
      color: #8e99a6;

      &.is-开 {
        background: rgba(127, 227, 255, 0.14);
        border-color: rgba(127, 227, 255, 0.3);
        color: #a8ecff;
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
  background: #0b0f14;

  &__顶 {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    color: #eef3f8;
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
      color: #b6c0cb;
      font-size: 0.94em;
      white-space: pre-wrap;
    }

    &.is-user p {
      color: #8e99a6;
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
