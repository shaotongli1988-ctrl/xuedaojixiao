/**
 * Creates the formal schema for procurement, asset, feedback, and approval-flow tables.
 * This migration only manages additive table creation and rollback for the entities listed in the current task scope.
 * Maintenance pitfall: keep every column type, nullability, default, comment, and index aligned with BaseEntity and the current TypeORM entity contract instead of copying drifted SQL.
 */

export const migrationId = '20260420144000';
export const migrationName =
  'add-performance-procurement-asset-feedback-approval-tables';

const createSupplierTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_supplier\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`name\` varchar(100) NOT NULL COMMENT '供应商名称',
  \`code\` varchar(100) DEFAULT NULL COMMENT '供应商编码',
  \`category\` varchar(100) DEFAULT NULL COMMENT '供应商分类',
  \`contactName\` varchar(100) DEFAULT NULL COMMENT '联系人姓名',
  \`contactPhone\` varchar(20) DEFAULT NULL COMMENT '联系电话',
  \`contactEmail\` varchar(100) DEFAULT NULL COMMENT '联系邮箱',
  \`bankAccount\` varchar(100) DEFAULT NULL COMMENT '银行账户',
  \`taxNo\` varchar(100) DEFAULT NULL COMMENT '税号',
  \`remark\` text DEFAULT NULL COMMENT '备注',
  \`status\` varchar(20) NOT NULL DEFAULT 'active' COMMENT '供应商状态',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_supplier_code\` (\`code\`),
  KEY \`idx_performance_supplier_create_time\` (\`createTime\`),
  KEY \`idx_performance_supplier_update_time\` (\`updateTime\`),
  KEY \`idx_performance_supplier_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_supplier_name\` (\`name\`),
  KEY \`idx_performance_supplier_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='供应商主数据';
`;

const createPurchaseOrderTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_purchase_order\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`orderNo\` varchar(50) DEFAULT NULL COMMENT '订单编号',
  \`title\` varchar(200) NOT NULL COMMENT '采购标题',
  \`supplierId\` int(11) NOT NULL COMMENT '供应商 ID',
  \`departmentId\` int(11) NOT NULL COMMENT '申请部门 ID',
  \`requesterId\` int(11) NOT NULL COMMENT '申请人 ID',
  \`orderDate\` varchar(10) NOT NULL COMMENT '采购日期',
  \`expectedDeliveryDate\` varchar(10) DEFAULT NULL COMMENT '期望交付日期',
  \`totalAmount\` decimal(12,2) NOT NULL COMMENT '订单总金额',
  \`currency\` varchar(20) NOT NULL DEFAULT 'CNY' COMMENT '币种',
  \`remark\` text DEFAULT NULL COMMENT '备注',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '采购订单状态',
  \`approvedBy\` int(11) DEFAULT NULL COMMENT '审批人 ID',
  \`approvedAt\` varchar(19) DEFAULT NULL COMMENT '审批时间',
  \`approvalRemark\` text DEFAULT NULL COMMENT '审批备注',
  \`closedReason\` text DEFAULT NULL COMMENT '关闭原因',
  \`receivedQuantity\` int(11) NOT NULL DEFAULT 0 COMMENT '累计收货数量',
  \`receivedAt\` varchar(19) DEFAULT NULL COMMENT '最近收货时间',
  \`items\` longtext DEFAULT NULL COMMENT '采购明细快照',
  \`inquiryRecords\` longtext DEFAULT NULL COMMENT '询价记录',
  \`approvalLogs\` longtext DEFAULT NULL COMMENT '审批日志',
  \`receiptRecords\` longtext DEFAULT NULL COMMENT '收货记录',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_purchase_order_no\` (\`orderNo\`),
  KEY \`idx_performance_purchase_order_create_time\` (\`createTime\`),
  KEY \`idx_performance_purchase_order_update_time\` (\`updateTime\`),
  KEY \`idx_performance_purchase_order_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_purchase_order_supplier_id\` (\`supplierId\`),
  KEY \`idx_performance_purchase_order_department_id\` (\`departmentId\`),
  KEY \`idx_performance_purchase_order_requester_id\` (\`requesterId\`),
  KEY \`idx_performance_purchase_order_order_date\` (\`orderDate\`),
  KEY \`idx_performance_purchase_order_status\` (\`status\`),
  KEY \`idx_performance_purchase_order_approved_by\` (\`approvedBy\`),
  CHECK (json_valid(\`items\`)),
  CHECK (json_valid(\`inquiryRecords\`)),
  CHECK (json_valid(\`approvalLogs\`)),
  CHECK (json_valid(\`receiptRecords\`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='采购订单';
`;

const createAssetInfoTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_asset_info\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`assetNo\` varchar(50) NOT NULL COMMENT '资产编号',
  \`assetName\` varchar(200) NOT NULL COMMENT '资产名称',
  \`category\` varchar(100) DEFAULT NULL COMMENT '资产分类',
  \`assetType\` varchar(100) DEFAULT NULL COMMENT '资产类型',
  \`brand\` varchar(100) DEFAULT NULL COMMENT '品牌',
  \`model\` varchar(100) DEFAULT NULL COMMENT '型号',
  \`serialNo\` varchar(100) DEFAULT NULL COMMENT '序列号',
  \`status\` varchar(30) NOT NULL DEFAULT 'available' COMMENT '资产状态',
  \`location\` varchar(200) DEFAULT NULL COMMENT '存放位置',
  \`ownerDepartmentId\` int(11) NOT NULL COMMENT '所属部门 ID',
  \`managerId\` int(11) DEFAULT NULL COMMENT '管理人 ID',
  \`purchaseDate\` varchar(10) DEFAULT NULL COMMENT '采购日期',
  \`purchaseCost\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '采购金额',
  \`supplierId\` int(11) DEFAULT NULL COMMENT '供应商 ID',
  \`purchaseOrderId\` int(11) DEFAULT NULL COMMENT '采购订单 ID（弱关联）',
  \`warrantyExpiry\` varchar(10) DEFAULT NULL COMMENT '质保到期日',
  \`depreciationMonths\` int(11) NOT NULL DEFAULT 0 COMMENT '折旧月数',
  \`depreciatedAmount\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计折旧金额',
  \`netBookValue\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '净值',
  \`lastInventoryTime\` varchar(19) DEFAULT NULL COMMENT '最近盘点时间',
  \`remark\` text DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_asset_no\` (\`assetNo\`),
  KEY \`idx_performance_asset_info_create_time\` (\`createTime\`),
  KEY \`idx_performance_asset_info_update_time\` (\`updateTime\`),
  KEY \`idx_performance_asset_info_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_asset_info_category\` (\`category\`),
  KEY \`idx_performance_asset_info_serial_no\` (\`serialNo\`),
  KEY \`idx_performance_asset_info_status\` (\`status\`),
  KEY \`idx_performance_asset_info_owner_department_id\` (\`ownerDepartmentId\`),
  KEY \`idx_performance_asset_info_manager_id\` (\`managerId\`),
  KEY \`idx_performance_asset_info_supplier_id\` (\`supplierId\`),
  KEY \`idx_performance_asset_info_purchase_order_id\` (\`purchaseOrderId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='资产台账';
`;

const createAssetAssignmentTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_asset_assignment\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`assetId\` int(11) NOT NULL COMMENT '资产 ID',
  \`assigneeId\` int(11) NOT NULL COMMENT '领用人 ID',
  \`departmentId\` int(11) NOT NULL COMMENT '领用部门 ID',
  \`assignDate\` varchar(10) NOT NULL COMMENT '领用日期',
  \`returnDate\` varchar(10) DEFAULT NULL COMMENT '归还日期',
  \`status\` varchar(20) NOT NULL DEFAULT 'assigned' COMMENT '领用状态',
  \`purpose\` text DEFAULT NULL COMMENT '领用用途',
  \`returnNote\` text DEFAULT NULL COMMENT '归还说明',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_asset_assignment_create_time\` (\`createTime\`),
  KEY \`idx_performance_asset_assignment_update_time\` (\`updateTime\`),
  KEY \`idx_performance_asset_assignment_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_asset_assignment_asset_id\` (\`assetId\`),
  KEY \`idx_performance_asset_assignment_assignee_id\` (\`assigneeId\`),
  KEY \`idx_performance_asset_assignment_department_id\` (\`departmentId\`),
  KEY \`idx_performance_asset_assignment_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='资产领用记录';
`;

const createAssetMaintenanceTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_asset_maintenance\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`assetId\` int(11) NOT NULL COMMENT '资产 ID',
  \`departmentId\` int(11) NOT NULL COMMENT '所属部门 ID',
  \`maintenanceType\` varchar(50) DEFAULT NULL COMMENT '维护类型',
  \`vendor\` varchar(100) DEFAULT NULL COMMENT '服务商',
  \`cost\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '维护费用',
  \`startDate\` varchar(19) DEFAULT NULL COMMENT '开始时间',
  \`completedDate\` varchar(19) DEFAULT NULL COMMENT '完成时间',
  \`status\` varchar(20) NOT NULL DEFAULT 'scheduled' COMMENT '维护状态',
  \`description\` text DEFAULT NULL COMMENT '维护说明',
  \`result\` text DEFAULT NULL COMMENT '维护结果',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_asset_maintenance_create_time\` (\`createTime\`),
  KEY \`idx_performance_asset_maintenance_update_time\` (\`updateTime\`),
  KEY \`idx_performance_asset_maintenance_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_asset_maintenance_asset_id\` (\`assetId\`),
  KEY \`idx_performance_asset_maintenance_department_id\` (\`departmentId\`),
  KEY \`idx_performance_asset_maintenance_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='资产维护记录';
`;

const createAssetProcurementTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_asset_procurement\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`procurementNo\` varchar(50) NOT NULL COMMENT '采购入库单号',
  \`title\` varchar(200) NOT NULL COMMENT '标题',
  \`purchaseOrderId\` int(11) DEFAULT NULL COMMENT '采购订单 ID（弱关联）',
  \`supplierId\` int(11) DEFAULT NULL COMMENT '供应商 ID（弱关联）',
  \`ownerDepartmentId\` int(11) NOT NULL COMMENT '所属部门 ID',
  \`managerId\` int(11) DEFAULT NULL COMMENT '管理人 ID',
  \`assetName\` varchar(200) NOT NULL COMMENT '资产名称',
  \`category\` varchar(100) DEFAULT NULL COMMENT '资产分类',
  \`assetType\` varchar(100) DEFAULT NULL COMMENT '资产类型',
  \`brand\` varchar(100) DEFAULT NULL COMMENT '品牌',
  \`model\` varchar(100) DEFAULT NULL COMMENT '型号',
  \`serialNo\` varchar(100) DEFAULT NULL COMMENT '序列号或前缀',
  \`location\` varchar(200) DEFAULT NULL COMMENT '入库位置',
  \`purchaseDate\` varchar(10) DEFAULT NULL COMMENT '采购日期',
  \`unitCost\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '单价',
  \`quantity\` int(11) NOT NULL DEFAULT 1 COMMENT '数量',
  \`warrantyExpiry\` varchar(10) DEFAULT NULL COMMENT '质保到期日',
  \`depreciationMonths\` int(11) NOT NULL DEFAULT 0 COMMENT '折旧月数',
  \`receivedAssetIds\` longtext DEFAULT NULL COMMENT '已生成资产 ID 列表',
  \`submittedAt\` varchar(19) DEFAULT NULL COMMENT '提交时间',
  \`receivedAt\` varchar(19) DEFAULT NULL COMMENT '确认入库时间',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '采购入库状态',
  \`remark\` text DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_asset_procurement_no\` (\`procurementNo\`),
  KEY \`idx_performance_asset_procurement_create_time\` (\`createTime\`),
  KEY \`idx_performance_asset_procurement_update_time\` (\`updateTime\`),
  KEY \`idx_performance_asset_procurement_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_asset_procurement_purchase_order_id\` (\`purchaseOrderId\`),
  KEY \`idx_performance_asset_procurement_supplier_id\` (\`supplierId\`),
  KEY \`idx_performance_asset_procurement_owner_department_id\` (\`ownerDepartmentId\`),
  KEY \`idx_performance_asset_procurement_manager_id\` (\`managerId\`),
  KEY \`idx_performance_asset_procurement_category\` (\`category\`),
  KEY \`idx_performance_asset_procurement_status\` (\`status\`),
  CHECK (json_valid(\`receivedAssetIds\`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='资产采购入库单';
`;

const createAssetTransferTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_asset_transfer\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`transferNo\` varchar(50) NOT NULL COMMENT '调拨单号',
  \`assetId\` int(11) NOT NULL COMMENT '资产 ID',
  \`fromDepartmentId\` int(11) NOT NULL COMMENT '原所属部门 ID',
  \`toDepartmentId\` int(11) NOT NULL COMMENT '目标部门 ID',
  \`toManagerId\` int(11) DEFAULT NULL COMMENT '目标管理人 ID',
  \`fromLocation\` varchar(200) DEFAULT NULL COMMENT '原位置快照',
  \`toLocation\` varchar(200) DEFAULT NULL COMMENT '目标位置',
  \`reason\` text DEFAULT NULL COMMENT '调拨原因',
  \`submittedAt\` varchar(19) DEFAULT NULL COMMENT '提交时间',
  \`completedAt\` varchar(19) DEFAULT NULL COMMENT '完成时间',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '调拨状态',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_asset_transfer_no\` (\`transferNo\`),
  KEY \`idx_performance_asset_transfer_create_time\` (\`createTime\`),
  KEY \`idx_performance_asset_transfer_update_time\` (\`updateTime\`),
  KEY \`idx_performance_asset_transfer_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_asset_transfer_asset_id\` (\`assetId\`),
  KEY \`idx_performance_asset_transfer_from_department_id\` (\`fromDepartmentId\`),
  KEY \`idx_performance_asset_transfer_to_department_id\` (\`toDepartmentId\`),
  KEY \`idx_performance_asset_transfer_to_manager_id\` (\`toManagerId\`),
  KEY \`idx_performance_asset_transfer_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='资产调拨单';
`;

const createAssetInventoryTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_asset_inventory\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`inventoryNo\` varchar(50) NOT NULL COMMENT '盘点单号',
  \`assetId\` int(11) NOT NULL COMMENT '资产 ID',
  \`ownerDepartmentId\` int(11) NOT NULL COMMENT '所属部门 ID',
  \`locationSnapshot\` varchar(200) DEFAULT NULL COMMENT '位置快照',
  \`resultSummary\` text DEFAULT NULL COMMENT '盘点结果摘要',
  \`startedAt\` varchar(19) DEFAULT NULL COMMENT '开始时间',
  \`completedAt\` varchar(19) DEFAULT NULL COMMENT '完成时间',
  \`closedAt\` varchar(19) DEFAULT NULL COMMENT '关闭时间',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '盘点状态',
  \`remark\` text DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_asset_inventory_no\` (\`inventoryNo\`),
  KEY \`idx_performance_asset_inventory_create_time\` (\`createTime\`),
  KEY \`idx_performance_asset_inventory_update_time\` (\`updateTime\`),
  KEY \`idx_performance_asset_inventory_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_asset_inventory_asset_id\` (\`assetId\`),
  KEY \`idx_performance_asset_inventory_owner_department_id\` (\`ownerDepartmentId\`),
  KEY \`idx_performance_asset_inventory_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='资产盘点单';
`;

const createAssetDepreciationTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_asset_depreciation\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`assetId\` int(11) NOT NULL COMMENT '资产 ID',
  \`periodValue\` varchar(7) NOT NULL COMMENT '折旧期间',
  \`depreciationAmount\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '本期折旧额',
  \`accumulatedAmount\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计折旧额',
  \`netBookValue\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '净值',
  \`sourceCost\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '原值快照',
  \`recalculatedAt\` varchar(19) DEFAULT NULL COMMENT '重算时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_asset_depreciation_create_time\` (\`createTime\`),
  KEY \`idx_performance_asset_depreciation_update_time\` (\`updateTime\`),
  KEY \`idx_performance_asset_depreciation_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_asset_depreciation_asset_id\` (\`assetId\`),
  KEY \`idx_performance_asset_depreciation_period_value\` (\`periodValue\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='资产折旧快照';
`;

const createAssetDisposalTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_asset_disposal\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`disposalNo\` varchar(50) NOT NULL COMMENT '报废单号',
  \`assetId\` int(11) NOT NULL COMMENT '资产 ID',
  \`ownerDepartmentId\` int(11) NOT NULL COMMENT '所属部门 ID',
  \`reason\` text NOT NULL COMMENT '报废原因',
  \`remark\` text DEFAULT NULL COMMENT '备注',
  \`approvedById\` int(11) DEFAULT NULL COMMENT '审批人 ID',
  \`executedById\` int(11) DEFAULT NULL COMMENT '执行人 ID',
  \`submittedAt\` varchar(19) DEFAULT NULL COMMENT '提交时间',
  \`approvedAt\` varchar(19) DEFAULT NULL COMMENT '审批时间',
  \`executedAt\` varchar(19) DEFAULT NULL COMMENT '执行时间',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '报废状态',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_asset_disposal_no\` (\`disposalNo\`),
  KEY \`idx_performance_asset_disposal_create_time\` (\`createTime\`),
  KEY \`idx_performance_asset_disposal_update_time\` (\`updateTime\`),
  KEY \`idx_performance_asset_disposal_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_asset_disposal_asset_id\` (\`assetId\`),
  KEY \`idx_performance_asset_disposal_owner_department_id\` (\`ownerDepartmentId\`),
  KEY \`idx_performance_asset_disposal_approved_by_id\` (\`approvedById\`),
  KEY \`idx_performance_asset_disposal_executed_by_id\` (\`executedById\`),
  KEY \`idx_performance_asset_disposal_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='资产报废单';
`;

const createFeedbackTaskTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_feedback_task\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`assessmentId\` int(11) NOT NULL COMMENT '关联评估单',
  \`employeeId\` int(11) NOT NULL COMMENT '被评价人',
  \`title\` varchar(200) NOT NULL COMMENT '任务标题',
  \`deadline\` varchar(19) DEFAULT NULL COMMENT '截止时间',
  \`creatorId\` int(11) NOT NULL COMMENT '发起人',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '状态',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_feedback_task_create_time\` (\`createTime\`),
  KEY \`idx_performance_feedback_task_update_time\` (\`updateTime\`),
  KEY \`idx_performance_feedback_task_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_feedback_task_assessment_id\` (\`assessmentId\`),
  KEY \`idx_performance_feedback_task_employee_id\` (\`employeeId\`),
  KEY \`idx_performance_feedback_task_deadline\` (\`deadline\`),
  KEY \`idx_performance_feedback_task_creator_id\` (\`creatorId\`),
  KEY \`idx_performance_feedback_task_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='360环评任务';
`;

const createFeedbackRecordTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_feedback_record\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`taskId\` int(11) NOT NULL COMMENT '关联任务',
  \`feedbackUserId\` int(11) NOT NULL COMMENT '评价人',
  \`relationType\` varchar(20) NOT NULL COMMENT '评价关系',
  \`score\` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT '评分',
  \`content\` text DEFAULT NULL COMMENT '反馈内容',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '状态',
  \`submitTime\` varchar(19) DEFAULT NULL COMMENT '提交时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_feedback_record_task_user\` (\`taskId\`, \`feedbackUserId\`),
  KEY \`idx_performance_feedback_record_create_time\` (\`createTime\`),
  KEY \`idx_performance_feedback_record_update_time\` (\`updateTime\`),
  KEY \`idx_performance_feedback_record_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_feedback_record_task_id\` (\`taskId\`),
  KEY \`idx_performance_feedback_record_feedback_user_id\` (\`feedbackUserId\`),
  KEY \`idx_performance_feedback_record_status\` (\`status\`),
  KEY \`idx_performance_feedback_record_submit_time\` (\`submitTime\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='360环评反馈记录';
`;

const createApprovalConfigTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_approval_config\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`objectType\` varchar(30) NOT NULL COMMENT '审批对象类型',
  \`version\` varchar(30) NOT NULL COMMENT '配置版本号',
  \`enabled\` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否启用',
  \`notifyMode\` varchar(30) NOT NULL DEFAULT 'interface_only' COMMENT '通知模式',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_approval_config_object_type\` (\`objectType\`),
  KEY \`idx_performance_approval_config_create_time\` (\`createTime\`),
  KEY \`idx_performance_approval_config_update_time\` (\`updateTime\`),
  KEY \`idx_performance_approval_config_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_approval_config_version\` (\`version\`),
  KEY \`idx_performance_approval_config_enabled\` (\`enabled\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='自动审批流配置';
`;

const createApprovalConfigNodeTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_approval_config_node\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`configId\` int(11) NOT NULL COMMENT '配置 ID',
  \`nodeOrder\` int(11) NOT NULL COMMENT '节点顺序',
  \`nodeCode\` varchar(50) NOT NULL COMMENT '节点编码',
  \`nodeName\` varchar(100) NOT NULL COMMENT '节点名称',
  \`resolverType\` varchar(50) NOT NULL COMMENT '审批人解析方式',
  \`resolverValue\` varchar(200) DEFAULT NULL COMMENT '审批人解析参数',
  \`timeoutHours\` int(11) DEFAULT NULL COMMENT '节点超时阈值',
  \`allowTransfer\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否允许转办',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_approval_config_node_order\` (\`configId\`, \`nodeOrder\`),
  KEY \`idx_performance_approval_config_node_create_time\` (\`createTime\`),
  KEY \`idx_performance_approval_config_node_update_time\` (\`updateTime\`),
  KEY \`idx_performance_approval_config_node_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_approval_config_node_config_id\` (\`configId\`),
  KEY \`idx_performance_approval_config_node_resolver_type\` (\`resolverType\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='自动审批流配置节点';
`;

const createApprovalInstanceTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_approval_instance\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`objectType\` varchar(30) NOT NULL COMMENT '审批对象类型',
  \`objectId\` int(11) NOT NULL COMMENT '源业务对象 ID',
  \`sourceStatus\` varchar(30) NOT NULL COMMENT '源业务对象状态快照',
  \`configId\` int(11) NOT NULL COMMENT '配置 ID',
  \`configVersion\` varchar(30) NOT NULL COMMENT '配置版本快照',
  \`applicantId\` int(11) NOT NULL COMMENT '发起人 ID',
  \`employeeId\` int(11) NOT NULL COMMENT '业务所属员工 ID',
  \`departmentId\` int(11) NOT NULL COMMENT '业务所属部门 ID',
  \`status\` varchar(30) NOT NULL DEFAULT 'pending_resolution' COMMENT '实例状态',
  \`currentNodeOrder\` int(11) DEFAULT NULL COMMENT '当前节点顺序',
  \`currentApproverId\` int(11) DEFAULT NULL COMMENT '当前审批人 ID',
  \`launchTime\` varchar(19) NOT NULL COMMENT '发起时间',
  \`finishTime\` varchar(19) DEFAULT NULL COMMENT '结束时间',
  \`fallbackReason\` varchar(500) DEFAULT NULL COMMENT '回退原因',
  \`fallbackOperatorId\` int(11) DEFAULT NULL COMMENT '回退操作人',
  \`terminateReason\` varchar(500) DEFAULT NULL COMMENT '终止原因',
  \`terminateOperatorId\` int(11) DEFAULT NULL COMMENT '终止操作人',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_approval_instance_create_time\` (\`createTime\`),
  KEY \`idx_performance_approval_instance_update_time\` (\`updateTime\`),
  KEY \`idx_performance_approval_instance_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_approval_instance_object_type\` (\`objectType\`),
  KEY \`idx_performance_approval_instance_object_id\` (\`objectId\`),
  KEY \`idx_performance_approval_instance_source_status\` (\`sourceStatus\`),
  KEY \`idx_performance_approval_instance_config_id\` (\`configId\`),
  KEY \`idx_performance_approval_instance_applicant_id\` (\`applicantId\`),
  KEY \`idx_performance_approval_instance_employee_id\` (\`employeeId\`),
  KEY \`idx_performance_approval_instance_department_id\` (\`departmentId\`),
  KEY \`idx_performance_approval_instance_status\` (\`status\`),
  KEY \`idx_performance_approval_instance_current_node_order\` (\`currentNodeOrder\`),
  KEY \`idx_approval_instance_current_approver\` (\`currentApproverId\`),
  KEY \`idx_performance_approval_instance_launch_time\` (\`launchTime\`),
  KEY \`idx_performance_approval_instance_finish_time\` (\`finishTime\`),
  KEY \`idx_performance_approval_instance_fallback_operator_id\` (\`fallbackOperatorId\`),
  KEY \`idx_performance_approval_instance_terminate_operator_id\` (\`terminateOperatorId\`),
  KEY \`idx_approval_instance_object_status\` (\`objectType\`, \`objectId\`, \`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='自动审批实例';
`;

const createApprovalInstanceNodeTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_approval_instance_node\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`instanceId\` int(11) NOT NULL COMMENT '实例 ID',
  \`nodeOrder\` int(11) NOT NULL COMMENT '节点顺序',
  \`nodeCode\` varchar(50) NOT NULL COMMENT '节点编码',
  \`nodeName\` varchar(100) NOT NULL COMMENT '节点名称',
  \`resolverType\` varchar(50) NOT NULL COMMENT '审批人解析方式',
  \`resolverValueSnapshot\` varchar(200) DEFAULT NULL COMMENT '审批人解析参数快照',
  \`allowTransfer\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否允许转办',
  \`approverId\` int(11) DEFAULT NULL COMMENT '审批人 ID',
  \`status\` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '节点状态',
  \`actionTime\` varchar(19) DEFAULT NULL COMMENT '节点动作时间',
  \`transferFromUserId\` int(11) DEFAULT NULL COMMENT '转办前审批人 ID',
  \`transferReason\` varchar(500) DEFAULT NULL COMMENT '转办原因',
  \`comment\` text DEFAULT NULL COMMENT '审批意见',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_approval_instance_node_order\` (\`instanceId\`, \`nodeOrder\`),
  KEY \`idx_performance_approval_instance_node_create_time\` (\`createTime\`),
  KEY \`idx_performance_approval_instance_node_update_time\` (\`updateTime\`),
  KEY \`idx_performance_approval_instance_node_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_approval_instance_node_instance_id\` (\`instanceId\`),
  KEY \`idx_performance_approval_instance_node_resolver_type\` (\`resolverType\`),
  KEY \`idx_performance_approval_instance_node_approver_id\` (\`approverId\`),
  KEY \`idx_performance_approval_instance_node_status\` (\`status\`),
  KEY \`idx_performance_approval_instance_node_action_time\` (\`actionTime\`),
  KEY \`idx_performance_approval_instance_node_transfer_from_user_id\` (\`transferFromUserId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='自动审批实例节点';
`;

const createApprovalActionLogTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_approval_action_log\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`instanceId\` int(11) NOT NULL COMMENT '实例 ID',
  \`instanceNodeId\` int(11) DEFAULT NULL COMMENT '实例节点 ID',
  \`action\` varchar(30) NOT NULL COMMENT '动作类型',
  \`operatorId\` int(11) NOT NULL COMMENT '操作人 ID',
  \`fromStatus\` varchar(30) DEFAULT NULL COMMENT '操作前实例状态',
  \`toStatus\` varchar(30) DEFAULT NULL COMMENT '操作后实例状态',
  \`reason\` varchar(500) DEFAULT NULL COMMENT '动作原因',
  \`detail\` varchar(1000) DEFAULT NULL COMMENT '动作摘要',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_approval_action_log_create_time\` (\`createTime\`),
  KEY \`idx_performance_approval_action_log_update_time\` (\`updateTime\`),
  KEY \`idx_performance_approval_action_log_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_approval_action_log_instance_id\` (\`instanceId\`),
  KEY \`idx_performance_approval_action_log_instance_node_id\` (\`instanceNodeId\`),
  KEY \`idx_performance_approval_action_log_action\` (\`action\`),
  KEY \`idx_performance_approval_action_log_operator_id\` (\`operatorId\`),
  KEY \`idx_approval_action_instance_time\` (\`instanceId\`, \`createTime\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='自动审批动作审计';
`;

export const managedTables = [
  'performance_supplier',
  'performance_purchase_order',
  'performance_asset_info',
  'performance_asset_assignment',
  'performance_asset_maintenance',
  'performance_asset_procurement',
  'performance_asset_transfer',
  'performance_asset_inventory',
  'performance_asset_depreciation',
  'performance_asset_disposal',
  'performance_feedback_task',
  'performance_feedback_record',
  'performance_approval_config',
  'performance_approval_config_node',
  'performance_approval_instance',
  'performance_approval_instance_node',
  'performance_approval_action_log',
];

export async function up(connection) {
  await connection.query(createSupplierTableSql);
  await connection.query(createPurchaseOrderTableSql);
  await connection.query(createAssetInfoTableSql);
  await connection.query(createAssetAssignmentTableSql);
  await connection.query(createAssetMaintenanceTableSql);
  await connection.query(createAssetProcurementTableSql);
  await connection.query(createAssetTransferTableSql);
  await connection.query(createAssetInventoryTableSql);
  await connection.query(createAssetDepreciationTableSql);
  await connection.query(createAssetDisposalTableSql);
  await connection.query(createFeedbackTaskTableSql);
  await connection.query(createFeedbackRecordTableSql);
  await connection.query(createApprovalConfigTableSql);
  await connection.query(createApprovalConfigNodeTableSql);
  await connection.query(createApprovalInstanceTableSql);
  await connection.query(createApprovalInstanceNodeTableSql);
  await connection.query(createApprovalActionLogTableSql);
}

export async function down(connection) {
  for (const tableName of [...managedTables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
