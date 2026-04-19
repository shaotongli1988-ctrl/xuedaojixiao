/**
 * 文件职责：导出荣誉管理元数据台账前端 service 实例；不负责页面编排或字段格式化。
 */

import { createPerformanceOfficeLedgerService, PerformanceOfficeLedgerService } from './office-ledger';

export default class PerformanceHonorService extends PerformanceOfficeLedgerService {
	constructor() {
		super('honor');
	}
}

export const performanceHonorService = createPerformanceOfficeLedgerService('honor');
