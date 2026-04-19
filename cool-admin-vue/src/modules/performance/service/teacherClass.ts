/**
 * 班级前端请求服务。
 * 这里只封装主题19冻结的 teacherClass 主链接口，
 * 不负责班主任资源、跟进或看板请求。
 */
import { BaseService } from '/@/cool';
import type { TeacherClassPageResult, TeacherClassRecord } from '../types';

export default class PerformanceTeacherClassService extends BaseService {
	permission = {
		page: 'performance:teacherClass:page',
		info: 'performance:teacherClass:info',
		add: 'performance:teacherClass:add',
		update: 'performance:teacherClass:update',
		delete: 'performance:teacherClass:delete'
	};

	constructor() {
		super('admin/performance/teacherClass');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<TeacherClassPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<TeacherClassRecord>;
	}

	createTeacherClass(data: Partial<TeacherClassRecord>) {
		return super.add(data) as unknown as Promise<TeacherClassRecord>;
	}

	updateTeacherClass(data: Partial<TeacherClassRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<TeacherClassRecord>;
	}

	removeTeacherClass(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}
}

export const performanceTeacherClassService = new PerformanceTeacherClassService();
