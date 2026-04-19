/**
 * 代理体系审计前端请求服务。
 * 这里只封装主题19 V0.2 冻结的 teacherAgentAudit 只读接口，不负责任何写操作。
 */
import { BaseService } from '/@/cool';
import type { TeacherAgentAuditPageResult, TeacherAgentAuditRecord } from '../types';

export default class PerformanceTeacherAgentAuditService extends BaseService {
	permission = {
		page: 'performance:teacherAgentAudit:page',
		info: 'performance:teacherAgentAudit:info'
	};

	constructor() {
		super('admin/performance/teacherAgentAudit');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<TeacherAgentAuditPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<TeacherAgentAuditRecord>;
	}
}

export const performanceTeacherAgentAuditService = new PerformanceTeacherAgentAuditService();
