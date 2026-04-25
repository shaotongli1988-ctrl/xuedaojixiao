/**
 * cool-uni 能力地图移动页类型。
 * 这里只转发 OpenAPI 生成的能力地图契约，并补齐分页响应 data 的别名。
 * 不负责能力项详情、画像详情或桌面端维护表单，也不承载业务状态展示文案。
 */
import type { ApiResponse_CapabilityModelPageResult } from "/@/generated/performance-capability.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];

export type {
	CapabilityModelInfoQuery,
	CapabilityModelPageQuery,
	CapabilityModelRecord,
	CapabilityModelStatus,
	PagePagination,
} from "/@/generated/performance-capability.generated";

export type CapabilityModelPageResult = ApiResponseData<ApiResponse_CapabilityModelPageResult>;
