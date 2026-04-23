/**
 * 招聘计划前端请求服务。
 * 这里只封装主题16冻结的 recruitPlan 页面、导入导出和状态流转接口，不负责后端权限判断、审批流或招聘全流程扩展。
 * 维护重点是接口前缀、权限键和动作集合必须固定为 page/info/add/update/delete/import/export/submit/close/void/reopen。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeRecruitPlanDeleteResult,
	decodeRecruitPlanExportRows,
	decodeRecruitPlanImportResult,
	decodeRecruitPlanPageResult,
	decodeRecruitPlanRecord
} from './recruit-plan-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	RecruitPlanActionRequest,
	RecruitPlanDeleteResult,
	RecruitPlanExportQuery,
	RecruitPlanExportRow,
	RecruitPlanInfoQuery,
	RecruitPlanImportRequest,
	RecruitPlanImportResult,
	RecruitPlanPageQuery,
	RecruitPlanPageResult,
	RecruitPlanRecord,
	RecruitPlanSaveRequest
} from '../types';

export default class PerformanceRecruitPlanService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.recruitPlan.page,
		info: PERMISSIONS.performance.recruitPlan.info,
		add: PERMISSIONS.performance.recruitPlan.add,
		update: PERMISSIONS.performance.recruitPlan.update,
		delete: PERMISSIONS.performance.recruitPlan.delete,
		import: PERMISSIONS.performance.recruitPlan.import,
		export: PERMISSIONS.performance.recruitPlan.export,
		submit: PERMISSIONS.performance.recruitPlan.submit,
		close: PERMISSIONS.performance.recruitPlan.close,
		void: PERMISSIONS.performance.recruitPlan.void,
		reopen: PERMISSIONS.performance.recruitPlan.reopen
	};

	constructor() {
		super('admin/performance/recruitPlan');
	}

	fetchPage(data: RecruitPlanPageQuery) {
		return asPerformanceServicePromise<RecruitPlanPageResult>(
			super.page(data),
			decodeRecruitPlanPageResult
		);
	}

	fetchInfo(params: RecruitPlanInfoQuery) {
		return asPerformanceServicePromise<RecruitPlanRecord>(
			super.info(params),
			decodeRecruitPlanRecord
		);
	}

	createRecruitPlan(data: RecruitPlanSaveRequest) {
		return asPerformanceServicePromise<RecruitPlanRecord>(
			super.add(data),
			decodeRecruitPlanRecord
		);
	}

	updateRecruitPlan(data: RecruitPlanSaveRequest & { id: number }) {
		return asPerformanceServicePromise<RecruitPlanRecord>(
			super.update(data),
			decodeRecruitPlanRecord
		);
	}

	removeRecruitPlan(data: RecruitPlanActionRequest) {
		return asPerformanceServicePromise<RecruitPlanDeleteResult>(this.request({
			url: '/delete',
			method: 'POST',
			data
		}), decodeRecruitPlanDeleteResult);
	}

	importRecruitPlan(data: RecruitPlanImportRequest) {
		return asPerformanceServicePromise<RecruitPlanImportResult>(this.request({
			url: '/import',
			method: 'POST',
			data
		}), decodeRecruitPlanImportResult);
	}

	exportRecruitPlanSummary(data: RecruitPlanExportQuery) {
		return asPerformanceServicePromise<RecruitPlanExportRow[]>(this.request({
			url: '/export',
			method: 'POST',
			data
		}), decodeRecruitPlanExportRows);
	}

	submitRecruitPlan(data: RecruitPlanActionRequest) {
		return asPerformanceServicePromise<RecruitPlanRecord>(this.request({
			url: '/submit',
			method: 'POST',
			data
		}), decodeRecruitPlanRecord);
	}

	closeRecruitPlan(data: RecruitPlanActionRequest) {
		return asPerformanceServicePromise<RecruitPlanRecord>(this.request({
			url: '/close',
			method: 'POST',
			data
		}), decodeRecruitPlanRecord);
	}

	voidRecruitPlan(data: RecruitPlanActionRequest) {
		return asPerformanceServicePromise<RecruitPlanRecord>(this.request({
			url: '/void',
			method: 'POST',
			data
		}), decodeRecruitPlanRecord);
	}

	reopenRecruitPlan(data: RecruitPlanActionRequest) {
		return asPerformanceServicePromise<RecruitPlanRecord>(this.request({
			url: '/reopen',
			method: 'POST',
			data
		}), decodeRecruitPlanRecord);
	}
}

export const performanceRecruitPlanService = new PerformanceRecruitPlanService();
