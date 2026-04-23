/**
 * 绩效角色访问上下文前端请求服务。
 * 这里只负责读取后端下发的 persona / workbench 上下文，不负责本地权限判断或工作台卡片渲染。
 */
import { BaseService } from '/@/cool';
import { asPerformanceServicePromise } from './service-contract';
import { decodePerformanceAccessContext } from './access-context-contract';
import type { PerformanceAccessContext, PerformancePersonaOption } from '../types';

export type { PerformanceAccessContext, PerformancePersonaOption } from '../types';

export default class PerformanceAccessContextService extends BaseService {
	constructor() {
		super('admin/base/comm');
	}

	async fetchContext(activePersonaKey?: string | null) {
		return asPerformanceServicePromise(
			this.request({
				url: '/performanceAccessContext',
				method: 'GET',
				params: activePersonaKey
					? {
							activePersonaKey
					  }
					: undefined
			}),
			decodePerformanceAccessContext
		);
	}

	async saveActivePersonaKey(activePersonaKey?: string | null) {
		return asPerformanceServicePromise(
			this.request({
				url: '/performanceAccessContext/activePersona',
				method: 'POST',
				data: {
					activePersonaKey: activePersonaKey || null
				}
			}),
			decodePerformanceAccessContext
		);
	}
}

export const performanceAccessContextService = new PerformanceAccessContextService();
