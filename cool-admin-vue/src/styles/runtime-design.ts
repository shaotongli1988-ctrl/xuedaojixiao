/**
 * 文件职责：承载前端运行时仍需以 TS 常量表达的 UI 设计系统事实，如主题预设、运行时混色基准和上传色盘映射。
 * 不负责页面布局、组件样式实现或 Element Plus 变量映射。
 * 关键依赖：plugins/theme、plugins/upload、登录验证码等运行时消费者。
 * 维护重点：凡是必须以 JS/TS 参与计算的视觉真值，都应先收敛到这里，再由业务模块消费。
 */

export const themeBrandPresets = [
	{
		name: 'default',
		labelKey: '默认',
		color: '#4165d7'
	},
	{
		name: 'cuilv',
		labelKey: '翠绿',
		color: '#51c21a'
	},
	{
		name: 'zitan',
		labelKey: '紫檀',
		color: '#d0378d'
	},
	{
		name: 'jincheng',
		labelKey: '金橙',
		color: '#ffa500'
	},
	{
		name: 'yingtao',
		labelKey: '樱桃',
		color: '#ff69b4'
	},
	{
		name: 'bohe',
		labelKey: '薄荷',
		color: '#3eb489'
	},
	{
		name: 'qinghui',
		labelKey: '青灰',
		color: '#708090'
	},
	{
		name: 'shanhu',
		labelKey: '珊瑚',
		color: '#ff4500'
	}
] as const;

export const themeBlendTargets = {
	light: '#ffffff',
	dark: '#131313'
} as const;

export const authRuntimePalette = {
	captchaColor: '#314154'
} as const;

export const uploadTypeColorTokens = {
	image: 'var(--app-upload-color-image)',
	video: 'var(--app-upload-color-video)',
	audio: 'var(--app-upload-color-audio)',
	word: 'var(--app-upload-color-word)',
	excel: 'var(--app-upload-color-excel)',
	ppt: 'var(--app-upload-color-ppt)',
	pdf: 'var(--app-upload-color-pdf)',
	rar: 'var(--app-upload-color-archive)',
	file: 'var(--app-upload-color-file)'
} as const;
