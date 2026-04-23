/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance course-practice.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ApiResponse_CourseLearningTaskRecord {
	code: number;
	message: string;
	data: {
  id: number;
  status: CourseLearningTaskStatus;
  title: string;
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
  status: CourseLearningTaskStatus;
  title: string;
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
