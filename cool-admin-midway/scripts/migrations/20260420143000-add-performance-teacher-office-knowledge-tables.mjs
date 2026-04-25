/**
 * Creates the formal schema baseline for teacher channel, office collab, and knowledge tables.
 * This migration only manages additive creation and rollback of the current performance tables in this domain group.
 * Maintenance pitfall: keep every column, index, and default aligned with BaseEntity and the current performance entity contract before changing this baseline.
 */

export const migrationId = '20260420143000';
export const migrationName = 'add-performance-teacher-office-knowledge-tables';

const createOfficeCollabTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_office_collab\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`moduleKey\` varchar(64) NOT NULL COMMENT '模块键',
  \`recordNo\` varchar(64) NOT NULL COMMENT '记录编号',
  \`title\` varchar(200) NOT NULL COMMENT '标题',
  \`status\` varchar(32) NOT NULL DEFAULT 'draft' COMMENT '状态',
  \`department\` varchar(100) DEFAULT NULL COMMENT '所属部门',
  \`ownerName\` varchar(100) DEFAULT NULL COMMENT '负责人/发起人',
  \`assigneeName\` varchar(100) DEFAULT NULL COMMENT '协作人/接收人',
  \`category\` varchar(64) DEFAULT NULL COMMENT '主分类',
  \`priority\` varchar(32) DEFAULT NULL COMMENT '优先级',
  \`version\` varchar(32) DEFAULT NULL COMMENT '版本号',
  \`dueDate\` varchar(19) DEFAULT NULL COMMENT '截止日期',
  \`eventDate\` varchar(19) DEFAULT NULL COMMENT '事件日期/最近事件时间',
  \`progressValue\` int(11) NOT NULL DEFAULT 0 COMMENT '进度/完整度',
  \`scoreValue\` int(11) NOT NULL DEFAULT 0 COMMENT '评分/浏览量',
  \`relatedDocumentId\` int(11) DEFAULT NULL COMMENT '关联文件ID',
  \`extJson\` text DEFAULT NULL COMMENT '扩展 JSON',
  \`notes\` text DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uq_performance_office_collab_module_record\` (\`moduleKey\`,\`recordNo\`),
  KEY \`idx_performance_office_collab_createTime\` (\`createTime\`),
  KEY \`idx_performance_office_collab_updateTime\` (\`updateTime\`),
  KEY \`idx_performance_office_collab_tenantId\` (\`tenantId\`),
  KEY \`idx_performance_office_collab_moduleKey\` (\`moduleKey\`),
  KEY \`idx_performance_office_collab_title\` (\`title\`),
  KEY \`idx_performance_office_collab_status\` (\`status\`),
  KEY \`idx_performance_office_collab_relatedDocumentId\` (\`relatedDocumentId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='行政协同主题22共享元数据主表';
`;

const createTeacherInfoTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_teacher_info\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`teacherName\` varchar(100) NOT NULL,
  \`phone\` varchar(20) DEFAULT NULL,
  \`wechat\` varchar(50) DEFAULT NULL,
  \`schoolName\` varchar(100) DEFAULT NULL,
  \`schoolRegion\` varchar(100) DEFAULT NULL,
  \`schoolType\` varchar(100) DEFAULT NULL,
  \`grade\` varchar(50) DEFAULT NULL,
  \`className\` varchar(100) DEFAULT NULL,
  \`subject\` varchar(50) DEFAULT NULL,
  \`projectTags\` json DEFAULT NULL,
  \`intentionLevel\` varchar(30) DEFAULT NULL,
  \`communicationStyle\` varchar(50) DEFAULT NULL,
  \`cooperationStatus\` varchar(20) NOT NULL DEFAULT 'uncontacted',
  \`ownerEmployeeId\` int(11) NOT NULL,
  \`ownerDepartmentId\` int(11) NOT NULL,
  \`lastFollowTime\` varchar(19) DEFAULT NULL,
  \`nextFollowTime\` varchar(19) DEFAULT NULL,
  \`cooperationTime\` varchar(19) DEFAULT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_teacher_info_teacher_name\` (\`teacherName\`),
  KEY \`idx_performance_teacher_info_school_name\` (\`schoolName\`),
  KEY \`idx_performance_teacher_info_cooperation_status\` (\`cooperationStatus\`),
  KEY \`idx_performance_teacher_info_owner_employee_id\` (\`ownerEmployeeId\`),
  KEY \`idx_performance_teacher_info_owner_department_id\` (\`ownerDepartmentId\`),
  KEY \`idx_performance_teacher_info_last_follow_time\` (\`lastFollowTime\`),
  KEY \`idx_performance_teacher_info_next_follow_time\` (\`nextFollowTime\`),
  KEY \`idx_performance_teacher_info_cooperation_time\` (\`cooperationTime\`),
  KEY \`idx_performance_teacher_info_create_time\` (\`createTime\`),
  KEY \`idx_performance_teacher_info_update_time\` (\`updateTime\`),
  KEY \`idx_performance_teacher_info_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createTeacherFollowTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_teacher_follow\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`teacherId\` int(11) NOT NULL,
  \`followTime\` varchar(19) NOT NULL,
  \`nextFollowTime\` varchar(19) DEFAULT NULL,
  \`followMethod\` varchar(50) DEFAULT NULL,
  \`followContent\` text NOT NULL,
  \`creatorEmployeeId\` int(11) NOT NULL,
  \`creatorEmployeeName\` varchar(100) NOT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_teacher_follow_teacher_id\` (\`teacherId\`),
  KEY \`idx_performance_teacher_follow_follow_time\` (\`followTime\`),
  KEY \`idx_performance_teacher_follow_next_follow_time\` (\`nextFollowTime\`),
  KEY \`idx_performance_teacher_follow_creator_employee_id\` (\`creatorEmployeeId\`),
  KEY \`idx_performance_teacher_follow_create_time\` (\`createTime\`),
  KEY \`idx_performance_teacher_follow_update_time\` (\`updateTime\`),
  KEY \`idx_performance_teacher_follow_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createTeacherClassTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_teacher_class\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`teacherId\` int(11) NOT NULL,
  \`teacherName\` varchar(100) NOT NULL,
  \`className\` varchar(100) NOT NULL,
  \`schoolName\` varchar(100) DEFAULT NULL,
  \`grade\` varchar(50) DEFAULT NULL,
  \`projectTag\` varchar(50) DEFAULT NULL,
  \`studentCount\` int(11) NOT NULL DEFAULT 0,
  \`status\` varchar(20) NOT NULL DEFAULT 'draft',
  \`ownerEmployeeId\` int(11) NOT NULL,
  \`ownerDepartmentId\` int(11) NOT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_teacher_class_teacher_id\` (\`teacherId\`),
  KEY \`idx_performance_teacher_class_status\` (\`status\`),
  KEY \`idx_performance_teacher_class_owner_employee_id\` (\`ownerEmployeeId\`),
  KEY \`idx_performance_teacher_class_owner_department_id\` (\`ownerDepartmentId\`),
  KEY \`idx_performance_teacher_class_create_time\` (\`createTime\`),
  KEY \`idx_performance_teacher_class_update_time\` (\`updateTime\`),
  KEY \`idx_performance_teacher_class_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createTeacherAgentTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_teacher_agent\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`agentType\` varchar(20) NOT NULL,
  \`level\` varchar(30) DEFAULT NULL,
  \`region\` varchar(50) DEFAULT NULL,
  \`cooperationStatus\` varchar(30) DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'active',
  \`blacklistStatus\` varchar(20) NOT NULL DEFAULT 'normal',
  \`remark\` text DEFAULT NULL,
  \`ownerEmployeeId\` int(11) NOT NULL,
  \`ownerDepartmentId\` int(11) NOT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_teacher_agent_name\` (\`name\`),
  KEY \`idx_performance_teacher_agent_agent_type\` (\`agentType\`),
  KEY \`idx_performance_teacher_agent_status\` (\`status\`),
  KEY \`idx_performance_teacher_agent_blacklist_status\` (\`blacklistStatus\`),
  KEY \`idx_performance_teacher_agent_owner_employee_id\` (\`ownerEmployeeId\`),
  KEY \`idx_performance_teacher_agent_owner_department_id\` (\`ownerDepartmentId\`),
  KEY \`idx_performance_teacher_agent_create_time\` (\`createTime\`),
  KEY \`idx_performance_teacher_agent_update_time\` (\`updateTime\`),
  KEY \`idx_performance_teacher_agent_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createTeacherAgentRelationTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_teacher_agent_relation\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`parentAgentId\` int(11) NOT NULL,
  \`childAgentId\` int(11) NOT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'active',
  \`effectiveTime\` varchar(19) DEFAULT NULL,
  \`remark\` text DEFAULT NULL,
  \`ownerEmployeeId\` int(11) NOT NULL,
  \`ownerDepartmentId\` int(11) NOT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_teacher_agent_relation_parent_agent_id\` (\`parentAgentId\`),
  KEY \`idx_performance_teacher_agent_relation_child_agent_id\` (\`childAgentId\`),
  KEY \`idx_performance_teacher_agent_relation_status\` (\`status\`),
  KEY \`idx_performance_teacher_agent_relation_owner_employee_id\` (\`ownerEmployeeId\`),
  KEY \`idx_performance_teacher_agent_relation_owner_department_id\` (\`ownerDepartmentId\`),
  KEY \`idx_performance_teacher_agent_relation_create_time\` (\`createTime\`),
  KEY \`idx_performance_teacher_agent_relation_update_time\` (\`updateTime\`),
  KEY \`idx_performance_teacher_agent_relation_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createTeacherAttributionTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_teacher_attribution\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`teacherId\` int(11) NOT NULL,
  \`agentId\` int(11) DEFAULT NULL,
  \`attributionType\` varchar(20) NOT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'active',
  \`sourceType\` varchar(30) DEFAULT NULL,
  \`sourceRemark\` text DEFAULT NULL,
  \`effectiveTime\` varchar(19) DEFAULT NULL,
  \`operatorId\` int(11) DEFAULT NULL,
  \`operatorName\` varchar(100) DEFAULT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_teacher_attribution_teacher_id\` (\`teacherId\`),
  KEY \`idx_performance_teacher_attribution_agent_id\` (\`agentId\`),
  KEY \`idx_performance_teacher_attribution_status\` (\`status\`),
  KEY \`idx_performance_teacher_attribution_effective_time\` (\`effectiveTime\`),
  KEY \`idx_performance_teacher_attribution_operator_id\` (\`operatorId\`),
  KEY \`idx_performance_teacher_attribution_create_time\` (\`createTime\`),
  KEY \`idx_performance_teacher_attribution_update_time\` (\`updateTime\`),
  KEY \`idx_performance_teacher_attribution_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createTeacherAttributionConflictTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_teacher_attribution_conflict\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`teacherId\` int(11) NOT NULL,
  \`candidateAgentIds\` json DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'open',
  \`resolution\` varchar(30) DEFAULT NULL,
  \`resolutionRemark\` text DEFAULT NULL,
  \`resolvedBy\` int(11) DEFAULT NULL,
  \`resolvedTime\` varchar(19) DEFAULT NULL,
  \`currentAgentId\` int(11) DEFAULT NULL,
  \`requestedAgentId\` int(11) DEFAULT NULL,
  \`requestedById\` int(11) DEFAULT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_teacher_attribution_conflict_teacher_id\` (\`teacherId\`),
  KEY \`idx_performance_teacher_attribution_conflict_status\` (\`status\`),
  KEY \`idx_performance_teacher_attribution_conflict_resolved_by\` (\`resolvedBy\`),
  KEY \`idx_performance_teacher_attribution_conflict_resolved_time\` (\`resolvedTime\`),
  KEY \`idx_performance_teacher_attribution_conflict_current_agent_id\` (\`currentAgentId\`),
  KEY \`idx_performance_teacher_attribution_conflict_requested_agent_id\` (\`requestedAgentId\`),
  KEY \`idx_performance_teacher_attribution_conflict_requested_by_id\` (\`requestedById\`),
  KEY \`idx_performance_teacher_attribution_conflict_create_time\` (\`createTime\`),
  KEY \`idx_performance_teacher_attribution_conflict_update_time\` (\`updateTime\`),
  KEY \`idx_performance_teacher_attribution_conflict_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createTeacherAgentAuditTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_teacher_agent_audit\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`resourceType\` varchar(30) NOT NULL,
  \`resourceId\` int(11) NOT NULL,
  \`action\` varchar(30) NOT NULL,
  \`beforeSnapshot\` json DEFAULT NULL,
  \`afterSnapshot\` json DEFAULT NULL,
  \`operatorId\` int(11) NOT NULL,
  \`operatorName\` varchar(100) NOT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_teacher_agent_audit_resource_type\` (\`resourceType\`),
  KEY \`idx_performance_teacher_agent_audit_resource_id\` (\`resourceId\`),
  KEY \`idx_performance_teacher_agent_audit_action\` (\`action\`),
  KEY \`idx_performance_teacher_agent_audit_operator_id\` (\`operatorId\`),
  KEY \`idx_performance_teacher_agent_audit_create_time\` (\`createTime\`),
  KEY \`idx_performance_teacher_agent_audit_update_time\` (\`updateTime\`),
  KEY \`idx_performance_teacher_agent_audit_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createContractTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_contract\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`employeeId\` int(11) NOT NULL,
  \`type\` varchar(20) NOT NULL,
  \`title\` varchar(200) DEFAULT NULL,
  \`contractNumber\` varchar(50) DEFAULT NULL,
  \`startDate\` varchar(10) NOT NULL,
  \`endDate\` varchar(10) NOT NULL,
  \`probationPeriod\` int(11) DEFAULT NULL,
  \`salary\` decimal(10,2) DEFAULT NULL,
  \`position\` varchar(100) DEFAULT NULL,
  \`departmentId\` int(11) DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'draft',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_contract_employee_id\` (\`employeeId\`),
  KEY \`idx_performance_contract_type\` (\`type\`),
  KEY \`idx_performance_contract_contract_number\` (\`contractNumber\`),
  KEY \`idx_performance_contract_start_date\` (\`startDate\`),
  KEY \`idx_performance_contract_end_date\` (\`endDate\`),
  KEY \`idx_performance_contract_department_id\` (\`departmentId\`),
  KEY \`idx_performance_contract_status\` (\`status\`),
  KEY \`idx_performance_contract_create_time\` (\`createTime\`),
  KEY \`idx_performance_contract_update_time\` (\`updateTime\`),
  KEY \`idx_performance_contract_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createDocumentCenterTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_document_center\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`fileNo\` varchar(64) NOT NULL,
  \`fileName\` varchar(200) NOT NULL,
  \`category\` varchar(32) NOT NULL,
  \`fileType\` varchar(32) NOT NULL,
  \`storage\` varchar(32) NOT NULL,
  \`confidentiality\` varchar(32) NOT NULL,
  \`ownerName\` varchar(100) NOT NULL,
  \`department\` varchar(100) NOT NULL,
  \`status\` varchar(32) NOT NULL DEFAULT 'draft',
  \`version\` varchar(32) NOT NULL,
  \`sizeMb\` decimal(10,2) NOT NULL DEFAULT 0.00,
  \`downloadCount\` int(11) NOT NULL DEFAULT 0,
  \`expireDate\` varchar(10) DEFAULT NULL,
  \`tags\` text DEFAULT NULL,
  \`notes\` text DEFAULT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_document_center_file_no\` (\`fileNo\`),
  KEY \`idx_performance_document_center_file_name\` (\`fileName\`),
  KEY \`idx_performance_document_center_category\` (\`category\`),
  KEY \`idx_performance_document_center_file_type\` (\`fileType\`),
  KEY \`idx_performance_document_center_storage\` (\`storage\`),
  KEY \`idx_performance_document_center_confidentiality\` (\`confidentiality\`),
  KEY \`idx_performance_document_center_status\` (\`status\`),
  KEY \`idx_performance_document_center_create_time\` (\`createTime\`),
  KEY \`idx_performance_document_center_update_time\` (\`updateTime\`),
  KEY \`idx_performance_document_center_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createKnowledgeBaseTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_knowledge_base\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`kbNo\` varchar(64) NOT NULL,
  \`title\` varchar(200) NOT NULL,
  \`category\` varchar(64) NOT NULL,
  \`summary\` text NOT NULL,
  \`ownerName\` varchar(100) NOT NULL,
  \`status\` varchar(32) NOT NULL DEFAULT 'draft',
  \`tags\` text DEFAULT NULL,
  \`relatedFileIds\` text DEFAULT NULL,
  \`relatedTopics\` text DEFAULT NULL,
  \`importance\` int(11) NOT NULL DEFAULT 70,
  \`viewCount\` int(11) NOT NULL DEFAULT 0,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_knowledge_base_kb_no\` (\`kbNo\`),
  KEY \`idx_performance_knowledge_base_title\` (\`title\`),
  KEY \`idx_performance_knowledge_base_category\` (\`category\`),
  KEY \`idx_performance_knowledge_base_status\` (\`status\`),
  KEY \`idx_performance_knowledge_base_create_time\` (\`createTime\`),
  KEY \`idx_performance_knowledge_base_update_time\` (\`updateTime\`),
  KEY \`idx_performance_knowledge_base_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createKnowledgeQaTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_knowledge_qa\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`question\` varchar(500) NOT NULL,
  \`answer\` text NOT NULL,
  \`relatedKnowledgeIds\` text DEFAULT NULL,
  \`relatedFileIds\` text DEFAULT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_knowledge_qa_question\` (\`question\`(191)),
  KEY \`idx_performance_knowledge_qa_create_time\` (\`createTime\`),
  KEY \`idx_performance_knowledge_qa_update_time\` (\`updateTime\`),
  KEY \`idx_performance_knowledge_qa_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

export const managedTables = [
  'performance_office_collab',
  'performance_teacher_info',
  'performance_teacher_follow',
  'performance_teacher_class',
  'performance_teacher_agent',
  'performance_teacher_agent_relation',
  'performance_teacher_attribution',
  'performance_teacher_attribution_conflict',
  'performance_teacher_agent_audit',
  'performance_contract',
  'performance_document_center',
  'performance_knowledge_base',
  'performance_knowledge_qa',
];

export async function up(connection) {
  await connection.query(createOfficeCollabTableSql);
  await connection.query(createTeacherInfoTableSql);
  await connection.query(createTeacherFollowTableSql);
  await connection.query(createTeacherClassTableSql);
  await connection.query(createTeacherAgentTableSql);
  await connection.query(createTeacherAgentRelationTableSql);
  await connection.query(createTeacherAttributionTableSql);
  await connection.query(createTeacherAttributionConflictTableSql);
  await connection.query(createTeacherAgentAuditTableSql);
  await connection.query(createContractTableSql);
  await connection.query(createDocumentCenterTableSql);
  await connection.query(createKnowledgeBaseTableSql);
  await connection.query(createKnowledgeQaTableSql);
}

export async function down(connection) {
  for (const tableName of [...managedTables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
