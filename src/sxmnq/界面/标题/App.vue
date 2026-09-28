<template>
  <div class="标">
    <!-- 底子: 斜向渐变 + 两团极淡的辉光 -->
    <div class="标__晕 is-青" />
    <div class="标__晕 is-紫" />

    <!-- 中景与前景。整块"场"是固定尺寸的, 靠外层 flex 居中, 所以页面本身没有相对单位。 -->
    <div class="标__景">
      <div class="标__场">
        <span
          v-for="(点, i) in 光点"
          :key="i"
          class="标__点"
          :style="{
            left: `${点.x}px`,
            top: `${点.y}px`,
            width: `${点.大}px`,
            height: `${点.大}px`,
            animationDelay: `${点.延}s`,
            animationDuration: `${点.时}s`,
          }"
        />
        <div class="标__环 is-外" />
        <div class="标__环 is-内" />
        <div class="标__塔" />
      </div>
    </div>

    <div class="标__暗角" />

    <!-- 正题。固定 320×420 的画布, 窗口小了整体等比缩(见 共用/合窗.ts)。 -->
    <div class="标__中" :style="{ paddingTop: `${顶栏高}px` }">
      <div class="标__台" :style="{ transform: `scale(${缩放})` }">
        <div class="标__文">
          <div class="标__署">
            <i />
            <span>麻姑献寿</span>
            <i />
          </div>

          <h1 class="标__题">哨向模拟器</h1>

          <div class="标__线" />

          <button class="标__始" @click="点">
            <span class="标__始文">开始游戏</span>
            <span
              v-for="圈 in 涟漪"
              :key="圈.号"
              class="标__涟"
              :style="{ left: `${圈.x}px`, top: `${圈.y}px` }"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { use合窗 } from '../共用/合窗';
import { use顶栏高 } from '../共用/量顶栏';

const emit = defineEmits<{ 开始: [] }>();

const 顶栏高 = use顶栏高();
const { 缩放, 量 } = use合窗(320, 420, () => 顶栏高.value);
watch(顶栏高, 量);

/**
 * 光点的位置。
 *
 * 写死成像素, 不用百分比 —— 百分比在这里会让光点跟着窗口尺寸跑, 而这块画布是固定
 * 1200×900 的, 两边对不上。用下标算出来的伪随机, 而不是 Math.random: 每次重渲染位置
 * 都变的话, 光点会瞬移。
 */
const 光点 = Array.from({ length: 18 }, (_, i) => {
  const 随 = (n: number) => {
    const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  return {
    x: Math.round(随(1) * 1160 + 20),
    y: Math.round(随(2) * 860 + 20),
    大: 1 + Math.round(随(3) * 2),
    延: (随(4) * 6).toFixed(2),
    时: (5 + 随(5) * 5).toFixed(2),
  };
});

/** 点下去的涟漪。扩完就撤, 不留在 DOM 里。 */
const 涟漪 = ref<{ 号: number; x: number; y: number }[]>([]);
let 号 = 0;

function 点(事: MouseEvent) {
  const 框 = (事.currentTarget as HTMLElement).getBoundingClientRect();
  涟漪.value.push({ 号: 号++, x: 事.clientX - 框.left, y: 事.clientY - 框.top });
  setTimeout(() => 涟漪.value.shift(), 620);
  // 等涟漪扩出去再换页。太早切走的话玩家根本看不见自己点到了什么。
  setTimeout(() => emit('开始'), 280);
}
</script>

<style lang="scss" scoped>
.标 {
  // 根块只负责铺满 iframe。inset 是固定定位, 不是相对单位。
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(168deg, #131922 0%, #10151c 46%, #0a0e13 100%);

  &__晕 {
    position: absolute;
    inset: 0;
    pointer-events: none;

    &.is-青 {
      background: radial-gradient(58% 42% at 22% 12%, rgba(127, 227, 255, 0.09), transparent 70%);
    }

    &.is-紫 {
      background: radial-gradient(52% 40% at 84% 92%, rgba(179, 157, 219, 0.07), transparent 72%);
    }
  }

  // 中景/前景的居中壳。用 flex 而不是 left:50%, 免得引入百分比。
  &__景 {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  // 固定尺寸的"场", 光点按这个坐标系摆。比窗口小的时候四周裁掉, 中心永远在正中。
  &__场 {
    position: relative;
    width: 1200px;
    height: 900px;
    flex: none;
  }

  &__点 {
    position: absolute;
    border-radius: 50%;
    background: #a8ecff;
    box-shadow: 0 0 6px rgba(127, 227, 255, 0.55);
    animation-name: th-drift;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }

  &__环 {
    position: absolute;
    left: 600px;
    top: 450px;
    border-radius: 50%;
    transform: translate(-50%, -50%);

    // 用 conic 做一截扫过的高光, 再用 mask 掏空中间, 得到一圈细线 ——
    // 比 border 多一层旋转的明暗变化。
    &.is-外 {
      width: 460px;
      height: 460px;
      background: conic-gradient(
        from 0deg,
        transparent 0deg,
        rgba(127, 227, 255, 0.26) 46deg,
        transparent 132deg,
        transparent 360deg
      );
      -webkit-mask: radial-gradient(closest-side, transparent 97%, #000 98%);
      mask: radial-gradient(closest-side, transparent 97%, #000 98%);
      animation: th-spin 52s linear infinite;
    }

    &.is-内 {
      width: 300px;
      height: 300px;
      background: conic-gradient(
        from 180deg,
        transparent 0deg,
        rgba(168, 236, 255, 0.16) 30deg,
        transparent 96deg,
        transparent 360deg
      );
      -webkit-mask: radial-gradient(closest-side, transparent 97.5%, #000 98.5%);
      mask: radial-gradient(closest-side, transparent 97.5%, #000 98.5%);
      animation: th-spin 34s linear infinite reverse;
    }
  }

  // 白塔尖顶。开场白里"白塔的尖顶在晨雾里露出一个模糊的轮廓"那座塔。
  &__塔 {
    position: absolute;
    left: 600px;
    top: 450px;
    width: 132px;
    height: 340px;
    transform: translate(-50%, -50%);
    background: linear-gradient(
      to bottom,
      rgba(168, 236, 255, 0.2) 0%,
      rgba(127, 227, 255, 0.07) 42%,
      rgba(127, 227, 255, 0) 82%
    );
    clip-path: polygon(
      50% 0%,
      61% 26%,
      57% 28%,
      67% 66%,
      72% 100%,
      28% 100%,
      33% 66%,
      43% 28%,
      39% 26%
    );
    animation: th-breathe 7s ease-in-out infinite;
  }

  &__暗角 {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(76% 66% at 50% 46%, transparent 42%, rgba(3, 6, 9, 0.72) 100%);
  }

  &__中 {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    // 顶栏高度现算成内边距, 让居中的基准线落在工具栏下方。
    box-sizing: border-box;
  }

  &__台 {
    width: 320px;
    height: 420px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    // transform 不参与布局, 所以缩放后周围仍按 320×420 占位 —— 居中点不会跑。
    transform-origin: center center;
  }

  &__文 {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 320px;
  }

  &__署 {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 26px;
    opacity: 0;
    animation: th-rise 0.9s 0.15s ease-out both;

    span {
      color: #6f7a87;
      font-size: 12px;
      letter-spacing: 0.42em;
      // 字距会在末尾多顶出一格, 往左补偿回来才是视觉居中。
      text-indent: 0.42em;
    }

    i {
      width: 34px;
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(127, 227, 255, 0.34));
      &:last-child {
        background: linear-gradient(to left, transparent, rgba(127, 227, 255, 0.34));
      }
    }
  }

  &__题 {
    margin: 0;
    color: #eef3f8;
    font-size: 32px;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: 0.06em;
    text-indent: 0.06em;
    white-space: nowrap;
    text-shadow: 0 0 22px rgba(127, 227, 255, 0.28), 0 0 60px rgba(127, 227, 255, 0.12);
    opacity: 0;
    // 入场时字距从松到紧收一次, 两段动画并行。
    animation: th-rise 1s 0.32s ease-out both, th-tighten 1.5s 0.32s cubic-bezier(0.22, 0.9, 0.24, 1) both;
  }

  &__线 {
    width: 190px;
    height: 1px;
    margin: 30px 0 34px;
    background: linear-gradient(to right, transparent, rgba(127, 227, 255, 0.42), transparent);
    opacity: 0;
    animation: th-rise 0.9s 0.62s ease-out both;
  }

  &__始 {
    position: relative;
    overflow: hidden;
    width: 190px;
    min-height: 46px;
    padding: 0;
    border-radius: 10px;
    border: 1px solid rgba(127, 227, 255, 0.34);
    background: rgba(127, 227, 255, 0.09);
    color: #cdf3ff;
    font-family: inherit;
    font-size: 15px;
    letter-spacing: 0.2em;
    text-indent: 0.2em;
    cursor: pointer;
    opacity: 0;
    animation: th-rise 0.9s 0.76s ease-out both;
    transition: background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.12s ease;

    // 悬停时从左边扫过去的一道高光。
    &::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: 46%;
      left: -60%;
      background: linear-gradient(
        to right,
        transparent,
        rgba(205, 243, 255, 0.22),
        transparent
      );
      transform: skewX(-18deg);
      transition: left 0.55s cubic-bezier(0.3, 0.7, 0.3, 1);
      pointer-events: none;
    }

    &:hover {
      background: rgba(127, 227, 255, 0.16);
      border-color: rgba(127, 227, 255, 0.52);
      box-shadow: 0 0 24px rgba(127, 227, 255, 0.16);
      &::after {
        left: 118%;
      }
    }

    &:active {
      transform: scale(0.975);
    }
  }

  &__始文 {
    position: relative;
    z-index: 2;
  }

  &__涟 {
    position: absolute;
    z-index: 1;
    width: 12px;
    height: 12px;
    margin: -6px 0 0 -6px;
    border-radius: 50%;
    background: rgba(168, 236, 255, 0.32);
    pointer-events: none;
    animation: th-ripple 0.62s ease-out forwards;
  }
}

@keyframes th-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes th-tighten {
  from {
    letter-spacing: 0.3em;
  }
  to {
    letter-spacing: 0.06em;
  }
}

@keyframes th-spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes th-breathe {
  0%,
  100% {
    opacity: 0.62;
  }
  50% {
    opacity: 1;
  }
}

@keyframes th-drift {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.16;
  }
  50% {
    transform: translateY(-16px);
    opacity: 0.72;
  }
}

@keyframes th-ripple {
  to {
    width: 300px;
    height: 300px;
    margin: -150px 0 0 -150px;
    background: rgba(168, 236, 255, 0);
  }
}

// 系统设了"减少动态效果"就把装饰性的动效全停掉, 只留入场。
// 转个不停的光环对前庭敏感的人是实打实的难受。
@media (prefers-reduced-motion: reduce) {
  .标__环,
  .标__点,
  .标__塔 {
    animation: none !important;
  }
  .标__点 {
    opacity: 0.3;
  }
}
</style>
