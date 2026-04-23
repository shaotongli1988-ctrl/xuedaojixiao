/**
 * 文件职责：定义 performanceAccessContext 的前端 runtime 契约解码器。
 * 不负责发请求、角色展示转换或权限判断。
 * 维护重点：只校验当前页面真实依赖的稳定字段，避免后端返回异常结构时静默污染全局视角事实源。
 */

import type { PerformanceAccessContext, PerformancePersonaOption } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function expectString(value: unknown, field: string) {
	if (typeof value !== 'string') {
		throw new Error(`${field} 必须为字符串`);
	}

	return value;
}

function expectNullableString(value: unknown, field: string) {
	if (value == null) {
		return null;
	}

	return expectString(value, field);
}

function expectBoolean(value: unknown, field: string) {
	if (typeof value !== 'boolean') {
		throw new Error(`${field} 必须为布尔值`);
	}

	return value;
}

function expectStringArray(value: unknown, field: string) {
	if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
		throw new Error(`${field} 必须为字符串数组`);
	}

	return value;
}

function decodePerformancePersonaOption(
	value: unknown,
	index: number
): PerformancePersonaOption {
	if (!isRecord(value)) {
		throw new Error(`availablePersonas[${index}] 必须为对象`);
	}

	const category = value.category;
	if (category !== 'org' && category !== 'fn') {
		throw new Error(`availablePersonas[${index}].category 非法`);
	}

	return {
		key: expectString(value.key, `availablePersonas[${index}].key`),
		label: expectString(value.label, `availablePersonas[${index}].label`),
		category
	};
}

export function decodePerformanceAccessContext(value: unknown): PerformanceAccessContext {
	if (!isRecord(value)) {
		throw new Error('performanceAccessContext 响应必须为对象');
	}

	const roleKind = value.roleKind;
	if (
		roleKind !== 'employee' &&
		roleKind !== 'manager' &&
		roleKind !== 'hr' &&
		roleKind !== 'readonly' &&
		roleKind !== 'unsupported'
	) {
		throw new Error('performanceAccessContext.roleKind 非法');
	}

	const surfaceAccess = value.surfaceAccess;
	if (!isRecord(surfaceAccess)) {
		throw new Error('performanceAccessContext.surfaceAccess 必须为对象');
	}

	return {
		availablePersonas: Array.isArray(value.availablePersonas)
			? value.availablePersonas.map((item, index) =>
					decodePerformancePersonaOption(item, index)
				)
			: (() => {
					throw new Error('performanceAccessContext.availablePersonas 必须为数组');
				})(),
		defaultPersonaKey: expectNullableString(
			value.defaultPersonaKey,
			'performanceAccessContext.defaultPersonaKey'
		),
		activePersonaKey: expectNullableString(
			value.activePersonaKey,
			'performanceAccessContext.activePersonaKey'
		),
		roleKind,
		canSwitchPersona: expectBoolean(
			value.canSwitchPersona,
			'performanceAccessContext.canSwitchPersona'
		),
		workbenchPages: expectStringArray(
			value.workbenchPages,
			'performanceAccessContext.workbenchPages'
		),
		surfaceAccess: {
			workbench: expectBoolean(
				surfaceAccess.workbench,
				'performanceAccessContext.surfaceAccess.workbench'
			),
			assessmentMy: expectBoolean(
				surfaceAccess.assessmentMy,
				'performanceAccessContext.surfaceAccess.assessmentMy'
			),
			assessmentInitiated: expectBoolean(
				surfaceAccess.assessmentInitiated,
				'performanceAccessContext.surfaceAccess.assessmentInitiated'
			),
			assessmentPending: expectBoolean(
				surfaceAccess.assessmentPending,
				'performanceAccessContext.surfaceAccess.assessmentPending'
			),
			approvalConfig: expectBoolean(
				surfaceAccess.approvalConfig,
				'performanceAccessContext.surfaceAccess.approvalConfig'
			),
			approvalInstance: expectBoolean(
				surfaceAccess.approvalInstance,
				'performanceAccessContext.surfaceAccess.approvalInstance'
			),
			dashboardSummary: expectBoolean(
				surfaceAccess.dashboardSummary,
				'performanceAccessContext.surfaceAccess.dashboardSummary'
			),
			dashboardCrossSummary: expectBoolean(
				surfaceAccess.dashboardCrossSummary,
				'performanceAccessContext.surfaceAccess.dashboardCrossSummary'
			)
		}
	};
}
