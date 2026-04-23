#!/usr/bin/env node

/**
 * 守卫 office-ledger 前后端枚举字典的一致性。
 * 这里只负责比对前端共享字典与后端 service 中的固定枚举集合，不负责修复页面配置、decoder 或测试代码。
 * 维护重点：枚举新增或调整必须同时更新前端 dictionary 和后端 service 常量，否则发布前直接失败。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const frontendDictionaryFile = path.join(
	repoRoot,
	'cool-admin-vue/src/modules/performance/office-ledger.dictionary.ts'
);
const officeCollabServiceFile = path.join(
	repoRoot,
	'cool-admin-midway/src/modules/performance/service/office-collab-record.ts'
);
const vehicleServiceFile = path.join(
	repoRoot,
	'cool-admin-midway/src/modules/performance/service/vehicle.ts'
);
const intellectualPropertyServiceFile = path.join(
	repoRoot,
	'cool-admin-midway/src/modules/performance/service/intellectualProperty.ts'
);

function fail(message) {
	console.error(`[office-ledger-enum-alignment] ${message}`);
	process.exit(1);
}

function readFile(filePath) {
	return fs.readFileSync(filePath, 'utf8');
}

function extractQuotedMembers(source) {
	return [...source.matchAll(/'([^']+)'/g)].map(match => match[1]);
}

function extractConstStringArray(fileText, constName) {
	const match = fileText.match(
		new RegExp(`const\\s+${constName}\\s*=\\s*\\[([\\s\\S]*?)\\];`, 'm')
	);
	if (!match) {
		fail(`未找到常量数组 ${constName}`);
	}
	return extractQuotedMembers(match[1]);
}

function extractExportedValueTuple(fileText, constName) {
	const match = fileText.match(
		new RegExp(`export\\s+const\\s+${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as\\s+const;`, 'm')
	);
	if (!match) {
		fail(`未找到前端字典值元组 ${constName}`);
	}
	return extractQuotedMembers(match[1]);
}

function extractModuleMetaStatuses(fileText, moduleKey) {
	const match = fileText.match(
		new RegExp(
			`${moduleKey}:\\s*\\{[\\s\\S]*?statuses:\\s*\\[([\\s\\S]*?)\\][\\s\\S]*?\\}`,
			'm'
		)
	);
	if (!match) {
		fail(`未找到 MODULE_META.${moduleKey}.statuses`);
	}
	return extractQuotedMembers(match[1]);
}

function assertExactMatch(label, frontendValues, backendValues) {
	const frontendText = JSON.stringify(frontendValues);
	const backendText = JSON.stringify(backendValues);
	if (frontendText !== backendText) {
		fail(`${label} 漂移：frontend=${frontendText} backend=${backendText}`);
	}
}

function main() {
	const frontendDictionaryText = readFile(frontendDictionaryFile);
	const officeCollabText = readFile(officeCollabServiceFile);
	const vehicleText = readFile(vehicleServiceFile);
	const intellectualPropertyText = readFile(intellectualPropertyServiceFile);

	const checks = [
		{
			label: 'annualInspection.status',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'ANNUAL_INSPECTION_STATUS_VALUES'
			),
			backend: extractModuleMetaStatuses(officeCollabText, 'annualInspection')
		},
		{
			label: 'annualInspection.category',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'ANNUAL_INSPECTION_CATEGORY_VALUES'
			),
			backend: extractConstStringArray(officeCollabText, 'ANNUAL_CATEGORIES')
		},
		{
			label: 'honor.status',
			frontend: extractExportedValueTuple(frontendDictionaryText, 'HONOR_STATUS_VALUES'),
			backend: extractModuleMetaStatuses(officeCollabText, 'honor')
		},
		{
			label: 'honor.type',
			frontend: extractExportedValueTuple(frontendDictionaryText, 'HONOR_TYPE_VALUES'),
			backend: extractConstStringArray(officeCollabText, 'HONOR_TYPES')
		},
		{
			label: 'honor.level',
			frontend: extractExportedValueTuple(frontendDictionaryText, 'HONOR_LEVEL_VALUES'),
			backend: extractConstStringArray(officeCollabText, 'HONOR_LEVELS')
		},
		{
			label: 'publicityMaterial.status',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'PUBLICITY_MATERIAL_STATUS_VALUES'
			),
			backend: extractModuleMetaStatuses(officeCollabText, 'publicityMaterial')
		},
		{
			label: 'publicityMaterial.type',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'PUBLICITY_MATERIAL_TYPE_VALUES'
			),
			backend: extractConstStringArray(officeCollabText, 'PUBLICITY_TYPES')
		},
		{
			label: 'publicityMaterial.channel',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'PUBLICITY_MATERIAL_CHANNEL_VALUES'
			),
			backend: extractConstStringArray(officeCollabText, 'PUBLICITY_CHANNELS')
		},
		{
			label: 'designCollab.status',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'DESIGN_COLLAB_STATUS_VALUES'
			),
			backend: extractModuleMetaStatuses(officeCollabText, 'designCollab')
		},
		{
			label: 'designCollab.priority',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'DESIGN_COLLAB_PRIORITY_VALUES'
			),
			backend: extractConstStringArray(officeCollabText, 'DESIGN_PRIORITIES')
		},
		{
			label: 'expressCollab.status',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'EXPRESS_COLLAB_STATUS_VALUES'
			),
			backend: extractModuleMetaStatuses(officeCollabText, 'expressCollab')
		},
		{
			label: 'expressCollab.serviceLevel',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'EXPRESS_COLLAB_SERVICE_LEVEL_VALUES'
			),
			backend: extractConstStringArray(officeCollabText, 'EXPRESS_SERVICE_LEVELS')
		},
		{
			label: 'expressCollab.syncStatus',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'EXPRESS_COLLAB_SYNC_STATUS_VALUES'
			),
			backend: extractConstStringArray(officeCollabText, 'EXPRESS_SYNC_STATUS')
		},
		{
			label: 'vehicle.status',
			frontend: extractExportedValueTuple(frontendDictionaryText, 'VEHICLE_STATUS_VALUES'),
			backend: extractConstStringArray(vehicleText, 'VEHICLE_STATUS')
		},
		{
			label: 'vehicle.type',
			frontend: extractExportedValueTuple(frontendDictionaryText, 'VEHICLE_TYPE_VALUES'),
			backend: extractConstStringArray(vehicleText, 'VEHICLE_TYPES')
		},
		{
			label: 'intellectualProperty.status',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'INTELLECTUAL_PROPERTY_STATUS_VALUES'
			),
			backend: extractConstStringArray(
				intellectualPropertyText,
				'INTELLECTUAL_PROPERTY_STATUS'
			)
		},
		{
			label: 'intellectualProperty.type',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'INTELLECTUAL_PROPERTY_TYPE_VALUES'
			),
			backend: extractConstStringArray(
				intellectualPropertyText,
				'INTELLECTUAL_PROPERTY_TYPES'
			)
		},
		{
			label: 'intellectualProperty.riskLevel',
			frontend: extractExportedValueTuple(
				frontendDictionaryText,
				'INTELLECTUAL_PROPERTY_RISK_LEVEL_VALUES'
			),
			backend: extractConstStringArray(
				intellectualPropertyText,
				'INTELLECTUAL_PROPERTY_RISK_LEVELS'
			)
		}
	];

	for (const check of checks) {
		assertExactMatch(check.label, check.frontend, check.backend);
	}

	console.log(`[office-ledger-enum-alignment] passed (${checks.length} checks)`);
}

main();
