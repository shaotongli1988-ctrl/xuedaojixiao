/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance contract.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface ContractSaveRequest {
	id?: number;
	employeeId: number;
	type: ContractType;
	title?: string;
	contractNumber?: string;
	startDate: string;
	endDate: string;
	probationPeriod?: number | null;
	salary?: number | null;
	position?: string;
	departmentId?: number | null;
	status?: ContractStatus;
}

/**
 * 合同类型
 */
export type ContractType = "full-time" | "part-time" | "internship" | "other";

/**
 * 合同状态
 */
export type ContractStatus = "draft" | "active" | "expired" | "terminated";

export interface ApiResponse_ContractRecord {
	code: number;
	message: string;
	data: ContractRecord;
}

export interface ContractRecord {
	id?: number;
	employeeId: number;
	employeeName?: string;
	type: ContractType;
	title?: string;
	contractNumber?: string;
	startDate: string;
	endDate: string;
	probationPeriod?: number | null;
	salary?: number | null;
	position?: string;
	departmentId?: number | null;
	departmentName?: string;
	status?: ContractStatus;
	createTime?: string;
	updateTime?: string;
}

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface ApiResponse_Void {
	code: number;
	message: string;
	data?: null;
}

export interface ContractPageQuery {
	page: number;
	size: number;
	employeeId?: number;
	type?: ContractType;
	status?: ContractStatus;
	keyword?: string;
}

export interface ApiResponse_ContractPageResult {
	code: number;
	message: string;
	data: ContractPageResult;
}

export interface ContractPageResult {
	list: Array<ContractRecord>;
	pagination: PagePagination;
}

export interface PagePagination {
	/**
	 * 页码
	 */
	page: number;
	/**
	 * 页大小
	 */
	size: number;
	/**
	 * 总数
	 */
	total: number;
}
