/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance course-exam.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ApiResponse_CourseExamSummary {
	code: number;
	message: string;
	data: {
  courseId: number;
  resultStatus: CourseExamResultStatus;
} & {
  courseTitle?: string;
  latestScore?: number;
  passThreshold?: number;
  summaryText?: string;
  updatedAt?: string;
};
}

export type CourseExamResultStatus = "pending" | "locked" | "passed" | "failed";

export interface CourseExamFetchSummaryQuery {
	courseId: number;
}
