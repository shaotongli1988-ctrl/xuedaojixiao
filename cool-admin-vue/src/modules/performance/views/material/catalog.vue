<!-- 文件职责：承接物资目录主数据查询、新增、编辑和删除；不负责库存回写、入出库流程或菜单注册；依赖 material-catalog service 与物资私有页面壳；维护重点是 code/name/unit/status 与后端 Phase 1 契约保持一致。 -->
<template>
	<material-crud-page
		class="material-catalog-page"
		title="物资目录"
		description="维护物资编码、名称、分类、规格、计量单位、安全库存和参考单价。"
		notice="目录是一切部门库存、入库和领用的单一来源；一期不在前端维护供应商、批次或库位。"
		:page-permission="PERMISSIONS.performance.materialCatalog.page"
		:info-permission="PERMISSIONS.performance.materialCatalog.info"
		:add-permission="PERMISSIONS.performance.materialCatalog.add"
		:update-permission="PERMISSIONS.performance.materialCatalog.update"
		:delete-permission="PERMISSIONS.performance.materialCatalog.delete"
		:columns="columns"
		:detail-fields="detailFields"
		:filters="filters"
		:form-fields="formFields"
		:create-filters="createFilters"
		:create-empty="createEmptyMaterialCatalog"
		:fetch-page="
			performanceMaterialCatalogService.fetchPage.bind(performanceMaterialCatalogService)
		"
		:fetch-info="
			performanceMaterialCatalogService.fetchInfo.bind(performanceMaterialCatalogService)
		"
		:create-item="
			performanceMaterialCatalogService.createMaterial.bind(performanceMaterialCatalogService)
		"
		:update-item="
			performanceMaterialCatalogService.updateMaterial.bind(performanceMaterialCatalogService)
		"
		:remove-item="
			performanceMaterialCatalogService.removeMaterial.bind(performanceMaterialCatalogService)
		"
		create-label="新增目录"
		edit-label="编辑目录"
	/>
</template>

<script lang="ts" setup>
import MaterialCrudPage from './material-crud-page.vue';
import { performanceMaterialCatalogService } from '../../service/material-catalog';
import { createEmptyMaterialCatalog } from '../../types';
import { PERMISSIONS } from '../../../base/generated/permissions.generated';
import { enumOptions, formatMoney, formatQuantity, materialCatalogStatusTagMap } from './shared';

const columns = [
	{ prop: 'code', label: '物资编码', minWidth: 140 },
	{ prop: 'name', label: '物资名称', minWidth: 180 },
	{ prop: 'category', label: '分类', minWidth: 120 },
	{ prop: 'specification', label: '规格', minWidth: 160 },
	{ prop: 'unit', label: '计量单位', minWidth: 100 },
	{ prop: 'stockDepartmentCount', label: '库存部门数', minWidth: 110 },
	{ prop: 'currentQty', label: '当前库存', minWidth: 100, formatter: formatQuantity },
	{ prop: 'availableQty', label: '可用数量', minWidth: 100, formatter: formatQuantity },
	{ prop: 'reservedQty', label: '预留数量', minWidth: 100, formatter: formatQuantity },
	{ prop: 'issuedQty', label: '已领用数量', minWidth: 100, formatter: formatQuantity },
	{ prop: 'safetyStock', label: '安全库存', minWidth: 100, formatter: formatQuantity },
	{ prop: 'referenceUnitCost', label: '参考单价', minWidth: 120, formatter: formatMoney },
	{ prop: 'status', label: '状态', minWidth: 120, tagMap: materialCatalogStatusTagMap }
];

const detailFields = [
	...columns,
	{ prop: 'createTime', label: '创建时间', minWidth: 160 },
	{ prop: 'updateTime', label: '更新时间', minWidth: 160 },
	{ prop: 'remark', label: '备注', span: 2 }
];

const filters = [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '编码 / 名称 / 分类 / 规格' },
	{
		prop: 'status',
		label: '状态',
		type: 'select',
		options: enumOptions(materialCatalogStatusTagMap)
	}
];

const formFields = [
	{ prop: 'code', label: '物资编码', type: 'text' },
	{ prop: 'name', label: '物资名称', type: 'text' },
	{ prop: 'category', label: '分类', type: 'text' },
	{ prop: 'specification', label: '规格', type: 'text' },
	{ prop: 'unit', label: '计量单位', type: 'text' },
	{ prop: 'safetyStock', label: '安全库存', type: 'number' },
	{ prop: 'referenceUnitCost', label: '参考单价', type: 'number', precision: 2 },
	{ prop: 'remark', label: '备注', type: 'textarea', span: 24 }
];

function createFilters() {
	return {
		keyword: '',
		status: ''
	};
}
</script>
