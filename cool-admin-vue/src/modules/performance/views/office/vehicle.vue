<!-- 文件职责：装配行政协同“车辆管理”HR-only 元数据台账页；不负责共享列表状态机或流程型用车业务；依赖 office-ledger-page、模块配置和独立 service；维护重点是路由、权限键和 moduleKey 必须与 vehicle 事实源一致。 -->
<template>
	<OfficeLedgerPage
		:config="officeLedgerModules.vehicle"
		:service="performanceVehicleService"
	/>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-office-vehicle'
});

import { performanceVehicleService } from '../../service/vehicle';
import { officeLedgerModules } from './office-ledger-config.js';
import OfficeLedgerPage from './office-ledger-page.vue';
</script>
