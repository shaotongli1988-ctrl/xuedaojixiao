/**
 * Creates the formal schema for performance work plans.
 * This migration only manages additive creation and rollback of the work-plan table used by DingTalk approval sourcing and internal execution.
 * Maintenance pitfall: keep execution status fields and source approval fields separate, and align every column and index with the entity before editing.
 */

export const migrationId = '20260420001000';
export const migrationName = 'add-performance-work-plan-table';

const createWorkPlanTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_work_plan\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`workNo\` varchar(50) NOT NULL COMMENT '工作计划单号',
  \`ownerDepartmentId\` int(11) NOT NULL COMMENT '所属部门 ID',
  \`ownerId\` int(11) NOT NULL COMMENT '计划负责人 ID',
  \`title\` varchar(200) NOT NULL COMMENT '计划标题',
  \`description\` text DEFAULT NULL COMMENT '计划说明',
  \`assigneeIds\` json DEFAULT NULL COMMENT '协作执行人 ID 列表',
  \`priority\` varchar(20) NOT NULL DEFAULT 'medium' COMMENT '优先级',
  \`plannedStartDate\` varchar(10) DEFAULT NULL COMMENT '计划开始日期',
  \`plannedEndDate\` varchar(10) DEFAULT NULL COMMENT '计划结束日期',
  \`startedAt\` varchar(19) DEFAULT NULL COMMENT '开始执行时间',
  \`completedAt\` varchar(19) DEFAULT NULL COMMENT '完成时间',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '执行状态',
  \`progressSummary\` text DEFAULT NULL COMMENT '进展摘要',
  \`resultSummary\` text DEFAULT NULL COMMENT '结果总结',
  \`sourceType\` varchar(30) NOT NULL DEFAULT 'manual' COMMENT '来源类型',
  \`sourceBizType\` varchar(50) DEFAULT NULL COMMENT '来源业务类型',
  \`sourceBizId\` varchar(100) DEFAULT NULL COMMENT '来源业务 ID',
  \`sourceTitle\` varchar(200) DEFAULT NULL COMMENT '来源标题快照',
  \`sourceStatus\` varchar(20) NOT NULL DEFAULT 'none' COMMENT '来源审批状态',
  \`externalInstanceId\` varchar(100) DEFAULT NULL COMMENT '外部审批实例 ID',
  \`externalProcessCode\` varchar(100) DEFAULT NULL COMMENT '外部审批模板编码',
  \`approvalFinishedAt\` varchar(19) DEFAULT NULL COMMENT '来源审批完成时间',
  \`sourceSnapshot\` json DEFAULT NULL COMMENT '来源审批轻量快照',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_work_plan_no\` (\`workNo\`),
  UNIQUE KEY \`uk_performance_work_plan_external_instance\` (\`externalInstanceId\`),
  KEY \`idx_performance_work_plan_create_time\` (\`createTime\`),
  KEY \`idx_performance_work_plan_update_time\` (\`updateTime\`),
  KEY \`idx_performance_work_plan_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_work_plan_owner_department_id\` (\`ownerDepartmentId\`),
  KEY \`idx_performance_work_plan_owner_id\` (\`ownerId\`),
  KEY \`idx_performance_work_plan_priority\` (\`priority\`),
  KEY \`idx_performance_work_plan_status\` (\`status\`),
  KEY \`idx_performance_work_plan_source_type\` (\`sourceType\`),
  KEY \`idx_performance_work_plan_source_status\` (\`sourceStatus\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工作计划';
`;

export const managedTables = ['performance_work_plan'];

export async function up(connection) {
  await connection.query(createWorkPlanTableSql);
}

export async function down(connection) {
  for (const tableName of [...managedTables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
