/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance document-center.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface DocumentCenterCreateDocumentRequest {
	id?: number;
	category?: DocumentCenterCategory;
	createTime?: string;
	updateTime?: string;
	status?: DocumentCenterStatus;
	fileNo?: string;
	fileName?: string;
	fileType?: DocumentCenterFileType;
	storage?: DocumentCenterStorage;
	confidentiality?: DocumentCenterConfidentiality;
	ownerName?: string;
	department?: string;
	version?: string;
	downloadCount?: number;
	tags?: Array<string>;
	notes?: string;
	sizeMb?: number;
	expireDate?: string;
}

export type DocumentCenterCategory = "policy" | "process" | "template" | "contract" | "archive" | "other";

export type DocumentCenterStatus = "draft" | "published" | "review" | "archived";

export type DocumentCenterFileType = "other" | "pdf" | "doc" | "xls" | "ppt" | "img" | "zip";

export type DocumentCenterStorage = "local" | "cloud" | "hybrid";

export type DocumentCenterConfidentiality = "public" | "internal" | "secret";

export interface ApiResponse_DocumentCenterRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  category: DocumentCenterCategory;
  createTime?: string;
  updateTime?: string;
  status?: DocumentCenterStatus;
  fileNo: string;
  fileName: string;
  fileType: DocumentCenterFileType;
  storage: DocumentCenterStorage;
  confidentiality: DocumentCenterConfidentiality;
  ownerName: string;
  department: string;
  version: string;
  downloadCount?: number;
  tags?: Array<string>;
  notes?: string;
} & {
  sizeMb?: number;
  expireDate?: string;
};
}

export interface DocumentCenterRemoveDocumentRequest {
	ids: Array<number>;
}

export interface ApiResponse_DocumentCenterRemoveDocumentResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface DocumentCenterFetchInfoQuery {
	id: number;
}

export interface DocumentCenterFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	status?: string;
	category?: string;
	confidentiality?: string;
	storage?: string;
}

export interface ApiResponse_DocumentCenterPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<DocumentCenterRecord>;
};
}

export type DocumentCenterRecord = {
  id?: number;
  category: DocumentCenterCategory;
  createTime?: string;
  updateTime?: string;
  status?: DocumentCenterStatus;
  fileNo: string;
  fileName: string;
  fileType: DocumentCenterFileType;
  storage: DocumentCenterStorage;
  confidentiality: DocumentCenterConfidentiality;
  ownerName: string;
  department: string;
  version: string;
  downloadCount?: number;
  tags?: Array<string>;
  notes?: string;
} & {
  sizeMb?: number;
  expireDate?: string;
};

export interface ApiResponse_DocumentCenterFetchStatsResult {
	code: number;
	message: string;
	data: {
  total: number;
  publishedCount: number;
  reviewCount: number;
  archivedCount: number;
  totalSizeMb: number;
  totalDownloads: number;
};
}

export interface DocumentCenterFetchStatsQuery {
	keyword?: string;
	status?: string;
	category?: string;
	confidentiality?: string;
	storage?: string;
}

export type DocumentCenterUpdatePayload = {
  id?: number;
  category?: DocumentCenterCategory;
  createTime?: string;
  updateTime?: string;
  status?: DocumentCenterStatus;
  fileNo?: string;
  fileName?: string;
  fileType?: DocumentCenterFileType;
  storage?: DocumentCenterStorage;
  confidentiality?: DocumentCenterConfidentiality;
  ownerName?: string;
  department?: string;
  version?: string;
  downloadCount?: number;
  tags?: Array<string>;
  notes?: string;
  sizeMb?: number;
  expireDate?: string;
} & {
  id: number;
};
