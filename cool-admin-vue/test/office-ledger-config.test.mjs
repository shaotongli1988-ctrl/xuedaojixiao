/**
 * 行政协同共享页面配置测试。
 * 场景覆盖：模块完整性、宣传资料 documentCenter 引用、配置工厂返回独立对象。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { officeLedgerModules } from '../src/modules/performance/views/office/office-ledger-config.js';

test('frontend normal office modules expose the requested admin ledgers', () => {
	assert.deepEqual(Object.keys(officeLedgerModules), [
		'annualInspection',
		'honor',
		'publicityMaterial',
		'designCollab',
		'expressCollab',
		'vehicle',
		'intellectualProperty'
	]);
	assert.equal(
		officeLedgerModules.publicityMaterial.documentReference?.prop,
		'documentIds'
	);
	assert.equal(officeLedgerModules.vehicle.route, '/performance/office/vehicle');
	assert.equal(
		officeLedgerModules.intellectualProperty.route,
		'/performance/office/intellectual-property'
	);
});

test('frontend boundary createFilters and createEmptyForm return fresh objects', () => {
	const firstFilters = officeLedgerModules.annualInspection.createFilters();
	const secondFilters = officeLedgerModules.annualInspection.createFilters();
	firstFilters.keyword = 'changed';
	assert.equal(secondFilters.keyword, '');

	const firstForm = officeLedgerModules.publicityMaterial.createEmptyForm();
	const secondForm = officeLedgerModules.publicityMaterial.createEmptyForm();
	firstForm.documentIds.push(1);
	assert.equal(secondForm.documentIds.length, 0);
});
