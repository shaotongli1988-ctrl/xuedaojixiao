/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance salary.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface SalaryCreateSalaryRequest {
	id?: number;
	createTime?: string;
	updateTime?: string;
	status?: string;
	employeeName?: string;
	periodValue?: string;
	baseSalary?: number;
	performanceBonus?: number;
	adjustAmount?: number;
	finalAmount?: number;
	grade?: string;
	effectiveDate?: string;
	employeeId?: number;
	assessmentId?: number;
	changeRecords?: Array<SalaryChangeRecord>;
}

export interface SalaryChangeRecord {
	id?: number;
	salaryId?: number;
	beforeAmount: number;
	adjustAmount: number;
	afterAmount: number;
	changeReason: string;
	operatorId?: number;
	operatorName?: string;
	createTime?: string;
}

export interface ApiResponse_SalaryRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  createTime?: string;
  updateTime?: string;
  status?: string;
  employeeName?: string;
  periodValue: string;
  baseSalary: number;
  performanceBonus: number;
  adjustAmount: number;
  finalAmount: number;
  grade?: string;
  effectiveDate: string;
} & {
  employeeId: number;
  assessmentId?: number;
  changeRecords?: Array<SalaryChangeRecord>;
};
}

export interface SalaryArchiveSalaryRequest {
	id: number;
}

export interface SalaryAddChangeRequest {
	salaryId: number;
	adjustAmount: number;
	changeReason: string;
}

export interface SalaryConfirmSalaryRequest {
	id: number;
}

export interface SalaryFetchInfoQuery {
	id: number;
}

export type SalaryPageQuery = SalaryFetchPageRequest & {
  page: number;
  size: number;
  employeeId?: number;
  status?: string;
  periodValue?: string;
  effectiveDateStart?: string;
  effectiveDateEnd?: string;
};

export interface SalaryFetchPageRequest {

}

export interface ApiResponse_SalaryPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<SalaryRecord>;
};
}

export type SalaryRecord = {
  id?: number;
  createTime?: string;
  updateTime?: string;
  status?: string;
  employeeName?: string;
  periodValue: string;
  baseSalary: number;
  performanceBonus: number;
  adjustAmount: number;
  finalAmount: number;
  grade?: string;
  effectiveDate: string;
} & {
  employeeId: number;
  assessmentId?: number;
  changeRecords?: Array<SalaryChangeRecord>;
};

export type SalaryUpdatePayload = {
  id?: number;
  createTime?: string;
  updateTime?: string;
  status?: string;
  employeeName?: string;
  periodValue?: string;
  baseSalary?: number;
  performanceBonus?: number;
  adjustAmount?: number;
  finalAmount?: number;
  grade?: string;
  effectiveDate?: string;
  employeeId?: number;
  assessmentId?: number;
  changeRecords?: Array<SalaryChangeRecord>;
} & {
  id: number;
};
