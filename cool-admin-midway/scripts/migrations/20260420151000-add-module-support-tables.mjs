/**
 * Creates the formal schema baseline for non-performance business-support tables.
 * This migration only manages additive creation and rollback of legacy module tables outside base/performance that are already used by the current codebase.
 * Maintenance pitfall: keep this baseline aligned with entity contracts and let db.json remain a data seed source instead of a schema source.
 */

export const migrationId = '20260420151000';
export const migrationName = 'add-module-support-tables';

const createDemoGoodsTableSql = `CREATE TABLE \`demo_goods\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`title\` varchar(50) NOT NULL COMMENT '标题',
  \`price\` decimal(5,2) NOT NULL COMMENT '价格',
  \`description\` varchar(255) DEFAULT NULL COMMENT '描述',
  \`mainImage\` varchar(255) DEFAULT NULL COMMENT '主图',
  \`type\` int(11) NOT NULL COMMENT '分类',
  \`status\` int(11) NOT NULL DEFAULT 1 COMMENT '状态',
  \`stock\` int(11) NOT NULL DEFAULT 0 COMMENT '库存',
  \`exampleImages\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '示例图' CHECK (json_valid(\`exampleImages\`)),
  PRIMARY KEY (\`id\`),
  KEY \`IDX_5075bf301ed9c39b5ca534231c\` (\`createTime\`),
  KEY \`IDX_82703e0477d1219261277df718\` (\`updateTime\`),
  KEY \`IDX_4773d4d34db0d601516da30bf3\` (\`tenantId\`),
  KEY \`IDX_85a70ee36c7c1b0a04bfa1ed27\` (\`title\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createDictInfoTableSql = `CREATE TABLE \`dict_info\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`typeId\` int(11) NOT NULL COMMENT '类型ID',
  \`name\` varchar(255) NOT NULL COMMENT '名称',
  \`value\` varchar(255) DEFAULT NULL COMMENT '值',
  \`orderNum\` int(11) NOT NULL DEFAULT 0 COMMENT '排序',
  \`remark\` varchar(255) DEFAULT NULL COMMENT '备注',
  \`parentId\` int(11) DEFAULT NULL COMMENT '父ID',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_5c311a4af30de1181a5d7a7cc2\` (\`createTime\`),
  KEY \`IDX_10362a62adbf120821fff209d8\` (\`updateTime\`),
  KEY \`IDX_c26dc4b1ccb26e642191995edd\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createDictTypeTableSql = `CREATE TABLE \`dict_type\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`name\` varchar(255) NOT NULL COMMENT '名称',
  \`key\` varchar(255) NOT NULL COMMENT '标识',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_69734e5c2d29cc2139d5078f2c\` (\`createTime\`),
  KEY \`IDX_6cccb2e33846cd354e8dc0e0ef\` (\`updateTime\`),
  KEY \`IDX_7d4f3d2336e1afdda38278a07e\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createPluginInfoTableSql = `CREATE TABLE \`plugin_info\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`name\` varchar(255) NOT NULL COMMENT '名称',
  \`description\` varchar(255) NOT NULL COMMENT '简介',
  \`keyName\` varchar(255) NOT NULL COMMENT 'Key名',
  \`hook\` varchar(255) NOT NULL COMMENT 'Hook',
  \`readme\` text NOT NULL COMMENT '描述',
  \`version\` varchar(255) NOT NULL COMMENT '版本',
  \`logo\` text DEFAULT NULL COMMENT 'Logo(base64)',
  \`author\` varchar(255) NOT NULL COMMENT '作者',
  \`status\` int(11) NOT NULL DEFAULT 0 COMMENT '状态 0-禁用 1-启用',
  \`content\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '内容' CHECK (json_valid(\`content\`)),
  \`tsContent\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ts内容' CHECK (json_valid(\`tsContent\`)),
  \`pluginJson\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '插件的plugin.json' CHECK (json_valid(\`pluginJson\`)),
  \`config\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '配置' CHECK (json_valid(\`config\`)),
  PRIMARY KEY (\`id\`),
  KEY \`IDX_071da0804576df95363c24357c\` (\`createTime\`),
  KEY \`IDX_d94d7c2437aca9f1b183979b07\` (\`updateTime\`),
  KEY \`IDX_89a39daf328b50686755795546\` (\`tenantId\`),
  KEY \`IDX_95719662507de0fbf70ad1b5ee\` (\`keyName\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createRecycleDataTableSql = `CREATE TABLE \`recycle_data\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`entityInfo\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '表' CHECK (json_valid(\`entityInfo\`)),
  \`userId\` int(11) DEFAULT NULL COMMENT '操作人',
  \`data\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '被删除的数据' CHECK (json_valid(\`data\`)),
  \`url\` varchar(255) DEFAULT NULL COMMENT '请求的接口',
  \`count\` int(11) NOT NULL DEFAULT 1 COMMENT '删除数据条数',
  \`params\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '请求参数' CHECK (json_valid(\`params\`)),
  PRIMARY KEY (\`id\`),
  KEY \`IDX_59fc783673f4a322e9c83e0599\` (\`createTime\`),
  KEY \`IDX_c6a499c4a4fcd37f2930d27816\` (\`updateTime\`),
  KEY \`IDX_6659453338145e11d9b5103f38\` (\`tenantId\`),
  KEY \`IDX_f3ed09ba7090f3eb378cb83b5b\` (\`userId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createTaskInfoTableSql = `CREATE TABLE \`task_info\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`jobId\` varchar(255) DEFAULT NULL COMMENT '任务ID',
  \`repeatConf\` varchar(1000) DEFAULT NULL COMMENT '任务配置',
  \`name\` varchar(255) NOT NULL COMMENT '名称',
  \`cron\` varchar(255) DEFAULT NULL COMMENT 'cron',
  \`limit\` int(11) DEFAULT NULL COMMENT '最大执行次数 不传为无限次',
  \`every\` int(11) DEFAULT NULL COMMENT '每间隔多少毫秒执行一次 如果cron设置了 这项设置就无效',
  \`remark\` varchar(255) DEFAULT NULL COMMENT '备注',
  \`status\` int(11) NOT NULL DEFAULT 1 COMMENT '状态 0-停止 1-运行',
  \`startDate\` datetime DEFAULT NULL COMMENT '开始时间',
  \`endDate\` datetime DEFAULT NULL COMMENT '结束时间',
  \`data\` varchar(255) DEFAULT NULL COMMENT '数据',
  \`service\` varchar(255) DEFAULT NULL COMMENT '执行的service实例ID',
  \`type\` int(11) NOT NULL DEFAULT 0 COMMENT '状态 0-系统 1-用户',
  \`nextRunTime\` datetime DEFAULT NULL COMMENT '下一次执行时间',
  \`taskType\` int(11) NOT NULL DEFAULT 0 COMMENT '状态 0-cron 1-时间间隔',
  \`lastExecuteTime\` datetime DEFAULT NULL,
  \`lockExpireTime\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`IDX_6ced02f467e59bd6306b549bb0\` (\`createTime\`),
  KEY \`IDX_2adc6f9c241391126f27dac145\` (\`updateTime\`),
  KEY \`IDX_11b991dc4a7a5585c636008d3a\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createTaskLogTableSql = `CREATE TABLE \`task_log\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`taskId\` int(11) DEFAULT NULL COMMENT '任务ID',
  \`status\` int(11) NOT NULL DEFAULT 0 COMMENT '状态 0-失败 1-成功',
  \`detail\` text DEFAULT NULL COMMENT '详情描述',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_b9af0e100be034924b270aab31\` (\`createTime\`),
  KEY \`IDX_8857d8d43d38bebd7159af1fa6\` (\`updateTime\`),
  KEY \`IDX_fa4cb94036d961600c0f22ed91\` (\`tenantId\`),
  KEY \`IDX_1142dfec452e924b346f060fda\` (\`taskId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createUserAddressTableSql = `CREATE TABLE \`user_address\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`userId\` int(11) NOT NULL COMMENT '用户ID',
  \`contact\` varchar(255) NOT NULL COMMENT '联系人',
  \`phone\` varchar(11) NOT NULL COMMENT '手机号',
  \`province\` varchar(255) NOT NULL COMMENT '省',
  \`city\` varchar(255) NOT NULL COMMENT '市',
  \`district\` varchar(255) NOT NULL COMMENT '区',
  \`address\` varchar(255) NOT NULL COMMENT '地址',
  \`isDefault\` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否默认',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_144621f4f7bf21e72ed6972d85\` (\`createTime\`),
  KEY \`IDX_de647797f6286697bfe9527955\` (\`updateTime\`),
  KEY \`IDX_d93103979d4be73c3192163996\` (\`tenantId\`),
  KEY \`IDX_1abd8badc4a127b0f357d9ecbc\` (\`userId\`),
  KEY \`IDX_905be3a22a4dfda68da8e4200a\` (\`phone\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createUserInfoTableSql = `CREATE TABLE \`user_info\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`unionid\` varchar(255) DEFAULT NULL COMMENT '登录唯一ID',
  \`avatarUrl\` varchar(255) DEFAULT NULL COMMENT '头像',
  \`nickName\` varchar(255) DEFAULT NULL COMMENT '昵称',
  \`phone\` varchar(255) DEFAULT NULL COMMENT '手机号',
  \`gender\` int(11) NOT NULL DEFAULT 0 COMMENT '性别',
  \`status\` int(11) NOT NULL DEFAULT 1 COMMENT '状态',
  \`loginType\` int(11) NOT NULL DEFAULT 0 COMMENT '登录方式',
  \`password\` varchar(255) DEFAULT NULL COMMENT '密码',
  \`description\` text DEFAULT NULL COMMENT '介绍',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_6edeceee578056a2c1e493563a\` (\`unionid\`),
  UNIQUE KEY \`IDX_9234e7bac72991a93b172618e2\` (\`phone\`),
  KEY \`IDX_e6386e92c288d85dbc43ac53f7\` (\`createTime\`),
  KEY \`IDX_5271afbb87138d688b6220b589\` (\`updateTime\`),
  KEY \`IDX_7c8ea8d68808b77734df54ce32\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createUserWxTableSql = `CREATE TABLE \`user_wx\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`unionid\` varchar(255) DEFAULT NULL COMMENT '微信unionid',
  \`openid\` varchar(255) NOT NULL COMMENT '微信openid',
  \`avatarUrl\` varchar(255) DEFAULT NULL COMMENT '头像',
  \`nickName\` varchar(255) DEFAULT NULL COMMENT '昵称',
  \`gender\` int(11) NOT NULL DEFAULT 0 COMMENT '性别 0-未知 1-男 2-女',
  \`language\` varchar(255) DEFAULT NULL COMMENT '语言',
  \`city\` varchar(255) DEFAULT NULL COMMENT '城市',
  \`province\` varchar(255) DEFAULT NULL COMMENT '省份',
  \`country\` varchar(255) DEFAULT NULL COMMENT '国家',
  \`type\` int(11) NOT NULL DEFAULT 0 COMMENT '类型 0-小程序 1-公众号 2-H5 3-APP',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_e23b473abf5a6b00e44f3fd842\` (\`createTime\`),
  KEY \`IDX_049adb91204e94c1ede5e6dd23\` (\`updateTime\`),
  KEY \`IDX_f39f7e2dd63c906fcee61c50ad\` (\`tenantId\`),
  KEY \`IDX_d22b5fa040a01ec1b09e1e181e\` (\`unionid\`),
  KEY \`IDX_7946849febadd93cf81fc2b53f\` (\`openid\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

const createTableSqlList = [
  createDemoGoodsTableSql,
  createDictInfoTableSql,
  createDictTypeTableSql,
  createPluginInfoTableSql,
  createRecycleDataTableSql,
  createTaskInfoTableSql,
  createTaskLogTableSql,
  createUserAddressTableSql,
  createUserInfoTableSql,
  createUserWxTableSql,
];

const dropTableNames = [
  'user_wx',
  'user_info',
  'user_address',
  'task_log',
  'task_info',
  'recycle_data',
  'plugin_info',
  'dict_type',
  'dict_info',
  'demo_goods',
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
