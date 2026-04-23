/**
 * 文件职责：导出车辆管理台账前端 service 实例；不负责页面编排或字段格式化。
 */

import type { VehicleRecord, VehicleStats } from '../types';
import { createPerformanceOfficeLedgerService, PerformanceOfficeLedgerService } from './office-ledger';
import { decodeVehicleRecord, decodeVehicleStats } from './office-ledger-contract';

const vehicleServiceDecoders = {
	decodeRecord: decodeVehicleRecord,
	decodeStats: decodeVehicleStats
};

export default class PerformanceVehicleService extends PerformanceOfficeLedgerService<
	VehicleRecord,
	VehicleStats
> {
	constructor() {
		super('vehicle', vehicleServiceDecoders);
	}
}

export const performanceVehicleService = createPerformanceOfficeLedgerService<
	VehicleRecord,
	VehicleStats
>('vehicle', vehicleServiceDecoders);
