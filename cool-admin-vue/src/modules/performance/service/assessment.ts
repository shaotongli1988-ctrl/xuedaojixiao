import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeAssessmentExportRows,
	decodeAssessmentPageResult,
	decodeAssessmentRecord
} from './assessment-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	AssessmentActionRequest,
	AssessmentExportQuery,
	AssessmentExportRows,
	AssessmentInfoQuery,
	AssessmentPageQuery,
	AssessmentPageResult,
	AssessmentRecord,
	AssessmentReviewRequest,
	AssessmentSaveRequest,
	DeleteIdsRequest
} from '../types';

/**
 * 评估单前端请求服务。
 * 这里只封装模块 1 所需接口，不依赖自动生成的 EPS 服务。
 */
export default class PerformanceAssessmentService extends BaseService {
	permission = {
		myPage: PERMISSIONS.performance.assessment.myPage,
		page: PERMISSIONS.performance.assessment.page,
		pendingPage: PERMISSIONS.performance.assessment.pendingPage,
		info: PERMISSIONS.performance.assessment.info,
		add: PERMISSIONS.performance.assessment.add,
		update: PERMISSIONS.performance.assessment.update,
		delete: PERMISSIONS.performance.assessment.delete,
		submit: PERMISSIONS.performance.assessment.submit,
		approve: PERMISSIONS.performance.assessment.approve,
		reject: PERMISSIONS.performance.assessment.reject,
		export: PERMISSIONS.performance.assessment.export
	};

	constructor() {
		super('admin/performance/assessment');
	}

	fetchPage(data: AssessmentPageQuery) {
		return asPerformanceServicePromise<AssessmentPageResult>(
			super.page(data),
			decodeAssessmentPageResult
		);
	}

	fetchInfo(params: AssessmentInfoQuery) {
		return asPerformanceServicePromise<AssessmentRecord>(
			super.info(params),
			decodeAssessmentRecord
		);
	}

	createAssessment(data: AssessmentSaveRequest) {
		return asPerformanceServicePromise<AssessmentRecord>(
			super.add(data),
			decodeAssessmentRecord
		);
	}

	updateAssessment(data: AssessmentSaveRequest & { id: number }) {
		return asPerformanceServicePromise<AssessmentRecord>(
			super.update(data),
			decodeAssessmentRecord
		);
	}

	removeAssessment(data: DeleteIdsRequest) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}

	submit(data: AssessmentActionRequest) {
		return asPerformanceServicePromise<AssessmentRecord>(this.request({
			url: '/submit',
			method: 'POST',
			data
		}), decodeAssessmentRecord);
	}

	approve(data: AssessmentReviewRequest) {
		return asPerformanceServicePromise<AssessmentRecord>(this.request({
			url: '/approve',
			method: 'POST',
			data
		}), decodeAssessmentRecord);
	}

	reject(data: AssessmentReviewRequest) {
		return asPerformanceServicePromise<AssessmentRecord>(this.request({
			url: '/reject',
			method: 'POST',
			data
		}), decodeAssessmentRecord);
	}

	exportSummary(data: AssessmentExportQuery) {
		return asPerformanceServicePromise<AssessmentExportRows>(this.request({
			url: '/export',
			method: 'POST',
			data
		}), decodeAssessmentExportRows);
	}
}

export const performanceAssessmentService = new PerformanceAssessmentService();
