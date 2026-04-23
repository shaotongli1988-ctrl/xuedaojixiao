/**
 * 招聘中心跨页面深跳转回归测试。
 * 这里只校验面试/录用页是否保留带 openDetail 的深链参数，不负责挂载 Vue 页面或执行真实浏览器跳转。
 * 维护重点是来源页按钮跳转和目标页 query 消费字段必须保持一致，否则用户会回到列表页但无法定位记录。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const interviewViewPath = new URL(
	'../src/modules/performance/views/interview/index.vue',
	import.meta.url
);
const resumePoolViewPath = new URL(
	'../src/modules/performance/views/resumePool/index.vue',
	import.meta.url
);
const hiringViewPath = new URL(
	'../src/modules/performance/views/hiring/index.vue',
	import.meta.url
);
const talentAssetViewPath = new URL(
	'../src/modules/performance/views/talentAsset/index.vue',
	import.meta.url
);

test('resumePool page consumes openDetail preset for deep-linked source navigation', async () => {
	const source = await readFile(resumePoolViewPath, 'utf8');

	assert.match(source, /keys:\s*\['openDetail', 'resumePoolId'\]/);
	assert.match(source, /detailRecord\.value = record;/);
	assert.match(source, /performanceResumePoolService\.createInterview\(\{\s*id:\s*rowId\s*\}\)/);
	assert.match(source, /path:\s*'\/performance\/interview',[\s\S]*openDetail:\s*'1'[\s\S]*interviewId:\s*String\(interviewId\)/);
});

test('interview page keeps deep-link detail consumer and source back-links', async () => {
	const source = await readFile(interviewViewPath, 'utf8');

	assert.match(source, /keys:\s*\['openDetail', 'interviewId'\]/);
	assert.match(source, /'sourceResource',\s*'talentAssetId',/);
	assert.match(source, /detailInterview\.value = record;/);
	assert.match(source, /sourceResource:\s*'talentAsset',[\s\S]*talentAssetId:\s*prefill\.talentAssetId/);
	assert.match(source, /function interviewTalentAssetLabel/);
	assert.match(source, /path:\s*'\/performance\/resumePool',[\s\S]*openDetail:\s*'1'[\s\S]*resumePoolId:\s*String\(record\.resumePoolId\)/);
	assert.match(source, /path:\s*'\/performance\/recruit-plan',[\s\S]*openDetail:\s*'1'[\s\S]*recruitPlanId:\s*String\(record\.recruitPlanId\)/);
});

test('hiring page links back to interview detail instead of plain list page', async () => {
	const source = await readFile(hiringViewPath, 'utf8');

	assert.match(source, /path:\s*'\/performance\/interview',[\s\S]*openDetail:\s*'1'[\s\S]*interviewId:\s*String\(record\.sourceSnapshot\.interviewId\)/);
});

test('talentAsset page carries source context into interview prefill', async () => {
	const source = await readFile(talentAssetViewPath, 'utf8');

	assert.match(source, /sourceResource:\s*'talentAsset'/);
	assert.match(source, /talentAssetId:\s*record\.id\s*\?\s*String\(record\.id\)\s*:\s*undefined/);
});
