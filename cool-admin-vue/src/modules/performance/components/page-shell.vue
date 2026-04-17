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
.performance-page-shell {
	display: grid;
	gap: 16px;

	&__summary {
		border: 1px solid var(--el-border-color-light);
	}

	&__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
	}

	&__phase {
		margin-bottom: 8px;
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	&__title {
		margin: 0;
		font-size: 22px;
		line-height: 1.3;
		color: var(--el-text-color-primary);
	}

	&__description {
		margin: 0 0 16px;
		line-height: 1.7;
		color: var(--el-text-color-regular);
	}

	&__meta,
	&__perm {
		display: grid;
		gap: 10px;
		padding-top: 12px;
		margin-top: 12px;
		border-top: 1px dashed var(--el-border-color);
	}

	&__meta-label {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	&__perm-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	code {
		display: inline-flex;
		width: fit-content;
		padding: 4px 8px;
		font-size: 12px;
		border-radius: 6px;
		background: var(--el-fill-color-light);
		color: var(--el-text-color-primary);
	}
}
</style>
