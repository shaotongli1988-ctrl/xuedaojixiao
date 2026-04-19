/**
 * 班主任合作标记前端请求服务。
 * 这里只封装主题19冻结的 teacherCooperation mark 接口，
 * 不负责资源列表、状态推进或班级维护。
 */
import { BaseService } from '/@/cool';
import type { TeacherInfoRecord } from '../types';

export default class PerformanceTeacherCooperationService extends BaseService {
	permission = {
		mark: 'performance:teacherCooperation:mark'
	};

	constructor() {
		super('admin/performance/teacherCooperation');
	}

	mark(data: { id: number }) {
		return this.request({
			url: '/mark',
			method: 'POST',
			data
		}) as unknown as Promise<TeacherInfoRecord>;
	}
}

export const performanceTeacherCooperationService = new PerformanceTeacherCooperationService();
