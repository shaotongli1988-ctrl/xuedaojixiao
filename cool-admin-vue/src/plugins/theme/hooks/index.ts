import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { module, storage } from '/@/cool';
import { useBase } from '/$/base';
import { useDark } from '@vueuse/core';
import { mix } from '../utils';
import { assign } from 'lodash-es';
import { config } from '/@/config';
import { themeBlendTargets } from '/@/styles/runtime-design';

export const useTheme = defineStore('theme', () => {
	const { app } = useBase();
	const isDark = useDark();
	const { options } = module.get('theme');

	// 当前主题
	const theme = reactive<Theme>(
		storage.get('theme') ||
			assign(
				{
					isGroup: config.app.menu.isGroup,
					transition: config.app.router.transition
				},
				options
			)
	);

	// 主题列表
	const themes = ref(options.list);

	// 主题色
	const color = computed(() => theme.color);

	// 设置主题
	function setTheme({ color, name, isGroup, transition, dark }: Theme) {
		// 设置暗黑模式
		if (dark !== undefined) {
			isDark.value = dark;
		}

		// 主题配置
		const theme = storage.get('theme') || {};

		// 变量前缀
		const pre = '--el-color-primary';

		// 白色混合色
		const mixWhite = themeBlendTargets.light;

		// 黑色混合色
		const mixBlack = themeBlendTargets.dark;

		// 元素
		const el = document.documentElement;

		function setRootVar(name: string, value: string) {
			el.style.setProperty(name, value);
		}

		function setBrandSemanticTokens(nextColor: string) {
			const lightMixTarget = isDark.value ? mixBlack : mixWhite;
			const darkMixTarget = isDark.value ? mixWhite : mixBlack;
			const softColor = mix(nextColor, lightMixTarget, isDark.value ? 0.76 : 0.88);
			const lineColor = mix(nextColor, lightMixTarget, isDark.value ? 0.52 : 0.7);
			const emphasisColor = mix(nextColor, darkMixTarget, isDark.value ? 0.18 : 0.12);

			setRootVar(
				'--foundation-color-brand-100',
				mix(nextColor, lightMixTarget, isDark.value ? 0.86 : 0.92)
			);
			setRootVar(
				'--foundation-color-brand-200',
				mix(nextColor, lightMixTarget, isDark.value ? 0.78 : 0.82)
			);
			setRootVar(
				'--foundation-color-brand-300',
				mix(nextColor, lightMixTarget, isDark.value ? 0.68 : 0.68)
			);
			setRootVar('--foundation-color-brand-500', nextColor);
			setRootVar(
				'--foundation-color-brand-700',
				mix(nextColor, darkMixTarget, isDark.value ? 0.16 : 0.1)
			);
			setRootVar(
				'--foundation-color-brand-900',
				mix(nextColor, darkMixTarget, isDark.value ? 0.56 : 0.54)
			);
			setRootVar('--foundation-color-brand-soft', softColor);

			setRootVar('--app-accent-brand', nextColor);
			setRootVar('--app-accent-brand-soft', softColor);
			setRootVar('--app-border-hover', lineColor);
			setRootVar('--app-text-emphasis', emphasisColor);
			setRootVar('--app-chart-series-brand', nextColor);
		}

		// 主题
		if (name) {
			const item = options.list.find(e => e.name == name);

			if (item) {
				if (!color) {
					color = item.color;
				}
				document.body?.setAttribute('class', `theme-${name}`);
			}

			theme.name = name;
		}

		// 设置主色
		if (color) {
			setRootVar(pre, color);

			// 设置辅色
			for (let i = 1; i < 10; i += 1) {
				if (isDark.value) {
					setRootVar(`${pre}-light-${i}`, mix(color, mixBlack, i * 0.1));
					setRootVar(`${pre}-dark-${i}`, mix(color, mixWhite, i * 0.1));
				} else {
					setRootVar(`${pre}-light-${i}`, mix(color, mixWhite, i * 0.1));
					setRootVar(`${pre}-dark-${i}`, mix(color, mixBlack, i * 0.1));
				}
			}

			setBrandSemanticTokens(color);

			theme.color = color;
		}

		// 菜单分组显示
		if (isGroup !== undefined) {
			theme.isGroup = isGroup;
			app.set({
				menu: {
					isGroup
				}
			});
		}

		// 转场动画
		if (transition !== undefined) {
			theme.transition = transition;
			app.set({
				router: {
					transition
				}
			});
		}

		storage.set('theme', theme);
	}

	// 切换暗黑模式
	function changeDark(el: Element, isDark: boolean, cb: () => void) {
		// @ts-ignore
		const transition = document.startViewTransition(() => {
			cb();
		});

		transition.ready.then(() => {
			const rect = el.getBoundingClientRect();
			const x = rect.left + rect.width / 2;
			const y = rect.top + rect.height / 2;
			const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
			const clipPath = [
				`circle(0 at ${x}px ${y}px)`,
				`circle(${endRadius}px at ${x}px ${y}px)`
			];
			document.documentElement.animate(
				{
					clipPath: isDark ? clipPath.reverse() : clipPath
				},
				{
					duration: 400,
					pseudoElement: isDark
						? '::view-transition-old(root)'
						: '::view-transition-new(root)'
				}
			);
		});
	}

	// 初始化
	setTheme(theme);

	return {
		isDark,
		color,
		theme,
		themes,
		setTheme,
		changeDark
	};
});
