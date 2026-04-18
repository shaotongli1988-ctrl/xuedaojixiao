<!-- 文件职责：承接主题8招聘面试管理的列表、详情、新增、编辑和删除主链；不负责招聘计划、简历池、录用管理或敏感候选人信息展示；依赖 interview service、基础用户/部门接口与既有权限工具；维护重点是字段边界、终态锁定和删除限制必须与冻结包一致。 -->
<template>
	<div v-if="canAccess" class="interview-page">
		<el-card shadow="never">
			<div class="interview-page__toolbar">
				<div class="interview-page__toolbar-left">
					<el-input
						v-model="filters.candidateName"
						placeholder="按候选人姓名筛选"
						clearable
						style="width: 200px"
					/>
					<el-input
						v-model="filters.position"
						placeholder="按职位筛选"
						clearable
						style="width: 200px"
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
					<el-date-picker
						v-model="filters.startDate"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="开始日期"
						style="width: 170px"
					/>
					<el-date-picker
						v-model="filters.endDate"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="结束日期"
						style="width: 170px"
					/>
				</div>

				<div class="interview-page__toolbar-right">
					<el-button @click="refresh">查询</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新建面试
					</el-button>
				</div>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="interview-page__stat-label">当前页记录数</div>
					<div class="interview-page__stat-value">{{ rows.length }}</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="interview-page__stat-label">待执行</div>
					<div class="interview-page__stat-value">
						{{ rows.filter(item => item.status === 'scheduled').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="interview-page__stat-label">已完成</div>
					<div class="interview-page__stat-value">
						{{ rows.filter(item => item.status === 'completed').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="interview-page__stat-label">已取消</div>
					<div class="interview-page__stat-value">
						{{ rows.filter(item => item.status === 'cancelled').length }}
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never">
			<template #header>
				<div class="interview-page__header">
					<div class="interview-page__header-main">
						<h2>招聘面试管理</h2>
						<el-tag effect="plain">主题 8</el-tag>
					</div>
					<el-alert
						title="仅展示冻结允许的面试摘要字段，不展示联系方式、简历全文或评语全文。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="candidateName" label="候选人" min-width="140" />
				<el-table-column prop="position" label="职位" min-width="160" />
				<el-table-column label="部门" min-width="140">
					<template #default="{ row }">
						{{ departmentLabel(row.departmentId) }}
					</template>
				</el-table-column>
				<el-table-column prop="interviewerName" label="面试官" min-width="140">
					<template #default="{ row }">
						{{ row.interviewerName || interviewerLabel(row.interviewerId) }}
					</template>
				</el-table-column>
				<el-table-column prop="interviewDate" label="面试时间" min-width="180" />
				<el-table-column label="类型" min-width="120">
					<template #default="{ row }">
						{{ interviewTypeLabel(row.interviewType) }}
					</template>
				</el-table-column>
				<el-table-column prop="score" label="分数摘要" width="110">
					<template #default="{ row }">
						{{ formatScore(row.score) }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="260">
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

			<div class="interview-page__pagination">
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
			title="面试详情"
			width="760px"
			destroy-on-close
		>
			<div v-if="detailInterview" class="interview-page__detail">
				<el-alert
					v-if="isTerminal(detailInterview.status)"
					:title="`当前记录已处于${statusLabel(detailInterview.status)}终态，不允许再编辑业务字段。`"
					type="warning"
					:closable="false"
					show-icon
				/>
				<el-descriptions :column="2" border>
					<el-descriptions-item label="候选人">
						{{ detailInterview.candidateName }}
					</el-descriptions-item>
					<el-descriptions-item label="职位">
						{{ detailInterview.position }}
					</el-descriptions-item>
					<el-descriptions-item label="部门">
						{{ departmentLabel(detailInterview.departmentId) }}
					</el-descriptions-item>
					<el-descriptions-item label="面试官">
						{{ detailInterview.interviewerName || interviewerLabel(detailInterview.interviewerId) }}
					</el-descriptions-item>
					<el-descriptions-item label="面试时间">
						{{ detailInterview.interviewDate || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="面试类型">
						{{ interviewTypeLabel(detailInterview.interviewType) }}
					</el-descriptions-item>
					<el-descriptions-item label="分数摘要">
						{{ formatScore(detailInterview.score) }}
					</el-descriptions-item>
					<el-descriptions-item label="状态">
						<el-tag :type="statusTagType(detailInterview.status)">
							{{ statusLabel(detailInterview.status) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="创建时间">
						{{ detailInterview.createTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间">
						{{ detailInterview.updateTime || '-' }}
					</el-descriptions-item>
				</el-descriptions>
			</div>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingInterview?.id ? '编辑面试' : '新建面试'"
			width="760px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="editingInterview?.id ? '仅 scheduled 记录可编辑；切换为已完成/已取消后将进入终态。' : '新建保存后默认进入 scheduled 状态。'"
					:type="editingInterview?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="候选人姓名" prop="candidateName">
							<el-input
								v-model="form.candidateName"
								maxlength="100"
								show-word-limit
								placeholder="请输入候选人姓名"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="职位" prop="position">
							<el-input
								v-model="form.position"
								maxlength="100"
								show-word-limit
								placeholder="请输入职位名称"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="所属部门">
								<el-select
									v-model="departmentIdModel"
									placeholder="可选"
									clearable
									filterable
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
					<el-col :span="12">
						<el-form-item label="面试官" prop="interviewerId">
							<el-select
								v-model="form.interviewerId"
								placeholder="请选择面试官"
								filterable
								clearable
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
						<el-form-item label="面试时间" prop="interviewDate">
							<el-date-picker
								v-model="form.interviewDate"
								type="datetime"
								value-format="YYYY-MM-DD HH:mm:ss"
								placeholder="请选择面试时间"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="面试类型">
								<el-select
									v-model="interviewTypeModel"
									placeholder="请选择面试类型"
									clearable
							>
								<el-option
									v-for="item in interviewTypeOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="分数摘要">
								<el-input-number
									v-model="scoreModel"
									:min="0"
									:max="100"
								:precision="2"
								:step="1"
								controls-position="right"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col v-if="editingInterview?.id" :span="12">
						<el-form-item label="状态" prop="status">
							<el-select v-model="form.status" placeholder="请选择状态">
								<el-option
									v-for="item in statusOptions"
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
				<el-button @click="formVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitForm">
					保存
				</el-button>
			</template>
		</el-dialog>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-interview'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { service } from '/@/cool';
import {
	type InterviewRecord,
	type InterviewStatus,
	type InterviewType,
	type UserOption,
	createEmptyInterview
} from '../../types';
import { performanceInterviewService } from '../../service/interview';

interface DepartmentOption {
	id: number;
	label: string;
}

const rows = ref<InterviewRecord[]>([]);
const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const tableLoading = ref(false);
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingInterview = ref<InterviewRecord | null>(null);
const detailInterview = ref<InterviewRecord | null>(null);
const formRef = ref<FormInstance>();

const filters = reactive({
	candidateName: '',
	position: '',
	status: '' as InterviewStatus | '',
	startDate: '',
	endDate: ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const form = reactive<InterviewRecord>(createEmptyInterview());

const rules: FormRules = {
	candidateName: [
		{ required: true, message: '请输入候选人姓名', trigger: 'blur' },
		{ min: 1, max: 100, message: '候选人姓名长度需在 1-100 之间', trigger: 'blur' }
	],
	position: [
		{ required: true, message: '请输入职位名称', trigger: 'blur' },
		{ min: 1, max: 100, message: '职位名称长度需在 1-100 之间', trigger: 'blur' }
	],
	interviewerId: [{ required: true, message: '请选择面试官', trigger: 'change' }],
	interviewDate: [{ required: true, message: '请选择面试时间', trigger: 'change' }],
	status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const statusOptions: Array<{ label: string; value: InterviewStatus }> = [
	{ label: '待执行', value: 'scheduled' },
	{ label: '已完成', value: 'completed' },
	{ label: '已取消', value: 'cancelled' }
];

const interviewTypeOptions: Array<{ label: string; value: InterviewType }> = [
	{ label: '技术面', value: 'technical' },
	{ label: '行为面', value: 'behavioral' },
	{ label: '经理面', value: 'manager' },
	{ label: 'HR 面', value: 'hr' }
];

const canAccess = computed(() => checkPerm(performanceInterviewService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceInterviewService.permission.info));
const showAddButton = computed(() => checkPerm(performanceInterviewService.permission.add));
const departmentIdModel = computed<number | undefined>({
	get: () => form.departmentId ?? undefined,
	set: value => {
		form.departmentId = value;
	}
});
const interviewTypeModel = computed<InterviewType | undefined>({
	get: () => form.interviewType ?? undefined,
	set: value => {
		form.interviewType = value;
	}
});
const scoreModel = computed<number | undefined>({
	get: () => form.score ?? undefined,
	set: value => {
		form.score = value;
	}
});

onMounted(async () => {
	await Promise.all([loadUsers(), loadDepartments()]);
	await refresh();
});

async function loadUsers() {
	try {
		const result = await service.base.sys.user.page({
			page: 1,
			size: 200
		});

		userOptions.value = (result.list || []).map((item: any) => ({
			id: Number(item.id),
			name: item.name,
			departmentId: item.departmentId,
			departmentName: item.departmentName
		}));
	} catch (error: any) {
		userOptions.value = [];
		ElMessage.warning(error.message || '用户选项加载失败');
	}
}

async function loadDepartments() {
	try {
		const result = await service.base.sys.department.list();
		departmentOptions.value = flattenDepartments(result || []);
	} catch (error: any) {
		departmentOptions.value = [];
		ElMessage.warning(error.message || '部门选项加载失败');
	}
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;

	try {
		const result = await performanceInterviewService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			candidateName: filters.candidateName || undefined,
			position: filters.position || undefined,
			status: filters.status || undefined,
			startDate: filters.startDate || undefined,
			endDate: filters.endDate || undefined
		});

		rows.value = result.list || [];
		pagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || '面试列表加载失败');
	} finally {
		tableLoading.value = false;
	}
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function openCreate() {
	Object.assign(form, createEmptyInterview());
	editingInterview.value = null;
	formVisible.value = true;
}

async function openEdit(row: InterviewRecord) {
	if (isTerminal(row.status)) {
		ElMessage.warning('终态记录不允许编辑');
		return;
	}

	await loadDetail(row.id!, record => {
		if (isTerminal(record.status)) {
			ElMessage.warning('终态记录不允许编辑');
			return;
		}

		editingInterview.value = record;
		Object.assign(form, createEmptyInterview(), {
			...record,
			departmentId: record.departmentId ?? undefined,
			interviewType: record.interviewType ?? undefined,
			score: record.score ?? undefined
		});
		formVisible.value = true;
	});
}

async function openDetail(row: InterviewRecord) {
	await loadDetail(row.id!, record => {
		detailInterview.value = record;
		detailVisible.value = true;
	});
}

async function loadDetail(id: number, next: (record: InterviewRecord) => void) {
	try {
		const record = await performanceInterviewService.fetchInfo({ id });
		next(record);
	} catch (error: any) {
		ElMessage.error(error.message || '面试详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();

	if (form.score != null && (Number(form.score) < 0 || Number(form.score) > 100)) {
		ElMessage.error('分数摘要必须在 0-100 之间');
		return;
	}

	if (!editingInterview.value?.id) {
		form.status = 'scheduled';
	}

	if (editingInterview.value?.id && isTerminal(editingInterview.value.status)) {
		ElMessage.error('终态记录不允许编辑');
		return;
	}

	submitLoading.value = true;

	try {
		const payload: InterviewRecord = {
			...form,
			departmentId: form.departmentId || undefined,
			interviewType: form.interviewType || undefined,
			score: form.score == null ? undefined : Number(form.score)
		};

		if (editingInterview.value?.id) {
			await performanceInterviewService.updateInterview(payload);
		} else {
			await performanceInterviewService.createInterview(payload);
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

async function handleDelete(row: InterviewRecord) {
	await ElMessageBox.confirm(
		`确认删除面试「${row.candidateName} / ${row.position}」吗？`,
		'删除确认',
		{
			type: 'warning'
		}
	);

	try {
		await performanceInterviewService.removeInterview({
			ids: [row.id!]
		});
		ElMessage.success('删除成功');
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '删除失败');
	}
}

function canEdit(row: InterviewRecord) {
	return checkPerm(performanceInterviewService.permission.update) && row.status === 'scheduled';
}

function canDelete(row: InterviewRecord) {
	return checkPerm(performanceInterviewService.permission.delete) && row.status === 'scheduled';
}

function isTerminal(status?: InterviewStatus) {
	return status === 'completed' || status === 'cancelled';
}

function statusLabel(status?: InterviewStatus | '') {
	const item = statusOptions.find(option => option.value === status);
	return item?.label || status || '-';
}

function statusTagType(status?: InterviewStatus | '') {
	switch (status) {
		case 'completed':
			return 'success';
		case 'cancelled':
			return 'danger';
		default:
			return 'warning';
	}
}

function interviewTypeLabel(value?: InterviewType | null) {
	const item = interviewTypeOptions.find(option => option.value === value);
	return item?.label || value || '-';
}

function interviewerLabel(id?: number) {
	if (!id) {
		return '-';
	}

	return userOptions.value.find(item => item.id === Number(id))?.name || `用户${id}`;
}

function departmentLabel(id?: number | null) {
	if (!id) {
		return '-';
	}

	return departmentOptions.value.find(item => item.id === Number(id))?.label || `部门${id}`;
}

function formatScore(score?: number | null) {
	if (score == null || score === undefined) {
		return '-';
	}

	return Number(score).toFixed(2);
}

function flattenDepartments(list: any[], result: DepartmentOption[] = []) {
	for (const item of list) {
		result.push({
			id: Number(item.id),
			label: item.name
		});

		if (item.children?.length) {
			flattenDepartments(item.children, result);
		}
	}

	return result;
}
</script>

<style lang="scss" scoped>
.interview-page {
	display: grid;
	gap: 16px;

	&__toolbar {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
	}

	&__toolbar-left,
	&__toolbar-right {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	&__stat-label {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	&__stat-value {
		margin-top: 8px;
		font-size: 28px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	&__header {
		display: grid;
		gap: 12px;
	}

	&__header-main {
		display: flex;
		align-items: center;
		gap: 12px;

		h2 {
			margin: 0;
			font-size: 18px;
		}
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		padding-top: 16px;
	}

	&__detail {
		display: grid;
		gap: 16px;
	}
}
</style>
