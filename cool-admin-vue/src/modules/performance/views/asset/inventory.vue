<!-- 文件职责：承接主题20资产盘点页面；不负责扫码/RFID 设备或仓储任务调度；依赖 asset-inventory service、共享状态映射和通用资产 CRUD 页面壳；维护重点是 start/complete/close 的动作键和页面显隐不能漂移。 -->
<template>
	<AssetCrudPage
		title="资产盘点"
		description="维护盘点单、盘点结果摘要和盘点关闭状态，统一查看盘点差异。"
		notice="仅 available 资产允许发起盘点；开始盘点后资产进入 inventorying，完成后回到 available。"
		page-permission="performance:assetInventory:page"
		info-permission="performance:assetInventory:info"
		add-permission="performance:assetInventory:add"
		update-permission="performance:assetInventory:update"
		:columns="columns"
		:filters="filters"
		:form-fields="formFields"
		:create-filters="createFilters"
		:create-empty="createEmptyAssetInventory"
		:fetch-page="performanceAssetInventoryService.fetchPage.bind(performanceAssetInventoryService)"
		:fetch-info="performanceAssetInventoryService.fetchInfo.bind(performanceAssetInventoryService)"
		:create-item="performanceAssetInventoryService.createInventory.bind(performanceAssetInventoryService)"
		:update-item="performanceAssetInventoryService.updateInventory.bind(performanceAssetInventoryService)"
		:row-actions="rowActions"
		create-label="新增盘点"
		edit-label="编辑盘点"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetInventoryService } from '../../service/asset-inventory';
import { createEmptyAssetInventory } from '../../types';
import { loadAssetOptions } from './lookups';
import { enumOptions, inventoryStatusTagMap } from './shared';

const columns = [
	{ prop: 'inventoryNo', label: '盘点单号', minWidth: 160 },
	{ prop: 'scopeLabel', label: '盘点范围', minWidth: 180 },
	{ prop: 'departmentName', label: '所属部门', minWidth: 140 },
	{ prop: 'location', label: '位置', minWidth: 140 },
	{ prop: 'assetCount', label: '资产数', minWidth: 100 },
	{ prop: 'matchedCount', label: '匹配数', minWidth: 100 },
	{ prop: 'status', label: '状态', minWidth: 120, tagMap: inventoryStatusTagMap }
];

const filters = [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '盘点单号 / 范围' },
	{ prop: 'status', label: '状态', type: 'select', options: enumOptions(inventoryStatusTagMap) }
];

const assetOptions = ref<any[]>([]);

const formFields = computed(() => [
	{ prop: 'assetId', label: '资产', type: 'select', options: assetOptions.value },
	{ prop: 'remark', label: '备注', type: 'textarea', span: 24 }
]);

const rowActions = [
	{
		key: 'start',
		label: '开始盘点',
		permission: 'performance:assetInventory:start',
		visible: (row: any) => row.status === 'draft',
		confirmText: () => '确认开始盘点吗？',
		handler: (row: any) => performanceAssetInventoryService.startInventory({ id: row.id }),
		successMessage: '盘点已开始'
	},
	{
		key: 'complete',
		label: '完成盘点',
		permission: 'performance:assetInventory:complete',
		visible: (row: any) => row.status === 'counting',
		confirmText: () => '确认完成盘点吗？',
		handler: (row: any) => performanceAssetInventoryService.completeInventory({ id: row.id }),
		successMessage: '盘点已完成'
	},
	{
		key: 'close',
		label: '关闭',
		permission: 'performance:assetInventory:close',
		type: 'danger',
		visible: (row: any) => row.status === 'completed',
		confirmText: () => '确认关闭盘点单吗？',
		handler: (row: any) => performanceAssetInventoryService.closeInventory({ id: row.id }),
		successMessage: '盘点单已关闭'
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
	assetOptions.value = assets.map(item => ({
		label: item.assetNo ? `${item.assetNo} / ${item.name}` : item.name,
		value: item.id
	}));
});

function notifyLookupError(error: any) {
	ElMessage.warning(error?.message || '盘点资产选项加载失败');
}
</script>
