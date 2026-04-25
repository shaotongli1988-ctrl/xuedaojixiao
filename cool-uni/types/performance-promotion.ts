/**
 * cool-uni 晋升管理移动页类型。
 * 这里只转发 OpenAPI 生成的晋升契约，并为分页响应补齐 data 别名。
 */
import type { ApiResponse_PromotionPageResult } from "/@/generated/performance-promotion.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];

export type {
	PromotionFetchInfoQuery,
	PromotionFetchPageRequest,
	PromotionRecord,
	PromotionReviewRecord,
	PromotionReviewRequest,
	PromotionSubmitRequest,
} from "/@/generated/performance-promotion.generated";

export type PromotionPageResult = ApiResponseData<ApiResponse_PromotionPageResult>;
