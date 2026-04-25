/**
 * 代理体系审计前端请求服务。
 * 这里只封装主题19 V0.2 冻结的 teacherAgentAudit 只读接口，不负责任何写操作。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeTeacherAgentAuditPageResult,
	decodeTeacherAgentAuditRecord
} from './teacher-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	TeacherAgentAuditInfoQuery,
	TeacherAgentAuditPageQuery,
	TeacherAgentAuditPageResult,
	TeacherAgentAuditRecord
} from '../types';

export default class PerformanceTeacherAgentAuditService extends BaseService {
	permission = PERMISSIONS.performance.teacherAgentAudit;

	constructor() {
		super('admin/performance/teacherAgentAudit');
	}

	fetchPage(data: TeacherAgentAuditPageQuery) {
		return asPerformanceServicePromise<TeacherAgentAuditPageResult>(
			super.page(data),
			decodeTeacherAgentAuditPageResult
		);
	}

	fetchInfo(params: TeacherAgentAuditInfoQuery) {
		return asPerformanceServicePromise<TeacherAgentAuditRecord>(
			super.info(params),
			decodeTeacherAgentAuditRecord
		);
	}
}

export const performanceTeacherAgentAuditService = new PerformanceTeacherAgentAuditService();
