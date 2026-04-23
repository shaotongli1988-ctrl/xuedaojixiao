<!-- 文件职责：承接部门维度物资库存只读视图；不负责库存调整、盘点任务或菜单注册；依赖 material-stock service、部门选项与物资私有页面壳；维护重点是 currentQty/availableQty/issuedQty/isLowStock 口径必须与后端库存聚合一致。 -->
<template>
	<MaterialCrudPage
		class="material-stock-page"
		title="物资库存"
		description="查看目录在各部门下的当前库存、可用数量、预留数量和低库存预警。"
		notice="一期库存页保持只读；库存只会被确认入库和确认领用动作回写。"
		:page-permission="PERMISSIONS.performance.materialStock.page"
		:info-permission="PERMISSIONS.performance.materialStock.info"
		:columns="columns"
		:detail-fields="detailFields"
		:filters="filters"
		:create-filters="createFilters"
		:fetch-page="
			performanceMaterialStockService.fetchPage.bind(performanceMaterialStockService)
		"
		:fetch-info="
			performanceMaterialStockService.fetchInfo.bind(performanceMaterialStockService)
		"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import MaterialCrudPage from './material-crud-page.vue';
import { performanceMaterialStockService } from '../../service/material-stock';
import {
	createElementLookupWarningHandler,
	loadMaterialDepartmentOptions,
	toSelectOptions,
	type DepartmentOption
} from './lookups';
import { PERMISSIONS } from '../../../base/generated/permissions.generated';
import {
	enumOptions,
	formatMoney,
	formatQuantity,
	materialCatalogStatusTagMap,
	materialLowStockTagMap
} from './shared';
import type { CrudSelectOption } from '../shared/crud-page-shell';

const columns = [
	{ prop: 'materialCode', label: '物资编码', minWidth: 140 },
	{ prop: 'materialName', label: '物资名称', minWidth: 180 },
	{ prop: 'category', label: '分类', minWidth: 120 },
	{ prop: 'departmentName', label: '所属部门', minWidth: 140 },
	{ prop: 'specification', label: '规格', minWidth: 160 },
	{ prop: 'currentQty', label: '当前库存', minWidth: 100, formatter: formatQuantity },
	{ prop: 'availableQty', label: '可用数量', minWidth: 100, formatter: formatQuantity },
	{ prop: 'reservedQty', label: '预留数量', minWidth: 100, formatter: formatQuantity },
	{ prop: 'issuedQty', label: '已领用数量', minWidth: 100, formatter: formatQuantity },
	{ prop: 'safetyStock', label: '安全库存', minWidth: 100, formatter: formatQuantity },
	{ prop: 'status', label: '目录状态', minWidth: 120, tagMap: materialCatalogStatusTagMap },
	{ prop: 'isLowStock', label: '库存预警', minWidth: 120, tagMap: materialLowStockTagMap }
];

const detailFields = [
	...columns,
	{ prop: 'unit', label: '计量单位', minWidth: 100 },
	{ prop: 'lastUnitCost', label: '最近单价', minWidth: 120, formatter: formatMoney },
	{ prop: 'stockAmount', label: '库存金额', minWidth: 120, formatter: formatMoney },
	{ prop: 'lastInboundTime', label: '最近入库', minWidth: 160 },
	{ prop: 'lastIssueTime', label: '最近领用', minWidth: 160 },
	{ prop: 'createTime', label: '创建时间', minWidth: 160 },
	{ prop: 'updateTime', label: '更新时间', minWidth: 160 }
];

const departmentOptions = ref<CrudSelectOption[]>([]);

const filters = computed(() => [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '编码 / 名称 / 部门 / 分类' },
	{
		prop: 'departmentId',
		label: '所属部门',
		type: 'select',
		options: departmentOptions.value
	},
	{
		prop: 'status',
		label: '目录状态',
		type: 'select',
		options: enumOptions(materialCatalogStatusTagMap)
	},
	{
		prop: 'onlyLowStock',
		label: '库存预警',
		type: 'select',
		options: enumOptions(materialLowStockTagMap)
	}
]);

function createFilters() {
	return {
		keyword: '',
		departmentId: '',
		status: '',
		onlyLowStock: ''
	};
}

onMounted(async () => {
	const departments = await loadMaterialDepartmentOptions(notifyLookupError);
	departmentOptions.value = toSelectOptions<DepartmentOption>(departments);
});

const notifyLookupError = createElementLookupWarningHandler('物资库存基础选项加载失败');
</script>
