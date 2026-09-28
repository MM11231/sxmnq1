<template>
  <div class="疏导">
    <header class="疏导__头">
      <span class="疏导__名">{{ 哨兵姓名 }}</span>
      <span class="疏导__污">污染 {{ 参数.污染度 }}</span>
      <span class="疏导__空" />
      <span class="疏导__数">剩 {{ 未清数 }}</span>
      <span class="疏导__数" :class="{ 'is-有': 失误日志.length > 0 }">失误 {{ 失误日志.length }}</span>
      <span class="疏导__数 is-耗">精神力 −{{ 当前消耗 }}</span>
    </header>

    <div ref="场元素" class="疏导__场" :class="{ 'is-震': 震动中 }" @pointerdown="点下去">
      <svg class="疏导__svg" :viewBox="`0 0 ${宽} ${高}`" :width="宽" :height="高">
        <line
          v-for="(线, i) in 丝线们"
          :key="i"
          :x1="线.x1 * 宽"
          :y1="线.y1 * 高"
          :x2="线.x2 * 宽"
          :y2="线.y2 * 高"
          class="疏导__线"
          :class="{ 'is-亮': i === 亮着, 'is-清': 清掉的[i], 'is-错': i === 错线 }"
          :style="清掉的[i] ? 抽走样式(线) : undefined"
        />
      </svg>

      <div
        v-for="字 in 飘字们"
        :key="字.id"
        class="疏导__飘字"
        :style="{ left: `${字.x}px`, top: `${字.y}px` }"
      >
        {{ 字.文字 }}
      </div>

      <p v-if="提示语" class="疏导__引导">{{ 提示语 }}</p>

      <div v-if="已结束 && 结果" class="疏导__结算">
        <div class="疏导__评级" :class="`is-${结果.评级}`">{{ 结果.评级 }}</div>
        <dl class="疏导__账">
          <div><dt>梳理丝线</dt><dd>{{ 结果.线数 }}</dd></div>
          <div><dt>失手</dt><dd :class="{ 'is-有': 结果.失误次数 > 0 }">{{ 结果.失误次数 }}</dd></div>
          <div><dt>精神力</dt><dd>−{{ 结果.精神力消耗 }}</dd></div>
        </dl>
        <ul v-if="结果.失误日志.length" class="疏导__日志">
          <li v-for="(短句, i) in 结果.失误日志" :key="i">{{ 短句 }}</li>
        </ul>
      </div>
    </div>

    <footer class="疏导__脚">
      <button v-if="!已结束" class="疏导__钮 is-退" @click="emit('取消')">中断疏导</button>
      <button v-else class="疏导__钮 is-完" @click="emit('结算', 结果!)">完成疏导</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  命中判定,
  抽失误短句,
  换线停顿,
  最近丝线,
  汇总,
  算精神力消耗,
  算线数,
  生成丝线,
  type 治疗参数,
  type 治疗结果,
  type 丝线,
} from './game';

const props = defineProps<{
  哨兵姓名: string;
  参数: 治疗参数;
  /** 传同一个种子可以复现同一局, 方便调试 */
  种子?: number;
}>();

const emit = defineEmits<{ 结算: [治疗结果]; 取消: [] }>();

const 场元素 = ref<HTMLElement>();
const 宽 = ref(0);
const 高 = ref(0);

const 线数 = ref(0);
const 丝线们 = ref<丝线[]>([]);
const 亮着 = ref(-1);
const 清掉的 = ref<boolean[]>([]);
const 错线 = ref(-1);
const 失误日志 = ref<string[]>([]);
const 飘字们 = ref<{ id: number; x: number; y: number; 文字: string }[]>([]);
const 震动中 = ref(false);
const 已结束 = ref(false);
const 结果 = ref<治疗结果 | null>(null);
const 提示语 = ref('');

const 未清数 = computed(() => 清掉的.value.filter(已清 => !已清).length);
const 当前消耗 = computed(() => 算精神力消耗(线数.value, 失误日志.value.length, props.参数.躺椅等级));

let 飘字号 = 0;
let 定时器: ReturnType<typeof setTimeout>[] = [];
let 观察器: ResizeObserver | undefined;

function 定(动作: () => void, 毫秒: number) {
  定时器.push(setTimeout(动作, 毫秒));
}

function 清干净定时器() {
  定时器.forEach(clearTimeout);
  定时器 = [];
}

function 重置() {
  清干净定时器();
  线数.value = 算线数(props.参数);
  丝线们.value = 生成丝线(线数.value, 宽.value, 高.value, props.种子 ?? Math.floor(Math.random() * 1e9));
  清掉的.value = Array(丝线们.value.length).fill(false);
  失误日志.value = [];
  飘字们.value = [];
  亮着.value = 丝线们.value.length > 0 ? 0 : -1;
  错线.value = -1;
  震动中.value = false;
  已结束.value = false;
  结果.value = null;
  提示语.value = '点那条亮着的线';
}

function 抽走样式(线: 丝线) {
  return {
    transform: `translate(${(线.x2 - 线.x1) * 宽.value * 0.3}px, ${(线.y2 - 线.y1) * 高.value * 0.3}px)`,
  };
}

function 点下去(事件: PointerEvent) {
  if (已结束.value || 亮着.value < 0 || !场元素.value) return;

  const 框 = 场元素.value.getBoundingClientRect();
  const px = 事件.clientX - 框.left;
  const py = 事件.clientY - 框.top;

  const 判定 = 命中判定(丝线们.value, 亮着.value, px, py);
  if (判定 === '无') return;

  if (判定 === '失误') {
    记失误(px, py);
    return;
  }

  清一条();
}

function 记失误(px: number, py: number) {
  const 短句 = 抽失误短句();
  失误日志.value = [...失误日志.value, 短句];

  错线.value = 最近丝线(丝线们.value, px, py);
  震动中.value = false;
  定(() => (震动中.value = true), 0);
  定(() => (震动中.value = false), 300);
  定(() => (错线.value = -1), 420);

  const id = ++飘字号;
  飘字们.value = [...飘字们.value, { id, x: px, y: py, 文字: 短句 }];
  定(() => (飘字们.value = 飘字们.value.filter(字 => 字.id !== id)), 1500);
}

function 清一条() {
  const 已清 = [...清掉的.value];
  已清[亮着.value] = true;
  清掉的.value = 已清;
  亮着.value = -1;
  提示语.value = '';

  const 下一条 = 已清.findIndex(已 => !已);
  if (下一条 === -1) {
    定(结束, 换线停顿);
    return;
  }
  定(() => (亮着.value = 下一条), 换线停顿);
}

function 结束() {
  结果.value = 汇总(props.参数, 线数.value, 线数.value, 失误日志.value);
  已结束.value = true;
}

onMounted(() => {
  if (!场元素.value) return;

  观察器 = new ResizeObserver(() => {
    if (!场元素.value) return;
    const w = 场元素.value.clientWidth;
    const h = 场元素.value.clientHeight;
    if (w === 宽.value && h === 高.value) return;

    const 还没动手 = 失误日志.value.length === 0 && 未清数.value === 线数.value;
    宽.value = w;
    高.value = h;
    // 尺寸变了就重撒一次; 已经动过手了就不重来, 免得进度没了
    if (丝线们.value.length === 0 || 还没动手) 重置();
  });
  观察器.observe(场元素.value);
});

onBeforeUnmount(() => {
  观察器?.disconnect();
  清干净定时器();
});
</script>

<style lang="scss" scoped>
.疏导 {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: linear-gradient(170deg, #12171f 0%, #0a0d13 100%);
  color: #d8dee6;
  font-size: 14px;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;

  &__头 {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    flex: none;
    font-size: 0.86em;
    letter-spacing: 0.02em;
  }

  &__名 {
    color: #eef3f8;
    font-weight: 600;
  }

  &__污 {
    color: #7d8896;
  }

  &__空 {
    flex: 1;
  }

  &__数 {
    color: #7d8896;
    font-variant-numeric: tabular-nums;

    &.is-有 {
      color: #ff9a9a;
    }

    &.is-耗 {
      color: #7fe3ff;
      min-width: 5.4em;
      text-align: right;
    }
  }

  &__场 {
    position: relative;
    flex: 1;
    min-height: 0;
    touch-action: none;
    overflow: hidden;

    &.is-震 {
      animation: 震 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97);
    }
  }

  &__svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  &__线 {
    stroke: #38424f;
    stroke-width: 3;
    stroke-linecap: round;
    transition:
      stroke 0.22s ease,
      stroke-width 0.22s ease,
      opacity 0.32s ease,
      transform 0.32s ease;

    &.is-亮 {
      stroke: #7fe3ff;
      stroke-width: 5;
      filter: drop-shadow(0 0 6px rgba(127, 227, 255, 0.85));
    }

    &.is-错 {
      stroke: #ff7a7a;
      stroke-width: 5;
      filter: drop-shadow(0 0 6px rgba(255, 122, 122, 0.7));
    }

    &.is-清 {
      opacity: 0;
      stroke-width: 1;
    }
  }

  &__飘字 {
    position: absolute;
    transform: translate(-50%, -50%);
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(30, 18, 18, 0.9);
    border: 1px solid rgba(255, 122, 122, 0.35);
    color: #ffb4b4;
    font-size: 0.8em;
    white-space: nowrap;
    pointer-events: none;
    animation: 飘 1.5s ease-out forwards;
  }

  &__引导 {
    position: absolute;
    left: 50%;
    bottom: 18px;
    transform: translateX(-50%);
    margin: 0;
    color: #55606d;
    font-size: 0.82em;
    pointer-events: none;
  }

  &__结算 {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 20px;
    background: rgba(8, 11, 16, 0.9);
    backdrop-filter: blur(3px);
    animation: 淡入 0.4s ease-out;
  }

  &__评级 {
    font-size: 3.4em;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.04em;
    text-shadow: 0 0 24px currentColor;

    &.is-S {
      color: #ffd76e;
    }
    &.is-A {
      color: #7fe3ff;
    }
    &.is-B {
      color: #9fb3c8;
    }
    &.is-C {
      color: #ff9a9a;
    }
  }

  &__账 {
    display: flex;
    gap: 22px;
    margin: 0;

    div {
      text-align: center;
    }

    dt {
      color: #7d8896;
      font-size: 0.76em;
      margin-bottom: 3px;
    }

    dd {
      margin: 0;
      font-size: 1.2em;
      font-variant-numeric: tabular-nums;

      &.is-有 {
        color: #ff9a9a;
      }
    }
  }

  &__日志 {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 3px;
    max-width: 100%;
    color: #8b96a3;
    font-size: 0.8em;
    text-align: center;

    li {
      overflow-wrap: anywhere;
    }
  }

  &__脚 {
    flex: none;
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  &__钮 {
    display: block;
    width: 100%;
    min-height: 46px;
    border-radius: 10px;
    border: 1px solid transparent;
    font-size: 0.98em;
    font-family: inherit;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition:
      background 0.2s ease,
      border-color 0.2s ease;

    &.is-退 {
      background: rgba(50, 58, 68, 0.5);
      border-color: rgba(255, 255, 255, 0.07);
      color: #8b96a3;

      &:hover {
        background: rgba(60, 70, 82, 0.65);
      }
    }

    &.is-完 {
      background: rgba(127, 227, 255, 0.14);
      border-color: rgba(127, 227, 255, 0.4);
      color: #a8ecff;

      &:hover {
        background: rgba(127, 227, 255, 0.22);
      }
    }
  }
}

@keyframes 震 {
  10%,
  90% {
    transform: translateX(-2px);
  }
  20%,
  80% {
    transform: translateX(3px);
  }
  30%,
  50%,
  70% {
    transform: translateX(-5px);
  }
  40%,
  60% {
    transform: translateX(5px);
  }
}

@keyframes 飘 {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  18% {
    opacity: 1;
    transform: translate(-50%, -60%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -140%) scale(1);
  }
}

@keyframes 淡入 {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .疏导__场.is-震 {
    animation: none;
  }

  .疏导__线 {
    transition: opacity 0.2s ease;
  }
}
</style>
