/**
 * 招聘简历池前端请求服务。
 * 这里只封装主题15冻结的 resumePool 主链接口，不负责后端权限判断、主题8/12主链扩展或附件文件流解析细节。
 * 维护重点是接口前缀与权限键必须固定为 resumePool，且下载类动作保持独立权限控制。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeResumePoolAttachmentDownloadResult,
	decodeResumePoolCreateInterviewResult,
	decodeResumePoolExportRows,
	decodeResumePoolImportResult,
	decodeResumePoolPageResult,
	decodeResumePoolRecord,
	decodeResumePoolTalentAssetConvertResult
} from './resume-pool-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	ResumePoolActionRequest,
	ResumePoolAttachmentDownloadResult,
	ResumePoolCreateInterviewResult,
	ResumePoolDownloadAttachmentRequest,
	ResumePoolExportQuery,
	ResumePoolExportRow,
	ResumePoolInfoQuery,
	ResumePoolImportRequest,
	ResumePoolImportResult,
	ResumePoolPageQuery,
	ResumePoolPageResult,
	ResumePoolRecord,
	ResumePoolSaveRequest,
	ResumePoolTalentAssetConvertResult,
	ResumePoolUploadAttachmentRequest
} from '../types';

export default class PerformanceResumePoolService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.resumePool.page,
		info: PERMISSIONS.performance.resumePool.info,
		add: PERMISSIONS.performance.resumePool.add,
		update: PERMISSIONS.performance.resumePool.update,
		import: PERMISSIONS.performance.resumePool.import,
		export: PERMISSIONS.performance.resumePool.export,
		uploadAttachment: PERMISSIONS.performance.resumePool.uploadAttachment,
		downloadAttachment: PERMISSIONS.performance.resumePool.downloadAttachment,
		convertToTalentAsset: PERMISSIONS.performance.resumePool.convertToTalentAsset,
		createInterview: PERMISSIONS.performance.resumePool.createInterview
	};

	constructor() {
		super('admin/performance/resumePool');
	}

	fetchPage(data: ResumePoolPageQuery) {
		return asPerformanceServicePromise<ResumePoolPageResult>(
			super.page(data),
			decodeResumePoolPageResult
		);
	}

	fetchInfo(params: ResumePoolInfoQuery) {
		return asPerformanceServicePromise<ResumePoolRecord>(
			super.info(params),
			decodeResumePoolRecord
		);
	}

	createResume(data: ResumePoolSaveRequest) {
		return asPerformanceServicePromise<ResumePoolRecord>(
			super.add(data),
			decodeResumePoolRecord
		);
	}

	updateResume(data: ResumePoolSaveRequest & { id: number }) {
		return asPerformanceServicePromise<ResumePoolRecord>(
			super.update(data),
			decodeResumePoolRecord
		);
	}

	importResume(data: ResumePoolImportRequest) {
		return asPerformanceServicePromise<ResumePoolImportResult>(
			this.request({
				url: '/import',
				method: 'POST',
				data
			}),
			decodeResumePoolImportResult
		);
	}

	exportResume(data: ResumePoolExportQuery) {
		return asPerformanceServicePromise<ResumePoolExportRow[]>(
			this.request({
				url: '/export',
				method: 'POST',
				data
			}),
			decodeResumePoolExportRows
		);
	}

	uploadAttachment(data: ResumePoolUploadAttachmentRequest) {
		return asPerformanceServicePromise<ResumePoolRecord>(
			this.request({
				url: '/uploadAttachment',
				method: 'POST',
				data
			}),
			decodeResumePoolRecord
		);
	}

	downloadAttachment(data: ResumePoolDownloadAttachmentRequest) {
		return asPerformanceServicePromise<ResumePoolAttachmentDownloadResult>(
			this.request({
				url: '/downloadAttachment',
				method: 'POST',
				data
			}),
			decodeResumePoolAttachmentDownloadResult
		);
	}

	convertToTalentAsset(data: ResumePoolActionRequest) {
		return asPerformanceServicePromise<ResumePoolTalentAssetConvertResult>(
			this.request({
				url: '/convertToTalentAsset',
				method: 'POST',
				data
			}),
			decodeResumePoolTalentAssetConvertResult
		);
	}

	createInterview(data: ResumePoolActionRequest) {
		return asPerformanceServicePromise<ResumePoolCreateInterviewResult>(
			this.request({
				url: '/createInterview',
				method: 'POST',
				data
			}),
			decodeResumePoolCreateInterviewResult
		);
	}
}

export const performanceResumePoolService = new PerformanceResumePoolService();
