/**
 * cool-uni 职位标准移动页类型与展示文案。
 * 这里只复用仓库 OpenAPI 生成的职位标准类型，不处理招聘计划、简历池、面试或桌面端编辑动作。
 */
export type {
	JobStandardPageQuery,
	JobStandardPageResult,
	JobStandardRecord,
	JobStandardSaveRequest,
	JobStandardStatus,
	JobStandardStatusUpdateRequest,
} from "/@/generated/performance-job-standard.generated";

export interface JobStandardInfoQuery {
	id: number;
}
