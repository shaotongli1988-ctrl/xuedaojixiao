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
						<el-tag :type="statusTagType(row.status)">{{
							statusLabel(row.status)
						}}</el-tag>
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

		<el-dialog v-model="detailVisible" title="面试详情" width="760px" destroy-on-close>
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
						{{
							detailInterview.interviewerName ||
							interviewerLabel(detailInterview.interviewerId)
						}}
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
					<el-descriptions-item label="来源简历" :span="2">
						<div class="interview-page__source-summary">
							<span>{{ interviewResumeLabel(detailInterview) }}</span>
							<el-button
								v-if="detailInterview.resumePoolId"
								text
								type="primary"
								@click="goToResumePool(detailInterview)"
							>
								查看简历
							</el-button>
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="来源招聘计划" :span="2">
						<div class="interview-page__source-summary">
							<span>{{ interviewRecruitPlanLabel(detailInterview) }}</span>
							<el-button
								v-if="detailInterview.recruitPlanId"
								text
								type="primary"
								@click="goToRecruitPlan(detailInterview)"
							>
								查看招聘计划
							</el-button>
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="创建时间">
						{{ detailInterview.createTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间">
						{{ detailInterview.updateTime || '-' }}
					</el-descriptions-item>
				</el-descriptions>
			</div>

			<template #footer>
				<div class="interview-page__dialog-footer">
					<el-button @click="detailVisible = false">关闭</el-button>
					<el-button
						v-if="canCreateHiringFromInterview"
						type="primary"
						@click="goCreateHiring(detailInterview)"
					>
						新建录用
					</el-button>
				</div>
			</template>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingInterview?.id ? '编辑面试' : '新建面试'"
			width="760px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="
						editingInterview?.id
							? '仅 scheduled 记录可编辑；切换为已完成/已取消后将进入终态。'
							: '新建保存后默认进入 scheduled 状态。'
					"
					:type="editingInterview?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-alert
					v-if="interviewSourceSummary(form)"
					:title="`来源摘要：${interviewSourceSummary(form)}`"
					type="info"
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

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { service } from '/@/cool';
import { useRoute, useRouter } from 'vue-router';
import { useListPage } from '../../composables/use-list-page.js';
import { confirmElementAction, runTrackedElementAction } from '../shared/action-feedback';
import {
	createElementWarningFromErrorHandler,
	resolveErrorMessage,
	showElementErrorFromError
} from '../shared/error-message';
import { loadDepartmentOptions, loadUserOptions } from '../../utils/lookup-options.js';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';
import {
	createEmptyInterview,
	type DepartmentOption,
	type InterviewRecord as InterviewApiRecord,
	type InterviewSaveRequest,
	type InterviewStatus,
	type InterviewType,
	normalizeInterviewDomainRecord,
	type UserOption
} from '../../types';
import { performanceInterviewService } from '../../service/interview';
import { performanceHiringService } from '../../service/hiring';

const INTERVIEW_STATUS_DICT_KEY = 'performance.interview.status';
const INTERVIEW_TYPE_DICT_KEY = 'performance.interview.type';

const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const { dict } = useDict();
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingInterview = ref<InterviewApiRecord | null>(null);
const detailInterview = ref<InterviewApiRecord | null>(null);
const formRef = ref<FormInstance>();
const route = useRoute();
const router = useRouter();
const form = reactive<InterviewApiRecord>(createEmptyInterview());

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

const statusOptions = computed<Array<{ label: string; value: InterviewStatus }>>(() =>
	dict.get(INTERVIEW_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as InterviewStatus
	}))
);

const interviewTypeOptions = computed<Array<{ label: string; value: InterviewType }>>(() =>
	dict.get(INTERVIEW_TYPE_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as InterviewType
	}))
);

const canAccess = computed(() => checkPerm(performanceInterviewService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceInterviewService.permission.info));
const showAddButton = computed(() => checkPerm(performanceInterviewService.permission.add));
const canCreateHiringFromInterview = computed(() =>
	checkPerm(performanceHiringService.permission.add)
);
const interviewList = useListPage({
	createFilters: () => ({
		candidateName: '',
		position: '',
		status: '' as InterviewStatus | '',
		startDate: '',
		endDate: ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params => {
		const result = await performanceInterviewService.fetchPage({
			page: params.page,
			size: params.size,
			candidateName: params.candidateName || undefined,
			position: params.position || undefined,
			status: params.status || undefined,
			startDate: params.startDate || undefined,
			endDate: params.endDate || undefined
		});

		return {
			...result,
			list: (result.list || []).map(item => normalizeInterviewDomainRecord(item))
		};
	},
	onError: (error: unknown) => {
		showElementErrorFromError(error, '面试列表加载失败');
	}
});
const rows = interviewList.rows;
const tableLoading = interviewList.loading;
const filters = interviewList.filters;
const pagination = interviewList.pager;
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
	await dict.refresh([INTERVIEW_STATUS_DICT_KEY, INTERVIEW_TYPE_DICT_KEY]);
	await Promise.all([loadUsers(), loadDepartments()]);
	await refresh();
	await consumeRoutePrefill();
	await consumeRouteOpenDetail();
});

watch(
	() => route.fullPath,
	() => {
		void consumeRoutePrefill();
		void consumeRouteOpenDetail();
	}
);

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 200
			}),
		createElementWarningFromErrorHandler('用户选项加载失败')
	);
}

async function loadDepartments() {
	departmentOptions.value = await loadDepartmentOptions(
		() => service.base.sys.department.list(),
		createElementWarningFromErrorHandler('部门选项加载失败')
	);
}

async function refresh() {
	await interviewList.reload();
}

function changePage(page: number) {
	void interviewList.goToPage(page);
}

function openCreate() {
	openCreateWithPrefill();
}

async function openEdit(row: InterviewApiRecord) {
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

async function openDetail(row: InterviewApiRecord) {
	await loadDetail(row.id!, record => {
		detailInterview.value = record;
		detailVisible.value = true;
	});
}

async function loadDetail(id: number, next: (record: InterviewApiRecord) => void) {
	try {
		const record = normalizeInterviewDomainRecord(
			await performanceInterviewService.fetchInfo({ id })
		);
		next(record);
	} catch (error: unknown) {
		showElementErrorFromError(error, '面试详情加载失败');
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

	const interviewerId = normalizeNumberOrUndefined(form.interviewerId);

	if (!interviewerId) {
		ElMessage.error('请选择面试官');
		return;
	}

	submitLoading.value = true;

	try {
		const payload: InterviewSaveRequest = {
			candidateName: String(form.candidateName || '').trim(),
			position: String(form.position || '').trim(),
			departmentId: form.departmentId || undefined,
			interviewerId,
			interviewDate: String(form.interviewDate || ''),
			interviewType: form.interviewType || undefined,
			score: form.score == null ? undefined : Number(form.score),
			resumePoolId: form.resumePoolId || undefined,
			recruitPlanId: form.recruitPlanId || undefined,
			sourceSnapshot: form.sourceSnapshot || undefined,
			status: form.status || undefined
		};

		if (editingInterview.value?.id) {
			await performanceInterviewService.updateInterview({
				id: editingInterview.value.id,
				...payload
			});
		} else {
			await performanceInterviewService.createInterview(payload);
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

async function handleDelete(row: InterviewApiRecord) {
	const confirmed = await confirmElementAction(
		`确认删除面试「${row.candidateName} / ${row.position}」吗？`,
		'删除确认'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: Number(row.id || 0),
		actionType: 'delete',
		request: () =>
			performanceInterviewService.removeInterview({
				ids: [row.id!]
			}),
		successMessage: '删除成功',
		errorMessage: '删除失败',
		refresh
	});
}

function canEdit(row: InterviewApiRecord) {
	return checkPerm(performanceInterviewService.permission.update) && row.status === 'scheduled';
}

function canDelete(row: InterviewApiRecord) {
	return checkPerm(performanceInterviewService.permission.delete) && row.status === 'scheduled';
}

function isTerminal(status?: InterviewStatus) {
	return status === 'completed' || status === 'cancelled';
}

function statusLabel(status?: InterviewStatus | '') {
	return dict.getLabel(INTERVIEW_STATUS_DICT_KEY, status) || status || '-';
}

function statusTagType(status?: InterviewStatus | '') {
	return dict.getMeta(INTERVIEW_STATUS_DICT_KEY, status)?.tone || 'info';
}

function interviewTypeLabel(value?: InterviewType | null) {
	return dict.getLabel(INTERVIEW_TYPE_DICT_KEY, value) || value || '-';
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

async function consumeRoutePrefill() {
	await consumeRoutePreset({
		route,
		router,
		keys: [
			'openCreate',
			'sourceResource',
			'talentAssetId',
			'candidate',
			'candidateName',
			'departmentId',
			'targetDepartmentId',
			'position',
			'targetPosition',
			'resumePoolId',
			'recruitPlanId',
			'recruitPlanTitle'
		],
		parse: query => ({
			shouldOpenCreate: firstQueryValue(query.openCreate) === '1',
			sourceResource: normalizeQueryText(query.sourceResource),
			talentAssetId: normalizeQueryNumber(query.talentAssetId),
			candidateName:
				normalizeQueryText(query.candidate) || normalizeQueryText(query.candidateName),
			targetPosition:
				normalizeQueryText(query.position) || normalizeQueryText(query.targetPosition),
			targetDepartmentId:
				normalizeQueryNumber(query.departmentId) ||
				normalizeQueryNumber(query.targetDepartmentId),
			resumePoolId: normalizeQueryNumber(query.resumePoolId),
			recruitPlanId: normalizeQueryNumber(query.recruitPlanId),
			recruitPlanTitle: normalizeQueryText(query.recruitPlanTitle)
		}),
		shouldConsume: payload => Boolean(payload.shouldOpenCreate),
		consume: payload => {
			if (!showAddButton.value) {
				return;
			}

			openCreateWithPrefill({
				sourceResource: payload.sourceResource,
				talentAssetId: payload.talentAssetId,
				candidateName: payload.candidateName,
				position: payload.targetPosition,
				departmentId: payload.targetDepartmentId,
				resumePoolId: payload.resumePoolId,
				recruitPlanId: payload.recruitPlanId,
				recruitPlanTitle: payload.recruitPlanTitle
			});
		}
	});
}

async function consumeRouteOpenDetail() {
	await consumeRoutePreset({
		route,
		router,
		keys: ['openDetail', 'interviewId'],
		parse: query => ({
			shouldOpenDetail: firstQueryValue(query.openDetail) === '1',
			interviewId: normalizeQueryNumber(query.interviewId)
		}),
		shouldConsume: payload => Boolean(payload.shouldOpenDetail && payload.interviewId),
		consume: async payload => {
			if (!showInfoButton.value || !payload.interviewId) {
				return;
			}

			await loadDetail(payload.interviewId, record => {
				detailInterview.value = record;
				detailVisible.value = true;
			});
		}
	});
}

function openCreateWithPrefill(prefill?: {
	sourceResource?: string;
	talentAssetId?: number;
	candidateName?: string;
	position?: string;
	departmentId?: number;
	resumePoolId?: number;
	recruitPlanId?: number;
	recruitPlanTitle?: string;
}) {
	Object.assign(form, createEmptyInterview(), {
		candidateName: prefill?.candidateName || '',
		position: prefill?.position || '',
		departmentId: prefill?.departmentId,
		resumePoolId: prefill?.resumePoolId,
		recruitPlanId: prefill?.recruitPlanId,
		sourceSnapshot:
			prefill?.sourceResource === 'talentAsset' && prefill?.talentAssetId
				? {
						sourceResource: 'talentAsset',
						talentAssetId: prefill.talentAssetId,
						candidateName: prefill?.candidateName || null,
						targetDepartmentId: prefill?.departmentId || null,
						targetPosition: prefill?.position || null
					}
				: prefill?.resumePoolId || prefill?.recruitPlanId
					? {
							sourceResource: 'resumePool',
							resumePoolId: prefill?.resumePoolId || null,
							recruitPlanId: prefill?.recruitPlanId || null,
							recruitPlanTitle: prefill?.recruitPlanTitle || null,
							candidateName: prefill?.candidateName || null,
							targetDepartmentId: prefill?.departmentId || null,
							targetPosition: prefill?.position || null
						}
					: null
	});
	editingInterview.value = null;
	formVisible.value = true;

	nextTick(() => {
		formRef.value?.clearValidate();
	});
}

function normalizeQueryText(value: unknown) {
	const text = String(firstQueryValue(value) || '').trim();
	return text || undefined;
}

function interviewResumeLabel(record?: InterviewApiRecord | null) {
	if (!record?.resumePoolId) {
		return '-';
	}

	return `简历 #${record.resumePoolId}`;
}

function interviewTalentAssetLabel(record?: InterviewApiRecord | null) {
	if (record?.sourceSnapshot?.sourceResource !== 'talentAsset') {
		return '-';
	}

	const talentAssetId = normalizeNumberOrUndefined(record.sourceSnapshot?.talentAssetId);
	return talentAssetId ? `人才资产 #${talentAssetId}` : '人才资产';
}

function interviewRecruitPlanLabel(record?: InterviewApiRecord | null) {
	if (!record?.recruitPlanId) {
		return '-';
	}

	const title = record.sourceSnapshot?.recruitPlanTitle || '招聘计划';
	return `${title} #${record.recruitPlanId}`;
}

function interviewSourceSummary(record?: InterviewApiRecord | null) {
	return [
		interviewTalentAssetLabel(record),
		interviewResumeLabel(record),
		interviewRecruitPlanLabel(record)
	]
		.filter(item => item && item !== '-')
		.join('；');
}

async function goToResumePool(record?: InterviewApiRecord | null) {
	if (!record?.resumePoolId) {
		return;
	}

	await router.push({
		path: '/performance/resumePool',
		query: {
			openDetail: '1',
			resumePoolId: String(record.resumePoolId)
		}
	});
}

async function goToRecruitPlan(record?: InterviewApiRecord | null) {
	if (!record?.recruitPlanId) {
		return;
	}

	await router.push({
		path: '/performance/recruit-plan',
		query: {
			openDetail: '1',
			recruitPlanId: String(record.recruitPlanId)
		}
	});
}

async function goCreateHiring(record?: InterviewApiRecord | null) {
	if (!record?.id) {
		return;
	}

	detailVisible.value = false;
	await router.push({
		path: '/performance/hiring',
		query: {
			openCreate: '1',
			sourceType: 'interview',
			sourceId: String(record.id),
			interviewId: String(record.id),
			resumePoolId: record.resumePoolId ? String(record.resumePoolId) : undefined,
			recruitPlanId: record.recruitPlanId ? String(record.recruitPlanId) : undefined,
			candidate: record.candidateName || undefined,
			departmentId: record.departmentId ? String(record.departmentId) : undefined,
			position: record.position || undefined,
			interviewStatus: record.status || undefined,
			recruitPlanTitle: record.sourceSnapshot?.recruitPlanTitle || undefined
		}
	});
}

function normalizeNumberOrUndefined(value: unknown) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.management-workspace.scss' as managementWorkspace;

.interview-page {
	@include managementWorkspace.management-workspace-shell(1120px);
}
</style>
