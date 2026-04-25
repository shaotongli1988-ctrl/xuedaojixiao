/**
 * Creates the formal schema baseline for legacy performance mainline tables.
 * This migration only manages additive creation and rollback of the historical assessment/goal/pip/promotion/salary tables already used by the current codebase.
 * Maintenance pitfall: these tables intentionally mirror the current running schema so migration becomes the durable source of truth without changing business semantics.
 */

export const migrationId = '20260420132000';
export const migrationName = 'add-performance-core-mainline-tables';

const createAssessmentTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_assessment\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`code\` varchar(50) NOT NULL COMMENT '评估单编号',
  \`employeeId\` int(11) NOT NULL COMMENT '被考核人',
  \`assessorId\` int(11) NOT NULL COMMENT '评估负责人',
  \`departmentId\` int(11) NOT NULL COMMENT '所属部门',
  \`periodType\` varchar(20) NOT NULL DEFAULT 'quarter' COMMENT '周期类型',
  \`periodValue\` varchar(30) NOT NULL COMMENT '周期值',
  \`targetCompletion\` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT '目标完成率',
  \`totalScore\` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT '总分',
  \`grade\` varchar(10) DEFAULT NULL COMMENT '等级',
  \`selfEvaluation\` text DEFAULT NULL COMMENT '员工自评',
  \`managerFeedback\` text DEFAULT NULL COMMENT '经理反馈',
  \`submitTime\` varchar(19) DEFAULT NULL COMMENT '提交时间',
  \`approveTime\` varchar(19) DEFAULT NULL COMMENT '审批时间',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '状态',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`IDX_2d2e752cf556a0e531641ca78b\` (\`code\`),
  KEY \`IDX_693b3382901205373197181bd4\` (\`createTime\`),
  KEY \`IDX_a80294dcec8c96345c33642920\` (\`updateTime\`),
  KEY \`IDX_7f8140d4f5bdf2173c8b27f1cc\` (\`tenantId\`),
  KEY \`IDX_18d822d11aa8d76970e4fedd5a\` (\`employeeId\`),
  KEY \`IDX_9bf645e0a0d30b87e78fbe98d9\` (\`assessorId\`),
  KEY \`IDX_807de65419abd7b1bf4f26b359\` (\`departmentId\`),
  KEY \`IDX_8d333154f1460cce8f0edf7fb9\` (\`periodValue\`),
  KEY \`IDX_b5792a69469eacd4026f6a82ad\` (\`grade\`),
  KEY \`IDX_710d495ad40cf1d03bbef0c65b\` (\`submitTime\`),
  KEY \`IDX_cf2052ecf24d38e02a2586c22c\` (\`approveTime\`),
  KEY \`IDX_136371391a0897f9ca479ac733\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createAssessmentScoreTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_assessment_score\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`assessmentId\` int(11) NOT NULL COMMENT '关联评估单',
  \`indicatorId\` int(11) DEFAULT NULL COMMENT '关联指标',
  \`indicatorName\` varchar(100) NOT NULL COMMENT '指标名称快照',
  \`score\` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT '评分',
  \`weight\` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT '权重快照',
  \`comment\` varchar(500) DEFAULT NULL COMMENT '单项说明',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_a742954cde702111c78f5e3190\` (\`createTime\`),
  KEY \`IDX_242cadace88ec99822768b421d\` (\`updateTime\`),
  KEY \`IDX_019bf0e33063e224a742d72ebf\` (\`tenantId\`),
  KEY \`IDX_6f29ba50f70a873cde1f1e9183\` (\`assessmentId\`),
  KEY \`IDX_6af68a326425c60c34d618357c\` (\`indicatorId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createGoalTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_goal\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`employeeId\` int(11) NOT NULL COMMENT '目标所属员工',
  \`departmentId\` int(11) NOT NULL COMMENT '所属部门',
  \`title\` varchar(200) NOT NULL COMMENT '目标标题',
  \`description\` varchar(1000) DEFAULT NULL COMMENT '目标说明',
  \`targetValue\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '目标值',
  \`currentValue\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '当前值',
  \`unit\` varchar(20) DEFAULT NULL COMMENT '单位',
  \`weight\` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT '权重',
  \`startDate\` varchar(10) NOT NULL COMMENT '开始日期',
  \`endDate\` varchar(10) NOT NULL COMMENT '结束日期',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '状态',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_9f947dc6202f60be4394c47aa6\` (\`createTime\`),
  KEY \`IDX_0f827722147d7b7b29d6f477b7\` (\`updateTime\`),
  KEY \`IDX_49aeb4b49f3a2c4478d575f949\` (\`tenantId\`),
  KEY \`IDX_b6bc3b512ce2d5b7a9e1c45b6c\` (\`employeeId\`),
  KEY \`IDX_becebaa47550e0290ec21c0217\` (\`departmentId\`),
  KEY \`IDX_1baa6fd5baa03c20ffc7dd5a53\` (\`title\`),
  KEY \`IDX_9dac0eb377d30ecb77b60f0d1a\` (\`startDate\`),
  KEY \`IDX_2d9fbe7091790da0b8d3057c00\` (\`endDate\`),
  KEY \`IDX_93d1afaafc866efa0e990b8e8a\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createGoalProgressTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_goal_progress\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`goalId\` int(11) NOT NULL COMMENT '关联目标',
  \`beforeValue\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '更新前值',
  \`afterValue\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '更新后值',
  \`remark\` varchar(500) DEFAULT NULL COMMENT '更新说明',
  \`operatorId\` int(11) NOT NULL COMMENT '记录人',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_618925ef14c7629e9372287e17\` (\`createTime\`),
  KEY \`IDX_2c8be89671efc5c993f557e61c\` (\`updateTime\`),
  KEY \`IDX_83eb4a7db60d3b41d49382c87a\` (\`tenantId\`),
  KEY \`IDX_d2b498678eeac6c041e45afe05\` (\`goalId\`),
  KEY \`IDX_3e6b8da008b0e959435b5169d7\` (\`operatorId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createIndicatorTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_indicator\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`name\` varchar(100) NOT NULL COMMENT '指标名称',
  \`code\` varchar(50) NOT NULL COMMENT '指标编码',
  \`category\` varchar(30) NOT NULL DEFAULT 'assessment' COMMENT '指标类型',
  \`weight\` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT '权重',
  \`scoreScale\` int(11) NOT NULL DEFAULT 100 COMMENT '满分',
  \`applyScope\` varchar(50) NOT NULL DEFAULT 'all' COMMENT '适用范围',
  \`description\` varchar(500) DEFAULT NULL COMMENT '说明',
  \`status\` tinyint(4) NOT NULL DEFAULT 1 COMMENT '状态',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_indicator_code\` (\`code\`),
  KEY \`IDX_765ba6011fc7b6bb7404f93005\` (\`createTime\`),
  KEY \`IDX_95d30fd5f2d9022a6683aa8797\` (\`updateTime\`),
  KEY \`IDX_dd8aef6774bb44ae8e4322db1b\` (\`tenantId\`),
  KEY \`IDX_41ddfcc538e5878cd2b3052938\` (\`name\`),
  KEY \`IDX_d050c741e66f5c747ac75bd074\` (\`category\`),
  KEY \`IDX_bf89cc94e3973d7cd415dd1c52\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createPipTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_pip\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`assessmentId\` int(11) DEFAULT NULL COMMENT '来源评估单',
  \`employeeId\` int(11) NOT NULL COMMENT '员工 ID',
  \`ownerId\` int(11) NOT NULL COMMENT '负责人 ID',
  \`title\` varchar(200) NOT NULL COMMENT 'PIP 标题',
  \`improvementGoal\` text NOT NULL COMMENT '改进目标',
  \`sourceReason\` text DEFAULT NULL COMMENT '来源原因',
  \`startDate\` varchar(10) NOT NULL COMMENT '开始日期',
  \`endDate\` varchar(10) NOT NULL COMMENT '结束日期',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '状态',
  \`resultSummary\` text DEFAULT NULL COMMENT '结果总结',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_9d02fc71913a514fd9d84750c6\` (\`createTime\`),
  KEY \`IDX_7e0eb67c8d5e3d2030b0614938\` (\`updateTime\`),
  KEY \`IDX_30485567718f2b7a16d20783b8\` (\`tenantId\`),
  KEY \`IDX_996a23c4fb01f2705f2bb621e4\` (\`assessmentId\`),
  KEY \`IDX_2d08adbe77b27fd6a79ad2a9e3\` (\`employeeId\`),
  KEY \`IDX_63d5a596727a53d2d60f0627be\` (\`ownerId\`),
  KEY \`IDX_307ceb84ad148870db235f2c24\` (\`title\`),
  KEY \`IDX_33c6c96ab67ad5d21d1e653fe0\` (\`startDate\`),
  KEY \`IDX_086e231edcee2c6758583fd7de\` (\`endDate\`),
  KEY \`IDX_8684e1b3581f788cfd06fa16be\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createPipRecordTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_pip_record\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`pipId\` int(11) NOT NULL COMMENT '关联 PIP ID',
  \`recordDate\` varchar(10) NOT NULL COMMENT '跟进日期',
  \`progress\` text NOT NULL COMMENT '跟进内容',
  \`nextPlan\` text DEFAULT NULL COMMENT '下一步计划',
  \`operatorId\` int(11) NOT NULL COMMENT '记录人 ID',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_6e04f73dede6818364dacf5204\` (\`createTime\`),
  KEY \`IDX_50c496d971632678df7dc14db7\` (\`updateTime\`),
  KEY \`IDX_31871efc4f9e3fabbbe9dd310b\` (\`tenantId\`),
  KEY \`IDX_8d6b32499271d122f02c72a292\` (\`pipId\`),
  KEY \`IDX_4f0db8edc7e3a587aacc113c8c\` (\`recordDate\`),
  KEY \`IDX_ee538e2e822ab95ecd0bc92cf7\` (\`operatorId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createPromotionTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_promotion\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`assessmentId\` int(11) DEFAULT NULL COMMENT '来源评估单',
  \`employeeId\` int(11) NOT NULL COMMENT '员工',
  \`sponsorId\` int(11) NOT NULL COMMENT '发起人',
  \`fromPosition\` varchar(100) NOT NULL COMMENT '当前岗位',
  \`toPosition\` varchar(100) NOT NULL COMMENT '目标岗位',
  \`reason\` text DEFAULT NULL COMMENT '发起原因',
  \`sourceReason\` varchar(500) DEFAULT NULL COMMENT '独立创建原因',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '状态',
  \`reviewTime\` varchar(19) DEFAULT NULL COMMENT '评审时间',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_c2061cf73a7516509cefec90f6\` (\`createTime\`),
  KEY \`IDX_fc2b99a89b2227ee774531f758\` (\`updateTime\`),
  KEY \`IDX_2d2d2fb4bf1908d28cd431a4c8\` (\`tenantId\`),
  KEY \`IDX_705f28ee93b9792d67e130f0a0\` (\`assessmentId\`),
  KEY \`IDX_04f0627eeeb1b10d32532edc39\` (\`employeeId\`),
  KEY \`IDX_0c0c8b0e4588567b8b2b03d01a\` (\`sponsorId\`),
  KEY \`IDX_8f1fcdc3ca4718b1a03757db43\` (\`status\`),
  KEY \`IDX_edcbc82ee61b5c3a699bf9c793\` (\`reviewTime\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createPromotionRecordTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_promotion_record\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`promotionId\` int(11) NOT NULL COMMENT '关联晋升单',
  \`reviewerId\` int(11) NOT NULL COMMENT '评审人',
  \`decision\` varchar(20) NOT NULL COMMENT '评审结论',
  \`comment\` text DEFAULT NULL COMMENT '评审意见',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_dcdb389d0b97b59a98dbda44b1\` (\`createTime\`),
  KEY \`IDX_ffd4a4930f4ab6901c9d6aa1bf\` (\`updateTime\`),
  KEY \`IDX_bf04ef863957a68be6cafee0f6\` (\`tenantId\`),
  KEY \`IDX_d775ee5ff48985f1989c671b0e\` (\`promotionId\`),
  KEY \`IDX_49a44404d15c7cb8135c9afb3d\` (\`reviewerId\`),
  KEY \`IDX_9ffd08dbd571a0b484fd7c73dc\` (\`decision\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createSalaryTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_salary\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`employeeId\` int(11) NOT NULL COMMENT '员工 ID',
  \`assessmentId\` int(11) DEFAULT NULL COMMENT '关联评估单 ID',
  \`periodValue\` varchar(30) NOT NULL COMMENT '期间',
  \`baseSalary\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '基础薪资',
  \`performanceBonus\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '绩效奖金',
  \`adjustAmount\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '调整金额',
  \`finalAmount\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '最终金额',
  \`grade\` varchar(10) DEFAULT NULL COMMENT '绩效等级快照',
  \`effectiveDate\` varchar(10) DEFAULT NULL COMMENT '生效日期',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '状态',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_90eeab6b901d552d28f6afcf8e\` (\`createTime\`),
  KEY \`IDX_bb2bb8b0c569ac6bff293f43ff\` (\`updateTime\`),
  KEY \`IDX_4234d525e34546d190d294bae6\` (\`tenantId\`),
  KEY \`IDX_2433c3829d8f4ff60b9a681aee\` (\`employeeId\`),
  KEY \`IDX_236edecdee43176b37963d665a\` (\`assessmentId\`),
  KEY \`IDX_8597114c7bf3e56977e954badb\` (\`periodValue\`),
  KEY \`IDX_38d9a34432706b46c39b1f5957\` (\`grade\`),
  KEY \`IDX_c89b25bc768da5217dc59935b1\` (\`effectiveDate\`),
  KEY \`IDX_c2c34a656cd8404eb632aa88ad\` (\`status\`),
  KEY \`idx_salary_employee_period\` (\`employeeId\`,\`periodValue\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createSalaryChangeTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_salary_change\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`salaryId\` int(11) NOT NULL COMMENT '关联薪资记录',
  \`beforeAmount\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '调整前最终金额',
  \`afterAmount\` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '调整后最终金额',
  \`changeReason\` varchar(500) DEFAULT NULL COMMENT '调整原因',
  \`operatorId\` int(11) NOT NULL COMMENT '操作人 ID',
  PRIMARY KEY (\`id\`),
  KEY \`IDX_5810e4fd0548a26d2e47086dac\` (\`createTime\`),
  KEY \`IDX_7eb943f0f5c59ff7021de214af\` (\`updateTime\`),
  KEY \`IDX_fb0441a0a9bb386bc78b356b2c\` (\`tenantId\`),
  KEY \`IDX_ac3e9cfd9821adbeb31272e0bd\` (\`salaryId\`),
  KEY \`IDX_7ed1d768be136227daf3aeba83\` (\`operatorId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

export const managedTables = [
  'performance_assessment',
  'performance_assessment_score',
  'performance_goal',
  'performance_goal_progress',
  'performance_indicator',
  'performance_pip',
  'performance_pip_record',
  'performance_promotion',
  'performance_promotion_record',
  'performance_salary',
  'performance_salary_change',
];

export async function up(connection) {
  await connection.query(createAssessmentTableSql);
  await connection.query(createAssessmentScoreTableSql);
  await connection.query(createGoalTableSql);
  await connection.query(createGoalProgressTableSql);
  await connection.query(createIndicatorTableSql);
  await connection.query(createPipTableSql);
  await connection.query(createPipRecordTableSql);
  await connection.query(createPromotionTableSql);
  await connection.query(createPromotionRecordTableSql);
  await connection.query(createSalaryTableSql);
  await connection.query(createSalaryChangeTableSql);
}

export async function down(connection) {
  for (const tableName of [...managedTables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
