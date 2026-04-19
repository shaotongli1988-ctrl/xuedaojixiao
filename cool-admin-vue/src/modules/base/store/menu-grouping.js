/**
 * 负责绩效技术挂载组的运行态导航归组与图标归一化。
 * 不负责后端 menu.json 生产，不改写权限语义或页面内部业务逻辑。
 * 维护重点：一级域数量、目标&计划归属，以及旧路由的兼容可达性不能回退。
 */

import { orderBy } from 'lodash-es';

export const PERFORMANCE_ROOT_PATH = '/performance';

const performanceDomainGroups = [
	{
		key: 'performance',
		label: '绩效中心',
		icon: 'icon-home',
		paths: [
			'/data-center/dashboard',
			'/performance/my-assessment',
			'/performance/initiated',
			'/performance/pending',
			'/performance/indicator-library',
			'/performance/feedback',
			'/performance/suggestion',
			'/performance/pip',
			'/performance/promotion',
			'/performance/salary'
		]
	},
	{
		key: 'workbench',
		label: '工作台',
		icon: 'icon-workbench',
		paths: ['/performance/workbench']
	},
	{
		key: 'talent',
		label: '人才中心',
		icon: 'icon-user',
		paths: [
			'/performance/recruitment-center',
			'/performance/recruit-plan',
			'/performance/job-standard',
			'/performance/resumePool',
			'/performance/interview',
			'/performance/talentAsset',
			'/performance/hiring',
			'/performance/course',
			'/performance/course-learning',
			'/performance/capability',
			'/performance/certificate'
		]
	},
	{
		key: 'goal-plan',
		label: '目标&计划',
		icon: 'icon-data-board',
		children: [
			{
				type: 'page',
				sourcePath: '/performance/goals',
				label: '目标&计划总览',
				icon: 'icon-data-board'
			},
			{
				type: 'group',
				key: 'teacher-channel',
				label: '班主任化',
				icon: 'icon-user-filled',
				paths: [
					'/performance/teacher-channel/dashboard',
					'/performance/teacher-channel/teacher',
					'/performance/teacher-channel/todo',
					'/performance/teacher-channel/class'
				]
			}
		]
	},
	{
		key: 'office',
		label: '行政协同',
		icon: 'icon-folder-opened',
		paths: [
			'/performance/office/annual-inspection',
			'/performance/office/honor',
			'/performance/office/publicity-material',
			'/performance/office/design-collab',
			'/performance/office/express-collab',
			'/performance/office/document-center',
			'/performance/office/knowledge-base',
			'/performance/office/vehicle',
			'/performance/office/intellectual-property',
			'/performance/meeting',
			'/performance/contract'
		]
	},
	{
		key: 'procurement-asset',
		label: '采购&资产',
		icon: 'icon-set',
		children: [
			{
				type: 'group',
				key: 'procurement-workspace',
				label: '采购工作台',
				icon: 'icon-workbench',
				paths: [
					'/performance/purchase-order',
					'/performance/purchase-inquiry',
					'/performance/purchase-approval',
					'/performance/purchase-execution',
					'/performance/purchase-receipt',
					'/performance/purchase-report'
				]
			},
			{
				type: 'page',
				sourcePath: '/performance/supplier'
			},
			{
				type: 'page',
				sourcePath: '/performance/asset/procurement',
				label: '采购转资产',
				icon: 'icon-match'
			},
			{
				type: 'page',
				sourcePath: '/performance/asset/ledger'
			},
			{
				type: 'group',
				key: 'asset-operations',
				label: '资产作业',
				icon: 'icon-task',
				paths: [
					'/performance/asset/assignment',
					'/performance/asset/maintenance',
					'/performance/asset/transfer',
					'/performance/asset/inventory',
					'/performance/asset/disposal'
				]
			},
			{
				type: 'group',
				key: 'asset-analysis',
				label: '资产分析',
				icon: 'icon-data',
				children: [
					{
						type: 'page',
						sourcePath: '/performance/asset/dashboard',
						label: '资产总览',
						icon: 'icon-data-board'
					},
					{
						type: 'page',
						sourcePath: '/performance/asset/report'
					},
					{
						type: 'page',
						sourcePath: '/performance/asset/depreciation'
					}
				]
			}
		]
	}
];

const DEFAULT_MENU_ICON = 'icon-menu';

const MENU_ICON_ALIASES = {
	'icon-calendar': 'icon-time',
	'icon-chart': 'icon-data',
	'icon-check': 'icon-approve',
	'icon-close': 'close',
	'icon-community': 'team',
	'icon-cooperation': 'icon-workbench',
	'icon-coupon': 'icon-card',
	'icon-course': 'icon-tutorial',
	'icon-data-board': 'icon-data',
	'icon-email': 'icon-msg',
	'icon-folder-opened': 'icon-folder',
	'icon-help': 'icon-question',
	'icon-order': 'order',
	'icon-ppt': 'icon-ppt',
	'icon-refresh': 'refresh',
	'icon-safe': 'icon-auth',
	'icon-suitcase': 'icon-work',
	'icon-tree': 'icon-list',
	'icon-user-filled': 'icon-user'
};

export function normalizeMenuIcon(icon, fallback = DEFAULT_MENU_ICON) {
	if (!icon) {
		return fallback;
	}

	return MENU_ICON_ALIASES[icon] || icon;
}

function createSyntheticGroup(template, id, name, path, icon, orderNum, children) {
	return {
		...template,
		id,
		name,
		path,
		icon: normalizeMenuIcon(icon, template.icon),
		orderNum,
		meta: {
			...template.meta,
			label: name
		},
		children
	};
}

export function buildMenuGroups(groups, options = {}) {
	const performanceGroup = groups.find(e => e.type == 0 && e.path === PERFORMANCE_ROOT_PATH);

	if (!options.isGroupEnabled || !performanceGroup?.children?.length) {
		return groups;
	}

	const baseOrder = Number(performanceGroup.orderNum || 0);
	const syntheticBaseId = Number(performanceGroup.id || 0) * 1000 || 900000;
	const performanceChildren = orderBy(
		(performanceGroup.children || []).filter(child => child.type === 1),
		'orderNum'
	);
	const childByPath = new Map(performanceChildren.map(child => [child.path, child]));
	const usedPaths = new Set();
	let nextSyntheticId = syntheticBaseId;

	const domainGroups = performanceDomainGroups
		.map((domain, index) => {
			const children = [];

			if (Array.isArray(domain.paths)) {
				performanceChildren.forEach(child => {
					if (domain.paths.includes(child.path)) {
						usedPaths.add(child.path);
						children.push(child);
					}
				});
			}

			if (Array.isArray(domain.children)) {
				domain.children.forEach(childConfig => {
					if (childConfig.type === 'page') {
						const source = childByPath.get(childConfig.sourcePath);

						if (!source) {
							return;
						}

						usedPaths.add(source.path);
						children.push({
							...source,
							id: ++nextSyntheticId,
							name: childConfig.label || source.name,
							icon: normalizeMenuIcon(childConfig.icon || source.icon),
							meta: {
								...source.meta,
								label: childConfig.label || source.meta?.label || source.name
							}
						});
					}

					if (childConfig.type === 'group') {
						const subgroupChildren = [];

						if (Array.isArray(childConfig.paths)) {
							subgroupChildren.push(
								...performanceChildren.filter(child => childConfig.paths.includes(child.path))
							);
						}

						if (Array.isArray(childConfig.children)) {
							childConfig.children.forEach(grandchildConfig => {
								if (grandchildConfig.type !== 'page') {
									return;
								}

								const source = childByPath.get(grandchildConfig.sourcePath);

								if (!source) {
									return;
								}

								usedPaths.add(source.path);
								subgroupChildren.push({
									...source,
									id: ++nextSyntheticId,
									name: grandchildConfig.label || source.name,
									icon: normalizeMenuIcon(grandchildConfig.icon || source.icon),
									meta: {
										...source.meta,
										label: grandchildConfig.label || source.meta?.label || source.name
									}
								});
							});
						}

						if (subgroupChildren.length === 0) {
							return;
						}

						subgroupChildren.forEach(child => usedPaths.add(child.path));
						children.push(
							createSyntheticGroup(
								performanceGroup,
								++nextSyntheticId,
								childConfig.label,
								`${PERFORMANCE_ROOT_PATH}/${childConfig.key}`,
								childConfig.icon,
								baseOrder + (index + 1) / 1000,
								subgroupChildren
							)
						);
					}
				});
			}

			if (children.length === 0) {
				return null;
			}

			return createSyntheticGroup(
				performanceGroup,
				++nextSyntheticId,
				domain.label,
				`${PERFORMANCE_ROOT_PATH}/${domain.key}`,
				domain.icon,
				baseOrder + (index + 1) / 100,
				children
			);
		})
		.filter(Boolean);

	const fallbackChildren = performanceChildren.filter(child => !usedPaths.has(child.path));

	if (fallbackChildren.length > 0) {
		const primaryGroup =
			domainGroups.find(group => group.path === `${PERFORMANCE_ROOT_PATH}/performance`) ||
			createSyntheticGroup(
				performanceGroup,
				++nextSyntheticId,
				'绩效中心',
				`${PERFORMANCE_ROOT_PATH}/performance`,
				'icon-home',
				baseOrder,
				[]
			);

		primaryGroup.children = primaryGroup.children.concat(fallbackChildren);

		if (!domainGroups.includes(primaryGroup)) {
			domainGroups.unshift(primaryGroup);
		}
	}

	return groups.flatMap(item => {
		if (item.id === performanceGroup.id) {
			return domainGroups;
		}

		return [item];
	});
}
