import { BaseService } from '/@/cool';
import type {
	GoalExportRow,
	GoalOpsAccessProfile,
	GoalOpsDepartmentConfig,
	GoalOpsOverview,
	GoalOpsPlanPageResult,
	GoalOpsPlanRecord,
	GoalOpsReportInfo,
	GoalPageResult,
	GoalRecord
} from '../types';

/**
 * 目标地图与目标运营台前端请求服务。
 * 这里只封装目标模块与目标运营台增量接口，不依赖自动生成的 EPS 服务。
 */
export default class PerformanceGoalService extends BaseService {
	permission = {
		page: 'performance:goal:page',
		info: 'performance:goal:info',
		add: 'performance:goal:add',
		update: 'performance:goal:update',
		delete: 'performance:goal:delete',
		progressUpdate: 'performance:goal:progressUpdate',
		opsManage: 'performance:goal:opsManage',
		export: 'performance:goal:export'
	};

	constructor() {
		super('admin/performance/goal');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<GoalPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<GoalRecord>;
	}

	createGoal(data: GoalRecord) {
		return super.add(data) as unknown as Promise<GoalRecord>;
	}

	updateGoal(data: GoalRecord) {
		return super.update(data) as unknown as Promise<GoalRecord>;
	}

	removeGoal(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}

	progressUpdate(data: { id: number; currentValue: number; remark?: string }) {
		return this.request({
			url: '/progressUpdate',
			method: 'POST',
			data
		}) as unknown as Promise<GoalRecord>;
	}

	exportSummary(data: any) {
		return this.request({
			url: '/export',
			method: 'POST',
			data
		}) as unknown as Promise<GoalExportRow[]>;
	}

	fetchOpsDepartmentConfig(params?: { departmentId?: number }) {
		return this.request({
			url: '/opsDepartmentConfig',
			method: 'GET',
			params
		}) as unknown as Promise<GoalOpsDepartmentConfig>;
	}

	fetchOpsAccessProfile(params?: { departmentId?: number }) {
		return this.request({
			url: '/opsAccessProfile',
			method: 'GET',
			params
		}) as unknown as Promise<GoalOpsAccessProfile>;
	}

	saveOpsDepartmentConfig(data: GoalOpsDepartmentConfig) {
		return this.request({
			url: '/opsDepartmentConfigSave',
			method: 'POST',
			data
		}) as unknown as Promise<GoalOpsDepartmentConfig>;
	}

	fetchOpsPlanPage(data: {
		page?: number;
		size?: number;
		periodType?: string;
		planDate?: string;
		departmentId?: number;
		employeeId?: number;
		sourceType?: string;
		keyword?: string;
		periodStartDate?: string;
		periodEndDate?: string;
	}) {
		return this.request({
			url: '/opsPlanPage',
			method: 'POST',
			data
		}) as unknown as Promise<GoalOpsPlanPageResult>;
	}

	fetchOpsPlanInfo(params: { id: number }) {
		return this.request({
			url: '/opsPlanInfo',
			method: 'GET',
			params
		}) as unknown as Promise<GoalOpsPlanRecord>;
	}

	saveOpsPlan(data: GoalOpsPlanRecord) {
		return this.request({
			url: '/opsPlanSave',
			method: 'POST',
			data
		}) as unknown as Promise<GoalOpsPlanRecord>;
	}

	deleteOpsPlan(data: { ids: number[] }) {
		return this.request({
			url: '/opsPlanDelete',
			method: 'POST',
			data
		}) as unknown as Promise<void>;
	}

	submitOpsDailyResults(data: {
		planDate: string;
		departmentId?: number;
		items: Array<{
			planId: number;
			actualValue: number;
		}>;
	}) {
		return this.request({
			url: '/opsDailySubmit',
			method: 'POST',
			data
		}) as unknown as Promise<GoalOpsOverview>;
	}

	finalizeOpsDailyResults(data: { planDate: string; departmentId?: number }) {
		return this.request({
			url: '/opsDailyFinalize',
			method: 'POST',
			data
		}) as unknown as Promise<{
			departmentId: number;
			planDate: string;
			autoZeroCount: number;
		}>;
	}

	fetchOpsOverview(data: { planDate: string; departmentId?: number; employeeId?: number }) {
		return this.request({
			url: '/opsOverview',
			method: 'POST',
			data
		}) as unknown as Promise<GoalOpsOverview>;
	}

	fetchOpsReportInfo(params: { reportDate: string; departmentId?: number }) {
		return this.request({
			url: '/opsReportInfo',
			method: 'GET',
			params
		}) as unknown as Promise<GoalOpsReportInfo>;
	}

	generateOpsReport(data: { planDate: string; departmentId?: number }) {
		return this.request({
			url: '/opsReportGenerate',
			method: 'POST',
			data
		}) as unknown as Promise<GoalOpsReportInfo>;
	}

	updateOpsReportStatus(data: {
		reportDate: string;
		departmentId?: number;
		status: string;
		remark?: string;
	}) {
		return this.request({
			url: '/opsReportStatusUpdate',
			method: 'POST',
			data
		}) as unknown as Promise<GoalOpsReportInfo>;
	}
}

export const performanceGoalService = new PerformanceGoalService();
