/**
 * 班主任资源归因前端请求服务。
 * 这里只封装主题19 V0.2 冻结的 teacherAttribution 接口，不负责冲突处理和审计请求。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeTeacherAttributionInfo,
	decodeTeacherAttributionInfoOrRecord,
	decodeTeacherAttributionPageResult
} from './teacher-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	TeacherAttributionAssignPayload,
	TeacherAttributionChangePayload,
	TeacherAttributionInfo,
	TeacherAttributionInfoQuery,
	TeacherAttributionPageQuery,
	TeacherAttributionPageResult,
	TeacherAttributionRecord,
	TeacherAttributionRemovePayload
} from '../types';

export default class PerformanceTeacherAttributionService extends BaseService {
	permission = PERMISSIONS.performance.teacherAttribution;

	constructor() {
		super('admin/performance/teacherAttribution');
	}

	fetchPage(data: TeacherAttributionPageQuery) {
		return asPerformanceServicePromise<TeacherAttributionPageResult>(
			super.page(data),
			decodeTeacherAttributionPageResult
		);
	}

	fetchInfo(params: TeacherAttributionInfoQuery) {
		return asPerformanceServicePromise<TeacherAttributionInfo | TeacherAttributionRecord>(
			super.info(params),
			decodeTeacherAttributionInfoOrRecord
		);
	}

	assign(data: TeacherAttributionAssignPayload) {
		return asPerformanceServicePromise<TeacherAttributionInfo>(
			this.request({
				url: '/assign',
				method: 'POST',
				data
			}),
			decodeTeacherAttributionInfo
		);
	}

	change(data: TeacherAttributionChangePayload) {
		return asPerformanceServicePromise<TeacherAttributionInfo>(
			this.request({
				url: '/change',
				method: 'POST',
				data
			}),
			decodeTeacherAttributionInfo
		);
	}

	remove(data: TeacherAttributionRemovePayload) {
		return asPerformanceServicePromise<TeacherAttributionInfo>(
			this.request({
				url: '/remove',
				method: 'POST',
				data
			}),
			decodeTeacherAttributionInfo
		);
	}
}

export const performanceTeacherAttributionService = new PerformanceTeacherAttributionService();
