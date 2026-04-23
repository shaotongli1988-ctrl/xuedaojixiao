/// <reference types="vite/client" />
/// <reference types="@dcloudio/types/uni-app/index.d.ts" />
/// <reference types="../build/cool/eps.d.ts" />
/// <reference types="../uni_modules/cool-ui/types/index.d.ts" />

declare module "*.vue" {
	import { DefineComponent } from "vue";
	const component: DefineComponent<Record<string, never>, Record<string, never>, any>;
	export default component;
}

declare module "virtual:ctx";
declare module "virtual:eps";
declare module "@dcloudio/vite-plugin-uni";
declare module "vue/dist/vue.runtime.esm-bundler.js";
