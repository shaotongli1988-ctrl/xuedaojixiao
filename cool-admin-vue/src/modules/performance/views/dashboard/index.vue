<!-- 文件职责：承接模块 3 的绩效驾驶舱首期聚合展示、筛选和图表渲染；不负责跨模块指标拼装、指标库配置和薪资结果归档；依赖 dashboard service、基础部门列表接口和全局 v-chart；维护重点是页面只能展示唯一事实源允许的真实指标，且所有统计都必须来自后端 summary 接口。 -->
<template>
	<div v-if="canAccess" class="dashboard-page">
		<el-card shadow="never" class="dashboard-page__hero">
			<div class="dashboard-page__hero-main">
				<div>
					<div class="dashboard-page__eyebrow">绩效管理 / 模块 3</div>
					<h2 class="dashboard-page__title">绩效驾驶舱</h2>
					<p class="dashboard-page__description">
						当前页面只展示绩效域首期已确认的真实聚合指标，所有统计统一来自
						`/admin/performance/dashboard/summary`。
					</p>
				</div>

				<el-tag effect="plain" type="success">
					{{ refreshing ? '数据刷新中' : `最近刷新 ${lastUpdatedLabel}` }}
				</el-tag>
			</div>

			<div class="dashboard-page__filters">
				<el-select
					v-model="filters.periodType"
					placeholder="周期类型"
					style="width: 150px"
					@change="handlePeriodTypeChange"
				>
					<el-option
						v-for="item in periodTypeOptions"
						:key="item.value"
						:label="item.label"
						:value="item.value"
					/>
				</el-select>

				<el-date-picker
					v-if="filters.periodType === 'month'"
					v-model="filters.periodValue"
					type="month"
					value-format="YYYY-MM"
					placeholder="选择月份"
					style="width: 180px"
				/>

				<el-select
					v-else-if="filters.periodType === 'quarter'"
					v-model="filters.periodValue"
					placeholder="选择季度"
					clearable
					style="width: 180px"
				>
					<el-option
						v-for="item in quarterOptions"
						:key="item.value"
						:label="item.label"
						:value="item.value"
					/>
				</el-select>

				<el-date-picker
					v-else
					v-model="filters.periodValue"
					type="year"
					value-format="YYYY"
					placeholder="选择年份"
					style="width: 180px"
				/>

				<el-tree-select
					v-model="filters.departmentId"
					:data="departmentOptions"
					node-key="id"
					clearable
					check-strictly
					default-expand-all
					:props="departmentTreeProps"
					placeholder="筛选部门"
					style="width: 220px"
				/>

				<el-button @click="resetFilters">重置</el-button>
				<el-button type="primary" :loading="refreshing" @click="refresh">查询汇总</el-button>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col v-for="item in summaryCards" :key="item.key" :xs="24" :sm="12" :lg="8">
				<el-card shadow="never" class="dashboard-page__metric-card">
					<div class="dashboard-page__metric-label">{{ item.label }}</div>
					<div class="dashboard-page__metric-value">{{ item.value }}</div>
					<div class="dashboard-page__metric-tip">{{ item.tip }}</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never" class="dashboard-page__cross-card" v-loading="crossLoading">
			<template #header>
				<div class="dashboard-page__section-header">
					<div class="dashboard-page__section-title">
						<span>跨模块指标汇总</span>
						<span class="dashboard-page__section-subtitle">
							只读展示招聘 / 培训 / 会议聚合快照
						</span>
					</div>
					<el-tag effect="plain" type="info">无明细下钻</el-tag>
				</div>
			</template>

			<div class="dashboard-page__cross-summary">
				<div class="dashboard-page__cross-intro">
					当前区域只消费 `/admin/performance/dashboard/crossSummary` 聚合快照，状态与更新时间以来源域返回为准。
				</div>

				<el-alert
					v-if="crossErrorMessage"
					type="warning"
					:closable="false"
					show-icon
					:title="crossErrorMessage"
				/>

				<el-empty
					v-else-if="crossSummary.metricCards.length === 0"
					description="当前筛选条件下暂无跨模块聚合数据"
				/>

				<div v-else class="dashboard-page__cross-grid">
					<article
						v-for="item in crossSummary.metricCards"
						:key="item.metricCode"
						class="dashboard-page__cross-metric"
						:class="`dashboard-page__cross-metric--${item.dataStatus}`"
					>
						<div class="dashboard-page__cross-head">
							<div>
								<div class="dashboard-page__cross-label">{{ item.metricLabel }}</div>
								<div class="dashboard-page__cross-meta">
									<span>{{ resolveCrossDomainLabel(item.sourceDomain) }}</span>
									<span>{{ resolveCrossPeriodLabel(item.periodType, item.periodValue) }}</span>
								</div>
							</div>

							<el-tag effect="plain" :type="resolveCrossStatusTagType(item.dataStatus)">
								{{ resolveCrossStatusLabel(item) }}
							</el-tag>
						</div>

						<div class="dashboard-page__cross-value">
							<span>{{ resolveCrossMetricValue(item.metricValue) }}</span>
							<small>{{ item.unit || '--' }}</small>
						</div>

						<div class="dashboard-page__cross-foot">
							<div>
								<span class="dashboard-page__cross-foot-label">范围</span>
								<span>{{ resolveCrossScopeLabel(item.scopeType, item.departmentId) }}</span>
							</div>
							<div>
								<span class="dashboard-page__cross-foot-label">更新时间</span>
								<span>{{ resolveCrossUpdatedAt(item.updatedAt) }}</span>
							</div>
						</div>
					</article>
				</div>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col :xs="24" :lg="10">
				<el-card shadow="never" class="dashboard-page__stage-card" v-loading="loading">
					<template #header>
						<div class="dashboard-page__section-header">
							<span>五环节进度</span>
							<el-tag effect="plain">最终结构</el-tag>
						</div>
					</template>

					<div
						v-for="item in summary.stageProgress"
						:key="item.stageKey"
						class="dashboard-page__stage-item"
					>
						<div class="dashboard-page__stage-head">
							<div>
								<div class="dashboard-page__stage-label">{{ item.stageLabel }}</div>
								<div class="dashboard-page__stage-meta">
									{{ item.completedCount }} / {{ item.totalCount }}
								</div>
							</div>
							<div class="dashboard-page__stage-rate">{{ item.completionRate }}%</div>
						</div>

						<el-progress
							:percentage="item.completionRate"
							:stroke-width="10"
							:show-text="false"
						/>
					</div>
				</el-card>
			</el-col>

			<el-col :xs="24" :lg="14">
				<el-card shadow="never" class="dashboard-page__chart-card" v-loading="loading">
					<template #header>
						<div class="dashboard-page__section-header">
							<span>部门绩效分布</span>
							<el-tag effect="plain">已审批评估单均分</el-tag>
						</div>
					</template>

					<v-chart :option="departmentChartOption" autoresize class="dashboard-page__chart" />
				</el-card>
			</el-col>
		</el-row>

		<el-row :gutter="16">
			<el-col :xs="24" :lg="14">
				<el-card shadow="never" class="dashboard-page__table-card" v-loading="loading">
					<template #header>
						<div class="dashboard-page__section-header">
							<span>部门指标明细</span>
							<el-tag effect="plain">{{ summary.departmentDistribution.length }} 个部门</el-tag>
						</div>
					</template>

					<el-table :data="summary.departmentDistribution" border>
						<el-table-column prop="departmentName" label="部门" min-width="160" />
						<el-table-column prop="averageScore" label="平均分" min-width="120" />
						<el-table-column prop="assessmentCount" label="评估单数" min-width="120" />
					</el-table>
				</el-card>
			</el-col>

			<el-col :xs="24" :lg="10">
				<el-card shadow="never" class="dashboard-page__chart-card" v-loading="loading">
					<template #header>
						<div class="dashboard-page__section-header">
							<span>绩效等级分布</span>
							<el-tag effect="plain">S / A / B / C</el-tag>
						</div>
					</template>

					<v-chart :option="gradeChartOption" autoresize class="dashboard-page__chart" />
				</el-card>
			</el-col>
		</el-row>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-dashboard'
});

import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref } from 'vue';
import { useDark } from '@vueuse/core';
import { ElMessage } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { service } from '/@/cool';
import { deepTree } from '/@/cool/utils';
import {
	performanceDashboardService,
	type DashboardSummary
} from '../../service/dashboard';
import type {
	DashboardCrossDataStatus,
	DashboardCrossMetricCard,
	DashboardCrossSourceDomain,
	DashboardCrossSummary
} from '../../types';

const isDark = useDark();

const periodTypeOptions = [
	{ label: '月度', value: 'month' },
	{ label: '季度', value: 'quarter' },
	{ label: '年度', value: 'year' }
];

const emptySummary = (): DashboardSummary => ({
	averageScore: 0,
	pendingApprovalCount: 0,
	goalCompletionRate: 0,
	stageProgress: [
		{
			stageKey: 'indicatorConfigured',
			stageLabel: '指标库配置',
			completedCount: 0,
			totalCount: 0,
			completionRate: 0,
			sort: 1
		},
		{
			stageKey: 'assessmentCreated',
			stageLabel: '评估单创建',
			completedCount: 0,
			totalCount: 0,
			completionRate: 0,
			sort: 2
		},
		{
			stageKey: 'selfSubmitted',
			stageLabel: '自评提交',
			completedCount: 0,
			totalCount: 0,
			completionRate: 0,
			sort: 3
		},
		{
			stageKey: 'managerApproved',
			stageLabel: '审批完成',
			completedCount: 0,
			totalCount: 0,
			completionRate: 0,
			sort: 4
		},
		{
			stageKey: 'resultArchived',
			stageLabel: '结果归档',
			completedCount: 0,
			totalCount: 0,
			completionRate: 0,
			sort: 5
		}
	],
	departmentDistribution: [],
	gradeDistribution: [
		{ grade: 'S', count: 0, ratio: 0 },
		{ grade: 'A', count: 0, ratio: 0 },
		{ grade: 'B', count: 0, ratio: 0 },
		{ grade: 'C', count: 0, ratio: 0 }
	]
});

function emptyCrossSummary(): DashboardCrossSummary {
	return {
		metricCards: []
	};
}

const canAccess = computed(() => checkPerm(performanceDashboardService.permission.summary));
const loading = ref(false);
const crossLoading = ref(false);
const lastUpdatedAt = ref('');
const summary = ref<DashboardSummary>(emptySummary());
const crossSummary = ref<DashboardCrossSummary>(emptyCrossSummary());
const crossErrorMessage = ref('');
const departmentOptions = ref<any[]>([]);

const departmentTreeProps = {
	label: 'name',
	value: 'id',
	children: 'children'
};

const filters = reactive({
	periodType: 'quarter',
	periodValue: resolveCurrentQuarter(),
	departmentId: undefined as number | undefined
});
const refreshing = computed(() => loading.value || crossLoading.value);

const quarterOptions = computed(() => {
	const currentYear = dayjs().year();
	return [currentYear - 1, currentYear, currentYear + 1].flatMap(year =>
		[1, 2, 3, 4].map(quarter => ({
			label: `${year} 年 Q${quarter}`,
			value: `${year}-Q${quarter}`
		}))
	);
});

const summaryCards = computed(() => [
	{
		key: 'averageScore',
		label: '全员绩效均分',
		value: formatScore(summary.value.averageScore),
		tip: '按 approved 状态评估单实时计算'
	},
	{
		key: 'pendingApprovalCount',
		label: '待审批数量',
		value: `${summary.value.pendingApprovalCount}`,
		tip: '按当前账号权限范围统计 submitted 评估单'
	},
	{
		key: 'goalCompletionRate',
		label: '目标完成率',
		value: formatPercent(summary.value.goalCompletionRate),
		tip: '按筛选周期纳入的目标实时计算'
	}
]);

const lastUpdatedLabel = computed(() => {
	if (!lastUpdatedAt.value) {
		return '--';
	}

	return dayjs(lastUpdatedAt.value).format('HH:mm:ss');
});

const axisLabelColor = computed(() => (isDark.value ? '#d4d7de' : '#5f6775'));
const splitLineColor = computed(() => (isDark.value ? '#2d3340' : '#e8ecf3'));

const departmentChartOption = computed(() => ({
	grid: {
		top: 18,
		left: '4%',
		right: '4%',
		bottom: 40,
		containLabel: true
	},
	xAxis: {
		type: 'category',
		data: summary.value.departmentDistribution.map(item => item.departmentName || `部门${item.departmentId}`),
		axisLabel: {
			color: axisLabelColor.value,
			interval: 0,
			rotate: summary.value.departmentDistribution.length > 4 ? 20 : 0
		},
		axisLine: {
			lineStyle: {
				color: splitLineColor.value
			}
		}
	},
	yAxis: {
		type: 'value',
		min: 0,
		axisLabel: {
			color: axisLabelColor.value
		},
		splitLine: {
			lineStyle: {
				color: splitLineColor.value
			}
		}
	},
	tooltip: {
		trigger: 'axis',
		axisPointer: {
			type: 'shadow'
		},
		formatter: (items: Array<{ axisValue: string; data: number }>) => {
			const current = items[0];
			return `${current?.axisValue || ''}<br/>平均分：${formatScore(current?.data || 0)}`;
		}
	},
	series: [
		{
			type: 'bar',
			barWidth: 28,
			data: summary.value.departmentDistribution.map(item => item.averageScore),
			itemStyle: {
				color: '#2f6fed',
				borderRadius: [8, 8, 0, 0]
			}
		}
	]
}));

const gradeChartOption = computed(() => ({
	color: ['#2457c5', '#4d8cf7', '#8cb6ff', '#d6e3ff'],
	tooltip: {
		trigger: 'item',
		formatter: '{b}<br/>数量：{c}<br/>占比：{d}%'
	},
	legend: {
		top: 'bottom',
		textStyle: {
			color: axisLabelColor.value
		}
	},
	series: [
		{
			name: '绩效等级分布',
			type: 'pie',
			radius: ['42%', '64%'],
			center: ['50%', '45%'],
			itemStyle: {
				borderRadius: 8
			},
			label: {
				color: axisLabelColor.value,
				formatter: '{b}\n{d}%'
			},
			data: summary.value.gradeDistribution.map(item => ({
				name: item.grade,
				value: item.count
			}))
		}
	]
}));

onMounted(async () => {
	if (!canAccess.value) {
		return;
	}

	await loadDepartments();
	await refresh();
});

async function loadDepartments() {
	try {
		const result = await service.base.sys.department.list();
		departmentOptions.value = deepTree(result || []);
	} catch (error: any) {
		departmentOptions.value = [];
		ElMessage.warning(error.message || '部门列表加载失败');
	}
}

function handlePeriodTypeChange() {
	if (filters.periodType === 'quarter') {
		filters.periodValue = resolveCurrentQuarter();
		return;
	}

	if (filters.periodType === 'month') {
		filters.periodValue = dayjs().format('YYYY-MM');
		return;
	}

	filters.periodValue = dayjs().format('YYYY');
}

function resetFilters() {
	filters.periodType = 'quarter';
	filters.periodValue = resolveCurrentQuarter();
	filters.departmentId = undefined;
	refresh();
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	loading.value = true;
	crossLoading.value = true;
	crossErrorMessage.value = '';

	const query = buildDashboardQuery();

	const [summaryResult, crossResult] = await Promise.allSettled([
		performanceDashboardService.fetchSummary(query),
		performanceDashboardService.fetchCrossSummary(query)
	]);

	loading.value = false;
	crossLoading.value = false;

	if (summaryResult.status === 'fulfilled') {
		summary.value = summaryResult.value;
		lastUpdatedAt.value = dayjs().toISOString();
	} else {
		summary.value = emptySummary();
		ElMessage.error(resolveSummaryErrorMessage(summaryResult.reason));
	}

	if (crossResult.status === 'fulfilled') {
		crossSummary.value = normalizeCrossSummary(crossResult.value);
	} else {
		crossSummary.value = emptyCrossSummary();
		crossErrorMessage.value = resolveCrossSummaryErrorMessage(crossResult.reason);
	}
}

function buildDashboardQuery() {
	return {
		periodType: filters.periodType || undefined,
		periodValue: filters.periodValue || undefined,
		departmentId: filters.departmentId ? Number(filters.departmentId) : undefined
	};
}

function normalizeCrossSummary(payload?: DashboardCrossSummary | null): DashboardCrossSummary {
	if (!payload || !Array.isArray(payload.metricCards)) {
		return emptyCrossSummary();
	}

	return {
		metricCards: payload.metricCards.map(item => ({
			...item,
			metricValue: typeof item.metricValue === 'number' ? item.metricValue : null,
			unit: item.unit || '',
			statusText: item.statusText || ''
		}))
	};
}

function resolveSummaryErrorMessage(error: any) {
	return error?.message || '驾驶舱汇总加载失败';
}

function resolveCrossSummaryErrorMessage(error: any) {
	const message = error?.message || '';
	if (message.includes('403')) {
		return '跨模块汇总当前账号无权限访问，请先确认权限同步结果。';
	}
	if (message.includes('404')) {
		return '跨模块汇总接口尚未就绪，当前只保留首期绩效域指标展示。';
	}
	return message || '跨模块汇总加载失败，当前不影响首期绩效域指标展示。';
}

function resolveCrossDomainLabel(domain: DashboardCrossSourceDomain) {
	const labelMap: Record<DashboardCrossSourceDomain, string> = {
		recruitment: '招聘域',
		training: '培训域',
		meeting: '会议域'
	};
	return labelMap[domain] || domain;
}

function resolveCrossStatusTagType(status: DashboardCrossDataStatus) {
	const tagMap: Record<DashboardCrossDataStatus, 'success' | 'warning' | 'info'> = {
		ready: 'success',
		delayed: 'warning',
		unavailable: 'info'
	};
	return tagMap[status] || 'info';
}

function resolveCrossStatusLabel(item: DashboardCrossMetricCard) {
	if (item.statusText) {
		return item.statusText;
	}

	const labelMap: Record<DashboardCrossDataStatus, string> = {
		ready: '已就绪',
		delayed: '数据延迟',
		unavailable: '暂不可用'
	};
	return labelMap[item.dataStatus] || '状态未知';
}

function resolveCrossMetricValue(value: number | null) {
	if (value === null || value === undefined) {
		return '--';
	}
	return Number(value).toFixed(2);
}

function resolveCrossScopeLabel(scopeType: string, departmentId: number | null) {
	if (scopeType === 'global') {
		return '全局口径';
	}

	if (scopeType === 'department_tree') {
		return departmentId ? `部门树范围 #${departmentId}` : '部门树范围';
	}

	return '--';
}

function resolveCrossPeriodLabel(periodType: string, periodValue: string) {
	const prefixMap: Record<string, string> = {
		month: '月度',
		quarter: '季度',
		year: '年度'
	};
	return `${prefixMap[periodType] || '周期'} ${periodValue || '--'}`;
}

function resolveCrossUpdatedAt(updatedAt: string | null) {
	if (!updatedAt) {
		return '--';
	}

	return dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss');
}

function resolveCurrentQuarter() {
	const month = dayjs().month() + 1;
	const quarter = Math.ceil(month / 3);
	return `${dayjs().year()}-Q${quarter}`;
}

function formatScore(value: number) {
	return Number(value || 0).toFixed(2);
}

function formatPercent(value: number) {
	return `${Number(value || 0).toFixed(2)}%`;
}
</script>

<style lang="scss" scoped>
.dashboard-page {
	--dashboard-hero-border: #dbe4f3;
	--dashboard-hero-bg:
		radial-gradient(circle at top right, rgba(47, 111, 237, 0.14), transparent 36%),
		linear-gradient(135deg, #f7faff 0%, #ffffff 58%, #eef4ff 100%);
	--dashboard-eyebrow-color: #6c7a92;
	--dashboard-title-color: #18202f;
	--dashboard-description-color: #566176;
	--dashboard-emphasis-color: #183153;
	--dashboard-cross-bg: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
	--dashboard-cross-delayed-bg: linear-gradient(180deg, #fffaf1 0%, #ffffff 100%);
	--dashboard-cross-unavailable-bg: linear-gradient(180deg, #fbfbfc 0%, #ffffff 100%);

	display: grid;
	gap: 16px;

	&__hero {
		border: 1px solid var(--dashboard-hero-border);
		background: var(--dashboard-hero-bg);
	}

	&__hero-main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 20px;
	}

	&__eyebrow {
		margin-bottom: 8px;
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dashboard-eyebrow-color);
	}

	&__title {
		margin: 0;
		font-size: 28px;
		line-height: 1.2;
		color: var(--dashboard-title-color);
	}

	&__description {
		max-width: 720px;
		margin: 12px 0 0;
		font-size: 14px;
		line-height: 1.7;
		color: var(--dashboard-description-color);
	}

	&__filters {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, max-content));
		gap: 12px;
		align-items: center;
	}

	&__metric-card,
	&__stage-card,
	&__chart-card,
	&__table-card {
		height: 100%;
		border: 1px solid var(--el-border-color-light);
	}

	&__metric-label {
		font-size: 13px;
		color: var(--el-text-color-secondary);
	}

	&__metric-value {
		margin-top: 14px;
		font-size: 34px;
		font-weight: 700;
		line-height: 1;
		color: var(--dashboard-emphasis-color);
	}

	&__metric-tip {
		margin-top: 16px;
		font-size: 12px;
		line-height: 1.6;
		color: var(--el-text-color-secondary);
	}

	&__section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		font-weight: 600;
	}

	&__section-title {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	&__section-subtitle {
		font-size: 12px;
		font-weight: 400;
		color: var(--el-text-color-secondary);
	}

	&__cross-card {
		border: 1px solid var(--el-border-color-light);
	}

	&__cross-summary {
		display: grid;
		gap: 16px;
	}

	&__cross-intro {
		font-size: 13px;
		line-height: 1.7;
		color: var(--el-text-color-secondary);
	}

	&__cross-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 16px;
	}

	&__cross-metric {
		display: grid;
		gap: 18px;
		padding: 18px;
		border: 1px solid var(--el-border-color-light);
		border-radius: 16px;
		background: var(--dashboard-cross-bg);
	}

	&__cross-metric--delayed {
		border-color: rgba(230, 162, 60, 0.38);
		background: var(--dashboard-cross-delayed-bg);
	}

	&__cross-metric--unavailable {
		border-color: rgba(144, 147, 153, 0.32);
		background: var(--dashboard-cross-unavailable-bg);
	}

	&__cross-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	&__cross-label {
		font-size: 16px;
		font-weight: 600;
		line-height: 1.4;
		color: var(--el-text-color-primary);
	}

	&__cross-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 8px;
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	&__cross-value {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		font-size: 32px;
		font-weight: 700;
		line-height: 1;
		color: var(--dashboard-emphasis-color);
	}

	&__cross-value small {
		font-size: 13px;
		font-weight: 500;
		line-height: 1.4;
		color: var(--el-text-color-secondary);
	}

	&__cross-foot {
		display: grid;
		gap: 8px;
		padding-top: 14px;
		border-top: 1px dashed var(--el-border-color);
		font-size: 12px;
		line-height: 1.6;
		color: var(--el-text-color-regular);
	}

	&__cross-foot-label {
		margin-right: 6px;
		color: var(--el-text-color-secondary);
	}

	&__stage-item + &__stage-item {
		margin-top: 18px;
		padding-top: 18px;
		border-top: 1px dashed var(--el-border-color);
	}

	&__stage-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 10px;
	}

	&__stage-label {
		font-size: 15px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	&__stage-meta,
	&__stage-rate {
		margin-top: 4px;
		font-size: 13px;
		color: var(--el-text-color-secondary);
	}

	&__chart {
		height: 340px;
		width: 100%;
	}
}

:global(html.dark .dashboard-page) {
	--dashboard-hero-border: rgba(103, 126, 176, 0.28);
	--dashboard-hero-bg:
		radial-gradient(circle at top right, rgba(79, 137, 255, 0.16), transparent 34%),
		linear-gradient(135deg, rgba(24, 31, 46, 0.96) 0%, rgba(19, 24, 36, 0.98) 58%, rgba(15, 20, 31, 1) 100%);
	--dashboard-eyebrow-color: #95a5c6;
	--dashboard-title-color: #eef3ff;
	--dashboard-description-color: #b5c0d4;
	--dashboard-emphasis-color: #dbe6ff;
	--dashboard-cross-bg: linear-gradient(180deg, rgba(29, 36, 52, 0.94) 0%, rgba(20, 26, 39, 0.98) 100%);
	--dashboard-cross-delayed-bg: linear-gradient(180deg, rgba(58, 45, 19, 0.94) 0%, rgba(33, 28, 18, 0.98) 100%);
	--dashboard-cross-unavailable-bg: linear-gradient(180deg, rgba(40, 43, 49, 0.94) 0%, rgba(26, 29, 35, 0.98) 100%);
}

@media (max-width: 1080px) {
	.dashboard-page {
		&__filters {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		&__cross-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
}

@media (max-width: 768px) {
	.dashboard-page {
		&__hero-main {
			flex-direction: column;
		}

		&__filters {
			grid-template-columns: 1fr;
		}

		&__cross-grid {
			grid-template-columns: 1fr;
		}

		&__cross-head {
			flex-direction: column;
		}

		&__metric-value {
			font-size: 28px;
		}
	}
}
</style>
