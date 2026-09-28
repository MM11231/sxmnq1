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

    <main ref="文区" class="界__文">
      <template v-if="正文">
        <p v-for="(段, 序) in 段落" :key="序">{{ 段 }}</p>
        <span v-if="生成中" class="界__笔">▍</span>
      </template>
      <p v-else class="界__空">{{ 生成中 ? '正在写……' : '（这一楼没有正文）' }}</p>
    </main>

    <section class="界__态">
      <div class="界__签">
        <button
          class="界__态标"
          :class="{ 'is-开': 展块 === '诊所与申请' }"
          @click="切块('诊所与申请')"
        >
          <span>诊所与申请</span>
          <span v-if="待接数" class="界__角标">{{ 待接数 }}</span>
        </button>
        <button class="界__态标" :class="{ 'is-开': 展块 === '家园' }" @click="切块('家园')">
          <span>家园</span>
          <span v-if="仓库数" class="界__角标">{{ 仓库数 }}</span>
        </button>
      </div>

      <!-- 两个块**都常驻挂载**, 只切 v-show —— 见 spec §9.1:
           `盯住日期` 挂在 StatusPanel 里, 改用 v-if 会把那条 watch 一起销毁,
           掷骰与申请列表会**静默死掉**(不报错, 只是永远不再出现新申请)。 -->
      <div v-show="展块 === '诊所与申请'" class="界__态体"><StatusPanel /></div>
      <div v-show="展块 === '家园'" class="界__态体"><HomePanel @门="展块 = null" /></div>
    </section>

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
// import 名必须是 ASCII: Vue 的模板编译器认不出非 ASCII 的标签名, 写成 `<状态栏 />`
// 会被当纯文本渲染, 绑定全丢, 生产构建时才发作。详见 状态栏/App.vue 里的同一处注释。
import StatusPanel from '../状态栏/App.vue';
import HomePanel from '../家园/App.vue';
import { 算仓库 } from '../../家园/家具';
import { useDataStore } from '../共用/数据';
import { use顶栏高 } from '../共用/量顶栏';
import { 取正文, 读最新原文 } from './正文';

const store = useDataStore();
const 数据 = computed(() => store.data);

const 原文 = ref('');
const 生成中 = ref(false);
/** 现在开着哪一块。null = 全折叠。互斥就是「只有一个值」这件事本身 (spec §9) */
const 展块 = ref<'诊所与申请' | '家园' | null>(null);

/** 点开着的那个 = 收起它; 点别的 = 换过去 */
function 切块(块: '诊所与申请' | '家园') {
  展块.value = 展块.value === 块 ? null : 块;
}
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

  &__态 {
    flex: none;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* 按钮排成一行。展开态靠 is-开 的底色认, 不再用箭头 —— 互斥的按钮更像
     标签页, 一个上下箭头反而说不清它管的是哪一块 */
  &__签 {
    display: flex;
  }

  /* 展开体的上限。原来这个上限挂在「展开态」那个类名下的 .界__态体 上, 现在不需要了:
     `v-show` 已经管了显不显示, 上限常驻即可。
     **新加的是下面那三条上限** (max-height / overflow / overscroll); padding 原本就在
     —— 基底里已有一条只写 padding 的 `&__态体`, 现在并进这一段。之所以要并: 每块自带
     .界卡 的 margin, 左右得留一点免得贴边, 两份分开写早晚会不一致。 */
  &__态体 {
    padding: 0 12px 12px;
    max-height: 46vh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  &__态标 {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    min-height: 42px;
    padding: 0 14px;
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

  &__角标 {
    margin-left: auto;
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
