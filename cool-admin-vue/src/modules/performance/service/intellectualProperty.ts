/**
 * 文件职责：导出知识产权管理台账前端 service 实例；不负责页面编排或字段格式化。
 */

import { createPerformanceOfficeLedgerService, PerformanceOfficeLedgerService } from './office-ledger';

export default class PerformanceIntellectualPropertyService extends PerformanceOfficeLedgerService {
	constructor() {
		super('intellectualProperty');
	}
}

export const performanceIntellectualPropertyService =
	createPerformanceOfficeLedgerService('intellectualProperty');
