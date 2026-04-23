/**
 * cool-uni 薪资管理移动页类型。
 * 这里只转发 OpenAPI 生成的薪资契约，并保留金额展示 helper。
 */
import type { ApiResponse_SalaryPageResult } from "/@/generated/performance-salary.generated";

type ApiResponseData<T extends { data: unknown }> = T["data"];

export type {
	SalaryAddChangeRequest,
	SalaryArchiveSalaryRequest,
	SalaryChangeRecord,
	SalaryConfirmSalaryRequest,
	SalaryFetchInfoQuery,
	SalaryFetchPageRequest,
	SalaryRecord,
} from "/@/generated/performance-salary.generated";

export type SalaryPageResult = ApiResponseData<ApiResponse_SalaryPageResult>;

export function salaryAmountLabel(value?: number) {
	return typeof value === "number" ? `¥${value.toFixed(2)}` : "-";
}
