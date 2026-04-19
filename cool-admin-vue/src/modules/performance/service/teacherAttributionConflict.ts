/**
 * 班主任资源归因冲突前端请求服务。
 * 这里只封装主题19 V0.2 冻结的 teacherAttributionConflict 接口，不负责主体档案或审计查询。
 */
import { BaseService } from '/@/cool';
import type {
	TeacherAttributionConflictDetail,
	TeacherAttributionConflictPageResult,
	TeacherAttributionConflictRecord
} from '../types';

export default class PerformanceTeacherAttributionConflictService extends BaseService {
	permission = {
		page: 'performance:teacherAttributionConflict:page',
		info: 'performance:teacherAttributionConflict:info',
		create: 'performance:teacherAttributionConflict:create',
		resolve: 'performance:teacherAttributionConflict:resolve'
	};

	constructor() {
		super('admin/performance/teacherAttributionConflict');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<TeacherAttributionConflictPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<TeacherAttributionConflictDetail>;
	}

	createConflict(data: any) {
		return this.request({
			url: '/create',
			method: 'POST',
			data
		}) as unknown as Promise<TeacherAttributionConflictRecord>;
	}

	resolveConflict(data: any) {
		return this.request({
			url: '/resolve',
			method: 'POST',
			data
		}) as unknown as Promise<any>;
	}
}

export const performanceTeacherAttributionConflictService =
	new PerformanceTeacherAttributionConflictService();
