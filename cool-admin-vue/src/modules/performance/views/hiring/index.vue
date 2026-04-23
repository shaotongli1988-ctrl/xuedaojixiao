<!-- 文件职责：承接主题18录用管理的列表、详情、新增和状态动作主链；不负责后端权限范围裁剪、跨主题自动反写或入职人事主数据创建；依赖 hiring service、基础部门接口与既有权限工具；维护重点是 hiring 资源命名、offered 状态动作门禁和字段展示边界必须与冻结口径一致。 -->
<template>
	<div v-if="canAccess" class="hiring-page">
		<el-card shadow="never">
			<div class="hiring-page__toolbar">
				<div class="hiring-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="候选人 / 岗位关键字"
						clearable
						style="width: 240px"
						@keyup.enter="handleSearch"
					/>
					<el-select
						v-model="filterDepartmentIdModel"
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
						placeholder="录用状态"
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
						v-model="filters.sourceType"
						placeholder="来源类型"
						clearable
						style="width: 170px"
					>
						<el-option
							v-for="item in sourceTypeOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="hiring-page__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新建录用
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="hiring-page__header">
					<div class="hiring-page__header-main">
						<h2>录用管理</h2>
						<el-tag effect="plain">主题 18</el-tag>
					</div>
					<el-alert
						title="仅展示录用决策字段和来源快照；offered 才可接受/拒绝/关闭，终态只读。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="candidateName" label="候选人" min-width="140" />
				<el-table-column label="目标部门" min-width="160">
					<template #default="{ row }">
						{{ row.targetDepartmentName || departmentLabel(row.targetDepartmentId) }}
					</template>
				</el-table-column>
				<el-table-column prop="targetPosition" label="目标岗位" min-width="150">
					<template #default="{ row }">
						{{ row.targetPosition || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="来源类型" min-width="220">
					<template #default="{ row }">
						<div class="hiring-page__source-cell">
							<span>{{ sourceTypeLabel(row.sourceType) }}</span>
							<span
								v-if="hiringSourceSummary(row) !== '-'"
								class="hiring-page__source-meta"
							>
								{{ hiringSourceSummary(row) }}
							</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column prop="sourceId" label="来源 ID" width="110">
					<template #default="{ row }">
						{{ row.sourceId ?? '-' }}
					</template>
				</el-table-column>
				<el-table-column
					prop="sourceStatusSnapshot"
					label="来源状态快照"
					min-width="180"
					show-overflow-tooltip
				>
					<template #default="{ row }">
						{{ row.sourceStatusSnapshot || '-' }}
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
				<el-table-column label="操作" fixed="right" min-width="300">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)"
							>详情</el-button
						>
						<el-button
							v-if="canAccept(row)"
							text
							type="success"
							:loading="actionLoadingId === row.id && actionLoadingType === 'accept'"
							@click="handleUpdateStatus(row, 'accepted')"
						>
							接受
						</el-button>
						<el-button
							v-if="canReject(row)"
							text
							type="danger"
							:loading="actionLoadingId === row.id && actionLoadingType === 'reject'"
							@click="handleUpdateStatus(row, 'rejected')"
						>
							拒绝
						</el-button>
						<el-button
							v-if="canClose(row)"
							text
							type="warning"
							:loading="actionLoadingId === row.id && actionLoadingType === 'close'"
							@click="handleClose(row)"
						>
							关闭
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="hiring-page__pagination">
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

		<el-dialog v-model="detailVisible" title="录用详情" width="900px" destroy-on-close>
			<div v-if="detailRecord" class="hiring-page__detail">
				<el-alert
					v-if="detailRecord.status && detailRecord.status !== 'offered'"
					:title="terminalReadonlyMessage(detailRecord.status)"
					type="warning"
					:closable="false"
					show-icon
				/>
				<el-descriptions :column="2" border>
					<el-descriptions-item label="候选人">
						{{ detailRecord.candidateName }}
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
					<el-descriptions-item label="目标岗位">
						{{ detailRecord.targetPosition || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="来源类型">
						{{ sourceTypeLabel(detailRecord.sourceType) }}
					</el-descriptions-item>
					<el-descriptions-item label="来源 ID">
						{{ detailRecord.sourceId ?? '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="来源状态快照" :span="2">
						<div class="hiring-page__long-text">
							{{ detailRecord.sourceStatusSnapshot || '-' }}
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="来源摘要" :span="2">
						<div class="hiring-page__source-summary">
							<span>{{ hiringSourceSummary(detailRecord) }}</span>
							<el-button
								v-if="detailRecord.sourceSnapshot?.interviewId"
								text
								type="primary"
								@click="goToInterview(detailRecord)"
							>
								查看面试
							</el-button>
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="录用决策" :span="2">
						<div class="hiring-page__long-text">
							{{ detailRecord.hiringDecision || '-' }}
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="发出时间">
						{{ detailRecord.offeredAt || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="接受时间">
						{{ detailRecord.acceptedAt || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="拒绝时间">
						{{ detailRecord.rejectedAt || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="关闭时间">
						{{ detailRecord.closedAt || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="关闭原因" :span="2">
						<div class="hiring-page__long-text">
							{{ detailRecord.closeReason || '-' }}
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
				<el-button @click="detailVisible = false">关闭</el-button>
			</template>
		</el-dialog>

		<el-dialog v-model="formVisible" title="新建录用" width="900px" destroy-on-close>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
				<el-alert
					title="新建保存后默认进入 offered；首批不开放正文编辑页面，后续请通过接受/拒绝/关闭推进状态。"
					type="info"
					:closable="false"
					show-icon
				/>
				<el-alert
					v-if="hiringSourceSummary(form) !== '-'"
					:title="`来源摘要：${hiringSourceSummary(form)}`"
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
						<el-form-item label="目标部门" prop="targetDepartmentId">
							<el-select
								v-model="formDepartmentIdModel"
								placeholder="请选择目标部门"
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
					<el-col :span="12">
						<el-form-item label="目标岗位" prop="targetPosition">
							<el-input
								v-model="form.targetPosition"
								maxlength="100"
								show-word-limit
								placeholder="请输入目标岗位"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="来源类型" prop="sourceType">
							<el-select v-model="formSourceTypeModel" style="width: 100%">
								<el-option
									v-for="item in sourceTypeOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="来源 ID">
							<el-input-number
								v-model="formSourceIdModel"
								:min="1"
								:step="1"
								:precision="0"
								step-strictly
								controls-position="right"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="来源状态快照">
							<el-input
								v-model="form.sourceStatusSnapshot"
								maxlength="200"
								show-word-limit
								placeholder="可选，记录来源快照"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="录用决策" prop="hiringDecision">
							<el-input
								v-model="form.hiringDecision"
								type="textarea"
								:rows="5"
								maxlength="2000"
								show-word-limit
								placeholder="请输入录用决策内容"
							/>
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
	name: 'performance-hiring'
});

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { service } from '/@/cool';
import { useRoute, useRouter } from 'vue-router';
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
import { loadDepartmentOptions } from '../../utils/lookup-options.js';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';
import {
	createEmptyHiring,
	type DepartmentOption,
	type HiringFormRecord,
	type HiringRecord,
	type HiringSaveRequest,
	type HiringSourceType,
	type HiringStatus,
	type InterviewStatus,
	normalizeHiringDomainRecord
} from '../../types';
import { performanceHiringService } from '../../service/hiring';

const HIRING_STATUS_DICT_KEY = 'performance.hiring.status';
const HIRING_SOURCE_TYPE_DICT_KEY = 'performance.hiring.sourceType';

type HiringSourceCarrier = HiringRecord | HiringFormRecord;
type HiringActionType = 'accept' | 'reject' | 'close';
const { dict } = useDict();
const departmentOptions = ref<DepartmentOption[]>([]);
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const detailRecord = ref<HiringRecord | null>(null);
const formRef = ref<FormInstance>();
const actionLoadingId = ref<number | null>(null);
const actionLoadingType = ref<HiringActionType | null>(null);
const route = useRoute();
const router = useRouter();

const hiringList = useListPage({
	createFilters: () => ({
		keyword: '',
		targetDepartmentId: undefined,
		status: '',
		sourceType: ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params => {
		const result = await performanceHiringService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: params.keyword || undefined,
			targetDepartmentId: params.targetDepartmentId || undefined,
			status: params.status || undefined,
			sourceType: params.sourceType || undefined
		});

		return {
			...result,
			list: (result.list || []).map(item => normalizeHiringDomainRecord(item))
		};
	},
	onError: (error: unknown) => {
		showElementErrorFromError(error, '录用列表加载失败');
	}
});
const rows = hiringList.rows;
const tableLoading = hiringList.loading;
const filters = hiringList.filters;
const pagination = hiringList.pager;

const form = reactive<HiringFormRecord>(createEmptyHiring());

const rules: FormRules = {
	candidateName: [
		{ required: true, message: '请输入候选人姓名', trigger: 'blur' },
		{ min: 1, max: 100, message: '候选人姓名长度需在 1-100 之间', trigger: 'blur' }
	],
	targetDepartmentId: [{ required: true, message: '请选择目标部门', trigger: 'change' }],
	targetPosition: [
		{ required: true, message: '请输入目标岗位', trigger: 'blur' },
		{ min: 1, max: 100, message: '目标岗位长度需在 1-100 之间', trigger: 'blur' }
	],
	sourceType: [{ required: true, message: '请选择来源类型', trigger: 'change' }],
	hiringDecision: [
		{ required: true, message: '请输入录用决策内容', trigger: 'blur' },
		{ max: 2000, message: '录用决策长度不能超过 2000', trigger: 'blur' }
	]
};

const statusOptions = computed<Array<{ label: string; value: HiringStatus }>>(() =>
	dict.get(HIRING_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as HiringStatus
	}))
);

const sourceTypeOptions = computed<Array<{ label: string; value: HiringSourceType }>>(() =>
	dict.get(HIRING_SOURCE_TYPE_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as HiringSourceType
	}))
);

const canAccess = computed(() => checkPerm(performanceHiringService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceHiringService.permission.info));
const showAddButton = computed(() => checkPerm(performanceHiringService.permission.add));
const filterDepartmentIdModel = computed<number | undefined>({
	get: () => filters.targetDepartmentId ?? undefined,
	set: value => {
		filters.targetDepartmentId = value;
	}
});
const formDepartmentIdModel = computed<number | undefined>({
	get: () => form.targetDepartmentId ?? undefined,
	set: value => {
		form.targetDepartmentId = value;
	}
});
const formSourceTypeModel = computed<HiringSourceType>({
	get: () => normalizeSourceType(form.sourceType),
	set: value => {
		form.sourceType = value;
	}
});
const formSourceIdModel = computed<number | undefined>({
	get: () => form.sourceId ?? undefined,
	set: value => {
		form.sourceId = value ?? undefined;
	}
});

onMounted(async () => {
	await dict.refresh([HIRING_STATUS_DICT_KEY, HIRING_SOURCE_TYPE_DICT_KEY]);
	await loadDepartments();
	await refresh();
	await consumeRoutePrefill();
});

watch(
	() => route.fullPath,
	() => {
		void consumeRoutePrefill();
	}
);

async function loadDepartments() {
	departmentOptions.value = await loadDepartmentOptions(
		() => service.base.sys.department.list(),
		createElementWarningFromErrorHandler('部门选项加载失败')
	);
}

async function refresh() {
	await hiringList.reload();
}

function handleSearch() {
	void hiringList.search();
}

function handleReset() {
	void hiringList.reset();
}

function changePage(page: number) {
	void hiringList.goToPage(page);
}

function openCreate() {
	openCreateWithPrefill();
}

async function openDetail(row: HiringRecord) {
	if (!row.id) {
		return;
	}

	await loadDetail(row.id, record => {
		detailRecord.value = record;
		detailVisible.value = true;
	});
}

async function loadDetail(id: number, next: (record: HiringRecord) => void) {
	try {
		const record = normalizeHiringDomainRecord(
			await performanceHiringService.fetchInfo({ id })
		);
		next(record);
	} catch (error: unknown) {
		showElementErrorFromError(error, '录用详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();

	submitLoading.value = true;

	try {
		const payload: HiringSaveRequest = {
			candidateName: form.candidateName.trim(),
			targetDepartmentId: Number(form.targetDepartmentId),
			targetPosition: normalizeOptionalText(form.targetPosition),
			sourceType: normalizeSourceType(form.sourceType),
			sourceId: form.sourceId ? Number(form.sourceId) : undefined,
			sourceStatusSnapshot: normalizeOptionalText(form.sourceStatusSnapshot),
			sourceSnapshot: form.sourceSnapshot || undefined,
			interviewId: form.interviewId || undefined,
			resumePoolId: form.resumePoolId || undefined,
			recruitPlanId: form.recruitPlanId || undefined,
			hiringDecision: normalizeOptionalText(form.hiringDecision)
		};

		await performanceHiringService.createHiring(payload);
		ElMessage.success('新建成功');
		formVisible.value = false;
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '新建失败');
	} finally {
		submitLoading.value = false;
	}
}

async function handleUpdateStatus(row: HiringRecord, status: 'accepted' | 'rejected') {
	if (!row.id || row.status !== 'offered') {
		ElMessage.warning('仅 offered 状态可执行该动作');
		return;
	}

	const actionLabel = status === 'accepted' ? '接受录用' : '拒绝录用';
	const confirmed = await confirmElementAction(
		`确认将录用「${row.candidateName}」更新为${actionLabel}吗？`,
		'状态确认'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction<HiringActionType>({
		rowId: row.id,
		actionType: status === 'accepted' ? 'accept' : 'reject',
		request: () => performanceHiringService.updateStatus({ id: row.id!, status }),
		successMessage: status === 'accepted' ? '已标记为接受' : '已标记为拒绝',
		errorMessage: '状态更新失败',
		setLoading: (rowId, actionType) => {
			actionLoadingId.value = rowId;
			actionLoadingType.value = actionType;
		},
		refresh
	});
}

async function handleClose(row: HiringRecord) {
	if (!row.id || row.status !== 'offered') {
		ElMessage.warning('仅 offered 状态可执行关闭');
		return;
	}

	const result = await promptElementAction(
		`请输入录用「${row.candidateName}」的关闭原因`,
		'关闭确认',
		{
			type: 'warning',
			inputType: 'textarea',
			inputPlaceholder: '关闭原因为必填',
			inputValidator: value => {
				if (!String(value || '').trim()) {
					return '请输入关闭原因';
				}
				if (String(value || '').trim().length > 500) {
					return '关闭原因不能超过 500 字';
				}
				return true;
			}
		}
	);

	if (!result) {
		return;
	}

	await runTrackedElementAction<HiringActionType>({
		rowId: row.id,
		actionType: 'close',
		request: () =>
			performanceHiringService.close({
				id: row.id!,
				closeReason: String(result.value || '').trim()
			}),
		successMessage: '录用已关闭',
		errorMessage: '关闭失败',
		setLoading: (rowId, actionType) => {
			actionLoadingId.value = rowId;
			actionLoadingType.value = actionType;
		},
		refresh
	});
}

function canAccept(row: HiringRecord) {
	return checkPerm(performanceHiringService.permission.updateStatus) && row.status === 'offered';
}

function canReject(row: HiringRecord) {
	return checkPerm(performanceHiringService.permission.updateStatus) && row.status === 'offered';
}

function canClose(row: HiringRecord) {
	return checkPerm(performanceHiringService.permission.close) && row.status === 'offered';
}

function statusLabel(status?: HiringStatus | '') {
	return dict.getLabel(HIRING_STATUS_DICT_KEY, status) || status || '-';
}

function statusTagType(status?: HiringStatus | '') {
	return dict.getMeta(HIRING_STATUS_DICT_KEY, status)?.tone || 'info';
}

function sourceTypeLabel(value?: HiringSourceType | string | null) {
	return dict.getLabel(HIRING_SOURCE_TYPE_DICT_KEY, value) || value || '-';
}

function departmentLabel(id?: number | null) {
	if (!id) {
		return '-';
	}

	return departmentOptions.value.find(item => item.id === Number(id))?.label || `部门${id}`;
}

function terminalReadonlyMessage(status: HiringStatus) {
	switch (status) {
		case 'accepted':
			return '当前录用单已接受，处于终态，只允许只读查看。';
		case 'rejected':
			return '当前录用单已拒绝，处于终态，只允许只读查看。';
		case 'closed':
			return '当前录用单已关闭，处于终态，只允许只读查看。';
		default:
			return '当前录用单仅允许只读查看。';
	}
}

function normalizeOptionalText(value: string | null | undefined) {
	const text = String(value || '').trim();
	return text || undefined;
}

function normalizeSourceType(
	value: HiringSourceType | string | null | undefined
): HiringSourceType {
	const normalized = String(value || '').trim();
	const matched = sourceTypeOptions.value.find(item => item.value === normalized)?.value;
	return matched || 'manual';
}

function normalizeInterviewStatus(value: string | undefined): InterviewStatus | null {
	const normalized = String(value || '').trim();
	return normalized === 'scheduled' || normalized === 'completed' || normalized === 'cancelled'
		? normalized
		: null;
}

async function consumeRoutePrefill() {
	await consumeRoutePreset({
		route,
		router,
		keys: [
			'openCreate',
			'candidate',
			'candidateName',
			'departmentId',
			'targetDepartmentId',
			'position',
			'targetPosition',
			'sourceType',
			'sourceId',
			'interviewId',
			'resumePoolId',
			'recruitPlanId',
			'recruitPlanTitle',
			'interviewStatus'
		],
		parse: query => ({
			shouldOpenCreate: firstQueryValue(query.openCreate) === '1',
			candidateName:
				normalizeQueryText(query.candidate) || normalizeQueryText(query.candidateName),
			targetDepartmentId:
				normalizeQueryNumber(query.departmentId) ||
				normalizeQueryNumber(query.targetDepartmentId),
			targetPosition:
				normalizeQueryText(query.position) || normalizeQueryText(query.targetPosition),
			sourceType: normalizeQueryText(query.sourceType),
			sourceId: normalizeQueryNumber(query.sourceId),
			interviewId:
				normalizeQueryNumber(query.interviewId) || normalizeQueryNumber(query.sourceId),
			resumePoolId: normalizeQueryNumber(query.resumePoolId),
			recruitPlanId: normalizeQueryNumber(query.recruitPlanId),
			recruitPlanTitle: normalizeQueryText(query.recruitPlanTitle),
			interviewStatus: normalizeQueryText(query.interviewStatus)
		}),
		shouldConsume: payload => Boolean(payload.shouldOpenCreate),
		consume: payload => {
			if (!showAddButton.value) {
				return;
			}

			openCreateWithPrefill(payload);
		}
	});
}

function openCreateWithPrefill(prefill?: {
	candidateName?: string;
	targetDepartmentId?: number;
	targetPosition?: string;
	sourceType?: string;
	sourceId?: number;
	interviewId?: number;
	resumePoolId?: number;
	recruitPlanId?: number;
	recruitPlanTitle?: string;
	interviewStatus?: string;
}) {
	Object.assign(form, createEmptyHiring(), {
		candidateName: prefill?.candidateName || '',
		targetDepartmentId: prefill?.targetDepartmentId,
		targetPosition: prefill?.targetPosition || '',
		sourceType: prefill?.interviewId ? 'interview' : normalizeSourceType(prefill?.sourceType),
		sourceId: prefill?.interviewId || prefill?.sourceId,
		interviewId: prefill?.interviewId,
		resumePoolId: prefill?.resumePoolId,
		recruitPlanId: prefill?.recruitPlanId,
		sourceStatusSnapshot: prefill?.interviewStatus || '',
		sourceSnapshot:
			prefill?.interviewId || prefill?.resumePoolId || prefill?.recruitPlanId
				? {
						sourceResource: 'interview',
						interviewId: prefill?.interviewId || null,
						resumePoolId: prefill?.resumePoolId || null,
						recruitPlanId: prefill?.recruitPlanId || null,
						recruitPlanTitle: prefill?.recruitPlanTitle || null,
						candidateName: prefill?.candidateName || null,
						targetDepartmentId: prefill?.targetDepartmentId || null,
						targetPosition: prefill?.targetPosition || null,
						interviewStatus: normalizeInterviewStatus(prefill?.interviewStatus),
						sourceStatusSnapshot: prefill?.interviewStatus || null
					}
				: null
	});
	formVisible.value = true;
	nextTick(() => {
		formRef.value?.clearValidate();
	});
}

function hiringSourceSummary(record?: HiringSourceCarrier | null) {
	const snapshot = record?.sourceSnapshot;
	if (!snapshot) {
		return '-';
	}

	const summaryParts = [
		snapshot.interviewId ? `面试 #${snapshot.interviewId}` : null,
		snapshot.resumePoolId ? `简历 #${snapshot.resumePoolId}` : null,
		snapshot.recruitPlanId
			? `${snapshot.recruitPlanTitle || '招聘计划'} #${snapshot.recruitPlanId}`
			: null
	].filter(Boolean);

	return summaryParts.length ? summaryParts.join(' / ') : '-';
}

async function goToInterview(record?: HiringRecord | null) {
	if (!record?.sourceSnapshot?.interviewId) {
		return;
	}

	await router.push({
		path: '/performance/interview',
		query: {
			openDetail: '1',
			interviewId: String(record.sourceSnapshot.interviewId)
		}
	});
}

function normalizeQueryText(value: unknown) {
	const text = String(firstQueryValue(value) || '').trim();
	return text || undefined;
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.management-workspace.scss' as managementWorkspace;

.hiring-page {
	@include managementWorkspace.management-workspace-shell(1180px);

	&__source-cell {
		display: grid;
		gap: 4px;
	}
}
</style>
