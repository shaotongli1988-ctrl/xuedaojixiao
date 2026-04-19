<!-- 文件职责：挂载主题11采购管理主视图；不负责具体工作台实现细节；依赖共享采购工作台组件；维护重点是主路由继续落在 purchase-order。 -->
<template>
	<PurchaseWorkspace view-key="main" />
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-purchase-order'
});

import PurchaseWorkspace from './workspace.vue';
</script>
