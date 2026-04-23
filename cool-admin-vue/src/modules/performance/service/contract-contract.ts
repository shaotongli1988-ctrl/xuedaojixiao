/**
 * 文件职责：定义合同管理关键响应的前端 runtime 契约解码器。
 * 不负责发请求、合同表单编排或附件预览。
 * 维护重点：合同主记录与列表必须共享同一条结构边界，避免合同状态、金额和人员字段被异常响应污染。
 */

import type {
	ContractPageResult,
	ContractRecord,
	ContractStatus,
	ContractType
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

const CONTRACT_TYPE = ['full-time', 'part-time', 'internship', 'other'] as const;
const CONTRACT_STATUS = ['draft', 'active', 'expired', 'terminated'] as const;

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		return null;
	}

	return expectPerformanceServiceString(value, field);
}

function decodeOptionalNullableNumber(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	return expectPerformanceServiceNullableNumber(value, field);
}

function decodeContractType(value: unknown, field: string): ContractType {
	return expectPerformanceServiceEnum(value, field, CONTRACT_TYPE);
}

function decodeContractStatus(value: unknown, field: string): ContractStatus {
	return expectPerformanceServiceEnum(value, field, CONTRACT_STATUS);
}

export function decodeContractRecord(
	value: unknown,
	field = 'contractRecord'
): ContractRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		employeeId:
			expectPerformanceServiceOptionalNumber(record.employeeId, `${field}.employeeId`) ??
			undefined,
		employeeName: expectPerformanceServiceOptionalString(record.employeeName, `${field}.employeeName`),
		type: decodeContractType(record.type, `${field}.type`),
		title: expectPerformanceServiceOptionalString(record.title, `${field}.title`),
		contractNumber: expectPerformanceServiceOptionalString(
			record.contractNumber,
			`${field}.contractNumber`
		),
		startDate: expectPerformanceServiceString(record.startDate, `${field}.startDate`),
		endDate: expectPerformanceServiceString(record.endDate, `${field}.endDate`),
		probationPeriod: decodeOptionalNullableNumber(
			record.probationPeriod,
			`${field}.probationPeriod`
		),
		salary: decodeOptionalNullableNumber(record.salary, `${field}.salary`),
		position: expectPerformanceServiceOptionalString(record.position, `${field}.position`),
		departmentId: decodeOptionalNullableNumber(record.departmentId, `${field}.departmentId`),
		departmentName: expectPerformanceServiceOptionalString(
			record.departmentName,
			`${field}.departmentName`
		),
		status:
			record.status === undefined
				? undefined
				: decodeContractStatus(record.status, `${field}.status`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeContractPageResult(
	value: unknown,
	field = 'contractPageResult'
): ContractPageResult {
	return decodePerformanceServicePageResult(value, field, decodeContractRecord);
}
