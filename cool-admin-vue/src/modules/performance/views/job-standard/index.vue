<!-- 文件职责：承接主题17职位标准管理的列表、详情、新建、编辑与启停用主链；不负责招聘计划、简历池、面试、录用或设计器扩展；依赖 jobStandard service、部门基础选项与权限工具；维护重点是角色显隐、状态门禁和字段边界必须与冻结口径一致。 -->
<template>
	<div v-if="canAccess" class="job-standard-page">
		<el-card shadow="never">
			<div class="job-standard-page__toolbar">
				<div class="job-standard-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="岗位名称 / 任职要求关键字"
						clearable
						style="width: 280px"
						@keyup.enter="handleSearch"
					/>
					<el-select
						v-model="targetDepartmentIdModel"
						placeholder="目标部门"
						clearable
						filterable
						style="width: 220px"
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
						placeholder="状态"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in jobStandardStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="job-standard-page__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新增职位标准
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="job-standard-page__header">
					<div class="job-standard-page__header-main">
						<h2>职位标准管理</h2>
						<el-tag effect="plain">主题 17</el-tag>
						<el-tag effect="plain" type="info">{{ roleFact.roleLabel }}</el-tag>
					</div>
					<el-alert
						title="页面只展示岗位画像、任职要求、技能标签和面试评价模板摘要，不展示简历全文、面试评语全文、录用决策或薪资区间。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="positionName" label="岗位名称" min-width="170" />
				<el-table-column label="目标部门" min-width="160">
					<template #default="{ row }">
						{{ row.targetDepartmentName || departmentLabel(row.targetDepartmentId) }}
					</template>
				</el-table-column>
				<el-table-column prop="jobLevel" label="岗位级别" min-width="120">
					<template #default="{ row }">
						{{ row.jobLevel || '-' }}
					</template>
				</el-table-column>
				<el-table-column
					prop="profileSummary"
					label="岗位画像摘要"
					min-width="220"
					show-overflow-tooltip
				>
					<template #default="{ row }">
						{{ row.profileSummary || '-' }}
					</template>
				</el-table-column>
				<el-table-column
					prop="requirementSummary"
					label="任职要求摘要"
					min-width="220"
					show-overflow-tooltip
				>
					<template #default="{ row }">
						{{ row.requirementSummary || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="技能标签" min-width="220">
					<template #default="{ row }">
						<div class="job-standard-page__tags">
							<el-tag
								v-for="tag in row.skillTagList || []"
								:key="`${row.id}-${tag}`"
								effect="plain"
							>
								{{ tag }}
							</el-tag>
							<span v-if="!(row.skillTagList || []).length">-</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column
					prop="interviewTemplateSummary"
					label="面试评价模板摘要"
					min-width="220"
					show-overflow-tooltip
				>
					<template #default="{ row }">
						{{ row.interviewTemplateSummary || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">
							{{ statusLabel(row.status) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="260">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)"
							>详情</el-button
						>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button
							v-if="canActivate(row)"
							text
							type="success"
							:loading="isStatusLoading(row, 'active')"
							@click="handleSetStatus(row, 'active')"
						>
							启用
						</el-button>
						<el-button
							v-if="canInactivate(row)"
							text
							type="warning"
							:loading="isStatusLoading(row, 'inactive')"
							@click="handleSetStatus(row, 'inactive')"
						>
							停用
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="job-standard-page__pagination">
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

		<el-dialog v-model="detailVisible" title="职位标准详情" width="860px" destroy-on-close>
			<div v-if="detailRecord" class="job-standard-page__detail">
				<el-alert
					v-if="isReadOnlyRole"
					:title="readOnlyRoleNotice"
					type="info"
					:closable="false"
					show-icon
				/>
				<el-descriptions :column="2" border>
					<el-descriptions-item label="岗位名称">
						{{ detailRecord.positionName }}
					</el-descriptions-item>
					<el-descriptions-item label="状态">
						<el-tag :type="statusTagType(detailRecord.status)">
							{{ statusLabel(detailRecord.status) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="目标部门">
						{{
							detailRecord.targetDepartmentName ||
							departmentLabel(detailRecord.targetDepartmentId)
						}}
					</el-descriptions-item>
					<el-descriptions-item label="岗位级别">
						{{ detailRecord.jobLevel || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="岗位画像摘要" :span="2">
						<div class="job-standard-page__pre-line">
							{{ detailRecord.profileSummary || '-' }}
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="任职要求摘要" :span="2">
						<div class="job-standard-page__pre-line">
							{{ detailRecord.requirementSummary || '-' }}
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="技能标签" :span="2">
						<div class="job-standard-page__tags">
							<el-tag
								v-for="tag in detailRecord.skillTagList || []"
								:key="`detail-${detailRecord.id}-${tag}`"
								effect="plain"
							>
								{{ tag }}
							</el-tag>
							<span v-if="!(detailRecord.skillTagList || []).length">-</span>
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="面试评价模板摘要" :span="2">
						<div class="job-standard-page__pre-line">
							{{ detailRecord.interviewTemplateSummary || '-' }}
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="创建时间">
						{{ detailRecord.createTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间">
						{{ detailRecord.updateTime || '-' }}
					</el-descriptions-item>
				</el-descriptions>
			</div>

			<template #footer>
				<div class="job-standard-page__dialog-footer">
					<el-button @click="detailVisible = false">关闭</el-button>
					<el-button
						v-if="canCreateRecruitPlanFromJobStandard"
						type="primary"
						@click="goCreateRecruitPlan(detailRecord)"
					>
						新建招聘计划
					</el-button>
					<el-button
						v-if="canCreateResumeFromJobStandard"
						@click="goCreateResumePool(detailRecord)"
					>
						新建简历
					</el-button>
				</div>
			</template>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingRecord?.id ? '编辑职位标准' : '新增职位标准'"
			width="860px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
				<el-alert
					:title="
						editingRecord?.id
							? 'draft/active 可编辑，inactive 仅允许通过状态动作重新启用。'
							: '新建职位标准默认保存为 draft。'
					"
					:type="editingRecord?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="岗位名称" prop="positionName">
							<el-input
								v-model="form.positionName"
								maxlength="100"
								show-word-limit
								placeholder="请输入岗位名称"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="目标部门" prop="targetDepartmentId">
							<el-select
								v-model="formTargetDepartmentIdModel"
								placeholder="请选择目标部门"
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
					</el-col>
					<el-col :span="12">
						<el-form-item label="岗位级别" prop="jobLevel">
							<el-input
								v-model="form.jobLevel"
								maxlength="50"
								show-word-limit
								placeholder="可选，如 P6 / M2"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="岗位画像摘要" prop="profileSummary">
							<el-input
								v-model="form.profileSummary"
								type="textarea"
								:rows="4"
								maxlength="2000"
								show-word-limit
								placeholder="请输入岗位画像摘要"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="任职要求摘要" prop="requirementSummary">
							<el-input
								v-model="form.requirementSummary"
								type="textarea"
								:rows="5"
								maxlength="3000"
								show-word-limit
								placeholder="请输入任职要求摘要"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="技能标签">
							<el-select
								v-model="formSkillTagListModel"
								multiple
								filterable
								allow-create
								default-first-option
								clearable
								placeholder="输入后回车可新增标签"
								style="width: 100%"
							>
								<el-option
									v-for="tag in skillTagOptions"
									:key="tag"
									:label="tag"
									:value="tag"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="面试模板摘要" prop="interviewTemplateSummary">
							<el-input
								v-model="form.interviewTemplateSummary"
								type="textarea"
								:rows="4"
								maxlength="2000"
								show-word-limit
								placeholder="请输入面试评价模板摘要"
							/>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

			<template #footer>
				<div class="job-standard-page__dialog-footer">
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
	name: 'performance-job-standard'
});

import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { service } from '/@/cool';
import { useRoute, useRouter } from 'vue-router';
import { useListPage } from '../../composables/use-list-page.js';
import { confirmElementAction, runTrackedElementAction } from '../shared/action-feedback';
import { performanceAccessContextService } from '../../service/access-context';
import { performanceRecruitPlanService } from '../../service/recruit-plan';
import { resolvePerformanceRoleFact } from '../../service/role-fact';
import { performanceResumePoolService } from '../../service/resumePool';
import { performanceJobStandardService } from '../../service/job-standard';
import type { JobStandardSaveRequest, PerformanceAccessContext } from '../../types';
import {
	createElementWarningFromErrorHandler,
	showElementErrorFromError,
	showElementWarningFromError
} from '../shared/error-message';
import { loadDepartmentOptions } from '../../utils/lookup-options.js';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';
import {
	type DepartmentOption,
	type JobStandardRecord,
	type JobStandardStatus,
	createEmptyJobStandard
} from '../../types';

const JOB_STANDARD_STATUS_DICT_KEY = 'performance.jobStandard.status';

const { dict } = useDict();
const departmentOptions = ref<DepartmentOption[]>([]);
const submitLoading = ref(false);
const detailVisible = ref(false);
const formVisible = ref(false);
const detailRecord = ref<JobStandardRecord | null>(null);
const editingRecord = ref<JobStandardRecord | null>(null);
const formRef = ref<FormInstance>();
const statusLoadingId = ref<number | null>(null);
const statusLoadingTarget = ref<JobStandardStatus | null>(null);
const route = useRoute();
const router = useRouter();
const accessContext = ref<PerformanceAccessContext | null>(null);

const form = reactive<JobStandardRecord>(createEmptyJobStandard());

const rules: FormRules = {
	positionName: [
		{ required: true, message: '请输入岗位名称', trigger: 'blur' },
		{ min: 1, max: 100, message: '岗位名称长度需在 1-100 之间', trigger: 'blur' }
	],
	targetDepartmentId: [{ required: true, message: '请选择目标部门', trigger: 'change' }],
	jobLevel: [{ max: 50, message: '岗位级别长度不能超过 50', trigger: 'blur' }],
	profileSummary: [{ max: 2000, message: '岗位画像摘要长度不能超过 2000', trigger: 'blur' }],
	requirementSummary: [{ max: 3000, message: '任职要求摘要长度不能超过 3000', trigger: 'blur' }],
	interviewTemplateSummary: [
		{ max: 2000, message: '面试模板摘要长度不能超过 2000', trigger: 'blur' }
	]
};

const jobStandardStatusOptions = computed<Array<{ label: string; value: JobStandardStatus }>>(() =>
	dict.get(JOB_STANDARD_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as JobStandardStatus
	}))
);

const canAccess = computed(() => checkPerm(performanceJobStandardService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceJobStandardService.permission.info));
const showAddButton = computed(() => checkPerm(performanceJobStandardService.permission.add));
const showUpdateButton = computed(() => checkPerm(performanceJobStandardService.permission.update));
const showSetStatusButton = computed(() =>
	checkPerm(performanceJobStandardService.permission.setStatus)
);
const canCreateRecruitPlanFromJobStandard = computed(() =>
	checkPerm(performanceRecruitPlanService.permission.add)
);
const canCreateResumeFromJobStandard = computed(() =>
	checkPerm(performanceResumePoolService.permission.add)
);
const roleFact = computed(() =>
	resolvePerformanceRoleFact({
		personaKey: accessContext.value?.activePersonaKey || null,
		roleKind: accessContext.value?.roleKind || null
	})
);
const isReadOnlyRole = computed(
	() => !showAddButton.value && !showUpdateButton.value && !showSetStatusButton.value
);
const readOnlyRoleNotice = computed(
	() => `当前账号为${roleFact.value.roleLabel}，仅可查看本人部门树范围内摘要字段。`
);
const jobStandardList = useListPage({
	createFilters: () => ({
		keyword: '',
		targetDepartmentId: undefined as number | undefined,
		status: '' as JobStandardStatus | ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params =>
		performanceJobStandardService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: params.keyword || undefined,
			targetDepartmentId: params.targetDepartmentId || undefined,
			status: params.status || undefined
		}),
	onError: (error: unknown) => {
		showElementErrorFromError(error, '职位标准列表加载失败');
	}
});
const rows = jobStandardList.rows;
const tableLoading = jobStandardList.loading;
const filters = jobStandardList.filters;
const pagination = jobStandardList.pager;
const targetDepartmentIdModel = computed<number | undefined>({
	get: () => filters.targetDepartmentId,
	set: value => {
		filters.targetDepartmentId = value;
	}
});
const formTargetDepartmentIdModel = computed<number | undefined>({
	get: () => form.targetDepartmentId,
	set: value => {
		form.targetDepartmentId = value;
	}
});
const formSkillTagListModel = computed<string[]>({
	get: () => form.skillTagList || [],
	set: value => {
		form.skillTagList = value || [];
	}
});
const skillTagOptions = computed<string[]>(() => {
	const uniqueTags = new Set<string>();

	for (const row of rows.value) {
		for (const tag of row.skillTagList || []) {
			const normalized = String(tag || '').trim();

			if (normalized) {
				uniqueTags.add(normalized);
			}
		}
	}

	for (const tag of form.skillTagList || []) {
		const normalized = String(tag || '').trim();

		if (normalized) {
			uniqueTags.add(normalized);
		}
	}

	return Array.from(uniqueTags);
});

onMounted(async () => {
	await Promise.all([dict.refresh([JOB_STANDARD_STATUS_DICT_KEY]), loadAccessContext()]);
	await loadDepartments();
	await refresh();
	await consumeRouteOpenDetail();
});

async function loadDepartments() {
	departmentOptions.value = await loadDepartmentOptions(
		() => service.base.sys.department.list(),
		createElementWarningFromErrorHandler('部门选项加载失败')
	);
}

async function loadAccessContext() {
	try {
		accessContext.value = await performanceAccessContextService.fetchContext();
	} catch (error: unknown) {
		accessContext.value = null;
		showElementWarningFromError(error, '角色上下文加载失败，已使用兼容展示视角');
	}
}

async function refresh() {
	await jobStandardList.reload();
}

function handleSearch() {
	void jobStandardList.search();
}

function handleReset() {
	void jobStandardList.reset({
		targetDepartmentId: undefined
	});
}

function changePage(page: number) {
	void jobStandardList.goToPage(page);
}

function openCreate() {
	editingRecord.value = null;
	Object.assign(form, createEmptyJobStandard());
	formVisible.value = true;

	nextTick(() => {
		formRef.value?.clearValidate();
	});
}

async function openDetail(row: JobStandardRecord) {
	if (!row.id) {
		return;
	}

	try {
		detailRecord.value = await performanceJobStandardService.fetchInfo({ id: row.id });
		detailVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '职位标准详情加载失败');
	}
}

async function openEdit(row: JobStandardRecord) {
	if (!canEdit(row) || !row.id) {
		ElMessage.warning('当前状态不允许编辑');
		return;
	}

	try {
		const detail = await performanceJobStandardService.fetchInfo({ id: row.id });

		if (!canEdit(detail)) {
			ElMessage.warning('当前状态不允许编辑');
			return;
		}

		editingRecord.value = detail;
		Object.assign(form, createEmptyJobStandard(), detail, {
			targetDepartmentId: detail.targetDepartmentId ?? undefined,
			jobLevel: detail.jobLevel || '',
			profileSummary: detail.profileSummary || '',
			requirementSummary: detail.requirementSummary || '',
			skillTagList: detail.skillTagList || [],
			interviewTemplateSummary: detail.interviewTemplateSummary || '',
			status: detail.status || 'draft'
		});
		formVisible.value = true;

		nextTick(() => {
			formRef.value?.clearValidate();
		});
	} catch (error: unknown) {
		showElementErrorFromError(error, '职位标准详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();

	if (editingRecord.value && !canEdit(editingRecord.value)) {
		ElMessage.error('当前状态不允许编辑');
		return;
	}

	submitLoading.value = true;

	try {
		const payload: JobStandardSaveRequest = {
			positionName: form.positionName.trim(),
			targetDepartmentId: Number(form.targetDepartmentId),
			jobLevel: normalizeOptionalText(form.jobLevel),
			profileSummary: normalizeOptionalText(form.profileSummary),
			requirementSummary: normalizeOptionalText(form.requirementSummary),
			skillTagList: normalizeTagList(form.skillTagList),
			interviewTemplateSummary: normalizeOptionalText(form.interviewTemplateSummary)
		};

		if (editingRecord.value?.id) {
			await performanceJobStandardService.updateJobStandard({
				id: editingRecord.value.id,
				...payload
			});
		} else {
			await performanceJobStandardService.createJobStandard({
				...payload,
				status: 'draft'
			});
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '职位标准保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleSetStatus(row: JobStandardRecord, nextStatus: JobStandardStatus) {
	if (!row.id || !canSwitchStatus(row, nextStatus)) {
		return;
	}

	const actionLabel = nextStatus === 'active' ? '启用' : '停用';
	const confirmed = await confirmElementAction(
		`确认${actionLabel}职位标准「${row.positionName}」吗？`,
		`${actionLabel}确认`
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction<JobStandardStatus>({
		rowId: row.id,
		actionType: nextStatus,
		request: () =>
			performanceJobStandardService.setStatus({
				id: row.id!,
				status: nextStatus
			}),
		successMessage: `${actionLabel}成功`,
		errorMessage: `${actionLabel}失败`,
		setLoading: (rowId, actionType) => {
			statusLoadingId.value = rowId;
			statusLoadingTarget.value = actionType;
		},
		onSuccess: () => {
			const currentDetail = detailRecord.value;
			if (currentDetail && currentDetail.id === row.id) {
				currentDetail.status = nextStatus;
			}
		},
		refresh
	});
}

function canEdit(row: JobStandardRecord) {
	return showUpdateButton.value && (row.status === 'draft' || row.status === 'active');
}

function canActivate(row: JobStandardRecord) {
	return showSetStatusButton.value && (row.status === 'draft' || row.status === 'inactive');
}

function canInactivate(row: JobStandardRecord) {
	return showSetStatusButton.value && row.status === 'active';
}

function canSwitchStatus(row: JobStandardRecord, nextStatus: JobStandardStatus) {
	if (nextStatus === 'active') {
		return canActivate(row);
	}

	if (nextStatus === 'inactive') {
		return canInactivate(row);
	}

	return false;
}

function isStatusLoading(row: JobStandardRecord, status: JobStandardStatus) {
	return statusLoadingId.value === row.id && statusLoadingTarget.value === status;
}

function statusLabel(status?: JobStandardStatus | '') {
	return dict.getLabel(JOB_STANDARD_STATUS_DICT_KEY, status) || status || '-';
}

function statusTagType(status?: JobStandardStatus | '') {
	return dict.getMeta(JOB_STANDARD_STATUS_DICT_KEY, status)?.tone || 'warning';
}

function departmentLabel(id?: number | null) {
	if (!id) {
		return '-';
	}

	return departmentOptions.value.find(item => item.id === Number(id))?.label || `部门${id}`;
}

function normalizeOptionalText(value?: string | null) {
	const normalized = String(value || '').trim();
	return normalized || undefined;
}

function normalizeTagList(list?: string[]) {
	const deduplicated = Array.from(
		new Set((list || []).map(item => String(item || '').trim()).filter(Boolean))
	);

	return deduplicated.length ? deduplicated : undefined;
}

async function consumeRouteOpenDetail() {
	await consumeRoutePreset({
		route,
		router,
		keys: ['openDetail', 'jobStandardId'],
		parse: query => ({
			shouldOpenDetail: firstQueryValue(query.openDetail) === '1',
			jobStandardId: normalizeQueryNumber(query.jobStandardId)
		}),
		shouldConsume: payload => Boolean(payload.shouldOpenDetail && payload.jobStandardId),
		consume: async payload => {
			if (!showInfoButton.value || !payload.jobStandardId) {
				return;
			}

			try {
				detailRecord.value = await performanceJobStandardService.fetchInfo({
					id: payload.jobStandardId
				});
				detailVisible.value = true;
			} catch (error: unknown) {
				showElementErrorFromError(error, '职位标准详情加载失败');
			}
		}
	});
}

async function goCreateRecruitPlan(record?: JobStandardRecord | null) {
	if (!record?.id) {
		return;
	}

	detailVisible.value = false;
	await router.push({
		path: '/performance/recruit-plan',
		query: {
			openCreate: '1',
			targetDepartmentId: record.targetDepartmentId
				? String(record.targetDepartmentId)
				: undefined,
			positionName: record.positionName || undefined,
			requirementSummary: record.requirementSummary || undefined,
			jobStandardId: String(record.id),
			jobStandardPositionName: record.positionName || undefined,
			jobStandardRequirementSummary: record.requirementSummary || undefined
		}
	});
}

async function goCreateResumePool(record?: JobStandardRecord | null) {
	if (!record?.id) {
		return;
	}

	detailVisible.value = false;
	await router.push({
		path: '/performance/resumePool',
		query: {
			openCreate: '1',
			targetDepartmentId: record.targetDepartmentId
				? String(record.targetDepartmentId)
				: undefined,
			targetPosition: record.positionName || undefined,
			jobStandardId: String(record.id),
			jobStandardPositionName: record.positionName || undefined,
			jobStandardRequirementSummary: record.requirementSummary || undefined
		}
	});
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.management-workspace.scss' as managementWorkspace;

.job-standard-page {
	@include managementWorkspace.management-workspace-shell(1180px);

	&__tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--app-space-2);
	}

	&__pre-line {
		white-space: pre-line;
	}
}
</style>
