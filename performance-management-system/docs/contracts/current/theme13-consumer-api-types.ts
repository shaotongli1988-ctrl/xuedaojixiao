/**
 * 主题13开发前评审的 consumer 契约快照。
 * 这里只固化前端调用的最小类型和接口路径，作为 schema drift 与 endpoint drift 的消费侧证据，不负责真实页面实现。
 * 维护重点是路径、资源名与字段名必须跟随主题13冻结范围，不得混入课程、面试或人才资产语义。
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

const capabilityModelBaseUrl = '/admin/performance/capabilityModel';
const capabilityItemInfoUrl = '/admin/performance/capabilityItem/info';
const capabilityPortraitInfoUrl = '/admin/performance/capabilityPortrait/info';
const certificateBaseUrl = '/admin/performance/certificate';

declare function request(config: {
  url: string;
  method: 'GET' | 'POST';
  params?: unknown;
  data?: unknown;
}): Promise<unknown>;

export function fetchCapabilityModelPage(data: CapabilityModelPageQuery) {
  return request({
    url: `${capabilityModelBaseUrl}/page`,
    method: 'POST',
    data,
  });
}

export function fetchCapabilityModelInfo(params: { id: number }) {
  return request({
    url: `${capabilityModelBaseUrl}/info`,
    method: 'GET',
    params,
  });
}

export function createCapabilityModel(data: CapabilityModelSaveRequest) {
  return request({
    url: `${capabilityModelBaseUrl}/add`,
    method: 'POST',
    data,
  });
}

export function updateCapabilityModel(data: CapabilityModelSaveRequest) {
  return request({
    url: `${capabilityModelBaseUrl}/update`,
    method: 'POST',
    data,
  });
}

export function fetchCapabilityItemInfo(params: { id: number }) {
  return request({
    url: capabilityItemInfoUrl,
    method: 'GET',
    params,
  });
}

export function fetchCapabilityPortraitInfo(params: { employeeId: number }) {
  return request({
    url: capabilityPortraitInfoUrl,
    method: 'GET',
    params,
  });
}

export function fetchCertificatePage(data: CertificatePageQuery) {
  return request({
    url: `${certificateBaseUrl}/page`,
    method: 'POST',
    data,
  });
}

export function fetchCertificateInfo(params: { id: number }) {
  return request({
    url: `${certificateBaseUrl}/info`,
    method: 'GET',
    params,
  });
}

export function createCertificate(data: CertificateRecord) {
  return request({
    url: `${certificateBaseUrl}/add`,
    method: 'POST',
    data,
  });
}

export function updateCertificate(data: CertificateRecord) {
  return request({
    url: `${certificateBaseUrl}/update`,
    method: 'POST',
    data,
  });
}

export function issueCertificate(data: CertificateIssueRequest) {
  return request({
    url: `${certificateBaseUrl}/issue`,
    method: 'POST',
    data,
  });
}

export function fetchCertificateRecordPage(data: CertificateRecordPageQuery) {
  return request({
    url: `${certificateBaseUrl}/recordPage`,
    method: 'POST',
    data,
  });
}
