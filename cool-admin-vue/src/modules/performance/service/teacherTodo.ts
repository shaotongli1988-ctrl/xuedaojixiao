/**
 * 班主任待办前端请求服务。
 * 这里只封装主题19冻结的 teacherTodo page 接口，
 * 不负责资源详情、跟进新增或合作标记。
 */
import { BaseService } from '/@/cool';
import type { TeacherTodoPageResult } from '../types';

export default class PerformanceTeacherTodoService extends BaseService {
	permission = {
		page: 'performance:teacherTodo:page'
	};

	constructor() {
		super('admin/performance/teacherTodo');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<TeacherTodoPageResult>;
	}
}

export const performanceTeacherTodoService = new PerformanceTeacherTodoService();
