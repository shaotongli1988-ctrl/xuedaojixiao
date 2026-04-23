/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance certificate.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface CertificateRecord {
	id?: number;
	name: string;
	code?: string | null;
	category?: string | null;
	issuer?: string | null;
	description?: string | null;
	validityMonths?: number | null;
	sourceCourseId?: number | null;
	status?: CertificateStatus;
	issuedCount?: number;
	createTime?: string;
	updateTime?: string;
}

export type CertificateStatus = "draft" | "active" | "retired";

export interface ApiResponse_CertificateRecord {
	code: number;
	message: string;
	data: CertificateRecord;
}

export interface CertificateIssueRequest {
	certificateId: number;
	employeeId: number;
	issuedAt: string;
	remark?: string | null;
	sourceCourseId?: number | null;
}

export interface ApiResponse_Void {
	code: number;
	message: string;
	data?: null;
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
	data: CertificatePageResult;
}

export interface CertificatePageResult {
	list: Array<CertificateRecord>;
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
	data: CertificateLedgerPageResult;
}

export interface CertificateLedgerPageResult {
	list: Array<CertificateLedgerRecord>;
	pagination: PagePagination;
}

export interface CertificateLedgerRecord {
	id?: number;
	certificateId?: number;
	certificateName?: string;
	employeeId?: number;
	employeeName?: string;
	departmentId?: number | null;
	departmentName?: string | null;
	issuedAt: string;
	issuedBy?: string;
	sourceCourseId?: number | null;
	status?: CertificateRecordStatus;
}
