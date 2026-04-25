<!-- 文件职责：装配 Theme22 宣传资料 HR-only 元数据台账页；不负责共享列表状态机、documentCenter service 或 service 工厂实现；依赖 office-ledger-page、模块配置和独立 service；维护重点是路由、语义字段和 moduleKey 必须与 publicityMaterial 事实源一致。 -->
<template>
	<office-ledger-page
		class="office-publicity-material-page"
		:config="officeLedgerModules.publicityMaterial"
		:service="performancePublicityMaterialService"
	/>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-office-publicity-material'
});

import { performancePublicityMaterialService } from '../../service/publicityMaterial';
import { officeLedgerModules } from './office-ledger-config';
import OfficeLedgerPage from './office-ledger-page.vue';
</script>
