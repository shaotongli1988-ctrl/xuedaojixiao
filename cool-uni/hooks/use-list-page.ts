/**
 * 文件职责：提供 cool-uni 绩效移动页共用的列表加载状态机，只统一 rows/loading/error/reload；不负责页面筛选 UI、字典展示或业务动作；维护重点是同类列表页不要继续各自复制一套加载与报错状态。
 */

import { ref } from "vue";

interface UseListPageOptions<TRow> {
	canLoad?: () => boolean;
	fetchPage: () => Promise<{ list?: TRow[] | null } | null | undefined>;
	resolveError?: (error: unknown) => string;
}

export function useListPage<TRow>(options: UseListPageOptions<TRow>) {
	const rows = ref<TRow[]>([]);
	const loading = ref(false);
	const error = ref("");

	async function reload() {
		if (typeof options.canLoad === "function" && !options.canLoad()) {
			return;
		}

		loading.value = true;
		error.value = "";

		try {
			const result = await options.fetchPage();
			rows.value = result?.list || [];
			return result;
		} catch (cause) {
			error.value =
				options.resolveError?.(cause) || (cause as any)?.message || "列表加载失败";
		} finally {
			loading.value = false;
		}
	}

	return {
		rows,
		loading,
		error,
		reload,
	};
}
