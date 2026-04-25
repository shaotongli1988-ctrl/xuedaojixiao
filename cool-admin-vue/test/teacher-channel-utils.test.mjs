/**
 * 班主任化主题状态工具测试。
 * 这里只验证冻结状态标签、只读判定和关键动作门禁，
 * 不负责挂载页面或发起真实接口请求。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
	canCreateTeacherClass,
	canDeleteTeacherClass,
	canEditTeacherClass,
	canMarkTeacherCooperation,
	hasTeacherWritePermission,
	normalizeStringArray,
	resolveFollowContent,
	teacherClassStatusLabel,
	teacherCooperationStatusLabel
} from '../src/modules/performance/utils/teacher-channel.js';

test('teacher channel status labels stay aligned with frozen values', () => {
	assert.equal(teacherCooperationStatusLabel('partnered'), '已合作');
	assert.equal(teacherClassStatusLabel('closed'), '已关闭');
	assert.equal(teacherCooperationStatusLabel('unknown'), 'unknown');
});

test('teacher channel write permission treats no write perms as readonly', () => {
	assert.equal(
		hasTeacherWritePermission({
			teacherAdd: false,
			teacherUpdate: false,
			teacherAssign: false,
			teacherUpdateStatus: false,
			followAdd: false,
			cooperationMark: false,
			classAdd: false,
			classUpdate: false,
			classDelete: false
		}),
		false
	);
	assert.equal(
		hasTeacherWritePermission({
			teacherAdd: false,
			teacherUpdate: false,
			teacherAssign: false,
			teacherUpdateStatus: false,
			followAdd: true
		}),
		true
	);
});

test('teacher channel action guards keep cooperation and class rules strict', () => {
	assert.equal(
		canMarkTeacherCooperation(
			{
				cooperationStatus: 'contacted',
				lastFollowTime: '2026-04-19 10:00:00'
			},
			true
		),
		true
	);
	assert.equal(
		canMarkTeacherCooperation(
			{
				cooperationStatus: 'contacted',
				lastFollowTime: ''
			},
			true
		),
		false
	);
	assert.equal(
		canCreateTeacherClass(
			{
				cooperationStatus: 'partnered'
			},
			true
		),
		true
	);
	assert.equal(
		canCreateTeacherClass(
			{
				cooperationStatus: 'terminated'
			},
			true
		),
		false
	);
	assert.equal(canEditTeacherClass({ status: 'closed' }, true), false);
	assert.equal(canDeleteTeacherClass({ status: 'draft' }, true), true);
});

test('teacher channel value helpers normalize tags and follow content', () => {
	assert.deepEqual(normalizeStringArray('数学,英语，物理'), ['数学', '英语', '物理']);
	assert.equal(resolveFollowContent({ followContent: '首次建联成功' }), '首次建联成功');
	assert.equal(resolveFollowContent({}), '-');
});
