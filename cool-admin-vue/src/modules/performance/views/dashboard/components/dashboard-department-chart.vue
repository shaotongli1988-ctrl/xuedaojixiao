<!-- 文件职责：渲染部门绩效分布柱状图；不负责请求、副作用和筛选控制。 -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCssVar } from '@vueuse/core';
import type { DashboardDepartmentBarViewModel } from '../types/dashboard.view-model';

const props = defineProps<{
	items: DashboardDepartmentBarViewModel[];
}>();

function readRootToken(tokenName: string) {
	return typeof window === 'undefined'
		? ''
		: getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
}

function resolveTokenValue(tokenValue: string | undefined, tokenName: string) {
	return tokenValue?.trim() || readRootToken(tokenName);
}

const chartRoot = ref<HTMLElement | null>(null);
const axisLabelToken = useCssVar('--app-chart-label', chartRoot);
const splitLineToken = useCssVar('--app-chart-grid', chartRoot);
const barColorToken = useCssVar('--app-chart-series-brand', chartRoot);

const axisLabelColor = computed(() => resolveTokenValue(axisLabelToken.value, '--app-chart-label'));
const splitLineColor = computed(() => resolveTokenValue(splitLineToken.value, '--app-chart-grid'));
const barColor = computed(() => resolveTokenValue(barColorToken.value, '--app-chart-series-brand'));

const chartOption = computed(() => ({
	grid: {
		top: 18,
		left: '4%',
		right: '4%',
		bottom: 32,
		containLabel: true
	},
	tooltip: {
		trigger: 'axis',
		axisPointer: {
			type: 'shadow'
		},
		formatter: (items: Array<{ axisValue: string; data: number }>) => {
			const current = items[0];
			return `${current?.axisValue || ''}<br/>平均分：${Number(current?.data || 0).toFixed(2)}`;
		}
	},
	xAxis: {
		type: 'category',
		data: props.items.map(item => item.departmentName),
		axisLabel: {
			color: axisLabelColor.value,
			interval: 0,
			rotate: props.items.length > 5 ? 18 : 0
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
	series: [
		{
			type: 'bar',
			barWidth: 24,
			data: props.items.map(item => item.averageScore),
			itemStyle: {
				color: barColor.value,
				borderRadius: [10, 10, 0, 0]
			}
		}
	]
}));
</script>

<template>
	<div ref="chartRoot" class="dashboard-department-chart">
		<el-card shadow="never" class="dashboard-department-chart__card">
			<template #header>
				<div class="dashboard-department-chart__header">
					<div class="dashboard-department-chart__title">部门绩效分布</div>
					<el-tag effect="plain">{{ items.length }} 个部门</el-tag>
				</div>
			</template>

			<el-empty v-if="!items.length" description="当前暂无部门分布数据" />
			<v-chart
				v-else
				:option="chartOption"
				autoresize
				class="dashboard-department-chart__chart"
			/>
		</el-card>
	</div>
</template>

<style scoped lang="scss">
@use '../../../../../styles/patterns.chart-surface.scss' as chartSurface;

.dashboard-department-chart {
	&__card {
		@include chartSurface.chart-card;
	}

	&__header {
		@include chartSurface.chart-header;
	}

	&__title {
		@include chartSurface.chart-title;
	}

	&__chart {
		width: 100%;
		height: 340px;
	}
}
</style>
