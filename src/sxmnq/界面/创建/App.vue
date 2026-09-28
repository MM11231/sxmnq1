<template>
  <div class="创">
    <div class="创__晕" />

    <div class="创__中" :style="{ paddingTop: `${顶栏高}px` }">
      <div class="创__台" :style="{ transform: `scale(${缩放})` }">
        <div class="创__文">
          <div class="创__署">
            <span>开局创建</span>
          </div>

          <div class="创__框">
            <p class="创__空">这一页还没做</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { use合窗 } from '../共用/合窗';
import { use顶栏高 } from '../共用/量顶栏';

// 尺寸纪律同标题页: 画布固定像素, 相对量只有 JS 算出来的那个缩放系数。
// 详见 共用/合窗.ts。
const 顶栏高 = use顶栏高();
const { 缩放, 量 } = use合窗(340, 420, () => 顶栏高.value);
watch(顶栏高, 量);
</script>

<style lang="scss" scoped>
.创 {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(168deg, #131922 0%, #10151c 46%, #0a0e13 100%);
  color: #d8dee6;

  &__晕 {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(58% 42% at 26% 14%, rgba(127, 227, 255, 0.07), transparent 70%);
  }

  &__中 {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  &__台 {
    width: 340px;
    height: 420px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transform-origin: center center;
  }

  &__文 {
    width: 340px;
  }

  &__署 {
    margin-bottom: 18px;
    opacity: 0;
    animation: th-rise 0.8s 0.1s ease-out both;

    span {
      color: #8e99a6;
      font-size: 13px;
      letter-spacing: 0.3em;
      text-indent: 0.3em;
    }
  }

  &__框 {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 300px;
    padding: 20px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.02);
    opacity: 0;
    animation: th-rise 0.8s 0.24s ease-out both;
  }

  &__空 {
    margin: 0;
    color: #4d5866;
    font-size: 13px;
    letter-spacing: 0.1em;
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
</style>
