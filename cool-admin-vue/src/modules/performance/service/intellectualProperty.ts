/**
 * 文件职责：导出知识产权管理台账前端 service 实例；不负责页面编排或字段格式化。
 */

import type { IntellectualPropertyRecord, IntellectualPropertyStats } from '../types';
import {
	createPerformanceOfficeLedgerService,
	PerformanceOfficeLedgerService
} from './office-ledger';
import {
	decodeIntellectualPropertyRecord,
	decodeIntellectualPropertyStats
} from './office-ledger-contract';

const intellectualPropertyServiceDecoders = {
	decodeRecord: decodeIntellectualPropertyRecord,
	decodeStats: decodeIntellectualPropertyStats
};

export default class PerformanceIntellectualPropertyService extends PerformanceOfficeLedgerService<
	IntellectualPropertyRecord,
	IntellectualPropertyStats
> {
	constructor() {
		super('intellectualProperty', intellectualPropertyServiceDecoders);
	}
}

export const performanceIntellectualPropertyService = createPerformanceOfficeLedgerService<
	IntellectualPropertyRecord,
	IntellectualPropertyStats
>('intellectualProperty', intellectualPropertyServiceDecoders);
