/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance suggestion.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface SuggestionAcceptRequest {
	id: number;
}

export interface ApiResponse_SuggestionAcceptResult {
	code: number;
	message: string;
	data: {
  prefill?: {
  assessmentId?: number;
  employeeId?: number;
  suggestionType?: SuggestionType;
  suggestionId?: number;
};
} & {
  suggestion?: SuggestionRecord;
};
}

export type SuggestionType = "pip" | "promotion";

export type SuggestionRecord = {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  createTime?: string;
  status?: SuggestionStatus;
  assessmentId?: number;
  employeeId?: number;
  employeeName?: string;
  periodValue?: string;
  suggestionType: SuggestionType;
  periodType?: string;
  triggerLabel?: string;
  handleTime?: string;
  ruleVersion?: string;
  revokeReason?: string;
} & {
  handlerId?: number;
  handlerName?: string;
  linkedEntityType?: string;
  linkedEntityId?: number;
};

export type SuggestionStatus = "rejected" | "pending" | "accepted" | "ignored" | "revoked";

export interface SuggestionIgnoreRequest {
	id: number;
}

export interface ApiResponse_SuggestionRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  departmentId?: number;
  departmentName?: string;
  createTime?: string;
  status?: SuggestionStatus;
  assessmentId?: number;
  employeeId?: number;
  employeeName?: string;
  periodValue?: string;
  suggestionType: SuggestionType;
  periodType?: string;
  triggerLabel?: string;
  handleTime?: string;
  ruleVersion?: string;
  revokeReason?: string;
} & {
  handlerId?: number;
  handlerName?: string;
  linkedEntityType?: string;
  linkedEntityId?: number;
};
}

export interface SuggestionFetchInfoQuery {
	id: number;
}

export type SuggestionPageQuery = SuggestionFetchPageRequest & {
  page: number;
  size: number;
  suggestionType?: string;
  status?: string;
  employeeId?: number;
  departmentId?: number;
  assessmentId?: number;
  periodValue?: string;
};

export interface SuggestionFetchPageRequest {

}

export interface ApiResponse_SuggestionPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<SuggestionRecord>;
};
}

export interface SuggestionRejectRequest {
	id: number;
}

export interface SuggestionRevokeRequest {
	id: number;
	revokeReasonCode: SuggestionRevokeReasonCode;
	revokeReason: string;
}

export type SuggestionRevokeReasonCode = "thresholdError" | "assessmentCorrected" | "scopeError" | "duplicateSuggestion";
