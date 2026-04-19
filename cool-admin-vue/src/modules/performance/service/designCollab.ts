/**
 * 文件职责：导出美工协同元数据台账前端 service 实例；不负责页面编排或字段格式化。
 */

import { createPerformanceOfficeLedgerService, PerformanceOfficeLedgerService } from './office-ledger';

export default class PerformanceDesignCollabService extends PerformanceOfficeLedgerService {
	constructor() {
		super('designCollab');
	}
}

export const performanceDesignCollabService =
	createPerformanceOfficeLedgerService('designCollab');
