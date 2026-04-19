/**
 * 行政协同共享 service helper 测试。
 * 场景覆盖：endpoint 生成、权限键生成、模块元数据装配。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
	buildOfficeLedgerEndpoint,
	buildOfficeLedgerPermissions,
	createOfficeLedgerModuleMeta
} from '../src/modules/performance/service/office-ledger-shared.js';

test('frontend normal office helper builds endpoint and permission keys', () => {
	assert.equal(buildOfficeLedgerEndpoint('annualInspection'), 'admin/performance/annualInspection');
	assert.deepEqual(buildOfficeLedgerPermissions('honor'), {
		page: 'performance:honor:page',
		info: 'performance:honor:info',
		stats: 'performance:honor:stats',
		add: 'performance:honor:add',
		update: 'performance:honor:update',
		delete: 'performance:honor:delete'
	});
});

test('frontend boundary office helper preserves moduleKey in aggregated meta', () => {
	assert.deepEqual(createOfficeLedgerModuleMeta('designCollab'), {
		moduleKey: 'designCollab',
		endpoint: 'admin/performance/designCollab',
		permission: {
			page: 'performance:designCollab:page',
			info: 'performance:designCollab:info',
			stats: 'performance:designCollab:stats',
			add: 'performance:designCollab:add',
			update: 'performance:designCollab:update',
			delete: 'performance:designCollab:delete'
		}
	});
});
