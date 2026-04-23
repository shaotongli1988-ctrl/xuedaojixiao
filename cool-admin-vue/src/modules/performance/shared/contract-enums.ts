/**
 * 文件职责：集中维护 performance contract adapter 依赖的共享运行时枚举集合。
 * 不负责请求封装、页面选项文案或后端状态机定义。
 * 维护重点：这里只承载前端 decoder 必需的运行时枚举投影，禁止在各个 *-contract.ts 内继续散落同类领域常量。
 */

export const ASSESSMENT_STATUS = ['draft', 'submitted', 'approved', 'rejected'] as const;

export const ASSET_STATUS = [
	'assigned',
	'lost',
	'pendingInbound',
	'available',
	'maintenance',
	'inTransfer',
	'inventorying',
	'scrapped'
] as const;
export const ASSET_ASSIGNMENT_STATUS = ['assigned', 'returned', 'lost'] as const;
export const ASSET_ASSIGNMENT_REQUEST_LEVEL = ['L1', 'L2'] as const;
export const ASSET_ASSIGNMENT_REQUEST_TYPE = [
	'standard',
	'crossDepartmentBorrow',
	'lostReplacement',
	'abnormalReissue',
	'scrapReplacement'
] as const;
export const ASSET_ASSIGNMENT_REQUEST_STATUS = [
	'draft',
	'inApproval',
	'rejected',
	'withdrawn',
	'approvedPendingAssignment',
	'issuing',
	'issued',
	'cancelled',
	'manualPending'
] as const;
export const ASSET_DASHBOARD_MODULE = [
	'assetInfo',
	'assetAssignment',
	'assetMaintenance',
	'assetProcurement',
	'assetTransfer',
	'assetInventory',
	'assetDisposal',
	'assetDepreciation'
] as const;
export const ASSET_DISPOSAL_STATUS = [
	'scrapped',
	'draft',
	'cancelled',
	'submitted',
	'approved'
] as const;
export const ASSET_INVENTORY_STATUS = ['draft', 'counting', 'completed', 'closed'] as const;
export const ASSET_MAINTENANCE_STATUS = [
	'cancelled',
	'completed',
	'scheduled',
	'inProgress'
] as const;
export const ASSET_PROCUREMENT_STATUS = ['draft', 'cancelled', 'submitted', 'received'] as const;
export const ASSET_TRANSFER_STATUS = [
	'draft',
	'cancelled',
	'submitted',
	'completed',
	'inTransit'
] as const;

export const CAPABILITY_MODEL_STATUS = ['draft', 'active', 'archived'] as const;

export const CERTIFICATE_STATUS = ['draft', 'active', 'retired'] as const;
export const CERTIFICATE_RECORD_STATUS = ['issued', 'revoked'] as const;

export const CONTRACT_TYPE = ['full-time', 'part-time', 'internship', 'other'] as const;
export const CONTRACT_STATUS = ['draft', 'active', 'expired', 'terminated'] as const;

export const COURSE_STATUS = ['draft', 'closed', 'published'] as const;
export const COURSE_EXAM_RESULT_STATUS = ['locked', 'pending', 'passed', 'failed'] as const;
export const COURSE_LEARNING_TASK_STATUS = ['submitted', 'pending', 'evaluated'] as const;
export const COURSE_LEARNING_TASK_TYPE = ['recite', 'practice'] as const;

export const DASHBOARD_CROSS_METRIC_CODE = [
	'recruitment_completion_rate',
	'training_pass_rate',
	'meeting_effectiveness_index'
] as const;
export const DASHBOARD_CROSS_SOURCE_DOMAIN = ['recruitment', 'training', 'meeting'] as const;
export const DASHBOARD_CROSS_SCOPE_TYPE = ['global', 'department_tree'] as const;
export const DASHBOARD_CROSS_DATA_STATUS = ['ready', 'delayed', 'unavailable'] as const;
export const DASHBOARD_GRADE = ['S', 'A', 'B', 'C'] as const;

export const DOCUMENT_CENTER_CATEGORY = [
	'policy',
	'process',
	'template',
	'contract',
	'archive',
	'other'
] as const;
export const DOCUMENT_CENTER_STATUS = ['draft', 'published', 'review', 'archived'] as const;
export const DOCUMENT_CENTER_FILE_TYPE = ['other', 'pdf', 'doc', 'xls', 'ppt', 'img', 'zip'] as const;
export const DOCUMENT_CENTER_STORAGE = ['local', 'cloud', 'hybrid'] as const;
export const DOCUMENT_CENTER_CONFIDENTIALITY = ['public', 'internal', 'secret'] as const;

export const GOAL_OPS_ROLE_KIND = ['employee', 'manager', 'hr', 'readonly', 'unsupported'] as const;
export const GOAL_OPS_SCOPE_KEY = ['self', 'department', 'company'] as const;
export const GOAL_OPS_PERIOD_TYPE = ['day', 'week', 'month'] as const;
export const GOAL_OPS_SOURCE_TYPE = ['public', 'personal'] as const;
export const GOAL_OPS_PLAN_STATUS = ['assigned', 'submitted', 'auto_zero'] as const;
export const GOAL_OPS_REPORT_STATUS = ['generated', 'sent', 'intercepted', 'delayed'] as const;

export const HIRING_SOURCE_TYPE = ['manual', 'resumePool', 'talentAsset', 'interview'] as const;
export const HIRING_STATUS = ['offered', 'accepted', 'rejected', 'closed'] as const;

export const KNOWLEDGE_BASE_STATUS = ['draft', 'published', 'archived'] as const;

export const INTERVIEW_STATUS = ['scheduled', 'completed', 'cancelled'] as const;
export const INTERVIEW_TYPE = ['technical', 'behavioral', 'manager', 'hr'] as const;
export const RECRUITMENT_SOURCE_RESOURCE = [
	'jobStandard',
	'recruitPlan',
	'resumePool',
	'interview',
	'talentAsset'
] as const;

export const INDICATOR_CATEGORY = ['assessment', 'goal', 'feedback'] as const;
export const INDICATOR_APPLY_SCOPE = ['all', 'department', 'employee'] as const;
export const INDICATOR_STATUS = [0, 1] as const;

export const JOB_STANDARD_STATUS = ['draft', 'active', 'inactive'] as const;

export const MATERIAL_CATALOG_STATUS = ['active', 'inactive'] as const;
export const MATERIAL_INBOUND_STATUS = ['draft', 'cancelled', 'submitted', 'received'] as const;
export const MATERIAL_ISSUE_STATUS = ['draft', 'issued', 'cancelled', 'submitted'] as const;
export const MATERIAL_STOCK_STATUS = ['sufficient', 'lowStock', 'outOfStock'] as const;

export const MEETING_STATUS = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

export const PURCHASE_ORDER_STATUS = [
	'draft',
	'cancelled',
	'approved',
	'closed',
	'received',
	'inquiring',
	'pendingApproval'
] as const;

export const RECRUIT_PLAN_STATUS = ['draft', 'active', 'voided', 'closed'] as const;

export const RESUME_POOL_STATUS = ['new', 'screening', 'interviewing', 'archived'] as const;
export const RESUME_POOL_SOURCE_TYPE = ['manual', 'attachment', 'external', 'referral'] as const;

export const SUGGESTION_TYPE = ['pip', 'promotion'] as const;
export const SUGGESTION_STATUS = ['rejected', 'pending', 'accepted', 'ignored', 'revoked'] as const;

export const SUPPLIER_STATUS = ['active', 'inactive'] as const;

export const TALENT_ASSET_STATUS = ['new', 'tracking', 'archived'] as const;

export const TEACHER_COOPERATION_STATUS = [
	'uncontacted',
	'contacted',
	'negotiating',
	'partnered',
	'terminated'
] as const;
export const TEACHER_ATTRIBUTION_STATUS = ['pending', 'active', 'removed', 'conflicted'] as const;
export const TEACHER_ATTRIBUTION_CONFLICT_STATUS = ['cancelled', 'open', 'resolved'] as const;
export const TEACHER_AGENT_STATUS = ['active', 'inactive'] as const;
export const TEACHER_AGENT_BLACKLIST_STATUS = ['normal', 'blacklisted'] as const;
export const TEACHER_AGENT_RELATION_STATUS = ['active', 'inactive'] as const;
export const TEACHER_CLASS_STATUS = ['draft', 'closed', 'active'] as const;
export const TEACHER_TODO_BUCKET = ['today', 'overdue'] as const;

export const WORK_PLAN_STATUS = ['draft', 'cancelled', 'completed', 'inProgress', 'planned'] as const;
export const WORK_PLAN_PRIORITY = ['low', 'medium', 'high', 'urgent'] as const;
