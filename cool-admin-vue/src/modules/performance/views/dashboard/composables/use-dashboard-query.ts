/* 文件职责：统一管理驾驶舱请求、筛选、竞态保护和 debounce；不负责页面渲染。 */

import { computed, reactive, ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { resolveErrorMessage } from '../../shared/error-message';
import type {
	DashboardCrossSummaryResponseDto,
	DashboardSummaryQueryDto,
	DashboardSummaryResponseDto,
} from '../types/dashboard.dto';
import { createEmptyCrossSummary, createEmptyDashboardSummary } from '../types/dashboard.mapper';

export interface DashboardQueryService {
	fetchSummary(params: DashboardSummaryQueryDto): Promise<DashboardSummaryResponseDto>;
	fetchCrossSummary(params: DashboardSummaryQueryDto): Promise<DashboardCrossSummaryResponseDto>;
}

export function useDashboardQuery(service: DashboardQueryService) {
	const filters = reactive<DashboardSummaryQueryDto>({
		periodType: 'quarter',
		periodValue: `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
		departmentId: undefined,
	});

	const loading = ref(false);
	const initialized = ref(false);
	const errorMessage = ref('');
	const summary = ref<DashboardSummaryResponseDto>(createEmptyDashboardSummary());
	const crossSummary = ref<DashboardCrossSummaryResponseDto>(createEmptyCrossSummary());

	let requestId = 0;

	async function refresh() {
		const currentRequestId = ++requestId;
		loading.value = true;
		errorMessage.value = '';

		try {
			const [summaryResult, crossResult] = await Promise.all([
				service.fetchSummary({ ...filters }),
				service.fetchCrossSummary({ ...filters }),
			]);

			if (currentRequestId !== requestId) {
				return;
			}

			summary.value = {
				...summaryResult,
				updatedAt: summaryResult.updatedAt || new Date().toISOString(),
			};
			crossSummary.value = crossResult;
			initialized.value = true;
		} catch (error: unknown) {
			if (currentRequestId !== requestId) {
				return;
			}

			summary.value = createEmptyDashboardSummary();
			crossSummary.value = createEmptyCrossSummary();
			errorMessage.value = resolveErrorMessage(error, '驾驶舱数据加载失败');
			initialized.value = true;
		} finally {
			if (currentRequestId === requestId) {
				loading.value = false;
			}
		}
	}

	const debouncedRefresh = useDebounceFn(() => void refresh(), 220);

	function patchFilters(next: Partial<DashboardSummaryQueryDto>) {
		Object.assign(filters, next);
		debouncedRefresh();
	}

	function resetFilters() {
		filters.periodType = 'quarter';
		filters.periodValue = `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
		filters.departmentId = undefined;
		void refresh();
	}

	const isEmpty = computed(() => {
		return (
			initialized.value &&
			!loading.value &&
			!errorMessage.value &&
			summary.value.departmentDistribution.length === 0 &&
			crossSummary.value.metricCards.length === 0
		);
	});

	return {
		filters,
		loading,
		initialized,
		errorMessage,
		summary,
		crossSummary,
		isEmpty,
		refresh,
		patchFilters,
		resetFilters,
	};
}
