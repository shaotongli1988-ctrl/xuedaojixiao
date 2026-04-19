/**
 * 班主任跟进前端请求服务。
 * 这里只封装主题19冻结的 teacherFollow page/add 接口，
 * 不负责资源详情、合作标记或班级动作。
 */
import { BaseService } from '/@/cool';
import type { TeacherFollowPageResult, TeacherFollowRecord } from '../types';

export default class PerformanceTeacherFollowService extends BaseService {
	permission = {
		page: 'performance:teacherFollow:page',
		add: 'performance:teacherFollow:add'
	};

	constructor() {
		super('admin/performance/teacherFollow');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<TeacherFollowPageResult>;
	}

	createTeacherFollow(data: Partial<TeacherFollowRecord>) {
		return super.add(data) as unknown as Promise<TeacherFollowRecord>;
	}
}

export const performanceTeacherFollowService = new PerformanceTeacherFollowService();
