/**
 * cool-uni 招聘计划移动页类型与展示文案。
 * 这里只复用仓库 OpenAPI 生成的招聘计划类型，不处理导入导出、状态流转或职位标准联动动作。
 */
export type {
	RecruitPlanActionRequest,
	RecruitPlanExportQuery,
	RecruitPlanExportRow,
	RecruitPlanImportCellValue,
	RecruitPlanImportRequest,
	RecruitPlanImportRow,
	RecruitPlanPageQuery,
	RecruitPlanRecord,
	RecruitPlanSaveRequest,
	RecruitmentSourceSnapshot,
	RecruitPlanStatus,
} from "/@/generated/performance-recruit-plan.generated";

export interface PagePagination {
	page: number;
	size: number;
	total: number;
}

export interface RecruitPlanDeleteResult {
	id: number;
	deleted: boolean;
}

export interface RecruitPlanImportResult {
	fileId: number;
	importedCount: number;
	skippedCount: number;
}

export type RecruitPlanPageResult = {
	list: import("/@/generated/performance-recruit-plan.generated").RecruitPlanRecord[];
	pagination: PagePagination;
};

export type RecruitPlanSourceSnapshot =
	import("/@/generated/performance-recruit-plan.generated").RecruitmentSourceSnapshot;

export type RecruitPlanInfoQuery =
	import("/@/generated/performance-recruit-plan.generated").RecruitPlanActionRequest;
