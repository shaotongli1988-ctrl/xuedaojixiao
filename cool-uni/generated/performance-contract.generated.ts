/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance contract.
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
	probationPeriod?: number;
	salary?: number;
	position?: string;
	departmentId?: number;
	status?: ContractStatus;
}

export type ContractType = "full-time" | "part-time" | "internship" | "other";

export type ContractStatus = "draft" | "active" | "expired" | "terminated";

export interface ApiResponse_ContractRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  status?: ContractStatus;
  createTime?: string;
  updateTime?: string;
  type: ContractType;
  startDate: string;
  endDate: string;
} & {
  employeeId: number;
  departmentId?: number;
  departmentName?: string;
  title?: string;
  employeeName?: string;
  contractNumber?: string;
  probationPeriod?: number;
  salary?: number;
  position?: string;
};
}

export interface DeleteIdsRequest {
	ids: Array<number>;
}

export interface ApiResponse_ContractRemoveContractResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface ContractInfoQuery {
	id: number;
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
	data: {
  pagination: PagePagination;
} & {
  list: Array<ContractRecord>;
};
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

export type ContractRecord = {
  id?: number;
  status?: ContractStatus;
  createTime?: string;
  updateTime?: string;
  type: ContractType;
  startDate: string;
  endDate: string;
} & {
  employeeId: number;
  departmentId?: number;
  departmentName?: string;
  title?: string;
  employeeName?: string;
  contractNumber?: string;
  probationPeriod?: number;
  salary?: number;
  position?: string;
};

export type ContractUpdateContractRequest = ContractSaveRequest & {
  id: number;
};
