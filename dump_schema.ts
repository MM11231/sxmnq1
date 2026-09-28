/* eslint-disable */
// @ts-nocheck
import _ from 'lodash';
import fs from 'node:fs';
import path from 'node:path';
import module from 'node:module';
import z from 'zod';

/**
 * 让 Node 认得不带扩展名的相对导入。
 *
 * schema.ts 里写的是 `import { 好感分档 } from './分档'` —— webpack 和 tsc 都会自己
 * 补上 .ts, Node 这个原生 ESM 解析器不会, 直接 ERR_MODULE_NOT_FOUND。
 *
 * 这个错**不会让命令失败**: 下面 catch 住只打一行 console.error, 进程照样退 0。
 * 所以坏掉的时候看不出来, 只是 schema.json 悄悄停在旧版本上, 编辑器跟着误报。
 *
 * 必须在下面 import() 之前注册 —— registerHooks 只影响注册之后的解析。
 */
module.registerHooks({
  resolve(说明符, 上下文, 下一个) {
    // 只管相对路径。裸说明符(lodash、zod)是 node_modules 的事, 别插手。
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

fs.globSync('src/**/schema.ts').forEach(async schema_file => {
  try {
    globalThis._ = _;
    globalThis.z = z;
    const module = await import(
      (process.platform === 'win32' ? 'file://' : '') + path.resolve(import.meta.dirname, schema_file)
    );
    if (_.has(module, 'Schema')) {
      // let 不是 const: 下面要把函数型的 Schema 调用成对象。原来写的 const 再赋值,
      // 一跑到这儿就是 TypeError —— 同样被 catch 吞掉、只留一行 console.error。
      let schema = _.get(module, 'Schema');
      if (_.isFunction(schema)) {
        schema = schema();
      }
      fs.writeFileSync(
        path.join(path.dirname(schema_file), 'schema.json'),
        JSON.stringify(z.toJSONSchema(schema, { io: 'input', reused: 'ref' }), null, 2),
      );
    }
  } catch (e) {
    console.error(`生成 '${schema_file}' 对应的 schema.json 失败: ${e}`);
  }
});
