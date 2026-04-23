// 负责动态菜单装配、一级分组承载和当前分组选中态。
// 不负责后端菜单数据生产，也不改写权限语义。
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { deepTree, revDeepTree, storage } from '/@/cool/utils';
import { isArray, isEmpty, orderBy } from 'lodash-es';
import { router, service } from '/@/cool';
import { revisePath } from '../utils';
import { config } from '/@/config';
import { buildMenuGroups, normalizeMenuIcon } from './menu-grouping.js';
import { useUserStore } from './user';
import {
	PERMISSION_BIT_BY_KEY,
	hasPermissionBit,
	resolvePermissionMask
} from '../generated/permission-bits.generated';
import { ROUTE_PERMISSION_BY_PATH } from '../generated/route-permissions.generated';

const MENU_GROUP_CACHE_VERSION_KEY = 'base.menuGroupVersion';
const MENU_GROUP_CACHE_VERSION = '2026-04-21-system-grouping-v8';
const HOME_ROUTE_PRIORITY = ['/performance/workbench'];

// 本地缓存
const data = storage.info();
const cachedMenuGroup =
	data[MENU_GROUP_CACHE_VERSION_KEY] === MENU_GROUP_CACHE_VERSION
		? data['base.menuGroup'] || []
		: [];

function createRoutePermissionContext(
	perms: readonly string[] = [],
	options?: { permissionMask?: string; isAdmin?: boolean }
) {
	const normalizedPerms = perms
		.map(item => String(item || '').trim())
		.filter(Boolean);

	return {
		perms: normalizedPerms,
		permissionMask:
			String(options?.permissionMask || '').trim() ||
			(normalizedPerms.length
				? resolvePermissionMask(normalizedPerms, {
						isAdmin: options?.isAdmin === true
				  })
				: '')
	};
}

function hasRouteAccess(
	path: string,
	context: { perms: string[]; permissionMask: string }
) {
	const permissionRule =
		ROUTE_PERMISSION_BY_PATH[path as keyof typeof ROUTE_PERMISSION_BY_PATH];

	if (!permissionRule) {
		return true;
	}

	function matchesRule(
		value: string | { or?: readonly string[]; and?: readonly string[] }
	) {
		if (typeof value === 'string') {
			const permissionBit = PERMISSION_BIT_BY_KEY[value];

			if (permissionBit === undefined || !context.permissionMask) {
				return false;
			}

			return hasPermissionBit(context.permissionMask, permissionBit);
		}

		if (Array.isArray(value?.or)) {
			return value.or.some(item => matchesRule(item));
		}

		if (Array.isArray(value?.and)) {
			return value.and.every(item => matchesRule(item));
		}

		return false;
	}

	return matchesRule(permissionRule);
}

export const useMenuStore = defineStore('menu', function () {
	// 所有菜单
	const all = ref<Menu.List>([]);

	// 视图路由
	const routes = ref<Menu.List>([]);

	// 菜单组
	const group = ref<Menu.List>(cachedMenuGroup);

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
		list.forEach(route => {
			if (!route.meta) {
				route.meta = {};
			}

			route.meta.isHome = false;
		});

		const visibleViewRoutes = list.filter(route => route.type == 1 && route.isShow);

		// 优先把角色工作台设为首页；如果当前账号不可达，再回退到首个可达菜单。
		const fp =
			HOME_ROUTE_PRIORITY.find(path =>
				visibleViewRoutes.some(route => route.path === path)
			) || getPath(group.value);

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
		group.value = buildMenuGroups(orderBy(deepTree(list), 'orderNum'), {
			isGroupEnabled: config.app.menu.isGroup
		});
		storage.set('base.menuGroup', group.value);
		storage.set(MENU_GROUP_CACHE_VERSION_KEY, MENU_GROUP_CACHE_VERSION);
	}

	// 获取菜单，权限信息
	async function get() {
		function next(res: { menus: Menu.List; perms?: any[] }) {
			const user = useUserStore();
			const routePermissionContext = createRoutePermissionContext(res.perms || [], {
				permissionMask: String(user.info?.permissionMask || ''),
				isAdmin: user.info?.isAdmin === true
			});

			if (
				user.info &&
				routePermissionContext.permissionMask &&
				!String(user.info.permissionMask || '').trim()
			) {
				user.set({
					...user.info,
					permissionMask: routePermissionContext.permissionMask
				});
			}

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
						icon: normalizeMenuIcon(e.icon),
						path,
						isShow: Boolean(isShow) && hasRouteAccess(path, routePermissionContext),
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
