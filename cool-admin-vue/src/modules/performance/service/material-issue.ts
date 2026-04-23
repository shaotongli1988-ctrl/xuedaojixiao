/**
 * 物资领用前端请求服务。
 * 这里只封装物资管理一期 materialIssue 的列表、CRUD 和提交/确认领用动作接口，
 * 不负责归还流程、盘点或其他仓储流程。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeMaterialIssuePageResult,
	decodeMaterialIssueRecord
} from './material-issue-contract';
import type {
	MaterialIssueActionPayload,
	MaterialIssueCancelPayload,
	MaterialIssueCreatePayload,
	MaterialIssueInfoQuery,
	MaterialIssuePageQuery,
	MaterialIssuePageResult,
	MaterialIssueRecord,
	MaterialIssueSubmitPayload,
	MaterialIssueUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceMaterialIssueService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.materialIssue.page,
		info: PERMISSIONS.performance.materialIssue.info,
		add: PERMISSIONS.performance.materialIssue.add,
		update: PERMISSIONS.performance.materialIssue.update,
		submit: PERMISSIONS.performance.materialIssue.submit,
		issue: PERMISSIONS.performance.materialIssue.issue,
		cancel: PERMISSIONS.performance.materialIssue.cancel
	};

	constructor() {
		super('admin/performance/materialIssue');
	}

	fetchPage(data: MaterialIssuePageQuery) {
		return asPerformanceServicePromise<MaterialIssuePageResult>(
			super.page(data),
			decodeMaterialIssuePageResult
		);
	}

	fetchInfo(params: MaterialIssueInfoQuery) {
		return asPerformanceServicePromise<MaterialIssueRecord>(
			super.info(params),
			decodeMaterialIssueRecord
		);
	}

	createIssue(data: MaterialIssueCreatePayload) {
		return asPerformanceServicePromise<MaterialIssueRecord>(
			super.add(data),
			decodeMaterialIssueRecord
		);
	}

	updateIssue(data: MaterialIssueUpdatePayload) {
		return asPerformanceServicePromise<MaterialIssueRecord>(
			super.update(data),
			decodeMaterialIssueRecord
		);
	}

	submitIssue(data: MaterialIssueSubmitPayload) {
		return asPerformanceServicePromise<MaterialIssueRecord>(
			this.request({
				url: '/submit',
				method: 'POST',
				data
			}),
			decodeMaterialIssueRecord
		);
	}

	issueMaterial(data: MaterialIssueActionPayload) {
		return asPerformanceServicePromise<MaterialIssueRecord>(
			this.request({
				url: '/issue',
				method: 'POST',
				data
			}),
			decodeMaterialIssueRecord
		);
	}

	cancelIssue(data: MaterialIssueCancelPayload) {
		return asPerformanceServicePromise<MaterialIssueRecord>(
			this.request({
				url: '/cancel',
				method: 'POST',
				data
			}),
			decodeMaterialIssueRecord
		);
	}
}

export const performanceMaterialIssueService = new PerformanceMaterialIssueService();
