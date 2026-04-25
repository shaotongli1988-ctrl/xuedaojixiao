<!-- 文件职责：展示主题20资产首页汇总、动作总览、状态分布和最近动态；不负责台账 CRUD 或子单据编辑；依赖 asset-dashboard service 与共享状态标签映射；维护重点是首页只消费冻结摘要字段，不把子页面表单逻辑混进来。 -->
<template>
	<div v-if="canAccess" class="asset-dashboard">
		<el-card shadow="never">
			<div class="asset-dashboard__header">
				<div>
					<div class="asset-dashboard__eyebrow">资产管理 / 主题20</div>
					<h2>资产首页</h2>
					<p>
						查看资产总量、净值、折旧和最近流转，作为台账、盘点、调拨和报废的统一入口。
					</p>
				</div>
				<div class="asset-dashboard__filters">
					<el-input
						v-model="filters.category"
						placeholder="分类"
						clearable
						style="width: 180px"
					/>
					<el-button type="primary" @click="loadSummary">刷新</el-button>
				</div>
			</div>
		</el-card>

		<div class="asset-dashboard__cards">
			<el-card v-for="card in metricCards" :key="card.label" shadow="never">
				<div class="asset-dashboard__card-label">{{ card.label }}</div>
				<div class="asset-dashboard__card-value">{{ card.value }}</div>
			</el-card>
		</div>

		<el-card shadow="never" v-loading="loading">
			<template #header>动作总览</template>
			<div class="asset-dashboard__action-cards">
				<el-card v-for="card in actionOverviewCards" :key="card.label" shadow="hover">
					<div class="asset-dashboard__card-label">{{ card.label }}</div>
					<div class="asset-dashboard__card-value">{{ card.value.actionCount }}</div>
					<div class="asset-dashboard__action-meta">
						<span>涉及资产 {{ card.value.assetCount }}</span>
						<span>涉及单据 {{ card.value.documentCount }}</span>
					</div>
				</el-card>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col :span="12">
				<el-card shadow="never" v-loading="loading">
					<template #header>状态分布</template>
					<div class="asset-dashboard__tag-grid">
						<el-tag
							v-for="item in summary?.statusDistribution || []"
							:key="item.status"
							:type="assetStatusTagMap[item.status]?.type || 'info'"
							effect="plain"
						>
							{{ assetStatusTagMap[item.status]?.label || item.status }} /
							{{ item.count }}
						</el-tag>
					</div>
				</el-card>
			</el-col>
			<el-col :span="12">
				<el-card shadow="never" v-loading="loading">
					<template #header>分类分布</template>
					<div class="asset-dashboard__tag-grid">
						<el-tag
							v-for="item in summary?.categoryDistribution || []"
							:key="item.category"
							effect="plain"
						>
							{{ item.category || '未分类' }} / {{ item.count }}
						</el-tag>
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never" v-loading="loading">
			<template #header>最近动作流水</template>
			<el-table :data="activityTimeline" border>
				<el-table-column prop="occurredAt" label="发生时间" min-width="180" />
				<el-table-column prop="actionLabel" label="动作类型" min-width="140" />
				<el-table-column prop="objectNo" label="对象编号" min-width="160" />
				<el-table-column prop="objectName" label="对象名称" min-width="180" />
				<el-table-column prop="operatorName" label="操作人" min-width="120" />
				<el-table-column prop="departmentName" label="所属部门" min-width="140" />
				<el-table-column label="结果状态" min-width="120">
					<template #default="{ row }">
						<el-tag effect="plain">
							{{
								statusLabelMap[row.resultStatus || row.status] ||
								row.resultStatus ||
								row.status ||
								'-'
							}}
						</el-tag>
					</template>
				</el-table-column>
			</el-table>
		</el-card>
	</div>
	<el-result
		v-else
		icon="warning"
		title="暂无访问权限"
		sub-title="当前账号未被授予资产首页权限。"
	/>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { performanceAssetDashboardService } from '../../service/asset-dashboard';
import type {
	AssetDashboardActionSummaryItem,
	AssetDashboardActivityItem,
	AssetDashboardSummary
} from '../../types';
import { resolveErrorMessage, showElementErrorFromError } from '../shared/error-message';
import { assetStatusTagMap, formatMoney } from './shared';

const canAccess = computed(() => checkPerm(performanceAssetDashboardService.permission.summary));
const loading = ref(false);
const summary = ref<AssetDashboardSummary | null>(null);
const filters = reactive({
	category: ''
});

const emptyActionSummary: AssetDashboardActionSummaryItem = {
	actionCount: 0,
	assetCount: 0,
	documentCount: 0
};

const metricCards = computed(() => [
	{ label: '资产总量', value: summary.value?.totalAssetCount || 0 },
	{ label: '资产原值', value: formatMoney(summary.value?.totalOriginalAmount) },
	{ label: '本月折旧', value: formatMoney(summary.value?.monthlyDepreciationAmount) },
	{ label: '待报废单', value: summary.value?.pendingDisposalCount || 0 },
	{ label: '即将过保', value: summary.value?.expiringWarrantyCount || 0 },
	{ label: '可用资产', value: summary.value?.availableCount || 0 }
]);
const actionOverviewCards = computed(() => [
	{
		label: '本日动作',
		value: summary.value?.actionOverview?.today || emptyActionSummary
	},
	{
		label: '本周动作',
		value: summary.value?.actionOverview?.thisWeek || emptyActionSummary
	},
	{
		label: '本月动作',
		value: summary.value?.actionOverview?.thisMonth || emptyActionSummary
	}
]);
const activityTimeline = computed<AssetDashboardActivityItem[]>(
	() => summary.value?.actionTimeline || summary.value?.recentActivities || []
);
const statusLabelMap: Record<string, string> = {
	draft: '草稿',
	submitted: '已提交',
	received: '已入库',
	cancelled: '已取消',
	assigned: '已领用',
	returned: '已归还',
	lost: '已丢失',
	scheduled: '待维护',
	inProgress: '维护中',
	completed: '已完成',
	counting: '盘点中',
	inTransfer: '调拨中',
	inTransit: '调拨中',
	closed: '已关闭',
	approved: '已审批',
	scrapped: '已报废',
	available: '可用',
	maintenance: '维护中',
	inventorying: '盘点中',
	pendingInbound: '待入库'
};

async function loadSummary() {
	if (!canAccess.value) {
		return;
	}
	loading.value = true;
	try {
		summary.value = await performanceAssetDashboardService.fetchSummary({
			category: filters.category || undefined
		});
	} catch (error: unknown) {
		showElementErrorFromError(error, '资产首页加载失败');
	} finally {
		loading.value = false;
	}
}

if (canAccess.value) {
	loadSummary();
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.data-panel.scss' as dataPanel;

.asset-dashboard {
	@include dataPanel.data-panel-shell;

	--asset-dashboard-card-bg: var(--app-surface-card);
	--asset-dashboard-hero-bg: var(--app-surface-hero);
	--asset-dashboard-muted-bg: var(--app-surface-muted);
	--asset-dashboard-border: var(--app-border-strong);
	--asset-dashboard-text: var(--app-text-primary);
	--asset-dashboard-text-secondary: var(--app-text-secondary);
	--asset-dashboard-eyebrow: var(--app-text-tertiary);

	:deep(.el-card) {
		border-color: var(--asset-dashboard-border);
		background: var(--asset-dashboard-card-bg);
		box-shadow: var(--app-shadow-surface);
	}

	:deep(.el-table) {
		@include dataPanel.data-panel-table;
		--el-table-header-bg-color: var(--asset-dashboard-muted-bg);
	}

	&__header {
		display: flex;
		justify-content: space-between;
		gap: var(--app-space-4);
		flex-wrap: wrap;
		padding: 4px;
		border-radius: var(--app-radius-lg);
		background: var(--asset-dashboard-hero-bg);
	}

	&__eyebrow {
		font-size: var(--app-font-size-caption);
		color: var(--asset-dashboard-eyebrow);
		margin-bottom: var(--app-space-2);
	}

	&__filters,
	&__cards,
	&__action-cards,
	&__tag-grid {
		display: flex;
		gap: var(--app-space-3);
		flex-wrap: wrap;
	}

	&__action-meta {
		margin-top: var(--app-space-2);
		display: flex;
		gap: var(--app-space-4);
		flex-wrap: wrap;
		color: var(--asset-dashboard-text-secondary);
		font-size: 13px;
	}

	&__card-label {
		font-size: var(--app-font-size-caption);
		color: var(--asset-dashboard-text-secondary);
	}

	&__card-value {
		margin-top: var(--app-space-2);
		font-size: 28px;
		font-weight: 600;
		color: var(--asset-dashboard-text);
	}

	@media (max-width: 768px) {
		&__header,
		&__filters {
			flex-direction: column;
			align-items: stretch;
		}

		&__filters {
			:deep(.el-input) {
				width: 100% !important;
			}
		}
	}
}
</style>
