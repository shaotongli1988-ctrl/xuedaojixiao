#!/usr/bin/env node

/**
 * 负责校验 performance 菜单的 router/viewPath 是否与唯一事实源和真实页面文件一致。
 * 不负责自动修复 menu.json、文档表格或前端页面目录。
 * 依赖 menu.json、10-路由与菜单映射.md 和 cool-admin-vue 页面文件。
 * 维护重点：只围绕本次变更涉及的菜单页做比对，减少未实现主题的误报。
 */

import path from 'node:path';
import {
	failGuard,
	getChangedFiles,
	getPerformanceMenuSnapshot,
	getRouteDocsByRoute,
	info,
	parseArgs,
	pathExists
} from './repo-consistency-lib.mjs';
import { guardConfig } from './repo-consistency-config.mjs';

const guardName = 'menu-route-viewpath-drift';

function getAffectedMenus(changedFiles, pageMenus) {
	if (!changedFiles.length || changedFiles.includes(guardConfig.menuJsonPath)) {
		return pageMenus;
	}

	const affectedMenus = [];
	const seenRoutes = new Set();

	for (const filePath of changedFiles) {
		if (filePath === guardConfig.menuStorePath) {
			return pageMenus;
		}

		if (!filePath.startsWith('cool-admin-vue/src/modules/performance/views/')) {
			continue;
		}

		const relativeViewPath = filePath.replace('cool-admin-vue/src/', '');
		for (const pageMenu of pageMenus) {
			if (pageMenu.viewPath === relativeViewPath && !seenRoutes.has(pageMenu.router)) {
				affectedMenus.push(pageMenu);
				seenRoutes.add(pageMenu.router);
			}
		}

		if (!affectedMenus.some(menu => menu.viewPath === relativeViewPath)) {
			const maybePageIndex = path
				.join(path.dirname(relativeViewPath), 'index.vue')
				replaceAll('\\', '/');
			for (const pageMenu of pageMenus) {
				if (pageMenu.viewPath === maybePageIndex && !seenRoutes.has(pageMenu.router)) {
					affectedMenus.push(pageMenu);
					seenRoutes.add(pageMenu.router);
				}
			}
		}
	}

	return affectedMenus;
}

function run() {
	const args = parseArgs(process.argv.slice(2));
	const changedFiles = getChangedFiles(args);

	if (
		args.mode !== 'all' &&
		!changedFiles.some(filePath => guardConfig.routeSensitiveRoots.some(root => filePath === root || filePath.startsWith(`${root}/`)))
	) {
		info(guardName, '本次变更未触发菜单/路由/viewPath 守卫。');
		return;
	}

	const { pageMenus } = getPerformanceMenuSnapshot();
	const routeDocsByRoute = getRouteDocsByRoute();
	const affectedMenus = getAffectedMenus(changedFiles, pageMenus);

	if (!affectedMenus.length) {
		info(guardName, '未识别到受影响的 performance 页面菜单。');
		return;
	}

	const failures = [];

	for (const pageMenu of affectedMenus) {
		const routeDoc = routeDocsByRoute.get(pageMenu.router);
		if (!routeDoc) {
			failures.push(`路由 ${pageMenu.router} 在 10-路由与菜单映射.md 中缺少对应页面菜单映射。`);
			continue;
		}

		if (routeDoc['viewPath'] !== pageMenu.viewPath) {
			failures.push(
				`路由 ${pageMenu.router} 的 viewPath 不一致：menu.json=${pageMenu.viewPath}，文档=${routeDoc['viewPath']}`
			);
		}

		const expectedFrontendFile = routeDoc['前端文件落点'];
		if (expectedFrontendFile) {
			const normalizedDocFile = expectedFrontendFile.replace(/^cool-admin-vue\/src\//, '');
			if (normalizedDocFile !== pageMenu.viewPath) {
				failures.push(
					`路由 ${pageMenu.router} 的前端文件落点与 viewPath 不一致：文档=${expectedFrontendFile}，viewPath=${pageMenu.viewPath}`
				);
			}
		}

		const viewFilePath = `cool-admin-vue/src/${pageMenu.viewPath}`;
		if (!pathExists(viewFilePath)) {
			failures.push(`路由 ${pageMenu.router} 指向的 viewPath 不存在：${viewFilePath}`);
		}
	}

	failGuard(guardName, failures);
	info(guardName, `通过，共校验 ${affectedMenus.length} 个受影响页面菜单。`);
}

run();
