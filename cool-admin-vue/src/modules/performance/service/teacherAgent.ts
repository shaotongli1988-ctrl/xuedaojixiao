/**
 * 代理主体前端请求服务。
 * 这里只封装主题19 V0.2 冻结的 teacherAgent 主链接口，不负责归因冲突、审计或经营报表请求。
 */
import { BaseService } from '/@/cool';
import type { TeacherAgentPageResult, TeacherAgentRecord } from '../types';

export default class PerformanceTeacherAgentService extends BaseService {
	permission = {
		page: 'performance:teacherAgent:page',
		info: 'performance:teacherAgent:info',
		add: 'performance:teacherAgent:add',
		update: 'performance:teacherAgent:update',
		updateStatus: 'performance:teacherAgent:updateStatus',
		blacklist: 'performance:teacherAgent:blacklist',
		unblacklist: 'performance:teacherAgent:unblacklist'
	};

	constructor() {
		super('admin/performance/teacherAgent');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<TeacherAgentPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<TeacherAgentRecord>;
	}

	createTeacherAgent(data: Partial<TeacherAgentRecord>) {
		return super.add(data) as unknown as Promise<TeacherAgentRecord>;
	}

	updateTeacherAgent(data: Partial<TeacherAgentRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<TeacherAgentRecord>;
	}

	updateStatus(data: { id: number; status: string }) {
		return this.request({
			url: '/updateStatus',
			method: 'POST',
			data
		}) as unknown as Promise<TeacherAgentRecord>;
	}

	blacklist(data: { id: number }) {
		return this.request({
			url: '/blacklist',
			method: 'POST',
			data
		}) as unknown as Promise<TeacherAgentRecord>;
	}

	unblacklist(data: { id: number }) {
		return this.request({
			url: '/unblacklist',
			method: 'POST',
			data
		}) as unknown as Promise<TeacherAgentRecord>;
	}
}

export const performanceTeacherAgentService = new PerformanceTeacherAgentService();
