import { onMounted, onUnmounted, ref } from 'vue';

/**
 * 量出酒馆工具栏压住了界面多少, 供各页把自己的内容让下去。
 *
 * 酒馆的工具栏是 fixed 浮在聊天区上面的, 不吃布局 —— 不主动让开的话它会压住我们的顶栏。
 * 移动端是 `#top-bar`, 桌面端是 `#top-settings-holder`, 谁在就让谁。
 *
 * 让开多少 = 工具栏的底 − **界面自己的顶**。不能直接拿工具栏的底当重叠量: 聊天区本来就
 * 不从屏幕顶端开始, 那样会白白多让出一块空白。
 *
 * 拿不到父窗口(跨域, 或者开发期直接开 index.html)时返回 0, 当作没有工具栏。
 */
export function use顶栏高() {
  const 顶栏高 = ref(0);

  function 量() {
    try {
      const 父档 = window.parent.document;
      const 界顶 = frameElement ? frameElement.getBoundingClientRect().top : 0;
      for (const 选 of ['#top-bar', '#top-settings-holder']) {
        const 元 = 父档.querySelector(选);
        if (!元) continue;
        const 框 = 元.getBoundingClientRect();
        if (框.height > 0) {
          顶栏高.value = Math.max(0, Math.round(框.bottom - 界顶));
          return;
        }
      }
      顶栏高.value = 0;
    } catch {
      // 跨域或没有父窗口, 就当没有工具栏
    }
  }

  onMounted(() => {
    量();
    window.addEventListener('resize', 量);
    // 顶栏高度不是只有 resize 才会变(切全屏、收起侧栏、手机地址栏收放)。
    const 计时 = setInterval(量, 2000);
    onUnmounted(() => clearInterval(计时));
  });
  onUnmounted(() => window.removeEventListener('resize', 量));

  return 顶栏高;
}
