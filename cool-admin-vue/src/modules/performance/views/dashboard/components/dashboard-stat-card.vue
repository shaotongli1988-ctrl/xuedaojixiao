<!-- 文件职责：标准化驾驶舱 KPI 卡片展示；不负责请求、权限和页面联动。 -->
<script setup lang="ts">
import type { DashboardStatCardVariant } from '../types/dashboard.view-model';

const props = withDefaults(
	defineProps<{
		label: string;
		value: string;
		unit?: string;
		helper?: string;
		trend?: string;
		tone?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
		variant?: DashboardStatCardVariant;
	}>(),
	{
		unit: '',
		helper: '',
		trend: '',
		tone: 'brand',
		variant: 'default'
	}
);
</script>

<template>
	<el-card
		shadow="never"
		class="dashboard-stat-card"
		:class="[`dashboard-stat-card--${props.tone}`, `dashboard-stat-card--${props.variant}`]"
	>
		<div class="dashboard-stat-card__label">{{ props.label }}</div>

		<div class="dashboard-stat-card__value-row">
			<div class="dashboard-stat-card__value">{{ props.value }}</div>
			<div v-if="props.unit" class="dashboard-stat-card__unit">{{ props.unit }}</div>
		</div>

		<div class="dashboard-stat-card__footer">
			<span class="dashboard-stat-card__helper">{{ props.helper }}</span>
			<span v-if="props.trend" class="dashboard-stat-card__trend">{{ props.trend }}</span>
		</div>
	</el-card>
</template>

<style scoped lang="scss">
@use '../../../../../styles/patterns.data-panel.scss' as dataPanel;

.dashboard-stat-card {
	--card-accent: var(--app-accent-brand);

	height: 100%;
	@include dataPanel.data-panel-card;

	&--success {
		--card-accent: var(--app-accent-success);
	}

	&--warning {
		--card-accent: var(--app-accent-warning);
	}

	&--danger {
		--card-accent: var(--app-accent-danger);
	}

	&--neutral {
		--card-accent: var(--app-text-tertiary);
	}

	&--featured {
		background: var(--app-surface-spotlight);
	}

	&__label {
		font-size: var(--app-font-size-body);
		color: var(--app-text-secondary);
	}

	&__value-row {
		display: flex;
		align-items: flex-end;
		gap: var(--app-space-2);
		margin-top: var(--app-space-4);
	}

	&__value {
		font-size: var(--app-font-size-kpi);
		line-height: 1;
		font-weight: 800;
		letter-spacing: -0.04em;
		color: var(--app-text-primary);
		font-variant-numeric: tabular-nums;
	}

	&__unit {
		padding-bottom: 6px;
		font-size: var(--app-font-size-body);
		color: var(--card-accent);
	}

	&__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--app-space-3);
		margin-top: var(--app-space-4);
		padding-top: var(--app-space-3);
		border-top: 1px solid var(--app-divider);
	}

	&__helper {
		font-size: var(--app-font-size-caption);
		color: var(--app-text-tertiary);
	}

	&__trend {
		font-size: var(--app-font-size-caption);
		color: var(--card-accent);
		font-weight: 600;
	}
}
</style>
