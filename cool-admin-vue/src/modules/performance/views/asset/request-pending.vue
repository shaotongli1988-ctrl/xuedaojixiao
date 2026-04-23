<!-- 文件职责：承接 Theme20 资产管理员待配发申请页；不负责审批待办流转、员工草稿维护或正式领用结果展示；依赖 asset-assignment-request service、资产 CRUD 页面壳和资产基础选项；维护重点是配发动作只能针对 approvedPendingAssignment 请求单执行。 -->
<template>
	<AssetCrudPage
		class="asset-request-pending-page"
		title="待配发申请"
		description="资产管理员查看审批通过的领用申请，并为其配发具体资产。"
		notice="本页只处理待配发队列；审批动作继续在统一审批中心完成，配发成功后自动生成正式领用记录。"
		:page-permission="PERMISSIONS.performance.assetAssignmentRequest.page"
		:info-permission="PERMISSIONS.performance.assetAssignmentRequest.info"
		:columns="columns"
		:detail-fields="detailFields"
		:filters="filters"
		:create-filters="createFilters"
		:fetch-page="performanceAssetAssignmentRequestService.fetchPage.bind(performanceAssetAssignmentRequestService)"
		:fetch-info="fetchInfo"
		:row-actions="rowActions"
	/>

	<el-dialog
		v-model="assignDialogVisible"
		title="配发资产"
		width="560px"
		destroy-on-close
		@closed="onAssignDialogClosed"
	>
		<el-form :model="assignForm" label-width="110px">
			<el-form-item label="目标申请">
				<div>{{ assignTargetRow?.requestNo || '-' }}</div>
			</el-form-item>
			<el-form-item label="配发资产">
				<el-select
					v-model="assignForm.assetId"
					filterable
					clearable
					placeholder="请选择 available 资产"
					style="width: 100%"
				>
					<el-option
						v-for="item in availableAssetOptions"
						:key="item.id"
						:label="`${item.assetNo || ''} ${item.name}`.trim()"
						:value="item.id"
					/>
				</el-select>
			</el-form-item>
			<el-form-item label="配发日期">
				<el-date-picker
					v-model="assignForm.assignDate"
					type="date"
					value-format="YYYY-MM-DD"
					style="width: 100%"
				/>
			</el-form-item>
			<el-form-item label="用途说明">
				<el-input
					v-model="assignForm.purpose"
					type="textarea"
					:rows="3"
					placeholder="默认带入申请用途，可按实际配发补充"
				/>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="assignDialogVisible = false">取消</el-button>
			<el-button type="primary" :loading="assignSubmitting" @click="submitAssign">
				确认配发
			</el-button>
		</template>
	</el-dialog>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import AssetCrudPage from './asset-crud-page.vue';
import { performanceAssetAssignmentRequestService } from '../../service/asset-assignment-request';
import {
	createElementLookupWarningHandler,
	loadAssetOptions,
	type AssetOption
} from './lookups';
import { PERMISSIONS } from '../../../base/generated/permissions.generated';
import type { AssetAssignmentRequestRecord } from '../../types';
import {
	assignmentRequestLevelTagMap,
	assignmentRequestStatusTagMap,
	assignmentRequestTypeTagMap,
	enumOptions
} from './shared';
import type { CrudRowAction } from '../shared/crud-page-shell';
import {
	ELEMENT_ACTION_SKIPPED,
	promptElementAction
} from '../shared/action-feedback';
import { resolveErrorMessage, showElementErrorFromError } from '../shared/error-message';

const columns = [
	{ prop: 'requestNo', label: '申请编号', minWidth: 170 },
	{ prop: 'requestLevel', label: '层级', minWidth: 120, tagMap: assignmentRequestLevelTagMap },
	{ prop: 'requestType', label: '类型', minWidth: 140, tagMap: assignmentRequestTypeTagMap },
	{ prop: 'applicantName', label: '申请人', minWidth: 120 },
	{ prop: 'applicantDepartmentName', label: '申请部门', minWidth: 140 },
	{ prop: 'assetCategory', label: '资产分类', minWidth: 140 },
	{ prop: 'assetModelRequest', label: '型号需求', minWidth: 160 },
	{ prop: 'status', label: '状态', minWidth: 140, tagMap: assignmentRequestStatusTagMap }
];

const detailFields = [
	...columns,
	{ prop: 'usageReason', label: '用途说明', minWidth: 220, span: 2 },
	{ prop: 'exceptionReason', label: '异常原因', minWidth: 220, span: 2 },
	{ prop: 'assignedAssetNo', label: '已配发资产编号', minWidth: 180 },
	{ prop: 'assignedAt', label: '配发时间', minWidth: 160 },
	{ prop: 'cancelReason', label: '取消原因', minWidth: 220, span: 2 }
];

const filters = [
	{ prop: 'requestLevel', label: '层级', type: 'select', options: enumOptions(assignmentRequestLevelTagMap) },
	{ prop: 'requestType', label: '类型', type: 'select', options: enumOptions(assignmentRequestTypeTagMap) }
];

type AssignOutcome = 'idle' | 'pending' | 'resolved';
type AssignPromiseState = {
	resolve: (value: AssetAssignmentRequestRecord) => void;
	reject: (reason?: unknown) => void;
};

const assetOptions = ref<AssetOption[]>([]);
const assignDialogVisible = ref(false);
const assignSubmitting = ref(false);
const assignTargetRow = ref<AssetAssignmentRequestRecord | null>(null);
const assignOutcome = ref<AssignOutcome>('idle');
const assignPromise = ref<AssignPromiseState | null>(null);
const assignForm = reactive({
	assetId: undefined as number | undefined,
	assignDate: '',
	purpose: ''
});

const availableAssetOptions = computed(() =>
	assetOptions.value.filter(item => item.assetStatus === 'available')
);

const rowActions: CrudRowAction<AssetAssignmentRequestRecord>[] = [
	{
		key: 'assign',
		label: '配发',
		permission: PERMISSIONS.performance.assetAssignmentRequest.assign,
		visible: row => row.status === 'approvedPendingAssignment',
		handler: row => openAssignDialog(row),
		successMessage: '已配发'
	},
	{
		key: 'cancel',
		label: '取消',
		permission: PERMISSIONS.performance.assetAssignmentRequest.cancel,
		type: 'danger',
		visible: row =>
			['inApproval', 'approvedPendingAssignment', 'manualPending'].includes(row.status || ''),
		handler: async row => {
			const prompt = await promptElementAction('请输入取消原因', '取消申请', {
				confirmButtonText: '确认',
				cancelButtonText: '取消',
				inputPlaceholder: '例如：线下处理 / 需求取消'
			});
			if (!prompt) {
				return ELEMENT_ACTION_SKIPPED;
			}
			return performanceAssetAssignmentRequestService.cancelRequest({
				id: row.id!,
				reason: prompt.value
			});
		},
		successMessage: '已取消'
	}
];

function createFilters() {
	return {
		status: 'approvedPendingAssignment',
		requestLevel: '',
		requestType: '',
		pendingAssignmentOnly: true
	};
}

function fetchInfo(payload: { id: number }) {
	return performanceAssetAssignmentRequestService.fetchInfo(payload.id);
}

function openAssignDialog(row: AssetAssignmentRequestRecord) {
	if (!availableAssetOptions.value.length) {
		throw new Error('当前没有可配发的 available 资产');
	}

	assignTargetRow.value = row;
	assignForm.assetId = undefined;
	assignForm.assignDate = '';
	assignForm.purpose = row?.usageReason || '';
	assignOutcome.value = 'pending';
	assignDialogVisible.value = true;

	return new Promise((resolve, reject) => {
		assignPromise.value = { resolve, reject };
	});
}

async function submitAssign() {
	if (!assignTargetRow.value?.id || !assignForm.assetId) {
		ElMessage.warning('请选择要配发的资产');
		return;
	}

	assignSubmitting.value = true;
	try {
		const result = await performanceAssetAssignmentRequestService.assignAsset({
			id: Number(assignTargetRow.value.id),
			assetId: Number(assignForm.assetId),
			assignDate: assignForm.assignDate || undefined,
			purpose: assignForm.purpose || undefined
		});
		assignOutcome.value = 'resolved';
		assignPromise.value?.resolve(result);
		assignPromise.value = null;
		assignDialogVisible.value = false;
	} catch (error: unknown) {
		showElementErrorFromError(error, '配发失败');
	} finally {
		assignSubmitting.value = false;
	}
}

function onAssignDialogClosed() {
	if (assignOutcome.value === 'pending' && assignPromise.value) {
		assignPromise.value.reject('cancel');
	}
	assignPromise.value = null;
	assignTargetRow.value = null;
	assignOutcome.value = 'idle';
	assignForm.assetId = undefined;
	assignForm.assignDate = '';
	assignForm.purpose = '';
}

onMounted(async () => {
	assetOptions.value = await loadAssetOptions(notifyLookupError);
});

const notifyLookupError = createElementLookupWarningHandler('资产选项加载失败');
</script>
