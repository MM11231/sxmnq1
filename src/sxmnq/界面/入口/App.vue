<template>
  <TitleScreen v-if="当前页 === '标题'" @开始="开始" />
  <CreatorScreen v-else-if="当前页 === '创建'" @完成="当前页 = '主界面'" />
  <MainScreen v-else />
</template>

<script setup lang="ts">
// import 名必须是 ASCII: Vue 的模板编译器认不出非 ASCII 的标签名, 写成 `<标题 />`
// 会被当纯文本渲染, 绑定全丢, 而且只有生产构建才发作。详见 主界面/App.vue 里的同一处注释。
import { useDataStore } from '../共用/数据';
import CreatorScreen from '../创建/App.vue';
import MainScreen from '../主界面/App.vue';
import TitleScreen from '../标题/App.vue';

type 页 = '标题' | '创建' | '主界面';

/**
 * 开局落在哪一页。
 *
 * 走过创建 (变量里 `主角.已创建` 为真) 就直接进主界面 —— **这条是修「重说」那个 bug 的**。
 *
 * 原先一律从标题页起, 想的是「刷新一下就是重开一局的入口」。但界面这个 iframe **不是只有
 * 刷新才会重建**: 点「重说」触发 `/regenerate`, 酒馆重渲染整条消息, 界面被整个重建一次,
 * 于是玩到一半的玩家被丢回标题页, 得再点一次「开始游戏」才回得来。2026-10-05 实测确认。
 *
 * 判据放在这里而不是写死 '标题': 重开一局的入口照样在 —— 新开一个聊天时 `stat_data`
 * 是重播的, `已创建` 为 false, 自然还从标题页走。两者不冲突。
 *
 * 读不到变量就当没建过 (跟下面「开始游戏」同一个态度): 宁可多问一次, 也好过把没创建过的
 * 玩家直接丢进主界面 —— 那一进去变量全是空的, 界面会报一堆错。
 */
function 开局页(): 页 {
  try {
    return useDataStore().data.主角.已创建 ? '主界面' : '标题';
  } catch {
    return '标题';
  }
}

const 当前页 = ref<页>(开局页());

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
