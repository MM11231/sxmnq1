import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const root = path.resolve(import.meta.dirname, '..');
const dependencies = process.env.WHITE_TOWER_DEPENDENCIES || path.join(root, 'node_modules');
const require = createRequire(path.join(dependencies, '..', 'package.json'));
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineScript = require('html-inline-script-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const AutoImport = (await import(pathToFileURL(require.resolve('unplugin-auto-import/webpack')).href)).default;


function config(name, entry, preview = false) {
  return {
    name, mode: 'production', context: root, entry: path.join(root, entry),
    output: { path: path.join(root, 'dist', name), filename: 'index.js', clean: false },
    experiments: { outputModule: true }, devtool: false,
    resolve: { extensions: ['.ts', '.tsx', '.js', '.vue', '.json'], modules: [dependencies, 'node_modules'], alias: { '@util': path.join(root, 'util'), '@': path.join(root, 'src'), 'vue$': require.resolve('vue/dist/vue.runtime.esm-bundler.js') } },
    resolveLoader: { modules: [dependencies] },
    module: { rules: [
      { test: /\.svg$/, type: 'asset/inline' },
      { test: /\.vue$/, loader: require.resolve('vue-loader') },
      { test: /\.tsx?$/, loader: require.resolve('ts-loader'), options: { transpileOnly: true, appendTsSuffixTo: [/\.vue$/], configFile: path.join(root, 'tsconfig.json') } },
      { test: /\.css$/, use: [require.resolve('vue-style-loader'), require.resolve('css-loader'), { loader: require.resolve('postcss-loader'), options: { postcssOptions: { config: false, plugins: [require('@tailwindcss/postcss')()] } } }] },
      { test: /\.scss$/, use: [require.resolve('vue-style-loader'), require.resolve('css-loader'), require.resolve('sass-loader')] },
      { test: /\.html$/, loader: require.resolve('html-loader') },
      { test: /\.txt$/, type: 'asset/source' },
    ] },
    externals: preview ? undefined : ({ request }, callback) => {
      const globals = { vue: 'Vue', lodash: '_', jquery: '$', zod: 'z', toastr: 'toastr', yaml: 'YAML' };
      if (request in globals) return callback(null, 'var ' + globals[request]);
      if (request.startsWith('https://')) return callback(null, 'module ' + request);
      callback();
    },
    plugins: [new VueLoaderPlugin(), AutoImport({ dts: false, imports: ['vue', 'pinia', { '@vueuse/core': ['useResizeObserver', 'useIntervalFn', 'watchIgnorable'] }, { lodash: [['default', '_']] }, { dedent: [['default', 'dedent']] }, { klona: ['klona'] }, { 'vue-final-modal': ['useModal'] }, { zod: ['z'] }, { yaml: [['*', 'YAML']] }] }), new webpack.DefinePlugin({ __VUE_OPTIONS_API__: false, __VUE_PROD_DEVTOOLS__: false, __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false }), new HtmlWebpackPlugin({ template: path.join(root, entry.replace(/index\.ts$/, 'index.html')), inject: 'body' }), new InlineScript()],
    optimization: { splitChunks: false }, performance: { hints: false },
  };
}
const schemaConfig = config('哨向模拟器/脚本/变量结构', 'src/哨向模拟器/脚本/变量结构/index.ts');
schemaConfig.target = ['web', 'es2020'];
schemaConfig.output.module = true;
schemaConfig.plugins = schemaConfig.plugins.filter(plugin => !(plugin instanceof HtmlWebpackPlugin) && !(plugin instanceof InlineScript));
await new Promise((resolve, reject) => webpack([config('预览', 'src/预览/index.ts', true), config('sxmnq', 'src/sxmnq/index.ts'), schemaConfig], (error, stats) => {
  if (error) return reject(error);
  const report = stats.toJson({ all: false, errors: true, warnings: true, children: true });
  for (const child of report.children || [report]) console.log(JSON.stringify({name:child.name,errors:child.errors?.slice(0,4),warnings:child.warnings?.slice(0,2)}));
  if (stats.hasErrors()) return reject(Error('构建失败'));
  fs.writeFileSync(path.join(root, 'dist/white-tower-build.txt'), stats.toString({ all: false, timings: true }));
  resolve();
}));
