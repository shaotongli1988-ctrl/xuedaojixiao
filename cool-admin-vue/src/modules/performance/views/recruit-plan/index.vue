<!-- 文件职责：承接主题16招聘计划管理的列表、详情、新建、编辑、删除、导入、导出、提交、关闭、作废和重新开启主链；不负责审批流、职位标准绑定或跨主题自动联动；依赖 recruitPlan service、既有 excel/上传能力与基础用户部门接口；维护重点是 recruitPlan 资源命名、动作显隐和 draft/active/voided/closed 状态门禁必须与冻结口径一致。 -->
<template>
	<div v-if="canAccess" class="recruit-plan-page">
		<el-card shadow="never">
			<div class="recruit-plan-page__toolbar">
				<div class="recruit-plan-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="标题 / 岗位关键字"
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

				<div class="recruit-plan-page__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button
						v-if="showImportButton"
						:loading="importLoading"
						@click="triggerImportSelection"
					>
						导入
					</el-button>
					<el-button
						v-if="showExportButton"
						:loading="exportLoading"
						@click="handleExport"
					>
						导出
					</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新建招聘计划
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="recruit-plan-page__header">
					<div class="recruit-plan-page__header-main">
						<h2>招聘计划管理</h2>
						<el-tag effect="plain">主题 16</el-tag>
					</div>
					<el-alert
						title="页面只展示冻结允许的招聘计划摘要字段。draft 可编辑/删除/提交，active 可关闭/作废，closed / voided 仅可重新开启。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="title" label="计划标题" min-width="180" />
				<el-table-column label="目标部门" min-width="150">
					<template #default="{ row }">
						{{ row.targetDepartmentName || departmentLabel(row.targetDepartmentId) }}
					</template>
				</el-table-column>
				<el-table-column prop="positionName" label="目标岗位" min-width="140" />
				<el-table-column prop="headcount" label="人数" width="90" />
				<el-table-column label="计划周期" min-width="220">
					<template #default="{ row }">
						{{ formatDateRange(row.startDate, row.endDate) }}
					</template>
				</el-table-column>
				<el-table-column label="负责人" min-width="140">
					<template #default="{ row }">
						{{ row.recruiterName || recruiterLabel(row.recruiterId) }}
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
				<el-table-column label="操作" fixed="right" min-width="420">
					<template #default="{ row }">
						<div class="recruit-plan-page__actions">
							<el-button v-if="showInfoButton" text @click="openDetail(row)"
								>详情</el-button
							>
							<el-button
								v-if="canEdit(row)"
								text
								type="primary"
								@click="openEdit(row)"
							>
								编辑
							</el-button>
							<el-button
								v-if="canDelete(row)"
								text
								type="danger"
								:loading="
									actionLoadingId === row.id && actionLoadingType === 'delete'
								"
								@click="handleDelete(row)"
							>
								删除
							</el-button>
							<el-button
								v-if="canSubmit(row)"
								text
								type="success"
								:loading="
									actionLoadingId === row.id && actionLoadingType === 'submit'
								"
								@click="handleSubmit(row)"
							>
								提交
							</el-button>
							<el-button
								v-if="canClose(row)"
								text
								type="warning"
								:loading="
									actionLoadingId === row.id && actionLoadingType === 'close'
								"
								@click="handleClose(row)"
							>
								关闭
							</el-button>
							<el-button
								v-if="canVoid(row)"
								text
								type="danger"
								:loading="
									actionLoadingId === row.id && actionLoadingType === 'void'
								"
								@click="handleVoid(row)"
							>
								作废
							</el-button>
							<el-button
								v-if="canReopen(row)"
								text
								type="primary"
								:loading="
									actionLoadingId === row.id && actionLoadingType === 'reopen'
								"
								@click="handleReopen(row)"
							>
								重新开启
							</el-button>
						</div>
					</template>
				</el-table-column>
			</el-table>

			<div class="recruit-plan-page__pagination">
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

		<el-dialog v-model="detailVisible" title="招聘计划详情" width="900px" destroy-on-close>
			<div v-if="detailRecord" class="recruit-plan-page__detail">
				<el-alert
					v-if="detailRecord.status !== 'draft'"
					:title="detailReadonlyMessage(detailRecord.status)"
					type="warning"
					:closable="false"
					show-icon
				/>
				<el-descriptions :column="2" border>
					<el-descriptions-item label="计划标题">
						{{ detailRecord.title }}
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
						{{ detailRecord.positionName }}
					</el-descriptions-item>
					<el-descriptions-item label="计划人数">
						{{ detailRecord.headcount }}
					</el-descriptions-item>
					<el-descriptions-item label="负责人">
						{{ detailRecord.recruiterName || recruiterLabel(detailRecord.recruiterId) }}
					</el-descriptions-item>
					<el-descriptions-item label="开始日期">
						{{ detailRecord.startDate || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="结束日期">
						{{ detailRecord.endDate || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="需求摘要" :span="2">
						<div class="recruit-plan-page__summary">
							{{ detailRecord.requirementSummary || '-' }}
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="来源摘要" :span="2">
						<div class="recruit-plan-page__source-summary">
							<span>{{ recruitPlanSourceSummary(detailRecord) }}</span>
							<el-button
								v-if="detailRecord.jobStandardId"
								text
								type="primary"
								@click="goToJobStandardSource(detailRecord)"
							>
								查看职位标准
							</el-button>
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
				<div class="recruit-plan-page__dialog-footer">
					<el-button @click="detailVisible = false">关闭</el-button>
					<el-button
						v-if="canCreateResumeFromRecruitPlan"
						type="primary"
						@click="goCreateResumePool(detailRecord)"
					>
						新建简历
					</el-button>
				</div>
			</template>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingRecord?.id ? '编辑招聘计划' : '新建招聘计划'"
			width="900px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
				<el-alert
					:title="
						editingRecord?.id
							? '仅 draft 招聘计划可编辑；状态流转请使用提交 / 关闭 / 作废 / 重新开启动作。'
							: '新建保存后默认进入 draft 状态。'
					"
					:type="editingRecord?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-alert
					v-if="recruitPlanSourceSummary(form) !== '-'"
					:title="`来源摘要：${recruitPlanSourceSummary(form)}`"
					type="info"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="计划标题" prop="title">
							<el-input
								v-model="form.title"
								maxlength="200"
								show-word-limit
								placeholder="请输入招聘计划标题"
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
						<el-form-item label="目标岗位" prop="positionName">
							<el-input
								v-model="form.positionName"
								maxlength="100"
								show-word-limit
								placeholder="请输入目标岗位"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="计划人数" prop="headcount">
							<el-input-number
								v-model="headcountModel"
								:min="1"
								:precision="0"
								:step="1"
								step-strictly
								controls-position="right"
								style="width: 100%"
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
						<el-form-item label="招聘负责人">
							<el-select
								v-model="formRecruiterIdModel"
								placeholder="可选"
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
					</el-col>
					<el-col :span="24">
						<el-form-item label="需求摘要" prop="requirementSummary">
							<el-input
								v-model="form.requirementSummary"
								type="textarea"
								:rows="5"
								maxlength="2000"
								show-word-limit
								placeholder="请输入招聘需求摘要"
							/>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

			<template #footer>
				<div class="recruit-plan-page__dialog-footer">
					<el-button @click="formVisible = false">取消</el-button>
					<el-button type="primary" :loading="submitLoading" @click="submitForm">
						保存
					</el-button>
				</div>
			</template>
		</el-dialog>

		<input
			ref="importInputRef"
			class="recruit-plan-page__import-input"
			type="file"
			:accept="importAccept"
			@change="handleImportInputChange"
		/>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-recruit-plan'
});

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import * as XLSX from 'xlsx';
import chardet from 'chardet';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { service } from '/@/cool';
import { extname } from '/@/cool/utils';
import { exportJsonToExcel } from '/@/plugins/excel/utils';
import { useUpload } from '/@/plugins/upload/hooks';
import { getType as getUploadFileType } from '/@/plugins/upload/utils';
import { useRoute, useRouter } from 'vue-router';
import { useListPage } from '../../composables/use-list-page.js';
import {
	createElementWarningFromErrorHandler,
	showElementErrorFromError
} from '../shared/error-message';
import { confirmElementAction, runTrackedElementAction } from '../shared/action-feedback';
import { performanceRecruitPlanService } from '../../service/recruit-plan';
import type { RecruitPlanSaveRequest } from '../../types';
import { performanceResumePoolService } from '../../service/resumePool';
import { loadDepartmentOptions, loadUserOptions } from '../../utils/lookup-options.js';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';
import {
	type DepartmentOption,
	type RecruitPlanExportRow,
	type RecruitPlanImportCellValue,
	type RecruitPlanImportRow,
	type RecruitPlanRecord,
	type RecruitPlanStatus,
	type UserOption,
	createEmptyRecruitPlan,
	normalizeRecruitPlanDomainRecord
} from '../../types';

const RECRUIT_PLAN_STATUS_DICT_KEY = 'performance.recruitPlan.status';

type RecruitPlanActionType = 'delete' | 'submit' | 'close' | 'void' | 'reopen';

const importAccept =
	'.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';
const importPrefixPath = 'app/performance/recruit-plan/import';

const { toUpload } = useUpload();
const { dict } = useDict();

const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const submitLoading = ref(false);
const importLoading = ref(false);
const exportLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const editingRecord = ref<RecruitPlanRecord | null>(null);
const detailRecord = ref<RecruitPlanRecord | null>(null);
const actionLoadingId = ref<number | null>(null);
const actionLoadingType = ref<RecruitPlanActionType | null>(null);
const formRef = ref<FormInstance>();
const importInputRef = ref<HTMLInputElement>();
const route = useRoute();
const router = useRouter();

const form = reactive<RecruitPlanRecord>(createEmptyRecruitPlan());

const rules: FormRules = {
	title: [
		{ required: true, message: '请输入招聘计划标题', trigger: 'blur' },
		{ max: 200, message: '标题长度不能超过 200', trigger: 'blur' }
	],
	targetDepartmentId: [{ required: true, message: '请选择目标部门', trigger: 'change' }],
	positionName: [
		{ required: true, message: '请输入目标岗位', trigger: 'blur' },
		{ max: 100, message: '目标岗位长度不能超过 100', trigger: 'blur' }
	],
	headcount: [
		{ required: true, message: '请输入计划人数', trigger: 'change' },
		{
			validator: (_rule, value, callback) => {
				if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
					callback(new Error('计划人数必须为正整数'));
					return;
				}

				callback();
			},
			trigger: 'change'
		}
	],
	startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
	endDate: [
		{ required: true, message: '请选择结束日期', trigger: 'change' },
		{
			validator: (_rule, value, callback) => {
				if (!value || !form.startDate) {
					callback();
					return;
				}

				if (value < form.startDate) {
					callback(new Error('结束日期不能早于开始日期'));
					return;
				}

				callback();
			},
			trigger: 'change'
		}
	],
	requirementSummary: [{ max: 2000, message: '需求摘要长度不能超过 2000', trigger: 'blur' }]
};

const statusOptions = computed<Array<{ label: string; value: RecruitPlanStatus }>>(() =>
	dict.get(RECRUIT_PLAN_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as RecruitPlanStatus
	}))
);

const canAccess = computed(() => checkPerm(performanceRecruitPlanService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceRecruitPlanService.permission.info));
const showAddButton = computed(() => checkPerm(performanceRecruitPlanService.permission.add));
const showImportButton = computed(() => checkPerm(performanceRecruitPlanService.permission.import));
const showExportButton = computed(() => checkPerm(performanceRecruitPlanService.permission.export));
const canCreateResumeFromRecruitPlan = computed(() =>
	checkPerm(performanceResumePoolService.permission.add)
);
const recruitPlanList = useListPage({
	createFilters: () => ({
		keyword: '',
		targetDepartmentId: undefined as number | undefined,
		status: '' as RecruitPlanStatus | '',
		startDate: '',
		endDate: ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params => {
		const result = await performanceRecruitPlanService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: params.keyword || undefined,
			targetDepartmentId: params.targetDepartmentId || undefined,
			status: params.status || undefined,
			startDate: params.startDate || undefined,
			endDate: params.endDate || undefined
		});

		return {
			...result,
			list: (result.list || []).map(item => normalizeRecruitPlanDomainRecord(item))
		};
	},
	onError: (error: unknown) => {
		showElementErrorFromError(error, '招聘计划列表加载失败');
	}
});
const rows = recruitPlanList.rows;
const tableLoading = recruitPlanList.loading;
const filters = recruitPlanList.filters;
const pagination = recruitPlanList.pager;
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
const formRecruiterIdModel = computed<number | undefined>({
	get: () => form.recruiterId ?? undefined,
	set: value => {
		form.recruiterId = value ?? undefined;
	}
});
const headcountModel = computed<number>({
	get: () => Number(form.headcount || 1),
	set: value => {
		form.headcount = Number(value || 1);
	}
});

onMounted(async () => {
	await dict.refresh([RECRUIT_PLAN_STATUS_DICT_KEY]);
	await Promise.all([loadUsers(), loadDepartments()]);
	await refresh();
	await consumeRouteOpenDetail();
	await consumeRoutePrefill();
});

watch(
	() => route.fullPath,
	() => {
		void consumeRouteOpenDetail();
		void consumeRoutePrefill();
	}
);

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
	await recruitPlanList.reload();
}

function handleSearch() {
	void recruitPlanList.search();
}

function handleReset() {
	void recruitPlanList.reset({
		targetDepartmentId: undefined
	});
}

function changePage(page: number) {
	void recruitPlanList.goToPage(page);
}

function openCreate() {
	openCreateWithPrefill();
}

async function openEdit(row: RecruitPlanRecord) {
	if (!canEdit(row)) {
		ElMessage.warning(detailReadonlyMessage(row.status));
		return;
	}

	await loadDetail(row.id!, record => {
		if (record.status !== 'draft') {
			ElMessage.warning(detailReadonlyMessage(record.status));
			return;
		}

		editingRecord.value = record;
		Object.assign(form, createEmptyRecruitPlan(), {
			...record,
			targetDepartmentId: record.targetDepartmentId ?? undefined,
			recruiterId: record.recruiterId ?? undefined,
			requirementSummary: record.requirementSummary || '',
			status: record.status || 'draft'
		});
		formVisible.value = true;

		nextTick(() => {
			formRef.value?.clearValidate();
		});
	});
}

async function openDetail(row: RecruitPlanRecord) {
	await loadDetail(row.id!, record => {
		detailRecord.value = record;
		detailVisible.value = true;
	});
}

async function loadDetail(id: number, next: (record: RecruitPlanRecord) => void) {
	try {
		const record = await performanceRecruitPlanService.fetchInfo({ id });
		next(normalizeRecruitPlanDomainRecord(record));
	} catch (error: unknown) {
		showElementErrorFromError(error, '招聘计划详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();

	if (editingRecord.value?.status && editingRecord.value.status !== 'draft') {
		ElMessage.error(detailReadonlyMessage(editingRecord.value.status));
		return;
	}

	if (form.endDate < form.startDate) {
		ElMessage.error('结束日期不能早于开始日期');
		return;
	}

	submitLoading.value = true;

	try {
		const payload: RecruitPlanSaveRequest = {
			title: form.title.trim(),
			targetDepartmentId: Number(form.targetDepartmentId),
			positionName: form.positionName.trim(),
			headcount: Number(form.headcount),
			startDate: form.startDate,
			endDate: form.endDate,
			recruiterId: form.recruiterId || undefined,
			requirementSummary: normalizeOptionalText(form.requirementSummary),
			jobStandardId: form.jobStandardId || undefined
		};

		if (editingRecord.value?.id) {
			await performanceRecruitPlanService.updateRecruitPlan({
				id: editingRecord.value.id,
				...payload
			});
		} else {
			await performanceRecruitPlanService.createRecruitPlan(payload);
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

function triggerImportSelection() {
	if (importLoading.value) {
		return;
	}

	if (importInputRef.value) {
		importInputRef.value.value = '';
		importInputRef.value.click();
	}
}

async function handleImportInputChange(event: Event) {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	input.value = '';

	if (!file) {
		return;
	}

	await handleImport(file);
}

async function handleImport(file: File) {
	const extension = extname(file.name).toLowerCase();

	if (!['xlsx', 'xls', 'csv'].includes(extension)) {
		ElMessage.warning('仅支持导入 xlsx / xls / csv 文件');
		return;
	}

	importLoading.value = true;

	try {
		const parsedRows = await parseImportRows(file);

		if (!parsedRows.length) {
			ElMessage.warning('导入文件没有可用数据');
			return;
		}

		const spaceInfoId = await uploadImportFileToSpace(file);

		await performanceRecruitPlanService.importRecruitPlan({
			fileId: spaceInfoId,
			rows: parsedRows
		});

		ElMessage.success(`导入成功，已提交 ${parsedRows.length} 行`);
		pagination.page = 1;
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '导入失败');
	} finally {
		importLoading.value = false;
	}
}

async function uploadImportFileToSpace(file: File) {
	const uploaded = await toUpload(file, {
		prefixPath: importPrefixPath
	});
	const spaceInfo = await service.space.info.add({
		fileId: uploaded.fileId,
		key: uploaded.key,
		url: uploaded.url,
		name: file.name,
		size: file.size,
		type: resolveUploadType(file.type)
	});
	const spaceInfoId = Number(spaceInfo?.id);

	if (!spaceInfoId) {
		throw new Error('导入文件归档失败');
	}

	return spaceInfoId;
}

async function handleExport() {
	exportLoading.value = true;

	try {
		const response = await performanceRecruitPlanService.exportRecruitPlanSummary({
			keyword: filters.keyword || undefined,
			targetDepartmentId: filters.targetDepartmentId || undefined,
			status: filters.status || undefined,
			startDate: filters.startDate || undefined,
			endDate: filters.endDate || undefined
		});
		const exportRows = extractExportRows(response);

		if (!exportRows.length) {
			ElMessage.warning('当前筛选条件下无可导出数据');
			return;
		}

		exportJsonToExcel({
			header: [
				'计划标题',
				'目标部门',
				'目标岗位',
				'人数',
				'开始日期',
				'结束日期',
				'负责人',
				'状态',
				'创建时间',
				'更新时间'
			],
			data: exportRows.map(item => [
				item.title || '',
				item.targetDepartmentName || departmentLabel(item.targetDepartmentId),
				item.positionName || '',
				Number(item.headcount || 0),
				item.startDate || '',
				item.endDate || '',
				item.recruiterName || recruiterLabel(item.recruiterId),
				statusLabel(item.status),
				item.createTime || '',
				item.updateTime || ''
			]),
			filename: `招聘计划摘要_${Date.now()}`,
			autoWidth: true
		});
		ElMessage.success('导出成功');
	} catch (error: unknown) {
		showElementErrorFromError(error, '导出失败');
	} finally {
		exportLoading.value = false;
	}
}

async function handleDelete(row: RecruitPlanRecord) {
	await confirmAndRunRowAction({
		row,
		actionType: 'delete',
		confirmTitle: '删除确认',
		confirmMessage: `确认删除草稿招聘计划「${row.title}」吗？删除后不可恢复。`,
		successMessage: '删除成功',
		request: () => performanceRecruitPlanService.removeRecruitPlan({ id: row.id! }),
		onSuccess: () => {
			if (rows.value.length === 1 && pagination.page > 1) {
				pagination.page -= 1;
			}
		}
	});
}

async function handleSubmit(row: RecruitPlanRecord) {
	await confirmAndRunRowAction({
		row,
		actionType: 'submit',
		confirmTitle: '提交确认',
		confirmMessage: `确认提交备案并生效招聘计划「${row.title}」吗？`,
		successMessage: '提交成功',
		request: () => performanceRecruitPlanService.submitRecruitPlan({ id: row.id! })
	});
}

async function handleClose(row: RecruitPlanRecord) {
	await confirmAndRunRowAction({
		row,
		actionType: 'close',
		confirmTitle: '关闭确认',
		confirmMessage: `确认关闭招聘计划「${row.title}」吗？关闭后可通过“重新开启”恢复为生效中。`,
		successMessage: '关闭成功',
		request: () => performanceRecruitPlanService.closeRecruitPlan({ id: row.id! })
	});
}

async function handleVoid(row: RecruitPlanRecord) {
	await confirmAndRunRowAction({
		row,
		actionType: 'void',
		confirmTitle: '作废确认',
		confirmMessage: `确认作废招聘计划「${row.title}」吗？作废后可通过“重新开启”恢复为生效中。`,
		successMessage: '作废成功',
		request: () => performanceRecruitPlanService.voidRecruitPlan({ id: row.id! })
	});
}

async function handleReopen(row: RecruitPlanRecord) {
	const actionLabel = row.status === 'voided' ? '已作废招聘计划' : '已关闭招聘计划';

	await confirmAndRunRowAction({
		row,
		actionType: 'reopen',
		confirmTitle: '重新开启确认',
		confirmMessage: `确认重新开启${actionLabel}「${row.title}」吗？`,
		successMessage: '重新开启成功',
		request: () => performanceRecruitPlanService.reopenRecruitPlan({ id: row.id! })
	});
}

async function confirmAndRunRowAction(options: {
	row: RecruitPlanRecord;
	actionType: RecruitPlanActionType;
	confirmTitle: string;
	confirmMessage: string;
	successMessage: string;
	request: () => Promise<unknown>;
	onSuccess?: () => void;
}) {
	if (!options.row.id) {
		return;
	}

	const confirmed = await confirmElementAction(options.confirmMessage, options.confirmTitle);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: options.row.id,
		actionType: options.actionType,
		request: options.request,
		successMessage: options.successMessage,
		errorMessage: `${options.confirmTitle.replace('确认', '')}失败`,
		setLoading: (rowId, actionType) => {
			actionLoadingId.value = rowId;
			actionLoadingType.value = actionType;
		},
		onSuccess: options.onSuccess,
		refresh
	});
}

function canEdit(row: RecruitPlanRecord) {
	return checkPerm(performanceRecruitPlanService.permission.update) && row.status === 'draft';
}

function canDelete(row: RecruitPlanRecord) {
	return checkPerm(performanceRecruitPlanService.permission.delete) && row.status === 'draft';
}

function canSubmit(row: RecruitPlanRecord) {
	return checkPerm(performanceRecruitPlanService.permission.submit) && row.status === 'draft';
}

function canClose(row: RecruitPlanRecord) {
	return checkPerm(performanceRecruitPlanService.permission.close) && row.status === 'active';
}

function canVoid(row: RecruitPlanRecord) {
	return checkPerm(performanceRecruitPlanService.permission.void) && row.status === 'active';
}

function canReopen(row: RecruitPlanRecord) {
	return (
		checkPerm(performanceRecruitPlanService.permission.reopen) &&
		['closed', 'voided'].includes(row.status || '')
	);
}

function statusLabel(status?: RecruitPlanStatus | '') {
	return dict.getLabel(RECRUIT_PLAN_STATUS_DICT_KEY, status) || status || '-';
}

function statusTagType(status?: RecruitPlanStatus | '') {
	return dict.getMeta(RECRUIT_PLAN_STATUS_DICT_KEY, status)?.tone || 'info';
}

function detailReadonlyMessage(status?: RecruitPlanStatus) {
	switch (status) {
		case 'active':
			return '当前招聘计划已生效，不提供编辑入口；如需结束请使用关闭或作废动作。';
		case 'closed':
			return '当前招聘计划已关闭，仅允许只读查看；如需恢复请使用重新开启动作。';
		case 'voided':
			return '当前招聘计划已作废，仅允许只读查看；如需恢复请使用重新开启动作。';
		default:
			return '仅 draft 招聘计划允许编辑、删除和提交。';
	}
}

function departmentLabel(id?: number | null) {
	if (!id) {
		return '-';
	}

	return departmentOptions.value.find(item => item.id === Number(id))?.label || `部门${id}`;
}

function recruiterLabel(id?: number | null) {
	if (!id) {
		return '-';
	}

	return userOptions.value.find(item => item.id === Number(id))?.name || `员工${id}`;
}

async function consumeRoutePrefill() {
	await consumeRoutePreset({
		route,
		router,
		keys: [
			'openCreate',
			'targetDepartmentId',
			'positionName',
			'requirementSummary',
			'jobStandardId',
			'jobStandardPositionName',
			'jobStandardRequirementSummary'
		],
		parse: query => ({
			shouldOpenCreate: firstQueryValue(query.openCreate) === '1',
			targetDepartmentId: normalizeQueryNumber(query.targetDepartmentId),
			positionName: normalizeQueryText(query.positionName),
			requirementSummary:
				normalizeQueryText(query.requirementSummary) ||
				normalizeQueryText(query.jobStandardRequirementSummary),
			jobStandardId: normalizeQueryNumber(query.jobStandardId),
			jobStandardPositionName: normalizeQueryText(query.jobStandardPositionName)
		}),
		shouldConsume: payload => Boolean(payload.shouldOpenCreate),
		consume: payload => {
			if (!showAddButton.value) {
				return;
			}

			openCreateWithPrefill({
				targetDepartmentId: payload.targetDepartmentId,
				positionName: payload.positionName || payload.jobStandardPositionName,
				requirementSummary: payload.requirementSummary,
				jobStandardId: payload.jobStandardId,
				jobStandardPositionName: payload.jobStandardPositionName
			});
		}
	});
}

async function consumeRouteOpenDetail() {
	await consumeRoutePreset({
		route,
		router,
		keys: ['openDetail', 'recruitPlanId'],
		parse: query => ({
			shouldOpenDetail: firstQueryValue(query.openDetail) === '1',
			recruitPlanId: normalizeQueryNumber(query.recruitPlanId)
		}),
		shouldConsume: payload => Boolean(payload.shouldOpenDetail && payload.recruitPlanId),
		consume: async payload => {
			if (!showInfoButton.value || !payload.recruitPlanId) {
				return;
			}

			await loadDetail(payload.recruitPlanId, record => {
				detailRecord.value = record;
				detailVisible.value = true;
			});
		}
	});
}

function openCreateWithPrefill(prefill?: {
	targetDepartmentId?: number;
	positionName?: string;
	requirementSummary?: string;
	jobStandardId?: number;
	jobStandardPositionName?: string;
}) {
	Object.assign(form, createEmptyRecruitPlan(), {
		targetDepartmentId: prefill?.targetDepartmentId,
		positionName: prefill?.positionName || '',
		requirementSummary: prefill?.requirementSummary || '',
		jobStandardId: prefill?.jobStandardId,
		jobStandardPositionName: prefill?.jobStandardPositionName,
		sourceSnapshot: prefill?.jobStandardId
			? {
					sourceResource: 'jobStandard',
					jobStandardId: prefill.jobStandardId,
					jobStandardPositionName:
						prefill.jobStandardPositionName || prefill.positionName || null,
					jobStandardRequirementSummary: prefill.requirementSummary || null
				}
			: null
	});
	editingRecord.value = null;
	formVisible.value = true;

	nextTick(() => {
		formRef.value?.clearValidate();
	});
}

function recruitPlanSourceLabel(record?: RecruitPlanRecord | null) {
	const snapshot = record?.sourceSnapshot;
	if (!snapshot?.jobStandardId) {
		return '-';
	}

	const positionName =
		snapshot.jobStandardPositionName || record?.jobStandardPositionName || '职位标准';
	return `${positionName} #${snapshot.jobStandardId}`;
}

function recruitPlanSourceSummary(record?: RecruitPlanRecord | null) {
	const label = recruitPlanSourceLabel(record);
	const requirementSummary =
		record?.sourceSnapshot?.jobStandardRequirementSummary ||
		record?.jobStandardSummary?.jobStandardRequirementSummary ||
		record?.jobStandardSnapshot?.jobStandardRequirementSummary ||
		record?.requirementSummary ||
		'';

	if (!requirementSummary) {
		return label;
	}

	return label === '-' ? `要求：${requirementSummary}` : `${label}；要求：${requirementSummary}`;
}

async function goToJobStandardSource(record?: RecruitPlanRecord | null) {
	const jobStandardId = record?.jobStandardId || record?.sourceSnapshot?.jobStandardId;
	if (!jobStandardId) {
		return;
	}

	await router.push({
		path: '/performance/job-standard',
		query: {
			openDetail: '1',
			jobStandardId: String(jobStandardId)
		}
	});
}

async function goCreateResumePool(record?: RecruitPlanRecord | null) {
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
			recruitPlanId: String(record.id),
			recruitPlanTitle: record.title || undefined,
			recruitPlanStatus: record.status || undefined,
			jobStandardId: record.jobStandardId ? String(record.jobStandardId) : undefined,
			jobStandardPositionName:
				record.jobStandardPositionName ||
				record.sourceSnapshot?.jobStandardPositionName ||
				undefined,
			jobStandardRequirementSummary:
				record.sourceSnapshot?.jobStandardRequirementSummary ||
				record.jobStandardSummary?.jobStandardRequirementSummary ||
				record.jobStandardSnapshot?.jobStandardRequirementSummary ||
				undefined
		}
	});
}

function normalizeQueryText(value: unknown) {
	const text = String(firstQueryValue(value) || '').trim();
	return text || undefined;
}

function normalizeOptionalText(value: string | null | undefined) {
	const text = String(value || '').trim();
	return text || undefined;
}

function formatDateRange(startDate?: string, endDate?: string) {
	if (!startDate && !endDate) {
		return '-';
	}

	return `${startDate || '-'} ~ ${endDate || '-'}`;
}

function resolveUploadType(mimeType?: string) {
	const primaryType = String(mimeType || '')
		.split('/')[0]
		.trim();
	return primaryType || 'file';
}

async function parseImportRows(file: File) {
	const extension = extname(file.name).toLowerCase();
	let workbook: XLSX.WorkBook;

	if (extension === 'csv') {
		const buffer = await readFileAsArrayBuffer(file);
		const content = decodeCsvBuffer(buffer);
		workbook = XLSX.read(content, {
			type: 'string',
			raw: true
		});
	} else {
		const binary = await readFileAsBinaryString(file);
		workbook = XLSX.read(binary, {
			type: 'binary',
			raw: false
		});
	}

	return parseWorkbookRows(workbook);
}

function parseWorkbookRows(workbook: XLSX.WorkBook) {
	const parsedRows: RecruitPlanImportRow[] = [];

	for (const sheetName of workbook.SheetNames) {
		const sheet = workbook.Sheets[sheetName];

		if (!sheet) {
			continue;
		}

		const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
			raw: false,
			dateNF: 'yyyy-mm-dd',
			defval: ''
		});

		parsedRows.push(...sheetRows.map(sanitizeImportRow).filter(item => hasImportContent(item)));
	}

	return parsedRows;
}

function sanitizeImportRow(row: Record<string, unknown>) {
	const sanitized: RecruitPlanImportRow = {};

	for (const [key, value] of Object.entries(row || {})) {
		const normalizedKey = String(key || '').trim();

		if (!normalizedKey) {
			continue;
		}

		sanitized[normalizedKey] = normalizeImportCellValue(value);
	}

	return sanitized;
}

function normalizeImportCellValue(value: unknown): RecruitPlanImportCellValue {
	if (value == null) {
		return '';
	}

	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : '';
	}

	if (typeof value === 'string') {
		return value.trim();
	}

	return String(value).trim();
}

function hasImportContent(row: RecruitPlanImportRow) {
	return Object.values(row).some(value => {
		if (typeof value === 'number') {
			return true;
		}

		return Boolean(String(value ?? '').trim());
	});
}

function decodeCsvBuffer(buffer: ArrayBuffer) {
	const bytes = new Uint8Array(buffer);
	const encoding = chardet.detect(bytes);

	try {
		return new TextDecoder(typeof encoding === 'string' ? encoding : 'utf-8').decode(buffer);
	} catch {
		return new TextDecoder('utf-8').decode(buffer);
	}
}

function readFileAsArrayBuffer(file: File) {
	return new Promise<ArrayBuffer>((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = event => {
			const result = event.target?.result;

			if (result instanceof ArrayBuffer) {
				resolve(result);
				return;
			}

			reject(new Error('导入文件读取失败'));
		};
		reader.onerror = () => reject(new Error('导入文件读取失败'));
		reader.readAsArrayBuffer(file);
	});
}

function readFileAsBinaryString(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = event => {
			const result = event.target?.result;

			if (typeof result === 'string') {
				resolve(result);
				return;
			}

			reject(new Error('导入文件读取失败'));
		};
		reader.onerror = () => reject(new Error('导入文件读取失败'));
		reader.readAsBinaryString(file);
	});
}

function extractExportRows(response: RecruitPlanExportRow[] | unknown): RecruitPlanExportRow[] {
	if (Array.isArray(response)) {
		return response;
	}

	const payload = toRecord(response);
	if (Array.isArray(payload?.list)) {
		return payload.list as RecruitPlanExportRow[];
	}

	if (Array.isArray(payload?.data)) {
		return payload.data as RecruitPlanExportRow[];
	}

	return [];
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
	return typeof value === 'object' && value !== null
		? (value as Record<string, unknown>)
		: undefined;
}
</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.management-workspace.scss' as managementWorkspace;

.recruit-plan-page {
	@include managementWorkspace.management-workspace-shell(1240px);

	&__import-input {
		display: none;
	}
}
</style>
