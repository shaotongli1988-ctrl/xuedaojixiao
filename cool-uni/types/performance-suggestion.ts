/**
 * cool-uni 自动建议移动页类型与前端动作守卫。
 * 这里只转发 OpenAPI 生成的建议契约，并补充高频动作判断。
 */
import type {
	ApiResponse_SuggestionAcceptResult,
	ApiResponse_SuggestionPageResult,
	SuggestionRecord,
} from "/@/generated/performance-suggestion.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];

export type {
	SuggestionAcceptRequest,
	SuggestionFetchInfoQuery,
	SuggestionFetchPageRequest,
	SuggestionIgnoreRequest,
	SuggestionRecord,
	SuggestionRejectRequest,
	SuggestionRevokeReasonCode,
	SuggestionRevokeRequest,
	SuggestionStatus,
	SuggestionType,
} from "/@/generated/performance-suggestion.generated";

export type SuggestionAcceptResult = ApiResponseData<ApiResponse_SuggestionAcceptResult>;
export type SuggestionPageResult = ApiResponseData<ApiResponse_SuggestionPageResult>;

export function canAcceptSuggestion(record?: SuggestionRecord | null) {
	return Boolean(record?.id && String(record?.status || "") === "pending");
}

export function canIgnoreSuggestion(record?: SuggestionRecord | null) {
	return Boolean(record?.id && String(record?.status || "") === "pending");
}

export function canRejectSuggestion(record?: SuggestionRecord | null) {
	return Boolean(record?.id && String(record?.status || "") === "pending");
}
