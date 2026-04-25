/**
 * 班主任合作标记前端请求服务。
 * 这里只封装主题19冻结的 teacherCooperation mark 接口，
 * 不负责资源列表、状态推进或班级维护。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeTeacherInfoRecord } from './teacher-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type { TeacherInfoRecord } from '../types';

export default class PerformanceTeacherCooperationService extends BaseService {
	permission = PERMISSIONS.performance.teacherCooperation;

	constructor() {
		super('admin/performance/teacherCooperation');
	}

	mark(data: { id: number }) {
		return asPerformanceServicePromise<TeacherInfoRecord>(
			this.request({
				url: '/mark',
				method: 'POST',
				data
			}),
			decodeTeacherInfoRecord
		);
	}
}

export const performanceTeacherCooperationService = new PerformanceTeacherCooperationService();
