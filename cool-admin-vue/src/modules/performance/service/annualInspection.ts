/**
 * 文件职责：导出年检材料元数据台账前端 service 实例；不负责页面编排或字段格式化。
 */

import type { AnnualInspectionRecord, AnnualInspectionStats } from '../types';
import {
	createPerformanceOfficeLedgerService,
	PerformanceOfficeLedgerService
} from './office-ledger';
import {
	decodeAnnualInspectionRecord,
	decodeAnnualInspectionStats
} from './office-ledger-contract';

const annualInspectionServiceDecoders = {
	decodeRecord: decodeAnnualInspectionRecord,
	decodeStats: decodeAnnualInspectionStats
};

export default class PerformanceAnnualInspectionService extends PerformanceOfficeLedgerService<
	AnnualInspectionRecord,
	AnnualInspectionStats
> {
	constructor() {
		super('annualInspection', annualInspectionServiceDecoders);
	}
}

export const performanceAnnualInspectionService = createPerformanceOfficeLedgerService<
	AnnualInspectionRecord,
	AnnualInspectionStats
>('annualInspection', annualInspectionServiceDecoders);
