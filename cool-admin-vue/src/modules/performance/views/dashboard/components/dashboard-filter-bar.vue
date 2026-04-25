<!-- 文件职责：统一承载驾驶舱筛选项和刷新动作；不负责请求实现与结果渲染。 -->
<script setup lang="ts">
import { computed } from 'vue';
import type { DashboardFilterViewModel } from '../types/dashboard.view-model';

const props = defineProps<{
	modelValue: DashboardFilterViewModel;
	title?: string;
	subtitle?: string;
	lastUpdatedLabel?: string;
	scopeLabel?: string;
	disabled?: boolean;
	loading?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:model-value', value: DashboardFilterViewModel): void;
	(e: 'refresh'): void;
}>();

const quarterOptions = computed(() => {
	const currentYear = new Date().getFullYear();
	return [currentYear - 1, currentYear, currentYear + 1].flatMap(year =>
		[1, 2, 3, 4].map(quarter => ({
			label: `${year} Q${quarter}`,
			value: `${year}-Q${quarter}`
		}))
	);
});

function patch<K extends keyof DashboardFilterViewModel>(
	key: K,
	value: DashboardFilterViewModel[K]
) {
	emit('update:model-value', {
		...props.modelValue,
		[key]: value
	});
}
</script>

<template>
	<el-card shadow="never" class="dashboard-filter-bar">
		<div class="dashboard-filter-bar__main">
			<div class="dashboard-filter-bar__title">
				<div class="dashboard-filter-bar__eyebrow">数据总览</div>
				<h2 class="dashboard-filter-bar__heading">{{ title || '绩效驾驶舱' }}</h2>
				<p class="dashboard-filter-bar__summary">
					{{ subtitle || '聚焦当前周期关键结果、待处理事项与结构分布。' }}
				</p>
				<div class="dashboard-filter-bar__chips">
					<el-tag effect="plain" size="small">
						{{ scopeLabel || '当前范围待确认' }}
					</el-tag>
					<el-tag effect="plain" size="small" type="success">
						最近刷新 {{ lastUpdatedLabel || '暂无刷新记录' }}
					</el-tag>
				</div>
			</div>

			<div class="dashboard-filter-bar__filters">
				<el-select
					:model-value="modelValue.periodType"
					:disabled="disabled"
					style="width: 140px"
					@update:model-value="patch('periodType', $event)"
				>
					<el-option label="月度" value="month" />
					<el-option label="季度" value="quarter" />
					<el-option label="年度" value="year" />
				</el-select>

				<el-select
					v-if="modelValue.periodType === 'quarter'"
					:model-value="modelValue.periodValue"
					:disabled="disabled"
					style="width: 160px"
					@update:model-value="patch('periodValue', $event)"
				>
					<el-option
						v-for="item in quarterOptions"
						:key="item.value"
						:label="item.label"
						:value="item.value"
					/>
				</el-select>

				<el-date-picker
					v-else-if="modelValue.periodType === 'month'"
					:model-value="modelValue.periodValue"
					:disabled="disabled"
					type="month"
					value-format="YYYY-MM"
					placeholder="选择月份"
					style="width: 160px"
					@update:model-value="patch('periodValue', $event || '')"
				/>

				<el-date-picker
					v-else
					:model-value="modelValue.periodValue"
					:disabled="disabled"
					type="year"
					value-format="YYYY"
					placeholder="选择年份"
					style="width: 160px"
					@update:model-value="patch('periodValue', $event || '')"
				/>

				<el-input
					:model-value="modelValue.departmentId"
					:disabled="disabled"
					placeholder="部门 ID"
					style="width: 140px"
					@update:model-value="patch('departmentId', Number($event) || undefined)"
				/>

				<el-button :disabled="disabled" @click="$emit('refresh')">刷新</el-button>
				<el-button
					type="primary"
					:loading="loading"
					:disabled="disabled"
					@click="$emit('refresh')"
				>
					查询汇总
				</el-button>
			</div>
		</div>
	</el-card>
</template>

<style scoped lang="scss">
@use '../../../../../styles/patterns.page-shell.scss' as pageShell;

.dashboard-filter-bar {
	@include pageShell.page-hero;

	&__main {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--app-space-4);
	}

	&__eyebrow {
		font-size: var(--app-font-size-caption);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--app-text-tertiary);
	}

	&__heading {
		margin: var(--app-space-2) 0 0;
		font-size: clamp(28px, 3vw, 34px);
		line-height: 1.15;
		color: var(--app-text-primary);
	}

	&__summary {
		max-width: 560px;
		margin: var(--app-space-3) 0 0;
		font-size: var(--app-font-size-body);
		line-height: 1.7;
		color: var(--app-text-secondary);
	}

	&__chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--app-space-2);
		margin-top: var(--app-space-4);
	}

	&__filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--app-space-3);
		justify-content: flex-end;
		padding: var(--app-space-4);
		border: 1px solid var(--app-border-soft);
		border-radius: var(--app-radius-lg);
		background: var(--app-surface-soft);
		box-shadow: var(--app-shadow-inset);
	}
}

@media (max-width: 1080px) {
	.dashboard-filter-bar__main {
		flex-direction: column;
	}

	.dashboard-filter-bar__filters {
		width: 100%;
		justify-content: flex-start;
	}
}
</style>
