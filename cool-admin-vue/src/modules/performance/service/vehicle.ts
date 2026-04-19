/**
 * 文件职责：导出车辆管理台账前端 service 实例；不负责页面编排或字段格式化。
 */

import { createPerformanceOfficeLedgerService, PerformanceOfficeLedgerService } from './office-ledger';

export default class PerformanceVehicleService extends PerformanceOfficeLedgerService {
	constructor() {
		super('vehicle');
	}
}

export const performanceVehicleService = createPerformanceOfficeLedgerService('vehicle');
