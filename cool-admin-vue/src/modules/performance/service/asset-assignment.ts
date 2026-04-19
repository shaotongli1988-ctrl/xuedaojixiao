/**
 * 资产领用归还前端请求服务。
 * 这里只封装主题20冻结的 assetAssignment 标准接口，
 * 不负责资产台账主数据维护或其他子单据流程。
 */
import { BaseService } from '/@/cool';
import type { AssetAssignmentPageResult, AssetAssignmentRecord } from '../types';

export default class PerformanceAssetAssignmentService extends BaseService {
	permission = {
		page: 'performance:assetAssignment:page',
		add: 'performance:assetAssignment:add',
		update: 'performance:assetAssignment:update',
		return: 'performance:assetAssignment:return',
		markLost: 'performance:assetAssignment:markLost',
		delete: 'performance:assetAssignment:delete'
	};

	constructor() {
		super('admin/performance/assetAssignment');
	}

	fetchPage(data: {
		page: number;
		size: number;
		keyword?: string;
		status?: AssetAssignmentRecord['status'];
		assetId?: number;
		assigneeId?: number;
		departmentId?: number;
	}) {
		return super.page(data) as unknown as Promise<AssetAssignmentPageResult>;
	}

	createAssignment(data: Partial<AssetAssignmentRecord>) {
		return super.add(data) as unknown as Promise<AssetAssignmentRecord>;
	}

	updateAssignment(data: Partial<AssetAssignmentRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<AssetAssignmentRecord>;
	}

	returnAsset(data: { id: number; actualReturnDate?: string; returnRemark?: string }) {
		return this.request({
			url: '/return',
			method: 'POST',
			data
		}) as unknown as Promise<AssetAssignmentRecord>;
	}

	markLost(data: { id: number; returnRemark?: string }) {
		return this.request({
			url: '/markLost',
			method: 'POST',
			data
		}) as unknown as Promise<AssetAssignmentRecord>;
	}

	removeAssignment(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}
}

export const performanceAssetAssignmentService = new PerformanceAssetAssignmentService();
