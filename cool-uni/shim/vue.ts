/**
 * 文件职责：为 uni-app 构建阶段补齐 vue 入口缺失的兼容导出；不负责替代 Vue 运行时实现或修改业务逻辑；依赖官方 vue runtime bundler 入口；维护重点是只补当前构建链路确实缺失的导出，避免扩散到更多私有运行时接口。
 */
export * from "vue/dist/vue.runtime.esm-bundler.js";
import {
	createApp,
	onActivated,
	onDeactivated,
} from "vue/dist/vue.runtime.esm-bundler.js";

// uni-app build 仍会从 `vue` 顶层导入该符号，当前官方入口未导出它。
// 这里只提供和运行时一致的布尔缺省值，避免破坏正常 CSR 行为。
export const isInSSRComponentSetup = false;

// uni-h5 仍会从 `vue` 顶层读取 keep-alive 前置钩子。
// 官方 runtime bundler 未公开这两个符号，这里退化到最接近的 activated/deactivated 语义，
// 以保持当前 H5 构建链与页面激活链可用。
export const onBeforeActivate = onActivated;
export const onBeforeDeactivate = onDeactivated;
export const createVueApp = createApp;

type HookTarget = Record<string, unknown> | null | undefined;
type HookHandler = ((...args: any[]) => any) & {
	__weh?: (...args: any[]) => any;
};

/**
 * 为 uni-app 生命周期注册提供最小兼容实现。
 * 这里只负责把 hook 收集到组件实例对应的生命周期数组，不复制 Vue 私有的 currentInstance/errorHandling 行为。
 */
export function injectHook(
	type: string,
	hook: HookHandler,
	target?: HookTarget,
	prepend = false
) {
	if (!target || typeof hook !== "function") {
		return;
	}

	const typedTarget = target as Record<string, HookHandler[] | undefined>;
	const hooks = typedTarget[type] || (typedTarget[type] = []);
	const wrappedHook = hook.__weh || (hook.__weh = (...args: any[]) => hook(...args));

	if (prepend) {
		hooks.unshift(wrappedHook);
	} else {
		hooks.push(wrappedHook);
	}

	return wrappedHook;
}
