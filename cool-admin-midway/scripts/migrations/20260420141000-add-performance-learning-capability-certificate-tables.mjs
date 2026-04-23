/**
 * Creates the formal schema baseline for learning, capability, and certificate tables.
 * This migration only manages additive creation and rollback of the current performance entities for course, capability, and certificate domains.
 * Maintenance pitfall: keep every column type, nullable rule, default value, and index aligned with BaseEntity and the current TypeORM entity definitions before editing.
 */

export const migrationId = '20260420141000';
export const migrationName =
  'add-performance-learning-capability-certificate-tables';

const createCourseTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_course\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`title\` varchar(200) NOT NULL COMMENT '课程标题',
  \`code\` varchar(100) DEFAULT NULL COMMENT '课程编码',
  \`category\` varchar(100) DEFAULT NULL COMMENT '课程分类',
  \`description\` text DEFAULT NULL COMMENT '课程描述',
  \`startDate\` varchar(10) DEFAULT NULL COMMENT '开始日期',
  \`endDate\` varchar(10) DEFAULT NULL COMMENT '结束日期',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '课程状态',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_course_code\` (\`code\`),
  KEY \`idx_performance_course_create_time\` (\`createTime\`),
  KEY \`idx_performance_course_update_time\` (\`updateTime\`),
  KEY \`idx_performance_course_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_course_title\` (\`title\`),
  KEY \`idx_performance_course_category\` (\`category\`),
  KEY \`idx_performance_course_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='培训课程主表';
`;

const createCourseEnrollmentTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_course_enrollment\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`courseId\` int(11) NOT NULL COMMENT '课程 ID',
  \`userId\` int(11) NOT NULL COMMENT '学员 ID',
  \`enrollTime\` varchar(19) DEFAULT NULL COMMENT '报名时间',
  \`status\` varchar(50) DEFAULT NULL COMMENT '报名状态摘要',
  \`score\` decimal(8,2) DEFAULT NULL COMMENT '成绩摘要',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_course_enrollment_course_user\` (\`courseId\`, \`userId\`),
  KEY \`idx_performance_course_enrollment_create_time\` (\`createTime\`),
  KEY \`idx_performance_course_enrollment_update_time\` (\`updateTime\`),
  KEY \`idx_performance_course_enrollment_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_course_enrollment_course_id\` (\`courseId\`),
  KEY \`idx_performance_course_enrollment_user_id\` (\`userId\`),
  KEY \`idx_performance_course_enrollment_enroll_time\` (\`enrollTime\`),
  KEY \`idx_performance_course_enrollment_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='课程报名摘要表';
`;

const createCourseReciteTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_course_recite\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`courseId\` int(11) NOT NULL COMMENT '课程 ID',
  \`employeeId\` int(11) NOT NULL COMMENT '员工 ID',
  \`courseTitle\` varchar(200) DEFAULT NULL COMMENT '课程标题快照',
  \`title\` varchar(200) NOT NULL COMMENT '任务标题',
  \`promptText\` text DEFAULT NULL COMMENT '任务内容摘要',
  \`submissionText\` text DEFAULT NULL COMMENT '员工文本提交内容',
  \`status\` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '任务状态',
  \`latestScore\` decimal(8,2) DEFAULT NULL COMMENT '最近一次结果分数摘要',
  \`feedbackSummary\` text DEFAULT NULL COMMENT '结果摘要',
  \`submittedAt\` varchar(19) DEFAULT NULL COMMENT '最近一次提交时间',
  \`evaluatedAt\` varchar(19) DEFAULT NULL COMMENT '最近一次评估时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_course_recite_create_time\` (\`createTime\`),
  KEY \`idx_performance_course_recite_update_time\` (\`updateTime\`),
  KEY \`idx_performance_course_recite_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_course_recite_course_id\` (\`courseId\`),
  KEY \`idx_performance_course_recite_employee_id\` (\`employeeId\`),
  KEY \`idx_performance_course_recite_course_user\` (\`courseId\`, \`employeeId\`),
  KEY \`idx_performance_course_recite_status\` (\`status\`),
  KEY \`idx_performance_course_recite_submitted_at\` (\`submittedAt\`),
  KEY \`idx_performance_course_recite_evaluated_at\` (\`evaluatedAt\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='课程背诵任务表';
`;

const createCoursePracticeTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_course_practice\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`courseId\` int(11) NOT NULL COMMENT '课程 ID',
  \`employeeId\` int(11) NOT NULL COMMENT '员工 ID',
  \`courseTitle\` varchar(200) DEFAULT NULL COMMENT '课程标题快照',
  \`title\` varchar(200) NOT NULL COMMENT '任务标题',
  \`promptText\` text DEFAULT NULL COMMENT '任务内容摘要',
  \`submissionText\` text DEFAULT NULL COMMENT '员工文本提交内容',
  \`status\` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '任务状态',
  \`latestScore\` decimal(8,2) DEFAULT NULL COMMENT '最近一次结果分数摘要',
  \`feedbackSummary\` text DEFAULT NULL COMMENT '结果摘要',
  \`submittedAt\` varchar(19) DEFAULT NULL COMMENT '最近一次提交时间',
  \`evaluatedAt\` varchar(19) DEFAULT NULL COMMENT '最近一次评估时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_course_practice_create_time\` (\`createTime\`),
  KEY \`idx_performance_course_practice_update_time\` (\`updateTime\`),
  KEY \`idx_performance_course_practice_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_course_practice_course_id\` (\`courseId\`),
  KEY \`idx_performance_course_practice_employee_id\` (\`employeeId\`),
  KEY \`idx_performance_course_practice_course_user\` (\`courseId\`, \`employeeId\`),
  KEY \`idx_performance_course_practice_status\` (\`status\`),
  KEY \`idx_performance_course_practice_submitted_at\` (\`submittedAt\`),
  KEY \`idx_performance_course_practice_evaluated_at\` (\`evaluatedAt\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='课程练习任务表';
`;

const createCourseExamTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_course_exam\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`courseId\` int(11) NOT NULL COMMENT '课程 ID',
  \`employeeId\` int(11) NOT NULL COMMENT '员工 ID',
  \`courseTitle\` varchar(200) NOT NULL COMMENT '课程标题快照',
  \`resultStatus\` varchar(20) NOT NULL DEFAULT 'locked' COMMENT '结果状态',
  \`latestScore\` decimal(8,2) DEFAULT NULL COMMENT '最近一次结果分数摘要',
  \`passThreshold\` decimal(8,2) DEFAULT NULL COMMENT '通过阈值摘要',
  \`summaryText\` text DEFAULT NULL COMMENT '结果摘要文案',
  \`updatedAt\` varchar(19) DEFAULT NULL COMMENT '最近更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_course_exam_scope\` (\`courseId\`, \`employeeId\`),
  KEY \`idx_performance_course_exam_create_time\` (\`createTime\`),
  KEY \`idx_performance_course_exam_update_time\` (\`updateTime\`),
  KEY \`idx_performance_course_exam_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_course_exam_course_id\` (\`courseId\`),
  KEY \`idx_performance_course_exam_employee_id\` (\`employeeId\`),
  KEY \`idx_performance_course_exam_result_status\` (\`resultStatus\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='课程考试结果摘要表';
`;

const createCapabilityModelTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_capability_model\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`name\` varchar(200) NOT NULL COMMENT '模型名称',
  \`code\` varchar(100) DEFAULT NULL COMMENT '模型编码',
  \`category\` varchar(100) DEFAULT NULL COMMENT '模型分类',
  \`description\` text DEFAULT NULL COMMENT '模型说明',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '模型状态',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_capability_model_code\` (\`code\`),
  KEY \`idx_performance_capability_model_create_time\` (\`createTime\`),
  KEY \`idx_performance_capability_model_update_time\` (\`updateTime\`),
  KEY \`idx_performance_capability_model_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_capability_model_name\` (\`name\`),
  KEY \`idx_performance_capability_model_category\` (\`category\`),
  KEY \`idx_performance_capability_model_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='能力模型主表';
`;

const createCapabilityItemTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_capability_item\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`modelId\` int(11) NOT NULL COMMENT '能力模型 ID',
  \`name\` varchar(200) NOT NULL COMMENT '能力项名称',
  \`level\` varchar(50) DEFAULT NULL COMMENT '能力等级摘要',
  \`description\` text DEFAULT NULL COMMENT '能力项说明',
  \`evidenceHint\` text DEFAULT NULL COMMENT '佐证提示摘要',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_capability_item_create_time\` (\`createTime\`),
  KEY \`idx_performance_capability_item_update_time\` (\`updateTime\`),
  KEY \`idx_performance_capability_item_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_capability_item_model_id\` (\`modelId\`),
  KEY \`idx_performance_capability_item_name\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='能力项主表';
`;

const createCapabilityPortraitTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_capability_portrait\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`employeeId\` int(11) NOT NULL COMMENT '员工 ID',
  \`departmentId\` int(11) DEFAULT NULL COMMENT '部门 ID',
  \`capabilityTags\` json DEFAULT NULL COMMENT '能力标签摘要',
  \`levelSummary\` json DEFAULT NULL COMMENT '等级摘要',
  \`updatedAt\` varchar(19) NOT NULL COMMENT '摘要更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_capability_portrait_employee\` (\`employeeId\`),
  KEY \`idx_performance_capability_portrait_create_time\` (\`createTime\`),
  KEY \`idx_performance_capability_portrait_update_time\` (\`updateTime\`),
  KEY \`idx_performance_capability_portrait_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_capability_portrait_department_id\` (\`departmentId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='能力画像摘要表';
`;

const createCertificateTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_certificate\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`name\` varchar(200) NOT NULL COMMENT '证书名称',
  \`code\` varchar(100) DEFAULT NULL COMMENT '证书编码',
  \`category\` varchar(100) DEFAULT NULL COMMENT '证书分类',
  \`issuer\` varchar(200) DEFAULT NULL COMMENT '发证机构摘要',
  \`description\` text DEFAULT NULL COMMENT '证书说明',
  \`validityMonths\` int(11) DEFAULT NULL COMMENT '有效月数',
  \`sourceCourseId\` int(11) DEFAULT NULL COMMENT '来源课程 ID',
  \`status\` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '证书状态',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_certificate_code\` (\`code\`),
  KEY \`idx_performance_certificate_create_time\` (\`createTime\`),
  KEY \`idx_performance_certificate_update_time\` (\`updateTime\`),
  KEY \`idx_performance_certificate_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_certificate_name\` (\`name\`),
  KEY \`idx_performance_certificate_category\` (\`category\`),
  KEY \`idx_performance_certificate_source_course_id\` (\`sourceCourseId\`),
  KEY \`idx_performance_certificate_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='证书台账主表';
`;

const createCertificateRecordTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_certificate_record\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`certificateId\` int(11) NOT NULL COMMENT '证书 ID',
  \`employeeId\` int(11) NOT NULL COMMENT '员工 ID',
  \`departmentId\` int(11) DEFAULT NULL COMMENT '部门 ID',
  \`sourceCourseId\` int(11) DEFAULT NULL COMMENT '来源课程 ID',
  \`issuedAt\` varchar(19) NOT NULL COMMENT '发放时间',
  \`issuedById\` int(11) NOT NULL COMMENT '发放人 ID',
  \`issuedBy\` varchar(100) NOT NULL COMMENT '发放人姓名摘要',
  \`remark\` text DEFAULT NULL COMMENT '发放备注摘要',
  \`status\` varchar(20) NOT NULL DEFAULT 'issued' COMMENT '记录状态',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_certificate_record_create_time\` (\`createTime\`),
  KEY \`idx_performance_certificate_record_update_time\` (\`updateTime\`),
  KEY \`idx_performance_certificate_record_tenant_id\` (\`tenantId\`),
  KEY \`idx_performance_certificate_record_certificate_id\` (\`certificateId\`),
  KEY \`idx_performance_certificate_record_employee_id\` (\`employeeId\`),
  KEY \`idx_performance_certificate_record_department_id\` (\`departmentId\`),
  KEY \`idx_performance_certificate_record_source_course_id\` (\`sourceCourseId\`),
  KEY \`idx_performance_certificate_record_issued_at\` (\`issuedAt\`),
  KEY \`idx_performance_certificate_record_issued_by_id\` (\`issuedById\`),
  KEY \`idx_performance_certificate_record_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='证书发放记录表';
`;

export const managedTables = [
  'performance_course',
  'performance_course_enrollment',
  'performance_course_recite',
  'performance_course_practice',
  'performance_course_exam',
  'performance_capability_model',
  'performance_capability_item',
  'performance_capability_portrait',
  'performance_certificate',
  'performance_certificate_record',
];

export async function up(connection) {
  await connection.query(createCourseTableSql);
  await connection.query(createCourseEnrollmentTableSql);
  await connection.query(createCourseReciteTableSql);
  await connection.query(createCoursePracticeTableSql);
  await connection.query(createCourseExamTableSql);
  await connection.query(createCapabilityModelTableSql);
  await connection.query(createCapabilityItemTableSql);
  await connection.query(createCapabilityPortraitTableSql);
  await connection.query(createCertificateTableSql);
  await connection.query(createCertificateRecordTableSql);
}

export async function down(connection) {
  for (const tableName of [...managedTables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
