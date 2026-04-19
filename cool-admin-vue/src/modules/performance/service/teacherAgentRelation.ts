/**
 * 代理上下级关系前端请求服务。
 * 这里只封装主题19 V0.2 冻结的 teacherAgentRelation 接口，不负责主体档案、归因或审计请求。
 */
import { BaseService } from '/@/cool';
import type { TeacherAgentRelationPageResult, TeacherAgentRelationRecord } from '../types';

export default class PerformanceTeacherAgentRelationService extends BaseService {
	permission = {
		page: 'performance:teacherAgentRelation:page',
		add: 'performance:teacherAgentRelation:add',
		update: 'performance:teacherAgentRelation:update',
		delete: 'performance:teacherAgentRelation:delete'
	};

	constructor() {
		super('admin/performance/teacherAgentRelation');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<TeacherAgentRelationPageResult>;
	}

	createTeacherAgentRelation(data: Partial<TeacherAgentRelationRecord>) {
		return super.add(data) as unknown as Promise<TeacherAgentRelationRecord>;
	}

	updateTeacherAgentRelation(data: Partial<TeacherAgentRelationRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<TeacherAgentRelationRecord>;
	}

	removeTeacherAgentRelation(data: { id: number }) {
		return super.delete(data) as unknown as Promise<TeacherAgentRelationRecord>;
	}
}

export const performanceTeacherAgentRelationService = new PerformanceTeacherAgentRelationService();
