<!-- 文件职责：承接主题20资产调拨页面；不负责物流签收、仓储系统或外部审批流；依赖 asset-transfer service、共享状态映射和通用资产 CRUD 页面壳；维护重点是 submit/complete/cancel 的状态键与冻结文档保持一致。 -->
<template>
	<AssetCrudPage
		title="资产调拨"
		description="管理调拨单、调出调入部门和目标位置，跟踪调拨状态。"
		notice="仅 available 资产允许发起调拨；完成后资产归属部门与位置同步更新。"
		page-permission="performance:assetTransfer:page"
		info-permission="performance:assetTransfer:info"
		add-permission="performance:assetTransfer:add"
		update-permission="performance:assetTransfer:update"
		:columns="columns"
		:filters="filters"
		:form-fields="formFields"
		:create-filters="createFilters"
		:create-empty="createEmptyAssetTransfer"
		:fetch-page="performanceAssetTransferService.fetchPage.bind(performanceAssetTransferService)"
		:fetch-info="performanceAssetTransferService.fetchInfo.bind(performanceAssetTransferService)"
		:create-item="performanceAssetTransferService.createTransfer.bind(performanceAssetTransferService)"
		:update-item="performanceAssetTransferService.updateTransfer.bind(performanceAssetTransferService)"
		:row-actions="rowActions"
		create-label="新增调拨"
		edit-label="编辑调拨"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetTransferService } from '../../service/asset-transfer';
import { createEmptyAssetTransfer } from '../../types';
import { loadAssetDepartmentOptions, loadAssetOptions, loadAssetUserOptions } from './lookups';
import { assetStatusTagMap, enumOptions, transferStatusTagMap } from './shared';

const columns = [
	{ prop: 'transferNo', label: '调拨单号', minWidth: 160 },
	{ prop: 'assetNo', label: '资产编号', minWidth: 140 },
	{ prop: 'assetName', label: '资产名称', minWidth: 180 },
	{ prop: 'assetStatus', label: '资产状态', minWidth: 120, tagMap: assetStatusTagMap },
	{ prop: 'fromDepartmentName', label: '调出部门', minWidth: 140 },
	{ prop: 'toDepartmentName', label: '调入部门', minWidth: 140 },
	{ prop: 'status', label: '状态', minWidth: 120, tagMap: transferStatusTagMap }
];

const filters = [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '单号 / 资产编号' },
	{ prop: 'status', label: '状态', type: 'select', options: enumOptions(transferStatusTagMap) }
];

const assetOptions = ref<any[]>([]);
const departmentOptions = ref<any[]>([]);
const userOptions = ref<any[]>([]);

const formFields = computed(() => [
	{ prop: 'assetId', label: '资产', type: 'select', options: assetOptions.value },
	{ prop: 'toDepartmentId', label: '目标部门', type: 'select', options: departmentOptions.value },
	{ prop: 'applicantId', label: '目标管理人', type: 'select', options: userOptions.value },
	{ prop: 'toLocation', label: '目标位置', type: 'text' },
	{ prop: 'remark', label: '调拨原因', type: 'textarea', span: 24 }
]);

const rowActions = [
	{
		key: 'submit',
		label: '提交',
		permission: 'performance:assetTransfer:submit',
		visible: (row: any) => row.status === 'draft',
		confirmText: () => '确认提交该调拨单吗？',
		handler: (row: any) => performanceAssetTransferService.submitTransfer({ id: row.id }),
		successMessage: '已提交'
	},
	{
		key: 'complete',
		label: '完成',
		permission: 'performance:assetTransfer:complete',
		visible: (row: any) => row.status === 'inTransit',
		confirmText: () => '确认完成该调拨单吗？',
		handler: (row: any) => performanceAssetTransferService.completeTransfer({ id: row.id }),
		successMessage: '已完成调拨'
	},
	{
		key: 'cancel',
		label: '取消',
		permission: 'performance:assetTransfer:cancel',
		type: 'danger',
		visible: (row: any) => ['draft', 'submitted', 'inTransit'].includes(row.status),
		confirmText: () => '确认取消该调拨单吗？',
		handler: (row: any) => performanceAssetTransferService.cancelTransfer({ id: row.id }),
		successMessage: '已取消'
	}
];

function createFilters() {
	return {
		keyword: '',
		status: ''
	};
}

onMounted(async () => {
	const [assets, departments, users] = await Promise.all([
		loadAssetOptions(notifyLookupError),
		loadAssetDepartmentOptions(notifyLookupError),
		loadAssetUserOptions(notifyLookupError)
	]);

	assetOptions.value = assets.map(item => ({
		label: item.assetNo ? `${item.assetNo} / ${item.name}` : item.name,
		value: item.id
	}));
	departmentOptions.value = departments.map(item => ({
		label: item.label,
		value: item.id
	}));
	userOptions.value = users.map(item => ({
		label: item.departmentName ? `${item.name} / ${item.departmentName}` : item.name,
		value: item.id
	}));
});

function notifyLookupError(error: any) {
	ElMessage.warning(error?.message || '调拨基础选项加载失败');
}
</script>
