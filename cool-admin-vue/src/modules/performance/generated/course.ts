/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance course.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface CourseCreateCourseRequest {
	id?: number;
	code?: string;
	status?: CourseStatus;
	createTime?: string;
	updateTime?: string;
	category?: string;
	title?: string;
	description?: string;
	enrollmentCount?: number;
	startDate?: string;
	endDate?: string;
}

export type CourseStatus = "draft" | "closed" | "published";

export interface ApiResponse_CourseRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  code?: string;
  status?: CourseStatus;
  createTime?: string;
  updateTime?: string;
  category?: string;
  title: string;
  description?: string;
  enrollmentCount?: number;
} & {
  startDate?: string;
  endDate?: string;
};
}

export interface CourseRemoveCourseRequest {
	ids: Array<number>;
}

export interface ApiResponse_CourseRemoveCourseResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface CourseFetchEnrollmentPageRequest {
	page: number;
	size: number;
	courseId: number;
	keyword?: string;
	status?: string;
}

export interface ApiResponse_CourseEnrollmentPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<CourseEnrollmentRecord>;
};
}

export type CourseEnrollmentRecord = {
  status?: string;
  userId: number;
  userName: string;
  enrollTime?: string;
} & {
  score?: number;
};

export interface CourseFetchInfoQuery {
	id: number;
}

export type CoursePageQuery = CourseFetchPageRequest & {
  page: number;
  size: number;
  keyword?: string;
  category?: string;
  status?: string;
};

export interface CourseFetchPageRequest {

}

export interface ApiResponse_CoursePageResult {
	code: number;
	message: string;
	data: Record<string, unknown> & {
  list: Array<CourseRecord>;
};
}

export type CourseRecord = {
  id?: number;
  code?: string;
  status?: CourseStatus;
  createTime?: string;
  updateTime?: string;
  category?: string;
  title: string;
  description?: string;
  enrollmentCount?: number;
} & {
  startDate?: string;
  endDate?: string;
};

export type CourseUpdatePayload = {
  id?: number;
  code?: string;
  status?: CourseStatus;
  createTime?: string;
  updateTime?: string;
  category?: string;
  title?: string;
  description?: string;
  enrollmentCount?: number;
  startDate?: string;
  endDate?: string;
} & {
  id: number;
};

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
