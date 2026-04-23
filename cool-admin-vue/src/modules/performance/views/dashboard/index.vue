<!-- 文件职责：装配驾驶舱页面结构、权限、筛选、空态与组件组合；不直接书写复杂图表映射和单卡逻辑。 -->
<script setup lang="ts">
defineOptions({
	name: 'performance-dashboard'
});

import { computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { performanceDashboardService } from '../../service/dashboard';
import DashboardCrossMetric from './components/dashboard-cross-metric.vue';
import DashboardDepartmentChart from './components/dashboard-department-chart.vue';
import DashboardEmptyState from './components/dashboard-empty-state.vue';
import DashboardFilterBar from './components/dashboard-filter-bar.vue';
import DashboardGradeChart from './components/dashboard-grade-chart.vue';
import DashboardStageProgress from './components/dashboard-stage-progress.vue';
import DashboardStatCard from './components/dashboard-stat-card.vue';
import { useDashboardQuery } from './composables/use-dashboard-query';
import { mapDashboardPageViewModel } from './types/dashboard.mapper';
import type { DashboardEmptyKind, DashboardFilterViewModel } from './types/dashboard.view-model';

const canView = computed(() => checkPerm(performanceDashboardService.permission.summary));
const canQuery = computed(() => checkPerm(performanceDashboardService.permission.summary));
const canDrilldown = computed(() => checkPerm(performanceDashboardService.permission.crossSummary));

const {
	filters,
	loading,
	initialized,
	errorMessage,
	summary,
	crossSummary,
	isEmpty,
	refresh,
	patchFilters
} = useDashboardQuery(performanceDashboardService);

const pageVm = computed(() =>
	mapDashboardPageViewModel({
		summary: summary.value,
		crossSummary: crossSummary.value,
		refreshing: loading.value,
		errorMessage: errorMessage.value
	})
);

const emptyKind = computed<DashboardEmptyKind | undefined>(() => {
	if (!canView.value) return 'no-permission';
	if (loading.value && !initialized.value) return 'loading';
	if (errorMessage.value) return 'unavailable';
	if (isEmpty.value) return 'no-data';
	return undefined;
});

watch(
	() => canView.value,
	value => {
		if (value) {
			void refresh();
		}
	},
	{ immediate: true }
);

function handleRefresh() {
	if (!canQuery.value) {
		ElMessage.error('当前账号无权查询汇总');
		return;
	}

	void refresh();
}

function handleFilterChange(next: DashboardFilterViewModel) {
	patchFilters(next);
}

function handleCrossDrilldown(metricCode: string) {
	if (!canDrilldown.value) {
		ElMessage.error('当前账号无权细钻');
		return;
	}

	ElMessage.info(`细钻占位：${metricCode}`);
}
</script>

<template>
	<div class="dashboard-page">
		<DashboardFilterBar
			:model-value="filters"
			:title="pageVm.hero.title"
			:subtitle="pageVm.hero.description"
			:last-updated-label="pageVm.hero.lastUpdatedLabel"
			:scope-label="pageVm.hero.scopeLabel"
			:disabled="!canQuery"
			:loading="loading"
			@update:model-value="handleFilterChange"
			@refresh="handleRefresh"
		/>

		<DashboardEmptyState v-if="emptyKind" :kind="emptyKind" :description="errorMessage || ''" />

		<template v-else>
			<section class="dashboard-page__overview">
				<div class="dashboard-page__overview-main">
					<div>
						<div class="dashboard-page__section-title">本期概览</div>
						<p class="dashboard-page__description">
							{{
								pageVm.hero.scopeLabel
							}}，优先关注待审批事项与跨模块异常，再进入具体模块细查。
						</p>
					</div>

					<div class="dashboard-page__overview-tags">
						<el-tag effect="plain">当前周期 {{ filters.periodValue }}</el-tag>
						<el-tag
							effect="plain"
							:type="pageVm.hero.refreshing ? 'warning' : 'success'"
						>
							{{ pageVm.hero.refreshing ? '数据刷新中' : '汇总已同步' }}
						</el-tag>
					</div>
				</div>
			</section>

			<section class="dashboard-page__stats">
				<div
					v-for="item in pageVm.stats"
					:key="item.key"
					class="dashboard-page__stat"
					:class="`dashboard-page__stat--${item.variant || 'default'}`"
				>
					<DashboardStatCard
						:label="item.label"
						:value="item.value"
						:unit="item.unit"
						:helper="item.helper"
						:trend="item.trend"
						:tone="item.tone"
						:variant="item.variant"
					/>
				</div>
			</section>

			<section class="dashboard-page__main-grid">
				<div class="dashboard-page__main-column">
					<section class="dashboard-page__cross">
						<header class="dashboard-page__section-header">
							<div>
								<div class="dashboard-page__section-title">跨模块观察点</div>
								<div class="dashboard-page__section-desc">
									对招聘、培训、会议三类聚合结果做风险和机会提示。
								</div>
							</div>
							<el-tag effect="plain">支持细钻</el-tag>
						</header>

						<el-empty
							v-if="!pageVm.crossMetrics.length"
							description="当前筛选条件下暂无跨模块聚合数据"
						/>

						<div v-else class="dashboard-page__cross-grid">
							<DashboardCrossMetric
								v-for="item in pageVm.crossMetrics"
								:key="item.metricCode"
								:item="item"
								:clickable="canDrilldown"
								@drilldown="handleCrossDrilldown"
							/>
						</div>
					</section>

					<DashboardStageProgress :items="pageVm.stageProgress" />
				</div>

				<div class="dashboard-page__side-column">
					<DashboardDepartmentChart :items="pageVm.departmentBars" />
					<DashboardGradeChart :items="pageVm.gradeSlices" />
				</div>
			</section>
		</template>
	</div>
</template>

<style scoped lang="scss">
@use '../../../../styles/patterns.page-shell.scss' as pageShell;

.dashboard-page {
	@include pageShell.page-shell;

	&__overview {
		@include pageShell.page-card;
	}

	&__overview-main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--app-space-4);
	}

	&__description {
		max-width: 760px;
		margin: var(--app-space-2) 0 0;
		font-size: var(--app-font-size-body);
		line-height: 1.75;
		color: var(--app-text-secondary);
	}

	&__overview-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--app-space-2);
		justify-content: flex-end;
	}

	&__stats {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: var(--app-space-4);
	}

	&__stat {
		grid-column: span 3;
		min-width: 0;
	}

	&__stat--featured {
		grid-column: span 4;
	}

	&__main-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
		gap: var(--app-space-4);
		align-items: start;
	}

	&__section-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--app-space-3);
	}

	&__section-title {
		font-size: var(--app-font-size-title);
		font-weight: 700;
		color: var(--app-text-primary);
	}

	&__section-desc {
		margin-top: 6px;
		font-size: var(--app-font-size-caption);
		line-height: 1.6;
		color: var(--app-text-tertiary);
	}

	&__main-column,
	&__side-column,
	&__cross-grid {
		display: grid;
		gap: var(--app-space-4);
	}

	&__cross {
		display: grid;
		gap: var(--app-space-4);
	}

	&__cross-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
}

@media (max-width: 1440px) {
	.dashboard-page {
		max-width: 1440px;
		margin: 0 auto;
	}
}

@media (min-width: 1920px) {
	.dashboard-page {
		max-width: 1760px;
		margin: 0 auto;
	}
}

@media (max-width: 1200px) {
	.dashboard-page {
		&__main-grid,
		&__cross-grid,
		&__stats {
			grid-template-columns: repeat(1, minmax(0, 1fr));
		}

		&__stat,
		&__stat--featured {
			grid-column: auto;
		}
	}
}

@media (max-width: 768px) {
	.dashboard-page {
		padding: var(--app-space-3);

		&__overview-main,
		&__overview-tags,
		&__section-header {
			flex-direction: column;
			align-items: stretch;
		}
	}
}
</style>
