/**
 * 文件职责：定义 PIP 关键响应的前端 runtime 契约解码器。
 * 不负责发请求、详情抽屉交互或表单预填。
 * 维护重点：PIP 主记录、跟进记录和导出行保持统一结构边界，避免详情页和导出链路读到脏字段。
 */

import type {
	PipExportRow,
	PipPageResult,
	PipRecord,
	PipTrackRecord
} from '../types';
import {
	decodePerformanceServicePageResult,
	expectPerformanceServiceArray,
	expectPerformanceServiceNullableNumber,
	expectPerformanceServiceNumber,
	expectPerformanceServiceOptionalNumber,
	expectPerformanceServiceOptionalString,
	expectPerformanceServiceRecord,
	expectPerformanceServiceString
} from './service-contract';

function decodePipTrackRecord(value: unknown, field = 'pipTrackRecord'): PipTrackRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		pipId: expectPerformanceServiceOptionalNumber(record.pipId, `${field}.pipId`),
		recordDate: expectPerformanceServiceString(record.recordDate, `${field}.recordDate`),
		progress: expectPerformanceServiceString(record.progress, `${field}.progress`),
		nextPlan: expectPerformanceServiceOptionalString(record.nextPlan, `${field}.nextPlan`),
		operatorId: expectPerformanceServiceOptionalNumber(record.operatorId, `${field}.operatorId`),
		operatorName: expectPerformanceServiceOptionalString(record.operatorName, `${field}.operatorName`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`)
	};
}

export function decodePipRecord(value: unknown, field = 'pipRecord'): PipRecord {
	const record = expectPerformanceServiceRecord(value, field);

	return {
		id: expectPerformanceServiceOptionalNumber(record.id, `${field}.id`),
		createTime: expectPerformanceServiceOptionalString(record.createTime, `${field}.createTime`),
		updateTime: expectPerformanceServiceOptionalString(record.updateTime, `${field}.updateTime`),
		title: expectPerformanceServiceString(record.title, `${field}.title`),
		status: expectPerformanceServiceOptionalString(record.status, `${field}.status`),
		startDate: expectPerformanceServiceString(record.startDate, `${field}.startDate`),
		endDate: expectPerformanceServiceString(record.endDate, `${field}.endDate`),
		ownerName: expectPerformanceServiceOptionalString(record.ownerName, `${field}.ownerName`),
		employeeName: expectPerformanceServiceOptionalString(record.employeeName, `${field}.employeeName`),
		suggestionId: expectPerformanceServiceOptionalNumber(record.suggestionId, `${field}.suggestionId`),
		improvementGoal: expectPerformanceServiceString(
			record.improvementGoal,
			`${field}.improvementGoal`
		),
		sourceReason: expectPerformanceServiceString(record.sourceReason, `${field}.sourceReason`),
		resultSummary: expectPerformanceServiceOptionalString(
			record.resultSummary,
			`${field}.resultSummary`
		),
		assessmentId:
			record.assessmentId === undefined
				? undefined
				: expectPerformanceServiceNullableNumber(record.assessmentId, `${field}.assessmentId`),
		employeeId: expectPerformanceServiceNumber(record.employeeId, `${field}.employeeId`),
		ownerId: expectPerformanceServiceNumber(record.ownerId, `${field}.ownerId`),
		trackRecords:
			record.trackRecords === undefined
				? undefined
				: expectPerformanceServiceArray(record.trackRecords, `${field}.trackRecords`).map(
						(item, index) => decodePipTrackRecord(item, `${field}.trackRecords[${index}]`)
				  )
	};
}

export function decodePipPageResult(value: unknown, field = 'pipPageResult'): PipPageResult {
	return decodePerformanceServicePageResult(value, field, decodePipRecord);
}

export function decodePipExportRows(
	value: unknown,
	field = 'pipExportRows'
): PipExportRow[] {
	return expectPerformanceServiceArray(value, field).map((item, index) => {
		const row = expectPerformanceServiceRecord(item, `${field}[${index}]`);

		return {
			id: expectPerformanceServiceNumber(row.id, `${field}[${index}].id`),
			createTime: expectPerformanceServiceOptionalString(
				row.createTime,
				`${field}[${index}].createTime`
			),
			updateTime: expectPerformanceServiceOptionalString(
				row.updateTime,
				`${field}[${index}].updateTime`
			),
			title: expectPerformanceServiceString(row.title, `${field}[${index}].title`),
			status: expectPerformanceServiceString(row.status, `${field}[${index}].status`),
			startDate: expectPerformanceServiceString(row.startDate, `${field}[${index}].startDate`),
			endDate: expectPerformanceServiceString(row.endDate, `${field}[${index}].endDate`),
			ownerName: expectPerformanceServiceOptionalString(
				row.ownerName,
				`${field}[${index}].ownerName`
			),
			employeeId: expectPerformanceServiceNumber(
				row.employeeId,
				`${field}[${index}].employeeId`
			),
			employeeName: expectPerformanceServiceOptionalString(
				row.employeeName,
				`${field}[${index}].employeeName`
			),
			ownerId: expectPerformanceServiceNumber(row.ownerId, `${field}[${index}].ownerId`),
			assessmentId:
				row.assessmentId === undefined
					? undefined
					: expectPerformanceServiceNullableNumber(
							row.assessmentId,
							`${field}[${index}].assessmentId`
					  )
		};
	});
}
