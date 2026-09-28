import { waitUntil } from 'async-wait-until';
// 挂的是「入口」而不是主界面 —— 它负责决定现在该显示标题页、创建页还是主界面
// (见 界面/入口/App.vue)。
import App from './界面/入口/App.vue';
import './global.css';

// 界面只认第一楼。
//
// 卡里的正则把**每一条**消息都换成界面 —— 它没别的办法知道哪条是第一楼。于是第二楼往后
// 每层都会白建一个界面出来, 而它们马上会被「隐藏楼层」脚本删掉。这里提前止损: 不是
// 第一楼就在挂载 Vue 之前把自己的楼层摘掉, 省下一整轮挂载。
//
// `typeof` 兜一下是因为酒馆助手那套全局在别处不一定存在(比如构建期做静态检查时)。
const 楼层号 = typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : 0;

if (楼层号 !== 0) {
  try {
    $(frameElement).closest('.mes').remove();
  } catch {
    // 拿不到 frameElement 就算了, 大不了多挂一个界面, 由脚本兜底删掉。
  }
} else {
  $(async () => {
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));
    createApp(App).use(createPinia()).mount('#app');
  });
}
