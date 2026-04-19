/**
 * 绩效模块列表页状态收敛 composable。
 * 这里只统一查询条件、分页和加载态，不负责页面权限、错误提示文案或具体业务动作。
 * 维护重点是保持“同一页只保留一套查询/翻页入口”，避免列表页重复堆叠相同状态机。
 */

import { reactive, ref } from 'vue';

/**
 * @template TRow
 * @template {Record<string, unknown>} TFilter
 * @param {{
 *   createFilters: () => TFilter,
 *   fetchPage: (params: TFilter & { page: number; size: number }) => Promise<{
 *     list?: TRow[],
 *     pagination?: { total?: number | null } | null
 *   }>,
 *   canLoad?: () => boolean,
 *   onError?: (error: any) => void,
 *   initialPageSize?: number
 * }} options
 */
export function useListPage(options) {
	const filters = reactive(options.createFilters());
	const rows = ref([]);
	const loading = ref(false);
	const pager = reactive({
		page: 1,
		size: Number(options.initialPageSize || 10),
		total: 0
	});

	async function reload() {
		if (typeof options.canLoad === 'function' && !options.canLoad()) {
			return;
		}

		loading.value = true;

		try {
			const result = await options.fetchPage({
				...filters,
				page: pager.page,
				size: pager.size
			});

			rows.value = result?.list || [];
			pager.total = Number(result?.pagination?.total || 0);
			return result;
		} catch (error) {
			options.onError?.(error);
		} finally {
			loading.value = false;
		}
	}

	function goToPage(page) {
		pager.page = Number(page || 1);
		return reload();
	}

	function search() {
		pager.page = 1;
		return reload();
	}

	function reset(nextFilters) {
		Object.assign(filters, options.createFilters(), nextFilters || {});
		pager.page = 1;
		return reload();
	}

	return {
		filters,
		rows,
		loading,
		pager,
		reload,
		goToPage,
		search,
		reset
	};
}
