<!-- 文件职责：承接主题20资产折旧列表、汇总和重算入口；不负责财务凭证、总账或回冲分录；依赖 asset-depreciation service 与共享金额格式化；维护重点是页面只消费冻结的 page/summary/recalculate 三个接口。 -->
<template>
	<div class="asset-depreciation-page">
		<AssetCrudPage
			title="折旧"
			description="查看月度折旧列表和汇总，按月份触发资产侧折旧重算。"
			notice="折旧仅做资产侧汇总和重算，不生成会计凭证。"
			:page-permission="PERMISSIONS.performance.assetDepreciation.page"
			:columns="columns"
			:filters="filters"
			:create-filters="createFilters"
			:fetch-page="performanceAssetDepreciationService.fetchPage.bind(performanceAssetDepreciationService)"
			:toolbar-actions="toolbarActions"
		/>
		<el-card shadow="never" v-loading="loading">
			<template #header>汇总</template>
			<div class="asset-depreciation-page__summary">
				<el-tag effect="plain">资产数 {{ summary.assetCount }}</el-tag>
				<el-tag effect="plain">原值 {{ formatMoney(summary.totalOriginalAmount) }}</el-tag>
				<el-tag effect="plain">累计折旧 {{ formatMoney(summary.totalAccumulatedDepreciation) }}</el-tag>
				<el-tag effect="plain">净值 {{ formatMoney(summary.totalNetValue) }}</el-tag>
				<el-tag effect="plain">本月折旧 {{ formatMoney(summary.currentMonthDepreciation) }}</el-tag>
			</div>
		</el-card>
	</div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetDepreciationService } from '../../service/asset-depreciation';
import type { AssetDepreciationSummary } from '../../types';
import { resolveErrorMessage, showElementErrorFromError } from '../shared/error-message';
import { assetStatusTagMap, formatMoney } from './shared';
import { PERMISSIONS } from '../../../base/generated/permissions.generated';

const columns = [
	{ prop: 'assetNo', label: '资产编号', minWidth: 140 },
	{ prop: 'assetName', label: '资产名称', minWidth: 180 },
	{ prop: 'assetStatus', label: '资产状态', minWidth: 120, tagMap: assetStatusTagMap },
	{ prop: 'departmentName', label: '所属部门', minWidth: 140 },
	{ prop: 'depreciationMonth', label: '折旧月份', minWidth: 120 },
	{ prop: 'monthlyDepreciation', label: '本月折旧', minWidth: 120, formatter: formatMoney },
	{ prop: 'netValue', label: '净值', minWidth: 120, formatter: formatMoney }
];

const filters = [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '资产编号 / 名称' },
	{ prop: 'depreciationMonth', label: '折旧月份', type: 'month' }
];

const summary = reactive({
	assetCount: 0,
	totalOriginalAmount: 0,
	totalAccumulatedDepreciation: 0,
	totalNetValue: 0,
	currentMonthDepreciation: 0
});
const loading = ref(false);

const toolbarActions = [
	{
		key: 'recalculate',
		label: '折旧重算',
		permission: PERMISSIONS.performance.assetDepreciation.recalculate,
		type: 'primary',
		handler: async () => {
			await performanceAssetDepreciationService.recalculate({
				depreciationMonth: createFilters().depreciationMonth
			});
			await loadSummary();
		},
		successMessage: '折旧已重算'
	}
];

function createFilters() {
	const month = new Date().toISOString().slice(0, 7);
	return {
		keyword: '',
		depreciationMonth: month
	};
}

async function loadSummary() {
	loading.value = true;
	try {
		const result: AssetDepreciationSummary = await performanceAssetDepreciationService.fetchSummary({
			depreciationMonth: createFilters().depreciationMonth
		});
		Object.assign(summary, result || {});
	} catch (error: unknown) {
		showElementErrorFromError(error, '折旧汇总加载失败');
	} finally {
		loading.value = false;
	}
}

loadSummary();
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.data-panel.scss' as dataPanel;

.asset-depreciation-page {
	@include dataPanel.data-panel-shell;

	--asset-depreciation-card-bg: var(--app-surface-card);
	--asset-depreciation-muted-bg: var(--app-surface-muted);
	--asset-depreciation-border: var(--app-border-strong);

	:deep(.el-card) {
		border-color: var(--asset-depreciation-border);
		background: var(--asset-depreciation-card-bg);
		box-shadow: var(--app-shadow-surface);
	}

	:deep(.el-table) {
		@include dataPanel.data-panel-table;
		--el-table-header-bg-color: var(--asset-depreciation-muted-bg);
	}

	&__summary {
		display: flex;
		gap: var(--app-space-3);
		flex-wrap: wrap;
	}
}
</style>
