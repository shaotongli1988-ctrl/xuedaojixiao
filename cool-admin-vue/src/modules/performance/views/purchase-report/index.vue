<!-- 文件职责：承接主题11采购报表只读视图；不负责导出、BI 看板或财务/库存联动分析；依赖 purchase-report service 与采购增强字段口径；维护重点是 HR 全量、经理范围视图与只读报表边界不能漂移。 -->
<template>
	<div v-if="canAccess" class="purchase-report-page">
		<el-card shadow="never">
			<div class="purchase-report-page__toolbar">
				<div class="purchase-report-page__toolbar-left">
					<el-select
						v-model="filterSupplierIdModel"
						placeholder="供应商"
						clearable
						filterable
						style="width: 240px"
					>
						<el-option
							v-for="item in supplierOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
					<el-date-picker
						v-model="filters.startDate"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="开始日期"
						style="width: 170px"
					/>
					<el-date-picker
						v-model="filters.endDate"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="结束日期"
						style="width: 170px"
					/>
				</div>
				<div class="purchase-report-page__toolbar-right">
					<el-button @click="refresh">查询</el-button>
					<el-button @click="resetFilters">重置</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="purchase-report-page__header">
					<div class="purchase-report-page__header-main">
						<h2>采购报表</h2>
						<el-tag effect="plain">主题 11</el-tag>
						<el-tag effect="plain" type="info">
							{{ roleFact.scopeLabel }}
						</el-tag>
					</div>
					<el-alert
						title="采购报表仅消费 purchaseReport 的 summary / trend / supplierStats，只做采购增强统计，不进入付款、对账或库存总账分析。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<div class="purchase-report-page__summary" v-loading="loading">
				<el-statistic title="采购单总数" :value="summary.totalOrders" />
				<el-statistic title="采购总金额" :value="summary.totalAmount" :precision="2" />
				<el-statistic title="待审批" :value="summary.pendingApprovalCount" />
				<el-statistic title="已审批" :value="summary.approvedCount" />
				<el-statistic title="已收货" :value="summary.receivedCount" />
				<el-statistic title="已关闭" :value="summary.closedCount" />
				<el-statistic title="供应商数" :value="summary.supplierCount" />
			</div>
		</el-card>

		<div class="purchase-report-page__grid">
			<el-card shadow="never" v-loading="loading">
				<template #header>趋势视图</template>
				<el-table :data="trendRows" border>
					<el-table-column prop="period" label="周期" min-width="140" />
					<el-table-column prop="orderCount" label="采购单数" width="110" />
					<el-table-column prop="approvedCount" label="已审批" width="110" />
					<el-table-column prop="receivedQuantity" label="累计收货" width="120" />
					<el-table-column label="总金额" min-width="130">
						<template #default="{ row }">
							{{ formatAmount(row.totalAmount) }}
						</template>
					</el-table-column>
				</el-table>
				<el-empty v-if="!trendRows.length" description="暂无趋势数据" />
			</el-card>

			<el-card shadow="never" v-loading="loading">
				<template #header>供应商统计</template>
				<el-table :data="supplierStats" border>
					<el-table-column prop="supplierName" label="供应商" min-width="160" />
					<el-table-column prop="orderCount" label="采购单数" width="110" />
					<el-table-column prop="receivedQuantity" label="累计收货" width="120" />
					<el-table-column label="采购金额" min-width="130">
						<template #default="{ row }">
							{{ formatAmount(row.totalAmount) }}
						</template>
					</el-table-column>
					<el-table-column prop="lastOrderDate" label="最近采购日期" min-width="140">
						<template #default="{ row }">
							{{ row.lastOrderDate || '-' }}
						</template>
					</el-table-column>
				</el-table>
				<el-empty v-if="!supplierStats.length" description="暂无供应商统计" />
			</el-card>
		</div>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-purchase-report'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceAccessContextService } from '../../service/access-context';
import { performancePurchaseReportService } from '../../service/purchase-report';
import { resolvePerformanceRoleFact } from '../../service/role-fact';
import { performanceSupplierService } from '../../service/supplier';
import {
	createElementWarningFromErrorHandler,
	resolveErrorMessage,
	showElementErrorFromError
} from '../shared/error-message';
import type {
	PerformanceAccessContext,
	PurchaseReportSummary,
	PurchaseReportSupplierStat,
	PurchaseReportTrendPoint,
	SupplierOption
} from '../../types';

const supplierOptions = ref<SupplierOption[]>([]);
const summary = reactive<PurchaseReportSummary>({
	totalOrders: 0,
	totalAmount: 0,
	inquiringCount: 0,
	pendingApprovalCount: 0,
	approvedCount: 0,
	receivedCount: 0,
	closedCount: 0,
	cancelledCount: 0,
	supplierCount: 0
});
const trendRows = ref<PurchaseReportTrendPoint[]>([]);
const supplierStats = ref<PurchaseReportSupplierStat[]>([]);
const accessContext = ref<PerformanceAccessContext | null>(null);

const canAccess = computed(
	() =>
		checkPerm(performancePurchaseReportService.permission.summary) ||
		checkPerm(performancePurchaseReportService.permission.trend) ||
		checkPerm(performancePurchaseReportService.permission.supplierStats)
);
const roleFact = computed(() =>
	resolvePerformanceRoleFact({
		personaKey: accessContext.value?.activePersonaKey || null,
		roleKind: accessContext.value?.roleKind || null
	})
);
const purchaseReportQuery = useListPage({
	createFilters: () => ({
		supplierId: undefined as number | undefined,
		startDate: '',
		endDate: ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params => {
		const requestParams = {
			supplierId: params.supplierId,
			startDate: params.startDate || undefined,
			endDate: params.endDate || undefined
		};
		const [summaryResult, trendResult, supplierResult] = await Promise.all([
			checkPerm(performancePurchaseReportService.permission.summary)
				? performancePurchaseReportService.fetchSummary(requestParams)
				: Promise.resolve<PurchaseReportSummary | null>(null),
			checkPerm(performancePurchaseReportService.permission.trend)
				? performancePurchaseReportService.fetchTrend(requestParams)
				: Promise.resolve<PurchaseReportTrendPoint[]>([]),
			checkPerm(performancePurchaseReportService.permission.supplierStats)
				? performancePurchaseReportService.fetchSupplierStats(requestParams)
				: Promise.resolve<PurchaseReportSupplierStat[]>([])
		]);

		Object.assign(summary, {
			totalOrders: 0,
			totalAmount: 0,
			inquiringCount: 0,
			pendingApprovalCount: 0,
			approvedCount: 0,
			receivedCount: 0,
			closedCount: 0,
			cancelledCount: 0,
			supplierCount: 0,
			...(summaryResult || {})
		});
		trendRows.value = Array.isArray(trendResult) ? trendResult : [];
		supplierStats.value = Array.isArray(supplierResult) ? supplierResult : [];

		return {
			list: [],
			pagination: {
				total: Array.isArray(supplierResult) ? supplierResult.length : 0
			}
		};
	},
	onError: (error: unknown) => {
		showElementErrorFromError(error, '采购报表加载失败');
	}
});
const filters = purchaseReportQuery.filters;
const loading = purchaseReportQuery.loading;
const filterSupplierIdModel = computed<number | undefined>({
	get: () => filters.supplierId ?? undefined,
	set: value => {
		filters.supplierId = value;
	}
});

onMounted(async () => {
	await Promise.all([loadAccessContext(), loadSuppliers(), refresh()]);
});

async function loadAccessContext() {
	try {
		accessContext.value = await performanceAccessContextService.fetchContext();
	} catch {
		accessContext.value = null;
	}
}

async function loadSuppliers() {
	try {
		const result = await performanceSupplierService.fetchPage({
			page: 1,
			size: 200
		});
		supplierOptions.value = (result.list || []).map(item => ({
			id: Number(item.id),
			name: item.name
		}));
	} catch (error: unknown) {
		supplierOptions.value = [];
		createElementWarningFromErrorHandler('供应商选项加载失败')(error);
	}
}

async function refresh() {
	if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
		ElMessage.warning('结束日期不能早于开始日期');
		return;
	}
	await purchaseReportQuery.reload();
}

function resetFilters() {
	void purchaseReportQuery.reset({
		supplierId: undefined
	});
}

function formatAmount(value?: number) {
	return `CNY ${Number(value || 0).toFixed(2)}`;
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.data-panel.scss' as dataPanel;
@use '../../../../styles/patterns.overlay-responsive.scss' as overlayResponsive;

.purchase-report-page {
	@include dataPanel.data-panel-shell;

	--purchase-report-card-bg: var(--app-surface-card);
	--purchase-report-muted-bg: var(--app-surface-muted);
	--purchase-report-border: var(--app-border-strong);
	--purchase-report-text: var(--app-text-primary);

	:deep(.el-card) {
		border-color: var(--purchase-report-border);
		background: var(--purchase-report-card-bg);
		box-shadow: var(--app-shadow-surface);
	}

	:deep(.el-table) {
		@include dataPanel.data-panel-table;
	}

	:deep(.el-statistic) {
		padding: var(--app-space-3);
		border: 1px solid var(--purchase-report-border);
		border-radius: var(--app-radius-md);
		background: var(--purchase-report-muted-bg);
	}

	@include overlayResponsive.horizontal-scroll-table(640px);

	&__toolbar,
	&__toolbar-left,
	&__toolbar-right,
	&__header-main {
		display: flex;
		align-items: center;
		gap: var(--app-space-3);
		flex-wrap: wrap;
	}

	&__toolbar {
		@include dataPanel.data-panel-toolbar;
	}

	&__header {
		display: grid;
		gap: var(--app-space-3);
	}

	&__header-main h2 {
		margin: 0;
		font-size: var(--app-font-size-title);
		color: var(--purchase-report-text);
	}

	&__summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: var(--app-space-4);
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
		gap: var(--app-space-4);
	}

	@include overlayResponsive.overlay-responsive;

	@media (max-width: 768px) {
		&__toolbar-left,
		&__toolbar-right,
		&__header-main {
			flex-direction: column;
			align-items: stretch;
		}

		&__grid {
			grid-template-columns: 1fr;
		}

		&__toolbar-left,
		&__toolbar-right {
			> * {
				max-width: 100%;
				min-width: 0;
			}

			:deep(.el-input),
			:deep(.el-select),
			:deep(.el-date-editor.el-input),
			:deep(.el-date-editor.el-date-editor) {
				width: 100% !important;
			}
		}
	}
}
</style>
