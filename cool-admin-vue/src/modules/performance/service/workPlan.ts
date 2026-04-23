/**
 * 工作计划前端请求服务。
 * 这里只封装工作计划主链与钉钉审批来源同步接口，不负责页面编排、字段格式化或真实钉钉鉴权。
 * 维护重点是接口前缀、动作名和权限键必须与后端 workPlan 资源保持一致。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeWorkPlanPageResult, decodeWorkPlanRecord } from './work-plan-contract';
import type {
	WorkPlanCancelPayload,
	WorkPlanCreatePayload,
	WorkPlanDeletePayload,
	WorkPlanInfoQuery,
	WorkPlanPageQuery,
	WorkPlanPageResult,
	WorkPlanRecord,
	WorkPlanStartPayload,
	WorkPlanSyncPayload,
	WorkPlanUpdatePayload,
	WorkPlanCompletePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceWorkPlanService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.workPlan.page,
		info: PERMISSIONS.performance.workPlan.info,
		add: PERMISSIONS.performance.workPlan.add,
		update: PERMISSIONS.performance.workPlan.update,
		delete: PERMISSIONS.performance.workPlan.delete,
		start: PERMISSIONS.performance.workPlan.start,
		complete: PERMISSIONS.performance.workPlan.complete,
		cancel: PERMISSIONS.performance.workPlan.cancel,
		sync: PERMISSIONS.performance.workPlan.sync
	};

	constructor() {
		super('admin/performance/workPlan');
	}

	fetchPage(data: WorkPlanPageQuery) {
		return asPerformanceServicePromise<WorkPlanPageResult>(
			super.page(data),
			decodeWorkPlanPageResult
		);
	}

	fetchInfo(params: WorkPlanInfoQuery) {
		return asPerformanceServicePromise<WorkPlanRecord>(
			super.info(params),
			decodeWorkPlanRecord
		);
	}

	createWorkPlan(data: WorkPlanCreatePayload) {
		return asPerformanceServicePromise<WorkPlanRecord>(super.add(data), decodeWorkPlanRecord);
	}

	updateWorkPlan(data: WorkPlanUpdatePayload) {
		return asPerformanceServicePromise<WorkPlanRecord>(
			super.update(data),
			decodeWorkPlanRecord
		);
	}

	deleteWorkPlan(data: WorkPlanDeletePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}

	start(data: WorkPlanStartPayload) {
		return asPerformanceServicePromise<WorkPlanRecord>(
			this.request({
				url: '/start',
				method: 'POST',
				data
			}),
			decodeWorkPlanRecord
		);
	}

	complete(data: WorkPlanCompletePayload) {
		return asPerformanceServicePromise<WorkPlanRecord>(
			this.request({
				url: '/complete',
				method: 'POST',
				data
			}),
			decodeWorkPlanRecord
		);
	}

	cancel(data: WorkPlanCancelPayload) {
		return asPerformanceServicePromise<WorkPlanRecord>(
			this.request({
				url: '/cancel',
				method: 'POST',
				data
			}),
			decodeWorkPlanRecord
		);
	}

	syncDingtalkApproval(data: WorkPlanSyncPayload) {
		return asPerformanceServicePromise<WorkPlanRecord>(
			this.request({
				url: '/syncDingtalkApproval',
				method: 'POST',
				data
			}),
			decodeWorkPlanRecord
		);
	}
}

export const performanceWorkPlanService = new PerformanceWorkPlanService();
