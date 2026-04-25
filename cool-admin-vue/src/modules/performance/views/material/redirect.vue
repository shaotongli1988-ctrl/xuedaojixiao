<!-- 文件职责：承接旧物资路由到资产统一入口的兼容跳转；不负责页面展示；维护重点是四条历史物资路由必须稳定映射到新的资产统一入口 tab。 -->
<template>
	<div class="material-redirect-page" />
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

function resolveTarget(path: string) {
	if (path === '/performance/material/catalog') {
		return {
			path: '/performance/asset/ledger',
			query: { assetView: 'materialCatalog' }
		};
	}

	if (path === '/performance/material/stock') {
		return {
			path: '/performance/asset/ledger',
			query: { assetView: 'materialStock' }
		};
	}

	if (path === '/performance/material/inbound') {
		return {
			path: '/performance/asset/assignment',
			query: { operationView: 'materialInbound' }
		};
	}

	return {
		path: '/performance/asset/assignment',
		query: { operationView: 'materialIssue' }
	};
}

function redirectToUnifiedEntry() {
	const target = resolveTarget(route.path);
	router.replace(target);
}

onMounted(redirectToUnifiedEntry);
watch(() => route.path, redirectToUnifiedEntry);
</script>
