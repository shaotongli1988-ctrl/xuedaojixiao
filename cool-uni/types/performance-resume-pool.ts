/**
 * cool-uni 简历池移动页类型与展示文案。
 * 这里只复用仓库 OpenAPI 生成的简历池类型，不处理桌面端的导入导出、附件流和转换动作。
 */
export type {
	ResumePoolActionRequest,
	ResumePoolAttachmentDownloadResult,
	ResumePoolAttachmentSummary,
	ResumePoolCreateInterviewResult,
	ResumePoolDownloadAttachmentRequest,
	ResumePoolExportQuery,
	ResumePoolExportRow,
	ResumePoolImportCellValue,
	ResumePoolImportOverwriteRow,
	ResumePoolImportRequest,
	ResumePoolImportResult,
	ResumePoolImportRow,
	ResumePoolInterviewSourceSnapshot,
	ResumePoolJobStandardSnapshot,
	ResumePoolPageQuery,
	ResumePoolPageResult,
	ResumePoolRecord,
	ResumePoolRecruitPlanSnapshot,
	ResumePoolReferenceSnapshot,
	ResumePoolSaveRequest,
	ResumePoolSourceType,
	ResumePoolStatus,
	ResumePoolTalentAssetConvertResult,
	ResumePoolUploadAttachmentRequest,
} from "/@/generated/performance-resume-pool.generated";

export type ResumePoolInfoQuery =
	import("/@/generated/performance-resume-pool.generated").ResumePoolActionRequest;
