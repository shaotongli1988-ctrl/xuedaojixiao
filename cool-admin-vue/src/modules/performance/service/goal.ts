import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeGoalOpsAccessProfile,
	decodeGoalOpsDailyFinalizeResult,
	decodeGoalOpsDepartmentConfig,
	decodeGoalOpsOverview,
	decodeGoalOpsPlanPageResult,
	decodeGoalOpsPlanRecord,
	decodeGoalOpsReportInfo
} from './goal-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	DeleteIdsRequest,
	GoalCreateRequest,
	GoalExportQuery,
	GoalExportRow,
	GoalInfoQuery,
	GoalOpsAccessProfile,
	GoalOpsDailyFinalizeRequest,
	GoalOpsDailyFinalizeResult,
	GoalOpsDailySubmitRequest,
	GoalOpsDepartmentConfig,
	GoalOpsDepartmentScopeQuery,
	GoalOpsOverview,
	GoalOpsOverviewQuery,
	GoalOpsPlanPageQuery,
	GoalOpsPlanPageResult,
	GoalOpsPlanInfoQuery,
	GoalOpsPlanRecord,
	GoalOpsPlanSaveRequest,
	GoalOpsReportGenerateRequest,
	GoalOpsReportInfo,
	GoalOpsReportQuery,
	GoalOpsReportStatusUpdateRequest,
	GoalPageQuery,
	GoalProgressUpdateRequest,
	GoalPageResult,
	GoalRecord,
	GoalUpdateRequest
} from '../types';

/**
 * 目标地图与目标运营台前端请求服务。
 * 这里只封装目标模块与目标运营台增量接口，不依赖自动生成的 EPS 服务。
 */
export default class PerformanceGoalService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.goal.page,
		info: PERMISSIONS.performance.goal.info,
		add: PERMISSIONS.performance.goal.add,
		update: PERMISSIONS.performance.goal.update,
		delete: PERMISSIONS.performance.goal.delete,
		progressUpdate: PERMISSIONS.performance.goal.progressUpdate,
		opsManage: PERMISSIONS.performance.goal.opsManage,
		opsAccessProfile: PERMISSIONS.performance.goal.opsAccessProfile,
		opsDepartmentConfig: PERMISSIONS.performance.goal.opsDepartmentConfig,
		opsDepartmentConfigSave: PERMISSIONS.performance.goal.opsDepartmentConfigSave,
		opsPlanPage: PERMISSIONS.performance.goal.opsPlanPage,
		opsPlanInfo: PERMISSIONS.performance.goal.opsPlanInfo,
		opsPlanSave: PERMISSIONS.performance.goal.opsPlanSave,
		opsPlanDelete: PERMISSIONS.performance.goal.opsPlanDelete,
		opsDailySubmit: PERMISSIONS.performance.goal.opsDailySubmit,
		opsDailyFinalize: PERMISSIONS.performance.goal.opsDailyFinalize,
		opsOverview: PERMISSIONS.performance.goal.opsOverview,
		opsReportInfo: PERMISSIONS.performance.goal.opsReportInfo,
		opsReportGenerate: PERMISSIONS.performance.goal.opsReportGenerate,
		opsReportStatusUpdate: PERMISSIONS.performance.goal.opsReportStatusUpdate,
		export: PERMISSIONS.performance.goal.export
	};

	constructor() {
		super('admin/performance/goal');
	}

	fetchPage(data: GoalPageQuery) {
		return asPerformanceServicePromise<GoalPageResult>(super.page(data));
	}

	fetchInfo(params: GoalInfoQuery) {
		return asPerformanceServicePromise<GoalRecord>(super.info(params));
	}

	createGoal(data: GoalCreateRequest) {
		return asPerformanceServicePromise<GoalRecord>(super.add(data));
	}

	updateGoal(data: GoalUpdateRequest) {
		return asPerformanceServicePromise<GoalRecord>(super.update(data));
	}

	removeGoal(data: DeleteIdsRequest) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}

	progressUpdate(data: GoalProgressUpdateRequest) {
		return asPerformanceServicePromise<GoalRecord>(this.request({
			url: '/progressUpdate',
			method: 'POST',
			data
		}));
	}

	exportSummary(data: GoalExportQuery) {
		return asPerformanceServicePromise<GoalExportRow[]>(this.request({
			url: '/export',
			method: 'POST',
			data
		}));
	}

	fetchOpsDepartmentConfig(params?: GoalOpsDepartmentScopeQuery) {
		return asPerformanceServicePromise<GoalOpsDepartmentConfig>(this.request({
			url: '/opsDepartmentConfig',
			method: 'GET',
			params
		}), decodeGoalOpsDepartmentConfig);
	}

	fetchOpsAccessProfile(params?: GoalOpsDepartmentScopeQuery) {
		return asPerformanceServicePromise<GoalOpsAccessProfile>(this.request({
			url: '/opsAccessProfile',
			method: 'GET',
			params
		}), decodeGoalOpsAccessProfile);
	}

	saveOpsDepartmentConfig(data: GoalOpsDepartmentConfig) {
		return asPerformanceServicePromise<GoalOpsDepartmentConfig>(this.request({
			url: '/opsDepartmentConfigSave',
			method: 'POST',
			data
		}), decodeGoalOpsDepartmentConfig);
	}

	fetchOpsPlanPage(data: GoalOpsPlanPageQuery) {
		return asPerformanceServicePromise<GoalOpsPlanPageResult>(this.request({
			url: '/opsPlanPage',
			method: 'POST',
			data
		}), decodeGoalOpsPlanPageResult);
	}

	fetchOpsPlanInfo(params: GoalOpsPlanInfoQuery) {
		return asPerformanceServicePromise<GoalOpsPlanRecord>(this.request({
			url: '/opsPlanInfo',
			method: 'GET',
			params
		}), decodeGoalOpsPlanRecord);
	}

	saveOpsPlan(data: GoalOpsPlanSaveRequest) {
		return asPerformanceServicePromise<GoalOpsPlanRecord>(this.request({
			url: '/opsPlanSave',
			method: 'POST',
			data
		}), decodeGoalOpsPlanRecord);
	}

	deleteOpsPlan(data: DeleteIdsRequest) {
		return asPerformanceServicePromise<void>(this.request({
			url: '/opsPlanDelete',
			method: 'POST',
			data
		}));
	}

	submitOpsDailyResults(data: GoalOpsDailySubmitRequest) {
		return asPerformanceServicePromise<GoalOpsOverview>(this.request({
			url: '/opsDailySubmit',
			method: 'POST',
			data
		}), decodeGoalOpsOverview);
	}

	finalizeOpsDailyResults(data: GoalOpsDailyFinalizeRequest) {
		return asPerformanceServicePromise<GoalOpsDailyFinalizeResult>(this.request({
			url: '/opsDailyFinalize',
			method: 'POST',
			data
		}), decodeGoalOpsDailyFinalizeResult);
	}

	fetchOpsOverview(data: GoalOpsOverviewQuery) {
		return asPerformanceServicePromise<GoalOpsOverview>(this.request({
			url: '/opsOverview',
			method: 'POST',
			data
		}), decodeGoalOpsOverview);
	}

	fetchOpsReportInfo(params: GoalOpsReportQuery) {
		return asPerformanceServicePromise<GoalOpsReportInfo>(this.request({
			url: '/opsReportInfo',
			method: 'GET',
			params
		}), decodeGoalOpsReportInfo);
	}

	generateOpsReport(data: GoalOpsReportGenerateRequest) {
		return asPerformanceServicePromise<GoalOpsReportInfo>(this.request({
			url: '/opsReportGenerate',
			method: 'POST',
			data
		}), decodeGoalOpsReportInfo);
	}

	updateOpsReportStatus(data: GoalOpsReportStatusUpdateRequest) {
		return asPerformanceServicePromise<GoalOpsReportInfo>(this.request({
			url: '/opsReportStatusUpdate',
			method: 'POST',
			data
		}), decodeGoalOpsReportInfo);
	}
}

export const performanceGoalService = new PerformanceGoalService();
