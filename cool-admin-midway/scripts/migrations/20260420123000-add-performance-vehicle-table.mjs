/**
 * Creates the formal schema for the vehicle ledger table.
 * This migration only manages additive creation and rollback of the HR-only vehicle ledger schema.
 * Maintenance pitfall: keep unique keys, enum-bearing columns, and base entity audit columns aligned with the TypeORM entity.
 */

export const migrationId = '20260420123000';
export const migrationName = 'add-performance-vehicle-table';

const createVehicleTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_vehicle\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`vehicleNo\` varchar(64) NOT NULL COMMENT '车辆编号',
  \`plateNo\` varchar(32) NOT NULL COMMENT '车牌号',
  \`brand\` varchar(100) NOT NULL COMMENT '品牌',
  \`model\` varchar(100) NOT NULL COMMENT '型号',
  \`vehicleType\` varchar(32) NOT NULL COMMENT '车辆类型',
  \`ownerDepartment\` varchar(100) NOT NULL COMMENT '归属部门',
  \`managerName\` varchar(100) NOT NULL COMMENT '管理员',
  \`seats\` int(11) NOT NULL DEFAULT 5 COMMENT '座位数',
  \`registerDate\` varchar(10) NOT NULL COMMENT '登记日期',
  \`inspectionDueDate\` varchar(10) DEFAULT NULL COMMENT '年检到期日',
  \`insuranceDueDate\` varchar(10) DEFAULT NULL COMMENT '保险到期日',
  \`status\` varchar(32) NOT NULL DEFAULT 'idle' COMMENT '状态',
  \`usageScope\` text DEFAULT NULL COMMENT '使用范围',
  \`notes\` text DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_vehicle_no\` (\`vehicleNo\`),
  UNIQUE KEY \`uk_performance_vehicle_plate\` (\`plateNo\`),
  KEY \`idx_performance_vehicle_create_time\` (\`createTime\`),
  KEY \`idx_performance_vehicle_update_time\` (\`updateTime\`),
  KEY \`idx_performance_vehicle_tenant\` (\`tenantId\`),
  KEY \`idx_performance_vehicle_type\` (\`vehicleType\`),
  KEY \`idx_performance_vehicle_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='车辆管理台账';
`;

export const managedTables = ['performance_vehicle'];

export async function up(connection) {
  await connection.query(createVehicleTableSql);
}

export async function down(connection) {
  for (const tableName of [...managedTables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
