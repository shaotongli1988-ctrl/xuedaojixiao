/**
 * 资产报废前端请求服务。
 * 这里只封装主题20冻结的 assetDisposal 标准接口，
 * 不负责财务清理、回冲或外部审批流。
 */
import { BaseService } from '/@/cool';
import type { AssetDisposalPageResult, AssetDisposalRecord } from '../types';

export default class PerformanceAssetDisposalService extends BaseService {
	permission = {
		page: 'performance:assetDisposal:page',
		info: 'performance:assetDisposal:info',
		add: 'performance:assetDisposal:add',
		update: 'performance:assetDisposal:update',
		submit: 'performance:assetDisposal:submit',
		approve: 'performance:assetDisposal:approve',
		execute: 'performance:assetDisposal:execute',
		cancel: 'performance:assetDisposal:cancel'
	};

	constructor() {
		super('admin/performance/assetDisposal');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		status?: AssetDisposalRecord['status'];
		departmentId?: number;
		applicantId?: number;
	}) {
		return super.page(data) as unknown as Promise<AssetDisposalPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<AssetDisposalRecord>;
	}

	createDisposal(data: Partial<AssetDisposalRecord>) {
		return super.add(data) as unknown as Promise<AssetDisposalRecord>;
	}

	updateDisposal(data: Partial<AssetDisposalRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<AssetDisposalRecord>;
	}

	submitDisposal(data: { id: number }) {
		return this.request({
			url: '/submit',
			method: 'POST',
			data
		}) as unknown as Promise<AssetDisposalRecord>;
	}

	approveDisposal(data: { id: number; remark?: string }) {
		return this.request({
			url: '/approve',
			method: 'POST',
			data
		}) as unknown as Promise<AssetDisposalRecord>;
	}

	executeDisposal(data: { id: number; executeTime?: string }) {
		return this.request({
			url: '/execute',
			method: 'POST',
			data
		}) as unknown as Promise<AssetDisposalRecord>;
	}

	cancelDisposal(data: { id: number; remark?: string }) {
		return this.request({
			url: '/cancel',
			method: 'POST',
			data
		}) as unknown as Promise<AssetDisposalRecord>;
	}
}

export const performanceAssetDisposalService = new PerformanceAssetDisposalService();
