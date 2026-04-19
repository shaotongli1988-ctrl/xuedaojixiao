<!-- 文件职责：承接主题20资产领用归还列表与主操作；不负责资产台账主数据维护、调拨或报废流程；依赖 asset-assignment service、共享状态映射和通用资产 CRUD 页面壳；维护重点是 return/markLost 必须与冻结状态键完全一致。 -->
<template>
	<AssetCrudPage
		title="领用归还"
		description="记录资产领用、归还和丢失处理，统一查看领用人和领用部门。"
		notice="部门负责人仅处理本人部门树范围内记录；丢失终态由资产侧权限控制。"
		page-permission="performance:assetAssignment:page"
		add-permission="performance:assetAssignment:add"
		update-permission="performance:assetAssignment:update"
		delete-permission="performance:assetAssignment:delete"
		:columns="columns"
		:filters="filters"
		:form-fields="formFields"
		:create-filters="createFilters"
		:create-empty="createEmptyAssetAssignment"
		:fetch-page="performanceAssetAssignmentService.fetchPage.bind(performanceAssetAssignmentService)"
		:create-item="performanceAssetAssignmentService.createAssignment.bind(performanceAssetAssignmentService)"
		:update-item="performanceAssetAssignmentService.updateAssignment.bind(performanceAssetAssignmentService)"
		:remove-item="performanceAssetAssignmentService.removeAssignment.bind(performanceAssetAssignmentService)"
		:row-actions="rowActions"
		create-label="新增领用"
		edit-label="编辑领用"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetAssignmentService } from '../../service/asset-assignment';
import { createEmptyAssetAssignment } from '../../types';
import { loadAssetDepartmentOptions, loadAssetOptions, loadAssetUserOptions } from './lookups';
import { assignmentStatusTagMap, assetStatusTagMap, enumOptions } from './shared';

const columns = [
	{ prop: 'assetNo', label: '资产编号', minWidth: 140 },
	{ prop: 'assetName', label: '资产名称', minWidth: 180 },
	{ prop: 'assetStatus', label: '资产状态', minWidth: 120, tagMap: assetStatusTagMap },
	{ prop: 'assigneeName', label: '领用人', minWidth: 120 },
	{ prop: 'departmentName', label: '领用部门', minWidth: 140 },
	{ prop: 'assignDate', label: '领用日期', minWidth: 120 },
	{ prop: 'status', label: '领用状态', minWidth: 120, tagMap: assignmentStatusTagMap }
];

const filters = [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '资产编号 / 领用人' },
	{ prop: 'status', label: '状态', type: 'select', options: enumOptions(assignmentStatusTagMap) }
];

const assetOptions = ref<any[]>([]);
const userOptions = ref<any[]>([]);
const departmentOptions = ref<any[]>([]);

const formFields = computed(() => [
	{ prop: 'assetId', label: '资产', type: 'select', options: assetOptions.value },
	{ prop: 'assigneeId', label: '领用人', type: 'select', options: userOptions.value },
	{ prop: 'departmentId', label: '领用部门', type: 'select', options: departmentOptions.value },
	{ prop: 'assignDate', label: '领用日期', type: 'date' },
	{ prop: 'purpose', label: '领用用途', type: 'textarea', span: 24 },
	{ prop: 'returnRemark', label: '归还说明', type: 'textarea', span: 24 }
]);

const rowActions = [
	{
		key: 'return',
		label: '归还',
		permission: 'performance:assetAssignment:return',
		visible: (row: any) => row.status === 'assigned',
		confirmText: () => '确认归还该资产吗？',
		handler: (row: any) => performanceAssetAssignmentService.returnAsset({ id: row.id }),
		successMessage: '已归还'
	},
	{
		key: 'lost',
		label: '标记丢失',
		permission: 'performance:assetAssignment:markLost',
		type: 'danger',
		visible: (row: any) => row.status === 'assigned',
		confirmText: () => '确认标记为丢失吗？',
		handler: (row: any) => performanceAssetAssignmentService.markLost({ id: row.id }),
		successMessage: '已标记丢失'
	}
];

function createFilters() {
	return {
		keyword: '',
		status: ''
	};
}

onMounted(async () => {
	const [assets, users, departments] = await Promise.all([
		loadAssetOptions(notifyLookupError),
		loadAssetUserOptions(notifyLookupError),
		loadAssetDepartmentOptions(notifyLookupError)
	]);

	assetOptions.value = assets.map(item => ({
		label: item.assetNo ? `${item.assetNo} / ${item.name}` : item.name,
		value: item.id
	}));
	userOptions.value = users.map(item => ({
		label: item.departmentName ? `${item.name} / ${item.departmentName}` : item.name,
		value: item.id
	}));
	departmentOptions.value = departments.map(item => ({
		label: item.label,
		value: item.id
	}));
});

function notifyLookupError(error: any) {
	ElMessage.warning(error?.message || '领用基础选项加载失败');
}
</script>
