/**
 * 文件职责：导出美工协同元数据台账前端 service 实例；不负责页面编排或字段格式化。
 */

import type { DesignCollabRecord, DesignCollabStats } from '../types';
import {
	createPerformanceOfficeLedgerService,
	PerformanceOfficeLedgerService
} from './office-ledger';
import { decodeDesignCollabRecord, decodeDesignCollabStats } from './office-ledger-contract';

const designCollabServiceDecoders = {
	decodeRecord: decodeDesignCollabRecord,
	decodeStats: decodeDesignCollabStats
};

export default class PerformanceDesignCollabService extends PerformanceOfficeLedgerService<
	DesignCollabRecord,
	DesignCollabStats
> {
	constructor() {
		super('designCollab', designCollabServiceDecoders);
	}
}

export const performanceDesignCollabService = createPerformanceOfficeLedgerService<
	DesignCollabRecord,
	DesignCollabStats
>('designCollab', designCollabServiceDecoders);
