/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance courseLearning.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ApiResponse_CourseLearningTaskRecord {
	code: number;
	message: string;
	data: {
  id: number;
  title: string;
  status: CourseLearningTaskStatus;
  courseId: number;
  taskType: CourseLearningTaskType;
  submissionText?: string;
} & {
  courseTitle?: string;
  promptText?: string;
  latestScore?: number;
  feedbackSummary?: string;
  submissionText?: string;
  submittedAt?: string;
  evaluatedAt?: string;
};
}

export type CourseLearningTaskStatus = "submitted" | "pending" | "evaluated";

export type CourseLearningTaskType = "recite" | "practice";

export interface CourseReciteFetchInfoQuery {
	id: number;
}

export interface CourseReciteFetchPageRequest {
	page: number;
	size: number;
	courseId: number;
	status?: CourseLearningTaskStatus;
}

export interface ApiResponse_CourseLearningPageResult {
	code: number;
	message: string;
	data: Record<string, unknown> & {
  list?: Array<CourseLearningTaskRecord>;
  pagination: {
  page: number;
  size: number;
  total: number;
};
};
}

export type CourseLearningTaskRecord = {
  id: number;
  title: string;
  status: CourseLearningTaskStatus;
  courseId: number;
  taskType: CourseLearningTaskType;
  submissionText?: string;
} & {
  courseTitle?: string;
  promptText?: string;
  latestScore?: number;
  feedbackSummary?: string;
  submissionText?: string;
  submittedAt?: string;
  evaluatedAt?: string;
};

export interface CourseLearningSubmitPayload {
	id: number;
	submissionText: string;
}

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

export type CourseExamResultStatus = "locked" | "pending" | "passed" | "failed";

export interface CourseExamFetchSummaryQuery {
	courseId: number;
}
