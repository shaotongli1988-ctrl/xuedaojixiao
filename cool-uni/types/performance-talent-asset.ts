/**
 * cool-uni 人才资产移动页类型与展示文案。
 * 这里只复用仓库 OpenAPI 生成的人才资产类型，不处理面试联动、删除或桌面端维护动作。
 */
export type {
	DeleteIdsRequest,
	TalentAssetPageQuery,
	TalentAssetRecord,
	TalentAssetSaveRequest,
	TalentAssetStatus,
} from "/@/generated/performance-talent-asset.generated";

export interface PagePagination {
	page: number;
	size: number;
	total: number;
}

export type TalentAssetPageResult = {
	list: import("/@/generated/performance-talent-asset.generated").TalentAssetRecord[];
	pagination: PagePagination;
};

export interface TalentAssetInfoQuery {
	id: number;
}

export function talentAssetTagsLabel(tagList?: string[]) {
	return tagList?.length ? tagList.join("、") : "-";
}
