/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance suggestion.
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
  employeeId?: number;
  employeeName?: string;
  departmentId?: number;
  departmentName?: string;
  periodType?: string;
  periodValue?: string;
  status?: SuggestionStatus;
  createTime?: string;
  assessmentId?: number;
  suggestionType: SuggestionType;
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

export type SuggestionStatus = "rejected" | "pending" | "revoked" | "accepted" | "ignored";

export interface SuggestionIgnoreRequest {
	id: number;
}

export interface ApiResponse_SuggestionRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  employeeId?: number;
  employeeName?: string;
  departmentId?: number;
  departmentName?: string;
  periodType?: string;
  periodValue?: string;
  status?: SuggestionStatus;
  createTime?: string;
  assessmentId?: number;
  suggestionType: SuggestionType;
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
