/**
 * 文件职责：导出快递协同元数据台账前端 service 实例；不负责页面编排或字段格式化。
 */

import { createPerformanceOfficeLedgerService, PerformanceOfficeLedgerService } from './office-ledger';

export default class PerformanceExpressCollabService extends PerformanceOfficeLedgerService {
	constructor() {
		super('expressCollab');
	}
}

export const performanceExpressCollabService =
	createPerformanceOfficeLedgerService('expressCollab');
