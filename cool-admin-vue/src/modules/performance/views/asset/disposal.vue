<!-- 文件职责：承接主题20资产报废页面；不负责财务核销、残值处置或外部审批流；依赖 asset-disposal service、共享状态映射和通用资产 CRUD 页面壳；维护重点是 submit/approve/execute/cancel 四个动作必须完整显隐。 -->
<template>
	<AssetCrudPage
		title="报废"
		description="管理报废单、报废原因、审批和执行状态，查看执行时间。"
		notice="执行报废后资产状态推进为 scrapped，不允许再次恢复。"
		page-permission="performance:assetDisposal:page"
		info-permission="performance:assetDisposal:info"
		add-permission="performance:assetDisposal:add"
		update-permission="performance:assetDisposal:update"
		:columns="columns"
		:filters="filters"
		:form-fields="formFields"
		:create-filters="createFilters"
		:create-empty="createEmptyAssetDisposal"
		:fetch-page="performanceAssetDisposalService.fetchPage.bind(performanceAssetDisposalService)"
		:fetch-info="performanceAssetDisposalService.fetchInfo.bind(performanceAssetDisposalService)"
		:create-item="performanceAssetDisposalService.createDisposal.bind(performanceAssetDisposalService)"
		:update-item="performanceAssetDisposalService.updateDisposal.bind(performanceAssetDisposalService)"
		:row-actions="rowActions"
		create-label="新增报废单"
		edit-label="编辑报废单"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetDisposalService } from '../../service/asset-disposal';
import { createEmptyAssetDisposal } from '../../types';
import { loadAssetDepartmentOptions, loadAssetOptions } from './lookups';
import { assetStatusTagMap, disposalStatusTagMap, enumOptions, formatMoney } from './shared';

const columns = [
	{ prop: 'disposalNo', label: '报废单号', minWidth: 160 },
	{ prop: 'assetNo', label: '资产编号', minWidth: 140 },
	{ prop: 'assetName', label: '资产名称', minWidth: 180 },
	{ prop: 'assetStatus', label: '资产状态', minWidth: 120, tagMap: assetStatusTagMap },
	{ prop: 'departmentName', label: '所属部门', minWidth: 140 },
	{ prop: 'estimatedResidualAmount', label: '预计残值', minWidth: 120, formatter: formatMoney },
	{ prop: 'status', label: '状态', minWidth: 120, tagMap: disposalStatusTagMap }
];

const filters = [
	{ prop: 'keyword', label: '关键词', type: 'text', placeholder: '报废单号 / 资产编号' },
	{ prop: 'status', label: '状态', type: 'select', options: enumOptions(disposalStatusTagMap) }
];

const assetOptions = ref<any[]>([]);
const departmentOptions = ref<any[]>([]);

const formFields = computed(() => [
	{ prop: 'assetId', label: '资产', type: 'select', options: assetOptions.value },
	{ prop: 'departmentId', label: '所属部门', type: 'select', options: departmentOptions.value },
	{ prop: 'reason', label: '报废原因', type: 'textarea', span: 24 },
	{ prop: 'remark', label: '备注', type: 'textarea', span: 24 }
]);

const rowActions = [
	{
		key: 'submit',
		label: '提交',
		permission: 'performance:assetDisposal:submit',
		visible: (row: any) => row.status === 'draft',
		confirmText: () => '确认提交该报废单吗？',
		handler: (row: any) => performanceAssetDisposalService.submitDisposal({ id: row.id }),
		successMessage: '已提交'
	},
	{
		key: 'approve',
		label: '审批',
		permission: 'performance:assetDisposal:approve',
		visible: (row: any) => row.status === 'submitted',
		confirmText: () => '确认审批通过该报废单吗？',
		handler: (row: any) => performanceAssetDisposalService.approveDisposal({ id: row.id }),
		successMessage: '已审批'
	},
	{
		key: 'execute',
		label: '执行报废',
		permission: 'performance:assetDisposal:execute',
		type: 'danger',
		visible: (row: any) => row.status === 'approved',
		confirmText: () => '执行后资产将进入报废终态，是否继续？',
		handler: (row: any) => performanceAssetDisposalService.executeDisposal({ id: row.id }),
		successMessage: '已执行报废'
	},
	{
		key: 'cancel',
		label: '取消',
		permission: 'performance:assetDisposal:cancel',
		type: 'danger',
		visible: (row: any) => ['draft', 'submitted', 'approved'].includes(row.status),
		confirmText: () => '确认取消该报废单吗？',
		handler: (row: any) => performanceAssetDisposalService.cancelDisposal({ id: row.id }),
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
	const [assets, departments] = await Promise.all([
		loadAssetOptions(notifyLookupError),
		loadAssetDepartmentOptions(notifyLookupError)
	]);

	assetOptions.value = assets.map(item => ({
		label: item.assetNo ? `${item.assetNo} / ${item.name}` : item.name,
		value: item.id
	}));
	departmentOptions.value = departments.map(item => ({
		label: item.label,
		value: item.id
	}));
});

function notifyLookupError(error: any) {
	ElMessage.warning(error?.message || '报废基础选项加载失败');
}
</script>
