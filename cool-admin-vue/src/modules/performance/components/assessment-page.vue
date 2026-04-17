<!-- 文件职责：承接评估单三个页面的共用查询、表格、详情、表单和审批交互；不负责驾驶舱、目标、指标库等其他绩效模块逻辑；依赖 assessment service、base user store 和模块公共组件；维护重点是三视图必须共用同一套主链行为。 -->
<template>
	<div v-if="canAccess" class="assessment-page">
		<el-card shadow="never">
			<div class="assessment-page__toolbar">
				<div class="assessment-page__toolbar-left">
					<el-input
						v-model="filters.periodValue"
						placeholder="筛选周期值，例如 2026-Q2"
						clearable
						style="width: 220px"
					/>
					<el-select
						v-model="filters.status"
						placeholder="状态"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in statusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="assessment-page__toolbar-right">
					<el-button @click="refresh">查询</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						发起评估
					</el-button>
					<el-button v-if="showExportButton" @click="handleExport">导出摘要</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="assessment-page__header">
					<h2>{{ title }}</h2>
					<el-tag effect="plain">{{ modeLabel }}</el-tag>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="code" label="编号" min-width="170" />
				<el-table-column prop="employeeName" label="被考核人" min-width="120" />
				<el-table-column prop="assessorName" label="评估负责人" min-width="120" />
				<el-table-column prop="departmentName" label="部门" min-width="120" />
				<el-table-column prop="periodValue" label="周期" min-width="120" />
				<el-table-column prop="targetCompletion" label="目标完成率" min-width="120">
					<template #default="{ row }">
						{{ Number(row.targetCompletion || 0).toFixed(2) }}%
					</template>
				</el-table-column>
				<el-table-column prop="totalScore" label="总分" min-width="100">
					<template #default="{ row }">
						{{ Number(row.totalScore || 0).toFixed(2) }}
					</template>
				</el-table-column>
				<el-table-column prop="grade" label="等级" width="80" />
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="260">
					<template #default="{ row }">
						<el-button text @click="openDetail(row)">详情</el-button>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button
							v-if="canDelete(row)"
							text
							type="danger"
							@click="handleDelete(row)"
						>
							删除
						</el-button>
						<el-button
							v-if="canSubmit(row)"
							text
							type="success"
							@click="handleSubmit(row)"
						>
							提交
						</el-button>
						<el-button
							v-if="canReview(row)"
							text
							type="warning"
							@click="openApproval(row)"
						>
							审批
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="assessment-page__pagination">
				<el-pagination
					background
					layout="total, prev, pager, next"
					:current-page="pagination.page"
					:page-size="pagination.size"
					:total="pagination.total"
					@current-change="changePage"
				/>
			</div>
		</el-card>

		<el-dialog
			v-model="formVisible"
			:title="editingRecord?.id ? '编辑评估单' : '发起评估单'"
			width="980px"
			destroy-on-close
		>
			<assessment-form
				:model-value="editingRecord"
				:mode="mode"
				:users="userOptions"
				:loading="submitLoading"
				@submit="submitForm"
				@cancel="formVisible = false"
			/>
		</el-dialog>

		<el-dialog v-model="detailVisible" title="评估单详情" width="920px" destroy-on-close>
			<assessment-detail :assessment="detailRecord" />
		</el-dialog>

		<approval-drawer
			v-model="approvalVisible"
			:assessment="detailRecord"
			:loading="submitLoading"
			:can-approve="canApproveReview"
			:can-reject="canRejectReview"
			@approve="handleApprove"
			@reject="handleReject"
		/>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { service } from '/@/cool';
import { useBase } from '/$/base';
import { export_json_to_excel } from '/@/plugins/excel/utils';
import AssessmentForm from './assessment-form.vue';
import AssessmentDetail from './assessment-detail.vue';
import ApprovalDrawer from './approval-drawer.vue';
import {
	type AssessmentMode,
	type AssessmentRecord,
	type UserOption,
	createEmptyAssessment
} from '../types';
import { performanceAssessmentService } from '../service/assessment';

const props = defineProps<{
	title: string;
	mode: AssessmentMode;
}>();

const { user } = useBase();

const rows = ref<AssessmentRecord[]>([]);
const tableLoading = ref(false);
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const approvalVisible = ref(false);
const editingRecord = ref<AssessmentRecord | null>(null);
const detailRecord = ref<AssessmentRecord | null>(null);
const userOptions = ref<UserOption[]>([]);

const filters = reactive({
	periodValue: '',
	status: ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const statusOptions = [
	{ label: '草稿', value: 'draft' },
	{ label: '已提交', value: 'submitted' },
	{ label: '已通过', value: 'approved' },
	{ label: '已驳回', value: 'rejected' }
];

const canAccess = computed(() => {
	if (props.mode === 'my') {
		return checkPerm(performanceAssessmentService.permission.myPage);
	}

	if (props.mode === 'pending') {
		return checkPerm(performanceAssessmentService.permission.pendingPage);
	}

	return checkPerm(performanceAssessmentService.permission.page);
});

const showAddButton = computed(() => {
	return props.mode === 'initiated' && checkPerm(performanceAssessmentService.permission.add);
});

const showExportButton = computed(() => {
	return props.mode === 'initiated' && checkPerm(performanceAssessmentService.permission.export);
});
const canApproveReview = computed(() =>
	checkPerm(performanceAssessmentService.permission.approve)
);
const canRejectReview = computed(() =>
	checkPerm(performanceAssessmentService.permission.reject)
);

const modeLabel = computed(() => {
	switch (props.mode) {
		case 'my':
			return '我的考核';
		case 'pending':
			return '待我审批';
		default:
			return '已发起考核';
	}
});

onMounted(async () => {
	if (props.mode === 'initiated') {
		await loadUsers();
	}

	await refresh();
});

async function loadUsers() {
	try {
		const result = await service.base.sys.user.page({
			page: 1,
			size: 200
		});

		userOptions.value = (result.list || []).map((item: any) => {
			return {
				id: Number(item.id),
				name: item.name,
				departmentId: item.departmentId,
				departmentName: item.departmentName
			};
		});
	} catch (error: any) {
		ElMessage.warning(error.message || '用户选项加载失败');
	}
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;

	try {
		const result = await performanceAssessmentService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			mode: props.mode,
			periodValue: filters.periodValue || undefined,
			status: filters.status || undefined
		});

		rows.value = result.list || [];
		pagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || '评估单列表加载失败');
	} finally {
		tableLoading.value = false;
	}
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function openCreate() {
	const currentUser = user.info;

	editingRecord.value = {
		...createEmptyAssessment(),
		assessorId: currentUser?.id || undefined,
		assessorName: currentUser?.name || ''
	};
	formVisible.value = true;
}

async function openEdit(row: AssessmentRecord) {
	await loadDetail(row.id!, record => {
		editingRecord.value = record;
		formVisible.value = true;
	});
}

async function openDetail(row: AssessmentRecord) {
	await loadDetail(row.id!, record => {
		detailRecord.value = record;
		detailVisible.value = true;
	});
}

async function openApproval(row: AssessmentRecord) {
	await loadDetail(row.id!, record => {
		detailRecord.value = record;
		approvalVisible.value = true;
	});
}

async function loadDetail(id: number, next: (record: AssessmentRecord) => void) {
	try {
		const record = await performanceAssessmentService.fetchInfo({ id });
		next(record);
	} catch (error: any) {
		ElMessage.error(error.message || '评估单详情加载失败');
	}
}

async function submitForm(record: AssessmentRecord) {
	submitLoading.value = true;

	try {
		if (record.id) {
			await performanceAssessmentService.updateAssessment(record);
		} else {
			await performanceAssessmentService.createAssessment(record);
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: AssessmentRecord) {
	await ElMessageBox.confirm(`确认删除评估单 ${row.code} 吗？`, '删除确认', {
		type: 'warning'
	});

	try {
		await performanceAssessmentService.removeAssessment({
			ids: [row.id!]
		});
		ElMessage.success('删除成功');
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '删除失败');
	}
}

async function handleSubmit(row: AssessmentRecord) {
	await ElMessageBox.confirm(`确认提交评估单 ${row.code} 吗？`, '提交确认', {
		type: 'warning'
	});

	try {
		await performanceAssessmentService.submit({ id: row.id! });
		ElMessage.success('提交成功');
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '提交失败');
	}
}

async function handleApprove(comment: string) {
	if (!detailRecord.value?.id) {
		return;
	}

	await handleReview('approve', comment);
}

async function handleReject(comment: string) {
	if (!detailRecord.value?.id) {
		return;
	}

	await handleReview('reject', comment);
}

async function handleReview(action: 'approve' | 'reject', comment: string) {
	submitLoading.value = true;

	try {
		await performanceAssessmentService[action]({
			id: detailRecord.value!.id!,
			comment
		});
		ElMessage.success(action === 'approve' ? '审批通过成功' : '审批驳回成功');
		approvalVisible.value = false;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '审批失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleExport() {
	try {
		const rows = await performanceAssessmentService.exportSummary({
			periodValue: filters.periodValue || undefined,
			status: filters.status || undefined
		});

		export_json_to_excel({
			header: [
				'编号',
				'被考核人',
				'部门',
				'周期类型',
				'周期值',
				'评估负责人',
				'状态',
				'目标完成率',
				'总分',
				'等级',
				'提交时间',
				'审批时间'
			],
			data: (rows || []).map((item: any) => [
				item.code,
				item.employeeName,
				item.departmentName,
				item.periodType,
				item.periodValue,
				item.assessorName,
				statusLabel(item.status),
				item.targetCompletion,
				item.totalScore,
				item.grade,
				item.submitTime,
				item.approveTime
			]),
			filename: `assessment-${Date.now()}`
		});
	} catch (error: any) {
		ElMessage.error(error.message || '导出失败');
	}
}

function canEdit(row: AssessmentRecord) {
	if (props.mode === 'my') {
		return (
			checkPerm(performanceAssessmentService.permission.update) &&
			['draft', 'rejected'].includes(row.status || '')
		);
	}

	return (
		props.mode === 'initiated' &&
		checkPerm(performanceAssessmentService.permission.update) &&
		row.status === 'draft'
	);
}

function canDelete(row: AssessmentRecord) {
	return (
		props.mode === 'initiated' &&
		checkPerm(performanceAssessmentService.permission.delete) &&
		row.status === 'draft'
	);
}

function canSubmit(row: AssessmentRecord) {
	return (
		props.mode === 'my' &&
		checkPerm(performanceAssessmentService.permission.submit) &&
		row.status === 'draft'
	);
}

function canReview(row: AssessmentRecord) {
	return (
		props.mode === 'pending' &&
		(canApproveReview.value || canRejectReview.value) &&
		row.status === 'submitted'
	);
}

function statusLabel(status?: string) {
	const item = statusOptions.find(option => option.value === status);
	return item?.label || status || '-';
}

function statusTagType(status?: string) {
	switch (status) {
		case 'submitted':
			return 'warning';
		case 'approved':
			return 'success';
		case 'rejected':
			return 'danger';
		default:
			return 'info';
	}
}
</script>

<style lang="scss" scoped>
.assessment-page {
	display: grid;
	gap: 16px;

	&__toolbar,
	&__header,
	&__pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	&__toolbar-left,
	&__toolbar-right {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	&__header h2 {
		margin: 0;
		font-size: 18px;
	}

	&__pagination {
		padding-top: 16px;
	}
}
</style>
