<!-- 文件职责：承接目标地图模块的筛选、列表、统计、新增编辑和进度更新主链；不负责驾驶舱聚合、指标库配置和其他绩效子模块能力；依赖 goal service、base user store、导出工具和进度抽屉组件；维护重点是页面按钮和数据范围必须与后端权限口径保持一致。 -->
<template>
	<div v-if="canAccess" class="goal-page">
		<el-card shadow="never">
			<div class="goal-page__toolbar">
				<div class="goal-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="按目标标题筛选"
						clearable
						style="width: 220px"
					/>
					<el-select
						v-model="filters.employeeId"
						placeholder="员工"
						clearable
						filterable
						style="width: 180px"
					>
						<el-option
							v-for="item in userOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
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
						placeholder="开始日期下限"
						style="width: 170px"
					/>
					<el-date-picker
						v-model="filters.endDate"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="结束日期上限"
						style="width: 170px"
					/>
				</div>

				<div class="goal-page__toolbar-right">
					<el-button @click="refresh">查询</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新建目标
					</el-button>
					<el-button v-if="showExportButton" @click="handleExport">导出摘要</el-button>
				</div>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="goal-page__stat-label">当前页目标数</div>
					<div class="goal-page__stat-value">{{ rows.length }}</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="goal-page__stat-label">已完成</div>
					<div class="goal-page__stat-value">
						{{ rows.filter(item => item.status === 'completed').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="goal-page__stat-label">进行中</div>
					<div class="goal-page__stat-value">
						{{ rows.filter(item => item.status === 'in-progress').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="goal-page__stat-label">平均进度</div>
					<div class="goal-page__stat-value">{{ averageProgress }}%</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never">
			<template #header>
				<div class="goal-page__header">
					<h2>目标地图</h2>
					<el-tag effect="plain">模块 2</el-tag>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="employeeName" label="员工" min-width="120" />
				<el-table-column prop="departmentName" label="部门" min-width="120" />
				<el-table-column prop="title" label="目标标题" min-width="200" />
				<el-table-column label="时间范围" min-width="200">
					<template #default="{ row }">
						{{ row.startDate }} ~ {{ row.endDate }}
					</template>
				</el-table-column>
				<el-table-column prop="targetValue" label="目标值" min-width="120">
					<template #default="{ row }">
						{{ Number(row.targetValue || 0).toFixed(2) }}
					</template>
				</el-table-column>
				<el-table-column prop="currentValue" label="当前值" min-width="120">
					<template #default="{ row }">
						{{ Number(row.currentValue || 0).toFixed(2) }}
					</template>
				</el-table-column>
				<el-table-column prop="progressRate" label="完成进度" min-width="160">
					<template #default="{ row }">
						<div class="goal-page__progress-cell">
							<el-progress
								:percentage="Number(row.progressRate || 0)"
								:stroke-width="8"
								:show-text="false"
							/>
							<span>{{ Number(row.progressRate || 0).toFixed(2) }}%</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="300">
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
							v-if="canProgressUpdate(row)"
							text
							type="success"
							@click="openProgress(row)"
						>
							更新进度
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="goal-page__pagination">
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
			:title="editingGoal?.id ? '编辑目标' : '新建目标'"
			width="820px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="所属员工" prop="employeeId">
							<el-select
								v-model="form.employeeId"
								placeholder="请选择员工"
								filterable
								clearable
								@change="syncDepartment"
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
						<el-form-item label="所属部门">
							<el-input v-model="departmentName" disabled />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="目标标题" prop="title">
							<el-input v-model="form.title" placeholder="请输入目标标题" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="单位">
							<el-input v-model="form.unit" placeholder="例如：单、次、%" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="目标值" prop="targetValue">
							<el-input-number
								v-model="form.targetValue"
								:min="0.01"
								:precision="2"
								:step="1"
								controls-position="right"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="当前值">
							<el-input-number
								v-model="form.currentValue"
								:min="0"
								:precision="2"
								:step="1"
								controls-position="right"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="权重">
							<el-input-number
								v-model="form.weight"
								:min="0"
								:max="100"
								:precision="2"
								:step="1"
								controls-position="right"
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
				</el-row>

				<el-form-item label="目标说明">
					<el-input
						v-model="form.description"
						type="textarea"
						:rows="4"
						placeholder="请输入目标说明"
					/>
				</el-form-item>
			</el-form>

			<template #footer>
				<el-button @click="formVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitForm">
					保存
				</el-button>
			</template>
		</el-dialog>

		<goal-progress-drawer
			v-model="detailVisible"
			:goal="detailGoal"
			:loading="submitLoading"
			:can-update="detailCanUpdate"
			@submit="submitProgress"
		/>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-goals'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { exportJsonToExcel } from '/@/plugins/excel/utils';
import { service } from '/@/cool';
import { useBase } from '/$/base';
import GoalProgressDrawer from '../../components/goal-progress-drawer.vue';
import {
	type GoalRecord,
	type UserOption,
	createEmptyGoal
} from '../../types';
import { performanceGoalService } from '../../service/goal';
import { loadUserOptions } from '../../utils/lookup-options.js';

const { user } = useBase();

const rows = ref<GoalRecord[]>([]);
const userOptions = ref<UserOption[]>([]);
const tableLoading = ref(false);
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingGoal = ref<GoalRecord | null>(null);
const detailGoal = ref<GoalRecord | null>(null);
const formRef = ref<FormInstance>();

const filters = reactive({
	keyword: '',
	employeeId: undefined as number | undefined,
	status: '',
	startDate: '',
	endDate: ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const form = reactive<GoalRecord>(createEmptyGoal());

const rules = {
	employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
	title: [{ required: true, message: '请输入目标标题', trigger: 'blur' }],
	targetValue: [{ required: true, message: '请输入目标值', trigger: 'change' }],
	startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
	endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
};

const statusOptions = [
	{ label: '草稿', value: 'draft' },
	{ label: '进行中', value: 'in-progress' },
	{ label: '已完成', value: 'completed' },
	{ label: '已取消', value: 'cancelled' }
];

const canAccess = computed(() => checkPerm(performanceGoalService.permission.page));
const showAddButton = computed(() => checkPerm(performanceGoalService.permission.add));
const showExportButton = computed(() => checkPerm(performanceGoalService.permission.export));
const departmentName = computed(() => {
	const current = userOptions.value.find(item => item.id === form.employeeId);
	return current?.departmentName || form.departmentName || '';
});
const averageProgress = computed(() => {
	if (!rows.value.length) {
		return '0.00';
	}

	const total = rows.value.reduce((sum, item) => sum + Number(item.progressRate || 0), 0);
	return (total / rows.value.length).toFixed(2);
});
const detailCanUpdate = computed(() => {
	if (!detailGoal.value) {
		return false;
	}

	return canProgressUpdate(detailGoal.value);
});

onMounted(async () => {
	await loadUsers();
	await refresh();
});

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
			page: 1,
			size: 200
			}),
		(error: any) => {
			ElMessage.warning(error.message || '用户选项加载失败');
		}
	);
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;

	try {
		const result = await performanceGoalService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			keyword: filters.keyword || undefined,
			employeeId: filters.employeeId,
			status: filters.status || undefined,
			startDate: filters.startDate || undefined,
			endDate: filters.endDate || undefined
		});

		rows.value = result.list || [];
		pagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || '目标列表加载失败');
	} finally {
		tableLoading.value = false;
	}
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function syncDepartment(value?: number) {
	const current = userOptions.value.find(item => item.id === Number(value || form.employeeId));
	form.departmentId = current?.departmentId || undefined;
	form.departmentName = current?.departmentName || '';
}

function openCreate() {
	Object.assign(form, createEmptyGoal());
	editingGoal.value = null;
	formVisible.value = true;
}

async function openEdit(row: GoalRecord) {
	await loadDetail(row.id!, record => {
		editingGoal.value = record;
		Object.assign(form, {
			...createEmptyGoal(),
			...record
		});
		formVisible.value = true;
	});
}

async function openDetail(row: GoalRecord) {
	await loadDetail(row.id!, record => {
		detailGoal.value = record;
		detailVisible.value = true;
	});
}

async function openProgress(row: GoalRecord) {
	await openDetail(row);
}

async function loadDetail(id: number, next: (record: GoalRecord) => void) {
	try {
		const record = await performanceGoalService.fetchInfo({ id });
		next(record);
	} catch (error: any) {
		ElMessage.error(error.message || '目标详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();
	syncDepartment();

	if (form.targetValue <= 0) {
		ElMessage.error('目标值必须大于 0');
		return;
	}

	if (form.startDate > form.endDate) {
		ElMessage.error('开始日期不能晚于结束日期');
		return;
	}

	submitLoading.value = true;

	try {
		if (editingGoal.value?.id) {
			await performanceGoalService.updateGoal(form);
		} else {
			await performanceGoalService.createGoal(form);
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

async function submitProgress(payload: {
	id: number;
	currentValue: number;
	remark?: string;
}) {
	submitLoading.value = true;

	try {
		await performanceGoalService.progressUpdate(payload);
		ElMessage.success('进度更新成功');
		detailVisible.value = false;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '进度更新失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleDelete(row: GoalRecord) {
	await ElMessageBox.confirm(`确认删除目标「${row.title}」吗？`, '删除确认', {
		type: 'warning'
	});

	try {
		await performanceGoalService.removeGoal({
			ids: [row.id!]
		});
		ElMessage.success('删除成功');
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '删除失败');
	}
}

async function handleExport() {
	try {
		const exportRows = await performanceGoalService.exportSummary({
			keyword: filters.keyword || undefined,
			employeeId: filters.employeeId,
			status: filters.status || undefined,
			startDate: filters.startDate || undefined,
			endDate: filters.endDate || undefined
		});

		exportJsonToExcel({
			header: [
				'员工',
				'部门',
				'目标标题',
				'目标值',
				'当前值',
				'单位',
				'权重',
				'状态',
				'开始日期',
				'结束日期',
				'更新时间'
			],
			data: (exportRows || []).map(item => [
				item.employeeName,
				item.departmentName,
				item.title,
				item.targetValue,
				item.currentValue,
				item.unit,
				item.weight,
				statusLabel(item.status),
				item.startDate,
				item.endDate,
				item.updateTime
			]),
			filename: `goal-${Date.now()}`
		});
	} catch (error: any) {
		ElMessage.error(error.message || '导出失败');
	}
}

function canEdit(row: GoalRecord) {
	return (
		checkPerm(performanceGoalService.permission.update) &&
		['draft', 'in-progress'].includes(row.status || '')
	);
}

function canDelete(_row: GoalRecord) {
	return checkPerm(performanceGoalService.permission.delete);
}

function canProgressUpdate(row: GoalRecord) {
	if (!checkPerm(performanceGoalService.permission.progressUpdate)) {
		return false;
	}

	if (['completed', 'cancelled'].includes(row.status || '')) {
		return false;
	}

	const currentUserId = Number(user.info?.id || 0);

	if (
		checkPerm(performanceGoalService.permission.add) ||
		checkPerm(performanceGoalService.permission.update) ||
		checkPerm(performanceGoalService.permission.delete)
	) {
		return true;
	}

	return Number(row.employeeId) === currentUserId;
}

function statusLabel(status?: string) {
	const item = statusOptions.find(option => option.value === status);
	return item?.label || status || '-';
}

function statusTagType(status?: string) {
	switch (status) {
		case 'in-progress':
			return 'warning';
		case 'completed':
			return 'success';
		case 'cancelled':
			return 'danger';
		default:
			return 'info';
	}
}
</script>

<style lang="scss" scoped>
.goal-page {
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;

		h2 {
			margin: 0;
			font-size: 18px;
		}
	}

	&__progress-cell {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		padding-top: 16px;
	}
}
</style>
