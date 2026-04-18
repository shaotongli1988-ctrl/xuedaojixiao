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
export type CourseStatus = 'draft' | 'published' | 'closed';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';
export type InterviewType = 'technical' | 'behavioral' | 'manager' | 'hr';
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TalentAssetStatus = 'new' | 'tracking' | 'archived';

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

export type FeedbackRelationType =
	| '上级'
	| '同级'
	| '下级'
	| '协作人';

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
export type SuggestionStatus =
	| 'pending'
	| 'accepted'
	| 'ignored'
	| 'rejected'
	| 'revoked';
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

export function createEmptyInterview(): InterviewRecord {
	return {
		candidateName: '',
		position: '',
		departmentId: undefined,
		interviewerId: undefined,
		interviewDate: '',
		interviewType: 'technical',
		score: null,
		status: 'scheduled'
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
