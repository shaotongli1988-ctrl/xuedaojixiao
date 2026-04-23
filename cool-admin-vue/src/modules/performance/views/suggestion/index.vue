<!-- 文件职责：承接自动建议引擎 Web 端的列表、详情和人工处理入口；不负责后端建议生成、不负责正式 PIP/晋升单据创建和提交；依赖 suggestion service、既有 PIP/晋升创建页面和详情抽屉组件；维护重点是权限显隐、状态动作与脱敏边界必须严格服从冻结事实源。 -->
<template>
	<div v-if="canAccess" class="suggestion-page">
		<el-card shadow="never">
			<div class="suggestion-page__toolbar">
				<div class="suggestion-page__toolbar-left">
					<el-select
						v-model="filters.suggestionType"
						placeholder="建议类型"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in suggestionTypeOptions"
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
							v-for="item in statusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
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
						v-model="filters.departmentId"
						placeholder="部门"
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
					<el-input
						v-model="filters.assessmentId"
						placeholder="来源评估单 ID"
						clearable
						style="width: 170px"
					/>
					<el-input
						v-model="filters.periodValue"
						placeholder="期间"
						clearable
						style="width: 180px"
					/>
				</div>

				<div class="suggestion-page__toolbar-right">
					<el-button @click="refresh">查询</el-button>
				</div>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="suggestion-page__stat-label">当前页总数</div>
					<div class="suggestion-page__stat-value">{{ rows.length }}</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="suggestion-page__stat-label">待处理</div>
					<div class="suggestion-page__stat-value">
						{{ rows.filter(item => item.status === 'pending').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="suggestion-page__stat-label">已采用</div>
					<div class="suggestion-page__stat-value">
						{{ rows.filter(item => item.status === 'accepted').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="suggestion-page__stat-label">已关闭</div>
					<div class="suggestion-page__stat-value">
						{{
							rows.filter(item =>
								['ignored', 'rejected', 'revoked'].includes(item.status || '')
							).length
						}}
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never">
			<template #header>
				<div class="suggestion-page__header">
					<div class="suggestion-page__header-main">
						<h2>自动建议引擎</h2>
						<el-tag effect="plain">二期主题 4</el-tag>
					</div>
					<el-tag effect="plain" type="info">仅展示建议摘要，不展示敏感全文</el-tag>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="id" label="建议 ID" width="100" />
				<el-table-column label="建议类型" width="120">
					<template #default="{ row }">
						<el-tag effect="plain" :type="suggestionTypeTagType(row.suggestionType)">
							{{ suggestionTypeLabel(row.suggestionType) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="employeeName" label="员工" min-width="120" />
				<el-table-column prop="departmentName" label="部门" min-width="140" />
				<el-table-column prop="assessmentId" label="来源评估单" width="120">
					<template #default="{ row }">
						{{ row.assessmentId || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="期间" min-width="160">
					<template #default="{ row }">
						{{ renderPeriod(row) }}
					</template>
				</el-table-column>
				<el-table-column prop="triggerLabel" label="触发摘要" min-width="220" show-overflow-tooltip />
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="处理摘要" min-width="190">
					<template #default="{ row }">
						<div class="suggestion-page__handle">
							<div>{{ row.handlerName || row.handlerId || '-' }}</div>
							<div class="suggestion-page__handle-time">{{ row.handleTime || '-' }}</div>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="关联单据" min-width="140">
					<template #default="{ row }">
						{{ linkedEntityLabel(row) }}
					</template>
				</el-table-column>
				<el-table-column prop="createTime" label="生成时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="360">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)">详情</el-button>
						<el-button
							v-if="canAccept(row)"
							text
							type="primary"
							@click="handleAccept(row)"
						>
							采用
						</el-button>
						<el-button v-if="canGoCreate(row)" text type="primary" @click="goCreate(row)">
							去创建
						</el-button>
						<el-button v-if="canIgnore(row)" text @click="handleIgnore(row)">忽略</el-button>
						<el-button v-if="canReject(row)" text type="warning" @click="handleReject(row)">
							驳回
						</el-button>
						<el-button v-if="canRevoke(row)" text type="danger" @click="openRevoke(row)">
							撤销
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="suggestion-page__pagination">
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

		<suggestion-detail-drawer
			v-model="detailVisible"
			:suggestion="detailSuggestion"
			:loading="submitLoading"
			:can-accept="detailCanAccept"
			:can-ignore="detailCanIgnore"
			:can-reject="detailCanReject"
			:can-revoke="detailCanRevoke"
			:can-go-create="detailCanGoCreate"
			@accept="handleDetailAccept"
			@ignore="handleDetailIgnore"
			@reject="handleDetailReject"
			@revoke="handleDetailRevoke"
			@go-create="handleDetailGoCreate"
		/>

		<el-dialog
			v-model="revokeVisible"
			title="撤销建议"
			width="520px"
			destroy-on-close
		>
			<el-form label-width="100px">
				<el-form-item label="原因分类" required>
					<el-select v-model="revokeForm.revokeReasonCode" placeholder="请选择原因分类">
						<el-option
							v-for="item in revokeReasonOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</el-form-item>
				<el-form-item label="原因说明" required>
					<el-input
						v-model="revokeForm.revokeReason"
						type="textarea"
						:rows="4"
						placeholder="请填写撤销原因"
						maxlength="200"
						show-word-limit
					/>
				</el-form-item>
			</el-form>

			<template #footer>
				<el-button @click="revokeVisible = false">取消</el-button>
				<el-button type="danger" :loading="submitLoading" @click="submitRevoke">
					确认撤销
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
	name: 'performance-suggestion'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { service } from '/@/cool';
import SuggestionDetailDrawer from '../../components/suggestion-detail-drawer.vue';
import { useListPage } from '../../composables/use-list-page.js';
import { performancePipService } from '../../service/pip';
import { performancePromotionService } from '../../service/promotion';
import { performanceSuggestionService } from '../../service/suggestion';
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
	loadDepartmentOptions,
	loadUserOptions
} from '../../utils/lookup-options.js';
import type {
	DepartmentOption,
	SuggestionAcceptResult,
	SuggestionRecord,
	SuggestionRevokeReasonCode,
	SuggestionType,
	UserOption
} from '../../types';

const SUGGESTION_TYPE_DICT_KEY = 'performance.suggestion.type';
const SUGGESTION_STATUS_DICT_KEY = 'performance.suggestion.status';
const SUGGESTION_REVOKE_REASON_CODE_DICT_KEY = 'performance.suggestion.revokeReasonCode';

const router = useRouter();

const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const { dict } = useDict();
const submitLoading = ref(false);
const detailVisible = ref(false);
const detailSuggestion = ref<SuggestionRecord | null>(null);
const revokeVisible = ref(false);
const revokeTarget = ref<SuggestionRecord | null>(null);

const revokeForm = reactive({
	revokeReasonCode: '' as SuggestionRevokeReasonCode,
	revokeReason: ''
});

const suggestionTypeOptions = computed<Array<{ label: string; value: string }>>(() =>
	dict.get(SUGGESTION_TYPE_DICT_KEY).value.map(item => ({
		label: item.label,
		value: String(item.value)
	}))
);

const statusOptions = computed<Array<{ label: string; value: string }>>(() =>
	dict.get(SUGGESTION_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: String(item.value)
	}))
);

const revokeReasonOptions = computed<Array<{ label: string; value: string }>>(() =>
	dict.get(SUGGESTION_REVOKE_REASON_CODE_DICT_KEY).value.map(item => ({
		label: item.label,
		value: String(item.value)
	}))
);

const canAccess = computed(() => checkPerm(performanceSuggestionService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceSuggestionService.permission.info));
const detailCanAccept = computed(() => (detailSuggestion.value ? canAccept(detailSuggestion.value) : false));
const detailCanIgnore = computed(() => (detailSuggestion.value ? canIgnore(detailSuggestion.value) : false));
const detailCanReject = computed(() => (detailSuggestion.value ? canReject(detailSuggestion.value) : false));
const detailCanRevoke = computed(() => (detailSuggestion.value ? canRevoke(detailSuggestion.value) : false));
const detailCanGoCreate = computed(() =>
	detailSuggestion.value ? canGoCreate(detailSuggestion.value) : false
);
const suggestionList = useListPage({
	createFilters: () => ({
		suggestionType: '' as '' | SuggestionType,
		status: '',
		employeeId: undefined as number | undefined,
		departmentId: undefined as number | undefined,
		assessmentId: '',
		periodValue: ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params =>
		performanceSuggestionService.fetchPage({
			page: params.page,
			size: params.size,
			suggestionType: params.suggestionType || undefined,
			status: params.status || undefined,
			employeeId: params.employeeId,
			departmentId: params.departmentId,
			assessmentId: Number(params.assessmentId || 0) || undefined,
			periodValue: params.periodValue || undefined
		}),
	onError: (error: unknown) => {
		showElementErrorFromError(error, '建议列表加载失败');
	}
});
const rows = suggestionList.rows;
const tableLoading = suggestionList.loading;
const filters = suggestionList.filters;
const pagination = suggestionList.pager;

onMounted(async () => {
	await dict.refresh([
		SUGGESTION_TYPE_DICT_KEY,
		SUGGESTION_STATUS_DICT_KEY,
		SUGGESTION_REVOKE_REASON_CODE_DICT_KEY
	]);
	await loadUsers();
	await loadDepartments();
	await refresh();
});

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
	await suggestionList.reload();
}

function changePage(page: number) {
	void suggestionList.goToPage(page);
}

async function openDetail(row: SuggestionRecord) {
	if (!row.id) {
		return;
	}

	try {
		detailSuggestion.value = await performanceSuggestionService.fetchInfo({
			id: row.id
		});
		detailVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '建议详情加载失败');
	}
}

async function handleAccept(row: SuggestionRecord) {
	if (!row.id) {
		return;
	}

	const confirmed = await confirmElementAction(
		`确认采用这条${suggestionTypeLabel(row.suggestionType)}吗？采用后只会跳转到既有手工创建入口，不会自动提交正式单据。`,
		'采用建议'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: row.id,
		actionType: 'accept',
		request: async () => {
			const result = await performanceSuggestionService.accept({ id: row.id! });
			await goCreate(resolveAcceptTarget(row, result));
		},
		successMessage: '建议已采用，正在跳转到手工创建入口',
		errorMessage: '建议采用失败',
		setLoading: rowId => {
			submitLoading.value = Boolean(rowId);
		}
	});
}

async function handleIgnore(row: SuggestionRecord) {
	if (!row.id) {
		return;
	}

	const confirmed = await confirmElementAction(`确认忽略建议 #${row.id} 吗？`, '忽略建议');

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: row.id,
		actionType: 'ignore',
		request: () => performanceSuggestionService.ignore({ id: row.id! }),
		successMessage: '建议已忽略',
		errorMessage: '建议忽略失败',
		setLoading: rowId => {
			submitLoading.value = Boolean(rowId);
		},
		onSuccess: () => {
			detailVisible.value = false;
		},
		refresh
	});
}

async function handleReject(row: SuggestionRecord) {
	if (!row.id) {
		return;
	}

	const confirmed = await confirmElementAction(`确认驳回建议 #${row.id} 吗？`, '驳回建议');

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: row.id,
		actionType: 'reject',
		request: () => performanceSuggestionService.reject({ id: row.id! }),
		successMessage: '建议已驳回',
		errorMessage: '建议驳回失败',
		setLoading: rowId => {
			submitLoading.value = Boolean(rowId);
		},
		onSuccess: () => {
			detailVisible.value = false;
		},
		refresh
	});
}

function openRevoke(row: SuggestionRecord) {
	revokeTarget.value = row;
	revokeForm.revokeReasonCode = String(
		revokeReasonOptions.value[0]?.value || ''
	) as SuggestionRevokeReasonCode;
	revokeForm.revokeReason = '';
	revokeVisible.value = true;
}

async function submitRevoke() {
	if (!revokeTarget.value?.id) {
		return;
	}

	if (!revokeForm.revokeReason.trim()) {
		ElMessage.error('请填写撤销原因');
		return;
	}

	submitLoading.value = true;

	try {
		await performanceSuggestionService.revoke({
			id: revokeTarget.value.id,
			revokeReasonCode: revokeForm.revokeReasonCode,
			revokeReason: revokeForm.revokeReason.trim()
		});
		ElMessage.success('建议已撤销');
		revokeVisible.value = false;
		detailVisible.value = false;
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '建议撤销失败');
	} finally {
		submitLoading.value = false;
	}
}

function canAccept(row: SuggestionRecord) {
	return (
		row.status === 'pending' &&
		checkPerm(performanceSuggestionService.permission.accept) &&
		hasTargetCreatePermission(row)
	);
}

function canIgnore(row: SuggestionRecord) {
	return row.status === 'pending' && checkPerm(performanceSuggestionService.permission.ignore);
}

function canReject(row: SuggestionRecord) {
	return row.status === 'pending' && checkPerm(performanceSuggestionService.permission.reject);
}

function canRevoke(row: SuggestionRecord) {
	return (
		['pending', 'accepted'].includes(row.status || '') &&
		checkPerm(performanceSuggestionService.permission.revoke)
	);
}

function canGoCreate(row: SuggestionRecord) {
	return row.status === 'accepted' && hasTargetCreatePermission(row);
}

function hasTargetCreatePermission(row: SuggestionRecord) {
	if (row.suggestionType === 'promotion') {
		return checkPerm(performancePromotionService.permission.add);
	}

	return checkPerm(performancePipService.permission.add);
}

function resolveAcceptTarget(
	row: SuggestionRecord,
	result?: SuggestionAcceptResult
): SuggestionRecord {
	const detail = result?.suggestion;
	const prefill = result?.prefill;

	return {
		...row,
		...detail,
		status: detail?.status || 'accepted',
		id: prefill?.suggestionId || detail?.id || row.id,
		suggestionType: prefill?.suggestionType || detail?.suggestionType || row.suggestionType,
		assessmentId: prefill?.assessmentId ?? detail?.assessmentId ?? row.assessmentId,
		employeeId: prefill?.employeeId ?? detail?.employeeId ?? row.employeeId
	};
}

async function goCreate(row: SuggestionRecord) {
	const path = row.suggestionType === 'promotion' ? '/performance/promotion' : '/performance/pip';

	await router.push({
		path,
		query: {
			assessmentId: row.assessmentId ? String(row.assessmentId) : undefined,
			employeeId: row.employeeId ? String(row.employeeId) : undefined,
			suggestionId: row.id ? String(row.id) : undefined,
			suggestionType: row.suggestionType
		}
	});
}

function handleDetailAccept() {
	if (detailSuggestion.value) {
		handleAccept(detailSuggestion.value);
	}
}

function handleDetailIgnore() {
	if (detailSuggestion.value) {
		handleIgnore(detailSuggestion.value);
	}
}

function handleDetailReject() {
	if (detailSuggestion.value) {
		handleReject(detailSuggestion.value);
	}
}

function handleDetailRevoke() {
	if (detailSuggestion.value) {
		openRevoke(detailSuggestion.value);
	}
}

function handleDetailGoCreate() {
	if (detailSuggestion.value) {
		goCreate(detailSuggestion.value);
	}
}

function renderPeriod(row: SuggestionRecord) {
	if (!row.periodValue) {
		return '-';
	}

	return [row.periodType, row.periodValue].filter(Boolean).join(' / ');
}

function suggestionTypeLabel(type?: SuggestionType) {
	return dict.getLabel(SUGGESTION_TYPE_DICT_KEY, type) || type || '-';
}

function statusLabel(status?: string) {
	return dict.getLabel(SUGGESTION_STATUS_DICT_KEY, status) || status || '-';
}

function statusTagType(status?: string) {
	return dict.getMeta(SUGGESTION_STATUS_DICT_KEY, status)?.tone;
}

function suggestionTypeTagType(type?: SuggestionType) {
	return dict.getMeta(SUGGESTION_TYPE_DICT_KEY, type)?.tone || 'info';
}

function linkedEntityLabel(row: SuggestionRecord) {
	if (!row.linkedEntityId || !row.linkedEntityType) {
		return '-';
	}

	const targetLabel =
		dict.getMeta(SUGGESTION_TYPE_DICT_KEY, row.linkedEntityType)?.extra?.targetLabel ||
		row.linkedEntityType;

	return `${targetLabel} #${row.linkedEntityId}`;
}

</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.management-workspace.scss' as managementWorkspace;

.suggestion-page {
	@include managementWorkspace.management-workspace-shell(1120px);

	&__handle {
		display: grid;
		gap: 4px;
	}

	&__handle-time {
		font-size: var(--app-font-size-caption);
		color: var(--app-text-secondary);
	}
}
</style>
