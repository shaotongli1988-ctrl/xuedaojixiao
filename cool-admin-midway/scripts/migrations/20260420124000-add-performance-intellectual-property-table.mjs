/**
 * Creates the formal schema for the intellectual-property ledger table.
 * This migration only manages additive creation and rollback of the HR-only intellectual-property ledger schema.
 * Maintenance pitfall: keep the ipNo unique key, indexed status/type fields, and base audit columns aligned with the TypeORM entity.
 */

export const migrationId = '20260420124000';
export const migrationName = 'add-performance-intellectual-property-table';

const createIntellectualPropertyTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_intellectual_property\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`ipNo\` varchar(64) NOT NULL COMMENT '知识产权编号',
  \`title\` varchar(200) NOT NULL COMMENT '标题',
  \`ipType\` varchar(32) NOT NULL COMMENT '知识产权类型',
  \`ownerDepartment\` varchar(100) NOT NULL COMMENT '归属部门',
  \`ownerName\` varchar(100) NOT NULL COMMENT '归属人',
  \`applicantName\` varchar(100) NOT NULL COMMENT '申请人',
  \`applyDate\` varchar(10) NOT NULL COMMENT '申请日期',
  \`grantDate\` varchar(10) DEFAULT NULL COMMENT '授权日期',
  \`expiryDate\` varchar(10) DEFAULT NULL COMMENT '到期日期',
  \`status\` varchar(32) NOT NULL DEFAULT 'drafting' COMMENT '状态',
  \`registryNo\` varchar(100) DEFAULT NULL COMMENT '登记号',
  \`usageScope\` text DEFAULT NULL COMMENT '使用范围',
  \`riskLevel\` varchar(32) DEFAULT NULL COMMENT '风险等级',
  \`notes\` text DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_intellectual_property_no\` (\`ipNo\`),
  KEY \`idx_performance_intellectual_property_create_time\` (\`createTime\`),
  KEY \`idx_performance_intellectual_property_update_time\` (\`updateTime\`),
  KEY \`idx_performance_intellectual_property_tenant\` (\`tenantId\`),
  KEY \`idx_performance_intellectual_property_title\` (\`title\`),
  KEY \`idx_performance_intellectual_property_type\` (\`ipType\`),
  KEY \`idx_performance_intellectual_property_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='知识产权台账';
`;

export const managedTables = ['performance_intellectual_property'];

export async function up(connection) {
  await connection.query(createIntellectualPropertyTableSql);
}

export async function down(connection) {
  for (const tableName of [...managedTables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
