import { type ModuleConfig } from '/@/cool';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '../../styles/index.scss';
import './static/css/index.scss';
import { t } from '/#/i18n';
import { useTheme } from './hooks';
import { themeBrandPresets } from '/@/styles/runtime-design';

export default (): ModuleConfig => {
	return {
		enable: true,
		order: 99,
		toolbar: {
			component: import('./components/theme.vue'),
			h5: false
		},
		options: {
			name: 'default',

			// 自定义主题色
			// color: "#4165d7",

			// 主题列表
			list: themeBrandPresets.map(item => ({
				label: t(item.labelKey),
				name: item.name,
				color: item.color
			}))
		},
		install() {
			useTheme();
		},

		label: '主题',
		description: '自定义主色、菜单分组、暗黑模式',
		author: 'COOL',
		version: '1.0.0',
		updateTime: '2024-07-22'
	};
};
