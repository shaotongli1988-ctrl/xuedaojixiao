/**
 * 班主任跟进前端请求服务。
 * 这里只封装主题19冻结的 teacherFollow page/add 接口，
 * 不负责资源详情、合作标记或班级动作。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeTeacherFollowPageResult, decodeTeacherFollowRecord } from './teacher-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	TeacherFollowCreatePayload,
	TeacherFollowPageQuery,
	TeacherFollowPageResult,
	TeacherFollowRecord
} from '../types';

export default class PerformanceTeacherFollowService extends BaseService {
	permission = PERMISSIONS.performance.teacherFollow;

	constructor() {
		super('admin/performance/teacherFollow');
	}

	fetchPage(data: TeacherFollowPageQuery) {
		return asPerformanceServicePromise<TeacherFollowPageResult>(
			super.page(data),
			decodeTeacherFollowPageResult
		);
	}

	createTeacherFollow(data: TeacherFollowCreatePayload) {
		return asPerformanceServicePromise<TeacherFollowRecord>(
			super.add(data),
			decodeTeacherFollowRecord
		);
	}
}

export const performanceTeacherFollowService = new PerformanceTeacherFollowService();
