/**
 * 文件职责：定义证书台账关键响应的前端 runtime 契约解码器。
 * 不负责发请求、证书发放弹窗或课程联动逻辑。
 * 维护重点：证书主记录与发放台账必须共享同一条结构边界，避免状态和关联员工字段被异常响应污染。
 */

import type {
	CertificateLedgerPageResult,
	CertificateLedgerRecord,
	CertificatePageResult,
	CertificateRecord,
	CertificateRecordStatus,
	CertificateStatus
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
import {
	CERTIFICATE_RECORD_STATUS,
	CERTIFICATE_STATUS
} from '../shared/contract-enums';

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

function decodeCertificateStatus(value: unknown, field: string): CertificateStatus {
	return expectPerformanceServiceEnum(value, field, CERTIFICATE_STATUS);
}

function decodeCertificateRecordStatus(value: unknown, field: string): CertificateRecordStatus {
	return expectPerformanceServiceEnum(value, field, CERTIFICATE_RECORD_STATUS);
}

export function decodeCertificateRecord(
	value: unknown,
	field = 'certificateRecord'
): CertificateRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		name: expectPerformanceServiceString(record.name, `${field}.name`),
		code: decodeOptionalNullableString(record.code, `${field}.code`),
		category: decodeOptionalNullableString(record.category, `${field}.category`),
		issuer: decodeOptionalNullableString(record.issuer, `${field}.issuer`),
		description: decodeOptionalNullableString(record.description, `${field}.description`),
		validityMonths: decodeOptionalNullableNumber(
			record.validityMonths,
			`${field}.validityMonths`
		),
		sourceCourseId: decodeOptionalNullableNumber(
			record.sourceCourseId,
			`${field}.sourceCourseId`
		),
		status:
			record.status === undefined
				? undefined
				: decodeCertificateStatus(record.status, `${field}.status`),
		issuedCount: expectPerformanceServiceOptionalNumber(
			record.issuedCount,
			`${field}.issuedCount`
		),
		createTime: expectPerformanceServiceOptionalString(
			record.createTime,
			`${field}.createTime`
		),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`)
	};
}

export function decodeCertificatePageResult(
	value: unknown,
	field = 'certificatePageResult'
): CertificatePageResult {
	return decodePerformanceServicePageResult(value, field, decodeCertificateRecord);
}

function decodeCertificateLedgerRecord(
	value: unknown,
	field = 'certificateLedgerRecord'
): CertificateLedgerRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		certificateId: expectPerformanceServiceOptionalNumber(
			record.certificateId,
			`${field}.certificateId`
		),
		certificateName: expectPerformanceServiceOptionalString(
			record.certificateName,
			`${field}.certificateName`
		),
		employeeId: expectPerformanceServiceOptionalNumber(
			record.employeeId,
			`${field}.employeeId`
		),
		employeeName: expectPerformanceServiceOptionalString(
			record.employeeName,
			`${field}.employeeName`
		),
		departmentId: decodeOptionalNullableNumber(record.departmentId, `${field}.departmentId`),
		departmentName: decodeOptionalNullableString(
			record.departmentName,
			`${field}.departmentName`
		),
		issuedAt: expectPerformanceServiceString(record.issuedAt, `${field}.issuedAt`),
		issuedBy: expectPerformanceServiceOptionalString(record.issuedBy, `${field}.issuedBy`),
		sourceCourseId: decodeOptionalNullableNumber(
			record.sourceCourseId,
			`${field}.sourceCourseId`
		),
		status:
			record.status === undefined
				? undefined
				: decodeCertificateRecordStatus(record.status, `${field}.status`)
	};
}

export function decodeCertificateLedgerPageResult(
	value: unknown,
	field = 'certificateLedgerPageResult'
): CertificateLedgerPageResult {
	return decodePerformanceServicePageResult(value, field, decodeCertificateLedgerRecord);
}
