/**
 * 职位标准管理前端请求服务。
 * 这里只封装主题17冻结的 jobStandard page/info/add/update/setStatus 五个接口，
 * 不负责招聘计划、简历池、面试、录用或设计器扩展能力。
 */
import { BaseService } from '/@/cool';
import type { JobStandardPageResult, JobStandardRecord, JobStandardStatus } from '../types';

export default class PerformanceJobStandardService extends BaseService {
	permission = {
		page: 'performance:jobStandard:page',
		info: 'performance:jobStandard:info',
		add: 'performance:jobStandard:add',
		update: 'performance:jobStandard:update',
		setStatus: 'performance:jobStandard:setStatus'
	};

	constructor() {
		super('admin/performance/jobStandard');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		targetDepartmentId?: number;
		status?: JobStandardStatus;
	}) {
		return super.page(data) as unknown as Promise<JobStandardPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<JobStandardRecord>;
	}

	createJobStandard(data: Partial<JobStandardRecord>) {
		return super.add(data) as unknown as Promise<JobStandardRecord>;
	}

	updateJobStandard(data: Partial<JobStandardRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<JobStandardRecord>;
	}

	setStatus(data: { id: number; status: JobStandardStatus }) {
		return this.request({
			url: '/setStatus',
			method: 'POST',
			data
		}) as unknown as Promise<JobStandardRecord>;
	}
}

export const performanceJobStandardService = new PerformanceJobStandardService();
