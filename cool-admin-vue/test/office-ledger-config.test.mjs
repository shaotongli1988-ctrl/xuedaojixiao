/**
 * 行政协同共享页面配置测试。
 * 场景覆盖：模块完整性、宣传资料 documentCenter 引用、配置工厂返回独立对象。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const officeLedgerConfigPath = new URL(
	'../src/modules/performance/views/office/office-ledger-config.ts',
	import.meta.url
);

test('frontend normal office modules expose the requested admin ledgers', async () => {
	const source = await readFile(officeLedgerConfigPath, 'utf8');

	assert.match(source, /annualInspection:\s*createBaseConfig<AnnualInspectionRecord>/);
	assert.match(source, /honor:\s*createBaseConfig<HonorRecord>/);
	assert.match(source, /publicityMaterial:\s*createBaseConfig<PublicityMaterialRecord>/);
	assert.match(source, /designCollab:\s*createBaseConfig<DesignCollabRecord>/);
	assert.match(source, /expressCollab:\s*createBaseConfig<ExpressCollabRecord>/);
	assert.match(source, /vehicle:\s*createBaseConfig<VehicleRecord>/);
	assert.match(source, /intellectualProperty:\s*createBaseConfig<IntellectualPropertyRecord>/);
	assert.match(source, /documentReference:\s*\{\s*prop:\s*'documentIds'/);
	assert.match(source, /route:\s*'\/performance\/office\/vehicle'/);
	assert.match(source, /route:\s*'\/performance\/office\/intellectual-property'/);
});

test('frontend boundary createFilters and createEmptyForm return fresh objects', async () => {
	const source = await readFile(officeLedgerConfigPath, 'utf8');

	assert.match(
		source,
		/createFilters:\s*\(\)\s*=>\s*\(\{\s*keyword:\s*'',\s*status:\s*'',\s*category:\s*''\s*\}\)/
	);
	assert.match(
		source,
		/createEmptyForm:\s*\(\)\s*=>\s*\(\{\s*status:\s*config\.statusOptions\[0\]\?\.value \|\| '',\s*tagsText:\s*'',\s*notes:\s*''\s*\}\)/
	);
	assert.match(source, /documentIds:\s*\[\]/);
});
