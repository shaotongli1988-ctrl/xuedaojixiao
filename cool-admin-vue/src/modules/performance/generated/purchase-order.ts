/**
 * Generated from contracts/openapi/xuedao.openapi.json for cool-admin-vue performance purchase-order.
 * Do not hand edit this file; update the OpenAPI source and rerun scripts/openapi-contract-sync.mjs.
 */

export interface PurchaseOrderCreatePurchaseOrderRequest {
	id?: number;
	departmentName?: string;
	status?: PurchaseOrderStatus;
	createTime?: string;
	updateTime?: string;
	supplierName?: string;
	title?: string;
	requesterName?: string;
	totalAmount?: number;
	orderNo?: string;
	orderDate?: string;
	currency?: string;
	supplierId?: number;
	departmentId?: number;
	requesterId?: number;
	expectedDeliveryDate?: string;
	approvedBy?: string;
	approvedAt?: string;
	approvalRemark?: string;
	closedReason?: string;
	receivedQuantity?: number;
	receivedAt?: string;
	items?: Array<PurchaseOrderItemRecord>;
	inquiryRecords?: Array<PurchaseOrderInquiryRecord>;
	approvalLogs?: Array<PurchaseOrderApprovalLog>;
	receiptRecords?: Array<PurchaseOrderReceiptRecord>;
	remark?: string;
}

export type PurchaseOrderStatus = "draft" | "approved" | "cancelled" | "closed" | "received" | "inquiring" | "pendingApproval";

export type PurchaseOrderItemRecord = {
  id?: number;
  quantity: number;
  itemName: string;
} & {
  specification?: string;
  unit?: string;
  unitPrice?: number;
  amount?: number;
  remark?: string;
};

export type PurchaseOrderInquiryRecord = {
  id?: number;
} & {
  supplierId?: number;
  supplierName?: string;
  quotedAmount?: number;
  inquiryRemark?: string;
  createdBy?: string;
  createdAt?: string;
};

export type PurchaseOrderApprovalLog = {
  id?: number;
  action?: string;
} & {
  action?: string;
  approverId?: number;
  approverName?: string;
  remark?: string;
  createdAt?: string;
};

export type PurchaseOrderReceiptRecord = {
  id?: number;
} & {
  receivedQuantity?: number;
  receivedAt?: string;
  receiverId?: number;
  receiverName?: string;
  remark?: string;
};

export interface ApiResponse_PurchaseOrderRecord {
	code: number;
	message: string;
	data: {
  id?: number;
  departmentName?: string;
  status?: PurchaseOrderStatus;
  createTime?: string;
  updateTime?: string;
  supplierName?: string;
  title: string;
  requesterName?: string;
  totalAmount: number;
  orderNo?: string;
  orderDate: string;
  currency?: string;
} & {
  supplierId: number;
  departmentId: number;
  requesterId: number;
  expectedDeliveryDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalRemark?: string;
  closedReason?: string;
  receivedQuantity?: number;
  receivedAt?: string;
  items?: Array<PurchaseOrderItemRecord>;
  inquiryRecords?: Array<PurchaseOrderInquiryRecord>;
  approvalLogs?: Array<PurchaseOrderApprovalLog>;
  receiptRecords?: Array<PurchaseOrderReceiptRecord>;
  remark?: string;
};
}

export interface PurchaseOrderApproveRequest {
	id: number;
	approvalRemark?: string;
}

export interface PurchaseOrderCloseRequest {
	id: number;
	closedReason: string;
}

export interface PurchaseOrderRemovePurchaseOrderRequest {
	ids: Array<number>;
}

export interface ApiResponse_PurchaseOrderRemovePurchaseOrderResult {
	code: number;
	message: string;
	data: Record<string, unknown>;
}

export interface PurchaseOrderFetchInfoQuery {
	id: number;
}

export interface PurchaseOrderFetchPageRequest {
	page: number;
	size: number;
	keyword?: string;
	supplierId?: number;
	departmentId?: number;
	status?: PurchaseOrderStatus;
	statusList?: Array<PurchaseOrderStatus>;
	startDate?: string;
	endDate?: string;
}

export interface ApiResponse_PurchaseOrderPageResult {
	code: number;
	message: string;
	data: {
  pagination: {
  page: number;
  size: number;
  total: number;
};
} & {
  list: Array<PurchaseOrderRecord>;
};
}

export type PurchaseOrderRecord = {
  id?: number;
  departmentName?: string;
  status?: PurchaseOrderStatus;
  createTime?: string;
  updateTime?: string;
  supplierName?: string;
  title: string;
  requesterName?: string;
  totalAmount: number;
  orderNo?: string;
  orderDate: string;
  currency?: string;
} & {
  supplierId: number;
  departmentId: number;
  requesterId: number;
  expectedDeliveryDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalRemark?: string;
  closedReason?: string;
  receivedQuantity?: number;
  receivedAt?: string;
  items?: Array<PurchaseOrderItemRecord>;
  inquiryRecords?: Array<PurchaseOrderInquiryRecord>;
  approvalLogs?: Array<PurchaseOrderApprovalLog>;
  receiptRecords?: Array<PurchaseOrderReceiptRecord>;
  remark?: string;
};

export interface PurchaseOrderReceiveRequest {
	id: number;
	receivedQuantity?: number;
	receivedAt?: string;
	remark?: string;
}

export interface PurchaseOrderRejectRequest {
	id: number;
	approvalRemark?: string;
}

export interface PurchaseOrderSubmitApprovalRequest {
	id: number;
	remark?: string;
}

export interface PurchaseOrderSubmitInquiryRequest {
	id: number;
	remark?: string;
}

export type PurchaseOrderUpdatePayload = {
  id?: number;
  departmentName?: string;
  status?: PurchaseOrderStatus;
  createTime?: string;
  updateTime?: string;
  supplierName?: string;
  title?: string;
  requesterName?: string;
  totalAmount?: number;
  orderNo?: string;
  orderDate?: string;
  currency?: string;
  supplierId?: number;
  departmentId?: number;
  requesterId?: number;
  expectedDeliveryDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalRemark?: string;
  closedReason?: string;
  receivedQuantity?: number;
  receivedAt?: string;
  items?: Array<PurchaseOrderItemRecord>;
  inquiryRecords?: Array<PurchaseOrderInquiryRecord>;
  approvalLogs?: Array<PurchaseOrderApprovalLog>;
  receiptRecords?: Array<PurchaseOrderReceiptRecord>;
  remark?: string;
} & {
  id: number;
};
