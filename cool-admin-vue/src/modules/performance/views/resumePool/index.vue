<!-- 文件职责：承接主题15招聘简历池管理的列表、详情、新建、编辑、导入导出、附件上传下载与转换动作入口；不负责后端权限裁剪、主题8/12主链实现或附件文件空间治理；依赖 resumePool service、基础部门接口与既有权限组件；维护重点是 resumePool 资源命名、动作权限显隐和状态门禁必须与冻结口径一致。 -->
<template>
	<div v-if="canAccess" class="resumePool-page">
		<el-card shadow="never">
			<div class="resumePool-page__toolbar">
				<div class="resumePool-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="姓名/手机号/邮箱/岗位关键字"
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
						style="width: 180px"
					>
						<el-option
							v-for="item in sourceTypeOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="resumePool-page__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button
						v-if="showImportButton"
						type="warning"
						:loading="importLoading"
						@click="openImportSelector"
					>
						导入
					</el-button>
					<el-button
						v-if="showExportButton"
						type="success"
						:loading="exportLoading"
						@click="handleExport"
					>
						导出
					</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新建简历
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never">
			<template #header>
				<div class="resumePool-page__header">
					<div class="resumePool-page__header-main">
						<h2>招聘简历池管理</h2>
						<el-tag effect="plain">主题 15</el-tag>
					</div>
					<el-alert
						title="HR 与经理都可查看完整正文和联系方式；导出与附件下载仅 HR 可见。archived 禁止编辑/上传/转化/发起面试，interviewing 不再显示发起面试。"
						type="info"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="candidateName" label="候选人" min-width="130" />
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
				<el-table-column prop="phone" label="手机号" min-width="130" />
				<el-table-column prop="email" label="邮箱" min-width="180">
					<template #default="{ row }">
						{{ row.email || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="来源" min-width="220">
					<template #default="{ row }">
						<div class="resumePool-page__source-cell">
							<span>{{ sourceTypeLabel(row.sourceType) }}</span>
							<span v-if="resumeSourceSummary(row)" class="resumePool-page__source-meta">
								{{ resumeSourceSummary(row) }}
							</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column label="附件摘要" min-width="110">
					<template #default="{ row }">
						{{ row.attachmentSummaryList?.length || 0 }} 个
					</template>
				</el-table-column>
				<el-table-column prop="status" label="状态" width="120">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="380">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetail(row)">详情</el-button>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button
							v-if="canUploadAttachment(row)"
							text
							type="warning"
							@click="openAttachmentSelector(row)"
						>
							上传附件
						</el-button>
						<el-button
							v-if="canConvertToTalentAsset(row)"
							text
							type="success"
							:loading="actionLoadingId === row.id && actionLoadingType === 'convert'"
							@click="handleConvertToTalentAsset(row)"
						>
							转人才资产
						</el-button>
						<el-button
							v-if="canCreateInterview(row)"
							text
							type="primary"
							:loading="actionLoadingId === row.id && actionLoadingType === 'interview'"
							@click="handleCreateInterview(row)"
						>
							发起面试
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="resumePool-page__pagination">
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
			title="简历详情"
			width="980px"
			destroy-on-close
		>
			<div v-if="detailRecord" class="resumePool-page__detail">
				<el-alert
					v-if="detailRecord.status === 'archived'"
					title="当前记录已归档，前端已禁用编辑、附件上传、转人才资产和发起面试。"
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
						{{ detailRecord.targetDepartmentName || departmentLabel(detailRecord.targetDepartmentId) }}
					</el-descriptions-item>
					<el-descriptions-item label="目标岗位">
						{{ detailRecord.targetPosition || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="手机号">
						{{ detailRecord.phone }}
					</el-descriptions-item>
					<el-descriptions-item label="邮箱">
						{{ detailRecord.email || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="来源类型">
						{{ sourceTypeLabel(detailRecord.sourceType) }}
					</el-descriptions-item>
					<el-descriptions-item label="来源补充">
						{{ detailRecord.sourceRemark || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="来源招聘计划" :span="2">
						<div class="resumePool-page__source-summary">
							<span>{{ resumeRecruitPlanLabel(detailRecord) }}</span>
							<el-button
								v-if="detailRecord.recruitPlanId"
								text
								type="primary"
								@click="goToRecruitPlan(detailRecord)"
							>
								查看招聘计划
							</el-button>
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="来源职位标准" :span="2">
						<div class="resumePool-page__source-summary">
							<span>{{ resumeJobStandardLabel(detailRecord) }}</span>
							<el-button
								v-if="detailRecord.jobStandardId"
								text
								type="primary"
								@click="goToJobStandard(detailRecord)"
							>
								查看职位标准
							</el-button>
						</div>
					</el-descriptions-item>
					<el-descriptions-item label="外部链接" :span="2">
						<a
							v-if="detailRecord.externalLink"
							:href="detailRecord.externalLink"
							target="_blank"
							rel="noopener noreferrer"
						>
							{{ detailRecord.externalLink }}
						</a>
						<span v-else>-</span>
					</el-descriptions-item>
					<el-descriptions-item label="简历正文" :span="2">
						<div class="resumePool-page__resume-text">{{ detailRecord.resumeText }}</div>
					</el-descriptions-item>
					<el-descriptions-item label="人才资产 ID">
						{{ detailRecord.linkedTalentAssetId ?? '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="最近面试 ID">
						{{ detailRecord.latestInterviewId ?? '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="创建时间">
						{{ detailRecord.createTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="更新时间">
						{{ detailRecord.updateTime || '-' }}
					</el-descriptions-item>
				</el-descriptions>

				<el-divider content-position="left">附件摘要</el-divider>

				<el-empty
					v-if="!detailRecord.attachmentSummaryList?.length"
					description="暂无附件"
				/>

				<el-table
					v-else
					:data="detailRecord.attachmentSummaryList"
					border
					size="small"
					class="resumePool-page__attachment-table"
				>
					<el-table-column prop="name" label="文件名" min-width="260" show-overflow-tooltip />
					<el-table-column label="大小" width="120">
						<template #default="{ row }">
							{{ formatFileSize(row.size) }}
						</template>
					</el-table-column>
					<el-table-column prop="uploadTime" label="上传时间" min-width="170" />
					<el-table-column v-if="showDownloadAttachmentButton" label="操作" width="100">
						<template #default="{ row }">
							<el-button
								text
								type="primary"
								@click="handleDownloadAttachment(detailRecord, row)"
							>
								下载
							</el-button>
						</template>
					</el-table-column>
				</el-table>
			</div>

			<template #footer>
				<el-button @click="detailVisible = false">关闭</el-button>
			</template>
		</el-dialog>

		<el-dialog
			v-model="formVisible"
			:title="editingRecord?.id ? '编辑简历' : '新建简历'"
			width="980px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="editingRecord?.id ? 'archived 记录禁止编辑；interviewing 不可再次发起面试。' : '新建默认状态为 new。'"
					:type="editingRecord?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-alert
					v-if="resumeSourceSummary(form)"
					:title="`来源摘要：${resumeSourceSummary(form)}`"
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
								v-model="form.targetDepartmentId"
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
						<el-form-item label="目标岗位">
							<el-input
								v-model="form.targetPosition"
								maxlength="100"
								show-word-limit
								placeholder="可选"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="来源类型" prop="sourceType">
							<el-select v-model="form.sourceType" style="width: 100%">
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
						<el-form-item label="手机号" prop="phone">
							<el-input
								v-model="form.phone"
								maxlength="30"
								show-word-limit
								placeholder="请输入手机号"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="邮箱">
							<el-input
								v-model="form.email"
								maxlength="120"
								show-word-limit
								placeholder="可选"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="来源补充">
							<el-input
								v-model="form.sourceRemark"
								maxlength="200"
								show-word-limit
								placeholder="可选"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="外部链接">
							<el-input
								v-model="form.externalLink"
								:disabled="form.sourceType !== 'external'"
								maxlength="255"
								show-word-limit
								placeholder="仅 sourceType=external 可填写"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="状态">
							<el-select v-model="statusModel" style="width: 100%">
								<el-option
									v-for="item in statusOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="简历正文" prop="resumeText">
							<el-input
								v-model="form.resumeText"
								type="textarea"
								:rows="8"
								maxlength="10000"
								show-word-limit
								placeholder="请输入简历正文"
							/>
						</el-form-item>
					</el-col>
				</el-row>

				<div class="resumePool-page__form-attachments">
					<div class="resumePool-page__form-attachments-header">
						<span>附件摘要</span>
						<el-button
							v-if="canUploadAttachmentInForm"
							size="small"
							type="warning"
							@click="openAttachmentSelectorFromForm"
						>
							上传附件
						</el-button>
					</div>
					<el-empty
						v-if="!formAttachmentSummaryList.length"
						description="暂无附件"
					/>
					<el-table
						v-else
						:data="formAttachmentSummaryList"
						border
						size="small"
						class="resumePool-page__attachment-table"
					>
						<el-table-column prop="name" label="文件名" min-width="260" show-overflow-tooltip />
						<el-table-column label="大小" width="120">
							<template #default="{ row }">
								{{ formatFileSize(row.size) }}
							</template>
						</el-table-column>
						<el-table-column prop="uploadTime" label="上传时间" min-width="170" />
						<el-table-column v-if="showDownloadAttachmentButton && editingRecord?.id" label="操作" width="100">
							<template #default="{ row }">
								<el-button
									text
									type="primary"
									@click="handleDownloadAttachment(editingRecord!, row)"
								>
									下载
								</el-button>
							</template>
						</el-table-column>
					</el-table>
				</div>
			</el-form>

			<template #footer>
				<el-button @click="formVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitForm">
					保存
				</el-button>
			</template>
		</el-dialog>

		<cl-upload-space
			ref="importSpaceRef"
			:show-btn="false"
			:show-list="false"
			:multiple="false"
			accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
			@confirm="handleImportFileSelected"
		/>
		<cl-upload-space
			ref="attachmentSpaceRef"
			:show-btn="false"
			:show-list="false"
			:multiple="false"
			@confirm="handleAttachmentFileSelected"
		/>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-resumePool'
});

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { service } from '/@/cool';
import { exportJsonToExcel } from '/@/plugins/excel/utils';
import { useRoute, useRouter } from 'vue-router';
import { loadDepartmentOptions } from '../../utils/lookup-options.js';
import { performanceResumePoolService } from '../../service/resumePool';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';
import {
	type ResumePoolAttachmentSummary,
	type ResumePoolRecord,
	type ResumePoolSourceType,
	type ResumePoolStatus
} from '../../types';

interface DepartmentOption {
	id: number;
	label: string;
}

interface SpaceFileItem {
	id: number;
	name?: string;
	url?: string;
}

const rows = ref<ResumePoolRecord[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const tableLoading = ref(false);
const submitLoading = ref(false);
const importLoading = ref(false);
const exportLoading = ref(false);
const detailVisible = ref(false);
const formVisible = ref(false);
const detailRecord = ref<ResumePoolRecord | null>(null);
const editingRecord = ref<ResumePoolRecord | null>(null);
const formRef = ref<FormInstance>();
const importSpaceRef = ref<any>();
const attachmentSpaceRef = ref<any>();
const actionLoadingId = ref<number | null>(null);
const actionLoadingType = ref<'convert' | 'interview' | null>(null);
const pendingAttachmentResumeId = ref<number | null>(null);
const route = useRoute();
const router = useRouter();

const filters = reactive({
	keyword: '',
	targetDepartmentId: undefined as number | undefined,
	status: '' as ResumePoolStatus | '',
	sourceType: '' as ResumePoolSourceType | ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const form = reactive<ResumePoolRecord>(createDefaultResumePoolRecord());

const rules: FormRules = {
	candidateName: [
		{ required: true, message: '请输入候选人姓名', trigger: 'blur' },
		{ min: 1, max: 100, message: '候选人姓名长度需在 1-100 之间', trigger: 'blur' }
	],
	targetDepartmentId: [{ required: true, message: '请选择目标部门', trigger: 'change' }],
	phone: [
		{ required: true, message: '请输入手机号', trigger: 'blur' },
		{ min: 6, max: 30, message: '手机号长度需在 6-30 之间', trigger: 'blur' }
	],
	sourceType: [{ required: true, message: '请选择来源类型', trigger: 'change' }],
	resumeText: [{ required: true, message: '请输入简历正文', trigger: 'blur' }]
};

const statusOptions: Array<{ label: string; value: ResumePoolStatus }> = [
	{ label: '新建', value: 'new' },
	{ label: '筛选中', value: 'screening' },
	{ label: '面试中', value: 'interviewing' },
	{ label: '已归档', value: 'archived' }
];

const sourceTypeOptions: Array<{ label: string; value: ResumePoolSourceType }> = [
	{ label: '手工录入', value: 'manual' },
	{ label: '附件解析', value: 'attachment' },
	{ label: '外部来源', value: 'external' },
	{ label: '内推', value: 'referral' }
];

const canAccess = computed(() => checkPerm(performanceResumePoolService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceResumePoolService.permission.info));
const showAddButton = computed(() => checkPerm(performanceResumePoolService.permission.add));
const showImportButton = computed(() => checkPerm(performanceResumePoolService.permission.import));
const showExportButton = computed(() => checkPerm(performanceResumePoolService.permission.export));
const showDownloadAttachmentButton = computed(() =>
	checkPerm(performanceResumePoolService.permission.downloadAttachment)
);
const targetDepartmentIdModel = computed<number | undefined>({
	get: () => filters.targetDepartmentId,
	set: value => {
		filters.targetDepartmentId = value;
	}
});
const statusModel = computed<ResumePoolStatus>({
	get: () => form.status || 'new',
	set: value => {
		form.status = value;
	}
});
const formAttachmentSummaryList = computed<ResumePoolAttachmentSummary[]>(() => {
	return form.attachmentSummaryList || [];
});
const canUploadAttachmentInForm = computed(() => {
	if (!editingRecord.value?.id) {
		return false;
	}

	return canUploadAttachment(editingRecord.value);
});

onMounted(async () => {
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
		(error: any) => {
			ElMessage.warning(error.message || '部门选项加载失败');
		}
	);
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;

	try {
		const result = await performanceResumePoolService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			keyword: filters.keyword || undefined,
			targetDepartmentId: filters.targetDepartmentId || undefined,
			status: filters.status || undefined,
			sourceType: filters.sourceType || undefined
		});

		rows.value = (result.list || []).map(item => normalizeResumeRecord(item));
		pagination.total = result.pagination?.total || 0;
	} catch (error: any) {
		ElMessage.error(error.message || '简历列表加载失败');
	} finally {
		tableLoading.value = false;
	}
}

function handleSearch() {
	pagination.page = 1;
	refresh();
}

function handleReset() {
	filters.keyword = '';
	filters.targetDepartmentId = undefined;
	filters.status = '';
	filters.sourceType = '';
	pagination.page = 1;
	refresh();
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function openCreate() {
	openCreateWithPrefill();
}

async function openEdit(row: ResumePoolRecord) {
	if (row.status === 'archived') {
		ElMessage.warning('已归档简历不允许编辑');
		return;
	}

	await loadDetail(row.id!, record => {
		if (record.status === 'archived') {
			ElMessage.warning('已归档简历不允许编辑');
			return;
		}

		editingRecord.value = record;
		Object.assign(form, createDefaultResumePoolRecord(), {
			...record,
			targetDepartmentId: record.targetDepartmentId ?? undefined,
			targetPosition: record.targetPosition || '',
			email: record.email || '',
			sourceRemark: record.sourceRemark || '',
			externalLink: record.externalLink || '',
			attachmentIdList: record.attachmentIdList || [],
			attachmentSummaryList: record.attachmentSummaryList || [],
			status: record.status || 'new'
		});
		formVisible.value = true;

		nextTick(() => {
			formRef.value?.clearValidate();
		});
	});
}

async function openDetail(row: ResumePoolRecord) {
	await loadDetail(row.id!, record => {
		detailRecord.value = record;
		detailVisible.value = true;
	});
}

async function loadDetail(id: number, next: (record: ResumePoolRecord) => void) {
	try {
		const record = normalizeResumeRecord(
			await performanceResumePoolService.fetchInfo({ id })
		);
		next({
			...record,
			attachmentSummaryList: record.attachmentSummaryList || []
		});
	} catch (error: any) {
		ElMessage.error(error.message || '简历详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();

	if (editingRecord.value?.status === 'archived') {
		ElMessage.error('已归档简历不允许编辑');
		return;
	}

	submitLoading.value = true;

	try {
		const payload: Partial<ResumePoolRecord> = {
			candidateName: form.candidateName.trim(),
			targetDepartmentId: form.targetDepartmentId,
			targetPosition: normalizeOptionalText(form.targetPosition),
			phone: form.phone.trim(),
			email: normalizeOptionalText(form.email),
			resumeText: form.resumeText.trim(),
			sourceType: form.sourceType,
			sourceRemark: normalizeOptionalText(form.sourceRemark),
			recruitPlanId: form.recruitPlanId || undefined,
			jobStandardId: form.jobStandardId || undefined,
			sourceSnapshot: form.sourceSnapshot || undefined,
			externalLink:
				form.sourceType === 'external' ? normalizeOptionalText(form.externalLink) : undefined,
			attachmentIdList: form.attachmentIdList?.length ? form.attachmentIdList : undefined,
			status: form.status || 'new'
		};

		if (editingRecord.value?.id) {
			await performanceResumePoolService.updateResume({
				id: editingRecord.value.id,
				...payload
			});
		} else {
			await performanceResumePoolService.createResume(payload);
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

function openImportSelector() {
	importSpaceRef.value?.open({
		title: '选择导入文件',
		limit: 1,
		multiple: false
	});
}

async function handleImportFileSelected(list: SpaceFileItem[]) {
	const fileId = Number(list?.[0]?.id);

	if (!fileId) {
		ElMessage.warning('请选择有效导入文件');
		return;
	}

	importLoading.value = true;

	try {
		await performanceResumePoolService.importResume({ fileId });
		ElMessage.success('导入成功');
		pagination.page = 1;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '导入失败');
	} finally {
		importLoading.value = false;
	}
}

async function handleExport() {
	exportLoading.value = true;

	try {
		const response = await performanceResumePoolService.exportResume({
			keyword: filters.keyword || undefined,
			targetDepartmentId: filters.targetDepartmentId || undefined,
			status: filters.status || undefined,
			sourceType: filters.sourceType || undefined
		});

		if (Array.isArray(response)) {
			downloadExportAsExcel(response);
			return;
		}

		const list = Array.isArray(response?.list)
			? response.list
			: Array.isArray(response?.data)
				? response.data
				: null;

		if (list) {
			downloadExportAsExcel(list);
			return;
		}

		const downloadUrl = extractDownloadUrl(response);
		if (downloadUrl) {
			openUrl(downloadUrl);
			ElMessage.success('导出任务已触发');
			return;
		}

		ElMessage.success('导出请求已提交');
	} catch (error: any) {
		ElMessage.error(error.message || '导出失败');
	} finally {
		exportLoading.value = false;
	}
}

function downloadExportAsExcel(list: ResumePoolRecord[]) {
	exportJsonToExcel({
		header: [
			'候选人',
			'目标部门',
			'目标岗位',
			'手机号',
			'邮箱',
			'来源',
			'状态',
			'创建时间',
			'更新时间'
		],
		data: (list || []).map(item => [
			item.candidateName || '',
			item.targetDepartmentName || departmentLabel(item.targetDepartmentId),
			item.targetPosition || '',
			item.phone || '',
			item.email || '',
			sourceTypeLabel(item.sourceType),
			statusLabel(item.status),
			item.createTime || '',
			item.updateTime || ''
		]),
		filename: `简历池导出_${Date.now()}`,
		autoWidth: true
	});
	ElMessage.success('导出成功');
}

function openAttachmentSelector(row: ResumePoolRecord) {
	if (!canUploadAttachment(row)) {
		ElMessage.warning('当前记录不允许上传附件');
		return;
	}

	pendingAttachmentResumeId.value = row.id || null;
	attachmentSpaceRef.value?.open({
		title: `上传附件 - ${row.candidateName}`,
		limit: 1,
		multiple: false
	});
}

function openAttachmentSelectorFromForm() {
	if (!editingRecord.value) {
		return;
	}

	openAttachmentSelector(editingRecord.value);
}

async function handleAttachmentFileSelected(list: SpaceFileItem[]) {
	const resumeId = pendingAttachmentResumeId.value;
	const fileId = Number(list?.[0]?.id);
	pendingAttachmentResumeId.value = null;

	if (!resumeId) {
		return;
	}

	if (!fileId) {
		ElMessage.warning('请选择有效附件文件');
		return;
	}

	try {
		await performanceResumePoolService.uploadAttachment({
			id: resumeId,
			fileId
		});
		ElMessage.success('附件上传成功');
		await refresh();
		await refreshDialogRecord(resumeId);
	} catch (error: any) {
		ElMessage.error(error.message || '附件上传失败');
	}
}

async function handleDownloadAttachment(
	record: ResumePoolRecord,
	attachment: ResumePoolAttachmentSummary
) {
	if (!record.id || !attachment.id) {
		return;
	}

	try {
		const response = await performanceResumePoolService.downloadAttachment({
			id: record.id,
			attachmentId: attachment.id
		});
		const url = extractDownloadUrl(response);

		if (url) {
			openUrl(url);
			return;
		}

		ElMessage.success('下载请求已提交');
	} catch (error: any) {
		ElMessage.error(error.message || '附件下载失败');
	}
}

async function handleConvertToTalentAsset(row: ResumePoolRecord) {
	if (!row.id) {
		return;
	}

	await ElMessageBox.confirm(
		`确认将「${row.candidateName}」转为人才资产吗？`,
		'转人才资产确认',
		{
			type: 'warning'
		}
	);

	actionLoadingId.value = row.id;
	actionLoadingType.value = 'convert';

	try {
		await performanceResumePoolService.convertToTalentAsset({ id: row.id });
		ElMessage.success('已发起转人才资产');
		await refresh();
		await refreshDialogRecord(row.id);
	} catch (error: any) {
		ElMessage.error(error.message || '转人才资产失败');
	} finally {
		actionLoadingId.value = null;
		actionLoadingType.value = null;
	}
}

async function handleCreateInterview(row: ResumePoolRecord) {
	if (!row.id) {
		return;
	}

	await ElMessageBox.confirm(`确认前往面试页并为「${row.candidateName}」预置面试信息吗？`, '发起面试确认', {
		type: 'warning'
	});

	actionLoadingId.value = row.id;
	actionLoadingType.value = 'interview';

	try {
		await router.push({
			path: '/performance/interview',
			query: {
				openCreate: '1',
				resumePoolId: String(row.id),
				recruitPlanId: row.recruitPlanId ? String(row.recruitPlanId) : undefined,
				candidateName: row.candidateName || undefined,
				targetDepartmentId: row.targetDepartmentId ? String(row.targetDepartmentId) : undefined,
				targetPosition: row.targetPosition || undefined
			}
		});
	} catch (error: any) {
		ElMessage.error(error.message || '面试跳转失败');
	} finally {
		actionLoadingId.value = null;
		actionLoadingType.value = null;
	}
}

async function refreshDialogRecord(id: number) {
	if (detailVisible.value && detailRecord.value?.id === id) {
		await loadDetail(id, record => {
			detailRecord.value = record;
		});
	}

	if (formVisible.value && editingRecord.value?.id === id) {
		await loadDetail(id, record => {
			editingRecord.value = record;
			Object.assign(form, createDefaultResumePoolRecord(), {
				...record,
				targetDepartmentId: record.targetDepartmentId ?? undefined,
				targetPosition: record.targetPosition || '',
				email: record.email || '',
				sourceRemark: record.sourceRemark || '',
				externalLink: record.externalLink || '',
				attachmentIdList: record.attachmentIdList || [],
				attachmentSummaryList: record.attachmentSummaryList || [],
				status: record.status || 'new'
			});
		});
	}
}

function canEdit(row: ResumePoolRecord) {
	return checkPerm(performanceResumePoolService.permission.update) && row.status !== 'archived';
}

function canUploadAttachment(row: ResumePoolRecord) {
	return (
		checkPerm(performanceResumePoolService.permission.uploadAttachment) && row.status !== 'archived'
	);
}

function canConvertToTalentAsset(row: ResumePoolRecord) {
	return (
		checkPerm(performanceResumePoolService.permission.convertToTalentAsset) &&
		row.status !== 'archived'
	);
}

function canCreateInterview(row: ResumePoolRecord) {
	return (
		checkPerm(performanceResumePoolService.permission.createInterview) &&
		row.status !== 'archived' &&
		row.status !== 'interviewing'
	);
}

function statusLabel(status?: ResumePoolStatus | '') {
	const item = statusOptions.find(option => option.value === status);
	return item?.label || status || '-';
}

function statusTagType(status?: ResumePoolStatus | '') {
	switch (status) {
		case 'new':
			return 'info';
		case 'screening':
			return 'warning';
		case 'interviewing':
			return 'success';
		case 'archived':
			return undefined;
		default:
			return 'info';
	}
}

function sourceTypeLabel(sourceType?: ResumePoolSourceType | null) {
	const item = sourceTypeOptions.find(option => option.value === sourceType);
	return item?.label || sourceType || '-';
}

function departmentLabel(id?: number | null) {
	if (!id) {
		return '-';
	}

	return departmentOptions.value.find(item => item.id === Number(id))?.label || `部门${id}`;
}

function normalizeOptionalText(value: string | null | undefined) {
	const text = String(value || '').trim();
	return text || undefined;
}

async function consumeRoutePrefill() {
	await consumeRoutePreset({
		route,
		router,
		keys: [
			'openCreate',
			'targetDepartmentId',
			'targetPosition',
			'jobStandardId',
			'jobStandardPositionName',
			'jobStandardRequirementSummary',
			'recruitPlanId',
			'recruitPlanTitle',
			'recruitPlanStatus'
		],
		parse: query => ({
			shouldOpenCreate: firstQueryValue(query.openCreate) === '1',
			targetDepartmentId: normalizeQueryNumber(query.targetDepartmentId),
			targetPosition:
				normalizeQueryText(query.targetPosition) ||
				normalizeQueryText(query.jobStandardPositionName),
			jobStandardId: normalizeQueryNumber(query.jobStandardId),
			jobStandardPositionName: normalizeQueryText(query.jobStandardPositionName),
			jobStandardRequirementSummary: normalizeQueryText(query.jobStandardRequirementSummary),
			recruitPlanId: normalizeQueryNumber(query.recruitPlanId),
			recruitPlanTitle: normalizeQueryText(query.recruitPlanTitle),
			recruitPlanStatus: normalizeQueryText(query.recruitPlanStatus)
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
	targetDepartmentId?: number;
	targetPosition?: string;
	jobStandardId?: number;
	jobStandardPositionName?: string;
	jobStandardRequirementSummary?: string;
	recruitPlanId?: number;
	recruitPlanTitle?: string;
	recruitPlanStatus?: string;
}) {
	const sourceSummary = buildResumeSourceSummary(prefill);
	editingRecord.value = null;
	Object.assign(form, createDefaultResumePoolRecord(), {
		targetDepartmentId: prefill?.targetDepartmentId,
		targetPosition: prefill?.targetPosition || '',
		recruitPlanId: prefill?.recruitPlanId,
		recruitPlanTitle: prefill?.recruitPlanTitle || null,
		jobStandardId: prefill?.jobStandardId,
		jobStandardPositionName: prefill?.jobStandardPositionName || null,
		sourceRemark: sourceSummary,
		sourceSnapshot:
			prefill?.recruitPlanId || prefill?.jobStandardId
				? {
						sourceResource: prefill?.recruitPlanId ? 'recruitPlan' : 'jobStandard',
						recruitPlanId: prefill?.recruitPlanId || null,
						recruitPlanTitle: prefill?.recruitPlanTitle || null,
						recruitPlanStatus: normalizeRecruitPlanStatus(prefill?.recruitPlanStatus),
						jobStandardId: prefill?.jobStandardId || null,
						jobStandardPositionName:
							prefill?.jobStandardPositionName || prefill?.targetPosition || null,
						jobStandardRequirementSummary:
							prefill?.jobStandardRequirementSummary || null,
						targetDepartmentId: prefill?.targetDepartmentId || null,
						targetPosition:
							prefill?.targetPosition ||
							prefill?.jobStandardPositionName ||
							null
				  }
				: null
	});
	formVisible.value = true;

	nextTick(() => {
		formRef.value?.clearValidate();
	});
}

function normalizeResumeRecord(record: any): ResumePoolRecord {
	const sourceSnapshot =
		(record?.sourceSnapshot && typeof record.sourceSnapshot === 'object'
			? record.sourceSnapshot
			: record?.recruitPlanSnapshot && typeof record.recruitPlanSnapshot === 'object'
				? record.recruitPlanSnapshot
				: record?.jobStandardSnapshot && typeof record.jobStandardSnapshot === 'object'
					? record.jobStandardSnapshot
					: null) || null;

	return {
		...record,
		recruitPlanId: normalizeNumberOrUndefined(record?.recruitPlanId),
		jobStandardId: normalizeNumberOrUndefined(record?.jobStandardId),
		recruitPlanTitle:
			record?.recruitPlanTitle || sourceSnapshot?.recruitPlanTitle || null,
		jobStandardPositionName:
			record?.jobStandardPositionName ||
			sourceSnapshot?.jobStandardPositionName ||
			null,
		sourceSnapshot
	};
}

function resumeRecruitPlanLabel(record?: ResumePoolRecord | null) {
	if (!record?.recruitPlanId) {
		return '-';
	}

	return `${record.recruitPlanTitle || '招聘计划'} #${record.recruitPlanId}`;
}

function resumeJobStandardLabel(record?: ResumePoolRecord | null) {
	if (!record?.jobStandardId) {
		return '-';
	}

	return `${record.jobStandardPositionName || '职位标准'} #${record.jobStandardId}`;
}

function resumeSourceSummary(record?: ResumePoolRecord | null) {
	const parts = [resumeRecruitPlanLabel(record), resumeJobStandardLabel(record)].filter(
		item => item && item !== '-'
	);

	if (!parts.length && record?.sourceRemark) {
		return record.sourceRemark;
	}

	return parts.join('；');
}

async function goToRecruitPlan(record?: ResumePoolRecord | null) {
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

async function goToJobStandard(record?: ResumePoolRecord | null) {
	if (!record?.jobStandardId) {
		return;
	}

	await router.push({
		path: '/performance/job-standard',
		query: {
			openDetail: '1',
			jobStandardId: String(record.jobStandardId)
		}
	});
}

function normalizeQueryText(value: unknown) {
	const text = String(firstQueryValue(value) || '').trim();
	return text || undefined;
}

function normalizeNumberOrUndefined(value: unknown) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeRecruitPlanStatus(value: unknown) {
	return value === 'draft' || value === 'active' || value === 'voided' || value === 'closed'
		? value
		: null;
}

function buildResumeSourceSummary(prefill?: {
	jobStandardId?: number;
	jobStandardPositionName?: string;
	jobStandardRequirementSummary?: string;
	recruitPlanId?: number;
	recruitPlanTitle?: string;
	recruitPlanStatus?: string;
}) {
	const parts = [
		prefill?.recruitPlanId
			? `${prefill.recruitPlanTitle || '招聘计划'} #${prefill.recruitPlanId}${
					prefill.recruitPlanStatus ? `（${prefill.recruitPlanStatus}）` : ''
			  }`
			: '',
		prefill?.jobStandardId
			? `${prefill.jobStandardPositionName || '职位标准'} #${prefill.jobStandardId}`
			: '',
		prefill?.jobStandardRequirementSummary
			? `要求：${prefill.jobStandardRequirementSummary}`
			: ''
	].filter(Boolean);

	return parts.join('；');
}

function createDefaultResumePoolRecord(): ResumePoolRecord {
	return {
		candidateName: '',
		targetDepartmentId: undefined,
		targetPosition: '',
		phone: '',
		email: '',
		resumeText: '',
		sourceType: 'manual',
		sourceRemark: '',
		externalLink: '',
		recruitPlanId: undefined,
		recruitPlanTitle: '',
		jobStandardId: undefined,
		jobStandardPositionName: '',
		sourceSnapshot: null,
		recruitPlanSnapshot: null,
		jobStandardSnapshot: null,
		attachmentIdList: [],
		attachmentSummaryList: [],
		status: 'new'
	};
}

function extractDownloadUrl(response: any): string | undefined {
	if (!response) {
		return undefined;
	}

	if (typeof response === 'string') {
		return response;
	}

	if (typeof response.url === 'string') {
		return response.url;
	}

	if (typeof response.downloadUrl === 'string') {
		return response.downloadUrl;
	}

	if (typeof response.data === 'string') {
		return response.data;
	}

	if (typeof response.data?.url === 'string') {
		return response.data.url;
	}

	if (typeof response.data?.downloadUrl === 'string') {
		return response.data.downloadUrl;
	}

	return undefined;
}

function openUrl(url: string) {
	window.open(url, '_blank', 'noopener');
}

function formatFileSize(size?: number | null) {
	if (size == null || Number.isNaN(Number(size))) {
		return '-';
	}

	const value = Number(size);
	if (value < 1024) {
		return `${value} B`;
	}

	if (value < 1024 * 1024) {
		return `${(value / 1024).toFixed(2)} KB`;
	}

	if (value < 1024 * 1024 * 1024) {
		return `${(value / 1024 / 1024).toFixed(2)} MB`;
	}

	return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
</script>

<style scoped>
.resumePool-page {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.resumePool-page__toolbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
}

.resumePool-page__toolbar-left,
.resumePool-page__toolbar-right {
	display: flex;
	gap: 10px;
	align-items: center;
	flex-wrap: wrap;
}

.resumePool-page__header {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.resumePool-page__header-main {
	display: flex;
	align-items: center;
	gap: 10px;
}

.resumePool-page__header-main h2 {
	margin: 0;
	font-size: 20px;
}

.resumePool-page__pagination {
	margin-top: 12px;
	display: flex;
	justify-content: flex-end;
}

.resumePool-page__detail {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.resumePool-page__resume-text {
	white-space: pre-wrap;
	line-height: 1.6;
}

.resumePool-page__source-summary {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

.resumePool-page__source-cell {
	display: grid;
	gap: 4px;
}

.resumePool-page__source-meta {
	font-size: 12px;
	line-height: 1.5;
	color: var(--el-text-color-secondary);
}

.resumePool-page__attachment-table {
	margin-top: 8px;
}

.resumePool-page__form-attachments {
	margin-top: 8px;
	padding: 10px 12px;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 6px;
}

.resumePool-page__form-attachments-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 10px;
	font-weight: 500;
}
</style>
