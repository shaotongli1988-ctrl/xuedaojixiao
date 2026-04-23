/**
 * cool-uni 招聘计划移动页类型与展示文案。
 * 这里只复用仓库 OpenAPI 生成的招聘计划类型，不处理导入导出、状态流转或职位标准联动动作。
 */
export type {
	RecruitPlanActionRequest,
	RecruitPlanDeleteResult,
	RecruitPlanExportQuery,
	RecruitPlanExportRow,
	RecruitPlanImportCellValue,
	RecruitPlanImportRequest,
	RecruitPlanImportResult,
	RecruitPlanImportRow,
	RecruitPlanPageQuery,
	RecruitPlanPageResult,
	RecruitPlanRecord,
	RecruitPlanSaveRequest,
	RecruitPlanSourceSnapshot,
	RecruitPlanStatus,
} from "/@/generated/performance-recruit-plan.generated";

export type RecruitPlanInfoQuery =
	import("/@/generated/performance-recruit-plan.generated").RecruitPlanActionRequest;
