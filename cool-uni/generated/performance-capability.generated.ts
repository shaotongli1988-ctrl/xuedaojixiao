/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance capability.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface CapabilityModelSaveRequest {
	id?: number;
	name: string;
	code?: string;
	category?: string;
	description?: string;
	status?: CapabilityModelStatus;
}

export type CapabilityModelStatus = "draft" | "active" | "archived";

export interface ApiResponse_GeneratedCapabilityModelRecord {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface CapabilityModelInfoQuery {
	id: number;
}

export interface CapabilityModelPageQuery {
	page: number;
	size: number;
	keyword?: string;
	category?: string;
	status?: CapabilityModelStatus;
}

export interface ApiResponse_GeneratedCapabilityModelPageResponse {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export type CapabilityModelUpdateModelRequest = CapabilityModelSaveRequest & {
  id: number;
};
