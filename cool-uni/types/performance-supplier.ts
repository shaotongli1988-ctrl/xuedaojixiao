/**
 * cool-uni 供应商管理移动页类型。
 * 这里只转发 OpenAPI 生成的供应商契约，并为分页响应补齐 data 别名。
 */
import type {
	ApiResponse_SupplierPageResult,
	SupplierUpdatePayload,
} from "/@/generated/performance-supplier.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];

export type {
	SupplierCreateSupplierRequest,
	SupplierFetchInfoQuery,
	SupplierFetchPageRequest,
	SupplierRecord,
	SupplierRemoveSupplierRequest,
	SupplierStatus,
} from "/@/generated/performance-supplier.generated";

export type SupplierUpdateSupplierRequest = SupplierUpdatePayload;
export type SupplierPageResult = ApiResponseData<ApiResponse_SupplierPageResult>;
