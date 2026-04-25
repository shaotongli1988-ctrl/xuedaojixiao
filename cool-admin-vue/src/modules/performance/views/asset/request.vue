<!-- 文件职责：承接 Theme20 L1/L2 员工领用申请页；不负责真实资产台账选择、审批待办中心或正式领用执行记录；依赖 asset-assignment-request service、共享资产 CRUD 页面壳和资产基础选项；维护重点是员工只能维护本人草稿并通过请求单进入审批链。 -->
<template>
	<asset-crud-page
		class="asset-request-page"
		title="领用申请"
		description="员工提交 L1/L2 领用申请，审批通过后由资产管理员配发具体资产。"
		notice="当前页面只承载申请过程；L0 直领不在本页处理，已发放结果仍在领用归还页查看。"
		:page-permission="PERMISSIONS.performance.assetAssignmentRequest.page"
		:info-permission="PERMISSIONS.performance.assetAssignmentRequest.info"
		:add-permission="PERMISSIONS.performance.assetAssignmentRequest.add"
		:update-permission="PERMISSIONS.performance.assetAssignmentRequest.update"
		:edit-visible="canEditDraft"
		:columns="columns"
		:detail-fields="detailFields"
		:filters="filters"
		:form-fields="formFields"
		:create-filters="createFilters"
		:create-empty="createEmptyAssetAssignmentRequest"
		:fetch-page="
			performanceAssetAssignmentRequestService.fetchPage.bind(
				performanceAssetAssignmentRequestService
			)
		"
		:fetch-info="fetchInfo"
		:create-item="
			performanceAssetAssignmentRequestService.createDraft.bind(
				performanceAssetAssignmentRequestService
			)
		"
		:update-item="
			performanceAssetAssignmentRequestService.updateDraft.bind(
				performanceAssetAssignmentRequestService
			)
		"
		:row-actions="rowActions"
		create-label="新建申请"
		edit-label="编辑草稿"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetAssignmentRequestService } from '../../service/asset-assignment-request';
import { createEmptyAssetAssignmentRequest, type AssetAssignmentRequestRecord } from '../../types';
import {
	createElementLookupWarningHandler,
	loadAssetDepartmentOptions,
	toSelectOptions,
	type DepartmentOption
} from './lookups';
import { PERMISSIONS } from '../../../base/generated/permissions.generated';
import {
	assignmentRequestLevelTagMap,
	assignmentRequestStatusTagMap,
	assignmentRequestTypeTagMap,
	enumOptions,
	formatMoney
} from './shared';
import type { CrudRowAction, CrudSelectOption } from '../shared/crud-page-shell';

const columns = [
	{ prop: 'requestNo', label: '申请编号', minWidth: 170 },
	{ prop: 'requestLevel', label: '层级', minWidth: 120, tagMap: assignmentRequestLevelTagMap },
	{ prop: 'requestType', label: '类型', minWidth: 140, tagMap: assignmentRequestTypeTagMap },
	{ prop: 'assetCategory', label: '资产分类', minWidth: 140 },
	{ prop: 'assetModelRequest', label: '型号需求', minWidth: 160 },
	{
		prop: 'unitPriceEstimate',
		label: '预估单价',
		minWidth: 120,
		formatter: value => formatMoney(value)
	},
	{ prop: 'currentApproverName', label: '当前审批人', minWidth: 140 },
	{ prop: 'status', label: '状态', minWidth: 140, tagMap: assignmentRequestStatusTagMap }
];

const detailFields = [
	...columns,
	{ prop: 'applicantName', label: '申请人', minWidth: 120 },
	{ prop: 'applicantDepartmentName', label: '申请部门', minWidth: 140 },
	{ prop: 'targetDepartmentName', label: '目标部门', minWidth: 140 },
	{ prop: 'quantity', label: '数量', minWidth: 100 },
	{ prop: 'usageReason', label: '用途说明', minWidth: 200, span: 2 },
	{ prop: 'exceptionReason', label: '异常原因', minWidth: 200, span: 2 },
	{
		prop: 'approvalTriggeredRules',
		label: '命中规则',
		minWidth: 220,
		span: 2,
		formatter: (value: string[]) =>
			Array.isArray(value) && value.length ? value.join(' / ') : '-'
	},
	{ prop: 'assignedAssetNo', label: '已配发资产编号', minWidth: 180 },
	{ prop: 'assignedAt', label: '配发时间', minWidth: 160 },
	{ prop: 'cancelReason', label: '取消原因', minWidth: 220, span: 2 }
];

const filters = [
	{
		prop: 'status',
		label: '状态',
		type: 'select',
		options: enumOptions(assignmentRequestStatusTagMap)
	},
	{
		prop: 'requestLevel',
		label: '层级',
		type: 'select',
		options: enumOptions(assignmentRequestLevelTagMap)
	},
	{
		prop: 'requestType',
		label: '类型',
		type: 'select',
		options: enumOptions(assignmentRequestTypeTagMap)
	}
];

const departmentOptions = ref<CrudSelectOption[]>([]);

const formFields = computed(() => [
	{
		prop: 'requestType',
		label: '申请类型',
		type: 'select',
		options: enumOptions(assignmentRequestTypeTagMap)
	},
	{ prop: 'assetCategory', label: '资产分类', type: 'text' },
	{ prop: 'assetModelRequest', label: '型号需求', type: 'text' },
	{ prop: 'quantity', label: '数量', type: 'number', min: 1 },
	{ prop: 'unitPriceEstimate', label: '预估单价', type: 'number', min: 0, precision: 2 },
	{ prop: 'expectedUseStartDate', label: '预期使用日期', type: 'date' },
	{
		prop: 'targetDepartmentId',
		label: '目标部门',
		type: 'select',
		options: departmentOptions.value
	},
	{ prop: 'originalAssetId', label: '原资产ID', type: 'number', min: 0 },
	{ prop: 'originalAssignmentId', label: '原领用记录ID', type: 'number', min: 0 },
	{ prop: 'usageReason', label: '用途说明', type: 'textarea', span: 24 },
	{ prop: 'exceptionReason', label: '异常原因', type: 'textarea', span: 24 }
]);

const rowActions: CrudRowAction<AssetAssignmentRequestRecord>[] = [
	{
		key: 'submit',
		label: '提交',
		permission: PERMISSIONS.performance.assetAssignmentRequest.submit,
		visible: row => row.status === 'draft',
		confirmText: () => '确认提交当前申请吗？',
		handler: row =>
			performanceAssetAssignmentRequestService.submitRequest({
				id: row.id!
			}),
		successMessage: '已提交'
	},
	{
		key: 'withdraw',
		label: '撤回',
		permission: PERMISSIONS.performance.assetAssignmentRequest.withdraw,
		visible: row => row.status === 'inApproval',
		confirmText: () => '确认撤回当前申请吗？',
		handler: row =>
			performanceAssetAssignmentRequestService.withdrawRequest({
				id: row.id!
			}),
		successMessage: '已撤回'
	}
];

function createFilters() {
	return {
		status: '',
		requestLevel: '',
		requestType: ''
	};
}

function fetchInfo(payload: { id: number }) {
	return performanceAssetAssignmentRequestService.fetchInfo(payload.id);
}

function canEditDraft(row: AssetAssignmentRequestRecord) {
	return row?.status === 'draft';
}

onMounted(async () => {
	const departments = await loadAssetDepartmentOptions(notifyLookupError);
	departmentOptions.value = toSelectOptions<DepartmentOption>(departments);
});

const notifyLookupError = createElementLookupWarningHandler('申请基础选项加载失败');
</script>
