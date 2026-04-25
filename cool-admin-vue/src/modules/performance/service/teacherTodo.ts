/**
 * 班主任待办前端请求服务。
 * 这里只封装主题19冻结的 teacherTodo page 接口，
 * 不负责资源详情、跟进新增或合作标记。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeTeacherTodoPageResult } from './teacher-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type { TeacherTodoPageQuery, TeacherTodoPageResult } from '../types';

export default class PerformanceTeacherTodoService extends BaseService {
	permission = PERMISSIONS.performance.teacherTodo;

	constructor() {
		super('admin/performance/teacherTodo');
	}

	fetchPage(data: TeacherTodoPageQuery) {
		return asPerformanceServicePromise<TeacherTodoPageResult>(
			super.page(data),
			decodeTeacherTodoPageResult
		);
	}
}

export const performanceTeacherTodoService = new PerformanceTeacherTodoService();
