<!-- 文件职责：提供行政协同模块骨架页统一壳层；不负责真实业务查询、表单和状态流转；依赖共享 page-shell 与权限工具；维护重点是路由、标题和 page 权限键必须与菜单事实源一致。 -->
<template>
	<PageShell
		v-if="canAccess"
		:title="title"
		:route="route"
		:description="description"
		:perms="[pagePermission]"
		:phase="phase"
	/>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { checkPerm } from '/$/base/utils/permission';
import PageShell from '../../components/page-shell.vue';

interface Props {
	title: string;
	route: string;
	description: string;
	pagePermission: string;
	phase?: string;
}

const props = withDefaults(defineProps<Props>(), {
	phase: '行政协同 / 阶段 1'
});

const canAccess = computed(() => checkPerm(props.pagePermission));
</script>
