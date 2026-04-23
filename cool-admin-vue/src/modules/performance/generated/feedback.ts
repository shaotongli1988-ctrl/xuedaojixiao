/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance feedback.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export type FeedbackTaskRecord = {
  id?: number;
  employeeName?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
  title: string;
  deadline?: string;
  submittedCount?: number;
  totalCount?: number;
  feedbackUserIds?: Array<number>;
} & {
  assessmentId?: number;
  employeeId: number;
  relationTypes?: Array<FeedbackTaskRelationItem>;
};

export type FeedbackTaskRelationItem = {
  feedbackUserId: number;
  feedbackUserName?: string;
} & {
  relationType: string;
};

export interface ApiResponse_FeedbackTaskRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  employeeName?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
  title: string;
  deadline?: string;
  submittedCount?: number;
  totalCount?: number;
  feedbackUserIds?: Array<number>;
} & {
  assessmentId?: number;
  employeeId: number;
  relationTypes?: Array<FeedbackTaskRelationItem>;
};
}

export type FeedbackExportQuery = FeedbackExportSummaryRequest & {
  keyword?: string;
  employeeId?: number;
  status?: string;
};

export interface FeedbackExportSummaryRequest {

}

export interface ApiResponse_FeedbackExportSummaryResult {
	code: number;
	message: string;
	data: Array<FeedbackExportRow>;
}

export type FeedbackExportRow = {
  employeeId: number;
  title: string;
  deadline?: string;
  submittedCount: number;
  totalCount: number;
  taskId: number;
  averageScore: number;
} & {
  assessmentId?: number;
};

export interface FeedbackFetchInfoQuery {
	id: number;
}

export type FeedbackPageQuery = FeedbackFetchPageRequest & {
  page: number;
  size: number;
  keyword?: string;
  employeeId?: number;
  status?: string;
};

export interface FeedbackFetchPageRequest {

}

export interface ApiResponse_FeedbackPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<FeedbackTaskRecord>;
};
}

export interface FeedbackSubmitFeedbackRequest {
	taskId: number;
	score: number;
	content?: string;
	relationType: string;
}

export interface ApiResponse_FeedbackSummary {
	code: number;
	message: string;
	data: {
  submittedCount: number;
  totalCount: number;
  taskId: number;
  averageScore: number;
} & {
  records: Array<FeedbackRecord>;
};
}

export type FeedbackRecord = {
  id?: number;
  status?: string;
  submitTime?: string;
  createTime?: string;
  taskId?: number;
  score: number;
  content?: string;
  feedbackUserId?: number;
  feedbackUserName?: string;
} & {
  relationType: string;
};

export interface FeedbackFetchSummaryQuery {
	taskId: number;
}
