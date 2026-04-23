<!-- 文件职责：挂载主题11收货管理视图；不负责共享采购工作台内部逻辑；依赖 purchase-order/workspace 组件；维护重点是只覆盖 approved/received 的收货动作。 -->
<template>
	<purchase-workspace class="purchase-receipt-page" view-key="receipt" />
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-purchase-receipt'
});

import PurchaseWorkspace from '../purchase-order/workspace.vue';
</script>
