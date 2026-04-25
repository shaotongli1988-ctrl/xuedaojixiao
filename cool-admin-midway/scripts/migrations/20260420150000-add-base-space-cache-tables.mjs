/**
 * Creates the formal schema baseline for base, space, and shared cache tables.
 * This migration only manages additive creation and rollback of legacy non-performance tables already required by module init and local runtime.
 * Maintenance pitfall: keep this file aligned with the current entity contract and remove any AUTO_INCREMENT runtime drift from captured DDL.
 */

export const migrationId = '20260420150000';
export const migrationName = 'add-base-space-cache-tables';

const createBaseSysConfTableSql = `CREATE TABLE \`base_sys_conf\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`cKey\` varchar(255) NOT NULL COMMENT '配置键',
  \`cValue\` varchar(255) NOT NULL COMMENT '配置值',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_9be195d27767b4485417869c3a\` (\`cKey\`),
  KEY \`IDX_905208f206a3ff9fd513421971\` (\`createTime\`),
  KEY \`IDX_4c6f27f6ecefe51a5a196a047a\` (\`updateTime\`),
  KEY \`IDX_03fc424a2f8093a538730a7ff2\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createBaseSysDepartmentTableSql = `CREATE TABLE \`base_sys_department\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`name\` varchar(255) NOT NULL COMMENT '部门名称',
  \`userId\` int(11) DEFAULT NULL COMMENT '创建者ID',
  \`parentId\` int(11) DEFAULT NULL COMMENT '上级部门ID',
  \`orderNum\` int(11) NOT NULL DEFAULT 0 COMMENT '排序',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_be4c53cd671384fa588ca9470a\` (\`createTime\`),
  KEY \`IDX_ca1473a793961ec55bc0c8d268\` (\`updateTime\`),
  KEY \`IDX_f19e8ffd9c62ddb17e76c8b9d7\` (\`tenantId\`),
  KEY \`IDX_f5fb5ac30b3609c27af3517727\` (\`userId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createBaseSysLogTableSql = `CREATE TABLE \`base_sys_log\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`userId\` int(11) DEFAULT NULL COMMENT '用户ID',
  \`action\` varchar(255) NOT NULL COMMENT '行为',
  \`ip\` varchar(255) DEFAULT NULL COMMENT 'ip',
  \`params\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '参数' CHECK (json_valid(\`params\`)),
  PRIMARY KEY (\`id\`),
  KEY \`IDX_c9382b76219a1011f7b8e7bcd1\` (\`createTime\`),
  KEY \`IDX_bfd44e885b470da43bcc39aaa7\` (\`updateTime\`),
  KEY \`IDX_384bde153859845bf0dcdc00f6\` (\`tenantId\`),
  KEY \`IDX_51a2caeb5713efdfcb343a8772\` (\`userId\`),
  KEY \`IDX_938f886fb40e163db174b7f6c3\` (\`action\`),
  KEY \`IDX_24e18767659f8c7142580893f2\` (\`ip\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createBaseSysMenuTableSql = `CREATE TABLE \`base_sys_menu\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`parentId\` int(11) DEFAULT NULL COMMENT '父菜单ID',
  \`name\` varchar(255) NOT NULL COMMENT '菜单名称',
  \`router\` varchar(255) DEFAULT NULL COMMENT '菜单地址',
  \`perms\` text DEFAULT NULL COMMENT '权限标识',
  \`type\` int(11) NOT NULL DEFAULT 0 COMMENT '类型 0-目录 1-菜单 2-按钮',
  \`icon\` varchar(255) DEFAULT NULL COMMENT '图标',
  \`orderNum\` int(11) NOT NULL DEFAULT 0 COMMENT '排序',
  \`viewPath\` varchar(255) DEFAULT NULL COMMENT '视图地址',
  \`keepAlive\` tinyint(4) NOT NULL DEFAULT 1 COMMENT '路由缓存',
  \`isShow\` tinyint(4) NOT NULL DEFAULT 1 COMMENT '是否显示',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_05e3d6a56604771a6da47ebf8e\` (\`createTime\`),
  KEY \`IDX_d5203f18daaf7c3fe0ab34497f\` (\`updateTime\`),
  KEY \`IDX_2087f9610c1fc5a184bedaacef\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createBaseSysParamTableSql = `CREATE TABLE \`base_sys_param\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`keyName\` varchar(255) NOT NULL COMMENT '键',
  \`name\` varchar(255) NOT NULL COMMENT '名称',
  \`data\` text NOT NULL COMMENT '数据',
  \`dataType\` int(11) NOT NULL DEFAULT 0 COMMENT '数据类型 0-字符串 1-富文本 2-文件 ',
  \`remark\` varchar(255) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_cf19b5e52d8c71caa9c4534454\` (\`keyName\`),
  KEY \`IDX_7bcb57371b481d8e2d66ddeaea\` (\`createTime\`),
  KEY \`IDX_479122e3bf464112f7a7253dac\` (\`updateTime\`),
  KEY \`IDX_8a0ab598ca7d63475356ca1157\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createBaseSysRoleTableSql = `CREATE TABLE \`base_sys_role\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`userId\` varchar(255) NOT NULL COMMENT '用户ID',
  \`name\` varchar(255) NOT NULL COMMENT '名称',
  \`label\` varchar(50) DEFAULT NULL COMMENT '角色标签',
  \`isSuperAdmin\` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否系统超管角色',
  \`remark\` varchar(255) DEFAULT NULL COMMENT '备注',
  \`relevance\` tinyint(4) NOT NULL DEFAULT 0 COMMENT '数据权限是否关联上下级',
  \`menuIdList\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '菜单权限' CHECK (json_valid(\`menuIdList\`)),
  \`departmentIdList\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '部门权限' CHECK (json_valid(\`departmentIdList\`)),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_469d49a5998170e9550cf113da\` (\`name\`),
  UNIQUE KEY \`IDX_f3f24fbbccf00192b076e549a7\` (\`label\`),
  KEY \`IDX_6f01184441dec49207b41bfd92\` (\`createTime\`),
  KEY \`IDX_d64ca209f3fc52128d9b20e97b\` (\`updateTime\`),
  KEY \`IDX_953dc26a4e8bd5d9c989295796\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createBaseSysRoleDepartmentTableSql = `CREATE TABLE \`base_sys_role_department\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`roleId\` int(11) NOT NULL COMMENT '角色ID',
  \`departmentId\` int(11) NOT NULL COMMENT '部门ID',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_e881a66f7cce83ba431cf20194\` (\`createTime\`),
  KEY \`IDX_cbf48031efee5d0de262965e53\` (\`updateTime\`),
  KEY \`IDX_055658b2de49d547635e06f160\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createBaseSysRoleMenuTableSql = `CREATE TABLE \`base_sys_role_menu\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`roleId\` int(11) NOT NULL COMMENT '角色ID',
  \`menuId\` int(11) NOT NULL COMMENT '菜单ID',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_3641f81d4201c524a57ce2aa54\` (\`createTime\`),
  KEY \`IDX_f860298298b26e7a697be36e5b\` (\`updateTime\`),
  KEY \`IDX_fd2d8bbe13949cfa56b1ed0a5d\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createBaseSysUserTableSql = `CREATE TABLE \`base_sys_user\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`departmentId\` int(11) DEFAULT NULL COMMENT '部门ID',
  \`userId\` int(11) DEFAULT NULL COMMENT '创建者ID',
  \`name\` varchar(255) DEFAULT NULL COMMENT '姓名',
  \`username\` varchar(100) NOT NULL COMMENT '用户名',
  \`password\` varchar(255) NOT NULL COMMENT '密码',
  \`passwordV\` int(11) NOT NULL DEFAULT 1 COMMENT '密码版本, 作用是改完密码，让原来的token失效',
  \`nickName\` varchar(255) DEFAULT NULL COMMENT '昵称',
  \`headImg\` varchar(255) DEFAULT NULL COMMENT '头像',
  \`phone\` varchar(20) DEFAULT NULL COMMENT '手机',
  \`email\` varchar(255) DEFAULT NULL COMMENT '邮箱',
  \`remark\` varchar(255) DEFAULT NULL COMMENT '备注',
  \`status\` int(11) NOT NULL DEFAULT 1 COMMENT '状态 0-禁用 1-启用',
  \`socketId\` varchar(255) DEFAULT NULL COMMENT 'socketId',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_469ad55973f5b98930f6ad627b\` (\`username\`),
  KEY \`IDX_ca8611d15a63d52aa4e292e46a\` (\`createTime\`),
  KEY \`IDX_a0f2f19cee18445998ece93ddd\` (\`updateTime\`),
  KEY \`IDX_94cb6e88070603ac6729d514fd\` (\`tenantId\`),
  KEY \`IDX_0cf944da378d70a94f5fefd803\` (\`departmentId\`),
  KEY \`IDX_40541b0502eb2422c73ae2aad1\` (\`userId\`),
  KEY \`IDX_9ec6d7ac6337eafb070e4881a8\` (\`phone\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createBaseSysUserRoleTableSql = `CREATE TABLE \`base_sys_user_role\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`userId\` int(11) NOT NULL COMMENT '用户ID',
  \`roleId\` int(11) NOT NULL COMMENT '角色ID',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_fa9555e03e42fce748c9046b1c\` (\`createTime\`),
  KEY \`IDX_3e36c0d2b1a4c659c6b4fc64b3\` (\`updateTime\`),
  KEY \`IDX_2f1dc0b6aad5604a2ddf37fba6\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createSpaceInfoTableSql = `CREATE TABLE \`space_info\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`url\` varchar(255) NOT NULL COMMENT '地址',
  \`type\` varchar(255) NOT NULL COMMENT '类型',
  \`classifyId\` int(11) DEFAULT NULL COMMENT '分类ID',
  \`fileId\` varchar(255) NOT NULL COMMENT '文件id',
  \`name\` varchar(255) NOT NULL COMMENT '文件名',
  \`size\` int(11) NOT NULL COMMENT '文件大小',
  \`version\` int(11) NOT NULL DEFAULT 1 COMMENT '文档版本',
  \`key\` varchar(255) NOT NULL COMMENT '文件位置',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_eb1da2f304c760846b5add09b3\` (\`createTime\`),
  KEY \`IDX_d7a2539961e9aacba8b353f3c9\` (\`updateTime\`),
  KEY \`IDX_6001c5ed2088b893c0d69bb244\` (\`tenantId\`),
  KEY \`IDX_0975633032bfe6574468b3a4ae\` (\`fileId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createSpaceTypeTableSql = `CREATE TABLE \`space_type\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`name\` varchar(255) NOT NULL COMMENT '类别名称',
  \`parentId\` int(11) DEFAULT NULL COMMENT '父分类ID',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_6669449501d275f367ca295472\` (\`createTime\`),
  KEY \`IDX_0749b509b68488caecd4cc2bbc\` (\`updateTime\`),
  KEY \`IDX_5e7f846b8cdabbceba95ed3314\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createQueryResultCacheTableSql = `CREATE TABLE \`query-result-cache\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`identifier\` varchar(255) DEFAULT NULL,
  \`time\` bigint(20) NOT NULL,
  \`duration\` int(11) NOT NULL,
  \`query\` text NOT NULL,
  \`result\` text NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createTableSqlList = [
  createBaseSysConfTableSql,
  createBaseSysDepartmentTableSql,
  createBaseSysLogTableSql,
  createBaseSysMenuTableSql,
  createBaseSysParamTableSql,
  createBaseSysRoleTableSql,
  createBaseSysRoleDepartmentTableSql,
  createBaseSysRoleMenuTableSql,
  createBaseSysUserTableSql,
  createBaseSysUserRoleTableSql,
  createSpaceInfoTableSql,
  createSpaceTypeTableSql,
  createQueryResultCacheTableSql,
];

const dropTableNames = [
  'query-result-cache',
  'space_type',
  'space_info',
  'base_sys_user_role',
  'base_sys_user',
  'base_sys_role_menu',
  'base_sys_role_department',
  'base_sys_role',
  'base_sys_param',
  'base_sys_menu',
  'base_sys_log',
  'base_sys_department',
  'base_sys_conf',
];

function normalizeCreateTableSql(sql) {
  return sql
    .replace(/^CREATE TABLE /, 'CREATE TABLE IF NOT EXISTS ')
    .replace(/\) ENGINE=InnoDB AUTO_INCREMENT=\d+ /, ') ENGINE=InnoDB ');
}

export async function up(connection) {
  for (const sql of createTableSqlList) {
    await connection.query(normalizeCreateTableSql(sql));
  }
}

export async function down(connection) {
  for (const tableName of dropTableNames) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
