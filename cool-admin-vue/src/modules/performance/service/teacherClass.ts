/**
 * 班级前端请求服务。
 * 这里只封装主题19冻结的 teacherClass 主链接口，
 * 不负责班主任资源、跟进或看板请求。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodeTeacherClassPageResult, decodeTeacherClassRecord } from './teacher-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	TeacherClassCreatePayload,
	TeacherClassInfoQuery,
	TeacherClassPageQuery,
	TeacherClassPageResult,
	TeacherClassRecord,
	TeacherClassRemovePayload,
	TeacherClassUpdatePayload
} from '../types';

export default class PerformanceTeacherClassService extends BaseService {
	permission = PERMISSIONS.performance.teacherClass;

	constructor() {
		super('admin/performance/teacherClass');
	}

	fetchPage(data: TeacherClassPageQuery) {
		return asPerformanceServicePromise<TeacherClassPageResult>(
			super.page(data),
			decodeTeacherClassPageResult
		);
	}

	fetchInfo(params: TeacherClassInfoQuery) {
		return asPerformanceServicePromise<TeacherClassRecord>(
			super.info(params),
			decodeTeacherClassRecord
		);
	}

	createTeacherClass(data: TeacherClassCreatePayload) {
		return asPerformanceServicePromise<TeacherClassRecord>(
			super.add(data),
			decodeTeacherClassRecord
		);
	}

	updateTeacherClass(data: TeacherClassUpdatePayload) {
		return asPerformanceServicePromise<TeacherClassRecord>(
			super.update(data),
			decodeTeacherClassRecord
		);
	}

	removeTeacherClass(data: TeacherClassRemovePayload) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}
}

export const performanceTeacherClassService = new PerformanceTeacherClassService();
