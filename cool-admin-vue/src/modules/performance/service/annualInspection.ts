/**
 * 文件职责：导出年检材料元数据台账前端 service 实例；不负责页面编排或字段格式化。
 */

import { createPerformanceOfficeLedgerService, PerformanceOfficeLedgerService } from './office-ledger';

export default class PerformanceAnnualInspectionService extends PerformanceOfficeLedgerService {
	constructor() {
		super('annualInspection');
	}
}

export const performanceAnnualInspectionService =
	createPerformanceOfficeLedgerService('annualInspection');
