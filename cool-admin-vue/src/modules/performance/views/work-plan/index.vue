<!-- 文件职责：承接工作计划列表、来源展示、计划编辑和执行动作主链；不负责真实钉钉鉴权、审批模板配置或跨系统通知；依赖 workPlan service、基础部门/用户选项和既有权限工具；维护重点是来源审批状态与执行状态必须分开展示，且未获批的钉钉来源计划不能开始执行。 -->
<template>
	<div v-if="canAccess" class="work-plan-page">
		<el-card shadow="never">
			<div class="work-plan-page__toolbar">
				<div class="work-plan-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="计划标题 / 单号 / 来源标题"
						clearable
						style="width: 260px"
						@keyup.enter="handleSearch"
					/>
					<el-select
						v-model="filterDepartmentIdModel"
						placeholder="所属部门"
						clearable
						filterable
						style="width: 200px"
					>
						<el-option
							v-for="item in departmentOptions"
							:key="item.id"
							:label="item.label"
							:value="item.id"
						/>
					</el-select>
					<el-select
						v-model="filters.status"
						placeholder="执行状态"
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
					<el-select
						v-model="filters.sourceStatus"
						placeholder="来源审批状态"
						clearable
						style="width: 180px"
					>
						<el-option
							v-for="item in sourceStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="work-plan-page__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button v-if="showSyncButton" type="warning" plain @click="openSyncDialog">
						来源同步
					</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">新建计划</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="work-plan-page__header">
					<div class="work-plan-page__header-main">
						<h2>工作计划</h2>
						<el-tag effect="plain" type="info">来源承接 + 执行分配</el-tag>
					</div>
					<el-alert
						title="钉钉审批来源只负责同步审批结果和表单快照；工作分配、协作人和执行进度仍在当前页面维护。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="workNo" label="计划单号" min-width="150" />
				<el-table-column prop="title" label="计划标题" min-width="220" show-overflow-tooltip />
				<el-table-column label="所属部门" min-width="150">
					<template #default="{ row }">
						{{ row.ownerDepartmentName || departmentLabel(row.ownerDepartmentId) }}
					</template>
				</el-table-column>
				<el-table-column label="负责人" min-width="120">
					<template #default="{ row }">
						{{ row.ownerName || userLabel(row.ownerId) }}
					</template>
				</el-table-column>
				<el-table-column label="协作执行人" min-width="220" show-overflow-tooltip>
					<template #default="{ row }">
						<span>{{ row.assigneeNames?.join('、') || '-' }}</span>
					</template>
				</el-table-column>
				<el-table-column label="优先级" width="100">
					<template #default="{ row }">
						<el-tag :type="priorityTagType(row.priority)">{{ priorityLabel(row.priority) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="来源" min-width="260" show-overflow-tooltip>
					<template #default="{ row }">
						<div class="work-plan-page__source-cell">
							<div class="work-plan-page__source-title">
								<span>{{ sourceTypeLabel(row.sourceType) }}</span>
								<el-tag size="small" :type="sourceStatusTagType(row.sourceStatus)">
									{{ sourceStatusLabel(row.sourceStatus) }}
								</el-tag>
							</div>
							<div class="work-plan-page__source-meta">
								{{ row.sourceTitle || row.externalInstanceId || '手工创建' }}
							</div>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="计划周期" min-width="170">
					<template #default="{ row }">
						{{ row.plannedStartDate || '-' }} ~ {{ row.plannedEndDate || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="执行状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="320">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)">详情</el-button>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button
							v-if="canStart(row)"
							text
							type="success"
							:loading="actionLoadingId === row.id && actionLoadingType === 'start'"
							@click="handleStart(row)"
						>
							开始
						</el-button>
						<el-button
							v-if="canComplete(row)"
							text
							type="success"
							:loading="actionLoadingId === row.id && actionLoadingType === 'complete'"
							@click="handleComplete(row)"
						>
							完成
						</el-button>
						<el-button
							v-if="canCancel(row)"
							text
							type="warning"
							:loading="actionLoadingId === row.id && actionLoadingType === 'cancel'"
							@click="handleCancel(row)"
						>
							取消
						</el-button>
						<el-button
							v-if="canDelete(row)"
							text
							type="danger"
							:loading="actionLoadingId === row.id && actionLoadingType === 'delete'"
							@click="handleDelete(row)"
						>
							删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="work-plan-page__pagination">
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

		<el-dialog v-model="detailVisible" title="工作计划详情" width="920px" destroy-on-close>
			<div v-if="detailRecord" class="work-plan-page__detail">
				<el-alert
					v-if="detailRecord.sourceType === 'dingtalkApproval' && detailRecord.sourceStatus !== 'approved'"
					title="来源审批未通过前，只能安排计划，不能开始执行。"
					type="warning"
					:closable="false"
					show-icon
				/>
				<el-descriptions :column="2" border>
					<el-descriptions-item label="计划单号">
						{{ detailRecord.workNo || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="执行状态">
						<el-tag :type="statusTagType(detailRecord.status)">
							{{ statusLabel(detailRecord.status) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="计划标题" :span="2">
						{{ detailRecord.title }}
					</el-descriptions-item>
					<el-descriptions-item label="所属部门">
						{{ detailRecord.ownerDepartmentName || departmentLabel(detailRecord.ownerDepartmentId) }}
					</el-descriptions-item>
					<el-descriptions-item label="负责人">
						{{ detailRecord.ownerName || userLabel(detailRecord.ownerId) }}
					</el-descriptions-item>
					<el-descriptions-item label="协作执行人" :span="2">
						{{ detailRecord.assigneeNames?.join('、') || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="优先级">
						{{ priorityLabel(detailRecord.priority) }}
					</el-descriptions-item>
					<el-descriptions-item label="计划周期">
						{{ detailRecord.plannedStartDate || '-' }} ~
						{{ detailRecord.plannedEndDate || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="来源类型">
						{{ sourceTypeLabel(detailRecord.sourceType) }}
					</el-descriptions-item>
					<el-descriptions-item label="来源审批状态">
						<el-tag :type="sourceStatusTagType(detailRecord.sourceStatus)">
							{{ sourceStatusLabel(detailRecord.sourceStatus) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="来源标题" :span="2">
						{{ detailRecord.sourceTitle || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="来源业务">
						{{ detailRecord.sourceBizType || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="来源业务 ID">
						{{ detailRecord.sourceBizId || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="外部实例 ID" :span="2">
						{{ detailRecord.externalInstanceId || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="计划说明" :span="2">
						<div class="work-plan-page__long-text">
							{{ detailRecord.description || '-' }}
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="进展摘要" :span="2">
						<div class="work-plan-page__long-text">
							{{ detailRecord.progressSummary || '-' }}
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="结果总结" :span="2">
						<div class="work-plan-page__long-text">
							{{ detailRecord.resultSummary || '-' }}
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="开始执行时间">
						{{ detailRecord.startedAt || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="完成时间">
						{{ detailRecord.completedAt || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="审批完成时间">
						{{ detailRecord.approvalFinishedAt || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="来源快照" :span="2">
						<pre class="work-plan-page__snapshot">{{ sourceSnapshotText(detailRecord.sourceSnapshot) }}</pre>
					</el-descriptions-item>
				</el-descriptions>
			</div>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="form.id ? '编辑工作计划' : '新建工作计划'"
			width="760px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-form-item label="计划标题" prop="title">
					<el-input v-model="form.title" maxlength="200" show-word-limit />
				</el-form-item>
				<el-form-item label="所属部门" prop="ownerDepartmentId">
					<el-select
						v-model="formDepartmentIdModel"
						filterable
						clearable
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
				<el-form-item label="负责人" prop="ownerId">
					<el-select v-model="formOwnerIdModel" filterable clearable style="width: 100%">
						<el-option
							v-for="item in userOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="协作执行人">
					<el-select
						v-model="formAssigneeIdsModel"
						multiple
						filterable
						clearable
						style="width: 100%"
					>
						<el-option
							v-for="item in userOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="优先级" prop="priority">
					<el-radio-group v-model="form.priority">
						<el-radio-button
							v-for="item in priorityOptions"
							:key="item.value"
							:label="item.value"
						>
							{{ item.label }}
						</el-radio-button>
					</el-radio-group>
				</el-form-item>
				<el-form-item label="计划周期">
					<el-date-picker
						v-model="planDateRange"
						type="daterange"
						start-placeholder="开始日期"
						end-placeholder="结束日期"
						format="YYYY-MM-DD"
						value-format="YYYY-MM-DD"
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item label="计划说明">
					<el-input
						v-model="form.description"
						type="textarea"
						:rows="4"
						maxlength="4000"
						show-word-limit
					/>
				</el-form-item>
				<el-form-item label="进展摘要">
					<el-input
						v-model="form.progressSummary"
						type="textarea"
						:rows="3"
						maxlength="2000"
						show-word-limit
					/>
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="work-plan-page__dialog-footer">
					<el-button @click="formVisible = false">取消</el-button>
					<el-button type="primary" :loading="submitLoading" @click="submitForm">
						保存
					</el-button>
				</div>
			</template>
		</el-dialog>

		<el-dialog
			v-model="syncVisible"
			title="同步钉钉审批来源"
			width="760px"
			destroy-on-close
		>
			<el-form ref="syncFormRef" :model="syncForm" :rules="syncRules" label-width="130px">
				<el-form-item label="审批标题" prop="sourceTitle">
					<el-input v-model="syncForm.sourceTitle" maxlength="200" show-word-limit />
				</el-form-item>
				<el-form-item label="来源业务类型" prop="sourceBizType">
					<el-input v-model="syncForm.sourceBizType" maxlength="50" />
				</el-form-item>
				<el-form-item label="来源业务 ID">
					<el-input v-model="syncForm.sourceBizId" maxlength="100" />
				</el-form-item>
				<el-form-item label="外部实例 ID" prop="externalInstanceId">
					<el-input v-model="syncForm.externalInstanceId" maxlength="100" />
				</el-form-item>
				<el-form-item label="审批模板编码">
					<el-input v-model="syncForm.externalProcessCode" maxlength="100" />
				</el-form-item>
				<el-form-item label="审批状态" prop="sourceStatus">
					<el-select v-model="syncForm.sourceStatus" style="width: 100%">
						<el-option
							v-for="item in sourceStatusSyncOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="生成计划标题">
					<el-input v-model="syncForm.planTitle" maxlength="200" />
				</el-form-item>
				<el-form-item label="所属部门" prop="ownerDepartmentId">
					<el-select
						v-model="syncDepartmentIdModel"
						filterable
						clearable
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
				<el-form-item label="负责人" prop="ownerId">
					<el-select v-model="syncOwnerIdModel" filterable clearable style="width: 100%">
						<el-option
							v-for="item in userOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="协作执行人">
					<el-select
						v-model="syncAssigneeIdsModel"
						multiple
						filterable
						clearable
						style="width: 100%"
					>
						<el-option
							v-for="item in userOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="优先级">
					<el-radio-group v-model="syncForm.priority">
						<el-radio-button
							v-for="item in priorityOptions"
							:key="item.value"
							:label="item.value"
						>
							{{ item.label }}
						</el-radio-button>
					</el-radio-group>
				</el-form-item>
				<el-form-item label="计划周期">
					<el-date-picker
						v-model="syncPlanDateRange"
						type="daterange"
						start-placeholder="开始日期"
						end-placeholder="结束日期"
						format="YYYY-MM-DD"
						value-format="YYYY-MM-DD"
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item label="计划说明">
					<el-input
						v-model="syncForm.planDescription"
						type="textarea"
						:rows="4"
						maxlength="4000"
						show-word-limit
					/>
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="work-plan-page__dialog-footer">
					<el-button @click="syncVisible = false">取消</el-button>
					<el-button type="primary" :loading="submitLoading" @click="submitSync">
						同步
					</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-work-plan'
});

import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { service } from '/@/cool';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { useListPage } from '../../composables/use-list-page.js';
import {
	confirmElementAction,
	promptElementAction,
	runTrackedElementAction
} from '../shared/action-feedback';
import {
	createElementWarningFromErrorHandler,
	showElementErrorFromError
} from '../shared/error-message';
import {
	createEmptyWorkPlan,
	type DepartmentOption,
	normalizeWorkPlanDomainRecord,
	type UserOption,
	type WorkPlanPriority,
	type WorkPlanRecord,
	type WorkPlanSourceStatus,
	type WorkPlanStatus
} from '../../types';
import { performanceWorkPlanService } from '../../service/workPlan';
import { loadDepartmentOptions, loadUserOptions } from '../../utils/lookup-options.js';

const WORK_PLAN_STATUS_DICT_KEY = 'performance.workPlan.status';
const WORK_PLAN_SOURCE_STATUS_DICT_KEY = 'performance.workPlan.sourceStatus';
const WORK_PLAN_PRIORITY_DICT_KEY = 'performance.workPlan.priority';
const WORK_PLAN_SOURCE_TYPE_DICT_KEY = 'performance.workPlan.sourceType';
type WorkPlanActionType = 'start' | 'complete' | 'cancel' | 'delete';

const { dict } = useDict();
const submitLoading = ref(false);
const detailVisible = ref(false);
const formVisible = ref(false);
const syncVisible = ref(false);
const detailRecord = ref<WorkPlanRecord | null>(null);
const departmentOptions = ref<DepartmentOption[]>([]);
const userOptions = ref<UserOption[]>([]);
const actionLoadingId = ref<number | null>(null);
const actionLoadingType = ref<WorkPlanActionType | null>(null);

const formRef = ref<FormInstance>();
const syncFormRef = ref<FormInstance>();

const form = reactive<WorkPlanRecord>(createEmptyWorkPlan());

const syncForm = reactive({
	sourceTitle: '',
	sourceBizType: 'proposal',
	sourceBizId: '',
	externalInstanceId: '',
	externalProcessCode: '',
	sourceStatus: 'processing',
	planTitle: '',
	planDescription: '',
	ownerDepartmentId: undefined as number | undefined,
	ownerId: undefined as number | undefined,
	assigneeIds: [] as number[],
	priority: 'medium' as WorkPlanPriority,
	plannedStartDate: '',
	plannedEndDate: ''
});

const statusOptions = computed<Array<{ label: string; value: WorkPlanStatus }>>(() =>
	dict.get(WORK_PLAN_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as WorkPlanStatus
	}))
);

const sourceStatusOptions = computed<
	Array<{ label: string; value: WorkPlanSourceStatus }>
>(() =>
	dict.get(WORK_PLAN_SOURCE_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as WorkPlanSourceStatus
	}))
);

const sourceStatusSyncOptions = computed(() =>
	sourceStatusOptions.value.filter(item => item.value !== 'none')
);

const priorityOptions = computed<Array<{ label: string; value: WorkPlanPriority }>>(() =>
	dict.get(WORK_PLAN_PRIORITY_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as WorkPlanPriority
	}))
);

const rules: FormRules = {
	title: [
		{ required: true, message: '请输入计划标题', trigger: 'blur' },
		{ min: 1, max: 200, message: '计划标题长度需在 1-200 之间', trigger: 'blur' }
	],
	ownerDepartmentId: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
	ownerId: [{ required: true, message: '请选择负责人', trigger: 'change' }]
};

const syncRules: FormRules = {
	sourceTitle: [{ required: true, message: '请输入审批标题', trigger: 'blur' }],
	sourceBizType: [{ required: true, message: '请输入来源业务类型', trigger: 'blur' }],
	externalInstanceId: [{ required: true, message: '请输入外部实例 ID', trigger: 'blur' }],
	sourceStatus: [{ required: true, message: '请选择审批状态', trigger: 'change' }],
	ownerDepartmentId: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
	ownerId: [{ required: true, message: '请选择负责人', trigger: 'change' }]
};

const canAccess = computed(() => checkPerm(performanceWorkPlanService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceWorkPlanService.permission.info));
const showAddButton = computed(() => checkPerm(performanceWorkPlanService.permission.add));
const showSyncButton = computed(() => checkPerm(performanceWorkPlanService.permission.sync));
const canUpdate = computed(() => checkPerm(performanceWorkPlanService.permission.update));
const canDeletePerm = computed(() => checkPerm(performanceWorkPlanService.permission.delete));
const canStartPerm = computed(() => checkPerm(performanceWorkPlanService.permission.start));
const canCompletePerm = computed(() => checkPerm(performanceWorkPlanService.permission.complete));
const canCancelPerm = computed(() => checkPerm(performanceWorkPlanService.permission.cancel));
const workPlanList = useListPage({
	createFilters: () => ({
		keyword: '',
		ownerDepartmentId: undefined as number | undefined,
		status: '' as WorkPlanStatus | '',
		sourceStatus: '' as WorkPlanSourceStatus | ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params => {
		const result = await performanceWorkPlanService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: params.keyword || undefined,
			departmentId: params.ownerDepartmentId || undefined,
			status: params.status || undefined,
			sourceStatus: params.sourceStatus || undefined
		});

		return {
			...result,
			list: (result.list || []).map(item => normalizeWorkPlanDomainRecord(item))
		};
	},
	onError: (error: unknown) => {
		showElementErrorFromError(error, '工作计划列表加载失败');
	}
});
const rows = workPlanList.rows;
const tableLoading = workPlanList.loading;
const filters = workPlanList.filters;
const pagination = workPlanList.pager;

const filterDepartmentIdModel = computed<number | undefined>({
	get: () => filters.ownerDepartmentId ?? undefined,
	set: value => {
		filters.ownerDepartmentId = value;
	}
});

const formDepartmentIdModel = computed<number | undefined>({
	get: () => form.ownerDepartmentId ?? undefined,
	set: value => {
		form.ownerDepartmentId = value;
	}
});

const formOwnerIdModel = computed<number | undefined>({
	get: () => form.ownerId ?? undefined,
	set: value => {
		form.ownerId = value;
	}
});

const formAssigneeIdsModel = computed<number[]>({
	get: () => form.assigneeIds || [],
	set: value => {
		form.assigneeIds = value || [];
	}
});

const planDateRange = computed<string[]>({
	get: () => {
		if (form.plannedStartDate && form.plannedEndDate) {
			return [String(form.plannedStartDate), String(form.plannedEndDate)];
		}
		return [];
	},
	set: value => {
		form.plannedStartDate = value?.[0] || '';
		form.plannedEndDate = value?.[1] || '';
	}
});

const syncDepartmentIdModel = computed<number | undefined>({
	get: () => syncForm.ownerDepartmentId ?? undefined,
	set: value => {
		syncForm.ownerDepartmentId = value;
	}
});

const syncOwnerIdModel = computed<number | undefined>({
	get: () => syncForm.ownerId ?? undefined,
	set: value => {
		syncForm.ownerId = value;
	}
});

const syncAssigneeIdsModel = computed<number[]>({
	get: () => syncForm.assigneeIds || [],
	set: value => {
		syncForm.assigneeIds = value || [];
	}
});

const syncPlanDateRange = computed<string[]>({
	get: () => {
		if (syncForm.plannedStartDate && syncForm.plannedEndDate) {
			return [syncForm.plannedStartDate, syncForm.plannedEndDate];
		}
		return [];
	},
	set: value => {
		syncForm.plannedStartDate = value?.[0] || '';
		syncForm.plannedEndDate = value?.[1] || '';
	}
});

onMounted(async () => {
	await dict.refresh([
		WORK_PLAN_STATUS_DICT_KEY,
		WORK_PLAN_SOURCE_STATUS_DICT_KEY,
		WORK_PLAN_PRIORITY_DICT_KEY,
		WORK_PLAN_SOURCE_TYPE_DICT_KEY
	]);
	await Promise.all([loadDepartments(), loadUsers()]);
	await refresh();
});

async function loadDepartments() {
	departmentOptions.value = await loadDepartmentOptions(
		() => service.base.sys.department.list(),
		createElementWarningFromErrorHandler('部门选项加载失败')
	);
}

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 1000
			}),
		createElementWarningFromErrorHandler('用户选项加载失败')
	);
}

async function refresh() {
	await workPlanList.reload();
}

function handleSearch() {
	void workPlanList.search();
}

function handleReset() {
	void workPlanList.reset();
}

function changePage(page: number) {
	void workPlanList.goToPage(page);
}

function openCreate() {
	Object.assign(form, createEmptyWorkPlan());
	formVisible.value = true;
	nextTick(() => {
		formRef.value?.clearValidate();
	});
}

async function openEdit(row: WorkPlanRecord) {
	try {
		const detail = await performanceWorkPlanService.fetchInfo({ id: Number(row.id) });
		Object.assign(form, normalizeWorkPlanDomainRecord(detail));
		formVisible.value = true;
		nextTick(() => {
			formRef.value?.clearValidate();
		});
	} catch (error: unknown) {
		showElementErrorFromError(error, '工作计划详情加载失败');
	}
}

async function openDetail(row: WorkPlanRecord) {
	try {
		detailRecord.value = normalizeWorkPlanDomainRecord(
			await performanceWorkPlanService.fetchInfo({ id: Number(row.id) })
		);
		detailVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '工作计划详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();
	submitLoading.value = true;
	try {
		const payload = {
			id: form.id,
			title: form.title,
			description: normalizeOptionalText(form.description),
			ownerDepartmentId: form.ownerDepartmentId,
			ownerId: form.ownerId,
			assigneeIds: form.assigneeIds || [],
			priority: form.priority,
			plannedStartDate: normalizeOptionalText(form.plannedStartDate),
			plannedEndDate: normalizeOptionalText(form.plannedEndDate),
			progressSummary: normalizeOptionalText(form.progressSummary)
		};

		if (form.id) {
			await performanceWorkPlanService.updateWorkPlan(payload);
		} else {
			await performanceWorkPlanService.createWorkPlan(payload);
		}

		formVisible.value = false;
		ElMessage.success('工作计划已保存');
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '工作计划保存失败');
	} finally {
		submitLoading.value = false;
	}
}

function openSyncDialog() {
	Object.assign(syncForm, {
		sourceTitle: '',
		sourceBizType: 'proposal',
		sourceBizId: '',
		externalInstanceId: '',
		externalProcessCode: '',
		sourceStatus: 'processing',
		planTitle: '',
		planDescription: '',
		ownerDepartmentId: undefined,
		ownerId: undefined,
		assigneeIds: [],
		priority: 'medium',
		plannedStartDate: '',
		plannedEndDate: ''
	});
	syncVisible.value = true;
	nextTick(() => {
		syncFormRef.value?.clearValidate();
	});
}

async function submitSync() {
	await syncFormRef.value?.validate();
	submitLoading.value = true;
	try {
		await performanceWorkPlanService.syncDingtalkApproval({
			sourceTitle: syncForm.sourceTitle,
			sourceBizType: syncForm.sourceBizType,
			sourceBizId: normalizeOptionalText(syncForm.sourceBizId),
			externalInstanceId: syncForm.externalInstanceId,
			externalProcessCode: normalizeOptionalText(syncForm.externalProcessCode),
			sourceStatus: syncForm.sourceStatus,
			planTitle: normalizeOptionalText(syncForm.planTitle),
			planDescription: normalizeOptionalText(syncForm.planDescription),
			ownerDepartmentId: syncForm.ownerDepartmentId,
			ownerId: syncForm.ownerId,
			assigneeIds: syncForm.assigneeIds || [],
			priority: syncForm.priority,
			plannedStartDate: normalizeOptionalText(syncForm.plannedStartDate),
			plannedEndDate: normalizeOptionalText(syncForm.plannedEndDate),
			sourceSnapshot: {
				title: syncForm.sourceTitle,
				bizType: syncForm.sourceBizType,
				bizId: syncForm.sourceBizId
			}
		});
		syncVisible.value = false;
		ElMessage.success('来源审批已同步为工作计划');
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '来源审批同步失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleStart(row: WorkPlanRecord) {
	const rowId = Number(row.id);
	const confirmed = await confirmElementAction(`确认开始执行「${row.title}」吗？`, '开始执行');

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction<WorkPlanActionType>({
		rowId,
		actionType: 'start',
		request: () => performanceWorkPlanService.start({ id: rowId }),
		successMessage: '工作计划已开始执行',
		errorMessage: '开始执行失败',
		setLoading: (nextRowId, actionType) => {
			actionLoadingId.value = nextRowId;
			actionLoadingType.value = actionType;
		},
		refresh
	});
}

async function handleComplete(row: WorkPlanRecord) {
	const rowId = Number(row.id);
	const result = await promptElementAction('请输入结果总结，可后续补充。', '完成工作计划', {
		confirmButtonText: '完成',
		cancelButtonText: '取消',
		inputPlaceholder: '结果总结'
	});

	if (!result) {
		return;
	}

	await runTrackedElementAction<WorkPlanActionType>({
		rowId,
		actionType: 'complete',
		request: () =>
			performanceWorkPlanService.complete({
				id: rowId,
				resultSummary: normalizeOptionalText(result.value)
			}),
		successMessage: '工作计划已完成',
		errorMessage: '完成工作计划失败',
		setLoading: (nextRowId, actionType) => {
			actionLoadingId.value = nextRowId;
			actionLoadingType.value = actionType;
		},
		refresh
	});
}

async function handleCancel(row: WorkPlanRecord) {
	const rowId = Number(row.id);
	const confirmed = await confirmElementAction(`确认取消「${row.title}」吗？`, '取消工作计划');

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction<WorkPlanActionType>({
		rowId,
		actionType: 'cancel',
		request: () => performanceWorkPlanService.cancel({ id: rowId }),
		successMessage: '工作计划已取消',
		errorMessage: '取消工作计划失败',
		setLoading: (nextRowId, actionType) => {
			actionLoadingId.value = nextRowId;
			actionLoadingType.value = actionType;
		},
		refresh
	});
}

async function handleDelete(row: WorkPlanRecord) {
	const rowId = Number(row.id);
	const confirmed = await confirmElementAction(`确认删除「${row.title}」吗？`, '删除工作计划');

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction<WorkPlanActionType>({
		rowId,
		actionType: 'delete',
		request: () =>
			performanceWorkPlanService.deleteWorkPlan({
				ids: [rowId]
			}),
		successMessage: '工作计划已删除',
		errorMessage: '删除工作计划失败',
		setLoading: (nextRowId, actionType) => {
			actionLoadingId.value = nextRowId;
			actionLoadingType.value = actionType;
		},
		refresh
	});
}

function canEdit(row: WorkPlanRecord) {
	return canUpdate.value && !['completed', 'cancelled'].includes(String(row.status || ''));
}

function canDelete(row: WorkPlanRecord) {
	return (
		canDeletePerm.value &&
		['draft', 'planned', 'cancelled'].includes(String(row.status || ''))
	);
}

function canStart(row: WorkPlanRecord) {
	if (!canStartPerm.value) {
		return false;
	}
	if (!['draft', 'planned'].includes(String(row.status || ''))) {
		return false;
	}
	if (row.sourceType === 'dingtalkApproval' && row.sourceStatus !== 'approved') {
		return false;
	}
	return true;
}

function canComplete(row: WorkPlanRecord) {
	return canCompletePerm.value && row.status === 'inProgress';
}

function canCancel(row: WorkPlanRecord) {
	return canCancelPerm.value && row.status !== 'completed' && row.status !== 'cancelled';
}

function departmentLabel(id?: number) {
	return departmentOptions.value.find(item => item.id === Number(id))?.label || `部门${id}`;
}

function userLabel(id?: number) {
	return userOptions.value.find(item => item.id === Number(id))?.name || `用户${id}`;
}

function statusLabel(status?: WorkPlanStatus | string | null) {
	return dict.getLabel(WORK_PLAN_STATUS_DICT_KEY, status) || status || '未知状态';
}

function sourceStatusLabel(status?: WorkPlanSourceStatus | string | null) {
	return (
		dict.getLabel(WORK_PLAN_SOURCE_STATUS_DICT_KEY, status) || status || '未知状态'
	);
}

function sourceTypeLabel(sourceType?: string | null) {
	return (
		dict.getLabel(WORK_PLAN_SOURCE_TYPE_DICT_KEY, sourceType) ||
		sourceType ||
		'未知来源'
	);
}

function priorityLabel(priority?: WorkPlanPriority | string | null) {
	return (
		dict.getLabel(WORK_PLAN_PRIORITY_DICT_KEY, priority) ||
		priority ||
		dict.getLabel(WORK_PLAN_PRIORITY_DICT_KEY, 'medium') ||
		'中'
	);
}

function priorityTagType(priority?: WorkPlanPriority | string | null) {
	return dict.getMeta(WORK_PLAN_PRIORITY_DICT_KEY, priority)?.tone || 'success';
}

function statusTagType(status?: WorkPlanStatus | string | null) {
	return dict.getMeta(WORK_PLAN_STATUS_DICT_KEY, status)?.tone || 'info';
}

function sourceStatusTagType(status?: WorkPlanSourceStatus | string | null) {
	return dict.getMeta(WORK_PLAN_SOURCE_STATUS_DICT_KEY, status)?.tone || 'info';
}

function sourceSnapshotText(snapshot?: WorkPlanRecord['sourceSnapshot']) {
	if (!snapshot) {
		return '-';
	}
	try {
		return JSON.stringify(snapshot, null, 2);
	} catch (error) {
		return String(snapshot);
	}
}

function normalizeOptionalText(value?: string | null) {
	const text = String(value || '').trim();
	return text || undefined;
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.management-workspace.scss' as managementWorkspace;

.work-plan-page {
	@include managementWorkspace.management-workspace-shell(1240px);

	&__toolbar {
		align-items: center;
	}

	&__header {
		flex-direction: column;
	}

	&__header-main {
		align-items: center;
		justify-content: flex-start;

		h2 {
			margin: 0;
			font-size: calc(var(--app-font-size-title) + 2px);
			font-weight: 600;
		}
	}

	&__source-cell,
	&__source-title {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	&__source-title {
		flex-direction: row;
		align-items: center;
	}

	&__snapshot {
		margin: 0;
		padding: 12px;
		overflow: auto;
		border-radius: var(--app-radius-lg);
		background: var(--app-surface-muted);
		font-size: var(--app-font-size-caption);
		line-height: 1.6;
	}
}

@media (max-width: 768px) {
	.work-plan-page {
		&__toolbar,
		&__header,
		&__toolbar-left,
		&__toolbar-right {
			flex-direction: column;
			align-items: stretch;
		}
	}
}
</style>
