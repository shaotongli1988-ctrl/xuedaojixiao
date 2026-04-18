/**
 * 招聘人才资产前端请求服务。
 * 这里只封装主题 12 冻结的 talentAsset page/info/add/update/delete 五个接口，
 * 不负责面试自动转化、简历全文下载或联系方式导出能力。
 */
import { BaseService } from '/@/cool';
import type { TalentAssetPageResult, TalentAssetRecord } from '../types';

export default class PerformanceTalentAssetService extends BaseService {
	permission = {
		page: 'performance:talentAsset:page',
		info: 'performance:talentAsset:info',
		add: 'performance:talentAsset:add',
		update: 'performance:talentAsset:update',
		delete: 'performance:talentAsset:delete'
	};

	constructor() {
		super('admin/performance/talentAsset');
	}

	fetchPage(data: any) {
		return super.page(data) as unknown as Promise<TalentAssetPageResult>;
	}

	fetchInfo(params: { id: number }) {
		return super.info(params) as unknown as Promise<TalentAssetRecord>;
	}

	createTalentAsset(data: Partial<TalentAssetRecord>) {
		return super.add(data) as unknown as Promise<TalentAssetRecord>;
	}

	updateTalentAsset(data: Partial<TalentAssetRecord> & { id: number }) {
		return super.update(data) as unknown as Promise<TalentAssetRecord>;
	}

	removeTalentAsset(data: { ids: number[] }) {
		return super.delete(data) as unknown as Promise<void>;
	}
}

export const performanceTalentAssetService = new PerformanceTalentAssetService();
