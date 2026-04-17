import { BaseService } from '/@/cool';
import type {
	AssessmentExportRow,
	AssessmentPageResult,
	AssessmentRecord
} from '../types';

/**
 * 评估单前端请求服务。
 * 这里只封装模块 1 所需接口，不依赖自动生成的 EPS 服务。
 */
export default class PerformanceAssessmentService extends BaseService {
	permission = {
		myPage: 'performance:assessment:myPage',
		page: 'performance:assessment:page',
		pendingPage: 'performance:assessment:pendingPage',
		info: 'performance:assessment:info',
		add: 'performance:assessment:add',
		update: 'performance:assessment:update',
		delete: 'performance:assessment:delete',
		submit: 'performance:assessment:submit',
		approve: 'performance:assessment:approve',
		reject: 'performance:assessment:reject',
		export: 'performance:assessment:export'
	};

	constructor() {
		super('admin/performance/assessment');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<AssessmentPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<AssessmentRecord>;
	}

	createAssessment(data: AssessmentRecord) {
		return super.add(data) as unknown as Promise<AssessmentRecord>;
	}

	updateAssessment(data: AssessmentRecord) {
		return super.update(data) as unknown as Promise<AssessmentRecord>;
	}

	removeAssessment(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}

	submit(data: { id: number }) {
		return this.request({
			url: '/submit',
			method: 'POST',
			data
		}) as unknown as Promise<AssessmentRecord>;
	}

	approve(data: { id: number; comment?: string }) {
		return this.request({
			url: '/approve',
			method: 'POST',
			data
		}) as unknown as Promise<AssessmentRecord>;
	}

	reject(data: { id: number; comment?: string }) {
		return this.request({
			url: '/reject',
			method: 'POST',
			data
		}) as unknown as Promise<AssessmentRecord>;
	}

	exportSummary(data: any) {
		return this.request({
			url: '/export',
			method: 'POST',
			data
		}) as unknown as Promise<AssessmentExportRow[]>;
	}
}

export const performanceAssessmentService = new PerformanceAssessmentService();
