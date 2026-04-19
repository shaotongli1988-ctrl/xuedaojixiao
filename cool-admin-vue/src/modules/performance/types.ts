/**
 * 绩效模块前端类型。
 * 这里只定义评估单、目标地图等模块内复用结构，不负责接口请求实现。
 */
export type AssessmentMode = 'my' | 'initiated' | 'pending';

export type DashboardCrossMetricCode =
	| 'recruitment_completion_rate'
	| 'training_pass_rate'
	| 'meeting_effectiveness_index';

export type DashboardCrossSourceDomain = 'recruitment' | 'training' | 'meeting';
export type DashboardCrossScopeType = 'global' | 'department_tree';
export type DashboardCrossDataStatus = 'ready' | 'delayed' | 'unavailable';
export type RecruitPlanStatus = 'draft' | 'active' | 'voided' | 'closed';
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';
export type ContractType = 'full-time' | 'part-time' | 'internship' | 'other';
export type PurchaseOrderStatus =
	| 'draft'
	| 'inquiring'
	| 'pendingApproval'
	| 'approved'
	| 'received'
	| 'closed'
	| 'cancelled';
export type SupplierStatus = 'active' | 'inactive';
export type CapabilityModelStatus = 'draft' | 'active' | 'archived';
export type CourseStatus = 'draft' | 'published' | 'closed';
export type CertificateRecordStatus = 'issued' | 'revoked';
export type CertificateStatus = 'draft' | 'active' | 'retired';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';
export type InterviewType = 'technical' | 'behavioral' | 'manager' | 'hr';
export type ResumePoolStatus = 'new' | 'screening' | 'interviewing' | 'archived';
export type ResumePoolSourceType = 'manual' | 'attachment' | 'external' | 'referral';
export type DocumentCenterStatus = 'draft' | 'review' | 'published' | 'archived';
export type DocumentCenterCategory =
	| 'policy'
	| 'process'
	| 'template'
	| 'contract'
	| 'archive'
	| 'other';
export type DocumentCenterFileType = 'pdf' | 'doc' | 'xls' | 'ppt' | 'img' | 'zip' | 'other';
export type DocumentCenterStorage = 'local' | 'cloud' | 'hybrid';
export type DocumentCenterConfidentiality = 'public' | 'internal' | 'secret';
export type KnowledgeBaseStatus = 'draft' | 'published' | 'archived';
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TalentAssetStatus = 'new' | 'tracking' | 'archived';
export type JobStandardStatus = 'draft' | 'active' | 'inactive';
export type HiringStatus = 'offered' | 'accepted' | 'rejected' | 'closed';
export type HiringSourceType = 'manual' | 'resumePool' | 'talentAsset' | 'interview';
export type RecruitmentSourceResource =
	| 'jobStandard'
	| 'recruitPlan'
	| 'resumePool'
	| 'interview';
export type TeacherCooperationStatus =
	| 'uncontacted'
	| 'contacted'
	| 'negotiating'
	| 'partnered'
	| 'terminated';
export type TeacherClassStatus = 'draft' | 'active' | 'closed';
export type TeacherTodoBucket = 'today' | 'overdue';
export type TeacherAgentStatus = 'active' | 'inactive';
export type TeacherAgentBlacklistStatus = 'normal' | 'blacklisted';
export type TeacherAgentRelationStatus = 'active' | 'inactive';
export type TeacherAttributionStatus = 'pending' | 'active' | 'removed' | 'conflicted';
export type TeacherAttributionConflictStatus = 'open' | 'resolved' | 'cancelled';

export interface DashboardCrossSummaryQuery {
	periodType?: string;
	periodValue?: string;
	departmentId?: number;
	metricCodes?: DashboardCrossMetricCode[];
}

export interface DashboardCrossMetricCard {
	metricCode: DashboardCrossMetricCode;
	metricLabel: string;
	sourceDomain: DashboardCrossSourceDomain;
	metricValue: number | null;
	unit: string;
	periodType: string;
	periodValue: string;
	scopeType: DashboardCrossScopeType;
	departmentId: number | null;
	updatedAt: string | null;
	dataStatus: DashboardCrossDataStatus;
	statusText: string;
}

export interface DashboardCrossSummary {
	metricCards: DashboardCrossMetricCard[];
}

export interface AssessmentScoreItem {
	id?: number;
	indicatorId?: number | null;
	indicatorName: string;
	score: number;
	weight: number;
	comment?: string;
	weightedScore?: number;
}

export interface AssessmentRecord {
	id?: number;
	code?: string;
	employeeId: number | undefined;
	employeeName?: string;
	assessorId: number | undefined;
	assessorName?: string;
	departmentId: number | undefined;
	departmentName?: string;
	periodType: string;
	periodValue: string;
	targetCompletion: number;
	totalScore?: number;
	grade?: string;
	selfEvaluation: string;
	managerFeedback?: string;
	status?: string;
	submitTime?: string;
	approveTime?: string;
	createTime?: string;
	updateTime?: string;
	scoreItems: AssessmentScoreItem[];
}

export interface AssessmentPageResult {
	list: AssessmentRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface AssessmentExportRow {
	code: string;
	employeeName: string;
	departmentName: string;
	periodType: string;
	periodValue: string;
	assessorName: string;
	status: string;
	targetCompletion: number;
	totalScore: number;
	grade: string;
	submitTime?: string;
	approveTime?: string;
}

export interface UserOption {
	id: number;
	name: string;
	departmentId?: number | null;
	departmentName?: string;
}

export interface GoalProgressRecord {
	id?: number;
	goalId?: number;
	beforeValue: number;
	afterValue: number;
	progressRate: number;
	remark?: string;
	operatorId?: number;
	operatorName?: string;
	createTime?: string;
}

export interface GoalRecord {
	id?: number;
	employeeId: number | undefined;
	employeeName?: string;
	departmentId: number | undefined;
	departmentName?: string;
	title: string;
	description: string;
	targetValue: number;
	currentValue: number;
	unit: string;
	weight: number;
	startDate: string;
	endDate: string;
	progressRate?: number;
	status?: string;
	createTime?: string;
	updateTime?: string;
	progressRecords?: GoalProgressRecord[];
}

export interface GoalPageResult {
	list: GoalRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface GoalExportRow {
	employeeName: string;
	departmentName: string;
	title: string;
	targetValue: number;
	currentValue: number;
	unit: string;
	weight: number;
	status: string;
	startDate: string;
	endDate: string;
	updateTime?: string;
}

export type GoalOpsPeriodType = 'day' | 'week' | 'month';
export type GoalOpsSourceType = 'public' | 'personal';
export type GoalOpsPlanStatus = 'assigned' | 'submitted' | 'auto_zero';
export type GoalOpsReportStatus = 'generated' | 'sent' | 'intercepted' | 'delayed';

export interface GoalOpsDepartmentConfig {
	departmentId?: number;
	departmentName?: string;
	assignTime: string;
	submitDeadline: string;
	reportSendTime: string;
	reportPushMode: string;
	reportPushTarget?: string | null;
	updatedBy?: number | null;
	updateTime?: string | null;
}

export interface GoalOpsAccessProfile {
	departmentId: number | null;
	isHr: boolean;
	canManageDepartment: boolean;
	canMaintainPersonalPlan: boolean;
	manageableDepartmentIds: number[];
}

export interface GoalOpsPlanRecord {
	id?: number;
	departmentId?: number;
	departmentName?: string;
	employeeId: number | undefined;
	employeeName?: string;
	periodType: GoalOpsPeriodType;
	planDate?: string | null;
	periodStartDate: string;
	periodEndDate: string;
	sourceType: GoalOpsSourceType;
	title: string;
	description?: string | null;
	targetValue: number;
	actualValue?: number;
	completionRate?: number;
	unit?: string | null;
	status?: GoalOpsPlanStatus;
	parentPlanId?: number | null;
	isSystemGenerated?: boolean;
	assignedBy?: number | null;
	submittedBy?: number | null;
	submittedAt?: string | null;
	createTime?: string;
	updateTime?: string;
}

export interface GoalOpsPlanPageResult {
	list: GoalOpsPlanRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface GoalOpsOverviewRow {
	employeeId: number;
	employeeName: string;
	departmentId: number;
	publicTargetValue: number;
	publicActualValue: number;
	personalTargetValue: number;
	personalActualValue: number;
	totalTargetValue: number;
	totalActualValue: number;
	completionRate: number;
	assignedCount: number;
	submittedCount: number;
	autoZeroCount: number;
}

export interface GoalOpsDepartmentSummary {
	planDate: string;
	departmentId: number;
	employeeCount: number;
	publicTargetValue: number;
	publicActualValue: number;
	personalTargetValue: number;
	personalActualValue: number;
	totalTargetValue: number;
	totalActualValue: number;
	completionRate: number;
	assignedCount: number;
	submittedCount: number;
	autoZeroCount: number;
}

export interface GoalOpsLeaderboard {
	completionRate: GoalOpsOverviewRow[];
	output: GoalOpsOverviewRow[];
}

export interface GoalOpsOverview {
	planDate: string;
	departmentId: number | null;
	departmentSummary: GoalOpsDepartmentSummary;
	leaderboard: GoalOpsLeaderboard;
	rows: GoalOpsOverviewRow[];
}

export interface GoalOpsReportAutoZeroEmployee {
	employeeId: number;
	employeeName: string;
	autoZeroCount: number;
}

export interface GoalOpsReportSummary {
	planDate: string;
	departmentId: number;
	departmentSummary: GoalOpsDepartmentSummary;
	topCompletionEmployees: GoalOpsOverviewRow[];
	topOutputEmployees: GoalOpsOverviewRow[];
	autoZeroEmployees: GoalOpsReportAutoZeroEmployee[];
}

export interface GoalOpsReportInfo {
	id?: number;
	departmentId: number;
	reportDate: string;
	status: GoalOpsReportStatus;
	summary: GoalOpsReportSummary | null;
	generatedAt?: string | null;
	sentAt?: string | null;
	pushMode?: string;
	pushTarget?: string | null;
	generatedBy?: number | null;
	operatedBy?: number | null;
	operationRemark?: string | null;
	createTime?: string;
	updateTime?: string;
}

export interface RecruitPlanRecord {
	id?: number;
	title: string;
	targetDepartmentId: number | undefined;
	targetDepartmentName?: string | null;
	positionName: string;
	headcount: number;
	startDate: string;
	endDate: string;
	recruiterId?: number | null;
	recruiterName?: string | null;
	requirementSummary?: string | null;
	jobStandardId?: number | null;
	jobStandardPositionName?: string | null;
	jobStandardSummary?: RecruitmentSourceSnapshot | null;
	jobStandardSnapshot?: RecruitmentSourceSnapshot | null;
	sourceSnapshot?: RecruitmentSourceSnapshot | null;
	status?: RecruitPlanStatus;
	createTime?: string;
	updateTime?: string;
}

export interface RecruitPlanPageResult {
	list: RecruitPlanRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export type RecruitPlanImportCellValue = string | number | null | undefined;

export interface RecruitPlanImportRow {
	[key: string]: RecruitPlanImportCellValue;
}

export interface RecruitPlanExportRow {
	id?: number;
	title: string;
	targetDepartmentId?: number | null;
	targetDepartmentName?: string | null;
	positionName: string;
	headcount: number;
	startDate: string;
	endDate: string;
	recruiterId?: number | null;
	recruiterName?: string | null;
	status?: RecruitPlanStatus;
	createTime?: string;
	updateTime?: string;
}

export interface ContractRecord {
	id?: number;
	employeeId: number | undefined;
	employeeName?: string;
	type: ContractType;
	title?: string;
	contractNumber?: string;
	startDate: string;
	endDate: string;
	probationPeriod?: number | null;
	salary?: number | null;
	position?: string;
	departmentId?: number | null;
	departmentName?: string;
	status?: ContractStatus;
	createTime?: string;
	updateTime?: string;
}

export interface ContractPageResult {
	list: ContractRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface PurchaseOrderRecord {
	id?: number;
	orderNo?: string | null;
	title: string;
	supplierId: number | undefined;
	supplierName?: string;
	departmentId: number | undefined;
	departmentName?: string;
	requesterId: number | undefined;
	requesterName?: string;
	orderDate: string;
	expectedDeliveryDate?: string | null;
	totalAmount: number;
	currency?: string;
	approvedBy?: string | null;
	approvedAt?: string | null;
	approvalRemark?: string | null;
	closedReason?: string | null;
	receivedQuantity?: number | null;
	receivedAt?: string | null;
	items?: PurchaseOrderItemRecord[];
	inquiryRecords?: PurchaseOrderInquiryRecord[];
	approvalLogs?: PurchaseOrderApprovalLog[];
	receiptRecords?: PurchaseOrderReceiptRecord[];
	remark?: string | null;
	status?: PurchaseOrderStatus;
	createTime?: string;
	updateTime?: string;
}

export interface PurchaseOrderPageResult {
	list: PurchaseOrderRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface PurchaseOrderItemRecord {
	id?: number;
	itemName: string;
	specification?: string | null;
	unit?: string | null;
	quantity: number;
	unitPrice?: number | null;
	amount?: number | null;
	remark?: string | null;
}

export interface PurchaseOrderInquiryRecord {
	id?: number;
	supplierId?: number | null;
	supplierName?: string | null;
	quotedAmount?: number | null;
	inquiryRemark?: string | null;
	createdBy?: string | null;
	createdAt?: string | null;
}

export interface PurchaseOrderApprovalLog {
	id?: number;
	action?: 'submitted' | 'approved' | 'rejected' | 'closed' | string;
	approverId?: number | null;
	approverName?: string | null;
	remark?: string | null;
	createdAt?: string | null;
}

export interface PurchaseOrderReceiptRecord {
	id?: number;
	receivedQuantity?: number | null;
	receivedAt?: string | null;
	receiverId?: number | null;
	receiverName?: string | null;
	remark?: string | null;
}

export interface PurchaseReportSummary {
	totalOrders: number;
	totalAmount: number;
	inquiringCount: number;
	pendingApprovalCount: number;
	approvedCount: number;
	receivedCount: number;
	closedCount: number;
	cancelledCount: number;
	supplierCount: number;
}

export interface PurchaseReportTrendPoint {
	period: string;
	orderCount: number;
	totalAmount: number;
	approvedCount: number;
	receivedQuantity: number;
}

export interface PurchaseReportSupplierStat {
	supplierId?: number | null;
	supplierName: string;
	orderCount: number;
	totalAmount: number;
	receivedQuantity: number;
	lastOrderDate?: string | null;
}

export interface SupplierRecord {
	id?: number;
	name: string;
	code?: string | null;
	category?: string | null;
	contactName?: string | null;
	contactPhone?: string | null;
	contactEmail?: string | null;
	bankAccount?: string | null;
	taxNo?: string | null;
	remark?: string | null;
	status?: SupplierStatus;
	createTime?: string;
	updateTime?: string;
}

export interface SupplierPageResult {
	list: SupplierRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface CapabilityModelRecord {
	id?: number;
	name: string;
	code?: string | null;
	category?: string | null;
	description?: string | null;
	status?: CapabilityModelStatus;
	itemCount?: number;
	createTime?: string;
	updateTime?: string;
}

export interface CapabilityModelPageResult {
	list: CapabilityModelRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface CapabilityItemRecord {
	id?: number;
	modelId?: number;
	name: string;
	level?: string | null;
	description?: string | null;
	evidenceHint?: string | null;
	updateTime?: string;
}

export interface CapabilityPortraitRecord {
	employeeId: number;
	employeeName?: string;
	departmentId?: number | null;
	departmentName?: string | null;
	capabilityTags?: string[];
	levelSummary?: string[];
	certificateCount?: number;
	lastCertifiedAt?: string | null;
	updatedAt?: string;
}

export interface CertificateRecord {
	id?: number;
	name: string;
	code?: string | null;
	category?: string | null;
	issuer?: string | null;
	description?: string | null;
	validityMonths?: number | null;
	sourceCourseId?: number | null;
	status?: CertificateStatus;
	issuedCount?: number;
	createTime?: string;
	updateTime?: string;
}

export interface CertificatePageResult {
	list: CertificateRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface CertificateLedgerRecord {
	id?: number;
	certificateId?: number;
	certificateName?: string;
	employeeId?: number;
	employeeName?: string;
	departmentId?: number | null;
	departmentName?: string | null;
	issuedAt: string;
	issuedBy?: string;
	sourceCourseId?: number | null;
	status?: CertificateRecordStatus;
}

export interface CertificateLedgerPageResult {
	list: CertificateLedgerRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface CourseRecord {
	id?: number;
	title: string;
	code?: string;
	category?: string;
	description?: string;
	startDate?: string | null;
	endDate?: string | null;
	status?: CourseStatus;
	enrollmentCount?: number;
	createTime?: string;
	updateTime?: string;
}

export interface CoursePageResult {
	list: CourseRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface CourseEnrollmentRecord {
	userId: number;
	userName: string;
	enrollTime?: string;
	status?: string;
	score?: number | null;
}

export interface CourseEnrollmentPageResult {
	list: CourseEnrollmentRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface DocumentCenterRecord {
	id?: number;
	fileNo: string;
	fileName: string;
	category: DocumentCenterCategory;
	fileType: DocumentCenterFileType;
	storage: DocumentCenterStorage;
	confidentiality: DocumentCenterConfidentiality;
	ownerName: string;
	department: string;
	status?: DocumentCenterStatus;
	version: string;
	sizeMb?: number | null;
	downloadCount?: number;
	createTime?: string;
	updateTime?: string;
	expireDate?: string | null;
	tags?: string[];
	notes?: string;
}

export interface DocumentCenterPageResult {
	list: DocumentCenterRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface DocumentCenterStats {
	total: number;
	publishedCount: number;
	reviewCount: number;
	archivedCount: number;
	totalSizeMb: number;
	totalDownloads: number;
}

export interface KnowledgeBaseRelatedFileSummary {
	id: number;
	fileNo?: string;
	fileName?: string;
}

export interface KnowledgeBaseRecord {
	id?: number;
	kbNo: string;
	title: string;
	category: string;
	summary: string;
	ownerName: string;
	status?: KnowledgeBaseStatus;
	tags?: string[];
	relatedFileIds?: number[];
	relatedTopics?: string[];
	importance?: number;
	viewCount?: number;
	createTime?: string;
	updateTime?: string;
}

export interface KnowledgeBasePageResult {
	list: KnowledgeBaseRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface KnowledgeBaseStats {
	total: number;
	publishedCount: number;
	draftCount: number;
	fileLinkedCount: number;
	avgImportance: number;
	topicCount: number;
}

export interface KnowledgeGraphNode {
	id: string;
	name: string;
	category?: string;
	value?: number;
}

export interface KnowledgeGraphLink {
	source: string;
	target: string;
	value?: number;
}

export interface KnowledgeGraphSummary {
	nodes: KnowledgeGraphNode[];
	links: KnowledgeGraphLink[];
	categories?: Array<{ name: string }>;
}

export interface KnowledgeQaRecord {
	id?: number;
	question: string;
	answer: string;
	relatedKnowledgeIds?: number[];
	relatedFileIds?: number[];
	createTime?: string;
	updateTime?: string;
}

export interface KnowledgeSearchResult {
	total: number;
	knowledge: KnowledgeBaseRecord[];
	files: DocumentCenterRecord[];
	qas: KnowledgeQaRecord[];
}

export interface InterviewRecord {
	id?: number;
	candidateName: string;
	position: string;
	departmentId?: number | null;
	interviewerId: number | undefined;
	interviewerName?: string;
	interviewDate: string;
	interviewType?: InterviewType | null;
	score?: number | null;
	resumePoolId?: number | null;
	recruitPlanId?: number | null;
	sourceSnapshot?: RecruitmentSourceSnapshot | null;
	resumePoolSnapshot?: RecruitmentSourceSnapshot | null;
	recruitPlanSnapshot?: RecruitmentSourceSnapshot | null;
	status?: InterviewStatus;
	createTime?: string;
	updateTime?: string;
}

export interface InterviewPageResult {
	list: InterviewRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface ResumePoolAttachmentSummary {
	id: number;
	name: string;
	size: number;
	uploadTime: string;
}

export interface ResumePoolRecord {
	id?: number;
	candidateName: string;
	targetDepartmentId: number | undefined;
	targetDepartmentName?: string;
	targetPosition?: string | null;
	phone: string;
	email?: string | null;
	resumeText: string;
	sourceType: ResumePoolSourceType;
	sourceRemark?: string | null;
	externalLink?: string | null;
	recruitPlanId?: number | null;
	recruitPlanTitle?: string | null;
	jobStandardId?: number | null;
	jobStandardPositionName?: string | null;
	sourceSnapshot?: RecruitmentSourceSnapshot | null;
	recruitPlanSnapshot?: RecruitmentSourceSnapshot | null;
	jobStandardSnapshot?: RecruitmentSourceSnapshot | null;
	attachmentIdList?: number[];
	attachmentSummaryList?: ResumePoolAttachmentSummary[];
	status?: ResumePoolStatus;
	linkedTalentAssetId?: number | null;
	latestInterviewId?: number | null;
	createTime?: string;
	updateTime?: string;
}

export interface ResumePoolPageResult {
	list: ResumePoolRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface MeetingRecord {
	id?: number;
	title: string;
	code?: string | null;
	type?: string | null;
	description?: string | null;
	startDate: string;
	endDate: string;
	location?: string | null;
	organizerId: number | undefined;
	organizerName?: string;
	participantIds?: number[];
	participantCount?: number;
	status?: MeetingStatus;
	createTime?: string;
	updateTime?: string;
}

export interface MeetingPageResult {
	list: MeetingRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface TalentAssetRecord {
	id?: number;
	candidateName: string;
	code?: string | null;
	targetDepartmentId: number | undefined;
	targetDepartmentName?: string;
	targetPosition?: string | null;
	source: string;
	tagList?: string[];
	followUpSummary?: string | null;
	nextFollowUpDate?: string | null;
	status?: TalentAssetStatus;
	createTime?: string;
	updateTime?: string;
}

export interface TalentAssetPageResult {
	list: TalentAssetRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface HiringRecord {
	id?: number;
	candidateName: string;
	targetDepartmentId: number | undefined;
	targetDepartmentName?: string | null;
	targetPosition?: string | null;
	sourceType?: HiringSourceType | string | null;
	sourceId?: number | null;
	interviewId?: number | null;
	resumePoolId?: number | null;
	recruitPlanId?: number | null;
	sourceStatusSnapshot?: string | null;
	sourceSnapshot?: RecruitmentSourceSnapshot | null;
	interviewSnapshot?: RecruitmentSourceSnapshot | null;
	resumePoolSnapshot?: RecruitmentSourceSnapshot | null;
	recruitPlanSnapshot?: RecruitmentSourceSnapshot | null;
	hiringDecision?: string | null;
	status?: HiringStatus;
	offeredAt?: string | null;
	acceptedAt?: string | null;
	rejectedAt?: string | null;
	closedAt?: string | null;
	closeReason?: string | null;
	createTime?: string;
	updateTime?: string;
}

export interface HiringPageResult {
	list: HiringRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface TeacherAgentRecord {
	id?: number;
	name: string;
	agentType: string;
	level?: string | null;
	region?: string | null;
	cooperationStatus?: string | null;
	status?: TeacherAgentStatus;
	blacklistStatus?: TeacherAgentBlacklistStatus;
	remark?: string | null;
	ownerEmployeeId?: number | null;
	ownerDepartmentId?: number | null;
	createTime?: string | null;
	updateTime?: string | null;
}

export interface TeacherAgentPageResult {
	list: TeacherAgentRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface TeacherAgentRelationRecord {
	id?: number;
	parentAgentId: number | undefined;
	parentAgentName?: string | null;
	childAgentId: number | undefined;
	childAgentName?: string | null;
	status?: TeacherAgentRelationStatus;
	effectiveTime?: string | null;
	remark?: string | null;
	ownerEmployeeId?: number | null;
	ownerDepartmentId?: number | null;
	createTime?: string | null;
	updateTime?: string | null;
}

export interface TeacherAgentRelationPageResult {
	list: TeacherAgentRelationRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface TeacherAttributionRecord {
	id?: number;
	teacherId?: number | null;
	teacherName?: string | null;
	agentId?: number | null;
	agentName?: string | null;
	attributionType?: string | null;
	status?: TeacherAttributionStatus;
	sourceType?: string | null;
	sourceRemark?: string | null;
	effectiveTime?: string | null;
	operatorId?: number | null;
	operatorName?: string | null;
	createTime?: string | null;
	updateTime?: string | null;
}

export interface TeacherAttributionPageResult {
	list: TeacherAttributionRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface TeacherAttributionConflictRecord {
	id?: number;
	teacherId?: number | null;
	teacherName?: string | null;
	candidateAgentIds?: number[];
	status?: TeacherAttributionConflictStatus;
	resolution?: string | null;
	resolutionRemark?: string | null;
	resolvedBy?: number | null;
	resolvedTime?: string | null;
	currentAgentId?: number | null;
	requestedAgentId?: number | null;
	requestedById?: number | null;
	createTime?: string | null;
	updateTime?: string | null;
}

export interface TeacherAttributionConflictDetail extends TeacherAttributionConflictRecord {
	candidateAgents?: Array<{
		id: number;
		name: string;
	}>;
	currentAgentName?: string | null;
	requestedAgentName?: string | null;
}

export interface TeacherAttributionConflictPageResult {
	list: TeacherAttributionConflictRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface TeacherAttributionInfo {
	teacherId: number;
	teacherName?: string | null;
	currentAttribution?: TeacherAttributionRecord | null;
	openConflictCount?: number;
	openConflicts?: TeacherAttributionConflictRecord[];
	history?: TeacherAttributionRecord[];
}

export interface TeacherAgentAuditRecord {
	id?: number;
	resourceType?: string | null;
	resourceId?: number | null;
	action?: string | null;
	beforeSnapshot?: Record<string, any> | null;
	afterSnapshot?: Record<string, any> | null;
	operatorId?: number | null;
	operatorName?: string | null;
	createTime?: string | null;
	updateTime?: string | null;
}

export interface TeacherAgentAuditPageResult {
	list: TeacherAgentAuditRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface TeacherInfoRecord {
	id?: number;
	teacherName: string;
	phone?: string | null;
	wechat?: string | null;
	schoolName?: string | null;
	schoolRegion?: string | null;
	schoolType?: string | null;
	grade?: string | null;
	className?: string | null;
	subject?: string | null;
	projectTags?: string[] | string | null;
	intentionLevel?: string | null;
	communicationStyle?: string | null;
	cooperationStatus?: TeacherCooperationStatus;
	ownerEmployeeId?: number | null;
	ownerEmployeeName?: string | null;
	ownerDepartmentId?: number | null;
	ownerDepartmentName?: string | null;
	lastFollowTime?: string | null;
	nextFollowTime?: string | null;
	cooperationTime?: string | null;
	classCount?: number | null;
	createTime?: string | null;
	updateTime?: string | null;
	[key: string]: unknown;
}

export interface TeacherInfoPageResult {
	list: TeacherInfoRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface TeacherFollowRecord {
	id?: number;
	teacherId?: number | null;
	followTime?: string | null;
	followMethod?: string | null;
	content?: string | null;
	followContent?: string | null;
	remark?: string | null;
	nextFollowTime?: string | null;
	createTime?: string | null;
	operatorName?: string | null;
	creatorEmployeeName?: string | null;
	creatorName?: string | null;
	[key: string]: unknown;
}

export interface TeacherFollowPageResult {
	list: TeacherFollowRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface TeacherClassRecord {
	id?: number;
	classId?: number;
	teacherId: number | undefined;
	teacherName?: string | null;
	className: string;
	schoolName?: string | null;
	grade?: string | null;
	projectTag?: string | null;
	studentCount?: number | null;
	status?: TeacherClassStatus;
	ownerEmployeeId?: number | null;
	ownerDepartmentId?: number | null;
	createTime?: string | null;
	updateTime?: string | null;
	[key: string]: unknown;
}

export interface TeacherClassPageResult {
	list: TeacherClassRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface TeacherDashboardDistributionItem {
	key?: string | null;
	label?: string | null;
	name?: string | null;
	status?: string | null;
	value?: number | null;
	count?: number | null;
	[key: string]: unknown;
}

export interface TeacherDashboardSummary {
	resourceTotal?: number | null;
	pendingFollowCount?: number | null;
	overdueFollowCount?: number | null;
	partneredCount?: number | null;
	classCount?: number | null;
	memberDistribution?: TeacherDashboardDistributionItem[];
	cooperationDistribution?: TeacherDashboardDistributionItem[];
	classStatusDistribution?: TeacherDashboardDistributionItem[];
	[key: string]: unknown;
}

export interface TeacherTodoRecord {
	id?: number;
	teacherId?: number | null;
	teacherName?: string | null;
	phone?: string | null;
	wechat?: string | null;
	schoolName?: string | null;
	schoolRegion?: string | null;
	subject?: string | null;
	ownerEmployeeName?: string | null;
	lastFollowTime?: string | null;
	nextFollowTime?: string | null;
	cooperationStatus?: TeacherCooperationStatus;
	todoBucket?: TeacherTodoBucket;
	[key: string]: unknown;
}

export interface TeacherTodoPageResult {
	list: TeacherTodoRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
	bucketSummary?: {
		today?: number;
		overdue?: number;
	};
}

export interface JobStandardRecord {
	id?: number;
	positionName: string;
	targetDepartmentId: number | undefined;
	targetDepartmentName?: string;
	jobLevel?: string | null;
	profileSummary?: string | null;
	requirementSummary?: string | null;
	skillTagList?: string[];
	interviewTemplateSummary?: string | null;
	status?: JobStandardStatus;
	createTime?: string;
	updateTime?: string;
}

export interface JobStandardPageResult {
	list: JobStandardRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface RecruitmentSourceSnapshot {
	sourceResource?: RecruitmentSourceResource | null;
	jobStandardId?: number | null;
	jobStandardPositionName?: string | null;
	jobStandardRequirementSummary?: string | null;
	recruitPlanId?: number | null;
	recruitPlanTitle?: string | null;
	recruitPlanStatus?: RecruitPlanStatus | null;
	resumePoolId?: number | null;
	interviewId?: number | null;
	candidateName?: string | null;
	targetDepartmentId?: number | null;
	targetDepartmentName?: string | null;
	targetPosition?: string | null;
	interviewStatus?: InterviewStatus | null;
	sourceStatusSnapshot?: string | null;
}

export interface PipTrackRecord {
	id?: number;
	pipId?: number;
	recordDate: string;
	progress: string;
	nextPlan?: string;
	operatorId?: number;
	operatorName?: string;
	createTime?: string;
}

export interface PipRecord {
	id?: number;
	assessmentId?: number | null;
	employeeId: number | undefined;
	employeeName?: string;
	ownerId: number | undefined;
	ownerName?: string;
	title: string;
	improvementGoal: string;
	sourceReason: string;
	startDate: string;
	endDate: string;
	status?: string;
	resultSummary?: string;
	createTime?: string;
	updateTime?: string;
	trackRecords?: PipTrackRecord[];
}

export interface PipPageResult {
	list: PipRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface PipExportRow {
	id: number;
	assessmentId?: number | null;
	employeeId: number;
	employeeName?: string;
	ownerId: number;
	ownerName?: string;
	title: string;
	startDate: string;
	endDate: string;
	status: string;
	createTime?: string;
	updateTime?: string;
}

export type IndicatorCategory = 'assessment' | 'goal' | 'feedback';
export type IndicatorApplyScope = 'all' | 'department' | 'employee';

export interface IndicatorRecord {
	id?: number;
	name: string;
	code: string;
	category: IndicatorCategory;
	weight: number;
	scoreScale: number;
	applyScope: IndicatorApplyScope;
	description: string;
	status: number;
	createTime?: string;
	updateTime?: string;
}

export interface IndicatorPageResult {
	list: IndicatorRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export type FeedbackRelationType = '上级' | '同级' | '下级' | '协作人';

export interface FeedbackTaskRelationItem {
	feedbackUserId: number;
	feedbackUserName?: string;
	relationType: FeedbackRelationType | string;
}

export interface FeedbackRecord {
	id?: number;
	taskId?: number;
	feedbackUserId?: number;
	feedbackUserName?: string;
	relationType: FeedbackRelationType | string;
	score: number;
	content?: string;
	status?: string;
	submitTime?: string;
	createTime?: string;
}

export interface FeedbackSummary {
	taskId: number;
	averageScore: number;
	submittedCount: number;
	totalCount: number;
	records: FeedbackRecord[];
}

export interface FeedbackTaskRecord {
	id?: number;
	assessmentId?: number | null;
	employeeId: number | undefined;
	employeeName?: string;
	title: string;
	deadline?: string;
	status?: string;
	submittedCount?: number;
	totalCount?: number;
	createTime?: string;
	updateTime?: string;
	feedbackUserIds?: number[];
	relationTypes?: FeedbackTaskRelationItem[];
}

export interface FeedbackPageResult {
	list: FeedbackTaskRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface FeedbackExportRow {
	taskId: number;
	assessmentId?: number | null;
	employeeId: number;
	title: string;
	deadline?: string;
	averageScore: number;
	submittedCount: number;
	totalCount: number;
}

export interface SalaryChangeRecord {
	id?: number;
	salaryId?: number;
	beforeAmount: number;
	adjustAmount: number;
	afterAmount: number;
	changeReason: string;
	operatorId?: number;
	operatorName?: string;
	createTime?: string;
}

export interface SalaryRecord {
	id?: number;
	employeeId: number | undefined;
	employeeName?: string;
	assessmentId?: number | null;
	periodValue: string;
	baseSalary: number;
	performanceBonus: number;
	adjustAmount: number;
	finalAmount: number;
	grade?: string;
	effectiveDate: string;
	status?: string;
	createTime?: string;
	updateTime?: string;
	changeRecords?: SalaryChangeRecord[];
}

export interface SalaryPageResult {
	list: SalaryRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface PromotionReviewRecord {
	id?: number;
	promotionId?: number;
	reviewerId: number;
	reviewerName?: string;
	decision: 'approved' | 'rejected';
	comment?: string;
	createTime?: string;
}

export interface PromotionRecord {
	id?: number;
	assessmentId?: number | null | undefined;
	employeeId: number | undefined;
	employeeName?: string;
	sponsorId: number | undefined;
	sponsorName?: string;
	fromPosition: string;
	toPosition: string;
	reason: string;
	sourceReason: string;
	status?: string;
	reviewTime?: string;
	createTime?: string;
	updateTime?: string;
	reviewRecords?: PromotionReviewRecord[];
}

export interface PromotionPageResult {
	list: PromotionRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export type SuggestionType = 'pip' | 'promotion';
export type SuggestionStatus = 'pending' | 'accepted' | 'ignored' | 'rejected' | 'revoked';
export type SuggestionRevokeReasonCode =
	| 'thresholdError'
	| 'assessmentCorrected'
	| 'scopeError'
	| 'duplicateSuggestion';

export interface SuggestionRecord {
	id?: number;
	suggestionType: SuggestionType;
	status?: SuggestionStatus;
	assessmentId?: number;
	employeeId?: number;
	employeeName?: string;
	departmentId?: number;
	departmentName?: string;
	periodType?: string;
	periodValue?: string;
	triggerLabel?: string;
	createTime?: string;
	handleTime?: string;
	handlerId?: number | null;
	handlerName?: string | null;
	ruleVersion?: string;
	revokeReason?: string;
	linkedEntityType?: string | null;
	linkedEntityId?: number | null;
}

export interface SuggestionPageResult {
	list: SuggestionRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface SuggestionAcceptResult {
	suggestion?: SuggestionRecord;
	prefill?: {
		assessmentId?: number;
		employeeId?: number;
		suggestionType?: SuggestionType;
		suggestionId?: number;
	};
}

export type AssetStatus =
	| 'pendingInbound'
	| 'available'
	| 'assigned'
	| 'maintenance'
	| 'inTransfer'
	| 'inventorying'
	| 'scrapped'
	| 'lost';
export type AssetAssignmentStatus = 'assigned' | 'returned' | 'lost';
export type AssetMaintenanceStatus = 'scheduled' | 'inProgress' | 'completed' | 'cancelled';
export type AssetProcurementStatus = 'draft' | 'submitted' | 'received' | 'cancelled';
export type AssetTransferStatus = 'draft' | 'submitted' | 'inTransit' | 'completed' | 'cancelled';
export type AssetInventoryStatus = 'draft' | 'counting' | 'completed' | 'closed';
export type AssetDisposalStatus = 'draft' | 'submitted' | 'approved' | 'scrapped' | 'cancelled';

export interface AssetStatusDistributionItem {
	status: AssetStatus;
	count: number;
	amount?: number;
}

export interface AssetCategoryDistributionItem {
	category: string;
	count: number;
	amount?: number;
}

export interface AssetDashboardActivityItem {
	id?: number;
	module:
		| 'assetInfo'
		| 'assetAssignment'
		| 'assetMaintenance'
		| 'assetProcurement'
		| 'assetTransfer'
		| 'assetInventory'
		| 'assetDisposal'
		| 'assetDepreciation';
	actionLabel?: string;
	title: string;
	objectNo?: string;
	objectName?: string;
	resultStatus?: string;
	assetId?: number | null;
	departmentId?: number | null;
	departmentName?: string;
	documentKey?: string | null;
	status?: string;
	operatorName?: string;
	occurredAt?: string;
}

export interface AssetDashboardActionSummaryItem {
	actionCount: number;
	assetCount: number;
	documentCount: number;
}

export interface AssetDashboardSummary {
	totalAssetCount: number;
	pendingInboundCount: number;
	availableCount: number;
	assignedCount: number;
	maintenanceCount: number;
	inventoryingCount: number;
	scrappedCount: number;
	lostCount: number;
	totalOriginalAmount: number;
	monthlyDepreciationAmount: number;
	pendingDisposalCount: number;
	expiringWarrantyCount: number;
	statusDistribution: AssetStatusDistributionItem[];
	categoryDistribution: AssetCategoryDistributionItem[];
	actionOverview: {
		today: AssetDashboardActionSummaryItem;
		thisWeek: AssetDashboardActionSummaryItem;
		thisMonth: AssetDashboardActionSummaryItem;
	};
	actionTimeline: AssetDashboardActivityItem[];
	recentActivities: AssetDashboardActivityItem[];
	updatedAt?: string;
}

export interface AssetInfoRecord {
	id?: number;
	assetNo: string;
	name: string;
	category: string;
	assetStatus?: AssetStatus;
	assetType?: string;
	brand?: string;
	model?: string;
	serialNo?: string;
	location?: string;
	departmentId?: number;
	departmentName?: string;
	managerId?: number;
	managerName?: string;
	purchaseDate?: string;
	purchaseAmount?: number;
	supplierId?: number | null;
	supplierName?: string;
	purchaseOrderId?: number | null;
	warrantyExpiry?: string;
	residualValue?: number;
	depreciationMonths?: number;
	depreciationStartMonth?: string;
	remark?: string;
	createTime?: string;
	updateTime?: string;
}

export interface AssetInfoPageResult {
	list: AssetInfoRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface AssetAssignmentRecord {
	id?: number;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	assigneeId?: number;
	assigneeName?: string;
	departmentId?: number;
	departmentName?: string;
	assignDate: string;
	expectedReturnDate?: string;
	actualReturnDate?: string;
	purpose?: string;
	returnRemark?: string;
	status?: AssetAssignmentStatus;
	createTime?: string;
	updateTime?: string;
}

export interface AssetAssignmentPageResult {
	list: AssetAssignmentRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface AssetMaintenanceRecord {
	id?: number;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	maintenanceType?: string;
	vendorName?: string;
	cost?: number;
	planDate?: string;
	startDate?: string;
	completeDate?: string;
	description?: string;
	resultSummary?: string;
	status?: AssetMaintenanceStatus;
	createTime?: string;
	updateTime?: string;
}

export interface AssetMaintenancePageResult {
	list: AssetMaintenanceRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface AssetProcurementRecord {
	id?: number;
	procurementNo?: string;
	title: string;
	assetCategory: string;
	quantity: number;
	amount: number;
	departmentId?: number;
	departmentName?: string;
	requesterId?: number;
	requesterName?: string;
	supplierId?: number | null;
	supplierName?: string;
	purchaseOrderId?: number | null;
	expectedArrivalDate?: string;
	receiveDate?: string;
	remark?: string;
	status?: AssetProcurementStatus;
	createTime?: string;
	updateTime?: string;
}

export interface AssetProcurementPageResult {
	list: AssetProcurementRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface AssetTransferRecord {
	id?: number;
	transferNo?: string;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	fromDepartmentId?: number;
	fromDepartmentName?: string;
	toDepartmentId?: number;
	toDepartmentName?: string;
	fromLocation?: string;
	toLocation?: string;
	applicantId?: number;
	applicantName?: string;
	submitTime?: string;
	completeTime?: string;
	remark?: string;
	status?: AssetTransferStatus;
	createTime?: string;
	updateTime?: string;
}

export interface AssetTransferPageResult {
	list: AssetTransferRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface AssetInventoryRecord {
	id?: number;
	inventoryNo?: string;
	scopeLabel?: string;
	departmentId?: number;
	departmentName?: string;
	location?: string;
	ownerId?: number;
	ownerName?: string;
	plannedDate?: string;
	completedDate?: string;
	assetCount?: number;
	matchedCount?: number;
	differenceCount?: number;
	remark?: string;
	status?: AssetInventoryStatus;
	createTime?: string;
	updateTime?: string;
}

export interface AssetInventoryPageResult {
	list: AssetInventoryRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface AssetDepreciationSummary {
	month?: string;
	assetCount: number;
	totalOriginalAmount: number;
	totalAccumulatedDepreciation: number;
	totalNetValue: number;
	currentMonthDepreciation: number;
	lastRecalculatedAt?: string;
}

export interface AssetDepreciationRecord {
	id?: number;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	departmentId?: number;
	departmentName?: string;
	depreciationMonth: string;
	originalAmount: number;
	residualValue: number;
	monthlyDepreciation: number;
	accumulatedDepreciation: number;
	netValue: number;
	updateTime?: string;
}

export interface AssetDepreciationPageResult {
	list: AssetDepreciationRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface AssetDisposalRecord {
	id?: number;
	disposalNo?: string;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	assetStatus?: AssetStatus;
	departmentId?: number;
	departmentName?: string;
	applicantId?: number;
	applicantName?: string;
	reason: string;
	estimatedResidualAmount?: number;
	submitTime?: string;
	approveTime?: string;
	executeTime?: string;
	remark?: string;
	status?: AssetDisposalStatus;
	createTime?: string;
	updateTime?: string;
}

export interface AssetDisposalPageResult {
	list: AssetDisposalRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export interface AssetReportSummary {
	assetCount: number;
	totalOriginalAmount: number;
	totalNetValue: number;
	assignedCount: number;
	maintenanceCount: number;
	scrappedCount: number;
	lostCount: number;
}

export interface AssetReportRecord {
	id?: number;
	reportDate?: string;
	assetId?: number;
	assetNo?: string;
	assetName?: string;
	category?: string;
	departmentId?: number;
	departmentName?: string;
	assetStatus?: AssetStatus;
	originalAmount?: number;
	netValue?: number;
	monthlyDepreciation?: number;
	disposalStatus?: AssetDisposalStatus;
	remark?: string;
}

export interface AssetReportPageResult {
	list: AssetReportRecord[];
	pagination: {
		page: number;
		size: number;
		total: number;
	};
}

export function createEmptyAssessment(): AssessmentRecord {
	return {
		employeeId: undefined,
		assessorId: undefined,
		departmentId: undefined,
		periodType: 'quarter',
		periodValue: '',
		targetCompletion: 0,
		selfEvaluation: '',
		scoreItems: [
			{
				indicatorName: '',
				score: 0,
				weight: 100,
				comment: ''
			}
		]
	};
}

export function createEmptyGoal(): GoalRecord {
	return {
		employeeId: undefined,
		departmentId: undefined,
		title: '',
		description: '',
		targetValue: 0,
		currentValue: 0,
		unit: '',
		weight: 0,
		startDate: '',
		endDate: '',
		progressRecords: []
	};
}

export function createEmptyGoalOpsDepartmentConfig(): GoalOpsDepartmentConfig {
	return {
		departmentId: undefined,
		departmentName: '',
		assignTime: '09:00',
		submitDeadline: '18:00',
		reportSendTime: '18:30',
		reportPushMode: 'system_and_group',
		reportPushTarget: ''
	};
}

export function createEmptyGoalOpsAccessProfile(): GoalOpsAccessProfile {
	return {
		departmentId: null,
		isHr: false,
		canManageDepartment: false,
		canMaintainPersonalPlan: false,
		manageableDepartmentIds: []
	};
}

export function createEmptyGoalOpsPlan(currentUserId?: number): GoalOpsPlanRecord {
	return {
		employeeId: currentUserId,
		departmentId: undefined,
		periodType: 'day',
		planDate: '',
		periodStartDate: '',
		periodEndDate: '',
		sourceType: 'public',
		title: '',
		description: '',
		targetValue: 0,
		actualValue: 0,
		unit: '',
		status: 'assigned',
		parentPlanId: null,
		isSystemGenerated: false
	};
}

export function createEmptyRecruitPlan(): RecruitPlanRecord {
	return {
		title: '',
		targetDepartmentId: undefined,
		positionName: '',
		headcount: 1,
		startDate: '',
		endDate: '',
		recruiterId: undefined,
		requirementSummary: '',
		jobStandardId: undefined,
		jobStandardPositionName: '',
		jobStandardSummary: null,
		jobStandardSnapshot: null,
		sourceSnapshot: null,
		status: 'draft'
	};
}

export function createEmptyContract(): ContractRecord {
	return {
		employeeId: undefined,
		type: 'full-time',
		title: '',
		contractNumber: '',
		startDate: '',
		endDate: '',
		probationPeriod: null,
		salary: null,
		position: '',
		departmentId: undefined,
		status: 'draft'
	};
}

export function createEmptyPurchaseOrder(): PurchaseOrderRecord {
	return {
		orderNo: '',
		title: '',
		supplierId: undefined,
		departmentId: undefined,
		requesterId: undefined,
		orderDate: '',
		expectedDeliveryDate: '',
		totalAmount: 0,
		currency: 'CNY',
		approvedBy: '',
		approvedAt: '',
		approvalRemark: '',
		closedReason: '',
		receivedQuantity: 0,
		receivedAt: '',
		items: [createEmptyPurchaseOrderItem()],
		inquiryRecords: [],
		approvalLogs: [],
		receiptRecords: [],
		remark: '',
		status: 'draft'
	};
}

export function createEmptyPurchaseOrderItem(): PurchaseOrderItemRecord {
	return {
		itemName: '',
		specification: '',
		unit: '',
		quantity: 1,
		unitPrice: 0,
		amount: 0,
		remark: ''
	};
}

export function createEmptySupplier(): SupplierRecord {
	return {
		name: '',
		code: '',
		category: '',
		contactName: '',
		contactPhone: '',
		contactEmail: '',
		bankAccount: '',
		taxNo: '',
		remark: '',
		status: 'active'
	};
}

export function createEmptyCapabilityModel(): CapabilityModelRecord {
	return {
		name: '',
		code: '',
		category: '',
		description: '',
		status: 'draft',
		itemCount: 0
	};
}

export function createEmptyCertificate(): CertificateRecord {
	return {
		name: '',
		code: '',
		category: '',
		issuer: '',
		description: '',
		validityMonths: null,
		sourceCourseId: null,
		status: 'draft',
		issuedCount: 0
	};
}

export function createEmptyCourse(): CourseRecord {
	return {
		title: '',
		code: '',
		category: '',
		description: '',
		startDate: '',
		endDate: '',
		status: 'draft',
		enrollmentCount: 0
	};
}

export function createEmptyDocumentCenter(): DocumentCenterRecord {
	return {
		fileNo: '',
		fileName: '',
		category: 'policy',
		fileType: 'pdf',
		storage: 'local',
		confidentiality: 'internal',
		ownerName: '',
		department: '',
		status: 'draft',
		version: 'v1.0.0',
		sizeMb: 0,
		downloadCount: 0,
		expireDate: '',
		tags: [],
		notes: ''
	};
}

export function createEmptyKnowledgeBase(): KnowledgeBaseRecord {
	return {
		kbNo: '',
		title: '',
		category: '',
		summary: '',
		ownerName: '',
		status: 'draft',
		tags: [],
		relatedFileIds: [],
		relatedTopics: [],
		importance: 60,
		viewCount: 0
	};
}

export function createEmptyKnowledgeQa(): KnowledgeQaRecord {
	return {
		question: '',
		answer: '',
		relatedKnowledgeIds: [],
		relatedFileIds: []
	};
}

export function createEmptyInterview(): InterviewRecord {
	return {
		candidateName: '',
		position: '',
		departmentId: undefined,
		interviewerId: undefined,
		interviewDate: '',
		interviewType: 'technical',
		score: null,
		resumePoolId: undefined,
		recruitPlanId: undefined,
		sourceSnapshot: null,
		resumePoolSnapshot: null,
		recruitPlanSnapshot: null,
		status: 'scheduled'
	};
}

export function createEmptyResumePool(): ResumePoolRecord {
	return {
		candidateName: '',
		targetDepartmentId: undefined,
		targetPosition: '',
		phone: '',
		email: '',
		resumeText: '',
		sourceType: 'manual',
		sourceRemark: '',
		externalLink: '',
		recruitPlanId: undefined,
		recruitPlanTitle: '',
		jobStandardId: undefined,
		jobStandardPositionName: '',
		sourceSnapshot: null,
		recruitPlanSnapshot: null,
		jobStandardSnapshot: null,
		attachmentIdList: [],
		attachmentSummaryList: [],
		status: 'new'
	};
}

export function createEmptyMeeting(currentUserId?: number): MeetingRecord {
	return {
		title: '',
		code: '',
		type: '',
		description: '',
		startDate: '',
		endDate: '',
		location: '',
		organizerId: currentUserId || undefined,
		participantIds: [],
		participantCount: 0,
		status: 'scheduled'
	};
}

export function createEmptyTalentAsset(): TalentAssetRecord {
	return {
		candidateName: '',
		code: '',
		targetDepartmentId: undefined,
		targetPosition: '',
		source: '',
		tagList: [],
		followUpSummary: '',
		nextFollowUpDate: '',
		status: 'new'
	};
}

export function createEmptyHiring(): HiringRecord {
	return {
		candidateName: '',
		targetDepartmentId: undefined,
		targetPosition: '',
		sourceType: 'manual',
		sourceId: undefined,
		interviewId: undefined,
		resumePoolId: undefined,
		recruitPlanId: undefined,
		sourceStatusSnapshot: '',
		sourceSnapshot: null,
		interviewSnapshot: null,
		resumePoolSnapshot: null,
		recruitPlanSnapshot: null,
		hiringDecision: '',
		status: 'offered',
		closeReason: ''
	};
}

export function createEmptyTeacherInfo(): TeacherInfoRecord {
	return {
		teacherName: '',
		phone: '',
		wechat: '',
		schoolName: '',
		schoolRegion: '',
		schoolType: '',
		grade: '',
		className: '',
		subject: '',
		projectTags: [],
		intentionLevel: '',
		communicationStyle: '',
		cooperationStatus: 'uncontacted',
		ownerEmployeeId: undefined,
		nextFollowTime: ''
	};
}

export function createEmptyTeacherFollow(): TeacherFollowRecord {
	return {
		teacherId: undefined,
		content: '',
		nextFollowTime: ''
	};
}

export function createEmptyTeacherClass(): TeacherClassRecord {
	return {
		teacherId: undefined,
		className: '',
		schoolName: '',
		grade: '',
		projectTag: '',
		studentCount: 0,
		status: 'draft'
	};
}

export function createEmptyTeacherAgent(): TeacherAgentRecord {
	return {
		name: '',
		agentType: 'institution',
		level: '',
		region: '',
		cooperationStatus: '',
		status: 'active',
		blacklistStatus: 'normal',
		remark: ''
	};
}

export function createEmptyTeacherAgentRelation(): TeacherAgentRelationRecord {
	return {
		parentAgentId: undefined,
		childAgentId: undefined,
		status: 'active',
		effectiveTime: '',
		remark: ''
	};
}

export function createEmptyTeacherAttribution(): TeacherAttributionRecord {
	return {
		teacherId: undefined,
		teacherName: '',
		agentId: undefined,
		agentName: '',
		attributionType: 'manual',
		status: 'pending',
		sourceType: 'manual',
		sourceRemark: '',
		effectiveTime: ''
	};
}

export function createEmptyJobStandard(): JobStandardRecord {
	return {
		positionName: '',
		targetDepartmentId: undefined,
		jobLevel: '',
		profileSummary: '',
		requirementSummary: '',
		skillTagList: [],
		interviewTemplateSummary: '',
		status: 'draft'
	};
}

export function createEmptyPip(): PipRecord {
	return {
		assessmentId: null,
		employeeId: undefined,
		ownerId: undefined,
		title: '',
		improvementGoal: '',
		sourceReason: '',
		startDate: '',
		endDate: '',
		status: 'draft',
		resultSummary: '',
		trackRecords: []
	};
}

export function createEmptyIndicator(): IndicatorRecord {
	return {
		name: '',
		code: '',
		category: 'assessment',
		weight: 0,
		scoreScale: 100,
		applyScope: 'all',
		description: '',
		status: 1
	};
}

export function createEmptyFeedbackTask(): FeedbackTaskRecord {
	return {
		assessmentId: null,
		employeeId: undefined,
		title: '',
		deadline: '',
		feedbackUserIds: [],
		relationTypes: []
	};
}

export function createEmptySalary(): SalaryRecord {
	return {
		employeeId: undefined,
		assessmentId: null,
		periodValue: '',
		baseSalary: 0,
		performanceBonus: 0,
		adjustAmount: 0,
		finalAmount: 0,
		effectiveDate: '',
		changeRecords: []
	};
}

export function createEmptyPromotion(currentUserId?: number): PromotionRecord {
	return {
		assessmentId: undefined,
		employeeId: undefined,
		sponsorId: currentUserId,
		fromPosition: '',
		toPosition: '',
		reason: '',
		sourceReason: '',
		reviewRecords: []
	};
}

export function createEmptyAssetInfo(): AssetInfoRecord {
	return {
		assetNo: '',
		name: '',
		category: '',
		assetStatus: 'available',
		assetType: '',
		brand: '',
		model: '',
		serialNo: '',
		location: '',
		departmentId: undefined,
		managerId: undefined,
		purchaseDate: '',
		purchaseAmount: 0,
		supplierId: undefined,
		purchaseOrderId: undefined,
		warrantyExpiry: '',
		residualValue: 0,
		depreciationMonths: 0,
		depreciationStartMonth: '',
		remark: ''
	};
}

export function createEmptyAssetAssignment(): AssetAssignmentRecord {
	return {
		assetId: undefined,
		assigneeId: undefined,
		departmentId: undefined,
		assignDate: '',
		expectedReturnDate: '',
		actualReturnDate: '',
		purpose: '',
		returnRemark: '',
		status: 'assigned'
	};
}

export function createEmptyAssetMaintenance(): AssetMaintenanceRecord {
	return {
		assetId: undefined,
		maintenanceType: '保养',
		vendorName: '',
		cost: 0,
		planDate: '',
		startDate: '',
		completeDate: '',
		description: '',
		resultSummary: '',
		status: 'scheduled'
	};
}

export function createEmptyAssetProcurement(): AssetProcurementRecord {
	return {
		title: '',
		assetCategory: '',
		quantity: 1,
		amount: 0,
		departmentId: undefined,
		requesterId: undefined,
		supplierId: undefined,
		purchaseOrderId: undefined,
		expectedArrivalDate: '',
		receiveDate: '',
		remark: '',
		status: 'draft'
	};
}

export function createEmptyAssetTransfer(): AssetTransferRecord {
	return {
		assetId: undefined,
		fromDepartmentId: undefined,
		toDepartmentId: undefined,
		fromLocation: '',
		toLocation: '',
		applicantId: undefined,
		remark: '',
		status: 'draft'
	};
}

export function createEmptyAssetInventory(): AssetInventoryRecord {
	return {
		scopeLabel: '',
		departmentId: undefined,
		location: '',
		ownerId: undefined,
		plannedDate: '',
		completedDate: '',
		assetCount: 0,
		matchedCount: 0,
		differenceCount: 0,
		remark: '',
		status: 'draft'
	};
}

export function createEmptyAssetDisposal(): AssetDisposalRecord {
	return {
		assetId: undefined,
		departmentId: undefined,
		applicantId: undefined,
		reason: '',
		estimatedResidualAmount: 0,
		remark: '',
		status: 'draft'
	};
}
