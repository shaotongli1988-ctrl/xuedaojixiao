/**
 * 招聘简历池前端请求服务。
 * 这里只封装主题15冻结的 resumePool 主链接口，不负责后端权限判断、主题8/12主链扩展或附件文件流解析细节。
 * 维护重点是接口前缀与权限键必须固定为 resumePool，且下载类动作保持独立权限控制。
 */
import { BaseService } from '/@/cool';
import type { ResumePoolPageResult, ResumePoolRecord } from '../types';

export default class PerformanceResumePoolService extends BaseService {
	permission = {
		page: 'performance:resumePool:page',
		info: 'performance:resumePool:info',
		add: 'performance:resumePool:add',
		update: 'performance:resumePool:update',
		import: 'performance:resumePool:import',
		export: 'performance:resumePool:export',
		uploadAttachment: 'performance:resumePool:uploadAttachment',
		downloadAttachment: 'performance:resumePool:downloadAttachment',
		convertToTalentAsset: 'performance:resumePool:convertToTalentAsset',
		createInterview: 'performance:resumePool:createInterview'
	};

	constructor() {
		super('admin/performance/resumePool');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<ResumePoolPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<ResumePoolRecord>;
	}

	createResume(data: Partial<ResumePoolRecord>) {
		return super.add(data) as unknown as Promise<ResumePoolRecord>;
	}

	updateResume(data: Partial<ResumePoolRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<ResumePoolRecord>;
	}

	importResume(data: { fileId: number }) {
		return this.request({
			url: '/import',
			method: 'POST',
			data
		}) as Promise<any>;
	}

	exportResume(data: any) {
		return this.request({
			url: '/export',
			method: 'POST',
			data
		}) as Promise<any>;
	}

	uploadAttachment(data: { id: number; fileId: number }) {
		return this.request({
			url: '/uploadAttachment',
			method: 'POST',
			data
		}) as Promise<any>;
	}

	downloadAttachment(data: { id: number; attachmentId: number }) {
		return this.request({
			url: '/downloadAttachment',
			method: 'POST',
			data
		}) as Promise<any>;
	}

	convertToTalentAsset(data: { id: number }) {
		return this.request({
			url: '/convertToTalentAsset',
			method: 'POST',
			data
		}) as Promise<any>;
	}

	createInterview(data: { id: number }) {
		return this.request({
			url: '/createInterview',
			method: 'POST',
			data
		}) as Promise<any>;
	}
}

export const performanceResumePoolService = new PerformanceResumePoolService();
