<!-- 文件职责：提供绩效模块占位页统一壳层；不负责真实业务查询、表单和状态流转；依赖 Element Plus 基础组件；维护重点是占位信息必须与菜单、路由和权限键保持一致。 -->
<template>
	<div class="performance-page-shell">
		<el-card class="performance-page-shell__summary" shadow="never">
			<div class="performance-page-shell__header">
				<div>
					<div class="performance-page-shell__phase">{{ phase }}</div>
					<h2 class="performance-page-shell__title">{{ title }}</h2>
				</div>

				<el-tag type="info" effect="plain">模块骨架已接入</el-tag>
			</div>

			<p class="performance-page-shell__description">{{ description }}</p>

			<div class="performance-page-shell__meta">
				<span class="performance-page-shell__meta-label">路由</span>
				<code>{{ route }}</code>
			</div>

			<div v-if="perms.length" class="performance-page-shell__perm">
				<span class="performance-page-shell__meta-label">权限键</span>

				<div class="performance-page-shell__perm-list">
					<el-tag v-for="item in perms" :key="item" effect="plain" size="small">
						{{ item }}
					</el-tag>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<el-empty description="业务内容将在对应模块阶段逐步实现" />
		</el-card>
	</div>
</template>

<script lang="ts" setup>
interface Props {
	title: string;
	route: string;
	description: string;
	perms?: string[];
	phase?: string;
}

withDefaults(defineProps<Props>(), {
	perms: () => [],
	phase: '绩效管理 / 模块 0'
});
</script>

<style lang="scss" scoped>
@use '../../../styles/patterns.page-shell.scss' as pageShell;

.performance-page-shell {
	display: grid;
	gap: var(--app-space-4);

	--page-shell-card-bg: var(--app-surface-card);
	--page-shell-summary-bg: var(--app-surface-hero);
	--page-shell-border: var(--app-border-strong);
	--page-shell-divider: var(--app-divider);
	--page-shell-title: var(--app-text-primary);
	--page-shell-text: var(--app-text-secondary);
	--page-shell-eyebrow: var(--app-text-tertiary);
	--page-shell-code-bg: var(--app-surface-muted);
	--page-shell-code-text: var(--app-text-emphasis);

	:deep(.el-card) {
		border-color: var(--page-shell-border);
		background: var(--page-shell-card-bg);
		box-shadow: var(--app-shadow-surface);
	}

	&__summary {
		@include pageShell.page-hero;
	}

	&__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--app-space-3);
		margin-bottom: var(--app-space-3);
	}

	&__phase {
		margin-bottom: var(--app-space-2);
		font-size: var(--app-font-size-caption);
		color: var(--page-shell-eyebrow);
	}

	&__title {
		margin: 0;
		font-size: 22px;
		line-height: 1.3;
		color: var(--page-shell-title);
	}

	&__description {
		margin: 0 0 var(--app-space-4);
		line-height: 1.7;
		color: var(--page-shell-text);
	}

	&__meta,
	&__perm {
		display: grid;
		gap: 10px;
		padding-top: var(--app-space-3);
		margin-top: var(--app-space-3);
		border-top: 1px dashed var(--page-shell-divider);
	}

	&__meta-label {
		font-size: var(--app-font-size-caption);
		color: var(--page-shell-eyebrow);
	}

	&__perm-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--app-space-2);
	}

	code {
		display: inline-flex;
		width: fit-content;
		padding: 4px 8px;
		font-size: var(--app-font-size-caption);
		border-radius: 6px;
		background: var(--page-shell-code-bg);
		color: var(--page-shell-code-text);
	}
}
</style>
