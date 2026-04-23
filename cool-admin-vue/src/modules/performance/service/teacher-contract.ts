/**
 * 文件职责：定义教师渠道关键响应的前端 runtime 契约解码器。
 * 不负责发请求、页面筛选器默认值或交互文案。
 * 维护重点：优先校验教师、代理、归因等主链路页面真实依赖的字段，避免后端异常结构破坏列表和详情态。
 */

import type {
	JsonObject,
	TeacherAgentAuditPageResult,
	TeacherAgentAuditRecord,
	TeacherAgentPageResult,
	TeacherAgentRecord,
	TeacherAgentRelationPageResult,
	TeacherAgentRelationRecord,
	TeacherClassPageResult,
	TeacherClassRecord,
	TeacherDashboardDistributionItem,
	TeacherDashboardSummary,
	TeacherAttributionConflictRecord,
	TeacherAttributionConflictDetail,
	TeacherAttributionConflictPageResult,
	TeacherAttributionConflictResolveResult,
	TeacherAttributionPageResult,
	TeacherFollowPageResult,
	TeacherFollowRecord,
	TeacherAttributionInfo,
	TeacherAttributionRecord,
	TeacherInfoPageResult,
	TeacherInfoRecord,
	TeacherTodoPageResult,
	TeacherTodoRecord
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNullableString,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalEnum,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';
import {
	TEACHER_AGENT_BLACKLIST_STATUS,
	TEACHER_AGENT_RELATION_STATUS,
	TEACHER_AGENT_STATUS,
	TEACHER_ATTRIBUTION_CONFLICT_STATUS,
	TEACHER_ATTRIBUTION_STATUS,
	TEACHER_CLASS_STATUS,
	TEACHER_COOPERATION_STATUS,
	TEACHER_TODO_BUCKET
} from '../shared/contract-enums';

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableString(value, field);
}

function decodeOptionalNullableNumber(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableNumber(value, field);
}

function decodeProjectTags(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null || typeof value === 'string') {
		return value;
	}

	return expectPerformanceServiceArray(value, field).map((item, index) =>
		expectPerformanceServiceString(item, `${field}[${index}]`)
	);
}

export function decodeTeacherAttributionRecord(
	value: unknown,
	field = 'teacherAttributionRecord'
): TeacherAttributionRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		status: expectPerformanceServiceOptionalEnum(
			record.status,
			`${field}.status`,
			TEACHER_ATTRIBUTION_STATUS
		),
		teacherId: decodeOptionalNullableNumber(record.teacherId, `${field}.teacherId`),
		teacherName: decodeOptionalNullableString(record.teacherName, `${field}.teacherName`),
		agentId: decodeOptionalNullableNumber(record.agentId, `${field}.agentId`),
		agentName: decodeOptionalNullableString(record.agentName, `${field}.agentName`),
		attributionType: decodeOptionalNullableString(
			record.attributionType,
			`${field}.attributionType`
		),
		sourceType: decodeOptionalNullableString(record.sourceType, `${field}.sourceType`),
		sourceRemark: decodeOptionalNullableString(record.sourceRemark, `${field}.sourceRemark`),
		effectiveTime: decodeOptionalNullableString(record.effectiveTime, `${field}.effectiveTime`),
		operatorId: decodeOptionalNullableNumber(record.operatorId, `${field}.operatorId`),
		operatorName: decodeOptionalNullableString(record.operatorName, `${field}.operatorName`),
		createTime: decodeOptionalNullableString(record.createTime, `${field}.createTime`),
		updateTime: decodeOptionalNullableString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeTeacherAttributionInfo(
	value: unknown,
	field = 'teacherAttributionInfo'
): TeacherAttributionInfo {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		teacherId: expectPerformanceServiceNumber(record.teacherId, `${field}.teacherId`),
		openConflictCount: expectPerformanceServiceOptionalNumber(
			record.openConflictCount,
			`${field}.openConflictCount`
		),
		teacherName: decodeOptionalNullableString(record.teacherName, `${field}.teacherName`),
		currentAttribution:
			record.currentAttribution == null
				? null
				: decodeTeacherAttributionRecord(
						record.currentAttribution,
						`${field}.currentAttribution`
					),
		openConflicts:
			record.openConflicts === undefined
				? undefined
				: expectPerformanceServiceArray(record.openConflicts, `${field}.openConflicts`).map(
						(item, index) =>
							decodeTeacherAttributionConflictRecord(
								item,
								`${field}.openConflicts[${index}]`
							)
					),
		history:
			record.history === undefined
				? undefined
				: expectPerformanceServiceArray(record.history, `${field}.history`).map(
						(item, index) =>
							decodeTeacherAttributionRecord(item, `${field}.history[${index}]`)
					)
	};
}

export function decodeTeacherAttributionPageResult(
	value: unknown,
	field = 'teacherAttributionPageResult'
): TeacherAttributionPageResult {
	return decodePerformanceServicePageResult(value, field, decodeTeacherAttributionRecord);
}

export function decodeTeacherAttributionInfoOrRecord(
	value: unknown,
	field = 'teacherAttributionInfoOrRecord'
): TeacherAttributionInfo | TeacherAttributionRecord {
	const record = expectPerformanceServiceRecord(value, field);

	if (
		'openConflictCount' in record ||
		'currentAttribution' in record ||
		'openConflicts' in record ||
		'history' in record
	) {
		return decodeTeacherAttributionInfo(record, field);
	}

	return decodeTeacherAttributionRecord(record, field);
}

export function decodeTeacherAttributionConflictRecord(
	value: unknown,
	field = 'teacherAttributionConflictRecord'
): TeacherAttributionConflictRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		status: expectPerformanceServiceOptionalEnum(
			record.status,
			`${field}.status`,
			TEACHER_ATTRIBUTION_CONFLICT_STATUS
		),
		candidateAgentIds:
			record.candidateAgentIds === undefined
				? undefined
				: expectPerformanceServiceArray(
						record.candidateAgentIds,
						`${field}.candidateAgentIds`
					).map((item, index) =>
						expectPerformanceServiceNumber(item, `${field}.candidateAgentIds[${index}]`)
					),
		teacherId: decodeOptionalNullableNumber(record.teacherId, `${field}.teacherId`),
		teacherName: decodeOptionalNullableString(record.teacherName, `${field}.teacherName`),
		resolution: decodeOptionalNullableString(record.resolution, `${field}.resolution`),
		resolutionRemark: decodeOptionalNullableString(
			record.resolutionRemark,
			`${field}.resolutionRemark`
		),
		resolvedBy: decodeOptionalNullableNumber(record.resolvedBy, `${field}.resolvedBy`),
		resolvedTime: decodeOptionalNullableString(record.resolvedTime, `${field}.resolvedTime`),
		currentAgentId: decodeOptionalNullableNumber(
			record.currentAgentId,
			`${field}.currentAgentId`
		),
		requestedAgentId: decodeOptionalNullableNumber(
			record.requestedAgentId,
			`${field}.requestedAgentId`
		),
		requestedById: decodeOptionalNullableNumber(record.requestedById, `${field}.requestedById`),
		createTime: decodeOptionalNullableString(record.createTime, `${field}.createTime`),
		updateTime: decodeOptionalNullableString(record.updateTime, `${field}.updateTime`)
	};
}

function decodeCandidateAgent(
	value: unknown,
	field: string
): {
	id: number;
	name: string;
} {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceNumber(record.id, `${field}.id`),
		name: expectPerformanceServiceString(record.name, `${field}.name`)
	};
}

export function decodeTeacherAttributionConflictDetail(
	value: unknown,
	field = 'teacherAttributionConflictDetail'
): TeacherAttributionConflictDetail {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		status: expectPerformanceServiceOptionalEnum(
			record.status,
			`${field}.status`,
			TEACHER_ATTRIBUTION_CONFLICT_STATUS
		),
		candidateAgents:
			record.candidateAgents === undefined
				? undefined
				: expectPerformanceServiceArray(
						record.candidateAgents,
						`${field}.candidateAgents`
					).map((item, index) =>
						decodeCandidateAgent(item, `${field}.candidateAgents[${index}]`)
					),
		candidateAgentIds:
			record.candidateAgentIds === undefined
				? undefined
				: expectPerformanceServiceArray(
						record.candidateAgentIds,
						`${field}.candidateAgentIds`
					).map((item, index) =>
						expectPerformanceServiceNumber(item, `${field}.candidateAgentIds[${index}]`)
					),
		currentAgentName: decodeOptionalNullableString(
			record.currentAgentName,
			`${field}.currentAgentName`
		),
		requestedAgentName: decodeOptionalNullableString(
			record.requestedAgentName,
			`${field}.requestedAgentName`
		),
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		teacherId: decodeOptionalNullableNumber(record.teacherId, `${field}.teacherId`),
		teacherName: decodeOptionalNullableString(record.teacherName, `${field}.teacherName`),
		resolution: decodeOptionalNullableString(record.resolution, `${field}.resolution`),
		resolutionRemark: decodeOptionalNullableString(
			record.resolutionRemark,
			`${field}.resolutionRemark`
		),
		resolvedBy: decodeOptionalNullableNumber(record.resolvedBy, `${field}.resolvedBy`),
		resolvedTime: decodeOptionalNullableString(record.resolvedTime, `${field}.resolvedTime`),
		currentAgentId: decodeOptionalNullableNumber(
			record.currentAgentId,
			`${field}.currentAgentId`
		),
		requestedAgentId: decodeOptionalNullableNumber(
			record.requestedAgentId,
			`${field}.requestedAgentId`
		),
		requestedById: decodeOptionalNullableNumber(record.requestedById, `${field}.requestedById`),
		createTime: decodeOptionalNullableString(record.createTime, `${field}.createTime`),
		updateTime: decodeOptionalNullableString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeTeacherAttributionConflictPageResult(
	value: unknown,
	field = 'teacherAttributionConflictPageResult'
): TeacherAttributionConflictPageResult {
	return decodePerformanceServicePageResult(value, field, decodeTeacherAttributionConflictRecord);
}

export function decodeTeacherAttributionConflictResolveResult(
	value: unknown,
	field = 'teacherAttributionConflictResolveResult'
): TeacherAttributionConflictResolveResult {
	const record = expectPerformanceServiceRecord(value, field);

	if (
		'openConflictCount' in record ||
		'currentAttribution' in record ||
		'openConflicts' in record ||
		'history' in record
	) {
		return decodeTeacherAttributionInfo(record, field);
	}

	return decodeTeacherAttributionConflictDetail(record, field);
}

function decodeTeacherDashboardDistributionItem(
	value: unknown,
	field = 'teacherDashboardDistributionItem'
): TeacherDashboardDistributionItem {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		key: decodeOptionalNullableString(record.key, `${field}.key`),
		label: decodeOptionalNullableString(record.label, `${field}.label`),
		name: decodeOptionalNullableString(record.name, `${field}.name`),
		status: decodeOptionalNullableString(record.status, `${field}.status`),
		value: decodeOptionalNullableNumber(record.value, `${field}.value`),
		count: decodeOptionalNullableNumber(record.count, `${field}.count`)
	};
}

export function decodeTeacherDashboardSummary(
	value: unknown,
	field = 'teacherDashboardSummary'
): TeacherDashboardSummary {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		resourceTotal: decodeOptionalNullableNumber(record.resourceTotal, `${field}.resourceTotal`),
		pendingFollowCount: decodeOptionalNullableNumber(
			record.pendingFollowCount,
			`${field}.pendingFollowCount`
		),
		overdueFollowCount: decodeOptionalNullableNumber(
			record.overdueFollowCount,
			`${field}.overdueFollowCount`
		),
		partneredCount: decodeOptionalNullableNumber(
			record.partneredCount,
			`${field}.partneredCount`
		),
		classCount: decodeOptionalNullableNumber(record.classCount, `${field}.classCount`),
		memberDistribution:
			record.memberDistribution === undefined
				? undefined
				: expectPerformanceServiceArray(
						record.memberDistribution,
						`${field}.memberDistribution`
					).map((item, index) =>
						decodeTeacherDashboardDistributionItem(
							item,
							`${field}.memberDistribution[${index}]`
						)
					),
		cooperationDistribution:
			record.cooperationDistribution === undefined
				? undefined
				: expectPerformanceServiceArray(
						record.cooperationDistribution,
						`${field}.cooperationDistribution`
					).map((item, index) =>
						decodeTeacherDashboardDistributionItem(
							item,
							`${field}.cooperationDistribution[${index}]`
						)
					),
		classStatusDistribution:
			record.classStatusDistribution === undefined
				? undefined
				: expectPerformanceServiceArray(
						record.classStatusDistribution,
						`${field}.classStatusDistribution`
					).map((item, index) =>
						decodeTeacherDashboardDistributionItem(
							item,
							`${field}.classStatusDistribution[${index}]`
						)
					)
	};
}

export function decodeTeacherFollowRecord(
	value: unknown,
	field = 'teacherFollowRecord'
): TeacherFollowRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		teacherId: decodeOptionalNullableNumber(record.teacherId, `${field}.teacherId`),
		followTime: decodeOptionalNullableString(record.followTime, `${field}.followTime`),
		followMethod: decodeOptionalNullableString(record.followMethod, `${field}.followMethod`),
		content: decodeOptionalNullableString(record.content, `${field}.content`),
		followContent: decodeOptionalNullableString(record.followContent, `${field}.followContent`),
		remark: decodeOptionalNullableString(record.remark, `${field}.remark`),
		nextFollowTime: decodeOptionalNullableString(
			record.nextFollowTime,
			`${field}.nextFollowTime`
		),
		createTime: decodeOptionalNullableString(record.createTime, `${field}.createTime`),
		operatorName: decodeOptionalNullableString(record.operatorName, `${field}.operatorName`),
		creatorEmployeeName: decodeOptionalNullableString(
			record.creatorEmployeeName,
			`${field}.creatorEmployeeName`
		),
		creatorName: decodeOptionalNullableString(record.creatorName, `${field}.creatorName`)
	};
}

export function decodeTeacherFollowPageResult(
	value: unknown,
	field = 'teacherFollowPageResult'
): TeacherFollowPageResult {
	return decodePerformanceServicePageResult(value, field, decodeTeacherFollowRecord);
}

export function decodeTeacherClassRecord(
	value: unknown,
	field = 'teacherClassRecord'
): TeacherClassRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		status: expectPerformanceServiceOptionalEnum(
			record.status,
			`${field}.status`,
			TEACHER_CLASS_STATUS
		),
		classId: expectPerformanceServiceOptionalNumber(record.classId, `${field}.classId`),
		className: expectPerformanceServiceString(record.className, `${field}.className`),
		teacherId: expectPerformanceServiceNumber(record.teacherId, `${field}.teacherId`),
		teacherName: decodeOptionalNullableString(record.teacherName, `${field}.teacherName`),
		schoolName: decodeOptionalNullableString(record.schoolName, `${field}.schoolName`),
		grade: decodeOptionalNullableString(record.grade, `${field}.grade`),
		projectTag: decodeOptionalNullableString(record.projectTag, `${field}.projectTag`),
		studentCount: decodeOptionalNullableNumber(record.studentCount, `${field}.studentCount`),
		ownerEmployeeId: decodeOptionalNullableNumber(
			record.ownerEmployeeId,
			`${field}.ownerEmployeeId`
		),
		ownerDepartmentId: decodeOptionalNullableNumber(
			record.ownerDepartmentId,
			`${field}.ownerDepartmentId`
		),
		createTime: decodeOptionalNullableString(record.createTime, `${field}.createTime`),
		updateTime: decodeOptionalNullableString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeTeacherClassPageResult(
	value: unknown,
	field = 'teacherClassPageResult'
): TeacherClassPageResult {
	return decodePerformanceServicePageResult(value, field, decodeTeacherClassRecord);
}

function decodeTeacherTodoBucketSummary(
	value: unknown,
	field: string
): {
	today?: number;
	overdue?: number;
} {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		today: expectPerformanceServiceOptionalNumber(record.today, `${field}.today`),
		overdue: expectPerformanceServiceOptionalNumber(record.overdue, `${field}.overdue`)
	};
}

export function decodeTeacherTodoRecord(
	value: unknown,
	field = 'teacherTodoRecord'
): TeacherTodoRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		cooperationStatus: expectPerformanceServiceOptionalEnum(
			record.cooperationStatus,
			`${field}.cooperationStatus`,
			TEACHER_COOPERATION_STATUS
		),
		todoBucket: expectPerformanceServiceOptionalEnum(
			record.todoBucket,
			`${field}.todoBucket`,
			TEACHER_TODO_BUCKET
		),
		teacherId: decodeOptionalNullableNumber(record.teacherId, `${field}.teacherId`),
		teacherName: decodeOptionalNullableString(record.teacherName, `${field}.teacherName`),
		phone: decodeOptionalNullableString(record.phone, `${field}.phone`),
		wechat: decodeOptionalNullableString(record.wechat, `${field}.wechat`),
		schoolName: decodeOptionalNullableString(record.schoolName, `${field}.schoolName`),
		schoolRegion: decodeOptionalNullableString(record.schoolRegion, `${field}.schoolRegion`),
		subject: decodeOptionalNullableString(record.subject, `${field}.subject`),
		ownerEmployeeName: decodeOptionalNullableString(
			record.ownerEmployeeName,
			`${field}.ownerEmployeeName`
		),
		lastFollowTime: decodeOptionalNullableString(
			record.lastFollowTime,
			`${field}.lastFollowTime`
		),
		nextFollowTime: decodeOptionalNullableString(
			record.nextFollowTime,
			`${field}.nextFollowTime`
		)
	};
}

export function decodeTeacherTodoPageResult(
	value: unknown,
	field = 'teacherTodoPageResult'
): TeacherTodoPageResult {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		list: expectPerformanceServiceArray(record.list, `${field}.list`).map((item, index) =>
			decodeTeacherTodoRecord(item, `${field}.list[${index}]`)
		),
		pagination: {
			page: expectPerformanceServiceNumber(
				expectPerformanceServiceRecord(record.pagination, `${field}.pagination`).page,
				`${field}.pagination.page`
			),
			size: expectPerformanceServiceNumber(
				expectPerformanceServiceRecord(record.pagination, `${field}.pagination`).size,
				`${field}.pagination.size`
			),
			total: expectPerformanceServiceNumber(
				expectPerformanceServiceRecord(record.pagination, `${field}.pagination`).total,
				`${field}.pagination.total`
			)
		},
		bucketSummary:
			record.bucketSummary === undefined
				? undefined
				: decodeTeacherTodoBucketSummary(record.bucketSummary, `${field}.bucketSummary`)
	};
}

export function decodeTeacherInfoRecord(
	value: unknown,
	field = 'teacherInfoRecord'
): TeacherInfoRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		cooperationStatus: expectPerformanceServiceOptionalEnum(
			record.cooperationStatus,
			`${field}.cooperationStatus`,
			TEACHER_COOPERATION_STATUS
		),
		teacherName: expectPerformanceServiceString(record.teacherName, `${field}.teacherName`),
		phone: decodeOptionalNullableString(record.phone, `${field}.phone`),
		wechat: decodeOptionalNullableString(record.wechat, `${field}.wechat`),
		schoolName: decodeOptionalNullableString(record.schoolName, `${field}.schoolName`),
		schoolRegion: decodeOptionalNullableString(record.schoolRegion, `${field}.schoolRegion`),
		schoolType: decodeOptionalNullableString(record.schoolType, `${field}.schoolType`),
		grade: decodeOptionalNullableString(record.grade, `${field}.grade`),
		className: decodeOptionalNullableString(record.className, `${field}.className`),
		subject: decodeOptionalNullableString(record.subject, `${field}.subject`),
		projectTags: decodeProjectTags(record.projectTags, `${field}.projectTags`),
		intentionLevel: decodeOptionalNullableString(
			record.intentionLevel,
			`${field}.intentionLevel`
		),
		communicationStyle: decodeOptionalNullableString(
			record.communicationStyle,
			`${field}.communicationStyle`
		),
		ownerEmployeeId: decodeOptionalNullableNumber(
			record.ownerEmployeeId,
			`${field}.ownerEmployeeId`
		),
		ownerEmployeeName: decodeOptionalNullableString(
			record.ownerEmployeeName,
			`${field}.ownerEmployeeName`
		),
		ownerDepartmentId: decodeOptionalNullableNumber(
			record.ownerDepartmentId,
			`${field}.ownerDepartmentId`
		),
		ownerDepartmentName: decodeOptionalNullableString(
			record.ownerDepartmentName,
			`${field}.ownerDepartmentName`
		),
		lastFollowTime: decodeOptionalNullableString(
			record.lastFollowTime,
			`${field}.lastFollowTime`
		),
		nextFollowTime: decodeOptionalNullableString(
			record.nextFollowTime,
			`${field}.nextFollowTime`
		),
		cooperationTime: decodeOptionalNullableString(
			record.cooperationTime,
			`${field}.cooperationTime`
		),
		classCount: decodeOptionalNullableNumber(record.classCount, `${field}.classCount`),
		createTime: decodeOptionalNullableString(record.createTime, `${field}.createTime`),
		updateTime: decodeOptionalNullableString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeTeacherInfoPageResult(
	value: unknown,
	field = 'teacherInfoPageResult'
): TeacherInfoPageResult {
	return decodePerformanceServicePageResult(value, field, decodeTeacherInfoRecord);
}

function decodeTeacherAgentAuditSnapshot(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		return null;
	}

	return expectPerformanceServiceRecord(value, field) as JsonObject;
}

export function decodeTeacherAgentAuditRecord(
	value: unknown,
	field = 'teacherAgentAuditRecord'
): TeacherAgentAuditRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		resourceType: decodeOptionalNullableString(record.resourceType, `${field}.resourceType`),
		resourceId: decodeOptionalNullableNumber(record.resourceId, `${field}.resourceId`),
		action: decodeOptionalNullableString(record.action, `${field}.action`),
		beforeSnapshot: decodeTeacherAgentAuditSnapshot(
			record.beforeSnapshot,
			`${field}.beforeSnapshot`
		),
		afterSnapshot: decodeTeacherAgentAuditSnapshot(
			record.afterSnapshot,
			`${field}.afterSnapshot`
		),
		operatorId: decodeOptionalNullableNumber(record.operatorId, `${field}.operatorId`),
		operatorName: decodeOptionalNullableString(record.operatorName, `${field}.operatorName`),
		createTime: decodeOptionalNullableString(record.createTime, `${field}.createTime`),
		updateTime: decodeOptionalNullableString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeTeacherAgentAuditPageResult(
	value: unknown,
	field = 'teacherAgentAuditPageResult'
): TeacherAgentAuditPageResult {
	return decodePerformanceServicePageResult(value, field, decodeTeacherAgentAuditRecord);
}

export function decodeTeacherAgentRecord(
	value: unknown,
	field = 'teacherAgentRecord'
): TeacherAgentRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		name: expectPerformanceServiceString(record.name, `${field}.name`),
		status: expectPerformanceServiceOptionalEnum(
			record.status,
			`${field}.status`,
			TEACHER_AGENT_STATUS
		),
		agentType: expectPerformanceServiceString(record.agentType, `${field}.agentType`),
		blacklistStatus: expectPerformanceServiceOptionalEnum(
			record.blacklistStatus,
			`${field}.blacklistStatus`,
			TEACHER_AGENT_BLACKLIST_STATUS
		),
		level: decodeOptionalNullableString(record.level, `${field}.level`),
		region: decodeOptionalNullableString(record.region, `${field}.region`),
		cooperationStatus: decodeOptionalNullableString(
			record.cooperationStatus,
			`${field}.cooperationStatus`
		),
		remark: decodeOptionalNullableString(record.remark, `${field}.remark`),
		ownerEmployeeId: decodeOptionalNullableNumber(
			record.ownerEmployeeId,
			`${field}.ownerEmployeeId`
		),
		ownerDepartmentId: decodeOptionalNullableNumber(
			record.ownerDepartmentId,
			`${field}.ownerDepartmentId`
		),
		createTime: decodeOptionalNullableString(record.createTime, `${field}.createTime`),
		updateTime: decodeOptionalNullableString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeTeacherAgentPageResult(
	value: unknown,
	field = 'teacherAgentPageResult'
): TeacherAgentPageResult {
	return decodePerformanceServicePageResult(value, field, decodeTeacherAgentRecord);
}

export function decodeTeacherAgentRelationRecord(
	value: unknown,
	field = 'teacherAgentRelationRecord'
): TeacherAgentRelationRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		status: expectPerformanceServiceOptionalEnum(
			record.status,
			`${field}.status`,
			TEACHER_AGENT_RELATION_STATUS
		),
		parentAgentId: expectPerformanceServiceNumber(
			record.parentAgentId,
			`${field}.parentAgentId`
		),
		parentAgentName: decodeOptionalNullableString(
			record.parentAgentName,
			`${field}.parentAgentName`
		),
		childAgentId: expectPerformanceServiceNumber(record.childAgentId, `${field}.childAgentId`),
		childAgentName: decodeOptionalNullableString(
			record.childAgentName,
			`${field}.childAgentName`
		),
		effectiveTime: decodeOptionalNullableString(record.effectiveTime, `${field}.effectiveTime`),
		remark: decodeOptionalNullableString(record.remark, `${field}.remark`),
		ownerEmployeeId: decodeOptionalNullableNumber(
			record.ownerEmployeeId,
			`${field}.ownerEmployeeId`
		),
		ownerDepartmentId: decodeOptionalNullableNumber(
			record.ownerDepartmentId,
			`${field}.ownerDepartmentId`
		),
		createTime: decodeOptionalNullableString(record.createTime, `${field}.createTime`),
		updateTime: decodeOptionalNullableString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeTeacherAgentRelationPageResult(
	value: unknown,
	field = 'teacherAgentRelationPageResult'
): TeacherAgentRelationPageResult {
	return decodePerformanceServicePageResult(value, field, decodeTeacherAgentRelationRecord);
}
