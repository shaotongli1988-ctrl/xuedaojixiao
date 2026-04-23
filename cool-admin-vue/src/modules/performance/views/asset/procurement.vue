<!-- 文件职责：承接主题20资产采购入库页面；不负责主题11采购审批中心、供应商台账或财务凭证；依赖 asset-procurement service、共享状态映射和通用资产 CRUD 页面壳；维护重点是 submit/receive/cancel 必须与冻结接口动作保持一致。 -->
<template>
	<AssetCrudPage
		class="asset-procurement-page"
		title="采购入库"
		description="记录资产侧入库单、入库数量和采购金额，并通过确认入库生成台账资产。"
		notice="采购入库只是资产侧入库结果，不扩展为采购审批中心。"
		:page-permission="PERMISSIONS.performance.assetProcurement.page"
		:info-permission="PERMISSIONS.performance.assetProcurement.info"
		:add-permission="PERMISSIONS.performance.assetProcurement.add"
		:update-permission="PERMISSIONS.performance.assetProcurement.update"
		:columns="columns"
		:filters="filters"
		:form-fields="formFields"
		:create-filters="createFilters"
		:create-empty="createEmptyAssetProcurement"
		:fetch-page="performanceAssetProcurementService.fetchPage.bind(performanceAssetProcurementService)"
		:fetch-info="performanceAssetProcurementService.fetchInfo.bind(performanceAssetProcurementService)"
		:create-item="performanceAssetProcurementService.createProcurement.bind(performanceAssetProcurementService)"
		:update-item="performanceAssetProcurementService.updateProcurement.bind(performanceAssetProcurementService)"
		:row-actions="rowActions"
		create-label="新增入库单"
		edit-label="编辑入库单"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetProcurementService } from '../../service/asset-procurement';
import {
	createEmptyAssetProcurement,
	type AssetProcurementRecord
} from '../../types';
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
import { enumOptions, formatMoney, procurementStatusTagMap } from './shared';
import { PERMISSIONS } from '../../../base/generated/permissions.generated';
import type { CrudRowAction, CrudSelectOption } from '../shared/crud-page-shell';

const columns = [
	{ prop: 'procurementNo', label: '入库单号', minWidth: 160 },
	{ prop: 'title', label: '标题', minWidth: 180 },
	{ prop: 'assetCategory', label: '资产分类', minWidth: 120 },
	{ prop: 'quantity', label: '数量', minWidth: 100 },
	{ prop: 'amount', label: '金额', minWidth: 120, formatter: formatMoney },
	{ prop: 'departmentName', label: '所属部门', minWidth: 140 },
	{ prop: 'status', label: '状态', minWidth: 120, tagMap: procurementStatusTagMap }
];

const filters = [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '单号 / 标题 / 资产名称' },
	{ prop: 'status', label: '状态', type: 'select', options: enumOptions(procurementStatusTagMap) }
];

const departmentOptions = ref<CrudSelectOption[]>([]);
const userOptions = ref<CrudSelectOption[]>([]);
const supplierOptions = ref<CrudSelectOption[]>([]);

const formFields = computed(() => [
	{ prop: 'title', label: '标题', type: 'text' },
	{ prop: 'assetName', label: '资产名称', type: 'text' },
	{ prop: 'assetCategory', label: '资产分类', type: 'text' },
	{ prop: 'quantity', label: '数量', type: 'number' },
	{ prop: 'amount', label: '金额', type: 'number', precision: 2 },
	{ prop: 'departmentId', label: '所属部门', type: 'select', options: departmentOptions.value },
	{ prop: 'requesterId', label: '申请人', type: 'select', options: userOptions.value },
	{ prop: 'supplierId', label: '供应商', type: 'select', options: supplierOptions.value },
	{ prop: 'purchaseOrderId', label: '采购订单ID', type: 'number' },
	{ prop: 'remark', label: '备注', type: 'textarea', span: 24 }
]);

const rowActions: CrudRowAction<AssetProcurementRecord>[] = [
	{
		key: 'submit',
		label: '提交',
		permission: PERMISSIONS.performance.assetProcurement.submit,
		visible: row => row.status === 'draft',
		confirmText: () => '确认提交该入库单吗？',
		handler: row => performanceAssetProcurementService.submitProcurement({ id: row.id! }),
		successMessage: '已提交'
	},
	{
		key: 'receive',
		label: '确认入库',
		permission: PERMISSIONS.performance.assetProcurement.receive,
		visible: row => row.status === 'submitted',
		confirmText: () => '确认入库后将生成资产台账，是否继续？',
		handler: row => performanceAssetProcurementService.receiveProcurement({ id: row.id! }),
		successMessage: '已确认入库'
	},
	{
		key: 'cancel',
		label: '取消',
		permission: PERMISSIONS.performance.assetProcurement.cancel,
		type: 'danger',
		visible: row => ['draft', 'submitted'].includes(row.status || ''),
		confirmText: () => '确认取消该入库单吗？',
		handler: row => performanceAssetProcurementService.cancelProcurement({ id: row.id! }),
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
	const [departments, users, suppliers] = await Promise.all([
		loadAssetDepartmentOptions(notifyLookupError),
		loadAssetUserOptions(notifyLookupError),
		loadAssetSupplierOptions(notifyLookupError)
	]);

	departmentOptions.value = toSelectOptions<DepartmentOption>(departments);
	userOptions.value = toUserSelectOptions(users);
	supplierOptions.value = toSupplierSelectOptions(suppliers as SupplierOption[]);
});

const notifyLookupError = createElementLookupWarningHandler('入库基础选项加载失败');
</script>
