/**
 * 班主任资源前端请求服务。
 * 这里只封装主题19冻结的 teacherInfo 主链接口，
 * 不负责跟进、合作标记、班级和看板请求。
 */
import { BaseService } from '/@/cool';
import type {
	TeacherAttributionInfo,
	TeacherAttributionRecord,
	TeacherCooperationStatus,
	TeacherInfoPageResult,
	TeacherInfoRecord
} from '../types';

export default class PerformanceTeacherInfoService extends BaseService {
	permission = {
		page: 'performance:teacherInfo:page',
		info: 'performance:teacherInfo:info',
		add: 'performance:teacherInfo:add',
		update: 'performance:teacherInfo:update',
		assign: 'performance:teacherInfo:assign',
		updateStatus: 'performance:teacherInfo:updateStatus'
	};

	constructor() {
		super('admin/performance/teacherInfo');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<TeacherInfoPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<TeacherInfoRecord>;
	}

	createTeacherInfo(data: Partial<TeacherInfoRecord>) {
		return super.add(data) as unknown as Promise<TeacherInfoRecord>;
	}

	updateTeacherInfo(data: Partial<TeacherInfoRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<TeacherInfoRecord>;
	}

	assign(data: { id: number; ownerEmployeeId: number }) {
		return this.request({
			url: '/assign',
			method: 'POST',
			data
		}) as unknown as Promise<TeacherInfoRecord>;
	}

	updateStatus(data: { id: number; status: TeacherCooperationStatus }) {
		return this.request({
			url: '/updateStatus',
			method: 'POST',
			data
		}) as unknown as Promise<TeacherInfoRecord>;
	}

	fetchAttributionInfo(params: { id: number }) {
		return this.request({
			url: '/attributionInfo',
			method: 'GET',
			params
		}) as unknown as Promise<TeacherAttributionInfo>;
	}

	fetchAttributionHistory(params: { id: number }) {
		return this.request({
			url: '/attributionHistory',
			method: 'GET',
			params
		}) as unknown as Promise<TeacherAttributionRecord[]>;
	}
}

export const performanceTeacherInfoService = new PerformanceTeacherInfoService();
