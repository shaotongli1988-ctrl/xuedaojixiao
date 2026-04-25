<!-- 文件职责：挂载主题11采购审批视图；不负责共享采购工作台内部逻辑；依赖 purchase-order/workspace 组件；维护重点是路由固定到 purchase-approval。 -->
<template>
	<purchase-workspace class="purchase-approval-page" view-key="approval" />
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-purchase-approval'
});

import PurchaseWorkspace from '../purchase-order/workspace.vue';
</script>
