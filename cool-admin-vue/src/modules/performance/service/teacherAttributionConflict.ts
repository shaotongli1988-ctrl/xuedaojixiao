/**
 * 班主任资源归因冲突前端请求服务。
 * 这里只封装主题19 V0.2 冻结的 teacherAttributionConflict 接口，不负责主体档案或审计查询。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeTeacherAttributionConflictDetail,
	decodeTeacherAttributionConflictPageResult,
	decodeTeacherAttributionConflictRecord,
	decodeTeacherAttributionConflictResolveResult
} from './teacher-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	TeacherAttributionConflictDetail,
	TeacherAttributionConflictCreatePayload,
	TeacherAttributionConflictInfoQuery,
	TeacherAttributionConflictPageQuery,
	TeacherAttributionConflictPageResult,
	TeacherAttributionConflictRecord,
	TeacherAttributionConflictResolvePayload,
	TeacherAttributionConflictResolveResult
} from '../types';

export default class PerformanceTeacherAttributionConflictService extends BaseService {
	permission = PERMISSIONS.performance.teacherAttributionConflict;

	constructor() {
		super('admin/performance/teacherAttributionConflict');
	}

	fetchPage(data: TeacherAttributionConflictPageQuery) {
		return asPerformanceServicePromise<TeacherAttributionConflictPageResult>(
			super.page(data),
			decodeTeacherAttributionConflictPageResult
		);
	}

	fetchInfo(params: TeacherAttributionConflictInfoQuery) {
		return asPerformanceServicePromise<TeacherAttributionConflictDetail>(
			super.info(params),
			decodeTeacherAttributionConflictDetail
		);
	}

	createConflict(data: TeacherAttributionConflictCreatePayload) {
		return asPerformanceServicePromise<TeacherAttributionConflictRecord>(this.request({
			url: '/create',
			method: 'POST',
			data
		}), decodeTeacherAttributionConflictRecord);
	}

	resolveConflict(data: TeacherAttributionConflictResolvePayload) {
		return asPerformanceServicePromise<TeacherAttributionConflictResolveResult>(this.request({
			url: '/resolve',
			method: 'POST',
			data
		}), decodeTeacherAttributionConflictResolveResult);
	}
}

export const performanceTeacherAttributionConflictService =
	new PerformanceTeacherAttributionConflictService();
