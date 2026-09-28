<template>
  <TitleScreen v-if="当前页 === '标题'" @开始="开始" />
  <CreatorScreen v-else-if="当前页 === '创建'" />
  <MainScreen v-else />
</template>

<script setup lang="ts">
// import 名必须是 ASCII: Vue 的模板编译器认不出非 ASCII 的标签名, 写成 `<标题 />`
// 会被当纯文本渲染, 绑定全丢, 而且只有生产构建才发作。详见 状态栏/App.vue 里的同一处注释。
import CreatorScreen from '../创建/App.vue';
import MainScreen from '../主界面/App.vue';
import TitleScreen from '../标题/App.vue';

type 页 = '标题' | '创建' | '主界面';

// 每次加载都从标题页起。刷新一下就回到这里 —— 这也是玩家重开一局的入口。
const 当前页 = ref<页>('标题');

/**
 * 「开始游戏」按下之后。
 *
 * 最新楼层是 0, 说明这局只有开场白、剧情还没推进过 —— 该去创建角色。
 * 否则说明已经在局中, 直接进主界面接着看。
 *
 * `getLastMessageId` 不在酒馆里(开发期直接开 index.html)时不存在, 兜 0 当作新局。
 */
function 开始() {
  let 末 = 0;
  try {
    末 = getLastMessageId();
  } catch {
    // 不在酒馆环境, 当新局处理
  }
  当前页.value = 末 === 0 ? '创建' : '主界面';
}
</script>
