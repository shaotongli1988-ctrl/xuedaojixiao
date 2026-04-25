/**
 * Creates the formal schema for Theme20 asset assignment requests.
 * This migration only manages additive creation and rollback of the request-layer table used by L1/L2 approvalized assignment.
 * Maintenance pitfall: keep request-layer status, approval runtime fields, and assignment result bindings aligned with the TypeORM entity.
 */

export const migrationId = '20260420103000';
export const migrationName = 'add-performance-asset-assignment-request-table';

const createAssetAssignmentRequestTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_asset_assignment_request\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`requestNo\` varchar(50) NOT NULL COMMENT '申请编号',
  \`requestLevel\` varchar(20) NOT NULL COMMENT '申请层级',
  \`requestType\` varchar(30) NOT NULL DEFAULT 'standard' COMMENT '申请类型',
  \`applicantId\` int(11) NOT NULL COMMENT '申请人 ID',
  \`applicantDepartmentId\` int(11) NOT NULL COMMENT '申请人部门 ID',
  \`assetCategory\` varchar(100) NOT NULL COMMENT '资产分类',
  \`assetModelRequest\` varchar(200) DEFAULT NULL COMMENT '型号需求',
  \`quantity\` int(11) NOT NULL DEFAULT 1 COMMENT '数量',
  \`unitPriceEstimate\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '预估单价',
  \`usageReason\` text DEFAULT NULL COMMENT '用途说明',
  \`expectedUseStartDate\` varchar(10) DEFAULT NULL COMMENT '预期使用日期',
  \`targetDepartmentId\` int(11) DEFAULT NULL COMMENT '目标部门 ID',
  \`exceptionReason\` text DEFAULT NULL COMMENT '异常原因',
  \`originalAssetId\` int(11) DEFAULT NULL COMMENT '原资产 ID',
  \`originalAssignmentId\` int(11) DEFAULT NULL COMMENT '原领用记录 ID',
  \`approvalInstanceId\` int(11) DEFAULT NULL COMMENT '审批实例 ID',
  \`approvalStatus\` varchar(30) DEFAULT NULL COMMENT '审批状态',
  \`currentApproverId\` int(11) DEFAULT NULL COMMENT '当前审批人 ID',
  \`approvalTriggeredRules\` text DEFAULT NULL COMMENT '命中规则快照',
  \`assignedAssetId\` int(11) DEFAULT NULL COMMENT '已配发资产 ID',
  \`assignmentRecordId\` int(11) DEFAULT NULL COMMENT '正式领用记录 ID',
  \`assignedBy\` int(11) DEFAULT NULL COMMENT '配发人 ID',
  \`assignedAt\` varchar(19) DEFAULT NULL COMMENT '配发时间',
  \`status\` varchar(30) NOT NULL DEFAULT 'draft' COMMENT '请求单状态',
  \`submitTime\` varchar(19) DEFAULT NULL COMMENT '提交时间',
  \`withdrawTime\` varchar(19) DEFAULT NULL COMMENT '撤回时间',
  \`cancelReason\` varchar(500) DEFAULT NULL COMMENT '取消原因',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_asset_assignment_request_no\` (\`requestNo\`),
  KEY \`idx_performance_asset_assignment_request_create_time\` (\`createTime\`),
  KEY \`idx_performance_asset_assignment_request_update_time\` (\`updateTime\`),
  KEY \`idx_performance_asset_assignment_request_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_asset_assignment_request_level\` (\`requestLevel\`),
  KEY \`idx_performance_asset_assignment_request_type\` (\`requestType\`),
  KEY \`idx_performance_asset_assignment_request_applicant_id\` (\`applicantId\`),
  KEY \`idx_performance_asset_assignment_request_applicant_department_id\` (\`applicantDepartmentId\`),
  KEY \`idx_performance_asset_assignment_request_target_department_id\` (\`targetDepartmentId\`),
  KEY \`idx_performance_asset_assignment_request_original_asset_id\` (\`originalAssetId\`),
  KEY \`idx_performance_asset_assignment_request_original_assignment_id\` (\`originalAssignmentId\`),
  KEY \`idx_performance_asset_assignment_request_approval_instance_id\` (\`approvalInstanceId\`),
  KEY \`idx_performance_asset_assignment_request_current_approver_id\` (\`currentApproverId\`),
  KEY \`idx_performance_asset_assignment_request_assigned_asset_id\` (\`assignedAssetId\`),
  KEY \`idx_performance_asset_assignment_request_assignment_record_id\` (\`assignmentRecordId\`),
  KEY \`idx_performance_asset_assignment_request_assigned_by\` (\`assignedBy\`),
  KEY \`idx_performance_asset_assignment_request_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='资产领用申请单';
`;

export const managedTables = ['performance_asset_assignment_request'];

export async function up(connection) {
  await connection.query(createAssetAssignmentRequestTableSql);
}

export async function down(connection) {
  for (const tableName of [...managedTables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
