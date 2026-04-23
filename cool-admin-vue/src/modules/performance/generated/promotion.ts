/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance promotion.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface PromotionCreatePromotionRequest {
	id?: number;
	employeeName?: string;
	status?: string;
	createTime?: string;
	updateTime?: string;
	suggestionId?: number;
	sourceReason?: string;
	sponsorName?: string;
	fromPosition?: string;
	toPosition?: string;
	reason?: string;
	reviewTime?: string;
	assessmentId?: number;
	employeeId?: number;
	sponsorId?: number;
	reviewRecords?: Array<PromotionReviewRecord>;
}

export interface PromotionReviewRecord {
	id?: number;
	promotionId?: number;
	reviewerId: number;
	reviewerName?: string;
	decision: "approved" | "rejected";
	comment?: string;
	createTime?: string;
}

export interface ApiResponse_PromotionRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  employeeName?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
  suggestionId?: number;
  sourceReason: string;
  sponsorName?: string;
  fromPosition: string;
  toPosition: string;
  reason: string;
  reviewTime?: string;
} & {
  assessmentId?: number;
  employeeId: number;
  sponsorId: number;
  reviewRecords?: Array<PromotionReviewRecord>;
};
}

export interface PromotionFetchInfoQuery {
	id: number;
}

export type PromotionPageQuery = PromotionFetchPageRequest & {
  page: number;
  size: number;
  employeeId?: number;
  assessmentId?: number;
  status?: string;
  toPosition?: string;
};

export interface PromotionFetchPageRequest {

}

export interface ApiResponse_PromotionPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<PromotionRecord>;
};
}

export type PromotionRecord = {
  id?: number;
  employeeName?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
  suggestionId?: number;
  sourceReason: string;
  sponsorName?: string;
  fromPosition: string;
  toPosition: string;
  reason: string;
  reviewTime?: string;
} & {
  assessmentId?: number;
  employeeId: number;
  sponsorId: number;
  reviewRecords?: Array<PromotionReviewRecord>;
};

export interface PromotionReviewRequest {
	id: number;
	decision: "approved" | "rejected";
	comment?: string;
}

export interface PromotionSubmitRequest {
	id: number;
}

export type PromotionUpdatePayload = {
  id?: number;
  employeeName?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
  suggestionId?: number;
  sourceReason?: string;
  sponsorName?: string;
  fromPosition?: string;
  toPosition?: string;
  reason?: string;
  reviewTime?: string;
  assessmentId?: number;
  employeeId?: number;
  sponsorId?: number;
  reviewRecords?: Array<PromotionReviewRecord>;
} & {
  id: number;
};
