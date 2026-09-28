<template>
  <TitleScreen v-if="当前页 === '标题'" @开始="开始" />
  <CreatorScreen v-else-if="当前页 === '创建'" @完成="当前页 = '主界面'" />
  <MainScreen v-else />
</template>

<script setup lang="ts">
// import 名必须是 ASCII: Vue 的模板编译器认不出非 ASCII 的标签名, 写成 `<标题 />`
// 会被当纯文本渲染, 绑定全丢, 而且只有生产构建才发作。详见 状态栏/App.vue 里的同一处注释。
import { useDataStore } from '../共用/数据';
import CreatorScreen from '../创建/App.vue';
import MainScreen from '../主界面/App.vue';
import TitleScreen from '../标题/App.vue';

type 页 = '标题' | '创建' | '主界面';

// 每次加载都从标题页起。刷新一下就回到这里 —— 这也是玩家重开一局的入口。
const 当前页 = ref<页>('标题');

/**
 * 「开始游戏」按下之后。
 *
 * 判据是变量里那个 `主角.已创建` —— 走过开局创建没有, 只有这一件事说了算。
 *
 * 早先这里拿 `getLastMessageId() === 0` 推, 是错的: 末楼只是消息条数, 跟选没选过
 * 身份是两回事。聊过几句又没走过创建的存档(老版本留下的、或者玩家自己接着往下写的)
 * 用末楼判就永远进不去创建页了。
 *
 * 读不到变量就当没走过 —— 宁可多问一次, 也好过把没创建过的玩家直接丢进主界面。
 */
function 开始() {
  let 建过 = false;
  try {
    建过 = !!useDataStore().data.主角.已创建;
  } catch {
    // 不在酒馆环境(开发期直接开 index.html)、或者变量还没起来
  }
  当前页.value = 建过 ? '主界面' : '创建';
}
</script>
