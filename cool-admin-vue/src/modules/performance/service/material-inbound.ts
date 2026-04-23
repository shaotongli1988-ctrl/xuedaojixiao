/**
 * 物资入库前端请求服务。
 * 这里只封装物资管理一期 materialInbound 的列表、CRUD 和最小状态动作接口，
 * 不负责采购审批中心、付款或库存总账扩展。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import {
	decodeMaterialInboundPageResult,
	decodeMaterialInboundRecord
} from './material-inbound-contract';
import type {
	MaterialInboundCancelPayload,
	MaterialInboundCreatePayload,
	MaterialInboundInfoQuery,
	MaterialInboundPageQuery,
	MaterialInboundPageResult,
	MaterialInboundReceivePayload,
	MaterialInboundRecord,
	MaterialInboundSubmitPayload,
	MaterialInboundUpdatePayload
} from '../types';
import { PERMISSIONS } from '../../base/generated/permissions.generated';

export default class PerformanceMaterialInboundService extends BaseService {
	permission = {
		page: PERMISSIONS.performance.materialInbound.page,
		info: PERMISSIONS.performance.materialInbound.info,
		add: PERMISSIONS.performance.materialInbound.add,
		update: PERMISSIONS.performance.materialInbound.update,
		submit: PERMISSIONS.performance.materialInbound.submit,
		receive: PERMISSIONS.performance.materialInbound.receive,
		cancel: PERMISSIONS.performance.materialInbound.cancel
	};

	constructor() {
		super('admin/performance/materialInbound');
	}

	fetchPage(data: MaterialInboundPageQuery) {
		return asPerformanceServicePromise<MaterialInboundPageResult>(
			super.page(data),
			decodeMaterialInboundPageResult
		);
	}

	fetchInfo(params: MaterialInboundInfoQuery) {
		return asPerformanceServicePromise<MaterialInboundRecord>(
			super.info(params),
			decodeMaterialInboundRecord
		);
	}

	createInbound(data: MaterialInboundCreatePayload) {
		return asPerformanceServicePromise<MaterialInboundRecord>(
			super.add(data),
			decodeMaterialInboundRecord
		);
	}

	updateInbound(data: MaterialInboundUpdatePayload) {
		return asPerformanceServicePromise<MaterialInboundRecord>(
			super.update(data),
			decodeMaterialInboundRecord
		);
	}

	submitInbound(data: MaterialInboundSubmitPayload) {
		return asPerformanceServicePromise<MaterialInboundRecord>(
			this.request({
				url: '/submit',
				method: 'POST',
				data
			}),
			decodeMaterialInboundRecord
		);
	}

	receiveInbound(data: MaterialInboundReceivePayload) {
		return asPerformanceServicePromise<MaterialInboundRecord>(
			this.request({
				url: '/receive',
				method: 'POST',
				data
			}),
			decodeMaterialInboundRecord
		);
	}

	cancelInbound(data: MaterialInboundCancelPayload) {
		return asPerformanceServicePromise<MaterialInboundRecord>(
			this.request({
				url: '/cancel',
				method: 'POST',
				data
			}),
			decodeMaterialInboundRecord
		);
	}
}

export const performanceMaterialInboundService = new PerformanceMaterialInboundService();
