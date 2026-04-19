/**
 * 文件职责：导出宣传资料元数据台账前端 service 实例；不负责 documentCenter 引用选择或页面编排。
 */

import { createPerformanceOfficeLedgerService, PerformanceOfficeLedgerService } from './office-ledger';

export default class PerformancePublicityMaterialService extends PerformanceOfficeLedgerService {
	constructor() {
		super('publicityMaterial');
	}
}

export const performancePublicityMaterialService =
	createPerformanceOfficeLedgerService('publicityMaterial');
