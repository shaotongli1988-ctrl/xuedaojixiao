<!-- 文件职责：承接主题20资产维护保养页面；不负责台账主数据、折旧或报废逻辑；依赖 asset-maintenance service、共享状态映射和通用资产 CRUD 页面壳；维护重点是 complete/cancel 入口与冻结状态流保持一致。 -->
<template>
	<AssetCrudPage
		class="asset-maintenance-page"
		title="维护保养"
		description="管理维护类型、费用、服务商和维护结果，并回看维护完成时间。"
		notice="维护发起后资产状态进入 maintenance；完成或取消后资产回写为 available。"
		:page-permission="PERMISSIONS.performance.assetMaintenance.page"
		:add-permission="PERMISSIONS.performance.assetMaintenance.add"
		:update-permission="PERMISSIONS.performance.assetMaintenance.update"
		:delete-permission="PERMISSIONS.performance.assetMaintenance.delete"
		:columns="columns"
		:filters="filters"
		:form-fields="formFields"
		:create-filters="createFilters"
		:create-empty="createEmptyAssetMaintenance"
		:fetch-page="performanceAssetMaintenanceService.fetchPage.bind(performanceAssetMaintenanceService)"
		:create-item="performanceAssetMaintenanceService.createMaintenance.bind(performanceAssetMaintenanceService)"
		:update-item="performanceAssetMaintenanceService.updateMaintenance.bind(performanceAssetMaintenanceService)"
		:remove-item="performanceAssetMaintenanceService.removeMaintenance.bind(performanceAssetMaintenanceService)"
		:row-actions="rowActions"
		create-label="新增维护"
		edit-label="编辑维护"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetMaintenanceService } from '../../service/asset-maintenance';
import {
	createEmptyAssetMaintenance,
	type AssetMaintenanceRecord
} from '../../types';
import {
	createElementLookupWarningHandler,
	loadAssetOptions,
	toAssetSelectOptions,
} from './lookups';
import { assetStatusTagMap, enumOptions, formatMoney, maintenanceStatusTagMap } from './shared';
import { PERMISSIONS } from '../../../base/generated/permissions.generated';
import type { CrudRowAction, CrudSelectOption } from '../shared/crud-page-shell';

const columns = [
	{ prop: 'assetNo', label: '资产编号', minWidth: 140 },
	{ prop: 'assetName', label: '资产名称', minWidth: 180 },
	{ prop: 'assetStatus', label: '资产状态', minWidth: 120, tagMap: assetStatusTagMap },
	{ prop: 'maintenanceType', label: '维护类型', minWidth: 120 },
	{ prop: 'vendorName', label: '服务商', minWidth: 120 },
	{ prop: 'cost', label: '费用', minWidth: 120, formatter: formatMoney },
	{ prop: 'status', label: '维护状态', minWidth: 120, tagMap: maintenanceStatusTagMap }
];

const filters = [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '资产编号 / 名称' },
	{ prop: 'status', label: '状态', type: 'select', options: enumOptions(maintenanceStatusTagMap) }
];

const assetOptions = ref<CrudSelectOption[]>([]);

const formFields = computed(() => [
	{ prop: 'assetId', label: '资产', type: 'select', options: assetOptions.value },
	{ prop: 'maintenanceType', label: '维护类型', type: 'text' },
	{ prop: 'vendorName', label: '服务商', type: 'text' },
	{ prop: 'cost', label: '费用', type: 'number', precision: 2 },
	{ prop: 'startDate', label: '开始日期', type: 'date' },
	{ prop: 'description', label: '维护说明', type: 'textarea', span: 24 },
	{ prop: 'resultSummary', label: '结果摘要', type: 'textarea', span: 24 }
]);

const rowActions: CrudRowAction<AssetMaintenanceRecord>[] = [
	{
		key: 'complete',
		label: '完成',
		permission: PERMISSIONS.performance.assetMaintenance.complete,
		visible: row => ['scheduled', 'inProgress'].includes(row.status || ''),
		confirmText: () => '确认完成该维护记录吗？',
		handler: row => performanceAssetMaintenanceService.completeMaintenance({ id: row.id! }),
		successMessage: '维护已完成'
	},
	{
		key: 'cancel',
		label: '取消',
		permission: PERMISSIONS.performance.assetMaintenance.cancel,
		type: 'danger',
		visible: row => ['scheduled', 'inProgress'].includes(row.status || ''),
		confirmText: () => '确认取消该维护记录吗？',
		handler: row => performanceAssetMaintenanceService.cancelMaintenance({ id: row.id! }),
		successMessage: '维护已取消'
	}
];

function createFilters() {
	return {
		keyword: '',
		status: ''
	};
}

onMounted(async () => {
	const assets = await loadAssetOptions(notifyLookupError);
	assetOptions.value = toAssetSelectOptions(assets);
});

const notifyLookupError = createElementLookupWarningHandler('维护资产选项加载失败');
</script>
