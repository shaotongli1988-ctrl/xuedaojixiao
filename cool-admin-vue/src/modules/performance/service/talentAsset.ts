/**
 * 招聘人才资产前端请求服务。
 * 这里只封装主题 12 冻结的 talentAsset page/info/add/update/delete 五个接口，
 * 不负责面试自动转化、简历全文下载或联系方式导出能力。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeTalentAssetPageResult,
	decodeTalentAssetRecord
} from './talent-asset-contract';
import { PERMISSIONS } from '../../base/generated/permissions.generated';
import type {
	DeleteIdsRequest,
	TalentAssetPageQuery,
	TalentAssetPageResult,
	TalentAssetInfoQuery,
	TalentAssetRecord,
	TalentAssetSaveRequest
} from '../types';

export default class PerformanceTalentAssetService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.talentAsset.page,
		info: PERMISSIONS.performance.talentAsset.info,
		add: PERMISSIONS.performance.talentAsset.add,
		update: PERMISSIONS.performance.talentAsset.update,
		delete: PERMISSIONS.performance.talentAsset.delete
	};

	constructor() {
		super('admin/performance/talentAsset');
	}

	fetchPage(data: TalentAssetPageQuery) {
		return asPerformanceServicePromise<TalentAssetPageResult>(
			super.page(data),
			decodeTalentAssetPageResult
		);
	}

	fetchInfo(params: TalentAssetInfoQuery) {
		return asPerformanceServicePromise<TalentAssetRecord>(
			super.info(params),
			decodeTalentAssetRecord
		);
	}

	createTalentAsset(data: TalentAssetSaveRequest) {
		return asPerformanceServicePromise<TalentAssetRecord>(
			super.add(data),
			decodeTalentAssetRecord
		);
	}

	updateTalentAsset(data: TalentAssetSaveRequest & { id: number }) {
		return asPerformanceServicePromise<TalentAssetRecord>(
			super.update(data),
			decodeTalentAssetRecord
		);
	}

	removeTalentAsset(data: DeleteIdsRequest) {
		return asPerformanceServicePromise<void>(super.delete(data));
	}
}

export const performanceTalentAssetService = new PerformanceTalentAssetService();
