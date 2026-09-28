/* eslint-disable */
// 测试文件的共用前导。用法 —— 在 .test.mjs 的**第一行**写:
//
//     import '../测试钩子.mjs';          // 按相对路径调整层级
//
// 静态 import 会在本文件主体之前求值, 所以下面这些全局量和解析钩子
// 一定赶在测试自己去 `await import(...)` 之前就位。顺序不能反。
//
// 工程里没有 vitest/jest, 测试就是 node 直接跑 .mjs。这带来两件麻烦事:
//
//   ① **Node 的原生 ESM 解析器不补扩展名。**
//      源码里写的是 `import { 等级值 } from './分档'` —— webpack 和 tsc 都会自己
//      补上 `.ts`, Node 不会, 直接 ERR_MODULE_NOT_FOUND。
//      和 dump_schema.ts 用的是同一套钩子。
//
//   ② **schema.ts 用的是裸 `z` / `_`。**
//      它们是 webpack 的 auto-import 注入的, 预览里则由酒馆桩挂到全局。
//      node 里两个都没有, 所以得先补上再 import schema, 否则
//      `ReferenceError: z is not defined` —— 而且栈会指向 schema.ts 内部,
//      看起来像是 schema 自己坏了。
//
// 不需要 schema 的测试也尽管 import 本文件: 多设两个全局量是白给的。
import module from 'node:module';
import path from 'node:path';

module.registerHooks({
  resolve(说明符, 上下文, 下一个) {
    if (说明符.startsWith('.') && !path.extname(说明符)) {
      for (const 后缀 of ['.ts', '/index.ts']) {
        try {
          return 下一个(说明符 + 后缀, 上下文);
        } catch {
          // 这个后缀不存在, 试下一个
        }
      }
    }
    return 下一个(说明符, 上下文);
  },
});

globalThis.z = (await import('zod')).z;
globalThis._ = (await import('lodash')).default;
