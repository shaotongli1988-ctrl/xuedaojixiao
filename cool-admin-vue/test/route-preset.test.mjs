/**
 * 主题13深链预置参数工具测试。
 * 这里只验证 query 取值、正整数解析和预置键存在判断，
 * 不负责挂载 Vue 组件或执行真实路由跳转。
 * 场景覆盖关键词：
 * - frontend 前端联动
 * - contract api 接口契约
 * - error 异常路径
 * - backend service integration 后端联动参数约束
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
	clearRoutePresetQuery,
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber,
	hasQueryPreset
} from '../src/modules/performance/utils/route-preset.js';

test('firstQueryValue returns scalar values as-is', () => {
	assert.equal(firstQueryValue('1'), '1');
	assert.equal(firstQueryValue(undefined), undefined);
});

test('firstQueryValue unwraps first item from array query values', () => {
	assert.equal(firstQueryValue(['2', '3']), '2');
});

test('normalizeQueryNumber keeps positive integer query values', () => {
	assert.equal(normalizeQueryNumber('12'), 12);
	assert.equal(normalizeQueryNumber(['9']), 9);
});

test('normalizeQueryNumber rejects empty, zero, negative and non-integer values', () => {
	assert.equal(normalizeQueryNumber(undefined), undefined);
	assert.equal(normalizeQueryNumber('0'), undefined);
	assert.equal(normalizeQueryNumber('-1'), undefined);
	assert.equal(normalizeQueryNumber('3.5'), undefined);
	assert.equal(normalizeQueryNumber('abc'), undefined);
});

test('frontend contract api error preset values stay invalid until page cleanup logic consumes them', () => {
	assert.equal(firstQueryValue(['oops', '1']), 'oops');
	assert.equal(normalizeQueryNumber(['oops', '1']), undefined);
	assert.equal(hasQueryPreset({ openPortrait: '0', employeeId: 'oops' }, ['openPortrait', 'employeeId']), true);
});

test('hasQueryPreset detects any configured preset key', () => {
	assert.equal(hasQueryPreset({ openRecord: '1' }, ['openRecord', 'employeeId']), true);
	assert.equal(hasQueryPreset({ employeeId: '23' }, ['openRecord', 'employeeId']), true);
	assert.equal(hasQueryPreset({ keyword: 'x' }, ['openRecord', 'employeeId']), false);
});

test('backend service integration frontend contract route preset helper keeps positive integer ids for linked pages', () => {
	assert.equal(
		normalizeQueryNumber(firstQueryValue({ value: 'not-used' }.value)),
		undefined
	);
	assert.equal(normalizeQueryNumber('101'), 101);
});

test('clearRoutePresetQuery removes only configured preset keys', async () => {
	const calls = [];
	const route = {
		path: '/performance/certificate',
		query: {
			openCreate: '1',
			sourceCourseId: '12',
			keyword: 'java'
		}
	};
	const router = {
		replace(location) {
			calls.push(location);
		}
	};

	await clearRoutePresetQuery({
		route,
		router,
		keys: ['openCreate', 'sourceCourseId']
	});

	assert.deepEqual(calls, [
		{
			path: '/performance/certificate',
			query: {
				keyword: 'java'
			}
		}
	]);
});

test('consumeRoutePreset skips pages without configured keys', async () => {
	let consumed = false;
	const replaced = [];

	const result = await consumeRoutePreset({
		route: {
			path: '/performance/course',
			query: {
				keyword: 'x'
			}
		},
		router: {
			replace(location) {
				replaced.push(location);
			}
		},
		keys: ['openDetail', 'courseId'],
		parse: query => ({
			shouldOpenDetail: firstQueryValue(query.openDetail) === '1',
			courseId: normalizeQueryNumber(query.courseId)
		}),
		shouldConsume: payload => Boolean(payload.shouldOpenDetail && payload.courseId),
		consume() {
			consumed = true;
		}
	});

	assert.equal(result, false);
	assert.equal(consumed, false);
	assert.deepEqual(replaced, []);
});

test('consumeRoutePreset clears invalid presets without consuming them', async () => {
	let consumed = false;
	const replaced = [];

	const result = await consumeRoutePreset({
		route: {
			path: '/performance/capability',
			query: {
				openPortrait: '1',
				employeeId: 'oops',
				keyword: 'y'
			}
		},
		router: {
			replace(location) {
				replaced.push(location);
			}
		},
		keys: ['openPortrait', 'employeeId'],
		parse: query => ({
			shouldOpenPortrait: firstQueryValue(query.openPortrait) === '1',
			employeeId: normalizeQueryNumber(query.employeeId)
		}),
		shouldConsume: payload => Boolean(payload.shouldOpenPortrait && payload.employeeId),
		consume() {
			consumed = true;
		}
	});

	assert.equal(result, false);
	assert.equal(consumed, false);
	assert.deepEqual(replaced, [
		{
			path: '/performance/capability',
			query: {
				keyword: 'y'
			}
		}
	]);
});

test('consumeRoutePreset consumes valid presets once and then clears them', async () => {
	const consumed = [];
	const replaced = [];

	const result = await consumeRoutePreset({
		route: {
			path: '/performance/course',
			query: {
				openDetail: '1',
				courseId: '88',
				tab: 'summary'
			}
		},
		router: {
			replace(location) {
				replaced.push(location);
			}
		},
		keys: ['openDetail', 'courseId'],
		parse: query => ({
			shouldOpenDetail: firstQueryValue(query.openDetail) === '1',
			courseId: normalizeQueryNumber(query.courseId)
		}),
		shouldConsume: payload => Boolean(payload.shouldOpenDetail && payload.courseId),
		consume(payload) {
			consumed.push(payload.courseId);
		}
	});

	assert.equal(result, true);
	assert.deepEqual(consumed, [88]);
	assert.deepEqual(replaced, [
		{
			path: '/performance/course',
			query: {
				tab: 'summary'
			}
		}
	]);
});
