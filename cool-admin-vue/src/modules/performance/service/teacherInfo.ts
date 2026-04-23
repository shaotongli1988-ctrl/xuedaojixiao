/**
 * 班主任资源前端请求服务。
 * 这里只封装主题19冻结的 teacherInfo 主链接口，
 * 不负责跟进、合作标记、班级和看板请求。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeTeacherAttributionInfo,
	decodeTeacherAttributionRecord,
	decodeTeacherInfoPageResult,
	decodeTeacherInfoRecord
} from './teacher-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	TeacherAttributionInfo,
	TeacherAttributionRecord,
	TeacherCooperationStatus,
	TeacherInfoAssignPayload,
	TeacherInfoAttributionHistoryQuery,
	TeacherInfoAttributionInfoQuery,
	TeacherInfoCreatePayload,
	TeacherInfoInfoQuery,
	TeacherInfoPageQuery,
	TeacherInfoPageResult,
	TeacherInfoRecord,
	TeacherInfoUpdatePayload,
	TeacherInfoUpdateStatusPayload
} from '../types';

export default class PerformanceTeacherInfoService extends BaseService {
	permission = PERMISSIONS.performance.teacherInfo;

	constructor() {
		super('admin/performance/teacherInfo');
	}

	fetchPage(data: TeacherInfoPageQuery) {
		return asPerformanceServicePromise<TeacherInfoPageResult>(
			super.page(data),
			decodeTeacherInfoPageResult
		);
	}

	fetchInfo(params: TeacherInfoInfoQuery) {
		return asPerformanceServicePromise<TeacherInfoRecord>(
			super.info(params),
			decodeTeacherInfoRecord
		);
	}

	createTeacherInfo(data: TeacherInfoCreatePayload) {
		return asPerformanceServicePromise<TeacherInfoRecord>(
			super.add(data),
			decodeTeacherInfoRecord
		);
	}

	updateTeacherInfo(data: TeacherInfoUpdatePayload) {
		return asPerformanceServicePromise<TeacherInfoRecord>(
			super.update(data),
			decodeTeacherInfoRecord
		);
	}

	assign(data: TeacherInfoAssignPayload) {
		return asPerformanceServicePromise<TeacherInfoRecord>(this.request({
			url: '/assign',
			method: 'POST',
			data
		}), decodeTeacherInfoRecord);
	}

	updateStatus(data: TeacherInfoUpdateStatusPayload) {
		return asPerformanceServicePromise<TeacherInfoRecord>(this.request({
			url: '/updateStatus',
			method: 'POST',
			data
		}), decodeTeacherInfoRecord);
	}

	fetchAttributionInfo(params: TeacherInfoAttributionInfoQuery) {
		return asPerformanceServicePromise<TeacherAttributionInfo>(this.request({
			url: '/attributionInfo',
			method: 'GET',
			params
		}), decodeTeacherAttributionInfo);
	}

	fetchAttributionHistory(params: TeacherInfoAttributionHistoryQuery) {
		return asPerformanceServicePromise<TeacherAttributionRecord[]>(this.request({
			url: '/attributionHistory',
			method: 'GET',
			params
		}), value =>
			Array.isArray(value)
				? value.map((item, index) =>
						decodeTeacherAttributionRecord(item, `teacherAttributionHistory[${index}]`)
				  )
				: (() => {
						throw new Error('teacherAttributionHistory 必须为数组');
				  })());
	}
}

export const performanceTeacherInfoService = new PerformanceTeacherInfoService();
