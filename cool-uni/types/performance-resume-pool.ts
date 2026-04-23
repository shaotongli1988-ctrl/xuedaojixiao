/**
 * cool-uni 简历池移动页类型与展示文案。
 * 这里只复用仓库 OpenAPI 生成的简历池类型，不处理桌面端的导入导出、附件流和转换动作。
 */
import type { RecruitmentSourceSnapshot } from "/@/generated/performance-resume-pool.generated";

export type {
	ResumePoolActionRequest,
	ResumePoolAttachmentSummary,
	ResumePoolDownloadAttachmentRequest,
	ResumePoolExportQuery,
	ResumePoolExportRow,
	ResumePoolImportCellValue,
	ResumePoolImportOverwriteRow,
	ResumePoolImportRequest,
	ResumePoolImportRow,
	ResumePoolPageQuery,
	ResumePoolRecord,
	ResumePoolSaveRequest,
	ResumePoolSourceType,
	ResumePoolStatus,
	ResumePoolUploadAttachmentRequest,
} from "/@/generated/performance-resume-pool.generated";

export interface PagePagination {
	page: number;
	size: number;
	total: number;
}

export interface ResumePoolImportResult {
	fileId: number;
	importedCount: number;
	overwrittenCount: number;
	skippedCount: number;
}

export interface ResumePoolAttachmentDownloadResult {
	id: number;
	name: string;
	size: number;
	uploadTime: string;
	url: string;
	downloadUrl: string;
	fileId: string;
}

export interface ResumePoolTalentAssetConvertResult {
	talentAssetId: number;
	created: boolean;
}

export interface ResumePoolCreateInterviewResult {
	interviewId: number;
	status: import("/@/generated/performance-resume-pool.generated").ResumePoolStatus;
	resumePoolId: number;
	recruitPlanId?: number | null;
	jobStandardId?: number | null;
	sourceSnapshot?: RecruitmentSourceSnapshot;
	snapshot?: RecruitmentSourceSnapshot;
	resumePoolSummary?: RecruitmentSourceSnapshot;
	resumePoolSnapshot?: RecruitmentSourceSnapshot;
	recruitPlanSummary?: RecruitmentSourceSnapshot | null;
	recruitPlanSnapshot?: RecruitmentSourceSnapshot | null;
	jobStandardSummary?: RecruitmentSourceSnapshot | null;
	jobStandardSnapshot?: RecruitmentSourceSnapshot | null;
}

export type ResumePoolPageResult = {
	list: import("/@/generated/performance-resume-pool.generated").ResumePoolRecord[];
	pagination: PagePagination;
};

export type ResumePoolInterviewSourceSnapshot = RecruitmentSourceSnapshot;
export type ResumePoolJobStandardSnapshot = RecruitmentSourceSnapshot;
export type ResumePoolRecruitPlanSnapshot = RecruitmentSourceSnapshot;
export type ResumePoolReferenceSnapshot = RecruitmentSourceSnapshot;

export type ResumePoolInfoQuery =
	import("/@/generated/performance-resume-pool.generated").ResumePoolActionRequest;
