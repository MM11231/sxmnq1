// 独立预览入口 —— 把界面拿到普通浏览器里直接看。
//
// 它和卡里那个入口(src/sxmnq/index.ts)是**两套**, 别混:
//
//   - 卡里的: 什么都靠酒馆助手给 —— Vue/$/_ 被 webpack 配成 external, Mvu/getVariables
//     由扩展注入。所以它只能在酒馆的 iframe 里活, 静态托管打开是白屏(Vue is not defined)。
//   - 这个: 依赖全打进包里(webpack 对 src/预览/ 关掉了 externals), 酒馆全局由 酒馆桩.ts
//     自己挂。产物 dist/预览/index.html 是**单个自包含的 html**, 可以直接丢给静态托管。
//
// 代价说清楚: 桩的数据是写死的, 和酒馆里真实的变量、聊天对不上。所以这个入口只能看
// **样式和交互**, 不能当真跑。要真跑还是得进酒馆。
//
// 它不 import ../sxmnq/index.ts —— 那个文件在 import 期就会去问 getCurrentMessageId()
// 和 waitGlobalInitialized('Mvu'), 在预览里没有意义。这里自己挂载。
import './酒馆桩'; // 必须是第一个: ESM 按 import 顺序求值, 桩要先跑完

import '../sxmnq/global.css';
import App from './App.vue';

createApp(App).use(createPinia()).mount('#app');
