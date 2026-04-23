<!-- 文件职责：挂载主题11询价管理视图；不负责共享采购工作台内部逻辑；依赖 purchase-order/workspace 组件；维护重点是路由固定到 purchase-inquiry。 -->
<template>
	<purchase-workspace class="purchase-inquiry-page" view-key="inquiry" />
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-purchase-inquiry'
});

import PurchaseWorkspace from '../purchase-order/workspace.vue';
</script>
