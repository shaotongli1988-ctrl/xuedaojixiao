<!-- 文件职责：装配行政协同“知识产权管理”HR-only 元数据台账页；不负责共享列表状态机或流程型续费维权业务；依赖 office-ledger-page、模块配置和独立 service；维护重点是路由、权限键和 moduleKey 必须与 intellectualProperty 事实源一致。 -->
<template>
	<office-ledger-page
		class="office-intellectual-property-page"
		:config="officeLedgerModules.intellectualProperty"
		:service="performanceIntellectualPropertyService"
	/>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-office-intellectual-property'
});

import { performanceIntellectualPropertyService } from '../../service/intellectualProperty';
import { officeLedgerModules } from './office-ledger-config';
import OfficeLedgerPage from './office-ledger-page.vue';
</script>
