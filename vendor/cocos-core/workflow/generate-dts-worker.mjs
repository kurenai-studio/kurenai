// generate-dts 的 worker 引导文件。
//
// 为什么单独用一个 .mjs：worker 入口必须是 Node 原生认识的扩展名。直接把 .ts 作为 worker 入口
// 依赖「tsx 对 worker_threads 的自动 patch」或「execArgv 挂 tsx」，这两者在部分环境（如 CI）
// 下都不生效，会报 ERR_UNKNOWN_FILE_EXTENSION ".ts"。这里入口是 .mjs（Node 原生支持），
// 先用 tsx 的编程式 API 显式注册 loader，再动态 import 真正的 .ts 逻辑——跨环境确定生效。
//
// generate-dts.ts 在 worker 中 isMainThread=false，import 后会直接执行 generate()。
import { register } from 'tsx/esm/api';

register();
await import('./generate-dts.ts');
