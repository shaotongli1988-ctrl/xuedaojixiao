/**
 * Creates the formal schema for automated suggestions.
 * This migration only manages additive creation and rollback of the suggestion summary table used by assessment follow-up workflows.
 * Maintenance pitfall: keep audit-only fields persisted for backend linkage, but do not relax the current entity/index contract.
 */

export const migrationId = '20260420125000';
export const migrationName = 'add-performance-suggestion-table';

const createSuggestionTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_suggestion\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`suggestionType\` varchar(20) NOT NULL COMMENT '建议类型',
  \`status\` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '建议状态',
  \`assessmentId\` int(11) NOT NULL COMMENT '来源评估单 ID',
  \`employeeId\` int(11) NOT NULL COMMENT '员工 ID',
  \`departmentId\` int(11) NOT NULL COMMENT '部门 ID',
  \`periodType\` varchar(20) NOT NULL COMMENT '周期类型',
  \`periodValue\` varchar(30) NOT NULL COMMENT '周期值',
  \`triggerLabel\` varchar(100) NOT NULL COMMENT '非敏感触发摘要',
  \`triggerGrade\` varchar(10) DEFAULT NULL COMMENT '触发等级快照',
  \`triggerScore\` decimal(5,2) DEFAULT NULL COMMENT '触发分数快照',
  \`ruleVersion\` varchar(50) NOT NULL COMMENT '规则版本',
  \`handleTime\` varchar(19) DEFAULT NULL COMMENT '最近处理时间',
  \`handlerId\` int(11) DEFAULT NULL COMMENT '最近处理人 ID',
  \`handlerName\` varchar(100) DEFAULT NULL COMMENT '最近处理人姓名',
  \`revokeReasonCode\` varchar(50) DEFAULT NULL COMMENT '撤销原因编码',
  \`revokeReason\` text DEFAULT NULL COMMENT '撤销原因说明',
  \`linkedEntityType\` varchar(20) DEFAULT NULL COMMENT '关联正式单据类型',
  \`linkedEntityId\` int(11) DEFAULT NULL COMMENT '关联正式单据 ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_suggestion_create_time\` (\`createTime\`),
  KEY \`idx_performance_suggestion_update_time\` (\`updateTime\`),
  KEY \`idx_performance_suggestion_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_suggestion_type\` (\`suggestionType\`),
  KEY \`idx_performance_suggestion_status\` (\`status\`),
  KEY \`idx_performance_suggestion_assessment_id\` (\`assessmentId\`),
  KEY \`idx_performance_suggestion_employee_id\` (\`employeeId\`),
  KEY \`idx_performance_suggestion_department_id\` (\`departmentId\`),
  KEY \`idx_performance_suggestion_period_value\` (\`periodValue\`),
  KEY \`idx_performance_suggestion_handle_time\` (\`handleTime\`),
  KEY \`idx_performance_suggestion_handler_id\` (\`handlerId\`),
  KEY \`idx_performance_suggestion_linked_entity_id\` (\`linkedEntityId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='自动建议记录';
`;

export const managedTables = ['performance_suggestion'];

export async function up(connection) {
  await connection.query(createSuggestionTableSql);
}

export async function down(connection) {
  for (const tableName of [...managedTables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
