/**
 * 绩效模块基础选项加载工具测试。
 * 这里只验证用户映射、部门树拍平和失败兜底，不负责挂载 Vue 页面或执行真实后台请求。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
	flattenDepartmentOptions,
	loadDepartmentOptions,
	loadUserOptions,
	mapUserOptions
} from '../src/modules/performance/utils/lookup-options.js';

test('mapUserOptions keeps user ids and department summaries', () => {
	assert.deepEqual(
		mapUserOptions([
			{
				id: '7',
				name: '平台员工',
				departmentId: 3,
				departmentName: '平台研发部'
			}
		]),
		[
			{
				id: 7,
				name: '平台员工',
				departmentId: 3,
				departmentName: '平台研发部'
			}
		]
	);
});

test('flattenDepartmentOptions keeps preorder traversal for nested departments', () => {
	assert.deepEqual(
		flattenDepartmentOptions([
			{
				id: 1,
				name: '总部',
				children: [
					{
						id: 2,
						name: '平台研发部'
					}
				]
			},
			{
				id: 3,
				name: '销售中心'
			}
		]),
		[
			{ id: 1, label: '总部' },
			{ id: 2, label: '平台研发部' },
			{ id: 3, label: '销售中心' }
		]
	);
});

test('loadUserOptions returns empty list when loader fails', async () => {
	const warnings = [];

	const result = await loadUserOptions(
		async () => {
			throw new Error('user failed');
		},
		error => {
			warnings.push(error.message);
		}
	);

	assert.deepEqual(result, []);
	assert.deepEqual(warnings, ['user failed']);
});

test('loadDepartmentOptions returns flattened departments from async loader', async () => {
	const result = await loadDepartmentOptions(async () => [
		{
			id: 11,
			name: '人力资源部',
			children: [
				{
					id: 12,
					name: '招聘组'
				}
			]
		}
	]);

	assert.deepEqual(result, [
		{ id: 11, label: '人力资源部' },
		{ id: 12, label: '招聘组' }
	]);
});
