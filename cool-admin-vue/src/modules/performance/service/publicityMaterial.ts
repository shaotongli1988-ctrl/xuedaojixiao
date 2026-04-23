/**
 * 文件职责：导出宣传资料元数据台账前端 service 实例；不负责 documentCenter 引用选择或页面编排。
 */

import type { PublicityMaterialRecord, PublicityMaterialStats } from '../types';
import {
	createPerformanceOfficeLedgerService,
	PerformanceOfficeLedgerService
} from './office-ledger';
import {
	decodePublicityMaterialRecord,
	decodePublicityMaterialStats
} from './office-ledger-contract';

const publicityMaterialServiceDecoders = {
	decodeRecord: decodePublicityMaterialRecord,
	decodeStats: decodePublicityMaterialStats
};

export default class PerformancePublicityMaterialService extends PerformanceOfficeLedgerService<
	PublicityMaterialRecord,
	PublicityMaterialStats
> {
	constructor() {
		super('publicityMaterial', publicityMaterialServiceDecoders);
	}
}

export const performancePublicityMaterialService = createPerformanceOfficeLedgerService<
	PublicityMaterialRecord,
	PublicityMaterialStats
>('publicityMaterial', publicityMaterialServiceDecoders);
