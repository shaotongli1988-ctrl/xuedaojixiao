<!-- 文件职责：承接主题10合同管理的列表、详情、新增、编辑和 draft 删除主链；不负责附件全文、PDF 预览、签名轨迹、审批历史或菜单联调；依赖 contract service、基础用户/部门接口与既有权限工具；维护重点是页面字段、状态按钮和敏感信息边界必须与冻结包一致。 -->
<template>
	<div v-if="canAccess" class="contract-page">
		<el-card shadow="never">
			<div class="contract-page__toolbar">
				<div class="contract-page__toolbar-left">
					<el-select
						v-model="filterEmployeeIdModel"
						placeholder="员工"
						clearable
						filterable
						style="width: 220px"
					>
						<el-option
							v-for="item in userOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
					<el-select
						v-model="filters.type"
						placeholder="合同类型"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in typeOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
					<el-select
						v-model="filters.status"
						placeholder="状态"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in filterStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
					<el-input
						v-model="filters.keyword"
						placeholder="标题 / 合同编号"
						clearable
						style="width: 240px"
						@keyup.enter="handleSearch"
					/>
				</div>

				<div class="contract-page__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新建合同
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="contract-page__header">
					<div class="contract-page__header-main">
						<h2>合同管理</h2>
						<el-tag effect="plain">主题 10</el-tag>
					</div>
					<el-alert
						title="首批只维护合同台账摘要，不展示附件全文、PDF 预览、签名图片、签署轨迹或审批历史。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column label="员工" min-width="140">
					<template #default="{ row }">
						{{ row.employeeName || employeeLabel(row.employeeId) }}
					</template>
				</el-table-column>
				<el-table-column label="合同类型" min-width="120">
					<template #default="{ row }">
						{{ typeLabel(row.type) }}
					</template>
				</el-table-column>
				<el-table-column prop="title" label="合同标题" min-width="180">
					<template #default="{ row }">
						{{ row.title || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="contractNumber" label="合同编号" min-width="150">
					<template #default="{ row }">
						{{ row.contractNumber || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="部门" min-width="140">
					<template #default="{ row }">
						{{ row.departmentName || departmentLabel(row.departmentId) }}
					</template>
				</el-table-column>
				<el-table-column prop="position" label="岗位" min-width="140">
					<template #default="{ row }">
						{{ row.position || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="合同周期" min-width="220">
					<template #default="{ row }">
						{{ formatDateRange(row.startDate, row.endDate) }}
					</template>
				</el-table-column>
				<el-table-column label="薪资" min-width="120">
					<template #default="{ row }">
						{{ formatMoney(row.salary) }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="220">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)">详情</el-button>
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
					</template>
				</el-table-column>
			</el-table>

			<div class="contract-page__pagination">
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
			v-model="detailVisible"
			title="合同详情"
			width="860px"
			destroy-on-close
		>
			<div v-if="detailContract" class="contract-page__detail">
				<el-alert
					v-if="detailContract.status !== 'draft'"
					:title="detailReadonlyMessage(detailContract.status)"
					type="warning"
					:closable="false"
					show-icon
				/>
				<el-descriptions :column="2" border>
					<el-descriptions-item label="员工">
						{{ detailContract.employeeName || employeeLabel(detailContract.employeeId) }}
					</el-descriptions-item>
					<el-descriptions-item label="合同类型">
						{{ typeLabel(detailContract.type) }}
					</el-descriptions-item>
					<el-descriptions-item label="合同标题">
						{{ detailContract.title || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="合同编号">
						{{ detailContract.contractNumber || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="开始日期">
						{{ detailContract.startDate || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="结束日期">
						{{ detailContract.endDate || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="试用期（月）">
						{{ formatInteger(detailContract.probationPeriod) }}
					</el-descriptions-item>
					<el-descriptions-item label="薪资">
						{{ formatMoney(detailContract.salary) }}
					</el-descriptions-item>
					<el-descriptions-item label="岗位">
						{{ detailContract.position || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="部门">
						{{ detailContract.departmentName || departmentLabel(detailContract.departmentId) }}
					</el-descriptions-item>
					<el-descriptions-item label="状态">
						<el-tag :type="statusTagType(detailContract.status)">
							{{ statusLabel(detailContract.status) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="创建时间">
						{{ detailContract.createTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间">
						{{ detailContract.updateTime || '-' }}
					</el-descriptions-item>
				</el-descriptions>
			</div>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingContract?.id ? '编辑合同' : '新建合同'"
			width="860px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
				<el-alert
					:title="editingContract?.id ? '仅 draft 合同可编辑；编辑时可保持 draft 或转为 active。' : '新建保存后默认进入 draft 状态。'"
					:type="editingContract?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="员工" prop="employeeId">
							<el-select
								v-model="formEmployeeIdModel"
								placeholder="请选择员工"
								filterable
								style="width: 100%"
								@change="handleEmployeeChange"
							>
								<el-option
									v-for="item in userOptions"
									:key="item.id"
									:label="item.name"
									:value="item.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="合同类型" prop="type">
							<el-select
								v-model="form.type"
								placeholder="请选择合同类型"
								style="width: 100%"
							>
								<el-option
									v-for="item in typeOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="合同标题" prop="title">
							<el-input
								v-model="form.title"
								maxlength="200"
								show-word-limit
								placeholder="可选，最长 200 字"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="合同编号" prop="contractNumber">
							<el-input
								v-model="form.contractNumber"
								maxlength="50"
								show-word-limit
								placeholder="可选，最长 50 字"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="开始日期" prop="startDate">
							<el-date-picker
								v-model="form.startDate"
								type="date"
								value-format="YYYY-MM-DD"
								placeholder="请选择开始日期"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="结束日期" prop="endDate">
							<el-date-picker
								v-model="form.endDate"
								type="date"
								value-format="YYYY-MM-DD"
								placeholder="请选择结束日期"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="试用期（月）" prop="probationPeriod">
							<el-input-number
								v-model="probationPeriodModel"
								:controls="false"
								:precision="0"
								:step="1"
								step-strictly
								placeholder="可选"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="薪资" prop="salary">
							<el-input-number
								v-model="salaryModel"
								:controls="false"
								:precision="2"
								:step="100"
								placeholder="可选"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="岗位" prop="position">
							<el-input
								v-model="form.position"
								maxlength="100"
								show-word-limit
								placeholder="可选，最长 100 字"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="部门">
							<el-select
								v-model="formDepartmentIdModel"
								placeholder="可选"
								clearable
								filterable
								style="width: 100%"
							>
								<el-option
									v-for="item in departmentOptions"
									:key="item.id"
									:label="item.label"
									:value="item.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col v-if="editingContract?.id" :span="12">
						<el-form-item label="状态" prop="status">
							<el-select v-model="form.status" style="width: 100%">
								<el-option
									v-for="item in editableStatusOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

			<template #footer>
				<div class="contract-page__dialog-footer">
					<el-button @click="formVisible = false">取消</el-button>
					<el-button type="primary" :loading="submitLoading" @click="submitForm">
						保存
					</el-button>
				</div>
			</template>
		</el-dialog>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-contract'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { service } from '/@/cool';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceContractService } from '../../service/contract';
import {
	loadDepartmentOptions,
	loadUserOptions
} from '../../utils/lookup-options.js';
import {
	confirmElementAction,
	runTrackedElementAction
} from '../shared/action-feedback';
import {
	createElementWarningFromErrorHandler,
	resolveErrorMessage,
	showElementErrorFromError
} from '../shared/error-message';
import {
	type DepartmentOption,
	type ContractRecord,
	type ContractStatus,
	type ContractType,
	type UserOption,
	createEmptyContract
} from '../../types';
import type { ContractSaveRequest } from '../../types';

const CONTRACT_TYPE_DICT_KEY = 'performance.contract.type';
const CONTRACT_STATUS_DICT_KEY = 'performance.contract.status';

const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const { dict } = useDict();
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingContract = ref<ContractRecord | null>(null);
const detailContract = ref<ContractRecord | null>(null);
const formRef = ref<FormInstance>();

const contractList = useListPage({
	createFilters: () => ({
		employeeId: undefined,
		type: '',
		status: '',
		keyword: ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: params =>
		performanceContractService.fetchPage({
			page: params.page,
			size: params.size,
			employeeId: params.employeeId || undefined,
			type: params.type || undefined,
			status: params.status || undefined,
			keyword: params.keyword || undefined
		}),
	onError: (error: unknown) => {
		showElementErrorFromError(error, '合同列表加载失败');
	}
});
const rows = contractList.rows;
const tableLoading = contractList.loading;
const filters = contractList.filters;
const pagination = contractList.pager;

const form = reactive<ContractRecord>(createEmptyContract());

const rules: FormRules = {
	employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
	type: [{ required: true, message: '请选择合同类型', trigger: 'change' }],
	title: [{ max: 200, message: '合同标题长度不能超过 200', trigger: 'blur' }],
	contractNumber: [{ max: 50, message: '合同编号长度不能超过 50', trigger: 'blur' }],
	startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
	endDate: [
		{ required: true, message: '请选择结束日期', trigger: 'change' },
		{
			validator: (_rule, value, callback) => {
				if (!value || !form.startDate) {
					callback();
					return;
				}

				if (value <= form.startDate) {
					callback(new Error('结束日期必须晚于开始日期'));
					return;
				}

				callback();
			},
			trigger: 'change'
		}
	],
	position: [{ max: 100, message: '岗位长度不能超过 100', trigger: 'blur' }],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }],
	probationPeriod: [
		{
			validator: (_rule, value, callback) => {
				if (value == null || value === '') {
					callback();
					return;
				}

				if (!Number.isInteger(Number(value))) {
					callback(new Error('试用期必须为整数'));
					return;
				}

				callback();
			},
			trigger: 'change'
		}
	]
};

const typeOptions = computed<Array<{ label: string; value: ContractType }>>(() =>
	dict.get(CONTRACT_TYPE_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as ContractType
	}))
);

const filterStatusOptions = computed<Array<{ label: string; value: ContractStatus }>>(() =>
	dict.get(CONTRACT_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as ContractStatus
	}))
);

const editableStatusOptions = computed<Array<{ label: string; value: ContractStatus }>>(() =>
	filterStatusOptions.value.filter(item => item.value === 'draft' || item.value === 'active')
);

const canAccess = computed(() => checkPerm(performanceContractService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceContractService.permission.info));
const showAddButton = computed(() => checkPerm(performanceContractService.permission.add));
const filterEmployeeIdModel = computed<number | undefined>({
	get: () => filters.employeeId ?? undefined,
	set: value => {
		filters.employeeId = value;
	}
});
const formEmployeeIdModel = computed<number | undefined>({
	get: () => form.employeeId ?? undefined,
	set: value => {
		form.employeeId = value;
	}
});
const formDepartmentIdModel = computed<number | undefined>({
	get: () => form.departmentId ?? undefined,
	set: value => {
		form.departmentId = value;
	}
});
const probationPeriodModel = computed<number | undefined>({
	get: () => form.probationPeriod ?? undefined,
	set: value => {
		form.probationPeriod = value ?? null;
	}
});
const salaryModel = computed<number | undefined>({
	get: () => form.salary ?? undefined,
	set: value => {
		form.salary = value ?? null;
	}
});

onMounted(async () => {
	await dict.refresh([CONTRACT_TYPE_DICT_KEY, CONTRACT_STATUS_DICT_KEY]);
	await Promise.all([loadUsers(), loadDepartments()]);
	await refresh();
});

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 500
			}),
		createElementWarningFromErrorHandler('员工选项加载失败')
	);
}

async function loadDepartments() {
	departmentOptions.value = await loadDepartmentOptions(
		() => service.base.sys.department.list(),
		createElementWarningFromErrorHandler('部门选项加载失败')
	);
}

async function refresh() {
	await contractList.reload();
}

function handleSearch() {
	void contractList.search();
}

function handleReset() {
	void contractList.reset();
}

function changePage(page: number) {
	void contractList.goToPage(page);
}

function openCreate() {
	Object.assign(form, createEmptyContract());
	editingContract.value = null;
	formVisible.value = true;
}

async function openEdit(row: ContractRecord) {
	if (!canEdit(row)) {
		ElMessage.warning(detailReadonlyMessage(row.status));
		return;
	}

	await loadDetail(row.id!, record => {
		if (record.status !== 'draft') {
			ElMessage.warning(detailReadonlyMessage(record.status));
			return;
		}

		editingContract.value = record;
		Object.assign(form, createEmptyContract(), {
			...record,
			employeeId: record.employeeId ?? undefined,
			departmentId: record.departmentId ?? undefined,
			probationPeriod: record.probationPeriod ?? null,
			salary: record.salary ?? null,
			status: record.status || 'draft'
		});
		formVisible.value = true;
	});
}

async function openDetail(row: ContractRecord) {
	await loadDetail(row.id!, record => {
		detailContract.value = record;
		detailVisible.value = true;
	});
}

async function loadDetail(id: number, next: (record: ContractRecord) => void) {
	try {
		const record = await performanceContractService.fetchInfo({ id });
		next(record);
	} catch (error: unknown) {
		showElementErrorFromError(error, '合同详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();

	if (!typeOptions.value.some(item => item.value === form.type)) {
		ElMessage.error('合同类型不合法');
		return;
	}

	if (!isAllowedStatus(form.status)) {
		ElMessage.error('合同状态不合法');
		return;
	}

	if (form.endDate <= form.startDate) {
		ElMessage.error('结束日期必须晚于开始日期');
		return;
	}

	if (form.probationPeriod != null && !Number.isInteger(Number(form.probationPeriod))) {
		ElMessage.error('试用期必须为整数');
		return;
	}

	if (editingContract.value?.id && editingContract.value.status !== 'draft') {
		ElMessage.error('仅 draft 合同允许编辑');
		return;
	}

	submitLoading.value = true;

	try {
		const payload: ContractSaveRequest = {
			id: editingContract.value?.id,
			employeeId: Number(form.employeeId),
			type: form.type,
			title: form.title?.trim() || undefined,
			contractNumber: form.contractNumber?.trim() || undefined,
			startDate: form.startDate,
			endDate: form.endDate,
			probationPeriod: form.probationPeriod == null ? undefined : Number(form.probationPeriod),
			salary: form.salary == null ? undefined : Number(form.salary),
			position: form.position?.trim() || undefined,
			departmentId: form.departmentId || undefined,
			status: editingContract.value?.id ? form.status : 'draft'
		};

		if (editingContract.value?.id) {
			await performanceContractService.updateContract(payload as ContractSaveRequest & { id: number });
		} else {
			await performanceContractService.createContract(payload);
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: ContractRecord) {
	const confirmed = await confirmElementAction(
		`确认删除合同「${row.title || row.contractNumber || row.id}」吗？`,
		'删除确认'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: Number(row.id || 0),
		actionType: 'delete',
		request: () =>
			performanceContractService.removeContract({
				ids: [row.id!]
			}),
		successMessage: '删除成功',
		errorMessage: '删除失败',
		refresh
	});
}

function handleEmployeeChange(value?: number) {
	if (!value) {
		return;
	}

	const selected = userOptions.value.find(item => item.id === Number(value));

	if (!selected?.departmentId) {
		return;
	}

	form.departmentId = selected.departmentId;
}

function canEdit(row: ContractRecord) {
	return checkPerm(performanceContractService.permission.update) && row.status === 'draft';
}

function canDelete(row: ContractRecord) {
	return checkPerm(performanceContractService.permission.delete) && row.status === 'draft';
}

function isAllowedStatus(status?: ContractStatus) {
	return filterStatusOptions.value.some(item => item.value === status);
}

function typeLabel(value?: ContractType | null) {
	return dict.getLabel(CONTRACT_TYPE_DICT_KEY, value) || value || '-';
}

function statusLabel(status?: ContractStatus | '') {
	return dict.getLabel(CONTRACT_STATUS_DICT_KEY, status) || status || '-';
}

function statusTagType(status?: ContractStatus | '') {
	return dict.getMeta(CONTRACT_STATUS_DICT_KEY, status)?.tone || 'info';
}

function detailReadonlyMessage(status?: ContractStatus) {
	switch (status) {
		case 'active':
			return '当前合同已处于生效状态，不提供编辑或删除入口。';
		case 'expired':
			return '当前合同已到期，不允许编辑或删除。';
		case 'terminated':
			return '当前合同已终止，不允许编辑或删除。';
		default:
			return '仅 draft 合同允许编辑和删除。';
	}
}

function employeeLabel(id?: number) {
	if (!id) {
		return '-';
	}

	return userOptions.value.find(item => item.id === Number(id))?.name || `员工${id}`;
}

function departmentLabel(id?: number | null) {
	if (!id) {
		return '-';
	}

	return departmentOptions.value.find(item => item.id === Number(id))?.label || `部门${id}`;
}

function formatDateRange(startDate?: string, endDate?: string) {
	if (!startDate && !endDate) {
		return '-';
	}

	return `${startDate || '-'} ~ ${endDate || '-'}`;
}

function formatMoney(value?: number | null) {
	if (value == null || value === undefined) {
		return '-';
	}

	return Number(value).toFixed(2);
}

function formatInteger(value?: number | null) {
	if (value == null || value === undefined) {
		return '-';
	}

	return `${Number(value)}`;
}

</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.management-workspace.scss' as managementWorkspace;

.contract-page {
	@include managementWorkspace.management-workspace-shell(1180px);
}
</style>
