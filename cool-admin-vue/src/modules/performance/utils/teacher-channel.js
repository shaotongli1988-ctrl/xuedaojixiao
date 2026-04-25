/**
 * 班主任化主题前端动作与基础归一化工具。
 * 这里只维护主题19页面共享的动作门禁与输入归一化，
 * 不负责业务状态标签、选项字典或页面渲染细节。
 * 维护重点是不要重新引入本地业务字典，所有状态展示统一走 dict store。
 */

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
