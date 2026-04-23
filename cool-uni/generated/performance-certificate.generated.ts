/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance certificate.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface CertificateRecord {
	id?: number;
	name: string;
	code?: string;
	category?: string;
	issuer?: string;
	description?: string;
	validityMonths?: number;
	sourceCourseId?: number;
	status?: CertificateStatus;
	issuedCount?: number;
	createTime?: string;
	updateTime?: string;
}

export type CertificateStatus = "draft" | "active" | "retired";

export interface ApiResponse_CertificateRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  name: string;
  code?: string;
  category?: string;
  issuer?: string;
  description?: string;
  validityMonths?: number;
  sourceCourseId?: number;
  status?: CertificateStatus;
  issuedCount?: number;
  createTime?: string;
  updateTime?: string;
};
}

export interface CertificateInfoQuery {
	id: number;
}

export interface CertificateIssueRequest {
	certificateId: number;
	employeeId: number;
	issuedAt: string;
	remark?: string;
	sourceCourseId?: number;
}

export interface ApiResponse_CertificateIssueCertificateResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface CertificatePageQuery {
	page: number;
	size: number;
	keyword?: string;
	category?: string;
	status?: CertificateStatus;
}

export interface ApiResponse_CertificatePageResult {
	code: number;
	message: string;
	data: {
  list: Array<CertificateRecord>;
  pagination: PagePagination;
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

export interface CertificateRecordPageQuery {
	page: number;
	size: number;
	certificateId?: number;
	employeeId?: number;
	status?: CertificateRecordStatus;
	departmentId?: number;
}

export type CertificateRecordStatus = "issued" | "revoked";

export interface ApiResponse_CertificateLedgerPageResult {
	code: number;
	message: string;
	data: {
  list: Array<CertificateLedgerRecord>;
  pagination: PagePagination;
};
}

export interface CertificateLedgerRecord {
	id?: number;
	certificateId?: number;
	certificateName?: string;
	employeeId?: number;
	employeeName?: string;
	departmentId?: number;
	departmentName?: string;
	issuedAt: string;
	issuedBy?: string;
	sourceCourseId?: number;
	status?: CertificateRecordStatus;
}

export type CertificateUpdateCertificateRequest = CertificateRecord & {
  id: number;
};
