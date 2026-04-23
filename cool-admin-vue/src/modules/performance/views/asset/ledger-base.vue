<!-- 文件职责：承接主题20资产台账的查询、新增、编辑和删除主链；不负责领用、调拨、报废或折旧重算；依赖 asset-info service、共享状态映射和通用资产 CRUD 页面壳；维护重点是字段命名与冻结接口保持一致，尤其是 name/assetStatus/departmentId 口径不能漂移。 -->
<template>
	<AssetCrudPage
		class="asset-ledger-base-page"
		title="资产台账"
		description="维护资产编号、分类、部门、负责人和采购金额等基础台账。"
		notice="部门负责人仅查看部门树范围台账；资产新增、编辑、删除和状态更新由资产侧角色控制。"
		:page-permission="PERMISSIONS.performance.assetInfo.page"
		:info-permission="PERMISSIONS.performance.assetInfo.info"
		:add-permission="PERMISSIONS.performance.assetInfo.add"
		:update-permission="PERMISSIONS.performance.assetInfo.update"
		:delete-permission="PERMISSIONS.performance.assetInfo.delete"
		:columns="columns"
		:detail-fields="columns"
		:filters="filters"
		:form-fields="formFields"
		:create-filters="createFilters"
		:create-empty="createEmptyAssetInfo"
		:fetch-page="performanceAssetInfoService.fetchPage.bind(performanceAssetInfoService)"
		:fetch-info="performanceAssetInfoService.fetchInfo.bind(performanceAssetInfoService)"
		:create-item="performanceAssetInfoService.createAsset.bind(performanceAssetInfoService)"
		:update-item="performanceAssetInfoService.updateAsset.bind(performanceAssetInfoService)"
		:remove-item="performanceAssetInfoService.removeAsset.bind(performanceAssetInfoService)"
		:row-actions="rowActions"
		create-label="新建资产"
		edit-label="编辑资产"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetInfoService } from '../../service/asset-info';
import { createEmptyAssetInfo, type AssetInfoRecord } from '../../types';
import {
	createElementLookupWarningHandler,
	loadAssetDepartmentOptions,
	loadAssetSupplierOptions,
	loadAssetUserOptions,
	toSelectOptions,
	toSupplierSelectOptions,
	toUserSelectOptions,
	type DepartmentOption,
	type SupplierOption
} from './lookups';
import { assetStatusTagMap, enumOptions, formatMoney } from './shared';
import { PERMISSIONS } from '../../../base/generated/permissions.generated';
import type { CrudRowAction, CrudSelectOption } from '../shared/crud-page-shell';

const columns = [
	{ prop: 'assetNo', label: '资产编号', minWidth: 140 },
	{ prop: 'name', label: '资产名称', minWidth: 180 },
	{ prop: 'category', label: '分类', minWidth: 120 },
	{ prop: 'departmentName', label: '所属部门', minWidth: 140 },
	{ prop: 'managerName', label: '管理人', minWidth: 120 },
	{ prop: 'purchaseAmount', label: '采购金额', minWidth: 120, formatter: formatMoney },
	{ prop: 'assetStatus', label: '状态', minWidth: 120, tagMap: assetStatusTagMap }
];

const filters = [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '资产编号 / 名称' },
	{ prop: 'category', label: '分类', type: 'text', placeholder: '资产分类' },
	{ prop: 'assetStatus', label: '状态', type: 'select', options: enumOptions(assetStatusTagMap) }
];

const departmentOptions = ref<CrudSelectOption[]>([]);
const userOptions = ref<CrudSelectOption[]>([]);
const supplierOptions = ref<CrudSelectOption[]>([]);

const formFields = computed(() => [
	{ prop: 'assetNo', label: '资产编号', type: 'text' },
	{ prop: 'name', label: '资产名称', type: 'text' },
	{ prop: 'category', label: '资产分类', type: 'text' },
	{ prop: 'assetType', label: '资产类型', type: 'text' },
	{ prop: 'departmentId', label: '所属部门', type: 'select', options: departmentOptions.value },
	{ prop: 'managerId', label: '管理人', type: 'select', options: userOptions.value },
	{ prop: 'supplierId', label: '供应商', type: 'select', options: supplierOptions.value },
	{ prop: 'purchaseAmount', label: '采购金额', type: 'number', precision: 2 },
	{ prop: 'assetStatus', label: '状态', type: 'select', options: enumOptions(assetStatusTagMap) },
	{ prop: 'purchaseDate', label: '采购日期', type: 'date' },
	{ prop: 'warrantyExpiry', label: '质保到期', type: 'date' },
	{ prop: 'location', label: '存放位置', type: 'text', span: 24 },
	{ prop: 'remark', label: '备注', type: 'textarea', span: 24 }
]);

const rowActions: CrudRowAction<AssetInfoRecord>[] = [
	{
		key: 'status-available',
		label: '转可用',
		permission: PERMISSIONS.performance.assetInfo.updateStatus,
		visible: row => row.assetStatus !== 'available',
		confirmText: () => '确认将状态切换为可用吗？',
		handler: row =>
			performanceAssetInfoService.updateAssetStatus({
				id: row.id!,
				assetStatus: 'available'
			}),
		successMessage: '状态已更新'
	}
];

function createFilters() {
	return {
		keyword: '',
		category: '',
		assetStatus: ''
	};
}

onMounted(async () => {
	const [departments, users, suppliers] = await Promise.all([
		loadAssetDepartmentOptions(notifyLookupError),
		loadAssetUserOptions(notifyLookupError),
		loadAssetSupplierOptions(notifyLookupError)
	]);

	departmentOptions.value = toSelectOptions<DepartmentOption>(departments);
	userOptions.value = toUserSelectOptions(users);
	supplierOptions.value = toSupplierSelectOptions(suppliers as SupplierOption[]);
});

const notifyLookupError = createElementLookupWarningHandler('资产基础选项加载失败');
</script>
