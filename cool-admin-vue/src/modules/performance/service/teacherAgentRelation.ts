/**
 * 代理上下级关系前端请求服务。
 * 这里只封装主题19 V0.2 冻结的 teacherAgentRelation 接口，不负责主体档案、归因或审计请求。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeTeacherAgentRelationPageResult,
	decodeTeacherAgentRelationRecord
} from './teacher-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	TeacherAgentRelationCreatePayload,
	TeacherAgentRelationPageQuery,
	TeacherAgentRelationPageResult,
	TeacherAgentRelationRecord,
	TeacherAgentRelationRemovePayload,
	TeacherAgentRelationUpdatePayload
} from '../types';

export default class PerformanceTeacherAgentRelationService extends BaseService {
	permission = PERMISSIONS.performance.teacherAgentRelation;

	constructor() {
		super('admin/performance/teacherAgentRelation');
	}

	fetchPage(data: TeacherAgentRelationPageQuery) {
		return asPerformanceServicePromise<TeacherAgentRelationPageResult>(
			super.page(data),
			decodeTeacherAgentRelationPageResult
		);
	}

	createTeacherAgentRelation(data: TeacherAgentRelationCreatePayload) {
		return asPerformanceServicePromise<TeacherAgentRelationRecord>(
			super.add(data),
			decodeTeacherAgentRelationRecord
		);
	}

	updateTeacherAgentRelation(data: TeacherAgentRelationUpdatePayload) {
		return asPerformanceServicePromise<TeacherAgentRelationRecord>(
			super.update(data),
			decodeTeacherAgentRelationRecord
		);
	}

	removeTeacherAgentRelation(data: TeacherAgentRelationRemovePayload) {
		return asPerformanceServicePromise<TeacherAgentRelationRecord>(
			super.delete(data),
			decodeTeacherAgentRelationRecord
		);
	}
}

export const performanceTeacherAgentRelationService = new PerformanceTeacherAgentRelationService();
