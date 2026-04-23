/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance pip.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface PipCreatePipRequest {
	id?: number;
	employeeName?: string;
	status?: string;
	createTime?: string;
	updateTime?: string;
	title?: string;
	startDate?: string;
	endDate?: string;
	ownerName?: string;
	suggestionId?: number;
	improvementGoal?: string;
	sourceReason?: string;
	resultSummary?: string;
	assessmentId?: number;
	employeeId?: number;
	ownerId?: number;
	trackRecords?: Array<PipTrackRecord>;
}

export interface PipTrackRecord {
	id?: number;
	pipId?: number;
	recordDate: string;
	progress: string;
	nextPlan?: string;
	operatorId?: number;
	operatorName?: string;
	createTime?: string;
}

export interface ApiResponse_PipRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  employeeName?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
  title: string;
  startDate: string;
  endDate: string;
  ownerName?: string;
  suggestionId?: number;
  improvementGoal: string;
  sourceReason: string;
  resultSummary?: string;
} & {
  assessmentId?: number;
  employeeId: number;
  ownerId: number;
  trackRecords?: Array<PipTrackRecord>;
};
}

export interface PipCloseRequest {
	id: number;
	resultSummary?: string;
}

export interface PipCompleteRequest {
	id: number;
	resultSummary?: string;
}

export type PipExportQuery = PipExportSummaryRequest & {
  keyword?: string;
  employeeId?: number;
  ownerId?: number;
  status?: string;
  assessmentId?: number;
};

export interface PipExportSummaryRequest {

}

export interface ApiResponse_PipExportSummaryResult {
	code: number;
	message: string;
	data: Array<PipExportRow>;
}

export type PipExportRow = {
  id: number;
  employeeId: number;
  employeeName?: string;
  status: string;
  createTime?: string;
  updateTime?: string;
  title: string;
  startDate: string;
  endDate: string;
  ownerName?: string;
  ownerId: number;
} & {
  assessmentId?: number;
};

export interface PipFetchInfoQuery {
	id: number;
}

export type PipPageQuery = PipFetchPageRequest & {
  page: number;
  size: number;
  keyword?: string;
  employeeId?: number;
  ownerId?: number;
  status?: string;
  assessmentId?: number;
};

export interface PipFetchPageRequest {

}

export interface ApiResponse_PipPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<PipRecord>;
};
}

export type PipRecord = {
  id?: number;
  employeeName?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
  title: string;
  startDate: string;
  endDate: string;
  ownerName?: string;
  suggestionId?: number;
  improvementGoal: string;
  sourceReason: string;
  resultSummary?: string;
} & {
  assessmentId?: number;
  employeeId: number;
  ownerId: number;
  trackRecords?: Array<PipTrackRecord>;
};

export interface PipStartRequest {
	id: number;
}

export interface PipTrackRequest {
	id: number;
	recordDate: string;
	progress: string;
	nextPlan?: string;
}

export type PipUpdatePayload = {
  id?: number;
  employeeName?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  ownerName?: string;
  suggestionId?: number;
  improvementGoal?: string;
  sourceReason?: string;
  resultSummary?: string;
  assessmentId?: number;
  employeeId?: number;
  ownerId?: number;
  trackRecords?: Array<PipTrackRecord>;
} & {
  id: number;
};
