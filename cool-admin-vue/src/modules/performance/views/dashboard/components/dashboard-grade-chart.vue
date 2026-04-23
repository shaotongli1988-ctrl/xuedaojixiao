<!-- 文件职责：渲染绩效等级分布环图；不负责请求、筛选联动和权限判断。 -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCssVar } from '@vueuse/core';
import type { DashboardGradeSliceViewModel } from '../types/dashboard.view-model';

const props = defineProps<{
	items: DashboardGradeSliceViewModel[];
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
const labelToken = useCssVar('--app-chart-label', chartRoot);
const brandToken = useCssVar('--app-chart-series-brand', chartRoot);
const successToken = useCssVar('--app-chart-series-success', chartRoot);
const warningToken = useCssVar('--app-chart-series-warning', chartRoot);
const dangerToken = useCssVar('--app-chart-series-danger', chartRoot);

const labelColor = computed(() => resolveTokenValue(labelToken.value, '--app-chart-label'));
const palette = computed(() => [
	resolveTokenValue(brandToken.value, '--app-chart-series-brand'),
	resolveTokenValue(successToken.value, '--app-chart-series-success'),
	resolveTokenValue(warningToken.value, '--app-chart-series-warning'),
	resolveTokenValue(dangerToken.value, '--app-chart-series-danger')
]);

const chartOption = computed(() => ({
	color: palette.value,
	tooltip: {
		trigger: 'item',
		formatter: '{b}<br/>数量：{c}<br/>占比：{d}%'
	},
	legend: {
		top: 'bottom',
		textStyle: {
			color: labelColor.value
		}
	},
	series: [
		{
			name: '绩效等级分布',
			type: 'pie',
			radius: ['45%', '68%'],
			center: ['50%', '42%'],
			itemStyle: {
				borderRadius: 8
			},
			label: {
				color: labelColor.value,
				formatter: '{b}\n{d}%'
			},
			data: props.items.map(item => ({
				name: item.grade,
				value: item.count
			}))
		}
	]
}));
</script>

<template>
	<div ref="chartRoot" class="dashboard-grade-chart">
		<el-card shadow="never" class="dashboard-grade-chart__card">
			<template #header>
				<div class="dashboard-grade-chart__header">
					<div class="dashboard-grade-chart__title">绩效等级分布</div>
					<el-tag effect="plain">S / A / B / C</el-tag>
				</div>
			</template>

			<el-empty v-if="!items.length" description="当前暂无等级分布数据" />
			<v-chart v-else :option="chartOption" autoresize class="dashboard-grade-chart__chart" />
		</el-card>
	</div>
</template>

<style scoped lang="scss">
@use '../../../../../styles/patterns.chart-surface.scss' as chartSurface;

.dashboard-grade-chart {
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
