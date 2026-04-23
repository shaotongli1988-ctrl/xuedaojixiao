/**
 * 文件职责：导出荣誉管理元数据台账前端 service 实例；不负责页面编排或字段格式化。
 */

import type { HonorRecord, HonorStats } from '../types';
import { createPerformanceOfficeLedgerService, PerformanceOfficeLedgerService } from './office-ledger';
import { decodeHonorRecord, decodeHonorStats } from './office-ledger-contract';

const honorServiceDecoders = {
	decodeRecord: decodeHonorRecord,
	decodeStats: decodeHonorStats
};

export default class PerformanceHonorService extends PerformanceOfficeLedgerService<
	HonorRecord,
	HonorStats
> {
	constructor() {
		super('honor', honorServiceDecoders);
	}
}

export const performanceHonorService = createPerformanceOfficeLedgerService<HonorRecord, HonorStats>(
	'honor',
	honorServiceDecoders
);
