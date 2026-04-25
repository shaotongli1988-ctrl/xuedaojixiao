/**
 * Creates the formal schema for the stage-2 material domain.
 * This migration only manages additive table creation and rollback for the five material tables.
 * Maintenance pitfall: keep every column, default, and index aligned with the TypeORM entities before changing this file.
 */

export const migrationId = '20260419231000';
export const migrationName = 'add-performance-material-tables';

const createMaterialCatalogTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_material_catalog\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`code\` varchar(50) NOT NULL COMMENT '物资编码',
  \`name\` varchar(200) NOT NULL COMMENT '物资名称',
  \`category\` varchar(100) DEFAULT NULL COMMENT '物资分类',
  \`specification\` varchar(200) DEFAULT NULL COMMENT '规格型号',
  \`unit\` varchar(20) NOT NULL COMMENT '计量单位',
  \`safetyStock\` int(11) NOT NULL DEFAULT 0 COMMENT '安全库存',
  \`referenceUnitCost\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '参考单价',
  \`status\` varchar(20) NOT NULL DEFAULT 'active' COMMENT '目录状态',
  \`remark\` text DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_material_catalog_code\` (\`code\`),
  KEY \`idx_performance_material_catalog_create_time\` (\`createTime\`),
  KEY \`idx_performance_material_catalog_update_time\` (\`updateTime\`),
  KEY \`idx_performance_material_catalog_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_material_catalog_name\` (\`name\`),
  KEY \`idx_performance_material_catalog_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='物资目录';
`;

const createMaterialStockTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_material_stock\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`catalogId\` int(11) NOT NULL COMMENT '物资目录 ID',
  \`departmentId\` int(11) NOT NULL COMMENT '所属部门 ID',
  \`currentQty\` int(11) NOT NULL DEFAULT 0 COMMENT '当前库存数量',
  \`availableQty\` int(11) NOT NULL DEFAULT 0 COMMENT '可用库存数量',
  \`reservedQty\` int(11) NOT NULL DEFAULT 0 COMMENT '预留库存数量',
  \`issuedQty\` int(11) NOT NULL DEFAULT 0 COMMENT '累计已出库数量',
  \`lastUnitCost\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '最近参考单价',
  \`lastInboundTime\` varchar(19) DEFAULT NULL COMMENT '最近入库时间',
  \`lastIssueTime\` varchar(19) DEFAULT NULL COMMENT '最近出库时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_material_stock_catalog_department\` (\`catalogId\`, \`departmentId\`),
  KEY \`idx_performance_material_stock_create_time\` (\`createTime\`),
  KEY \`idx_performance_material_stock_update_time\` (\`updateTime\`),
  KEY \`idx_performance_material_stock_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_material_stock_catalog_id\` (\`catalogId\`),
  KEY \`idx_performance_material_stock_department_id\` (\`departmentId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='物资库存聚合';
`;

const createMaterialInboundTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_material_inbound\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`inboundNo\` varchar(50) NOT NULL COMMENT '入库单号',
  \`title\` varchar(200) NOT NULL COMMENT '入库标题',
  \`catalogId\` int(11) NOT NULL COMMENT '物资目录 ID',
  \`departmentId\` int(11) NOT NULL COMMENT '入库部门 ID',
  \`quantity\` int(11) NOT NULL DEFAULT 1 COMMENT '入库数量',
  \`unitCost\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '入库单价',
  \`totalAmount\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '入库金额',
  \`sourceType\` varchar(50) DEFAULT NULL COMMENT '来源类型',
  \`sourceBizId\` varchar(100) DEFAULT NULL COMMENT '来源业务 ID',
  \`submittedAt\` varchar(19) DEFAULT NULL COMMENT '提交时间',
  \`receivedBy\` int(11) DEFAULT NULL COMMENT '确认入库人 ID',
  \`receivedAt\` varchar(19) DEFAULT NULL COMMENT '确认入库时间',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '入库单状态',
  \`remark\` text DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_material_inbound_no\` (\`inboundNo\`),
  KEY \`idx_performance_material_inbound_create_time\` (\`createTime\`),
  KEY \`idx_performance_material_inbound_update_time\` (\`updateTime\`),
  KEY \`idx_performance_material_inbound_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_material_inbound_catalog_id\` (\`catalogId\`),
  KEY \`idx_performance_material_inbound_department_id\` (\`departmentId\`),
  KEY \`idx_performance_material_inbound_received_by\` (\`receivedBy\`),
  KEY \`idx_performance_material_inbound_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='物资入库单';
`;

const createMaterialIssueTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_material_issue\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`issueNo\` varchar(50) NOT NULL COMMENT '出库单号',
  \`title\` varchar(200) NOT NULL COMMENT '出库标题',
  \`catalogId\` int(11) NOT NULL COMMENT '物资目录 ID',
  \`departmentId\` int(11) NOT NULL COMMENT '出库部门 ID',
  \`quantity\` int(11) NOT NULL DEFAULT 1 COMMENT '出库数量',
  \`assigneeId\` int(11) NOT NULL COMMENT '领用人 ID',
  \`assigneeName\` varchar(100) NOT NULL COMMENT '领用人姓名',
  \`purpose\` varchar(200) DEFAULT NULL COMMENT '用途',
  \`issueDate\` varchar(19) DEFAULT NULL COMMENT '出库日期',
  \`submittedAt\` varchar(19) DEFAULT NULL COMMENT '提交时间',
  \`issuedBy\` int(11) DEFAULT NULL COMMENT '确认出库人 ID',
  \`issuedAt\` varchar(19) DEFAULT NULL COMMENT '确认出库时间',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '出库单状态',
  \`remark\` text DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_material_issue_no\` (\`issueNo\`),
  KEY \`idx_performance_material_issue_create_time\` (\`createTime\`),
  KEY \`idx_performance_material_issue_update_time\` (\`updateTime\`),
  KEY \`idx_performance_material_issue_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_material_issue_catalog_id\` (\`catalogId\`),
  KEY \`idx_performance_material_issue_department_id\` (\`departmentId\`),
  KEY \`idx_performance_material_issue_assignee_id\` (\`assigneeId\`),
  KEY \`idx_performance_material_issue_issued_by\` (\`issuedBy\`),
  KEY \`idx_performance_material_issue_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='物资领用单';
`;

const createMaterialStockLogTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_material_stock_log\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`catalogId\` int(11) NOT NULL COMMENT '物资目录 ID',
  \`departmentId\` int(11) NOT NULL COMMENT '部门 ID',
  \`stockId\` int(11) NOT NULL COMMENT '库存聚合 ID',
  \`bizType\` varchar(20) NOT NULL COMMENT '业务类型',
  \`bizId\` int(11) NOT NULL COMMENT '业务单 ID',
  \`bizNo\` varchar(50) DEFAULT NULL COMMENT '业务单号',
  \`changeType\` varchar(20) NOT NULL COMMENT '变更方向',
  \`quantity\` int(11) NOT NULL DEFAULT 0 COMMENT '变更数量',
  \`beforeQuantity\` int(11) NOT NULL DEFAULT 0 COMMENT '变更前数量',
  \`afterQuantity\` int(11) NOT NULL DEFAULT 0 COMMENT '变更后数量',
  \`unitCost\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '参考单价',
  \`operatedAt\` varchar(19) NOT NULL COMMENT '操作时间',
  \`operatorId\` int(11) DEFAULT NULL COMMENT '操作人 ID',
  \`operatorName\` varchar(100) DEFAULT NULL COMMENT '操作人名称',
  \`remark\` text DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_material_stock_log_create_time\` (\`createTime\`),
  KEY \`idx_performance_material_stock_log_update_time\` (\`updateTime\`),
  KEY \`idx_performance_material_stock_log_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_material_stock_log_catalog_id\` (\`catalogId\`),
  KEY \`idx_performance_material_stock_log_department_id\` (\`departmentId\`),
  KEY \`idx_performance_material_stock_log_stock_id\` (\`stockId\`),
  KEY \`idx_performance_material_stock_log_biz_type\` (\`bizType\`),
  KEY \`idx_performance_material_stock_log_biz_id\` (\`bizId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='物资库存流水';
`;

export const managedTables = [
  'performance_material_catalog',
  'performance_material_stock',
  'performance_material_inbound',
  'performance_material_issue',
  'performance_material_stock_log',
];

export async function up(connection) {
  await connection.query(createMaterialCatalogTableSql);
  await connection.query(createMaterialStockTableSql);
  await connection.query(createMaterialInboundTableSql);
  await connection.query(createMaterialIssueTableSql);
  await connection.query(createMaterialStockLogTableSql);
}

export async function down(connection) {
  for (const tableName of [...managedTables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
