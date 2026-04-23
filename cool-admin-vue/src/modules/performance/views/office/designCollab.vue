<!-- 文件职责：装配 Theme22 美工协同 HR-only 元数据台账页；不负责共享列表状态机或 service 工厂实现；依赖 office-ledger-page、模块配置和独立 service；维护重点是路由、语义字段和 moduleKey 必须与 designCollab 事实源一致。 -->
<template>
	<OfficeLedgerPage
		class="office-design-collab-page"
		:config="officeLedgerModules.designCollab"
		:service="performanceDesignCollabService"
	/>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-office-design-collab'
});

import { performanceDesignCollabService } from '../../service/designCollab';
import { officeLedgerModules } from './office-ledger-config';
import OfficeLedgerPage from './office-ledger-page.vue';
</script>
