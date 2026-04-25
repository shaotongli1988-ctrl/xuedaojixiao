<!-- 文件职责：渲染角色工作台统一任务卡，并承接跳转到既有业务页面；不负责角色判定、数据聚合或后端请求；维护重点是统一卡片模型字段和 path 跳转行为必须保持一致。 -->
<template>
	<el-card
		shadow="never"
		class="workbench-task-card"
		:class="[
			`workbench-task-card--${card.tone || 'info'}`,
			{
				'workbench-task-card--clickable': Boolean(card.path)
			}
		]"
	>
		<div class="workbench-task-card__header">
			<div class="workbench-task-card__header-main">
				<div class="workbench-task-card__eyebrow-row">
					<span class="workbench-task-card__eyebrow">
						{{ card.badge || '工作入口' }}
					</span>
				</div>

				<div class="workbench-task-card__title">{{ card.title }}</div>
				<p class="workbench-task-card__description">{{ card.description }}</p>
			</div>

			<div v-if="card.count !== undefined" class="workbench-task-card__counter">
				<div class="workbench-task-card__count">{{ card.count }}</div>
				<div class="workbench-task-card__count-label">
					{{ card.countLabel || '项待处理' }}
				</div>
			</div>
		</div>

		<div v-if="card.tags?.length" class="workbench-task-card__tags">
			<el-tag v-for="tag in card.tags" :key="tag" size="small" effect="plain" type="info">
				{{ tag }}
			</el-tag>
		</div>

		<div v-if="card.metrics?.length" class="workbench-task-card__metrics">
			<div v-for="item in card.metrics" :key="item.label" class="workbench-task-card__metric">
				<div class="workbench-task-card__metric-label">{{ item.label }}</div>
				<div class="workbench-task-card__metric-value">{{ item.value }}</div>
			</div>
		</div>

		<div class="workbench-task-card__footer">
			<span class="workbench-task-card__status">
				{{ card.statusText || '继续在既有页面执行操作' }}
			</span>

			<el-button
				v-if="card.path"
				type="primary"
				class="workbench-task-card__action"
				@click="goToPath"
			>
				{{ card.actionText || '进入页面' }}
				<el-icon class="workbench-task-card__action-icon">
					<arrow-right />
				</el-icon>
			</el-button>
		</div>
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-workbench-task-card'
});

import { useRouter } from 'vue-router';
import { ArrowRight } from '@element-plus/icons-vue';
import type { WorkbenchTaskCardModel } from '../workbench/types';

const props = defineProps<{
	card: WorkbenchTaskCardModel;
}>();

const router = useRouter();

async function goToPath() {
	if (!props.card.path) {
		return;
	}

	await router.push({
		path: props.card.path,
		query: props.card.query
	});
}
</script>

<style lang="scss" scoped>
.workbench-task-card {
	--workbench-card-accent: var(--app-text-tertiary);
	--workbench-card-border: var(--app-border-strong);
	--workbench-card-surface: var(--app-surface-card);
	--workbench-card-shadow: var(--app-shadow-surface);
	--workbench-card-counter-surface: var(--app-surface-soft);
	--workbench-card-label: var(--app-text-tertiary);
	--workbench-card-title: var(--app-text-primary);
	--workbench-card-text: var(--app-text-secondary);
	--workbench-card-divider: var(--app-divider);
	--workbench-card-number: var(--app-font-mono);

	position: relative;
	height: 100%;
	border: 1px solid var(--workbench-card-border);
	border-radius: var(--app-radius-lg);
	background: var(--workbench-card-surface);
	box-shadow: var(--workbench-card-shadow);
	overflow: hidden;
	transition:
		transform 0.2s ease,
		border-color 0.2s ease,
		box-shadow 0.2s ease;

	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		background: var(--workbench-card-accent);
		opacity: 0.9;
	}

	&--clickable:hover {
		transform: translateY(-2px);
		border-color: var(--app-border-hover);
		box-shadow: var(--app-shadow-hover);
	}

	&--primary {
		--workbench-card-accent: var(--app-accent-brand);
	}

	&--success {
		--workbench-card-accent: var(--app-accent-success);
	}

	&--warning {
		--workbench-card-accent: var(--app-accent-warning);
	}

	&--danger {
		--workbench-card-accent: var(--app-accent-danger);
	}

	&--info {
		--workbench-card-accent: var(--app-text-tertiary);
	}

	:deep(.el-card__body) {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: var(--app-space-5) var(--app-space-5) var(--app-space-4);
	}

	&__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 14px;
	}

	&__header-main {
		min-width: 0;
		flex: 1;
	}

	&__eyebrow-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	&__eyebrow {
		font-size: var(--app-font-size-caption);
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--workbench-card-accent);
	}

	&__title {
		margin-top: 10px;
		font-size: 18px;
		font-weight: 700;
		line-height: 1.4;
		color: var(--workbench-card-title);
	}

	&__description {
		margin: 8px 0 0;
		font-size: 14px;
		line-height: 1.72;
		color: var(--workbench-card-text);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	&__counter {
		min-width: 100px;
		padding: 10px 12px;
		border-radius: var(--app-radius-md);
		background: var(--workbench-card-counter-surface);
		border: 1px solid var(--app-border-soft);
		text-align: right;
	}

	&__count {
		font-family: var(--workbench-card-number);
		font-size: 28px;
		font-weight: 700;
		line-height: 1;
		color: var(--workbench-card-accent);
	}

	&__count-label {
		margin-top: 6px;
		font-size: 12px;
		line-height: 1.4;
		color: var(--workbench-card-label);
	}

	&__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
	}

	&__metrics {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px dashed var(--workbench-card-divider);
	}

	&__metric {
		min-width: 0;
		padding: 10px 12px;
		border-radius: 12px;
		background: var(--app-surface-soft);
	}

	&__metric-label {
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--workbench-card-label);
	}

	&__metric-value {
		margin-top: 8px;
		font-size: 13px;
		line-height: 1.55;
		color: var(--workbench-card-title);
	}

	&__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: auto;
		padding-top: 14px;
		border-top: 1px solid var(--workbench-card-divider);
	}

	&__status {
		font-size: 13px;
		line-height: 1.65;
		color: var(--workbench-card-text);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	&__action {
		flex-shrink: 0;
		border-radius: 10px;
		background: var(--app-accent-brand);
		border-color: var(--app-accent-brand);
	}

	&__action-icon {
		margin-left: 4px;
	}
}

@media (max-width: 767px) {
	.workbench-task-card {
		&__header,
		&__footer {
			flex-direction: column;
			align-items: stretch;
		}

		&__counter {
			width: 100%;
			text-align: left;
		}

		&__metrics {
			grid-template-columns: 1fr;
		}
	}
}

@media (prefers-reduced-motion: reduce) {
	.workbench-task-card,
	.workbench-task-card * {
		animation: none !important;
		transition: none !important;
	}
}
</style>
