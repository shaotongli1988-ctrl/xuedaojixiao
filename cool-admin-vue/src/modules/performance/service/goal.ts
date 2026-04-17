import { BaseService } from '/@/cool';
import type { GoalExportRow, GoalPageResult, GoalRecord } from '../types';

/**
 * 目标地图前端请求服务。
 * 这里只封装模块 2 所需接口，不依赖自动生成的 EPS 服务。
 */
export default class PerformanceGoalService extends BaseService {
	permission = {
		page: 'performance:goal:page',
		info: 'performance:goal:info',
		add: 'performance:goal:add',
		update: 'performance:goal:update',
		delete: 'performance:goal:delete',
		progressUpdate: 'performance:goal:progressUpdate',
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
}

export const performanceGoalService = new PerformanceGoalService();
