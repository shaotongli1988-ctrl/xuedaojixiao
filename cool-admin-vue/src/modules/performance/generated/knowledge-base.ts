/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance knowledge-base.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface KnowledgeBaseCreateKnowledgeRequest {
	id?: number;
	kbNo?: string;
	title?: string;
	category?: string;
	summary?: string;
	ownerName?: string;
	status?: KnowledgeBaseStatus;
	tags?: Array<string>;
	relatedFileIds?: Array<number>;
	relatedTopics?: Array<string>;
	importance?: number;
	viewCount?: number;
	createTime?: string;
	updateTime?: string;
}

export type KnowledgeBaseStatus = "draft" | "published" | "archived";

export interface ApiResponse_KnowledgeBaseRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  kbNo: string;
  title: string;
  category: string;
  summary: string;
  ownerName: string;
  status?: KnowledgeBaseStatus;
  tags?: Array<string>;
  relatedFileIds?: Array<number>;
  relatedTopics?: Array<string>;
  importance?: number;
  viewCount?: number;
  createTime?: string;
  updateTime?: string;
};
}

export interface KnowledgeBaseRemoveKnowledgeRequest {
	ids: Array<number>;
}

export interface ApiResponse_KnowledgeBaseRemoveKnowledgeResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface ApiResponse_KnowledgeGraphSummary {
	code: number;
	message: string;
	data: {
  categories?: Array<{
  name: string;
}>;
} & {
  nodes: Array<KnowledgeGraphNode>;
  links: Array<KnowledgeGraphLink>;
};
}

export interface KnowledgeGraphNode {
	id: string;
	name: string;
	category?: string;
	value?: number;
}

export interface KnowledgeGraphLink {
	source: string;
	target: string;
	value?: number;
}

export interface KnowledgeBaseFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	status?: string;
	category?: string;
	tag?: string;
}

export interface ApiResponse_KnowledgeBasePageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<KnowledgeBaseRecord>;
};
}

export interface KnowledgeBaseRecord {
	id?: number;
	kbNo: string;
	title: string;
	category: string;
	summary: string;
	ownerName: string;
	status?: KnowledgeBaseStatus;
	tags?: Array<string>;
	relatedFileIds?: Array<number>;
	relatedTopics?: Array<string>;
	importance?: number;
	viewCount?: number;
	createTime?: string;
	updateTime?: string;
}

export interface KnowledgeBaseCreateQaRequest {
	id?: number;
	question?: string;
	answer?: string;
	relatedKnowledgeIds?: Array<number>;
	relatedFileIds?: Array<number>;
	createTime?: string;
	updateTime?: string;
}

export interface ApiResponse_KnowledgeQaRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  question: string;
  answer: string;
  relatedKnowledgeIds?: Array<number>;
  relatedFileIds?: Array<number>;
  createTime?: string;
  updateTime?: string;
};
}

export interface ApiResponse_KnowledgeBaseFetchQaListResult {
	code: number;
	message: string;
	data: Array<KnowledgeQaRecord> | {
  list?: Array<KnowledgeQaRecord>;
};
}

export interface KnowledgeQaRecord {
	id?: number;
	question: string;
	answer: string;
	relatedKnowledgeIds?: Array<number>;
	relatedFileIds?: Array<number>;
	createTime?: string;
	updateTime?: string;
}

export interface KnowledgeBaseFetchQaListQuery {
	keyword?: string;
}

export interface ApiResponse_KnowledgeSearchResult {
	code: number;
	message: string;
	data: {
  total: number;
} & {
  knowledge: Array<KnowledgeBaseRecord>;
  files: Array<DocumentCenterRecord>;
  qas: Array<KnowledgeQaRecord>;
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

export type DocumentCenterCategory = "policy" | "process" | "template" | "contract" | "archive" | "other";

export type DocumentCenterStatus = "draft" | "published" | "review" | "archived";

export type DocumentCenterFileType = "other" | "pdf" | "doc" | "xls" | "ppt" | "img" | "zip";

export type DocumentCenterStorage = "local" | "cloud" | "hybrid";

export type DocumentCenterConfidentiality = "public" | "internal" | "secret";

export interface KnowledgeBaseFetchSearchQuery {
	keyword: string;
}

export interface ApiResponse_KnowledgeBaseFetchStatsResult {
	code: number;
	message: string;
	data: {
  total: number;
  publishedCount: number;
  draftCount: number;
  fileLinkedCount: number;
  avgImportance: number;
  topicCount: number;
};
}

export interface KnowledgeBaseFetchStatsQuery {
	keyword?: string;
	status?: string;
	category?: string;
	tag?: string;
}

export type KnowledgeBaseUpdateKnowledgeRequest = {
  id?: number;
  kbNo?: string;
  title?: string;
  category?: string;
  summary?: string;
  ownerName?: string;
  status?: KnowledgeBaseStatus;
  tags?: Array<string>;
  relatedFileIds?: Array<number>;
  relatedTopics?: Array<string>;
  importance?: number;
  viewCount?: number;
  createTime?: string;
  updateTime?: string;
} & {
  id: number;
};
