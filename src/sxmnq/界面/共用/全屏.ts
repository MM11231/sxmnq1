import { onMounted, onUnmounted, ref } from 'vue';

/** 与诸天便携旅店相同：让界面文档进入浏览器原生全屏。 */
export function use全屏() {
  const 全屏 = ref(false);
  const 全屏错误 = ref('');
  function 同步() {
    全屏.value = document.fullscreenElement === document.documentElement;
    window.dispatchEvent(new Event('resize'));
  }
  async function 切换全屏() {
    全屏错误.value = '';
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      同步();
    } catch (error) {
      全屏错误.value = '浏览器未允许全屏，请直接点击全屏按钮重试，或检查浏览器的全屏权限。';
      console.warn('[白塔] 浏览器全屏请求失败', error);
    }
  }
  onMounted(() => {
    // 清除上一版铺满酒馆页面的样式，恢复酒馆原有布局。
    if (window.parent !== window) {
      try {
        const doc = window.parent.document;
        doc.getElementById('white-tower-fullscreen')?.remove();
        doc.body.classList.remove('white-tower-fullscreen');
      } catch { /* 独立预览无需操作父页面。 */ }
    }
    document.addEventListener('fullscreenchange', 同步);
    同步();
  });
  onUnmounted(() => document.removeEventListener('fullscreenchange', 同步));
  return { 全屏, 全屏错误, 切换全屏 };
}
