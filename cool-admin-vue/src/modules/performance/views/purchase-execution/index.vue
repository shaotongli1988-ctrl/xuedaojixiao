<!-- 文件职责：挂载主题11订单管理执行视图；不负责共享采购工作台内部逻辑；依赖 purchase-order/workspace 组件；维护重点是 execution 只是 purchaseOrder 别名视图。 -->
<template>
	<PurchaseWorkspace class="purchase-execution-page" view-key="execution" />
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-purchase-execution'
});

import PurchaseWorkspace from '../purchase-order/workspace.vue';
</script>
