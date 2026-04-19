// 负责动态菜单装配、一级分组承载和当前分组选中态。
// 不负责后端菜单数据生产，也不改写权限语义。
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { deepTree, revDeepTree, storage } from '/@/cool/utils';
import { isArray, isEmpty, orderBy } from 'lodash-es';
import { router, service } from '/@/cool';
import { revisePath } from '../utils';
import { config } from '/@/config';

const PERFORMANCE_ROOT_PATH = '/performance';

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
			'/performance/goals',
			'/performance/suggestion',
			'/performance/pip',
			'/performance/promotion',
			'/performance/salary'
		]
	},
	{
		key: 'recruit',
		label: '招聘中心',
		icon: 'icon-user',
		paths: [
			'/performance/recruitment-center',
			'/performance/recruit-plan',
			'/performance/job-standard',
			'/performance/resumePool',
			'/performance/interview',
			'/performance/talentAsset',
			'/performance/hiring'
		]
	},
	{
		key: 'training',
		label: '培训中心',
		icon: 'icon-task',
		paths: [
			'/performance/course',
			'/performance/course-learning',
			'/performance/capability',
			'/performance/certificate'
		]
	},
	{
		key: 'meeting',
		label: '会议管理',
		icon: 'icon-calendar',
		paths: ['/performance/meeting']
	},
	{
		key: 'contract',
		label: '合同管理',
		icon: 'icon-safe',
		paths: ['/performance/contract']
	},
	{
		key: 'procurement',
		label: '采购管理',
		icon: 'icon-order',
		paths: [
			'/performance/purchase-order',
			'/performance/purchase-inquiry',
			'/performance/purchase-approval',
			'/performance/purchase-execution',
			'/performance/purchase-receipt',
			'/performance/purchase-report',
			'/performance/supplier'
		]
	},
	{
		key: 'asset',
		label: '资产管理',
		icon: 'icon-set',
		paths: [
			'/performance/asset/dashboard',
			'/performance/asset/ledger',
			'/performance/asset/assignment',
			'/performance/asset/maintenance',
			'/performance/asset/report',
			'/performance/asset/procurement',
			'/performance/asset/transfer',
			'/performance/asset/inventory',
			'/performance/asset/depreciation',
			'/performance/asset/disposal'
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
			'/performance/office/intellectual-property'
		]
	}
];

// 本地缓存
const data = storage.info();

export const useMenuStore = defineStore('menu', function () {
	// 所有菜单
	const all = ref<Menu.List>([]);

	// 视图路由
	const routes = ref<Menu.List>([]);

	// 菜单组
	const group = ref<Menu.List>(data['base.menuGroup'] || []);

	// 左侧菜单列表
	const list = ref<Menu.List>([]);

	// 当前一级分组下标
	const activeGroupIndex = ref(0);

	// 权限列表
	const perms = ref<any[]>(data['base.menuPerms'] || []);

	// 设置左侧菜单
	function setMenu(i: number = 0) {
		const visibleGroups = group.value.filter(e => e.isShow);

		// 显示分组显示菜单
		if (config.app.menu.isGroup) {
			activeGroupIndex.value = Math.min(i, Math.max(visibleGroups.length - 1, 0));
			list.value = visibleGroups[activeGroupIndex.value]?.children || [];
		} else {
			activeGroupIndex.value = 0;
			list.value = group.value;
		}
	}

	const currentGroup = computed(() => {
		return group.value.filter(e => e.isShow)[activeGroupIndex.value];
	});

	// 设置权限
	function setPerms(list: Menu.List) {
		function deep(d: any) {
			if (typeof d == 'object') {
				if (d.permission) {
					if (d.namespace) {
						d._permission = {};
						for (const i in d.permission) {
							d._permission[i] =
								list.findIndex(e =>
									e
										.replace(/:/g, '/')
										.includes(`${d.namespace.replace('admin/', '')}/${i}`)
								) >= 0;
						}
					} else {
						console.error('namespace is required', d);
					}
				} else {
					for (const i in d) {
						deep(d[i]);
					}
				}
			}
		}

		perms.value = list;
		storage.set('base.menuPerms', list);

		deep(service);
	}

	// 设置视图
	function setRoutes(list: Menu.List) {
		// 获取第一个菜单路径
		const fp = getPath(group.value);

		// 查找符合路由
		const route = list.find(e => (e.meta!.isHome = e.path == fp));

		// 过滤菜单
		routes.value = list.filter(e => e.type == 1);

		if (route) {
			// 移除旧路由
			router.del('home');
			router.del('homeRedirect');

			// 添加一个重定向
			if (route.path != '/') {
				const item = routes.value.find(e => e.name == 'homeRedirect');

				if (item) {
					item.path = route.path;
				} else {
					routes.value.push({
						path: route.path,
						redirect: '/',
						name: 'homeRedirect'
					} as any);
				}
			}

			// 设置为首页
			route.path = '/';
			route.name = 'home';
		}
	}

	// 设置菜单组
	function setGroup(list: Menu.List) {
		group.value = buildMenuGroups(orderBy(deepTree(list), 'orderNum'));
		storage.set('base.menuGroup', group.value);
	}

	// 获取菜单，权限信息
	async function get() {
		function next(res: { menus: Menu.List; perms?: any[] }) {
			// 所有菜单
			all.value = res.menus;

			// 菜单格式化
			const list = res.menus
				?.filter(e => e.type != 2)
				.map(e => {
					const path = revisePath(e.router || String(e.id));
					const isShow = e.isShow === undefined ? true : e.isShow;

					return {
						...e,
						path,
						isShow,
						meta: {
							...e.meta,
							label: e.name, // 菜单名称的唯一标识
							keepAlive: e.keepAlive || 0
						},
						name: `${e.name}-${e.id}`, // 避免重复命名之前的冲突
						children: []
					};
				});

			// 设置权限
			setPerms(res.perms || []);

			// 设置菜单组
			setGroup(list);

			// 设置视图路由
			setRoutes(list);

			// 设置菜单
			setMenu();

			return list;
		}

		// 自定义菜单
		if (!isEmpty(config.app.menu.list)) {
			next({
				menus: revDeepTree(config.app.menu.list || [])
			});
		} else {
			// 动态菜单
			await service.base.comm.permmenu().then(next);
		}
	}

	// 获取菜单路径
	function getPath(data: Menu.Item | Menu.List) {
		const list = isArray(data) ? data : [data];

		let path = '';

		function deep(arr: Menu.List) {
			arr.forEach((e: Menu.Item) => {
				switch (e.type) {
					case 0:
						deep(e.children || []);
						break;
					case 1:
						if (!path) {
							path = e.path;
						}
						break;
				}
			});
		}

		deep(list);

		return path;
	}

	return {
		all,
		routes,
		group,
		list,
		activeGroupIndex,
		currentGroup,
		perms,
		get,
		setPerms,
		setMenu,
		setRoutes,
		setGroup,
		getPath
	};
});

function buildMenuGroups(groups: Menu.List) {
	const performanceGroup = groups.find(e => e.type == 0 && e.path === PERFORMANCE_ROOT_PATH);

	if (!config.app.menu.isGroup || !performanceGroup?.children?.length) {
		return groups;
	}

	const baseOrder = Number(performanceGroup.orderNum || 0);
	const syntheticBaseId = Number(performanceGroup.id || 0) * 1000 || 900000;
	const performanceChildren = orderBy(
		(performanceGroup.children || []).filter(child => child.type === 1),
		'orderNum'
	);
	const usedPaths = new Set<string>();

	const domainGroups = performanceDomainGroups
		.map((domain, index) => {
			const children = performanceChildren.filter(child => {
				const matched = domain.paths.includes(child.path);

				if (matched) {
					usedPaths.add(child.path);
				}

				return matched;
			});

			if (children.length === 0) {
				return null;
			}

			return {
				...performanceGroup,
				id: syntheticBaseId + index + 1,
				name: domain.label,
				path: `${PERFORMANCE_ROOT_PATH}/${domain.key}`,
				icon: domain.icon,
				orderNum: baseOrder + (index + 1) / 100,
				meta: {
					...performanceGroup.meta,
					label: domain.label
				},
				children
			};
		})
		.filter(Boolean) as Menu.List;

	const fallbackChildren = performanceChildren.filter(child => !usedPaths.has(child.path));

	if (fallbackChildren.length > 0) {
		domainGroups.unshift({
			...performanceGroup,
			id: syntheticBaseId,
			name: performanceGroup.meta?.label || performanceGroup.name,
			path: PERFORMANCE_ROOT_PATH,
			orderNum: baseOrder,
			children: fallbackChildren
		});
	}

	return groups.flatMap(item => {
		if (item.id === performanceGroup.id) {
			return domainGroups;
		}

		return [item];
	});
}
