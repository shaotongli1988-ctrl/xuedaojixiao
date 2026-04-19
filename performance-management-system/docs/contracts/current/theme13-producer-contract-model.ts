/**
 * 主题13开发前评审的 producer 契约快照。
 * 这里只固化能力地图与证书台账的最小资源、请求和分页响应字段，不负责课程主链、面试主链或人才资产主链。
 * 维护重点是字段名必须与主题13冻结文档和当前实现保持同一口径，避免 schema drift 守卫失去抽取依据。
 */

export interface PagePagination {
  page: number;
  size: number;
  total: number;
}

export interface CapabilityModelPageQuery {
  page: number;
  size: number;
  keyword?: string;
  category?: string;
  status?: string;
}

export interface CapabilityModelRecord {
  id?: number;
  name: string;
  code?: string | null;
  category?: string | null;
  description?: string | null;
  status?: string;
  itemCount?: number;
  createTime?: string;
  updateTime?: string;
}

export interface CapabilityModelPageResult {
  list: CapabilityModelRecord[];
  pagination: PagePagination;
}

export interface CapabilityModelSaveRequest {
  id?: number;
  name: string;
  code?: string | null;
  category?: string | null;
  description?: string | null;
  status?: string;
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
  capabilityTags?: string[];
  levelSummary?: string[];
  certificateCount?: number;
  lastCertifiedAt?: string | null;
  updatedAt?: string;
}

export interface CertificatePageQuery {
  page: number;
  size: number;
  keyword?: string;
  category?: string;
  status?: string;
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
  status?: string;
  issuedCount?: number;
  createTime?: string;
  updateTime?: string;
}

export interface CertificatePageResult {
  list: CertificateRecord[];
  pagination: PagePagination;
}

export interface CertificateIssueRequest {
  certificateId: number;
  employeeId: number;
  issuedAt: string;
  remark?: string | null;
  sourceCourseId?: number | null;
}

export interface CertificateRecordPageQuery {
  page: number;
  size: number;
  certificateId?: number;
  employeeId?: number;
  status?: string;
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
  status?: string;
}

export interface CertificateLedgerPageResult {
  list: CertificateLedgerRecord[];
  pagination: PagePagination;
}
