/**
 * 文件职责：导出快递协同元数据台账前端 service 实例；不负责页面编排或字段格式化。
 */

import type { ExpressCollabRecord, ExpressCollabStats } from '../types';
import {
	createPerformanceOfficeLedgerService,
	PerformanceOfficeLedgerService
} from './office-ledger';
import { decodeExpressCollabRecord, decodeExpressCollabStats } from './office-ledger-contract';

const expressCollabServiceDecoders = {
	decodeRecord: decodeExpressCollabRecord,
	decodeStats: decodeExpressCollabStats
};

export default class PerformanceExpressCollabService extends PerformanceOfficeLedgerService<
	ExpressCollabRecord,
	ExpressCollabStats
> {
	constructor() {
		super('expressCollab', expressCollabServiceDecoders);
	}
}

export const performanceExpressCollabService = createPerformanceOfficeLedgerService<
	ExpressCollabRecord,
	ExpressCollabStats
>('expressCollab', expressCollabServiceDecoders);
