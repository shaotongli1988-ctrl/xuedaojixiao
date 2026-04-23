<!-- 文件职责：渲染阶段进度列表；不负责请求和外层布局。 -->
<script setup lang="ts">
import type { DashboardStageProgressViewModel } from '../types/dashboard.view-model';

const props = defineProps<{
	items: DashboardStageProgressViewModel[];
}>();
</script>

<template>
	<el-card shadow="never" class="dashboard-stage-progress">
		<template #header>
			<div class="dashboard-stage-progress__header">
				<div class="dashboard-stage-progress__title">五环节进度</div>
				<el-tag effect="plain">实时聚合</el-tag>
			</div>
		</template>

		<div v-if="items.length" class="dashboard-stage-progress__list">
			<article
				v-for="item in items"
				:key="item.stageKey"
				class="dashboard-stage-progress__item"
			>
				<div class="dashboard-stage-progress__item-head">
					<div>
						<div class="dashboard-stage-progress__item-title">
							{{ item.stageLabel }}
						</div>
						<div class="dashboard-stage-progress__item-meta">
							{{ item.displayText }}
						</div>
					</div>
					<div class="dashboard-stage-progress__item-rate">
						{{ item.completionRate }}%
					</div>
				</div>

				<el-progress
					:percentage="item.completionRate"
					:stroke-width="10"
					:show-text="false"
				/>
			</article>
		</div>

		<el-empty v-else description="当前暂无阶段进度数据" />
	</el-card>
</template>

<style scoped lang="scss">
@use '../../../../../styles/patterns.data-panel.scss' as dataPanel;

.dashboard-stage-progress {
	@include dataPanel.data-panel-card;

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--app-space-3);
	}

	&__title {
		font-size: var(--app-font-size-title);
		font-weight: 700;
		color: var(--app-text-primary);
	}

	&__list {
		display: grid;
		gap: var(--app-space-4);
	}

	&__item {
		display: grid;
		gap: var(--app-space-3);
		padding: var(--app-space-4);
		border: 1px solid var(--app-border-soft);
		border-radius: var(--app-radius-md);
		background: var(--app-surface-soft);
	}

	&__item-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--app-space-3);
	}

	&__item-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--app-text-primary);
	}

	&__item-meta {
		margin-top: 6px;
		font-size: var(--app-font-size-caption);
		color: var(--app-text-tertiary);
	}

	&__item-rate {
		font-size: 18px;
		font-weight: 700;
		color: var(--app-accent-brand);
		font-variant-numeric: tabular-nums;
	}
}
</style>
