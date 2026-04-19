#!/usr/bin/env node

/**
 * 负责对齐 performance 权限键的生产侧、消费侧和权限矩阵文档。
 * 不负责推断动态权限语义，也不扫描 base 命名空间的历史权限。
 * 依赖 menu.json、performance 前后端源码和 06-权限矩阵.md。
 * 维护重点：consumer->producer 与 producer->consumer 都要显式成立，避免一边写了另一边没跟。
 */

import {
	collectPermissionLiterals,
	collectPermissionsFromCodebase,
	failGuard,
	getChangedFiles,
	getPerformanceMenuSnapshot,
	getAffectedResourcesFromPaths,
	info,
	mapPermissionsByResource,
	parseArgs,
	readChangedFileText,
	readText
} from './repo-consistency-lib.mjs';
import { guardConfig } from './repo-consistency-config.mjs';

const guardName = 'permission-key-alignment';

function getAffectedPermissionSet(changedFiles, producerMap, producerPermissions) {
	if (!changedFiles.length || changedFiles.includes(guardConfig.menuJsonPath)) {
		return new Set(producerPermissions);
	}

	const affected = new Set();

	for (const filePath of changedFiles) {
		if (
			!(
				filePath.startsWith('cool-admin-vue/src/modules/performance/') ||
				filePath.startsWith('cool-admin-midway/src/modules/performance/')
			)
		) {
			continue;
		}

		for (const permission of collectPermissionLiterals(readChangedFileText(filePath))) {
			affected.add(permission);
		}
	}

	if (affected.size) {
		return affected;
	}

	for (const resource of getAffectedResourcesFromPaths(changedFiles, producerMap)) {
		for (const permission of producerMap.get(resource) || []) {
			affected.add(permission);
		}
	}

	return affected;
}

function run() {
	const args = parseArgs(process.argv.slice(2));
	const changedFiles = getChangedFiles(args);

	if (
		args.mode !== 'all' &&
		!changedFiles.some(
			filePath =>
				filePath === guardConfig.menuJsonPath ||
				filePath.startsWith('cool-admin-vue/src/modules/performance/') ||
				filePath.startsWith('cool-admin-midway/src/modules/performance/')
		)
	) {
		info(guardName, '本次变更未触发权限键守卫。');
		return;
	}

	const { permissionKeys: producerPermissions } = getPerformanceMenuSnapshot();
	const producerMap = mapPermissionsByResource(producerPermissions);
	const consumerPermissions = collectPermissionsFromCodebase();
	const permissionDocText = readText(guardConfig.permissionDocPath);
	const affectedPermissions = getAffectedPermissionSet(
		changedFiles,
		producerMap,
		producerPermissions
	);

	if (!affectedPermissions.size) {
		info(guardName, '未识别到受影响的 performance 权限键。');
		return;
	}

	const failures = [];

	for (const permission of affectedPermissions) {
		const inProducer = producerPermissions.includes(permission);
		const inConsumer = consumerPermissions.has(permission);
		const inDocs = permissionDocText.includes(permission);

		if (!inProducer) {
			failures.push(`权限键 ${permission} 在源码中被引用，但未在 menu.json 中声明。`);
		}

		if (!inConsumer) {
			failures.push(`权限键 ${permission} 已在 menu.json 中声明，但前后端源码中没有明确消费点。`);
		}

		if (!inDocs) {
			failures.push(`权限键 ${permission} 未出现在 06-权限矩阵.md 中。`);
		}
	}

	failGuard(guardName, failures);
	info(guardName, `通过，共校验 ${affectedPermissions.size} 个受影响权限键。`);
}

run();
