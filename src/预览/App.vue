<template>
  <div class="览">
    <div class="览__台">
      <MainScreen v-if="页 === '主界面'" />
      <CreatorScreen v-else-if="页 === '创建'" />
      <TitleScreen v-else @开始="开始" />
    </div>

    <nav class="览__条">
      <span class="览__名">预览</span>
      <button
        v-for="项 in 页表"
        :key="项"
        class="览__钮"
        :class="{ 'is-开': 页 === 项 }"
        @click="页 = 项"
      >
        {{ 项 }}
      </button>
      <span class="览__隙" />
      <button class="览__钮 is-层" @click="换层">末楼 {{ 末楼 }}</button>
    </nav>
  </div>
</template>

<script setup lang="ts">
// 预览壳。只在这个入口里存在 —— 卡里跑的是 界面/入口/App.vue 那个路由器。
//
// 为什么不让这个壳直接用路由器: 路由器只从标题页出发, 要去创建页得靠 getLastMessageId()
// 返回 0。而预览想看的是**三个页面各自长什么样**, 得能一步点过去。所以这里直接挂三页,
// 「开始游戏」的去向自己算 —— 规则和 界面/入口/App.vue 里那三行一致, 改了那边记得改这里。
//
// 注意 import 名必须是 ASCII: Vue 模板编译器认不出非 ASCII 的标签名, 写成 `<标题页 />`
// 会被当纯文本渲染、绑定全丢, 而且只有生产构建才发作。
import { 末楼 } from './酒馆桩';
import CreatorScreen from '../sxmnq/界面/创建/App.vue';
import MainScreen from '../sxmnq/界面/主界面/App.vue';
import TitleScreen from '../sxmnq/界面/标题/App.vue';

const 页表 = ['标题', '创建', '主界面'] as const;
const 页 = ref<(typeof 页表)[number]>('标题');

function 开始() {
  页.value = 末楼.value === 0 ? '创建' : '主界面';
}

/** 末楼 0 = 这局只有开场白, 点「开始游戏」该去创建角色; 3 = 已经在局中, 直接进主界面。 */
function 换层() {
  末楼.value = 末楼.value === 0 ? 3 : 0;
}
</script>

<!-- 不加 scoped: toastr 那条是 酒馆桩.ts 挂到 body 上的, 在组件外面, scoped 够不着。
     lang="scss" 是必须的 —— 下面用了 `&` 嵌套。

     动画名一律 ASCII。Vue 会重写 scoped 样式里的 @keyframes 名, 非 ASCII 的容易被漏掉,
     结果就是引用不到、动画不跑, 而且不报错。这块虽然没 scoped, 但同一个坑没必要再踩一次。 -->
<style lang="scss">
.览 {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0b0f14;
}

/* 台子比窗口矮一条 —— 底下的预览条要占位。合窗.ts 量的是 window.innerHeight, 会把这
   一条也算进去, 于是缩放算得略大一点点。手机竖屏下 320×420 本来就装得下, 缩放恒为 1,
   所以这点误差碰不到。真碰到的只有极窄的窗口, 那时候也看不出来。 */
.览__台 {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.览__条 {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: #141a22;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

.览__名 {
  margin-right: 4px;
  color: #4d5866;
  font-size: 11px;
  letter-spacing: 0.16em;
}

.览__隙 {
  flex: 1;
}

.览__钮 {
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.04);
  color: #8e99a6;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;

  &.is-开 {
    border-color: rgba(127, 227, 255, 0.4);
    background: rgba(127, 227, 255, 0.14);
    color: #a8ecff;
  }

  &.is-层 {
    color: #6f7a87;
    font-variant-numeric: tabular-nums;
  }
}

/* 弹出来的提示。挂到 body 上, 所以不能用 scoped。 */
.览吐 {
  position: fixed;
  right: 12px;
  bottom: 56px;
  z-index: 999;
  max-width: min(78vw, 340px);
  padding: 9px 13px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 9px;
  background: #1b222c;
  color: #cfd7e0;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.5);
  animation: th-toast-in 0.2s ease-out both;

  &.is-错 {
    border-color: rgba(255, 138, 128, 0.4);
    color: #ffb4ac;
  }

  &.is-成 {
    border-color: rgba(127, 227, 255, 0.36);
    color: #a8ecff;
  }

  &.is-警 {
    border-color: rgba(255, 213, 128, 0.36);
    color: #ffd580;
  }
}

@keyframes th-toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
