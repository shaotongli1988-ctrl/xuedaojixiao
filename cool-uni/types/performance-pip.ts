/**
 * cool-uni PIP 移动页类型。
 * 这里只转发 OpenAPI 生成的 PIP 契约，并为分页响应补齐 data 别名。
 */
import type { ApiResponse_PipPageResult } from "/@/generated/performance-pip.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];

export type {
	PipCloseRequest,
	PipCompleteRequest,
	PipExportRow,
	PipFetchInfoQuery,
	PipFetchPageRequest,
	PipRecord,
	PipStartRequest,
	PipTrackRecord,
	PipTrackRequest,
} from "/@/generated/performance-pip.generated";

export type PipPageResult = ApiResponseData<ApiResponse_PipPageResult>;
