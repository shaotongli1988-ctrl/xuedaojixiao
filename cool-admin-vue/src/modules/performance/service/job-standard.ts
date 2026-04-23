/**
 * 职位标准管理前端请求服务。
 * 这里只封装主题17冻结的 jobStandard page/info/add/update/setStatus 五个接口，
 * 不负责招聘计划、简历池、面试、录用或设计器扩展能力。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeJobStandardPageResult,
	decodeJobStandardRecord
} from './job-standard-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	JobStandardInfoQuery,
	JobStandardPageQuery,
	JobStandardPageResult,
	JobStandardRecord,
	JobStandardSaveRequest,
	JobStandardStatusUpdateRequest
} from '../types';

export default class PerformanceJobStandardService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.jobStandard.page,
		info: PERMISSIONS.performance.jobStandard.info,
		add: PERMISSIONS.performance.jobStandard.add,
		update: PERMISSIONS.performance.jobStandard.update,
		setStatus: PERMISSIONS.performance.jobStandard.setStatus
	};

	constructor() {
		super('admin/performance/jobStandard');
	}

	fetchPage(data: JobStandardPageQuery) {
		return asPerformanceServicePromise<JobStandardPageResult>(
			super.page(data),
			decodeJobStandardPageResult
		);
	}

	fetchInfo(params: JobStandardInfoQuery) {
		return asPerformanceServicePromise<JobStandardRecord>(
			super.info(params),
			decodeJobStandardRecord
		);
	}

	createJobStandard(data: JobStandardSaveRequest) {
		return asPerformanceServicePromise<JobStandardRecord>(
			super.add(data),
			decodeJobStandardRecord
		);
	}

	updateJobStandard(data: JobStandardSaveRequest & { id: number }) {
		return asPerformanceServicePromise<JobStandardRecord>(
			super.update(data),
			decodeJobStandardRecord
		);
	}

	setStatus(data: JobStandardStatusUpdateRequest) {
		return asPerformanceServicePromise<JobStandardRecord>(this.request({
			url: '/setStatus',
			method: 'POST',
			data
		}), decodeJobStandardRecord);
	}
}

export const performanceJobStandardService = new PerformanceJobStandardService();
