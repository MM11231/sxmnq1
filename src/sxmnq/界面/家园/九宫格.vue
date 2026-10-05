<template>
  <div class="宫">
    <button
      v-for="格 in 格子们"
      :key="格.方位"
      class="宫__格"
      :class="[`is-${类名[格.类]}`, { 'is-空': !格.主 }]"
      :disabled="!格.可点"
      @click="emit('点', 格)"
    >
      <span class="宫__主">{{ 格.主 }}</span>
      <span v-if="格.副" class="宫__副">{{ 格.副 }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { 宫格 } from '../../家园/布局';
import type { 格类 } from '../../家园/房型';

defineProps<{ 格子们: 宫格[] }>();
const emit = defineEmits<{ 点: [宫格] }>();

/**
 * 格类 → CSS 类名。**必须过这一层映射, 不能直接拼 `is-${格.类}`。**
 *
 * 跟「Vue 组件标签名必须 ASCII」是同一类坑: 非 ASCII 的类名在 scss 里能编译,
 * 但一旦哪个环节没对上, 表现是「格子全变成一个颜色」而**不报错**。
 * 这里多写四行, 把不确定性挡在外面。
 */
const 类名: Record<格类, string> = {
  房间: 'room',
  床: 'bed',
  自由: 'free',
  门: 'door',
  路: 'road',
};
</script>

<style lang="scss" scoped>
/* 3×3 固定九格。数组顺序就是铺进来的顺序 —— 房型图已经按 方位序 排好了,
   顺序错了整张图会转个个儿, 所以 房型.test.mjs 专门测了那个顺序。

   九格用 aspect-ratio 撑成方的, 不写死高度: 三列宽度随容器走。 */
.宫 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;

  /* 边长 = min(容器宽, 容器高 - 上下那些东西), 然后居中。
     ★ 只写 `width: 100%` 是**不够**的 —— 格子的 aspect-ratio 是 1, 于是九宫格的高度
       恒等于它的宽度, 而宽度又跟着窗口走。窄屏(手机竖屏)看着没事, 一宽就炸:
       实测 700×450 的窗口里九宫格 631px 高, 可视区只有 244px, 要滑两屏。
       桌面酒馆的聊天区正是宽而矮 (卡里那个隐藏楼层脚本把 iframe 钉成铺满 #chat)。

     `100cqh` 是**所在页**(.界__页, 见 主界面/App.vue 的 container-type) 的内容盒高。
     减掉的 107px 是九宫格以外那些东西的总高, 逐项列在这儿, 改哪一项就跟着改这个数:
       卡片上下外边距 10+10 + 卡片上下内边距 12+12 + `.家园__头` 19 + 它的 margin 9
       + `.家园__注` 的 margin 9 + 它 15            ≈ 96
     取 107 而不是 96 是**故意留 11px 余量**: 上面几个数都跟着字号和行高走,
     量到的正好卡在边界上时, 亚像素的零头会让页面冒出一条滚动条。
     实测: 400×780 与 360×640 上这个上限**不生效**(格子仍是 350 / 310, 与改前逐像素相同),
     只有 320×560 及更矮的窗口才真正开始缩。 */
  width: min(100%, calc(100cqh - 107px));
  margin: 0 auto;

  &__格 {
    position: relative;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 4px;
    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(255, 255, 255, 0.035);
    color: #cfd7e0;
    font-family: inherit;
    font-size: 0.8em;
    line-height: 1.25;
    text-align: center;
    overflow: hidden;
    cursor: pointer;
    transition:
      background 0.18s ease,
      border-color 0.18s ease;

    &:disabled {
      cursor: default;
    }

    &:not(:disabled):hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }

  /* 主标签占满剩余空间, 长名字(如「助眠香薰」)缩一号也不会顶破格子 */
  &__主 {
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  &__副 {
    color: #6f7a87;
    font-size: 0.82em;
    white-space: nowrap;
  }

  /* 空格子(自由/空床)的字压暗一档, 与摆着东西的一眼分得开。
     ★ 注意是 `&__格.is-空` 而不是 `&.is-空`: `is-空` 绑在 `<button class="宫__格">`
       上 (见模板的 :class), 容器 `.宫` 身上从来没有这个类。写成 `&.is-空` 会编成
       `.宫.is-空 .宫__主`, 恒不匹配 —— 而且构建、测试、浏览器探针**全都不报错**,
       只是这条规则永远不生效。同段的 `.is-bed/.is-free/.is-door/.is-road`
       用的都是 `&__格.` 前缀, 照它们写。 */
  &__格.is-空 .宫__主 {
    color: #55606d;
  }

  /* 「路」: 纯占位, 没有任何交互。L2 那三格连成一条横向过道。
     底色比别的格子深一档、不描边, 让它是「地上」而不是「一张卡」。 */
  &__格.is-road {
    border-color: transparent;
    background: rgba(255, 255, 255, 0.05);
    cursor: default;
  }

  /* 床 = 蓝, 自由 = 绿, 门 = 黄, 房间 = 卡片样式 (spec §4.1)。
     颜色落在边框 + 约 10% 透明度的底色上 —— 九格全铺满会太吵。 */
  &__格.is-bed {
    border-color: rgba(127, 227, 255, 0.45);
    background: rgba(127, 227, 255, 0.1);
  }

  &__格.is-free {
    border-color: rgba(127, 214, 160, 0.4);
    background: rgba(127, 214, 160, 0.09);
  }

  &__格.is-door {
    border-color: rgba(255, 215, 110, 0.45);
    background: rgba(255, 215, 110, 0.1);
  }

  /* 房间卡 (L2 才有): 沿用原来的卡片样式, 下钻的 ▶ 在副标题里 */
  &__格.is-room {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.045);
    color: #eef3f8;
    font-weight: 600;
  }
}
</style>
