<!-- 文件职责：装配 Theme22 年检材料 HR-only 元数据台账页；不负责共享列表状态机或 service 工厂实现；依赖 office-ledger-page、模块配置和独立 service；维护重点是路由、语义字段和 moduleKey 必须与 annualInspection 事实源一致。 -->
<template>
	<office-ledger-page
		class="office-annual-inspection-page"
		:config="officeLedgerModules.annualInspection"
		:service="performanceAnnualInspectionService"
	/>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-office-annual-inspection'
});

import { performanceAnnualInspectionService } from '../../service/annualInspection';
import { officeLedgerModules } from './office-ledger-config';
import OfficeLedgerPage from './office-ledger-page.vue';
</script>
