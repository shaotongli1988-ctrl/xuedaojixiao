<!-- 文件职责：承接物资入库单查询、录入、提交和确认入库；不负责采购审批中心、财务凭证或菜单注册；依赖 material-inbound service、物资目录/部门选项与物资私有页面壳；维护重点是 title/catalogId/departmentId 和 submit/receive/cancel 动作键不能漂移。 -->
<template>
	<MaterialCrudPage
		class="material-inbound-page"
		title="物资入库"
		description="记录入库标题、目录、部门、数量和金额，完成一期最小入库闭环。"
		notice="一期入库只维护目录级入库单；确认入库后才会给对应部门库存增加可用库存。"
		:page-permission="PERMISSIONS.performance.materialInbound.page"
		:info-permission="PERMISSIONS.performance.materialInbound.info"
		:add-permission="PERMISSIONS.performance.materialInbound.add"
		:update-permission="PERMISSIONS.performance.materialInbound.update"
		:columns="columns"
		:detail-fields="detailFields"
		:filters="filters"
		:form-fields="formFields"
		:create-filters="createFilters"
		:create-empty="createEmptyMaterialInbound"
		:fetch-page="
			performanceMaterialInboundService.fetchPage.bind(performanceMaterialInboundService)
		"
		:fetch-info="
			performanceMaterialInboundService.fetchInfo.bind(performanceMaterialInboundService)
		"
		:create-item="
			performanceMaterialInboundService.createInbound.bind(performanceMaterialInboundService)
		"
		:update-item="
			performanceMaterialInboundService.updateInbound.bind(performanceMaterialInboundService)
		"
		:row-actions="rowActions"
		create-label="新增入库单"
		edit-label="编辑入库单"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import MaterialCrudPage from './material-crud-page.vue';
import { performanceMaterialInboundService } from '../../service/material-inbound';
import { createEmptyMaterialInbound, type MaterialInboundRecord } from '../../types';
import { PERMISSIONS } from '../../../base/generated/permissions.generated';
import {
	createElementLookupWarningHandler,
	loadMaterialCatalogOptions,
	loadMaterialDepartmentOptions,
	toMaterialCatalogSelectOptions,
	toSelectOptions,
	type DepartmentOption
} from './lookups';
import { enumOptions, formatMoney, formatQuantity, materialInboundStatusTagMap } from './shared';
import type { CrudRowAction, CrudSelectOption } from '../shared/crud-page-shell';

const columns = [
	{ prop: 'inboundNo', label: '入库单号', minWidth: 160 },
	{ prop: 'title', label: '入库标题', minWidth: 220 },
	{ prop: 'materialCode', label: '物资编码', minWidth: 140 },
	{ prop: 'materialName', label: '物资名称', minWidth: 180 },
	{ prop: 'departmentName', label: '入库部门', minWidth: 140 },
	{ prop: 'quantity', label: '数量', minWidth: 100, formatter: formatQuantity },
	{ prop: 'unitCost', label: '单价', minWidth: 120, formatter: formatMoney },
	{ prop: 'totalAmount', label: '金额', minWidth: 120, formatter: formatMoney },
	{ prop: 'submittedAt', label: '提交时间', minWidth: 160 },
	{ prop: 'receivedAt', label: '入库时间', minWidth: 160 },
	{ prop: 'status', label: '状态', minWidth: 120, tagMap: materialInboundStatusTagMap }
];

const detailFields = [
	...columns,
	{ prop: 'unit', label: '单位', minWidth: 100 },
	{ prop: 'receivedByName', label: '确认入库人', minWidth: 140 },
	{ prop: 'sourceType', label: '来源类型', minWidth: 120 },
	{ prop: 'sourceBizId', label: '来源单据', minWidth: 140 },
	{ prop: 'createTime', label: '创建时间', minWidth: 160 },
	{ prop: 'updateTime', label: '更新时间', minWidth: 160 },
	{ prop: 'remark', label: '备注', span: 2 }
];

const materialOptions = ref<CrudSelectOption[]>([]);
const departmentOptions = ref<CrudSelectOption[]>([]);

const filters = computed(() => [
	{
		prop: 'keyword',
		label: '关键词',
		type: 'text',
		placeholder: '单号 / 标题 / 物资 / 部门 / 来源'
	},
	{
		prop: 'departmentId',
		label: '入库部门',
		type: 'select',
		options: departmentOptions.value
	},
	{
		prop: 'status',
		label: '状态',
		type: 'select',
		options: enumOptions(materialInboundStatusTagMap)
	}
]);

const formFields = computed(() => [
	{ prop: 'title', label: '入库标题', type: 'text' },
	{ prop: 'catalogId', label: '物资目录', type: 'select', options: materialOptions.value },
	{ prop: 'departmentId', label: '入库部门', type: 'select', options: departmentOptions.value },
	{ prop: 'quantity', label: '数量', type: 'number' },
	{ prop: 'unitCost', label: '单价', type: 'number', precision: 2 },
	{ prop: 'totalAmount', label: '金额', type: 'number', precision: 2 },
	{ prop: 'sourceType', label: '来源类型', type: 'text' },
	{ prop: 'sourceBizId', label: '来源单据', type: 'text' },
	{ prop: 'remark', label: '备注', type: 'textarea', span: 24 }
]);

const rowActions: CrudRowAction<MaterialInboundRecord>[] = [
	{
		key: 'submit',
		label: '提交',
		permission: PERMISSIONS.performance.materialInbound.submit,
		visible: row => row.status === 'draft',
		confirmText: () => '确认提交该入库单吗？',
		handler: row => performanceMaterialInboundService.submitInbound({ id: row.id! }),
		successMessage: '已提交'
	},
	{
		key: 'receive',
		label: '确认入库',
		permission: PERMISSIONS.performance.materialInbound.receive,
		visible: row => row.status === 'submitted',
		confirmText: () => '确认入库后将更新库存，是否继续？',
		handler: row => performanceMaterialInboundService.receiveInbound({ id: row.id! }),
		successMessage: '已确认入库'
	},
	{
		key: 'cancel',
		label: '取消',
		permission: PERMISSIONS.performance.materialInbound.cancel,
		type: 'danger',
		visible: row => ['draft', 'submitted'].includes(row.status || ''),
		confirmText: () => '确认取消该入库单吗？',
		handler: row => performanceMaterialInboundService.cancelInbound({ id: row.id! }),
		successMessage: '已取消'
	}
];

function createFilters() {
	return {
		keyword: '',
		departmentId: '',
		status: ''
	};
}

onMounted(async () => {
	const [materials, departments] = await Promise.all([
		loadMaterialCatalogOptions(notifyLookupError),
		loadMaterialDepartmentOptions(notifyLookupError)
	]);

	materialOptions.value = toMaterialCatalogSelectOptions(materials);
	departmentOptions.value = toSelectOptions<DepartmentOption>(departments);
});

const notifyLookupError = createElementLookupWarningHandler('物资入库基础选项加载失败');
</script>
