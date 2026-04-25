/**
 * 文件职责：封装 cool-uni 对人才资产移动页的列表和详情读取；
 * 不负责面试联动、删除或桌面端维护动作；
 * 维护重点是只复用 talentAsset 标准接口与权限键。
 */
import { createServiceRequester } from "/@/cool/service/requester";
import type {
	TalentAssetInfoQuery,
	TalentAssetPageQuery,
	TalentAssetPageResult,
	TalentAssetRecord,
} from "/@/types/performance-talent-asset";
import { PERMISSIONS } from "/@/generated/permissions.generated";

class PerformanceTalentAssetService {
	private requester = createServiceRequester("admin/performance/talentAsset");

	permission = {
		page: PERMISSIONS.performance.talentAsset.page,
		info: PERMISSIONS.performance.talentAsset.info,
	};

	fetchPage(data: TalentAssetPageQuery) {
		return this.requester.page(data) as Promise<TalentAssetPageResult>;
	}

	fetchInfo(params: TalentAssetInfoQuery) {
		return this.requester.info(params) as Promise<TalentAssetRecord>;
	}
}

export const performanceTalentAssetService = new PerformanceTalentAssetService();
