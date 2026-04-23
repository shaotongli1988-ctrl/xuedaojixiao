/**
 * 物资管理 types 默认值测试。
 * 场景覆盖：新增 record 工厂函数的默认状态、数量和金额口径必须稳定。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const typesPath = new URL('../src/modules/performance/types.ts', import.meta.url);
let typesModulePromise;

async function loadTypesModule() {
	if (!typesModulePromise) {
		typesModulePromise = readFile(typesPath, 'utf8').then(source => {
			const transpiled = ts.transpileModule(source, {
				compilerOptions: {
					module: ts.ModuleKind.ES2022,
					target: ts.ScriptTarget.ES2022
				}
			}).outputText;

			return import(
				`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`
			);
		});
	}

	return typesModulePromise;
}

test('material createEmpty factories keep expected default status values', async () => {
	const {
		createEmptyMaterialCatalog,
		createEmptyMaterialStock,
		createEmptyMaterialInbound,
		createEmptyMaterialIssue
	} = await loadTypesModule();

	assert.equal(createEmptyMaterialCatalog().status, 'active');
	assert.equal(createEmptyMaterialCatalog().safetyStock, 0);
	assert.equal(createEmptyMaterialStock().stockStatus, 'sufficient');
	assert.equal(createEmptyMaterialStock().availableQty, 0);
	assert.equal(createEmptyMaterialInbound().status, 'draft');
	assert.equal(createEmptyMaterialInbound().sourceType, '');
	assert.equal(createEmptyMaterialIssue().status, 'draft');
	assert.equal(createEmptyMaterialIssue().assigneeName, '');
});

test('material inbound and issue defaults keep minimal quantity baseline', async () => {
	const { createEmptyMaterialInbound, createEmptyMaterialIssue } = await loadTypesModule();

	assert.equal(createEmptyMaterialInbound().quantity, 1);
	assert.equal(createEmptyMaterialInbound().amount, 0);
	assert.equal(createEmptyMaterialIssue().quantity, 1);
	assert.equal(createEmptyMaterialIssue().purpose, '');
});
