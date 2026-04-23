/**
 * 文件职责：定义薪资管理关键响应的前端 runtime 契约解码器。
 * 不负责发请求、金额格式化或页面变更记录展示编排。
 * 维护重点：薪资主记录与调整记录必须共享同一条结构边界，避免金额和员工关联字段被异常响应污染。
 */

import type { SalaryChangeRecord, SalaryPageResult, SalaryRecord } from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

function decodeOptionalNullableNumber(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableNumber(value, field);
}

function decodeSalaryChangeRecord(
	value: unknown,
	field = 'salaryChangeRecord'
): SalaryChangeRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		salaryId: expectPerformanceServiceOptionalNumber(record.salaryId, `${field}.salaryId`),
		beforeAmount:
			expectPerformanceServiceOptionalNumber(record.beforeAmount, `${field}.beforeAmount`) ??
			0,
		adjustAmount:
			expectPerformanceServiceOptionalNumber(record.adjustAmount, `${field}.adjustAmount`) ??
			0,
		afterAmount:
			expectPerformanceServiceOptionalNumber(record.afterAmount, `${field}.afterAmount`) ?? 0,
		changeReason: expectPerformanceServiceString(record.changeReason, `${field}.changeReason`),
		operatorId: expectPerformanceServiceOptionalNumber(
			record.operatorId,
			`${field}.operatorId`
		),
		operatorName: expectPerformanceServiceOptionalString(
			record.operatorName,
			`${field}.operatorName`
		),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`)
	};
}

export function decodeSalaryRecord(value: unknown, field = 'salaryRecord'): SalaryRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(
			record.updateTime,
			`${field}.updateTime`
		),
		status: expectPerformanceServiceOptionalString(record.status, `${field}.status`),
		employeeName: expectPerformanceServiceOptionalString(
			record.employeeName,
			`${field}.employeeName`
		),
		periodValue: expectPerformanceServiceString(record.periodValue, `${field}.periodValue`),
		baseSalary:
			expectPerformanceServiceOptionalNumber(record.baseSalary, `${field}.baseSalary`) ?? 0,
		performanceBonus:
			expectPerformanceServiceOptionalNumber(
				record.performanceBonus,
				`${field}.performanceBonus`
			) ?? 0,
		adjustAmount:
			expectPerformanceServiceOptionalNumber(record.adjustAmount, `${field}.adjustAmount`) ??
			0,
		finalAmount:
			expectPerformanceServiceOptionalNumber(record.finalAmount, `${field}.finalAmount`) ?? 0,
		grade: expectPerformanceServiceOptionalString(record.grade, `${field}.grade`),
		effectiveDate: expectPerformanceServiceString(
			record.effectiveDate,
			`${field}.effectiveDate`
		),
		employeeId:
			expectPerformanceServiceOptionalNumber(record.employeeId, `${field}.employeeId`) ??
			undefined,
		assessmentId: decodeOptionalNullableNumber(record.assessmentId, `${field}.assessmentId`),
		changeRecords:
			record.changeRecords === undefined
				? undefined
				: record.changeRecords === null
					? undefined
					: Array.isArray(record.changeRecords)
						? record.changeRecords.map((item, index) =>
								decodeSalaryChangeRecord(item, `${field}.changeRecords[${index}]`)
							)
						: undefined
	};
}

export function decodeSalaryPageResult(
	value: unknown,
	field = 'salaryPageResult'
): SalaryPageResult {
	return decodePerformanceServicePageResult(value, field, decodeSalaryRecord);
}
