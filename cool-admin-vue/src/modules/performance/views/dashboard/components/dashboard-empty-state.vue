<!-- 文件职责：统一封装驾驶舱空态、错误态、无权限态和加载态；不负责业务请求。 -->
<script setup lang="ts">
import type { DashboardEmptyKind } from '../types/dashboard.view-model';

const props = withDefaults(
	defineProps<{
		kind: DashboardEmptyKind;
		description?: string;
	}>(),
	{
		description: '',
	}
);

const configMap = {
	loading: {
		title: '数据加载中',
		description: '正在同步驾驶舱汇总，请稍候',
	},
	'no-data': {
		title: '当前暂无数据',
		description: '当前筛选条件下没有可展示的聚合结果',
	},
	unavailable: {
		title: '数据暂不可用',
		description: '接口异常或聚合链路未完成，请稍后重试',
	},
	'no-permission': {
		title: '当前账号无权限',
		description: '你没有查看该驾驶舱的权限',
	},
} as const;
</script>

<template>
	<el-card shadow="never" class="dashboard-empty-state">
		<el-skeleton v-if="props.kind === 'loading'" :rows="6" animated />
		<el-empty
			v-else
			:description="props.description || configMap[props.kind].description"
		>
			<template #image>
				<div class="dashboard-empty-state__icon">{{ configMap[props.kind].title }}</div>
			</template>
		</el-empty>
	</el-card>
</template>

<style scoped lang="scss">
@use '../../../../../styles/patterns.data-panel.scss' as dataPanel;

.dashboard-empty-state {
	@include dataPanel.data-panel-card;

	&__icon {
		display: grid;
		place-items: center;
		width: 120px;
		height: 120px;
		margin: 0 auto;
		border-radius: 50%;
		background: var(--app-accent-brand-soft);
		color: var(--app-text-secondary);
		font-size: var(--app-font-size-caption);
		text-align: center;
		line-height: 1.6;
	}
}
</style>
