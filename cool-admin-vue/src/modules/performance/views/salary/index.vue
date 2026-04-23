<!-- 文件职责：承载薪资列表、详情、草稿维护、确认归档和调整记录入口；不负责导出、员工端个人薪资页和复杂薪资计算；依赖薪资 service、用户基础服务和调整抽屉组件；维护重点是角色展示统一消费 access-context 事实源，页面权限仍限定薪资主链且 confirmed 后只能走调整记录。 -->
<template>
	<div v-if="canAccess" class="salary-page">
		<el-card shadow="never">
			<div class="salary-page__toolbar">
				<div class="salary-page__toolbar-left">
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
					<el-input
						v-model="filters.periodValue"
						placeholder="按期间筛选"
						clearable
						style="width: 180px"
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
						v-model="filters.effectiveDateStart"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="生效开始日期"
						style="width: 170px"
					/>
					<el-date-picker
						v-model="filters.effectiveDateEnd"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="生效结束日期"
						style="width: 170px"
					/>
				</div>

				<div class="salary-page__toolbar-right">
					<el-button @click="refresh">查询</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新建薪资
					</el-button>
				</div>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="salary-page__stat-label">当前页记录数</div>
					<div class="salary-page__stat-value">{{ rows.length }}</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="salary-page__stat-label">草稿</div>
					<div class="salary-page__stat-value">
						{{ rows.filter(item => item.status === 'draft').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="salary-page__stat-label">已确认</div>
					<div class="salary-page__stat-value">
						{{ rows.filter(item => item.status === 'confirmed').length }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never">
					<div class="salary-page__stat-label">已归档</div>
					<div class="salary-page__stat-value">
						{{ rows.filter(item => item.status === 'archived').length }}
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never">
			<template #header>
				<div class="salary-page__header">
					<h2>薪资管理</h2>
					<el-tag effect="plain">{{ roleFact.roleLabel }}</el-tag>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="employeeName" label="员工" min-width="120" />
				<el-table-column prop="periodValue" label="期间" min-width="120" />
				<el-table-column prop="grade" label="绩效等级" width="100" />
				<el-table-column prop="effectiveDate" label="生效日期" min-width="120" />
				<el-table-column prop="status" label="状态" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="baseSalary" label="基础薪资" min-width="130">
					<template #default="{ row }">
						{{ formatAmount(row.baseSalary) }}
					</template>
				</el-table-column>
				<el-table-column prop="performanceBonus" label="绩效奖金" min-width="130">
					<template #default="{ row }">
						{{ formatAmount(row.performanceBonus) }}
					</template>
				</el-table-column>
				<el-table-column prop="adjustAmount" label="累计调整" min-width="120">
					<template #default="{ row }">
						{{ formatAmount(row.adjustAmount) }}
					</template>
				</el-table-column>
				<el-table-column prop="finalAmount" label="最终金额" min-width="130">
					<template #default="{ row }">
						{{ formatAmount(row.finalAmount) }}
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="360">
					<template #default="{ row }">
						<el-button text @click="openDetail(row)">详情</el-button>
						<el-button
							v-if="canViewSourceAssessment(row)"
							text
							type="primary"
							@click="goSourceAssessment(row.assessmentId!)"
						>
							来源评估单
						</el-button>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button
							v-if="canConfirm(row)"
							text
							type="success"
							@click="handleConfirm(row)"
						>
							确认
						</el-button>
						<el-button
							v-if="canArchive(row)"
							text
							type="warning"
							@click="handleArchive(row)"
						>
							归档
						</el-button>
						<el-button
							v-if="canChange(row)"
							text
							type="danger"
							@click="openChange(row)"
						>
							调整
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="salary-page__pagination">
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
			:title="editingSalary?.id ? '编辑薪资' : '新建薪资'"
			width="760px"
			destroy-on-close
		>
			<el-alert
				v-if="editingSalary?.status === 'confirmed'"
				type="warning"
				show-icon
				:closable="false"
				title="已确认薪资不能直接修改金额，请通过调整记录变更。"
			/>

			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="所属员工" prop="employeeId">
							<el-select
								v-model="form.employeeId"
								placeholder="请选择员工"
								clearable
								filterable
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
						<el-form-item label="关联评估单">
							<el-input-number
								v-model="form.assessmentId"
								:min="1"
								:precision="0"
								controls-position="right"
								placeholder="可选"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="期间" prop="periodValue">
							<el-input v-model="form.periodValue" placeholder="例如：2026-Q1" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="生效日期" prop="effectiveDate">
							<el-date-picker
								v-model="form.effectiveDate"
								type="date"
								value-format="YYYY-MM-DD"
								placeholder="请选择生效日期"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="基础薪资" prop="baseSalary">
							<el-input-number
								v-model="form.baseSalary"
								:min="0"
								:precision="2"
								:step="100"
								controls-position="right"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="绩效奖金" prop="performanceBonus">
							<el-input-number
								v-model="form.performanceBonus"
								:min="0"
								:precision="2"
								:step="100"
								controls-position="right"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="累计调整" prop="adjustAmount">
							<el-input-number
								v-model="form.adjustAmount"
								:precision="2"
								:step="100"
								controls-position="right"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="最终金额" prop="finalAmount">
							<el-input-number
								v-model="form.finalAmount"
								:min="0"
								:precision="2"
								:step="100"
								controls-position="right"
							/>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

			<template #footer>
				<div class="salary-page__dialog-footer">
					<el-button @click="formVisible = false">取消</el-button>
					<el-button type="primary" :loading="submitLoading" @click="submitForm">
						保存
					</el-button>
				</div>
			</template>
		</el-dialog>

		<el-drawer
			v-model="detailVisible"
			title="薪资详情"
			size="720px"
			destroy-on-close
		>
			<template v-if="detailSalary">
				<el-descriptions :column="2" border>
					<el-descriptions-item label="员工">
						{{ detailSalary.employeeName || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="期间">
						{{ detailSalary.periodValue || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="绩效等级">
						{{ detailSalary.grade || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="生效日期">
						{{ detailSalary.effectiveDate || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="基础薪资">
						{{ formatAmount(detailSalary.baseSalary) }}
					</el-descriptions-item>
					<el-descriptions-item label="绩效奖金">
						{{ formatAmount(detailSalary.performanceBonus) }}
					</el-descriptions-item>
					<el-descriptions-item label="累计调整">
						{{ formatAmount(detailSalary.adjustAmount) }}
					</el-descriptions-item>
					<el-descriptions-item label="最终金额">
						{{ formatAmount(detailSalary.finalAmount) }}
					</el-descriptions-item>
					<el-descriptions-item label="状态">
						{{ statusLabel(detailSalary.status) }}
					</el-descriptions-item>
					<el-descriptions-item label="关联评估单">
						{{ detailSalary.assessmentId || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="创建时间">
						{{ detailSalary.createTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间">
						{{ detailSalary.updateTime || '-' }}
					</el-descriptions-item>
				</el-descriptions>

				<div class="salary-page__detail-toolbar">
					<el-button
						v-if="showSourceAssessmentButton && detailSalary?.assessmentId"
						type="primary"
						plain
						@click="goSourceAssessment(detailSalary.assessmentId)"
					>
						查看来源评估单
					</el-button>
					<el-button
						v-if="canChange(detailSalary)"
						type="danger"
						plain
						@click="openChange(detailSalary)"
					>
						新增调整记录
					</el-button>
				</div>

				<el-card shadow="never">
					<template #header>
						<div class="salary-page__subheader">
							<h3>调整记录</h3>
							<el-tag effect="plain">
								{{ detailSalary.changeRecords?.length || 0 }} 条
							</el-tag>
						</div>
					</template>

					<el-table :data="detailSalary.changeRecords || []" border empty-text="暂无调整记录">
						<el-table-column prop="beforeAmount" label="调整前" min-width="120">
							<template #default="{ row }">
								{{ formatAmount(row.beforeAmount) }}
							</template>
						</el-table-column>
						<el-table-column prop="adjustAmount" label="本次调整" min-width="120">
							<template #default="{ row }">
								{{ formatAmount(row.adjustAmount) }}
							</template>
						</el-table-column>
						<el-table-column prop="afterAmount" label="调整后" min-width="120">
							<template #default="{ row }">
								{{ formatAmount(row.afterAmount) }}
							</template>
						</el-table-column>
						<el-table-column prop="changeReason" label="原因" min-width="220" />
						<el-table-column prop="operatorName" label="操作人" min-width="120" />
						<el-table-column prop="createTime" label="时间" min-width="170" />
					</el-table>
				</el-card>
			</template>
		</el-drawer>

		<salary-change-drawer
			v-model="changeVisible"
			:record="changeTarget"
			:loading="submitLoading"
			@submit="submitChange"
		/>
	</div>

	<el-result
		v-else
		icon="warning"
		title="无权限访问"
		:sub-title="salaryDeniedSubtitle"
	/>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useDict } from '/$/dict';
import { service } from '/@/cool';
import { checkPerm } from '/$/base/utils/permission';
import SalaryChangeDrawer from '../../components/salary-change-drawer.vue';
import { useListPage } from '../../composables/use-list-page.js';
import {
	performanceAccessContextService
} from '../../service/access-context';
import { performanceAssessmentService } from '../../service/assessment';
import { resolvePerformanceRoleFact } from '../../service/role-fact';
import { performanceSalaryService } from '../../service/salary';
import { loadUserOptions } from '../../utils/lookup-options.js';
import {
	confirmElementAction,
	runTrackedElementAction
} from '../shared/action-feedback';
import {
	createElementWarningFromErrorHandler,
	resolveErrorMessage,
	showElementErrorFromError,
	showElementWarningFromError
} from '../shared/error-message';
import {
	type PerformanceAccessContext,
	type SalaryRecord,
	type UserOption,
	createEmptySalary
} from '../../types';

const SALARY_STATUS_DICT_KEY = 'performance.salary.status';

const router = useRouter();
const userOptions = ref<UserOption[]>([]);
const { dict } = useDict();
const submitLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const changeVisible = ref(false);
const editingSalary = ref<SalaryRecord | null>(null);
const detailSalary = ref<SalaryRecord | null>(null);
const changeTarget = ref<SalaryRecord | null>(null);
const formRef = ref<FormInstance>();
const accessContext = ref<PerformanceAccessContext | null>(null);
const form = reactive<SalaryRecord>(createEmptySalary());

const rules: FormRules = {
	employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
	periodValue: [{ required: true, message: '请输入期间', trigger: 'blur' }],
	effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
	baseSalary: [{ required: true, message: '请输入基础薪资', trigger: 'change' }],
	performanceBonus: [{ required: true, message: '请输入绩效奖金', trigger: 'change' }],
	adjustAmount: [{ required: true, message: '请输入累计调整', trigger: 'change' }],
	finalAmount: [{ required: true, message: '请输入最终金额', trigger: 'change' }]
};

const statusOptions = computed<Array<{ label: string; value: string }>>(() =>
	dict.get(SALARY_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: String(item.value)
	}))
);

const canAccess = computed(() => checkPerm(performanceSalaryService.permission.page));
const roleFact = computed(() =>
	resolvePerformanceRoleFact({
		personaKey: accessContext.value?.activePersonaKey || null,
		roleKind: accessContext.value?.roleKind || null
	})
);
const salaryDeniedSubtitle = computed(
	() => `当前账号当前为${roleFact.value.roleLabel}，未开通薪资管理页权限。`
);
const showAddButton = computed(() => checkPerm(performanceSalaryService.permission.add));
const showSourceAssessmentButton = computed(() => {
	return (
		checkPerm(performanceAssessmentService.permission.info) &&
		resolveAssessmentPagePath() !== ''
	);
});
const salaryList = useListPage({
	createFilters: () => ({
		employeeId: undefined as number | undefined,
		periodValue: '',
		status: '',
		effectiveDateStart: '',
		effectiveDateEnd: ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params =>
		performanceSalaryService.fetchPage({
			page: params.page,
			size: params.size,
			employeeId: params.employeeId,
			periodValue: params.periodValue || undefined,
			status: params.status || undefined,
			effectiveDateStart: params.effectiveDateStart || undefined,
			effectiveDateEnd: params.effectiveDateEnd || undefined
		}),
	onError: (error: unknown) => {
		showElementErrorFromError(error, '薪资列表加载失败');
	}
});
const rows = salaryList.rows;
const tableLoading = salaryList.loading;
const filters = salaryList.filters;
const pagination = salaryList.pager;

onMounted(async () => {
	await Promise.all([dict.refresh([SALARY_STATUS_DICT_KEY]), loadAccessContext()]);
	await loadUsers();
	await refresh();
});

async function loadAccessContext() {
	try {
		accessContext.value = await performanceAccessContextService.fetchContext();
	} catch (error: unknown) {
		accessContext.value = null;
		showElementWarningFromError(error, '角色上下文加载失败，已使用兼容展示视角');
	}
}

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

async function refresh() {
	await salaryList.reload();
}

function changePage(page: number) {
	void salaryList.goToPage(page);
}

async function goSourceAssessment(assessmentId: number) {
	const path = resolveAssessmentPagePath();

	if (!path) {
		return;
	}

	detailVisible.value = false;

	await router.push({
		path,
		query: {
			openDetail: '1',
			assessmentId: String(assessmentId)
		}
	});
}

function formatAmount(value?: number) {
	return Number(value || 0).toFixed(2);
}

function statusLabel(status?: string) {
	return dict.getLabel(SALARY_STATUS_DICT_KEY, status) || status || '-';
}

function statusTagType(status?: string) {
	return dict.getMeta(SALARY_STATUS_DICT_KEY, status)?.tone || 'info';
}

function openCreate() {
	Object.assign(form, createEmptySalary());
	editingSalary.value = null;
	formVisible.value = true;
}

async function openEdit(row: SalaryRecord) {
	await loadDetail(row.id!, record => {
		editingSalary.value = record;
		Object.assign(form, {
			...createEmptySalary(),
			...record
		});
		formVisible.value = true;
	});
}

async function openDetail(row: SalaryRecord) {
	await loadDetail(row.id!, record => {
		detailSalary.value = record;
		detailVisible.value = true;
	});
}

function openChange(row: SalaryRecord) {
	changeTarget.value = row;
	changeVisible.value = true;
}

async function loadDetail(id: number, next: (record: SalaryRecord) => void) {
	try {
		const record = await performanceSalaryService.fetchInfo({ id });
		next(record);
	} catch (error: unknown) {
		showElementErrorFromError(error, '薪资详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();
	submitLoading.value = true;

	try {
		if (editingSalary.value?.id) {
			await performanceSalaryService.updateSalary({
				...form,
				id: editingSalary.value.id
			});
		} else {
			await performanceSalaryService.createSalary(form);
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

async function handleConfirm(row: SalaryRecord) {
	const confirmed = await confirmElementAction(
		`确认将「${row.employeeName} / ${row.periodValue}」薪资设为已确认吗？`,
		'确认薪资'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: Number(row.id || 0),
		actionType: 'confirm',
		request: () => performanceSalaryService.confirmSalary({ id: row.id! }),
		successMessage: '确认成功',
		errorMessage: '确认失败',
		refresh
	});
}

async function handleArchive(row: SalaryRecord) {
	const confirmed = await confirmElementAction(
		`确认归档「${row.employeeName} / ${row.periodValue}」薪资吗？`,
		'归档薪资'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: Number(row.id || 0),
		actionType: 'archive',
		request: () => performanceSalaryService.archiveSalary({ id: row.id! }),
		successMessage: '归档成功',
		errorMessage: '归档失败',
		refresh
	});
}

async function submitChange(payload: {
	salaryId: number;
	adjustAmount: number;
	changeReason: string;
}) {
	submitLoading.value = true;

	try {
		const record = await performanceSalaryService.addChange(payload);
		changeVisible.value = false;
		changeTarget.value = record;
		detailSalary.value = record;
		ElMessage.success('调整记录已保存');
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '调整失败');
	} finally {
		submitLoading.value = false;
	}
}

function canEdit(row: SalaryRecord) {
	return (
		checkPerm(performanceSalaryService.permission.update) &&
		row.status === 'draft'
	);
}

function canConfirm(row: SalaryRecord) {
	return (
		checkPerm(performanceSalaryService.permission.confirm) &&
		row.status === 'draft'
	);
}

function canArchive(row: SalaryRecord) {
	return (
		checkPerm(performanceSalaryService.permission.archive) &&
		row.status === 'confirmed'
	);
}

function canChange(row: SalaryRecord) {
	return (
		checkPerm(performanceSalaryService.permission.changeAdd) &&
		row.status === 'confirmed'
	);
}

function canViewSourceAssessment(row: SalaryRecord) {
	return Boolean(row.assessmentId) && resolveAssessmentPagePath() !== '';
}

function resolveAssessmentPagePath() {
	if (checkPerm(performanceAssessmentService.permission.page)) {
		return '/performance/initiated';
	}

	if (checkPerm(performanceAssessmentService.permission.myPage)) {
		return '/performance/my-assessment';
	}

	if (checkPerm(performanceAssessmentService.permission.pendingPage)) {
		return '/performance/pending';
	}

	return '';
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.management-workspace.scss' as managementWorkspace;

.salary-page {
	@include managementWorkspace.management-workspace-shell(1180px);

	&__subheader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--app-space-3);

		h3 {
			margin: 0;
			font-size: var(--app-font-size-title);
		}
	}

	&__detail-toolbar {
		display: flex;
		justify-content: flex-end;
		gap: var(--app-space-3);
		padding: var(--app-space-4) 0;
	}

	@media (max-width: 768px) {
		&__subheader,
		&__detail-toolbar {
			flex-direction: column;
			align-items: stretch;
		}
	}
}
</style>
