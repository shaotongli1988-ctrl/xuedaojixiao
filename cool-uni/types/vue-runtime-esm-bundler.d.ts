/**
 * 文件职责：为 cool-uni 的构建兼容层补齐 `vue/dist/vue.runtime.esm-bundler.js` 的类型声明；
 * 不负责扩展 Vue 公共 API，也不改变运行时行为；
 * 依赖现有 `vue` 类型导出；维护重点是只服务于 `shim/vue.ts` 的编译通过。
 */
declare module "vue/dist/vue.runtime.esm-bundler.js" {
	export * from "vue";
}
