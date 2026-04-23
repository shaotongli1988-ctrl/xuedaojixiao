/**
 * Creates the formal schema baseline for recruitment, goal operations, and meeting tables.
 * This migration only manages additive creation and rollback of the current performance tables in this domain group.
 * Maintenance pitfall: keep every column, index, and default aligned with BaseEntity and the current performance entity contract before changing this baseline.
 */

export const migrationId = '20260420142000';
export const migrationName = 'add-performance-recruitment-goalops-meeting-tables';

const createInterviewTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_interview\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`candidateName\` varchar(100) NOT NULL,
  \`position\` varchar(100) NOT NULL,
  \`departmentId\` int(11) DEFAULT NULL,
  \`interviewerId\` int(11) NOT NULL,
  \`interviewDate\` varchar(19) NOT NULL,
  \`interviewType\` varchar(20) DEFAULT NULL,
  \`score\` decimal(5,2) DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'scheduled',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`resumePoolId\` int(11) DEFAULT NULL,
  \`recruitPlanId\` int(11) DEFAULT NULL,
  \`sourceSnapshot\` json DEFAULT NULL COMMENT '来源轻量快照',
  \`resumePoolSnapshot\` json DEFAULT NULL,
  \`recruitPlanSnapshot\` json DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_interview_candidate_name\` (\`candidateName\`),
  KEY \`idx_performance_interview_department_id\` (\`departmentId\`),
  KEY \`idx_performance_interview_interviewer_id\` (\`interviewerId\`),
  KEY \`idx_performance_interview_interview_date\` (\`interviewDate\`),
  KEY \`idx_performance_interview_status\` (\`status\`),
  KEY \`idx_performance_interview_create_time\` (\`createTime\`),
  KEY \`idx_performance_interview_update_time\` (\`updateTime\`),
  KEY \`idx_performance_interview_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createGoalOpsDepartmentConfigTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_goal_ops_department_config\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`departmentId\` int(11) NOT NULL COMMENT '部门ID',
  \`assignTime\` varchar(5) NOT NULL DEFAULT '09:00' COMMENT '日目标下发时间',
  \`submitDeadline\` varchar(5) NOT NULL DEFAULT '18:00' COMMENT '结果填报截止时间',
  \`reportSendTime\` varchar(5) NOT NULL DEFAULT '18:30' COMMENT '日报自动发送时间',
  \`reportPushMode\` varchar(32) NOT NULL DEFAULT 'system_and_group' COMMENT '日报推送方式',
  \`reportPushTarget\` varchar(200) DEFAULT NULL COMMENT '日报推送目标',
  \`updatedBy\` int(11) DEFAULT NULL COMMENT '最后更新人ID',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_goal_ops_department_config_department\` (\`departmentId\`),
  KEY \`idx_performance_goal_ops_department_config_create_time\` (\`createTime\`),
  KEY \`idx_performance_goal_ops_department_config_update_time\` (\`updateTime\`),
  KEY \`idx_performance_goal_ops_department_config_tenant\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createGoalOpsPlanTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_goal_ops_plan\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`departmentId\` int(11) NOT NULL COMMENT '部门ID',
  \`employeeId\` int(11) NOT NULL COMMENT '员工ID',
  \`periodType\` varchar(16) NOT NULL COMMENT '周期类型',
  \`planDate\` varchar(10) DEFAULT NULL COMMENT '计划日期',
  \`periodStartDate\` varchar(10) NOT NULL COMMENT '周期开始日期',
  \`periodEndDate\` varchar(10) NOT NULL COMMENT '周期结束日期',
  \`sourceType\` varchar(16) NOT NULL COMMENT '目标来源',
  \`title\` varchar(200) NOT NULL COMMENT '目标标题',
  \`description\` text DEFAULT NULL COMMENT '目标说明',
  \`targetValue\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '目标值',
  \`actualValue\` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '实际值',
  \`unit\` varchar(20) DEFAULT NULL COMMENT '单位',
  \`status\` varchar(32) NOT NULL DEFAULT 'assigned' COMMENT '状态',
  \`parentPlanId\` int(11) DEFAULT NULL COMMENT '父级计划ID',
  \`isSystemGenerated\` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否系统生成',
  \`assignedBy\` int(11) DEFAULT NULL COMMENT '下发人ID',
  \`submittedBy\` int(11) DEFAULT NULL COMMENT '提交人ID',
  \`submittedAt\` varchar(19) DEFAULT NULL COMMENT '提交时间',
  \`extJson\` text DEFAULT NULL COMMENT '扩展JSON',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_goal_ops_plan_department_period_date\` (\`departmentId\`,\`periodType\`,\`planDate\`),
  KEY \`idx_performance_goal_ops_plan_employee_period_date\` (\`employeeId\`,\`periodType\`,\`planDate\`),
  KEY \`idx_performance_goal_ops_plan_source_type\` (\`sourceType\`),
  KEY \`idx_performance_goal_ops_plan_status\` (\`status\`),
  KEY \`idx_performance_goal_ops_plan_create_time\` (\`createTime\`),
  KEY \`idx_performance_goal_ops_plan_update_time\` (\`updateTime\`),
  KEY \`idx_performance_goal_ops_plan_tenant\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createGoalOpsReportTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_goal_ops_report\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`departmentId\` int(11) NOT NULL COMMENT '部门ID',
  \`reportDate\` varchar(10) NOT NULL COMMENT '日报日期',
  \`status\` varchar(32) NOT NULL DEFAULT 'generated' COMMENT '日报状态',
  \`summaryJson\` longtext NOT NULL COMMENT '日报摘要JSON',
  \`generatedAt\` varchar(19) NOT NULL COMMENT '生成时间',
  \`sentAt\` varchar(19) DEFAULT NULL COMMENT '发送时间',
  \`pushMode\` varchar(32) NOT NULL DEFAULT 'system_only' COMMENT '发送方式',
  \`pushTarget\` varchar(200) DEFAULT NULL COMMENT '发送目标',
  \`generatedBy\` int(11) DEFAULT NULL COMMENT '生成人ID',
  \`operatedBy\` int(11) DEFAULT NULL COMMENT '最后操作人ID',
  \`operationRemark\` text DEFAULT NULL COMMENT '拦截或延期原因',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_goal_ops_report_department_date\` (\`departmentId\`,\`reportDate\`),
  KEY \`idx_performance_goal_ops_report_status\` (\`status\`),
  KEY \`idx_performance_goal_ops_report_create_time\` (\`createTime\`),
  KEY \`idx_performance_goal_ops_report_update_time\` (\`updateTime\`),
  KEY \`idx_performance_goal_ops_report_tenant\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createMeetingTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_meeting\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`title\` varchar(200) NOT NULL,
  \`code\` varchar(100) DEFAULT NULL,
  \`type\` varchar(100) DEFAULT NULL,
  \`description\` text DEFAULT NULL,
  \`startDate\` varchar(19) NOT NULL,
  \`endDate\` varchar(19) NOT NULL,
  \`location\` varchar(200) DEFAULT NULL,
  \`organizerId\` int(11) NOT NULL,
  \`participantIds\` json DEFAULT NULL,
  \`participantCount\` int(11) NOT NULL DEFAULT 0,
  \`status\` varchar(20) NOT NULL DEFAULT 'scheduled',
  \`lastCheckInTime\` varchar(19) DEFAULT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_meeting_title\` (\`title\`),
  KEY \`idx_performance_meeting_code\` (\`code\`),
  KEY \`idx_performance_meeting_start_date\` (\`startDate\`),
  KEY \`idx_performance_meeting_end_date\` (\`endDate\`),
  KEY \`idx_performance_meeting_organizer_id\` (\`organizerId\`),
  KEY \`idx_performance_meeting_status\` (\`status\`),
  KEY \`idx_performance_meeting_last_check_in_time\` (\`lastCheckInTime\`),
  KEY \`idx_performance_meeting_create_time\` (\`createTime\`),
  KEY \`idx_performance_meeting_update_time\` (\`updateTime\`),
  KEY \`idx_performance_meeting_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createTalentAssetTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_talent_asset\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`candidateName\` varchar(100) NOT NULL,
  \`code\` varchar(100) DEFAULT NULL,
  \`targetDepartmentId\` int(11) NOT NULL,
  \`targetPosition\` varchar(100) DEFAULT NULL,
  \`source\` varchar(100) NOT NULL,
  \`tagList\` json DEFAULT NULL,
  \`followUpSummary\` text DEFAULT NULL,
  \`nextFollowUpDate\` varchar(19) DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'new',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_performance_talent_asset_code\` (\`code\`),
  KEY \`idx_performance_talent_asset_candidate_name\` (\`candidateName\`),
  KEY \`idx_performance_talent_asset_target_department_id\` (\`targetDepartmentId\`),
  KEY \`idx_performance_talent_asset_status\` (\`status\`),
  KEY \`idx_performance_talent_asset_create_time\` (\`createTime\`),
  KEY \`idx_performance_talent_asset_update_time\` (\`updateTime\`),
  KEY \`idx_performance_talent_asset_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createResumePoolTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_resume_pool\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`candidateName\` varchar(100) NOT NULL,
  \`targetDepartmentId\` int(11) NOT NULL,
  \`targetPosition\` varchar(100) DEFAULT NULL,
  \`phone\` varchar(30) NOT NULL,
  \`email\` varchar(100) DEFAULT NULL,
  \`resumeText\` text NOT NULL,
  \`sourceType\` varchar(20) NOT NULL,
  \`sourceRemark\` text DEFAULT NULL,
  \`externalLink\` varchar(500) DEFAULT NULL,
  \`attachmentIdList\` json DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'new',
  \`linkedTalentAssetId\` int(11) DEFAULT NULL,
  \`latestInterviewId\` int(11) DEFAULT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`recruitPlanId\` int(11) DEFAULT NULL,
  \`jobStandardId\` int(11) DEFAULT NULL,
  \`recruitPlanSnapshot\` json DEFAULT NULL,
  \`jobStandardSnapshot\` json DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_resume_pool_candidate_name\` (\`candidateName\`),
  KEY \`idx_performance_resume_pool_target_department_id\` (\`targetDepartmentId\`),
  KEY \`idx_performance_resume_pool_phone\` (\`phone\`),
  KEY \`idx_performance_resume_pool_email\` (\`email\`),
  KEY \`idx_performance_resume_pool_source_type\` (\`sourceType\`),
  KEY \`idx_performance_resume_pool_status\` (\`status\`),
  KEY \`idx_performance_resume_pool_linked_talent_asset_id\` (\`linkedTalentAssetId\`),
  KEY \`idx_performance_resume_pool_latest_interview_id\` (\`latestInterviewId\`),
  KEY \`idx_performance_resume_pool_create_time\` (\`createTime\`),
  KEY \`idx_performance_resume_pool_update_time\` (\`updateTime\`),
  KEY \`idx_performance_resume_pool_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createHiringTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_hiring\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`candidateName\` varchar(100) NOT NULL,
  \`targetDepartmentId\` int(11) NOT NULL,
  \`targetPosition\` varchar(100) DEFAULT NULL,
  \`decisionContent\` text DEFAULT NULL,
  \`sourceType\` varchar(30) DEFAULT NULL,
  \`sourceId\` int(11) DEFAULT NULL,
  \`sourceSnapshot\` json DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'offered',
  \`offeredAt\` varchar(19) DEFAULT NULL,
  \`acceptedAt\` varchar(19) DEFAULT NULL,
  \`rejectedAt\` varchar(19) DEFAULT NULL,
  \`closedAt\` varchar(19) DEFAULT NULL,
  \`closeReason\` text DEFAULT NULL,
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`interviewId\` int(11) DEFAULT NULL,
  \`resumePoolId\` int(11) DEFAULT NULL,
  \`recruitPlanId\` int(11) DEFAULT NULL,
  \`interviewSnapshot\` json DEFAULT NULL,
  \`resumePoolSnapshot\` json DEFAULT NULL,
  \`recruitPlanSnapshot\` json DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_hiring_candidate_name\` (\`candidateName\`),
  KEY \`idx_performance_hiring_target_department_id\` (\`targetDepartmentId\`),
  KEY \`idx_performance_hiring_source_type\` (\`sourceType\`),
  KEY \`idx_performance_hiring_source_id\` (\`sourceId\`),
  KEY \`idx_performance_hiring_status\` (\`status\`),
  KEY \`idx_performance_hiring_offered_at\` (\`offeredAt\`),
  KEY \`idx_performance_hiring_accepted_at\` (\`acceptedAt\`),
  KEY \`idx_performance_hiring_rejected_at\` (\`rejectedAt\`),
  KEY \`idx_performance_hiring_closed_at\` (\`closedAt\`),
  KEY \`idx_performance_hiring_create_time\` (\`createTime\`),
  KEY \`idx_performance_hiring_update_time\` (\`updateTime\`),
  KEY \`idx_performance_hiring_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createRecruitPlanTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_recruit_plan\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`title\` varchar(200) NOT NULL,
  \`targetDepartmentId\` int(11) NOT NULL,
  \`positionName\` varchar(100) NOT NULL,
  \`headcount\` int(11) NOT NULL,
  \`startDate\` varchar(10) NOT NULL,
  \`endDate\` varchar(10) NOT NULL,
  \`recruiterId\` int(11) DEFAULT NULL,
  \`requirementSummary\` text DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'draft',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  \`jobStandardId\` int(11) DEFAULT NULL,
  \`jobStandardSnapshot\` json DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_recruit_plan_title\` (\`title\`),
  KEY \`idx_performance_recruit_plan_target_department_id\` (\`targetDepartmentId\`),
  KEY \`idx_performance_recruit_plan_position_name\` (\`positionName\`),
  KEY \`idx_performance_recruit_plan_start_date\` (\`startDate\`),
  KEY \`idx_performance_recruit_plan_end_date\` (\`endDate\`),
  KEY \`idx_performance_recruit_plan_recruiter_id\` (\`recruiterId\`),
  KEY \`idx_performance_recruit_plan_status\` (\`status\`),
  KEY \`idx_performance_recruit_plan_create_time\` (\`createTime\`),
  KEY \`idx_performance_recruit_plan_update_time\` (\`updateTime\`),
  KEY \`idx_performance_recruit_plan_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createJobStandardTableSql = `
CREATE TABLE IF NOT EXISTS \`performance_job_standard\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`positionName\` varchar(100) NOT NULL,
  \`targetDepartmentId\` int(11) NOT NULL,
  \`jobLevel\` varchar(100) DEFAULT NULL,
  \`profileSummary\` text DEFAULT NULL,
  \`requirementSummary\` text DEFAULT NULL,
  \`skillTagList\` json DEFAULT NULL,
  \`interviewTemplateSummary\` text DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'draft',
  \`createTime\` varchar(255) NOT NULL COMMENT '创建时间',
  \`updateTime\` varchar(255) NOT NULL COMMENT '更新时间',
  \`tenantId\` int(11) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (\`id\`),
  KEY \`idx_performance_job_standard_position_name\` (\`positionName\`),
  KEY \`idx_performance_job_standard_target_department_id\` (\`targetDepartmentId\`),
  KEY \`idx_performance_job_standard_status\` (\`status\`),
  KEY \`idx_performance_job_standard_create_time\` (\`createTime\`),
  KEY \`idx_performance_job_standard_update_time\` (\`updateTime\`),
  KEY \`idx_performance_job_standard_tenant_id\` (\`tenantId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

export const managedTables = [
  'performance_interview',
  'performance_goal_ops_department_config',
  'performance_goal_ops_plan',
  'performance_goal_ops_report',
  'performance_meeting',
  'performance_talent_asset',
  'performance_resume_pool',
  'performance_hiring',
  'performance_recruit_plan',
  'performance_job_standard',
];

export async function up(connection) {
  await connection.query(createInterviewTableSql);
  await connection.query(createGoalOpsDepartmentConfigTableSql);
  await connection.query(createGoalOpsPlanTableSql);
  await connection.query(createGoalOpsReportTableSql);
  await connection.query(createMeetingTableSql);
  await connection.query(createTalentAssetTableSql);
  await connection.query(createResumePoolTableSql);
  await connection.query(createHiringTableSql);
  await connection.query(createRecruitPlanTableSql);
  await connection.query(createJobStandardTableSql);
}

export async function down(connection) {
  for (const tableName of [...managedTables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
}
