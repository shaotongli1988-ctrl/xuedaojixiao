import uni from "@dcloudio/vite-plugin-uni"; // ！此依赖不能安装
import fs from "node:fs";
import path from "path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { cool } from "@cool-vue/vite-plugin";
import { proxy } from "./config/proxy";

function resolve(dir: string) {
	return path.resolve(__dirname, dir);
}

function buildLocaleModuleLiteral() {
	const localeDir = resolve("./locale");
	const localeFiles = fs
		.readdirSync(localeDir)
		.filter((file) => file.endsWith(".json"))
		.sort();

	if (!localeFiles.length) {
		return "const locales = {}";
	}

	const importLines = localeFiles.map(
		(file, index) => `import __uniLocale${index} from "/locale/${file}";`
	);
	const objectLines = localeFiles.map(
		(file, index) =>
			`  "./locale/${file}": { default: __uniLocale${index} }`
	);

	return `${importLines.join("\n")}\nconst locales = {\n${objectLines.join(",\n")}\n}`;
}

function patchUniGlobEagerForVite5(): Plugin {
	const localeModuleLiteral = buildLocaleModuleLiteral();

	return {
		name: "patch-uni-glob-eager-for-vite5",
		enforce: "post",
		transform(code) {
			if (
				!code.includes("import.meta.globEager") &&
				!code.includes("import.meta.glob('./locale/*.json'")
			) {
				return null;
			}

			const nextCode = code.replace(
				/const locales = import\.meta\.glob(?:Eager)?\((["'])\.\/locale\/\*\.json\1(?:,\s*\{[^)]*\})?\)/,
				localeModuleLiteral
			);

			if (nextCode === code) {
				return null;
			}

			return {
				code: nextCode,
				map: null,
			};
		},
	};
}

// https://vitejs.dev/config

export default defineConfig(() => {
	// This project keeps the real Uni entry files at the repo root and mirrors them into src/.
	// Force Uni's input dir to the real source root so h5 main.ts transforms hit the mounted entry.
	process.env.UNI_INPUT_DIR = __dirname;
	process.env.VITE_ROOT_DIR = __dirname;

	return {
		plugins: [
			patchUniGlobEagerForVite5(),
			uni(),
			cool({
				type: "app",
				proxy,
			}),
		],
		server: {
			port: 9900,
			proxy,
			hmr: {
				overlay: true,
			},
		},
		resolve: {
			alias: [
				{
					find: /^vue$/,
					replacement: resolve("./shim/vue.ts"),
				},
				{
					find: "/@",
					replacement: resolve("./"),
				},
				{
					find: "/$",
					replacement: resolve("./uni_modules/"),
				},
			],
		},
	};
});
