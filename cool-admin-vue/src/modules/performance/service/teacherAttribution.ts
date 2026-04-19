/**
 * 班主任资源归因前端请求服务。
 * 这里只封装主题19 V0.2 冻结的 teacherAttribution 接口，不负责冲突处理和审计请求。
 */
import { BaseService } from '/@/cool';
import type { TeacherAttributionInfo, TeacherAttributionPageResult, TeacherAttributionRecord } from '../types';

export default class PerformanceTeacherAttributionService extends BaseService {
	permission = {
		page: 'performance:teacherAttribution:page',
		info: 'performance:teacherAttribution:info',
		assign: 'performance:teacherAttribution:assign',
		change: 'performance:teacherAttribution:change',
		remove: 'performance:teacherAttribution:remove'
	};

	constructor() {
		super('admin/performance/teacherAttribution');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<TeacherAttributionPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<TeacherAttributionInfo | TeacherAttributionRecord>;
	}

	assign(data: any) {
		return this.request({
			url: '/assign',
			method: 'POST',
			data
		}) as unknown as Promise<TeacherAttributionInfo>;
	}

	change(data: any) {
		return this.request({
			url: '/change',
			method: 'POST',
			data
		}) as unknown as Promise<TeacherAttributionInfo>;
	}

	remove(data: { teacherId: number }) {
		return this.request({
			url: '/remove',
			method: 'POST',
			data
		}) as unknown as Promise<TeacherAttributionInfo>;
	}
}

export const performanceTeacherAttributionService = new PerformanceTeacherAttributionService();
