<!-- 文件职责：渲染单个跨模块指标块；不负责请求、筛选联动和权限判断。 -->
<script setup lang="ts">
import type { DashboardCrossMetricViewModel } from '../types/dashboard.view-model';

const props = defineProps<{
	item: DashboardCrossMetricViewModel;
	clickable?: boolean;
}>();

const emit = defineEmits<{
	(e: 'drilldown', metricCode: string): void;
}>();

function handleDrilldown() {
	if (!props.clickable) return;
	emit('drilldown', props.item.metricCode);
}
</script>

<template>
	<article class="dashboard-cross-metric" :class="`dashboard-cross-metric--${item.tone}`">
		<header class="dashboard-cross-metric__head">
			<div class="dashboard-cross-metric__meta">
				<div class="dashboard-cross-metric__label">{{ item.metricLabel }}</div>
				<div class="dashboard-cross-metric__domain">{{ item.domainLabel }}</div>
			</div>

			<el-tag effect="plain" size="small">
				{{ item.statusLabel }}
			</el-tag>
		</header>

		<div class="dashboard-cross-metric__value-row">
			<div class="dashboard-cross-metric__value">{{ item.valueText }}</div>
			<div v-if="item.unitText" class="dashboard-cross-metric__unit">{{ item.unitText }}</div>
		</div>

		<div class="dashboard-cross-metric__detail">
			<div class="dashboard-cross-metric__line">
				<span class="dashboard-cross-metric__key">周期</span>
				<span class="dashboard-cross-metric__val">{{ item.periodLabel }}</span>
			</div>
			<div class="dashboard-cross-metric__line">
				<span class="dashboard-cross-metric__key">范围</span>
				<span class="dashboard-cross-metric__val">{{ item.scopeLabel }}</span>
			</div>
			<div class="dashboard-cross-metric__line">
				<span class="dashboard-cross-metric__key">更新时间</span>
				<span class="dashboard-cross-metric__val">{{ item.updatedAtLabel }}</span>
			</div>
		</div>

		<footer class="dashboard-cross-metric__footer">
			<el-button v-if="clickable" type="primary" plain size="small" @click="handleDrilldown">
				进入页面
			</el-button>
		</footer>
	</article>
</template>

<style scoped lang="scss">
@use '../../../../../styles/patterns.data-panel.scss' as dataPanel;

.dashboard-cross-metric {
	--metric-accent: var(--app-accent-brand);

	display: grid;
	gap: var(--app-space-4);
	padding: var(--app-space-5);
	@include dataPanel.data-panel-card;

	&--brand {
		--metric-accent: var(--app-accent-brand);
	}

	&--success {
		--metric-accent: var(--app-accent-success);
	}

	&--warning {
		--metric-accent: var(--app-accent-warning);
	}

	&--danger {
		--metric-accent: var(--app-accent-danger);
	}

	&--neutral {
		--metric-accent: var(--app-text-tertiary);
		background: var(--app-surface-muted);
	}

	&__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--app-space-3);
	}

	&__label {
		font-size: 16px;
		font-weight: 700;
		line-height: 1.4;
		color: var(--app-text-primary);
	}

	&__domain {
		margin-top: 6px;
		font-size: var(--app-font-size-caption);
		color: var(--app-text-tertiary);
	}

	&__value-row {
		display: flex;
		align-items: flex-end;
		gap: var(--app-space-2);
	}

	&__value {
		font-size: clamp(26px, 2.4vw, 40px);
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--metric-accent);
		font-variant-numeric: tabular-nums;
	}

	&__unit {
		padding-bottom: 4px;
		font-size: var(--app-font-size-body);
		color: var(--app-text-secondary);
	}

	&__detail {
		display: grid;
		gap: 8px;
		padding-top: var(--app-space-3);
		border-top: 1px dashed var(--app-divider);
	}

	&__line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--app-space-3);
		font-size: var(--app-font-size-caption);
	}

	&__key {
		color: var(--app-text-tertiary);
	}

	&__val {
		color: var(--app-text-secondary);
		text-align: right;
	}

	&__footer {
		display: flex;
		justify-content: flex-end;
	}
}
</style>
