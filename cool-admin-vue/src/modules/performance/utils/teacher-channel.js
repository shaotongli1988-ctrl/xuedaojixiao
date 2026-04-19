/**
 * 班主任化主题前端状态与动作工具。
 * 这里只维护主题19冻结的状态标签、前端动作门禁和基础值归一化，
 * 不负责接口请求、权限来源或页面渲染细节。
 * 维护重点是不要扩展冻结外的状态值，也不要放宽只读和终态门禁。
 */

export const teacherCooperationStatusOptions = [
	{ label: '未建联', value: 'uncontacted' },
	{ label: '已跟进', value: 'contacted' },
	{ label: '洽谈中', value: 'negotiating' },
	{ label: '已合作', value: 'partnered' },
	{ label: '已终止', value: 'terminated' }
];

export const teacherClassStatusOptions = [
	{ label: '草稿', value: 'draft' },
	{ label: '已启用', value: 'active' },
	{ label: '已关闭', value: 'closed' }
];

export const teacherTodoBucketOptions = [
	{ label: '今日待跟进', value: 'today' },
	{ label: '已逾期待跟进', value: 'overdue' }
];

export function isTeacherCooperationStatus(value) {
	return teacherCooperationStatusOptions.some(item => item.value === value);
}

export function isTeacherClassStatus(value) {
	return teacherClassStatusOptions.some(item => item.value === value);
}

export function isTeacherTodoBucket(value) {
	return teacherTodoBucketOptions.some(item => item.value === value);
}

export function teacherCooperationStatusLabel(value) {
	return (
		teacherCooperationStatusOptions.find(item => item.value === value)?.label || value || '-'
	);
}

export function teacherClassStatusLabel(value) {
	return teacherClassStatusOptions.find(item => item.value === value)?.label || value || '-';
}

export function teacherTodoBucketLabel(value) {
	return teacherTodoBucketOptions.find(item => item.value === value)?.label || value || '-';
}

export function teacherCooperationStatusTagType(value) {
	switch (value) {
		case 'partnered':
			return 'success';
		case 'terminated':
			return 'danger';
		case 'negotiating':
			return 'warning';
		case 'contacted':
			return 'primary';
		default:
			return 'info';
	}
}

export function teacherClassStatusTagType(value) {
	switch (value) {
		case 'active':
			return 'success';
		case 'closed':
			return 'info';
		default:
			return 'warning';
	}
}

export function normalizeOptionalText(value) {
	const text = String(value || '').trim();
	return text || undefined;
}

export function normalizeOptionalNumber(value) {
	if (value === null || value === undefined || value === '') {
		return undefined;
	}

	const numberValue = Number(value);
	return Number.isFinite(numberValue) ? numberValue : undefined;
}

export function normalizeStringArray(value) {
	if (Array.isArray(value)) {
		return value.map(item => String(item || '').trim()).filter(Boolean);
	}

	return String(value || '')
		.split(/[,\n，]/)
		.map(item => item.trim())
		.filter(Boolean);
}

export function stringifyTagList(value) {
	return normalizeStringArray(value).join('、') || '-';
}

export function getTeacherInfoId(record) {
	const value = Number(record?.id);
	return Number.isInteger(value) && value > 0 ? value : undefined;
}

export function getTeacherClassId(record) {
	const raw = record?.id ?? record?.classId;
	const value = Number(raw);
	return Number.isInteger(value) && value > 0 ? value : undefined;
}

export function hasTeacherWritePermission(permissionState) {
	return [
		permissionState?.teacherAdd,
		permissionState?.teacherUpdate,
		permissionState?.teacherAssign,
		permissionState?.teacherUpdateStatus,
		permissionState?.followAdd,
		permissionState?.cooperationMark,
		permissionState?.classAdd,
		permissionState?.classUpdate,
		permissionState?.classDelete
	].some(Boolean);
}

export function canMarkTeacherCooperation(record, hasPermission) {
	return Boolean(
		hasPermission &&
			record?.lastFollowTime &&
			['contacted', 'negotiating'].includes(String(record?.cooperationStatus || ''))
	);
}

export function canCreateTeacherClass(record, hasPermission) {
	return Boolean(hasPermission && record?.cooperationStatus === 'partnered');
}

export function canEditTeacherClass(record, hasPermission) {
	return Boolean(hasPermission && record?.status !== 'closed');
}

export function canDeleteTeacherClass(record, hasPermission) {
	return Boolean(hasPermission && record?.status === 'draft');
}

export function resolveFollowContent(record) {
	return (
		normalizeOptionalText(record?.content) ||
		normalizeOptionalText(record?.followContent) ||
		normalizeOptionalText(record?.remark) ||
		'-'
	);
}

export function resolveFollowOperator(record) {
	return (
		normalizeOptionalText(record?.operatorName) ||
		normalizeOptionalText(record?.creatorName) ||
		'-'
	);
}

export function resolveDistributionItems(summary) {
	const candidates = [
		summary?.cooperationDistribution,
		summary?.classStatusDistribution,
		summary?.memberDistribution
	];

	for (const list of candidates) {
		if (Array.isArray(list) && list.length > 0) {
			return list;
		}
	}

	return [];
}
