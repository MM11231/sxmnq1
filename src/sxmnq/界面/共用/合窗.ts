import { onMounted, onUnmounted, ref } from 'vue';

/** 画布四周留出的空隙, 免得贴边 */
const 留白 = 14;

/**
 * 把一块**固定设计尺寸**的画布等比缩进窗口里。
 *
 * 标题页和创建页的宽高一律写死成像素, 不用 % 也不用 vh —— 在 iframe 里这两个都会绕成死结:
 * 百分比要等父元素先定高, 而 vh 指的是 iframe 自己的高度, 可 iframe 的高度又要靠内容来量,
 * 两边互相等, 表现就是高度为 0 或者忽大忽小。
 *
 * 所以唯一的相对量从这儿来: 量出 iframe 的真实像素高宽, 取一个不超过 1 的等比系数。
 * 窗口够大就原尺寸, 窗口小了整体缩小, 永远不会被拉长。
 *
 * `让开` 是个取值函数而不是数字 —— 酒馆顶栏的高度是**动的**(每 2 秒重测一次), 得让它每次
 * 现取。调用方变化时自己再调一次 `量()`。
 */
export function use合窗(设计宽: number, 设计高: number, 让开?: () => number) {
  const 缩放 = ref(1);

  function 量() {
    // innerWidth / innerHeight 给的就是 iframe 的实际像素尺寸, 不牵扯任何相对单位。
    const 可用宽 = window.innerWidth - 留白 * 2;
    const 可用高 = window.innerHeight - 留白 * 2 - (让开?.() ?? 0);
    // 下限兜到 0.28: 再小字就看不清了, 与其缩成蚂蚁不如让它溢出一点、由外层裁掉。
    缩放.value = Math.max(0.28, Math.min(1, 可用宽 / 设计宽, 可用高 / 设计高));
  }

  onMounted(() => {
    量();
    window.addEventListener('resize', 量);
  });
  onUnmounted(() => window.removeEventListener('resize', 量));

  return { 缩放, 量 };
}
