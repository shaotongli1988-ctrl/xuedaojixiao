/**
 * 驾驶舱前端请求服务类型与接口封装。
 * 这里只维护绩效域 summary 与主题 6 crossSummary 的只读契约，
 * 不负责页面展示逻辑或其他绩效子模块请求。
 */
import { BaseService } from '/@/cool';
import type { DashboardCrossSummary, DashboardCrossSummaryQuery } from '../types';

export interface DashboardSummaryQuery {
	periodType?: string;
	periodValue?: string;
	departmentId?: number;
}

export interface DashboardStageProgressItem {
	stageKey: string;
	stageLabel: string;
	completedCount: number;
	totalCount: number;
	completionRate: number;
	sort: number;
}

export interface DashboardDepartmentDistributionItem {
	departmentId: number;
	departmentName: string;
	averageScore: number;
	assessmentCount: number;
}

export interface DashboardGradeDistributionItem {
	grade: 'S' | 'A' | 'B' | 'C';
	count: number;
	ratio: number;
}

export interface DashboardSummary {
	averageScore: number;
	pendingApprovalCount: number;
	goalCompletionRate: number;
	stageProgress: DashboardStageProgressItem[];
	departmentDistribution: DashboardDepartmentDistributionItem[];
	gradeDistribution: DashboardGradeDistributionItem[];
}

/**
 * 驾驶舱前端请求服务。
 * 这里只封装模块 3 的汇总接口，不负责评估单、目标地图和其他绩效页面请求。
 */
export default class PerformanceDashboardService extends BaseService {
	permission = {
		summary: 'performance:dashboard:summary',
		crossSummary: 'performance:dashboard:crossSummary'
	};

	constructor() {
		super('admin/performance/dashboard');
	}

	fetchSummary(params: DashboardSummaryQuery) {
		return this.request({
			url: '/summary',
			method: 'GET',
			params
		}) as unknown as Promise<DashboardSummary>;
	}

	fetchCrossSummary(params: DashboardCrossSummaryQuery) {
		return this.request({
			url: '/crossSummary',
			method: 'GET',
			params
		}) as unknown as Promise<DashboardCrossSummary>;
	}
}

export const performanceDashboardService = new PerformanceDashboardService();
