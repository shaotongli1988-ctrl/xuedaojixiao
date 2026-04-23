/**
 * 代理主体前端请求服务。
 * 这里只封装主题19 V0.2 冻结的 teacherAgent 主链接口，不负责归因冲突、审计或经营报表请求。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeTeacherAgentPageResult,
	decodeTeacherAgentRecord
} from './teacher-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	TeacherAgentBlacklistPayload,
	TeacherAgentCreatePayload,
	TeacherAgentInfoQuery,
	TeacherAgentPageQuery,
	TeacherAgentPageResult,
	TeacherAgentRecord,
	TeacherAgentUnblacklistPayload,
	TeacherAgentUpdatePayload,
	TeacherAgentUpdateStatusPayload
} from '../types';

export default class PerformanceTeacherAgentService extends BaseService {
	permission = PERMISSIONS.performance.teacherAgent;

	constructor() {
		super('admin/performance/teacherAgent');
	}

	fetchPage(data: TeacherAgentPageQuery) {
		return asPerformanceServicePromise<TeacherAgentPageResult>(
			super.page(data),
			decodeTeacherAgentPageResult
		);
	}

	fetchInfo(params: TeacherAgentInfoQuery) {
		return asPerformanceServicePromise<TeacherAgentRecord>(
			super.info(params),
			decodeTeacherAgentRecord
		);
	}

	createTeacherAgent(data: TeacherAgentCreatePayload) {
		return asPerformanceServicePromise<TeacherAgentRecord>(
			super.add(data),
			decodeTeacherAgentRecord
		);
	}

	updateTeacherAgent(data: TeacherAgentUpdatePayload) {
		return asPerformanceServicePromise<TeacherAgentRecord>(
			super.update(data),
			decodeTeacherAgentRecord
		);
	}

	updateStatus(data: TeacherAgentUpdateStatusPayload) {
		return asPerformanceServicePromise<TeacherAgentRecord>(this.request({
			url: '/updateStatus',
			method: 'POST',
			data
		}), decodeTeacherAgentRecord);
	}

	blacklist(data: TeacherAgentBlacklistPayload) {
		return asPerformanceServicePromise<TeacherAgentRecord>(this.request({
			url: '/blacklist',
			method: 'POST',
			data
		}), decodeTeacherAgentRecord);
	}

	unblacklist(data: TeacherAgentUnblacklistPayload) {
		return asPerformanceServicePromise<TeacherAgentRecord>(this.request({
			url: '/unblacklist',
			method: 'POST',
			data
		}), decodeTeacherAgentRecord);
	}
}

export const performanceTeacherAgentService = new PerformanceTeacherAgentService();
