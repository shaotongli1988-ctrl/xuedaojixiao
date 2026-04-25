#!/usr/bin/env node

/**
 * 负责校验 cool-uni 移动端共享能力清单与页面、权限生成物的最小契约对齐。
 * 不负责修复移动端页面实现，也不替代后端权限鉴权或更细粒度的页面行为测试。
 * 依赖 cool-uni/types/performance-mobile.ts、generated 权限文件和 pages 目录结构。
 * 维护重点：新增移动端工作台卡片、权限引用或页面路径时，必须同步更新这里的提取规则。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(scriptDir, '..');

function parseArgs(argv) {
	const args = {
		cwd: defaultRepoRoot
	};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];
		const next = argv[index + 1];
		if (current === '--cwd' && next) {
			args.cwd = path.resolve(next);
			index += 1;
			continue;
		}
		throw new Error(`Unsupported arg: ${current}`);
	}

	return args;
}

function readText(root, relativePath) {
	return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(root, relativePath) {
	return fs.existsSync(path.join(root, relativePath));
}

function normalizePath(value) {
	return value.replaceAll('\\', '/');
}

function extractQuotedValues(source) {
	return [...source.matchAll(/"([^"]+)"/g)].map(match => match[1]);
}

function extractUnionValues(source) {
	const match = source.match(/export type MobileWorkbenchPageId =([\s\S]*?);/);
	if (!match) {
		throw new Error('无法解析 MobileWorkbenchPageId 联合类型。');
	}
	return extractQuotedValues(match[1]);
}

function extractCardBlocks(source) {
	const match = source.match(/export const workbenchCards = \{([\s\S]*?)\n\s*\};/);
	if (!match) {
		throw new Error('无法解析 workbenchCards。');
	}

	const entries = [];
	const blockRegex =
		/^\s*(?:"([^"]+)"|([A-Za-z][A-Za-z0-9-]*)):\s*\{([\s\S]*?)^\s*\},?$/gm;

	for (const block of match[1].matchAll(blockRegex)) {
		const key = block[1] || block[2] || '';
		const body = block[3] || '';
		const idMatch = body.match(/id:\s*"([^"]+)"\s+as const/);
		const pathMatch = body.match(/path:\s*"([^"]+)"/);
		if (!idMatch || !pathMatch) {
			continue;
		}
		entries.push({
			key,
			id: idMatch[1],
			path: pathMatch[1]
		});
	}

	return entries;
}

function extractPushValues(source) {
	return [...source.matchAll(/next\.push\("([^"]+)"\)/g)].map(match => match[1]);
}

function extractPermissionKeys(source) {
	const keys = new Set();
	for (const match of source.matchAll(/PERMISSIONS\.([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)/g)) {
		const chain = match[1];
		keys.add(chain.split('.').join(':'));
	}
	return [...keys];
}

function extractAdminPermissionKeys(source) {
	const match = source.match(/export const ADMIN_PERMISSION_KEYS = \[([\s\S]*?)\]\s+as const;/);
	if (!match) {
		throw new Error('无法解析 ADMIN_PERMISSION_KEYS。');
	}
	return extractQuotedValues(match[1]);
}

function extractRoutePrefixes(source) {
	const match = source.match(/const ROUTE_RULES = \[([\s\S]*?)\n\s*\];/);
	if (!match) {
		throw new Error('无法解析 ROUTE_RULES。');
	}
	return [...match[1].matchAll(/prefix:\s*"([^"]+)"/g)].map(item => item[1]);
}

function toVuePath(routePath) {
	return normalizePath(routePath.replace(/^\//, '') + '.vue');
}

function runCheck(root) {
	const failures = [];
	const mobileFile = 'cool-uni/types/performance-mobile.ts';
	const permissionsFile = 'cool-uni/generated/permissions.generated.ts';
	const source = readText(root, mobileFile);
	const permissionsSource = readText(root, permissionsFile);

	const unionIds = extractUnionValues(source);
	const cards = extractCardBlocks(source);
	const pushedIds = extractPushValues(source);
	const permissionKeys = extractPermissionKeys(source);
	const routePrefixes = extractRoutePrefixes(source);
	const adminPermissionKeys = new Set(extractAdminPermissionKeys(permissionsSource));
	const unionIdSet = new Set(unionIds);
	const cardIdSet = new Set(cards.map(item => item.id));
	const routePrefixSet = new Set(routePrefixes);

	for (const card of cards) {
		if (card.key !== card.id) {
			failures.push(`workbenchCards key 与 id 不一致: ${card.key} -> ${card.id}`);
		}
		if (!unionIdSet.has(card.id)) {
			failures.push(`workbench card id 未登记到 MobileWorkbenchPageId: ${card.id}`);
		}
		if (!routePrefixSet.has(card.path)) {
			failures.push(`workbench card path 缺少 ROUTE_RULES.prefix: ${card.path}`);
		}
		const vueFile = toVuePath(card.path);
		if (!exists(root, path.join('cool-uni', vueFile))) {
			failures.push(`workbench card path 对应页面不存在: ${card.path}`);
		}
	}

	for (const unionId of unionIds) {
		if (!cardIdSet.has(unionId)) {
			failures.push(`MobileWorkbenchPageId 缺少 workbenchCards 条目: ${unionId}`);
		}
	}

	for (const pushedId of pushedIds) {
		if (!unionIdSet.has(pushedId)) {
			failures.push(`resolveWorkbenchPages 推入了未登记的 pageId: ${pushedId}`);
		}
		if (!cardIdSet.has(pushedId)) {
			failures.push(`resolveWorkbenchPages 推入了无卡片定义的 pageId: ${pushedId}`);
		}
	}

	for (const permissionKey of permissionKeys) {
		if (!adminPermissionKeys.has(permissionKey)) {
			failures.push(`移动端共享契约引用了不存在的权限键: ${permissionKey}`);
		}
	}

	for (const routePrefix of routePrefixes) {
		const vueFile = toVuePath(routePrefix);
		if (
			(routePrefix.startsWith('/pages/performance/') || routePrefix.startsWith('/pages/index/')) &&
			!exists(root, path.join('cool-uni', vueFile))
		) {
			failures.push(`ROUTE_RULES.prefix 对应页面不存在: ${routePrefix}`);
		}
	}

	return failures;
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const failures = runCheck(args.cwd);
	if (failures.length > 0) {
		console.error('[mobile-shared-contract] FAIL');
		for (const failure of failures) {
			console.error(`- ${failure}`);
		}
		return 1;
	}

	console.log('[mobile-shared-contract] PASS');
	return 0;
}

process.exit(main());
