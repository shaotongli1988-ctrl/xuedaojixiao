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
					{{ loading ? '数据刷新中' : `最近刷新 ${lastUpdatedLabel}` }}
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
				<el-button type="primary" :loading="loading" @click="refresh">查询汇总</el-button>
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

const canAccess = computed(() => checkPerm(performanceDashboardService.permission.summary));
const loading = ref(false);
const lastUpdatedAt = ref('');
const summary = ref<DashboardSummary>(emptySummary());
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

	try {
		summary.value = await performanceDashboardService.fetchSummary({
			periodType: filters.periodType || undefined,
			periodValue: filters.periodValue || undefined,
			departmentId: filters.departmentId ? Number(filters.departmentId) : undefined
		});
		lastUpdatedAt.value = dayjs().toISOString();
	} catch (error: any) {
		summary.value = emptySummary();
		ElMessage.error(error.message || '驾驶舱汇总加载失败');
	} finally {
		loading.value = false;
	}
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
	display: grid;
	gap: 16px;

	&__hero {
		border: 1px solid #dbe4f3;
		background:
			radial-gradient(circle at top right, rgba(47, 111, 237, 0.14), transparent 36%),
			linear-gradient(135deg, #f7faff 0%, #ffffff 58%, #eef4ff 100%);
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
		color: #6c7a92;
	}

	&__title {
		margin: 0;
		font-size: 28px;
		line-height: 1.2;
		color: #18202f;
	}

	&__description {
		max-width: 720px;
		margin: 12px 0 0;
		font-size: 14px;
		line-height: 1.7;
		color: #566176;
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
		color: #183153;
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

@media (max-width: 1080px) {
	.dashboard-page {
		&__filters {
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

		&__metric-value {
			font-size: 28px;
		}
	}
}
</style>
