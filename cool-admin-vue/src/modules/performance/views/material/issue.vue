<!-- 文件职责：承接物资领用单查询、录入、提交和确认领用；不负责归还流程、库存盘点或菜单注册；依赖 material-issue service、物资目录/部门/用户选项与物资私有页面壳；维护重点是 submit/issue/cancel 动作口径不能漂移。 -->
<template>
	<MaterialCrudPage
		class="material-issue-page"
		title="物资领用"
		description="记录领用标题、目录、部门、领用人、用途和领用日期，完成一期最小领用闭环。"
		notice="一期领用不做归还流程；确认领用后会直接扣减对应部门库存的可用库存。"
		:page-permission="PERMISSIONS.performance.materialIssue.page"
		:info-permission="PERMISSIONS.performance.materialIssue.info"
		:add-permission="PERMISSIONS.performance.materialIssue.add"
		:update-permission="PERMISSIONS.performance.materialIssue.update"
		:columns="columns"
		:detail-fields="detailFields"
		:filters="filters"
		:form-fields="formFields"
		:create-filters="createFilters"
		:create-empty="createEmptyMaterialIssue"
		:fetch-page="performanceMaterialIssueService.fetchPage.bind(performanceMaterialIssueService)"
		:fetch-info="performanceMaterialIssueService.fetchInfo.bind(performanceMaterialIssueService)"
		:create-item="performanceMaterialIssueService.createIssue.bind(performanceMaterialIssueService)"
		:update-item="performanceMaterialIssueService.updateIssue.bind(performanceMaterialIssueService)"
		:row-actions="rowActions"
		create-label="新增领用单"
		edit-label="编辑领用单"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import MaterialCrudPage from './material-crud-page.vue';
import { performanceMaterialIssueService } from '../../service/material-issue';
import {
	createEmptyMaterialIssue,
	type MaterialIssueRecord
} from '../../types';
import {
	createElementLookupWarningHandler,
	loadMaterialCatalogOptions,
	loadMaterialDepartmentOptions,
	loadMaterialUserOptions,
	toMaterialCatalogSelectOptions,
	toMaterialUserSelectOptions,
	toSelectOptions,
	type DepartmentOption
} from './lookups';
import { enumOptions, formatQuantity, materialIssueStatusTagMap } from './shared';
import { PERMISSIONS } from '../../../base/generated/permissions.generated';
import type { CrudRowAction, CrudSelectOption } from '../shared/crud-page-shell';

const columns = [
	{ prop: 'issueNo', label: '领用单号', minWidth: 160 },
	{ prop: 'title', label: '领用标题', minWidth: 220 },
	{ prop: 'materialCode', label: '物资编码', minWidth: 140 },
	{ prop: 'materialName', label: '物资名称', minWidth: 180 },
	{ prop: 'quantity', label: '数量', minWidth: 100, formatter: formatQuantity },
	{ prop: 'departmentName', label: '领用部门', minWidth: 140 },
	{ prop: 'assigneeName', label: '领用人', minWidth: 120 },
	{ prop: 'issueDate', label: '领用日期', minWidth: 160 },
	{ prop: 'submittedAt', label: '提交时间', minWidth: 160 },
	{ prop: 'issuedAt', label: '确认领用时间', minWidth: 160 },
	{ prop: 'status', label: '状态', minWidth: 120, tagMap: materialIssueStatusTagMap }
];

const detailFields = [
	...columns,
	{ prop: 'unit', label: '单位', minWidth: 100 },
	{ prop: 'issuedByName', label: '确认领用人', minWidth: 140 },
	{ prop: 'purpose', label: '领用用途', span: 2 },
	{ prop: 'createTime', label: '创建时间', minWidth: 160 },
	{ prop: 'updateTime', label: '更新时间', minWidth: 160 },
	{ prop: 'remark', label: '备注', span: 2 }
];

const materialOptions = ref<CrudSelectOption[]>([]);
const departmentOptions = ref<CrudSelectOption[]>([]);
const userOptions = ref<CrudSelectOption[]>([]);

const filters = computed(() => [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '单号 / 标题 / 物资 / 领用人 / 部门' },
	{
		prop: 'departmentId',
		label: '领用部门',
		type: 'select',
		options: departmentOptions.value
	},
	{
		prop: 'status',
		label: '状态',
		type: 'select',
		options: enumOptions(materialIssueStatusTagMap)
	}
]);

const formFields = computed(() => [
	{ prop: 'title', label: '领用标题', type: 'text' },
	{ prop: 'catalogId', label: '物资目录', type: 'select', options: materialOptions.value },
	{ prop: 'departmentId', label: '领用部门', type: 'select', options: departmentOptions.value },
	{ prop: 'assigneeId', label: '领用人', type: 'select', options: userOptions.value },
	{ prop: 'quantity', label: '数量', type: 'number' },
	{ prop: 'issueDate', label: '领用日期', type: 'date' },
	{ prop: 'purpose', label: '领用用途', type: 'textarea', span: 24 },
	{ prop: 'remark', label: '备注', type: 'textarea', span: 24 }
]);

const rowActions: CrudRowAction<MaterialIssueRecord>[] = [
	{
		key: 'submit',
		label: '提交',
		permission: PERMISSIONS.performance.materialIssue.submit,
		visible: row => row.status === 'draft',
		confirmText: () => '确认提交该领用单吗？',
		handler: row => performanceMaterialIssueService.submitIssue({ id: row.id! }),
		successMessage: '已提交'
	},
	{
		key: 'issue',
		label: '确认领用',
		permission: PERMISSIONS.performance.materialIssue.issue,
		visible: row => row.status === 'submitted',
		confirmText: () => '确认领用后将扣减库存，是否继续？',
		handler: row => performanceMaterialIssueService.issueMaterial({ id: row.id! }),
		successMessage: '已确认领用'
	},
	{
		key: 'cancel',
		label: '取消',
		permission: PERMISSIONS.performance.materialIssue.cancel,
		type: 'danger',
		visible: row => ['draft', 'submitted'].includes(row.status || ''),
		confirmText: () => '确认取消该领用单吗？',
		handler: row => performanceMaterialIssueService.cancelIssue({ id: row.id! }),
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
	const [materials, departments, users] = await Promise.all([
		loadMaterialCatalogOptions(notifyLookupError),
		loadMaterialDepartmentOptions(notifyLookupError),
		loadMaterialUserOptions(notifyLookupError)
	]);

	materialOptions.value = toMaterialCatalogSelectOptions(materials);
	departmentOptions.value = toSelectOptions<DepartmentOption>(departments);
	userOptions.value = toMaterialUserSelectOptions(users);
});

const notifyLookupError = createElementLookupWarningHandler('物资领用基础选项加载失败');
</script>
