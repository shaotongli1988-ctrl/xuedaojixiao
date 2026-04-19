/**
 * 绩效模块列表页状态 composable 测试。
 * 场景覆盖关键词：
 * - frontend 正常路径
 * - error 异常路径
 * - boundary 边界条件
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { useListPage } from '../src/modules/performance/composables/use-list-page.js';

test('frontend normal useListPage reloads rows and total', async () => {
	const calls = [];
	const listPage = useListPage({
		createFilters: () => ({
			keyword: '',
			status: ''
		}),
		fetchPage: async params => {
			calls.push(params);
			return {
				list: [{ id: 1, name: 'row-1' }],
				pagination: {
					total: 3
				}
			};
		}
	});

	await listPage.reload();

	assert.deepEqual(calls[0], {
		page: 1,
		size: 10,
		keyword: '',
		status: ''
	});
	assert.equal(listPage.rows.value.length, 1);
	assert.equal(listPage.pager.total, 3);
	assert.equal(listPage.loading.value, false);
});

test('frontend boundary search resets page and reset restores initial filters', async () => {
	const listPage = useListPage({
		createFilters: () => ({
			keyword: '',
			status: ''
		}),
		fetchPage: async params => ({
			list: [{ snapshot: `${params.keyword}-${params.status}` }],
			pagination: {
				total: 1
			}
		})
	});

	listPage.filters.keyword = 'capability';
	listPage.filters.status = 'active';
	listPage.pager.page = 4;

	await listPage.search();
	assert.equal(listPage.pager.page, 1);
	assert.equal(listPage.rows.value[0].snapshot, 'capability-active');

	listPage.filters.keyword = 'changed';
	await listPage.reset();
	assert.equal(listPage.filters.keyword, '');
	assert.equal(listPage.filters.status, '');
	assert.equal(listPage.pager.page, 1);
});

test('frontend error boundary canLoad=false skips fetch and fetch errors stay handled', async () => {
	let called = 0;
	let capturedError;
	const blockedPage = useListPage({
		createFilters: () => ({
			keyword: ''
		}),
		canLoad: () => false,
		fetchPage: async () => {
			called += 1;
			return {
				list: [],
				pagination: {
					total: 0
				}
			};
		}
	});

	await blockedPage.reload();
	assert.equal(called, 0);

	const failingPage = useListPage({
		createFilters: () => ({
			keyword: ''
		}),
		fetchPage: async () => {
			throw new Error('network');
		},
		onError: error => {
			capturedError = error;
		}
	});

	await failingPage.reload();
	assert.equal(capturedError?.message, 'network');
	assert.equal(failingPage.loading.value, false);
});
