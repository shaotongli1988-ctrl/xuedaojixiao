/**
 * 招聘计划前端请求服务。
 * 这里只封装主题16冻结的 recruitPlan 页面、导入导出和状态流转接口，不负责后端权限判断、审批流或招聘全流程扩展。
 * 维护重点是接口前缀、权限键和动作集合必须固定为 page/info/add/update/delete/import/export/submit/close/void/reopen。
 */
import { BaseService } from '/@/cool';
import type {
	RecruitPlanExportRow,
	RecruitPlanImportRow,
	RecruitPlanPageResult,
	RecruitPlanRecord
} from '../types';

export default class PerformanceRecruitPlanService extends BaseService {
	permission = {
		page: 'performance:recruitPlan:page',
		info: 'performance:recruitPlan:info',
		add: 'performance:recruitPlan:add',
		update: 'performance:recruitPlan:update',
		delete: 'performance:recruitPlan:delete',
		import: 'performance:recruitPlan:import',
		export: 'performance:recruitPlan:export',
		submit: 'performance:recruitPlan:submit',
		close: 'performance:recruitPlan:close',
		void: 'performance:recruitPlan:void',
		reopen: 'performance:recruitPlan:reopen'
	};

	constructor() {
		super('admin/performance/recruitPlan');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<RecruitPlanPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<RecruitPlanRecord>;
	}

	createRecruitPlan(data: Partial<RecruitPlanRecord>) {
		return super.add(data) as unknown as Promise<RecruitPlanRecord>;
	}

	updateRecruitPlan(data: Partial<RecruitPlanRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<RecruitPlanRecord>;
	}

	removeRecruitPlan(data: { id: number }) {
		return this.request({
			url: '/delete',
			method: 'POST',
			data
		}) as unknown as Promise<void>;
	}

	importRecruitPlan(data: { fileId: number | string; rows: RecruitPlanImportRow[] }) {
		return this.request({
			url: '/import',
			method: 'POST',
			data
		}) as unknown as Promise<void>;
	}

	exportRecruitPlanSummary(data: any) {
		return this.request({
			url: '/export',
			method: 'POST',
			data
		}) as unknown as Promise<RecruitPlanExportRow[]>;
	}

	submitRecruitPlan(data: { id: number }) {
		return this.request({
			url: '/submit',
			method: 'POST',
			data
		}) as unknown as Promise<RecruitPlanRecord>;
	}

	closeRecruitPlan(data: { id: number }) {
		return this.request({
			url: '/close',
			method: 'POST',
			data
		}) as unknown as Promise<RecruitPlanRecord>;
	}

	voidRecruitPlan(data: { id: number }) {
		return this.request({
			url: '/void',
			method: 'POST',
			data
		}) as unknown as Promise<RecruitPlanRecord>;
	}

	reopenRecruitPlan(data: { id: number }) {
		return this.request({
			url: '/reopen',
			method: 'POST',
			data
		}) as unknown as Promise<RecruitPlanRecord>;
	}
}

export const performanceRecruitPlanService = new PerformanceRecruitPlanService();
