<!-- 文件职责：承接主题20资产调拨页面；不负责物流签收、仓储系统或外部审批流；依赖 asset-transfer service、共享状态映射和通用资产 CRUD 页面壳；维护重点是 submit/complete/cancel 的状态键与冻结文档保持一致。 -->
<template>
	<AssetCrudPage
		class="asset-transfer-page"
		title="资产调拨"
		description="管理调拨单、调出调入部门和目标位置，跟踪调拨状态。"
		notice="仅 available 资产允许发起调拨；完成后资产归属部门与位置同步更新。"
		:page-permission="PERMISSIONS.performance.assetTransfer.page"
		:info-permission="PERMISSIONS.performance.assetTransfer.info"
		:add-permission="PERMISSIONS.performance.assetTransfer.add"
		:update-permission="PERMISSIONS.performance.assetTransfer.update"
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
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetTransferService } from '../../service/asset-transfer';
import {
	createEmptyAssetTransfer,
	type AssetTransferRecord
} from '../../types';
import {
	createElementLookupWarningHandler,
	loadAssetDepartmentOptions,
	loadAssetOptions,
	loadAssetUserOptions,
	toAssetSelectOptions,
	toSelectOptions,
	toUserSelectOptions,
	type DepartmentOption
} from './lookups';
import { assetStatusTagMap, enumOptions, transferStatusTagMap } from './shared';
import { PERMISSIONS } from '../../../base/generated/permissions.generated';
import type { CrudRowAction, CrudSelectOption } from '../shared/crud-page-shell';

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

const assetOptions = ref<CrudSelectOption[]>([]);
const departmentOptions = ref<CrudSelectOption[]>([]);
const userOptions = ref<CrudSelectOption[]>([]);

const formFields = computed(() => [
	{ prop: 'assetId', label: '资产', type: 'select', options: assetOptions.value },
	{ prop: 'toDepartmentId', label: '目标部门', type: 'select', options: departmentOptions.value },
	{ prop: 'applicantId', label: '目标管理人', type: 'select', options: userOptions.value },
	{ prop: 'toLocation', label: '目标位置', type: 'text' },
	{ prop: 'remark', label: '调拨原因', type: 'textarea', span: 24 }
]);

const rowActions: CrudRowAction<AssetTransferRecord>[] = [
	{
		key: 'submit',
		label: '提交',
		permission: PERMISSIONS.performance.assetTransfer.submit,
		visible: row => row.status === 'draft',
		confirmText: () => '确认提交该调拨单吗？',
		handler: row => performanceAssetTransferService.submitTransfer({ id: row.id! }),
		successMessage: '已提交'
	},
	{
		key: 'complete',
		label: '完成',
		permission: PERMISSIONS.performance.assetTransfer.complete,
		visible: row => row.status === 'inTransit',
		confirmText: () => '确认完成该调拨单吗？',
		handler: row => performanceAssetTransferService.completeTransfer({ id: row.id! }),
		successMessage: '已完成调拨'
	},
	{
		key: 'cancel',
		label: '取消',
		permission: PERMISSIONS.performance.assetTransfer.cancel,
		type: 'danger',
		visible: row => ['draft', 'submitted', 'inTransit'].includes(row.status || ''),
		confirmText: () => '确认取消该调拨单吗？',
		handler: row => performanceAssetTransferService.cancelTransfer({ id: row.id! }),
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

	assetOptions.value = toAssetSelectOptions(assets);
	departmentOptions.value = toSelectOptions<DepartmentOption>(departments);
	userOptions.value = toUserSelectOptions(users);
});

const notifyLookupError = createElementLookupWarningHandler('调拨基础选项加载失败');
</script>
