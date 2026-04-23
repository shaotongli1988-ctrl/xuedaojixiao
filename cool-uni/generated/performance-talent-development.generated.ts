/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-uni performance talent development.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

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

export type CapabilityModelStatus = "draft" | "active" | "archived";

export interface CapabilityModelPageQuery {
	page: number;
	size: number;
	keyword?: string;
	category?: string;
	status?: CapabilityModelStatus;
}

export interface CapabilityModelRecord {
	id?: number;
	name: string;
	code?: string | null;
	category?: string | null;
	description?: string | null;
	status?: CapabilityModelStatus;
	itemCount?: number;
	createTime?: string;
	updateTime?: string;
}

export interface CapabilityModelPageResult {
	list: Array<CapabilityModelRecord>;
	pagination: PagePagination;
}

export interface CapabilityModelSaveRequest {
	id?: number;
	name: string;
	code?: string | null;
	category?: string | null;
	description?: string | null;
	status?: CapabilityModelStatus;
}

export interface CapabilityItemRecord {
	id?: number;
	modelId?: number;
	name: string;
	level?: string | null;
	description?: string | null;
	evidenceHint?: string | null;
	updateTime?: string;
}

export interface CapabilityPortraitRecord {
	employeeId: number;
	employeeName?: string;
	departmentId?: number | null;
	departmentName?: string | null;
	capabilityTags?: Array<string>;
	levelSummary?: Array<string>;
	certificateCount?: number;
	lastCertifiedAt?: string | null;
	updatedAt?: string;
}

export type CertificateStatus = "draft" | "active" | "retired";

export interface CertificatePageQuery {
	page: number;
	size: number;
	keyword?: string;
	category?: string;
	status?: CertificateStatus;
}

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

export interface CertificatePageResult {
	list: Array<CertificateRecord>;
	pagination: PagePagination;
}

export interface CertificateIssueRequest {
	certificateId: number;
	employeeId: number;
	issuedAt: string;
	remark?: string | null;
	sourceCourseId?: number | null;
}

export type CertificateRecordStatus = "issued" | "revoked";

export interface CertificateRecordPageQuery {
	page: number;
	size: number;
	certificateId?: number;
	employeeId?: number;
	status?: CertificateRecordStatus;
	departmentId?: number;
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

export interface CertificateLedgerPageResult {
	list: Array<CertificateLedgerRecord>;
	pagination: PagePagination;
}
