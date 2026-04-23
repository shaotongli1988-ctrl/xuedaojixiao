/**
 * 文件职责：定义供应商台账关键响应的前端 runtime 契约解码器。
 * 不负责发请求、供应商评级扩展或结算中心逻辑。
 * 维护重点：供应商主记录与列表必须共享同一条结构边界，避免可空资料字段和状态字段被异常响应污染。
 */

import type {
	SupplierPageResult,
	SupplierRecord
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceEnum,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

const SUPPLIER_STATUS = ['active', 'inactive'] as const;

function decodeOptionalNullableString(value: unknown, field: string) {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		return null;
	}

	return expectPerformanceServiceString(value, field);
}

export function decodeSupplierRecord(
	value: unknown,
	field = 'supplierRecord'
): SupplierRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		name: expectPerformanceServiceString(record.name, `${field}.name`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`),
		status:
			record.status === undefined
				? undefined
				: expectPerformanceServiceEnum(record.status, `${field}.status`, SUPPLIER_STATUS),
		code: decodeOptionalNullableString(record.code, `${field}.code`),
		category: decodeOptionalNullableString(record.category, `${field}.category`),
		contactName: decodeOptionalNullableString(record.contactName, `${field}.contactName`),
		contactPhone: decodeOptionalNullableString(record.contactPhone, `${field}.contactPhone`),
		contactEmail: decodeOptionalNullableString(record.contactEmail, `${field}.contactEmail`),
		bankAccount: decodeOptionalNullableString(record.bankAccount, `${field}.bankAccount`),
		taxNo: decodeOptionalNullableString(record.taxNo, `${field}.taxNo`),
		remark: decodeOptionalNullableString(record.remark, `${field}.remark`)
	};
}

export function decodeSupplierPageResult(
	value: unknown,
	field = 'supplierPageResult'
): SupplierPageResult {
	return decodePerformanceServicePageResult(value, field, decodeSupplierRecord);
}
