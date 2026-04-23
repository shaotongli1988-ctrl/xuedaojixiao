/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance asset-assignment-request.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface AssetAssignmentRequestCreateDraftRequest {
	id?: number;
	requestNo?: string;
	requestLevel?: AssetAssignmentRequestLevel;
	requestType?: AssetAssignmentRequestType;
	applicantId?: number;
	applicantName?: string;
	applicantDepartmentId?: number;
	applicantDepartmentName?: string;
	assetCategory?: string;
	assetModelRequest?: string;
	quantity?: number;
	unitPriceEstimate?: number;
	usageReason?: string;
	expectedUseStartDate?: string;
	targetDepartmentId?: number;
	targetDepartmentName?: string;
	exceptionReason?: string;
	originalAssetId?: number;
	originalAssetNo?: string;
	originalAssignmentId?: number;
	approvalInstanceId?: number;
	approvalStatus?: string;
	currentApproverId?: number;
	currentApproverName?: string;
	approvalTriggeredRules?: Array<string>;
	assignedAssetId?: number;
	assignedAssetNo?: string;
	assignedAssetName?: string;
	assignmentRecordId?: number;
	assignmentStatus?: AssetAssignmentStatus;
	assignedBy?: number;
	assignedByName?: string;
	assignedAt?: string;
	status?: AssetAssignmentRequestStatus;
	submitTime?: string;
	withdrawTime?: string;
	cancelReason?: string;
	createTime?: string;
	updateTime?: string;
}

export type AssetAssignmentRequestLevel = "L1" | "L2";

export type AssetAssignmentRequestType = "standard" | "crossDepartmentBorrow" | "lostReplacement" | "abnormalReissue" | "scrapReplacement";

export type AssetAssignmentStatus = "assigned" | "returned" | "lost";

export type AssetAssignmentRequestStatus = "draft" | "inApproval" | "rejected" | "withdrawn" | "approvedPendingAssignment" | "issuing" | "issued" | "cancelled" | "manualPending";

export interface ApiResponse_AssetAssignmentRequestRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  requestNo?: string;
  requestLevel?: AssetAssignmentRequestLevel;
  requestType: AssetAssignmentRequestType;
  applicantId?: number;
  applicantName?: string;
  applicantDepartmentId?: number;
  applicantDepartmentName?: string;
  assetCategory: string;
  assetModelRequest?: string;
  quantity: number;
  unitPriceEstimate: number;
  usageReason?: string;
  expectedUseStartDate?: string;
  targetDepartmentId?: number;
  targetDepartmentName?: string;
  exceptionReason?: string;
  originalAssetId?: number;
  originalAssetNo?: string;
  originalAssignmentId?: number;
  approvalInstanceId?: number;
  approvalStatus?: string;
  currentApproverId?: number;
  currentApproverName?: string;
  approvalTriggeredRules?: Array<string>;
  assignedAssetId?: number;
  assignedAssetNo?: string;
  assignedAssetName?: string;
  assignmentRecordId?: number;
  assignmentStatus?: AssetAssignmentStatus;
  assignedBy?: number;
  assignedByName?: string;
  assignedAt?: string;
  status?: AssetAssignmentRequestStatus;
  submitTime?: string;
  withdrawTime?: string;
  cancelReason?: string;
  createTime?: string;
  updateTime?: string;
};
}

export interface AssetAssignmentRequestAssignAssetRequest {
	id: number;
	assetId: number;
	assignDate?: string;
	purpose?: string;
}

export interface AssetAssignmentRequestCancelRequestRequest {
	id: number;
	reason?: string;
}

export type AssetAssignmentRequestFetchInfoQuery = number;

export interface AssetAssignmentRequestFetchPageRequest {
	page: number;
	size: number;
	status?: AssetAssignmentRequestStatus;
	requestLevel?: AssetAssignmentRequestLevel;
	requestType?: AssetAssignmentRequestType;
	pendingAssignmentOnly?: boolean;
}

export interface ApiResponse_AssetAssignmentRequestPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<AssetAssignmentRequestRecord>;
};
}

export interface AssetAssignmentRequestRecord {
	id?: number;
	requestNo?: string;
	requestLevel?: AssetAssignmentRequestLevel;
	requestType: AssetAssignmentRequestType;
	applicantId?: number;
	applicantName?: string;
	applicantDepartmentId?: number;
	applicantDepartmentName?: string;
	assetCategory: string;
	assetModelRequest?: string;
	quantity: number;
	unitPriceEstimate: number;
	usageReason?: string;
	expectedUseStartDate?: string;
	targetDepartmentId?: number;
	targetDepartmentName?: string;
	exceptionReason?: string;
	originalAssetId?: number;
	originalAssetNo?: string;
	originalAssignmentId?: number;
	approvalInstanceId?: number;
	approvalStatus?: string;
	currentApproverId?: number;
	currentApproverName?: string;
	approvalTriggeredRules?: Array<string>;
	assignedAssetId?: number;
	assignedAssetNo?: string;
	assignedAssetName?: string;
	assignmentRecordId?: number;
	assignmentStatus?: AssetAssignmentStatus;
	assignedBy?: number;
	assignedByName?: string;
	assignedAt?: string;
	status?: AssetAssignmentRequestStatus;
	submitTime?: string;
	withdrawTime?: string;
	cancelReason?: string;
	createTime?: string;
	updateTime?: string;
}

export interface AssetAssignmentRequestSubmitRequestRequest {
	id: number;
}

export type AssetAssignmentRequestUpdateDraftRequest = {
  id?: number;
  requestNo?: string;
  requestLevel?: AssetAssignmentRequestLevel;
  requestType?: AssetAssignmentRequestType;
  applicantId?: number;
  applicantName?: string;
  applicantDepartmentId?: number;
  applicantDepartmentName?: string;
  assetCategory?: string;
  assetModelRequest?: string;
  quantity?: number;
  unitPriceEstimate?: number;
  usageReason?: string;
  expectedUseStartDate?: string;
  targetDepartmentId?: number;
  targetDepartmentName?: string;
  exceptionReason?: string;
  originalAssetId?: number;
  originalAssetNo?: string;
  originalAssignmentId?: number;
  approvalInstanceId?: number;
  approvalStatus?: string;
  currentApproverId?: number;
  currentApproverName?: string;
  approvalTriggeredRules?: Array<string>;
  assignedAssetId?: number;
  assignedAssetNo?: string;
  assignedAssetName?: string;
  assignmentRecordId?: number;
  assignmentStatus?: AssetAssignmentStatus;
  assignedBy?: number;
  assignedByName?: string;
  assignedAt?: string;
  status?: AssetAssignmentRequestStatus;
  submitTime?: string;
  withdrawTime?: string;
  cancelReason?: string;
  createTime?: string;
  updateTime?: string;
} & {
  id: number;
};

export interface AssetAssignmentRequestWithdrawRequestRequest {
	id: number;
	reason?: string;
}
